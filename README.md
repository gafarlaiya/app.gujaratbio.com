# Hariyo (app.gujaratbio.com)

Farmer app by Gujarat Bio Organics. Plain HTML/CSS/JS, no build step; deploys as static files.

- `index.html`, `app.js`, `app.css`: the farmer app (installable PWA: `manifest.webmanifest`, `sw.js`).
- `crops.json`: 20 crop guides with stage timing, exported from the gujaratbio.com crop content.
- `admin.html`: team screen (problem reports with photos and replies, farmers list + CSV, meetings). Sign in with a team email listed in the CRM `team` table.
- Data: Supabase project `filbmvtclfcrrvxckema`, tables `hariyo_*`, private photo bucket `hariyo-cases`. Farmers never read tables directly; the app calls `hariyo_*` functions with a private token kept on the phone.

Phase 2: AI photo diagnosis, Razorpay, WhatsApp/phone reminders, Gujarati and Hindi, farmer videos, dealer view.
