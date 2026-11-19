# Getting reviews for Aris

Everything points guests to one short link: **tourbaliparadise.com/review**

That page thanks the guest and sends them to Aris's Google review form. Until the Google link has been added, it offers WhatsApp feedback instead. The QR code and the WhatsApp messages below use the same link, so none of them need changing later.

---

## 1. Switching on Google reviews (one time)

When Aris's Google Business Profile is live:

1. On Google, open his profile, tap **Ask for reviews** (or **Get more reviews**) and copy the link. It looks like `https://g.page/r/…/review`.
2. Also copy the link to his profile itself, for "Read all reviews on Google".
3. Send both links to Claude. It sets these two lines in `assets/scripts/config.js`:

```js
export const REVIEWS_PROFILE_URL = 'https://…';      // his Google profile / reviews
export const REVIEWS_WRITE_URL = 'https://g.page/r/…/review';
```

From then on:
- **The /review page** opens Google's review form with one tap.
- **The About page and the homepage reviews strip** show "Read all reviews on Google" and "Leave a review".

---

## 2. QR code for the car

The files are in the `print/` folder. They aren't published on the website.

- **`review-card.pdf` / `review-card.png`:** a 4×6 inch card (10×15 cm). Print it at a photo shop or on normal paper. Laminate it and keep it on the back of the front seat or the dashboard.
- **`qr-review.png` / `qr-review.svg`:** just the QR code, for stickers or Aris's phone screen.

At the end of each trip, Aris can say: *"If you enjoyed today, would you mind leaving me a quick review? Just scan this."*

---

## 3. WhatsApp thank-you message

Aris sends this the same evening, while the day is fresh. Save it as a quick reply in WhatsApp Business: **Settings → Business tools → Quick replies**, shortcut `/review`.

**English**
```
Hi [name], thank you so much for travelling with me today! I hope you enjoyed Bali.

If you have a minute, a short review would really help my small business:
tourbaliparadise.com/review

Terima kasih and safe travels!
Aris
```

**Bahasa Indonesia** (for Indonesian guests)
```
Halo [nama], terima kasih banyak sudah jalan-jalan bersama saya hari ini! Semoga Anda menikmati Bali.

Kalau ada waktu sebentar, ulasan singkat akan sangat membantu usaha kecil saya:
tourbaliparadise.com/review

Terima kasih dan selamat jalan!
Aris
```

---

## 4. Reviews written on the website (no Google account needed)

The /review page has a review form:
- a star rating
- what the guest booked
- their first name, country (optional) and month (optional)
- the review itself
- a tick-box agreeing it can be published

When the guest presses **Send my review**, WhatsApp opens with the whole review written out, addressed to Aris. On a computer, they get a QR code to scan with their phone instead.

**Nothing appears on the site automatically.** Aris forwards the message to you, and you send it to Claude to add. Only add reviews where the guest ticked the consent box; the message says so in its last line.

## 5. Putting reviews on the website

Google reviews don't appear on the website by themselves. When a good one arrives:

1. Take a screenshot of it, or copy the text.
2. Send it to Claude with the guest's **first name**, their **country**, the **month** of the trip, and **which service** they booked (airport transfer, private driver, custom day trip or scooter tour).

Each review appears:
- on the homepage;
- under the matching service on the Services page;
- on the About page.

Reviews are only ever copied word for word, and only real ones.
