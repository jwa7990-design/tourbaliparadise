/* =============================================================
   BALI PARADISE — SITE CONFIGURATION
   This is the one file to edit for business details, prices,
   driver information and photography.
   ============================================================= */

/* ---------- Business & WhatsApp ---------- */
export const BUSINESS = {
  name: 'Bali Paradise',
  driverName: 'Aris',
  // WhatsApp in international format, digits only (no +, no spaces).
  whatsappNumber: '6285850019078',
  // How the number is shown to people.
  phoneDisplay: '+62 858 5001 9078',
  serviceArea: 'Bali, Indonesia',
  // Set once a domain is live, e.g. 'https://www.baliparadise.com'
  // (used for canonical URLs). Leave empty until then.
  siteUrl: 'https://tourbaliparadise.com',
  // Optional business email — leave null until confirmed.
  email: null,
};

/* ---------- Pricing (ALL PRICES IN IDR) ----------
   Enter whole Rupiah amounts, e.g. 600000.
   null = not yet confirmed → the site shows a clear placeholder.
   Do not enter estimates here: these are shown publicly.          */
export const PRICING = {
  airport_transfer: { price_idr: null, from: true },
  half_day_driver:  { price_idr: 650000, from: true },   // up to 5 hours
  full_day_driver:  { price_idr: 900000, from: true },   // up to 10 hours
  custom_day_trip:  { price_idr: null, quoteOnRequest: true },
  scooter_tour:     { price_idr: 500000, from: true },   // half day, 1 guest
  // Experience Bali as a Local (per booking, 1–2 guests). Solo Traveller
  // Companion uses scooter_tour above, so both pages always show one price.
  exp_local_eyes:   { price_idr: 1600000, from: true },
};

/* Airport transfer prices by area (IDR, one price per area).
   Visitors pick where they're staying and see that area's price.
   The "From" price on the pricing card is the lowest area price set.
   e.g. Ubud ≈ A$60 → enter the Rupiah amount, such as 740000.
   null = "Price to be confirmed". 'other' is always quoted.
   To add an area: add a line here AND a "zones.<key>" name in each locales/*.json. */
export const AIRPORT_ZONES = [
  { key: 'kuta',     price_idr: 300000 },  // Kuta / Legian
  { key: 'seminyak', price_idr: 350000 },
  { key: 'canggu',   price_idr: 400000 },
  { key: 'jimbaran', price_idr: 300000 },
  { key: 'nusa_dua', price_idr: 300000 },  // Nusa Dua / Tanjung Benoa
  { key: 'uluwatu',  price_idr: 400000 },  // Uluwatu / Bukit Peninsula
  { key: 'sanur',    price_idr: 300000 },
  { key: 'denpasar', price_idr: 300000 },
  { key: 'ubud',     price_idr: 500000 },
  { key: 'amed',     price_idr: 850000 },  // East Bali
  { key: 'lovina',   price_idr: 900000 },  // North Bali
  { key: 'other',    price_idr: null, quoteOnRequest: true },
];

/* What is / isn't included. Each value is one of:
   'included' | 'not_included' | null (not yet confirmed)
   or a short custom note object: { en: '...', 'zh-CN': '...', ru: '...', id: '...' } */
export const INCLUSIONS = {
  fuel: 'included',
  parking: 'included',
  tolls: 'included',
  driverHours: { en: 'Half day up to 5 hours, full day up to 10 hours', 'zh-CN': '半日最长 5 小时，全日最长 10 小时', ru: 'Полдня — до 5 часов, полный день — до 10 часов', id: 'Setengah hari maks. 5 jam, sehari penuh maks. 10 jam' },
  waitingTime: { en: 'Included within your hire hours', 'zh-CN': '包含在包车时长内', ru: 'Входит в часы аренды', id: 'Sudah termasuk dalam jam sewa' },
  capacity: { en: 'Up to 4 or 6 passengers, depending on the car arranged', 'zh-CN': '最多 4 人或 6 人，视安排的车型而定', ru: 'До 4 или 6 пассажиров, в зависимости от автомобиля', id: 'Hingga 4 atau 6 penumpang, tergantung mobil yang disiapkan' },
  extraHours: { en: "Rp 100,000 per extra hour", 'zh-CN': "超时每小时 Rp 100,000", ru: "Rp 100 000 за каждый дополнительный час", id: "Rp 100.000 per jam tambahan" },
  farTrips: { en: "+ Rp 200,000 for Amed, Lovina, Munduk and other far areas", 'zh-CN': "前往艾湄湾、罗威纳、蒙杜克等远程地区加收 Rp 200,000", ru: "+ Rp 200 000 за поездки в Амед, Ловину, Мундук и другие дальние районы", id: "+ Rp 200.000 untuk Amed, Lovina, Munduk, dan area jauh lainnya" },
  attractionTickets: 'not_included',
  meals: 'not_included',
};

/* ---------- Currencies ----------
   IDR is the canonical business currency. Others are converted. */
export const CURRENCIES = {
  IDR: { label: 'IDR Rp', decimals: 0 },
  AUD: { label: 'AUD $',  decimals: 0 },
  USD: { label: 'USD $',  decimals: 0 },
  EUR: { label: 'EUR €',  decimals: 0 },
  GBP: { label: 'GBP £',  decimals: 0 },
  CNY: { label: 'CNY ¥',  decimals: 0 },
  RUB: { label: 'RUB ₽',  decimals: 0 },
};
export const DEFAULT_CURRENCY = 'USD';

export const EXCHANGE = {
  // Free, no-key endpoint. Rates update daily. Attribution required.
  url: 'https://open.er-api.com/v6/latest/IDR',
  attributionUrl: 'https://www.exchangerate-api.com',
  cacheHours: 12,          // refresh at most every 12 hours per visitor
  maxStaleDays: 7,         // never show conversions from older rates than this
};

/* ---------- Languages ---------- */
export const LANGUAGES = {
  en:      { label: 'EN',  name: 'English',  htmlLang: 'en',      file: 'en.json' },
  'zh-CN': { label: '中文', name: '简体中文', htmlLang: 'zh-Hans', file: 'zh-CN.json' },
  ru:      { label: 'RU',  name: 'Русский',  htmlLang: 'ru',      file: 'ru.json' },
  id:      { label: 'ID',  name: 'Bahasa Indonesia', htmlLang: 'id', file: 'id.json' },
};
export const DEFAULT_LANGUAGE = 'en';

/* ---------- Driver information ----------
   Everything here is shown on the About page. null = placeholder.
   Text fields can be a plain string (shown in every language) or
   { en: '...', 'zh-CN': '...', ru: '...' }.
   NEVER fill these with guesses — only details Aris has confirmed. */
export const DRIVER = {
  photo: null,              // e.g. 'assets/images/aris.jpg' (a real photo of Aris)
  photoAlt: 'Aris, the driver behind Bali Paradise',
  introduction: null,
  drivingExperience: { en: 'Over 5 years driving visitors around Bali', 'zh-CN': '为游客开车超过 5 年', ru: 'Более 5 лет возит гостей по Бали', id: 'Lebih dari 5 tahun mengantar wisatawan keliling Bali' },
  languages: { en: 'English and Balinese', 'zh-CN': '英语、巴厘语', ru: 'английский и балийский', id: 'Bahasa Inggris dan Bahasa Bali' },
  // Aris hires a car to suit each group (he doesn't own one) and has his own scooter.
  vehicle: { en: 'A 4-seat or 6-seat car, hired to suit your group. A scooter for 1:1 tours.', 'zh-CN': '根据人数租用 4 座或 6 座汽车；一对一游使用摩托车。', ru: 'Арендованный автомобиль на 4 или 6 мест — под размер группы. Для туров 1:1 — скутер.', id: 'Mobil 4 atau 6 kursi yang disewa sesuai jumlah rombongan. Skuter untuk tur 1:1.' },
  passengerCapacity: { en: 'Up to 4 or 6 by car, 1 guest by scooter', 'zh-CN': '汽车最多 4 或 6 人，摩托车 1 人', ru: 'До 4 или 6 человек на машине, 1 гость на скутере', id: 'Hingga 4 atau 6 orang dengan mobil, 1 tamu dengan skuter' },
  serviceAreas: { en: 'All of Bali', 'zh-CN': '巴厘岛全岛', ru: 'Весь Бали', id: 'Seluruh Bali' },
  enjoysShowing: null,
};

/* Commitments shown under "What you can expect".
   Only set confirmed: true for promises Aris has agreed to. */
export const COMMITMENTS = [
  { key: 'direct',       icon: 'chat',     confirmed: true },
  { key: 'pricing',      icon: 'tag',      confirmed: true },
  { key: 'flexible',     icon: 'calendar', confirmed: true },
  { key: 'honest',       icon: 'compass',  confirmed: true },
  { key: 'confirmation', icon: 'check',    confirmed: true },
  { key: 'noShopping',   icon: 'bag',      confirmed: true },  // confirmed 2026-11-17
  { key: 'givesBack',    icon: 'heart',    confirmed: false }, // paused 2026-11-18: giving back removed for now
];

/* Giving back: a set amount from every job goes to one local Bali cause.
   Donations themselves are logged in assets/data/giving-log.json
   (see GIVING-LOG.md); the site adds up the total automatically.
   Only name a cause once the charity has agreed to be mentioned.      */
export const GIVING = {
  perTransferIdr: 10000,   // every airport transfer
  perTripIdr: 25000,       // every half/full-day hire or scooter tour
  cause: null,             // e.g. { name: 'Sungai Watch', url: 'https://sungaiwatch.com' }
};

/* Genuine reviews only, copied word for word, first names only.
   Each review is linked to the service the guest booked, so it shows on
   that service on the Services page and links back to it elsewhere.
   {
     name: 'Emma',               // first name only
     country: 'Australia',       // optional
     date: '2026-11',            // year-month of the trip or review
     service: 'airport',         // 'airport' | 'driver' | 'custom' | 'scooter'
     rating: 5,                  // 1-5, as given on Google
     text: 'Exactly as the guest wrote it…',
     source: 'Google',
     featured: true,             // show in the homepage strip (max 3)
   }
   Nothing review-related shows on the live site while this is empty. */
export const REVIEWS = [
  {
    "name": "Jay",
    "country": "Australia",
    "date": "2026-11",
    "service": "scooter",
    "rating": 5,
    "featured": true,
    "text": "I had a fantastic day out with Aris on a 1:1 scooter trip and couldn't recommend him more highly.\n\nWe headed up to Kintamani for coffee overlooking the volcano, stopped for lunch in Tegallalang, and finished with a drop-off in Ubud. It was a brilliant way to see more of Bali.\n\nWhat made the day particularly special was getting to chat with Aris along the way. He was happy to share his knowledge of local culture and traditions, and I really enjoyed learning from him. He also listened to what I wanted to get out of the day and tailored the trip around that.\n\nAs a solo traveller, feeling safe and comfortable was really important to me. The scooter ride was smooth, and at no point did I feel worried or uncomfortable.\n\nIf you're travelling solo and want to explore Bali with someone knowledgeable, friendly and genuinely attentive to what you want to do, I'd highly recommend spending a day with Aris. An excellent experience!"
  },
];
// Aris's Google reviews page ("Read all reviews on Google").
export const REVIEWS_PROFILE_URL = null;
// Google's "write a review" link from the Business Profile ("Leave a review").
export const REVIEWS_WRITE_URL = null;

/* ---------- Analytics & click tracking ----------
   Every CTA, WhatsApp link, enquiry form, language and currency change
   is tracked (see assets/scripts/track.js). Events are always pushed to
   window.dataLayer; add ONE OR MORE of the IDs below to send them on.
   Nothing third-party loads while these are null.                   */
export const ANALYTICS = {
  ga4MeasurementId: null,        // e.g. 'G-XXXXXXXXXX'  (Google Analytics 4)
  gtmContainerId: 'GTM-M94B89ZK', // Google Tag Manager (GA4 is set up inside GTM)
  cloudflareBeaconToken: null,   // Cloudflare Web Analytics token (cookieless page views)
  plausibleDomain: null,         // e.g. 'baliparadise.com' (Plausible, cookieless)
  debug: false,                  // true = log every event to the console
};

/* ---------- Photography ----------
   Real photographs only (no AI imagery). Images are referenced
   directly in the HTML pages; sources are listed in IMAGE-CREDITS.md.
   To use Aris's own photo, set DRIVER.photo above.                */
