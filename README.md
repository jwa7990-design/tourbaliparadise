# Bali Paradise website

A four-page static website (Home, Explore Bali, Our Services, About Us) for Bali Paradise, Aris's private driver service.

- **Languages:** English, Simplified Chinese, Russian and Indonesian.
- **Currency:** prices are entered in IDR and shown with live approximate conversions.
- **Enquiries:** every enquiry goes to Aris on WhatsApp.
- **Build:** plain HTML, CSS and JavaScript modules, with no framework, no build step and no npm dependencies.

## Run locally

```bash
cd "Bali Paradise"
python3 -m http.server 8080
```

Then open http://localhost:8080. A local server is needed because opening the files directly won't load the translations.

## Where to edit things

| What | File |
|---|---|
| WhatsApp number, phone, email, domain | `assets/js/config.js` → `BUSINESS` |
| **Prices (IDR only)** | `assets/js/config.js` → `PRICING` (`null` = "Price to be confirmed") |
| **Airport transfer price per area (IDR)** | `assets/js/config.js` → `AIRPORT_ZONES` (the "From" price is the lowest area) |
| What's included (fuel, parking, tolls…) | `assets/js/config.js` → `INCLUSIONS` |
| Aris's photo, bio, languages, vehicle… | `assets/js/config.js` → `DRIVER` |
| "What you can expect" promises | `assets/js/config.js` → `COMMITMENTS` (only `confirmed: true` items show) |
| Genuine reviews | `assets/js/config.js` → `REVIEWS` |
| Analytics IDs | `assets/js/config.js` → `ANALYTICS` |
| Text in each language | `locales/en.json`, `locales/zh-CN.json`, `locales/ru.json`, `locales/id.json` |
| Page layout / English page text | `index.html`, `explore.html`, `services.html`, `about.html` |
| Styles | `assets/css/styles.css` |

### Changing English page text
Edit the English text in the HTML, then run:

```bash
node scripts/i18n.mjs extract
```

```bash
node scripts/i18n.mjs check
```

The first copies the English into `en.json`. The second lists any keys still missing from the Chinese, Russian and Indonesian files.

## How it works

- **Language:** the selector in the header (EN | 中文 | RU | ID) translates the whole page instantly. That covers text, page titles, meta descriptions, image alt text, form messages and WhatsApp messages.
  - The choice is saved in `localStorage` and added to the URL as `?lang=zh-CN`, `?lang=ru` or `?lang=id`, so shared links open in the right language.
  - Visitors whose browser is set to Chinese, Russian or Indonesian get a small suggestion to switch. The site never redirects automatically.
- **Currency:** this is independent of language. On first visit the browser locale suggests a currency (e.g. en-AU → AUD); it changes whenever the visitor picks another.
  - Rates come from ExchangeRate-API (free, no key) and are cached in the browser for 12 hours.
  - If the rate service fails, the site uses the last good rates (up to 7 days old). With none available, it shows IDR only, never a zero or invalid amount.
  - IDR is always shown as the main price, with conversions marked "≈".
- **WhatsApp:** every button opens `wa.me/6285850019078` with a message written for that context and in the visitor's language.
  - The enquiry form validates the fields and then opens WhatsApp with all the details filled in.
  - Nothing is booked automatically. The site says clearly that Aris confirms availability and price personally.

## Click tracking & analytics

`assets/js/track.js` tracks every call-to-action on every page through one listener. Events are pushed to `window.dataLayer`, so they work with Google Tag Manager or GA4.

| Event | When |
|---|---|
| `airport_zone_select` | Visitor checked the airport transfer price for an area |
| `whatsapp_click` | Any WhatsApp button or link. **Key conversion.** Includes `wa_context` (airport, driver, food…), `cta_label`, `section`, page, language, currency |
| `generate_lead` | Enquiry form submitted and WhatsApp opened. **Key conversion.** Includes service and passengers |
| `form_error` | Form failed validation (which fields) |
| `cta_click` | Internal buttons and links (e.g. "Explore Bali", "Learn more") |
| `nav_click` | Header, mobile menu and footer navigation |
| `faq_open` | Which FAQ was opened |
| `language_change` / `currency_change` | Switches, with from/to |
| `scroll_depth` | 25 / 50 / 75 / 100 % |

Every button carries a readable `data-track-label` (e.g. `home_hero_whatsapp`, `services_airport_whatsapp`), so you can see exactly which button drives enquiries.

**To turn analytics on,** set one or more of these in `config.js → ANALYTICS`:
- `ga4MeasurementId`: GA4. In GA4, mark `whatsapp_click` and `generate_lead` as **key events**.
- `gtmContainerId`: Google Tag Manager.
- `cloudflareBeaconToken`: Cloudflare Web Analytics. It's cookieless and counts page views only.
- `plausibleDomain`: Plausible. It's cookieless and supports custom events.

Nothing third-party loads until an ID is set. Set `debug: true` to log every event in the browser console. GA4 and GTM use cookies, so if you target EU/UK visitors, add a consent banner. Plausible or Cloudflare avoid that.

## SEO

- Unique, keyword-focused title and meta description for each page and each language, swapped in when the language changes.
- Open Graph and Twitter card tags with a 1200×630 image per page.
- One `<h1>` per page and descriptive alt text on every image, translated too.
- JSON-LD structured data, using only real, confirmed details (no ratings, no address, no prices):
  - `LocalBusiness` + `WebSite` (home)
  - `Service` ×4 (services)
  - `FAQPage` (about)
  - `BreadcrumbList` + `ItemList`
- `robots.txt`, `sitemap.xml`, canonical and `hreflang` are generated once the domain is known:

```bash
node scripts/set-domain.mjs https://www.yourdomain.com
```

This writes canonical, hreflang (en / zh-Hans / ru / id / x-default), og:url and absolute structured-data URLs into all four pages. It also generates `sitemap.xml` (16 URLs with hreflang) and updates `robots.txt`. It's safe to re-run.

## Deploying to Cloudflare Pages (when ready)

1. Put this folder in a GitHub repository, or use `wrangler pages deploy .` directly.
2. In Cloudflare Pages, create a project with **no build command** and **output directory `/`**.
3. Add your custom domain, then run `node scripts/set-domain.mjs https://your-domain` and redeploy.
4. Submit `https://your-domain/sitemap.xml` in Google Search Console, plus Bing Webmaster Tools and Yandex Webmaster for Russian visitors.

The `_headers` file adds caching and security headers on Cloudflare. Cloudflare serves `explore.html` at `/explore`, which matches the canonical URLs.
