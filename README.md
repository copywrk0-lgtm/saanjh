# Saanjh — Wedding weekend concept

A static, mobile-friendly wedding planner demo with a six-chapter scroll,
three themed planning stories, a destination map, and a WhatsApp brief builder.

## Preview locally

Run this from the project folder:

```sh
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Serve the `dist` folder at the domain root;
opening the HTML directly from the filesystem will not resolve the root-relative assets.

## Edit and publish

- Edit styles and interactions in `dist/style.css`, `dist/motion.css`, and `dist/app.js`.
- Edit page content in `generate.py`, then run `python generate.py` to regenerate the HTML.
- Publish the `dist` folder with any static website host. The included Vercel configuration
  selects `dist` as the output folder; no dependency installation or build command is needed.

## Loading screen and reveal behavior

The burgundy Saanjh intro plays on the first homepage visit in a browser session.
It waits briefly for the hero and fonts, then opens in two panels. Skip intro is available.
The screen has bounded timeouts and is skipped for reduced-motion preferences and deep links.
Clear the `saanjh-intro-seen` session storage item to replay it.

Photo masks run only when a reveal starts; photographs remain visible by default.
The interactive map never uses an animation mask.

## External resources

All wedding images, Leaflet and map geography are included locally. The map uses
public-domain Natural Earth country outlines (via world-atlas 2.0.2), without a tile
service or API key. Google Fonts need an internet connection; system fonts remain available.

The story names, numbers and scenarios are fictional. Photos are illustrative stock images.
Image credits and source links are on `/credits/` and in `asset-manifest.json`.
Suggested venues are not claimed partnerships. Map pins show destination areas.

No planner WhatsApp number is configured: the WhatsApp action prepares a message and
lets the visitor choose a recipient. It does not automatically send or store enquiries.
