# Portfolio Archive Starter

A static site for a personal project/archive index. No build step — open `index.html`
or serve the folder (`python3 -m http.server 4173 --directory portfolio-archive-starter`).

## Admin

The `Admin` tab in the top bar takes the password in `window.portfolioConfig.adminPassword`
(currently `admin-password`). Signing in reveals the `+ Add block` button, the `Add block`
tile at the end of the grid, and an `Edit` control on every card. Visitors who do not sign
in see the index read-only. The session ends when the tab closes or you hit `Sign out`.

**This is a soft gate.** The site is static, so the password ships in the page source and
anyone can read it. It keeps casual visitors out of the editor; it is not security.

## Blocks

Blocks added or edited through the Admin pane are saved to `localStorage` under
`portfolioArchive.projects.v1` in that browser only. They are not shared between devices
and visitors never see them. To publish blocks for everyone, put them in `projects.js`:

```js
{
  title: "Project title",
  url: "https://example.com",
  label: "Website",
  description: "One-line context for the project.",
  status: "Featured"
}
```

To wipe local edits and fall back to the `projects.js` seeds, run
`localStorage.removeItem("portfolioArchive.projects.v1")` in the browser console.

## Config

`window.portfolioConfig` in `projects.js` controls the header copy, the contact pane
entries (`contacts`), the status dropdown choices (`statusOptions`), the admin password,
and the card accent (`projectAccent`, currently `violet`).
