# Publication

- Repository: https://github.com/HazzJC/DevicesOverTime
- Live site: https://devices-over-time.pages.dev
- Dedicated Pages project: devices-over-time, connected to GitHub main.
- Build: npm run build; output: dist; no runtime services.
- First deployment: https://2f6a475c.devices-over-time.pages.dev, verified 13 September 2026.
- Four inventory tests passed. Fifteen browser checks passed both locally and on the live site, covering filters, search, no results, recorded specifications, benchmark context, related upgrades, navigation boundaries, keyboard movement, hidden-preview focus exclusion and mobile overflow. Mouse dragging also verified. Desktop and mobile screenshots reviewed; no browser errors reported.

## Custom hostname

devices.harryjameschapman.com is registered with the Pages project. Initial verification reports CNAME record not set. The available Cloudflare OAuth session cannot read or edit DNS records, so the owner must add this record in the harryjameschapman.com zone:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | devices | devices-over-time.pages.dev | Enabled |

Then check that Pages lists the hostname as Active and HTTPS loads the viewer. The existing personalsite Pages project and portfolio apex domain have not been modified.
