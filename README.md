Matt Graf — Résumé Site
=======

Static, ATS-friendly résumé site with three targeted versions built from one
shared data source. HTML + [Tailwind CSS](https://tailwindcss.com/).

Live: https://resume-matt-graf.netlify.app/

Pages
-----

| Route | File | Focus |
|-------|------|-------|
| `/coldfusion` | `docs/coldfusion.html` | Senior ColdFusion / Legacy Modernization |
| `/full-stack` | `docs/full-stack.html` | Senior Full Stack — Node.js, NestJS, React, TS |
| `/staff-engineer` | `docs/staff-engineer.html` | Staff / Principal Engineer |

**There is no home page.** The root `/` returns a 404 — each résumé is only
reachable by knowing its slug. Pages don't cross-link to each other either, so
one URL doesn't reveal the others.

Each page has its own SEO slug, `<title>`, and meta description, a print-friendly
layout (**Print / Save PDF** button), semantic `h1`/`h2`/`h3`, and a single-column,
mobile-readable, no-tables/no-icons layout for clean ATS parsing.

How it works
------------

- `resume-data.js` — all content: shared identity + three tailored versions.
  **Edit content here.**
- `generate.js` — renders `docs/*.html` from that data. Do **not** hand-edit the
  generated HTML; it is overwritten on every build.
- Tailwind is compiled to `docs/build.css` (purged in production).

Run locally
-----------

```
npm install
npm run serve
```

`serve` regenerates the pages, watches Tailwind, and opens a live-reload server.

To only regenerate HTML:  `npm run generate`
To build the purged production CSS:  `npm run build`

Deploy to Netlify
-----------------

Config is in `netlify.toml` (build command `npm run build`, publish dir `docs`,
clean-URL redirects). Two options:

1. **Git integration (recommended):** connect the repo in Netlify. It runs
   `npm run build` and publishes `docs/` on every push. `docs/build.css` is
   gitignored and generated during the build — no need to commit it.
2. **Manual drag-n-drop:** run `npm run build`, then drag the `docs/` folder to
   https://app.netlify.com/drop.
