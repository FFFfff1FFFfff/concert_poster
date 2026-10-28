# FLIKX Concert Studio

A small local editor for two English-language concert tattoo posts aimed at the US market. Reusable HTML layouts keep text consistent; AI creates only image assets.

## Run

Requires Node.js 22+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3100. No API keys are required to upload assets, edit, save, or export. Nine generic AI starter motifs and a concert photo are included; they are not associated with a real artist.

## Workflow

1. Enter the artist, tour, US city/state, date, and event source URL. Both slides use the same details.
2. Choose cool lavender or white paper for the torn-paper cover. Optionally replace its photograph.
3. In **Designs**, upload PNGs or add motifs from the library. Click a motif to resize, rotate, hide, or remove it. Drag to position it. **Editorial mix** and **Clean grid** rearrange the sheet. Numbering refers to the saved slot order; hiding a slot keeps its number reserved.
4. **Save project** writes the project to disk. A browser draft also survives reloads. Open a saved project or duplicate it for another artist.
5. **Export poster kit** downloads a ZIP with `01-cover.png`, `02-designs.png` (1080 × 1440), every original PNG, and `project.json` with placements, source metadata, and the number-to-asset mapping. The download icon on either slide exports only that slide.

Uploaded/generated assets are saved immediately under `data/assets/`. PNG uploads and API-generated PNGs are stored byte-for-byte without resizing, poster text, or numbering. JPEG/WebP uploads are converted to PNG. Removing a design from a poster does not delete its original. Projects live under `data/projects/`. Back up `data/` to move the full library and saved projects to another machine. Export ZIPs are portable asset/config backups; ZIP import is not implemented yet.

## Optional connections

Copy `.env.example` to `.env.local`, set the keys you need, and restart the dev server. Do not commit keys.

- `OPENAI_API_KEY`: enables **Generate PNG**. Uses the OpenAI Images API, one 1024 × 1024 transparent PNG per click, medium quality. `OPENAI_IMAGE_MODEL` defaults to `gpt-image-2`; use a compatible model available to your account. Identical model/prompt/settings reuse the saved asset. No automatic retries on rate limits; saved work remains usable. **Copy image prompt** + uploading a PNG works without the API. This is separate API billing from any chat subscription.
- `TICKETMASTER_API_KEY`: enables in-app discovery of music shows in the US within the next 60 days. Results retain their source link and require choosing **Use this show**. This is a discovery feed, not complete coverage or artist/theme research. Without a key, use the Ticketmaster link and enter details manually.

References: [OpenAI image generation](https://developers.openai.com/api/reference/resources/images/methods/generate), [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/).

## Scope

This first version covers the first two slides only. No auto-publishing, accounts, database, or background jobs. The server binds to loopback; file storage and API routes are intended for a trusted local user, not public deployment. AI motif output still needs a visual check before making a customer order. Event/theme curation and batch sheet splitting remain manual; the included starter sheet was split once with `scripts/prepare-demo.mjs`.

## Checks

```sh
npm test
npm run build
```

Main files: `app/page.jsx` (editor/export), `components/Posters.jsx` (two HTML templates), `app/globals.css` (visuals), `lib/storage.mjs` (disk persistence), `app/api/` (local routes).
