// Farfetch Pricing Scraper - Production-ready with Next.js data extraction
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { Actor, log } from 'apify';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
    startUrl = 'https://www.farfetch.com/uk/shopping/women/jewellery-1/items.aspx',
    category,
    minPrice,
    maxPrice,
    sortBy = 'default',
    results_wanted: RESULTS_WANTED_RAW = 20,
    proxyConfiguration: proxyConfig,
} = input;

const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : 20;

// Build URL with filters if startUrl doesn't have them
const buildUrl = (baseUrl, page = 1) => {
    const url = new URL(baseUrl);
    
    // Add filters if provided and not already in URL
    if (minPrice && !url.searchParams.has('minPrice')) {
        url.searchParams.set('minPrice', String(minPrice));
    }
    if (maxPrice && !url.searchParams.has('maxPrice')) {
        url.searchParams.set('maxPrice', String(maxPrice));
    }
    if (sortBy && sortBy !== 'default' && !url.searchParams.has('sort')) {
        const sortMap = {
            'price_asc': 'price-asc',
            'price_desc': 'price-desc',
            'new': 'new-in',
        };
        url.searchParams.set('sort', sortMap[sortBy] || sortBy);
    }
    if (page > 1) {
        url.searchParams.set('page', String(page));
    }
    
    return url.href;
};

const initialUrl = buildUrl(startUrl, 1);

log.info(`Starting Farfetch scraper, results wanted: ${RESULTS_WANTED}`);
log.info(`Start URL: ${initialUrl}`);

// Normalize image URL
const normalizeImageUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.startsWith('//') ? `https:${url}` : url;
    return cleanUrl.split('?')[0];
};

// Parse price from Farfetch format
const parsePrice = (priceObj) => {
    if (!priceObj) return null;
    if (typeof priceObj === 'object') {
        return priceObj.formattedValue || priceObj.priceFormatted || null;
    }
    return String(priceObj);
};

// Create proxy configuration
const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfig || {
    useApifyProxy: true,
    apifyProxyGroups: ['RESIDENTIAL'],
});

let saved = 0;
const seenIds = new Set();

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    maxRequestRetries: 3,
    useSessionPool: true,
    sessionPoolOptions: {
        maxPoolSize: 3,
        sessionOptions: { maxUsageCount: 5 },
    },
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 90,
    navigationTimeoutSecs: 45,
    browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
            fingerprintGeneratorOptions: {
                browsers: ['firefox'],
                operatingSystems: ['windows'],
                devices: ['desktop'],
            },
        },
    },
    preNavigationHooks: [
        async ({ page }) => {
            // Block only heavy analytics and tracking
            await page.route('**/*', (route) => {
                const url = route.request().url();

                if (url.includes('google-analytics') ||
                    url.includes('googletagmanager') ||
                    url.includes('hotjar') ||
                    url.includes('facebook') ||
                    url.includes('doubleclick') ||
                    url.includes('tiktok') ||
                    url.includes('analytics')) {
                    return route.abort();
                }
                return route.continue();
            });

            // Stealth
            await page.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            });
        },
    ],
    async requestHandler({ page, request, crawler: crawlerInstance }) {
        log.info(`Processing page: ${request.url}`);

        // Wait for page to load - domcontentloaded is enough
        await page.waitForLoadState('domcontentloaded');
        
        // Quick initial wait for JS to execute
        await page.waitForTimeout(1500);

        // Retry loop - wait for universal_variable to be populated
        let retries = 0;
        const maxRetries = 8;
        let extractedProducts = [];

        while (retries < maxRetries && extractedProducts.length === 0) {
            await page.waitForTimeout(500);
            retries++;

            // Extract products from window.universal_variable
            const result = await page.evaluate(() => {
                try {
                    const uv = window.universal_variable;
                    
                    if (!uv?.listing?.items) {
                        return { error: 'Universal variable listing items not found', products: [], retry: true };
                    }

                    const items = uv.listing.items;
                    
                    if (!Array.isArray(items) || items.length === 0) {
                        return { error: 'No items in listing', products: [], retry: true };
                    }

                    return {
                        products: items.map((p) => {
                            const price = p.unitPrice;
                            const salePrice = p.unitSalePrice;
                            const isOnSale = salePrice && salePrice < price;

                            return {
                                product_id: String(p.id),
                                brand: p.designerName,
                                title: p.name,
                                price: salePrice || price,
                                original_price: price,
                                currency: p.currencyCode,
                                discount: isOnSale ? Math.round(((price - salePrice) / price) * 100) + '%' : '',
                                product_url: p.url ? (p.url.startsWith('http') ? p.url : `https://www.farfetch.com${p.url}`) : '',
                                image_url: p.imageUrl,
                                stock_level: p.stock,
                                in_stock: p.hasStock,
                                designer_id: p.designerId,
                            };
                        }),
                    };
                } catch (err) {
                    return { error: err.message, products: [], retry: false };
                }
            });

            if (result.error) {
                log.debug(`Attempt ${retries}/${maxRetries}: ${result.error}`);
            }

            if (result.products && result.products.length > 0) {
                extractedProducts = result.products;
                break;
            }

            if (!result.retry) break;
        }

        if (extractedProducts.length === 0) {
            log.warning(`No products extracted from ${request.url}`);
            return;
        }

        log.info(`Extracted ${extractedProducts.length} products from page`);

        // Process and save products
        for (const product of extractedProducts) {
            if (saved >= RESULTS_WANTED) {
                log.info(`Reached target of ${RESULTS_WANTED} results`);
                await crawlerInstance.autoscaledPool?.abort();
                break;
            }

            const productId = product.product_id;
            if (seenIds.has(productId)) continue;
            seenIds.add(productId);

            // Normalize and validate
            const cleanProduct = {
                ...product,
                image_url: normalizeImageUrl(product.image_url),
                scraped_at: new Date().toISOString(),
            };

            await Dataset.pushData(cleanProduct);
            saved++;
            log.debug(`Saved product ${saved}/${RESULTS_WANTED}: ${cleanProduct.brand} - ${cleanProduct.title}`);
        }

        // Check if we need more results and pagination exists
        if (saved < RESULTS_WANTED) {
            // Try to find pagination in the page
            const hasNextPage = await page.evaluate(() => {
                const uv = window.universal_variable;
                 // If we have items on this page, and usually typical page size is 90+, 
                 // we can assume there are more pages unless we check total count which might be complex to find blindly.
                 // A safe heuristic for infinite scroll / pagination:
                 // If listing.items is not empty, there might be more.
                 return uv?.listing?.items?.length > 0;
            });

            if (hasNextPage) {
                const currentPage = parseInt(new URL(request.url).searchParams.get('page') || '1');
                const nextPage = currentPage + 1;
                const nextUrl = buildUrl(startUrl, nextPage);

                await crawlerInstance.addRequests([{
                    url: nextUrl,
                    userData: { pageNo: nextPage },
                }]);
                log.info(`Queued page ${nextPage}`);
            } else {
                log.info('No more pages available');
            }
        }
    },

    failedRequestHandler({ request }, error) {
        log.error(`Request failed after retries: ${request.url}`);
        log.error(error.message);
    },
});

await crawler.run([{ url: initialUrl, userData: { pageNo: 1 } }]);

log.info(`Scraping completed. Total products saved: ${saved}`);
await Actor.exit();
