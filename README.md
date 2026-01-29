# Farfetch Pricing Scraper

Extract luxury fashion product data from Farfetch with precision. Collect comprehensive pricing information, brand details, discounts, and merchant data from the world's leading luxury marketplace. Perfect for fashion research, price monitoring, and luxury market analysis.

## Features

- **Brand Intelligence** — Extract designer brand names and collections
- **Comprehensive Pricing** — Current prices, original prices, and discount information
- **Merchant Data** — Seller information and marketplace details
- **Product Categories** — Fashion categories and subcategories
- **Color & Size Options** — Available variations and sizing
- **Sale Detection** — Identify discounted and on-sale items
- **High Volume Collection** — Scale from dozens to thousands of luxury products

## Use Cases

### Luxury Fashion Research
Analyze designer pricing trends and brand positioning across categories. Understand luxury market dynamics and consumer preferences in high-end fashion.

### Price Intelligence
Monitor luxury brand pricing strategies and discount patterns. Track seasonal sales, flash sales, and promotional pricing across designer collections.

### Competitive Analysis
Benchmark luxury brands against competitors. Compare pricing, availability, and product offerings across the luxury fashion landscape.

### Market Trend Analysis
Identify emerging fashion trends and popular designer items. Track which luxury brands and styles are gaining traction in the marketplace.

### Inventory Management
Monitor product availability and stock levels for luxury items. Track when new collections launch and existing items go out of stock.

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startUrl` | String | Yes | — | Farfetch category or search URL to scrape |
| `category` | String | No | — | Product category filter |
| `minPrice` | Number | No | — | Minimum price filter |
| `maxPrice` | Number | No | — | Maximum price filter |
| `sortBy` | String | No | `"default"` | Sort order: `default`, `price_asc`, `price_desc`, `new` |
| `results_wanted` | Integer | No | `20` | Maximum number of products to collect |
| `proxyConfiguration` | Object | No | Residential | Proxy settings for reliable scraping |

---

## Output Data

Each item in the dataset contains:

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | String | Unique Farfetch product identifier |
| `brand` | String | Designer brand name |
| `title` | String | Product title and description |
| `price` | String | Current sale price with currency |
| `original_price` | String | Original retail price before discount |
| `discount` | String | Discount amount or percentage |
| `currency` | String | Currency code (GBP, USD, EUR, etc.) |
| `product_url` | String | Direct link to product detail page |
| `image_url` | String | Main product image URL |
| `merchant` | String | Seller or merchant name |
| `category` | String | Product category |
| `colors` | String | Available color options |
| `sizes` | String | Available size options |
| `isOnSale` | Boolean | Whether the item is currently discounted |
| `scraped_at` | String | Timestamp of data collection |

---

## Usage Examples

### Basic Category Scraping

Extract products from a Farfetch category page:

```json
{
    "startUrl": "https://www.farfetch.com/uk/shopping/women/jewellery-1/items.aspx",
    "results_wanted": 50
}
```

### Price Range Analysis

Find luxury items within a specific price range:

```json
{
    "startUrl": "https://www.farfetch.com/uk/shopping/women/bags-1/items.aspx",
    "minPrice": 500,
    "maxPrice": 2000,
    "results_wanted": 100
}
```

### Designer Collection Monitoring

Track specific designer collections:

```json
{
    "startUrl": "https://www.farfetch.com/uk/shopping/designer-gucci/bags-women-1/items.aspx",
    "sortBy": "new",
    "results_wanted": 200
}
```

### Sale Item Discovery

Find discounted luxury products:

```json
{
    "startUrl": "https://www.farfetch.com/uk/shopping/women/items.aspx",
    "sortBy": "price_asc",
    "results_wanted": 150
}
```

---

## Sample Output

```json
{
    "product_id": "12345678",
    "brand": "Gucci",
    "title": "GG Marmont Matelassé Mini Bag",
    "price": "£1,890",
    "original_price": "£2,100",
    "discount": "10% off",
    "currency": "GBP",
    "product_url": "https://www.farfetch.com/uk/shopping/item-12345678.aspx",
    "image_url": "https://cdn-images.farfetch-contents.com/image.jpg",
    "merchant": "Farfetch",
    "category": "Bags",
    "colors": "Black, Red, Beige",
    "sizes": "One Size",
    "isOnSale": true,
    "scraped_at": "2024-01-29T10:30:00.000Z"
}
```

---

## Tips for Best Results

### Choose Popular Categories
- Start with high-traffic categories like bags, shoes, or jewelry
- Use specific designer brand URLs for focused collections
- Test with smaller result sets first (20-50 items)

### Optimize Price Filters
- Set realistic price ranges for luxury items (£100-£5000+)
- Use price sorting to find budget or premium options
- Combine price filters with category URLs for precision

### Maximize Data Quality
- Use residential proxies for consistent access
- Schedule runs during off-peak hours for better performance
- Monitor for new collection launches and seasonal sales

### Proxy Configuration

For reliable results with luxury fashion sites, residential proxies are recommended:

```json
{
    "proxyConfiguration": {
        "useApifyProxy": true,
        "apifyProxyGroups": ["RESIDENTIAL"]
    }
}
```

---

## Integrations

Connect your luxury fashion data with:

- **Google Sheets** — Export for pricing analysis and reporting
- **Airtable** — Build luxury product databases and catalogs
- **Slack** — Get notifications for new designer arrivals
- **Zapier** — Automate workflows for price monitoring
- **Make** — Create automated fashion trend pipelines
- **Webhooks** — Send data to custom fashion analytics platforms

### Export Formats

Download your data in multiple formats:

- **JSON** — For developers and fashion APIs
- **CSV** — For spreadsheet analysis and Excel
- **Excel** — For luxury brand reporting and presentations
- **XML** — For fashion system integrations

---

## Frequently Asked Questions

### How many luxury products can I collect?
You can collect thousands of products per run. The practical limit depends on category size and available inventory (typically up to 100+ pages per category).

### Can I scrape specific designer brands?
Yes, use brand-specific URLs like `/designer-gucci/` or `/designer-louis-vuitton/` in your start URL for focused brand collections.

### How often should I update pricing data?
For luxury fashion, weekly or bi-weekly updates are recommended due to frequent price changes, seasonal sales, and new arrivals.

### What if some products don't show discounts?
Not all luxury items are discounted. The scraper captures all available pricing information, including original prices when discounts aren't applied.

### Can I monitor multiple categories?
Yes, run separate scraper instances for different categories or use broader category URLs to collect across multiple fashion segments.

### How do I track seasonal sales?
Use the `isOnSale` field and monitor `discount` values. Schedule regular runs during sale seasons (end-of-season sales, holiday promotions).

---

## Support

For issues or feature requests, contact support through the Apify Console.

### Resources

- [Apify Documentation](https://docs.apify.com/)
- [API Reference](https://docs.apify.com/api/v2)
- [Scheduling Runs](https://docs.apify.com/schedules)

---

## Legal Notice

This actor is designed for legitimate data collection purposes. Users are responsible for ensuring compliance with website terms of service and applicable laws. Use data responsibly and respect rate limits.
