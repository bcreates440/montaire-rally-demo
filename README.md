# Montaire Rally — demo rebuild

A Jekyll + Decap CMS rebuild of montairerally.com (currently a Canva site), with
registration and ticketing handled by Stride Events. Built on the same "Jones
Uncommon" approach: free hosting on Cloudflare (Workers static assets, built
from this repo on every push), no plugins,
organizers edit content in a browser.

## Look at it now
https://montaire-rally-demo.bcreates440.workers.dev/ (demo; marked noindex).

## What's in the demo
- **Home** – hero video, philosophy, "Explore the rally" cards, partners.
- **/schedule/** – day-by-day schedule and lodging, then the route (`#route`) and the
  vehicle classes (`#vehicles`). The nav's Schedule dropdown links to those anchors.
- **/coin-quest/**, **/passes/**, **/gear/**, **/about/**
- **/faq/** – questions plus a photo carousel (`_data/carousel.yml`) with a lightbox.
- Menu: `_data/nav.yml` (header + footer). Home cards: `_data/explore.yml`.
- **/admin/** – Decap CMS for passes, schedule, FAQ, and the Stride link.
- Every distinct image and all three videos from the old site are used (58 files after
  collapsing the duplicate sizes Canva generates; the three videos each get a desktop
  and a mobile size). See `_data/assets.yml`. Photos were resized to JPEG/WebP
  (43 MB → 8 MB) and every image has a small copy in `assets/rally/thumb/` used
  wherever it displays small.

## Before it goes live
1. Every Register button uses `stride_event_url` in `_config.yml` (the Stride event
   page now; swap in the registration page URL when it exists).
2. Replace the placeholder prices in `_data/passes.yml` (shown on the home page
   pass cards; Stride is the source of truth).
3. In `_config.yml` set `url:` to his domain, and remove the
   `noindex` meta tag from `_layouts/default.html`.
4. Push to a new GitHub repo, import it in Cloudflare (Workers & Pages → Create →
   Import a repository; build command `bundle install && bundle exec jekyll build`;
   set `name` in `wrangler.toml`), and fill in `admin/config.yml` (repo + OAuth
   worker URL). Add the site's address to that worker's `ALLOWED_ORIGINS`.
   Don't enable GitHub Pages.
5. Confirm the route stops, lodging, and the "About us" copy with the organizer.

## Run locally
```
bundle install
bundle exec jekyll serve
```
