# Devices Over Time

Live: https://devices-over-time.pages.dev

A static, interactive personal device collection: 13 phones, 8 laptops, 5 desktop builds and one linked CPU upgrade. Dark mountain scenery, illustrated devices, draggable timeline, category filters, search, hover previews and accessible detail dialogs.

## Run locally

Requires free Node.js 22 or newer. No dependencies or installation step.

`npm run dev` starts http://localhost:4173. `npm test` checks the inventory against the authoritative document. `npm run build` creates `dist/`; `npm run preview` serves that output.

## Data and illustrations

`docs/model-research.md` is the user-authoritative source for ownership, acquisition dates and configurations. Update it first, then update `src/data.js`. Deliberately unrecorded configurations remain unknown. Product release dates and published reference specifications are separate from ownership facts. Prices retain their original market and currency; benchmarks identify the test, source and review configuration and are not measurements of these personally owned machines.

Device and scenery artwork is AI-generated illustration, not photography of the owner's hardware. Prompts and reference links are in `docs/image-prompts.json`. The three device atlases are displayed using CSS cells; the 2022 upgrade reuses its original case illustration.

## Cloudflare Pages

The GitHub-connected Cloudflare Pages project is `devices-over-time`, with production branch `main`, build command `npm run build`, output directory `dist`, and Node.js 22. This is entirely static and needs no database, paid software, Functions, or runtime secrets. The build supplies security and caching headers.

Target custom hostname: `devices.harryjameschapman.com`. Register the hostname on this Pages project before creating its CNAME to the project's assigned `pages.dev` address. Keep the portfolio project and apex records unchanged.

For an authorized direct deployment: `npx wrangler pages deploy dist --project-name devices-over-time --branch main`.
