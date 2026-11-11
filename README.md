# Montaire Rally — demo rebuild

A Jekyll rebuild of montairerally.com (currently a Canva site), with
registration and ticketing handled by Stride Events. Built on the same "Jones
Uncommon" approach as the WWCA site: free hosting on GitHub Pages, no plugins,
organizers edit content in a browser.

## Look at it now
https://bcreates440.github.io/montaire-rally-demo/ (demo; marked noindex).

## What's in the demo
- **Home** – hero video, philosophy, "Explore the rally" cards, partners.
- **/schedule/** – day-by-day schedule and lodging, then the route (`#route`) and the
  vehicle classes (`#vehicles`). The nav's Schedule dropdown links to those anchors.
- **/coin-quest/**, **/passes/**, **/gear/**, **/about/**
- **/faq/** – questions plus a photo carousel with a lightbox.
- Every page is a list of sections in `_content/<page>.html` (front matter only);
  each section type is a file in `_includes/blocks/`, and `admin/config.yml`
  describes its fields. Menu: `_data/nav.yml`. Partner logos: `_data/partners.yml`.
- **/admin/** – Sveltia CMS (backup editor). The click-to-edit editor at `/edit/`
  is being built on top of the same section files.
- Every distinct image and all three videos from the old site are used (58 files after
  collapsing the duplicate sizes Canva generates; the three videos each get a desktop
  and a mobile size). See `_data/assets.yml`. Photos were resized to JPEG/WebP
  (43 MB → 8 MB) and every image has a small copy in `assets/rally/thumb/` used
  wherever it displays small.

## Before it goes live
1. Every Register button uses `stride_event_url` in `_config.yml` (the Stride event
   page now; swap in the registration page URL when it exists).
2. Replace the placeholder prices in `_content/passes.html` (Stride is the source
   of truth).
3. In `_config.yml` set `url:` to his domain and `baseurl: ""`, and remove the
   `noindex` meta tag from `_layouts/default.html`.
4. Set up this site's sign-in worker (`ops/templates/onboarding.md`, "CMS Auth
   Setup") and put its URL in `admin/config.yml` (`backend.base_url`).
5. Confirm the route stops, lodging, and the "About us" copy with the organizer.

## Run locally
```
bundle install
bundle exec jekyll serve
```
