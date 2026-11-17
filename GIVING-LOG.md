# Giving back: how to log a donation

Aris isn't expected to touch the website. The process is:

1. **Aris** makes a donation and sends you **one WhatsApp message** (template below) with a **photo of the receipt**.
2. **You** add one entry to the log file on GitHub (about 2 minutes), or paste Aris's message to Claude and ask it to add it.
3. The website adds it up automatically. The total on the About page, the homepage promise and the Giving Back page (`/giving`) all update about a minute after you save.

---

## 1. WhatsApp template for Aris

Save this in your chat with Aris so he can copy it each time.

**English**
```
DONATION
Date: 15 Dec 2026
Amount: Rp 250,000
Given to: Sungai Watch
Trips covered: 6 transfers, 8 day trips/scooter tours
(photo of receipt attached)
```

**Bahasa Indonesia**
```
DONASI
Tanggal: 15 Des 2026
Jumlah: Rp 250.000
Untuk: Sungai Watch
Perjalanan: 6 antar jemput, 8 tur/sewa harian
(foto bukti terlampir)
```

**How much should it be?** Rp 10,000 for every airport transfer, plus Rp 25,000 for every half-day, full-day or scooter tour.
For example, 6 transfers and 8 day trips = 6 × 10,000 + 8 × 25,000 = **Rp 260,000**.
Donating once a month is easiest.

---

## 2. Add the donation to the website

### a) Upload the receipt photo (optional, but it's what makes this believable)
1. On GitHub, open the repository **tourbaliparadise** → folder `assets/images`.
2. Click **Add file → Upload files**. Upload into a folder called `giving` by typing `giving/` in front of the file name if GitHub asks for a path, or create the folder first.
   Use a simple file name, e.g. `2026-12-15-receipt.jpg`.
3. Click **Commit changes**.
4. The photo's web address will be `assets/images/giving/2026-12-15-receipt.jpg`.

You can also use a link to an Instagram or Facebook post about the donation instead.

### b) Add the entry
1. Open `assets/data/giving-log.json` on GitHub and click the **pencil (Edit)** icon.
2. Inside the square brackets after `"donations":`, add one entry. **Put the newest first**, and separate entries with a comma.

The first donation will look like this:

```json
{
  "_howToAdd": "…leave this line as it is…",
  "donations": [
    {
      "date": "2026-12-15",
      "amountIdr": 260000,
      "to": "Sungai Watch",
      "note": "6 transfers and 8 day trips in November",
      "proofUrl": "assets/images/giving/2026-12-15-receipt.jpg"
    }
  ]
}
```

And with a second, newer donation added on top:

```json
  "donations": [
    {
      "date": "2027-01-14",
      "amountIdr": 310000,
      "to": "Sungai Watch",
      "note": "December trips",
      "proofUrl": "assets/images/giving/2027-01-14-receipt.jpg"
    },
    {
      "date": "2026-12-15",
      "amountIdr": 260000,
      "to": "Sungai Watch",
      "note": "6 transfers and 8 day trips in November",
      "proofUrl": "assets/images/giving/2026-12-15-receipt.jpg"
    }
  ]
```

Rules that keep it working:
- `date` is written as **year-month-day**: `2026-12-15`.
- `amountIdr` is just digits, **no dots, commas or "Rp"**: `260000`.
- Text goes in "double quotes". If there's no receipt link, write `"proofUrl": null`.
- Each `{ … }` entry except the last one ends with a comma.

3. Click **Commit changes**. The site updates within a minute or two.

If something looks wrong on the site afterwards, a comma or quote is usually missing. Paste the file to Claude and ask it to fix it, or undo the change in GitHub's history.

---

## 3. When Aris picks the cause

Once the charity has agreed to be named, open `assets/scripts/config.js` and fill in the cause, for example:

```js
cause: { name: 'Sungai Watch', url: 'https://sungaiwatch.com' },
```

Then update the "Which cause do you support?" answer on the Giving Back page, or ask Claude to do it in all four languages.
