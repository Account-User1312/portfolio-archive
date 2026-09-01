# Portfolio Archive Starter

A static site for a personal project/archive index. No build step — open `index.html`
or serve the folder (`python3 -m http.server 4173 --directory portfolio-archive-starter`).

## Admin

The `Admin` tab signs you in against the `ADMIN_PASSWORD` environment variable.
The check runs server-side in `functions/api/session.js`, which issues a signed,
HttpOnly session cookie valid for 12 hours. The password is not in this repo and
cannot be read from the browser.

Signing in reveals the `+ Add block` button, the `Add block` tile, and an `Edit`
control on every card. Visitors see the index read-only.

## Blocks

Blocks live in the `BLOCKS` KV namespace as one JSON array, so the archive is the
same on every device and every visitor sees what you save. `functions/api/blocks.js`
serves them: `GET` is public, `PUT` requires the session cookie.

Until something is saved, the page falls back to the seeds in `projects.js`:

```js
{
  title: "Project title",
  url: "https://example.com",
  label: "Website",
  description: "One-line context for the project.",
  status: "Featured"
}
```

### Local development

There is no Functions runtime behind `python3 -m http.server`, so on `localhost`
the page runs in **local draft mode**: editing is always on, no password is asked,
and blocks are kept in `localStorage` under `portfolioArchive.projects.v1`. Nothing
typed locally reaches the published archive. A banner says so on screen.

## Config

`window.portfolioConfig` in `projects.js` controls the header copy, the contact pane
entries (`contacts`), the status dropdown choices (`statusOptions`), and the card
accent (`projectAccent`, currently `violet`).

## Cloudflare setup

The Pages project needs three things set in the dashboard, once:

| Where | Name | Value |
|---|---|---|
| Settings → Bindings → KV namespace | `BLOCKS` | a KV namespace you create |
| Settings → Variables and secrets | `ADMIN_PASSWORD` | your password, type Secret |
| Settings → Variables and secrets | `SESSION_SECRET` | a long random string, type Secret |

Set them for Production. Redeploy after adding them — bindings only attach to new
deployments. Rotating the password later means editing `ADMIN_PASSWORD` and redeploying;
changing `SESSION_SECRET` also signs out every existing session.

## Deploy

Hosted on Cloudflare Pages as project `nealgill` → https://nealgill.pages.dev

Connected to `Account-User1312/portfolio-archive` on GitHub; every push to `main`
auto-deploys. There is no build step: framework preset `None`, build command empty,
build output directory `/`. `_headers` sets security headers and long-lived caching
for `/assets/*`.
