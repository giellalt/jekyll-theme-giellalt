# jekyll-theme-giellalt

Shared Jekyll theme for [GiellaLT](https://giellalt.github.io/) documentation sites. Vendored on top of `jekyll-theme-minimal`, with dark mode, hamburger sitemap, Prism syntax highlighting, and Mermaid diagrams.

## Consumer repo setup

In the consumer repo's `docs/_config.yml`:

```yaml
remote_theme: giellalt/jekyll-theme-giellalt
title: My Docs
description: ...

plugins:
  - jekyll-remote-theme
  - jekyll-seo-tag
  - jemoji
  - jekyll-include-cache

defaults:
  - scope: { path: "" }
    values:
      layout: default   # or "keyboard" or "minimal"
```

Do **not** also set `theme:` — `remote_theme` replaces it.

Delete the following from the consumer's `docs/` once you migrate:

- `_layouts/default.html`
- `_includes/sitemap.html`
- `_includes/toc.html`
- `assets/css/style.scss`
- `assets/js/theme-toggle.js` (and any other JS that was copy-pasted)

The theme ships replacements for all of them via `remote_theme`'s asset overlay.

## Layouts

| Layout | Who uses it | Features |
|--------|-------------|----------|
| `default` | `lang-*`, `shared-*`, `wordguess-*` | Full — TOC sidebar, hamburger sitemap, Prism, Mermaid, dark mode |
| `keyboard` | `keyboard-*` | `default` + iframe resize handler for embedded keyboard previews |
| `minimal` | `dict-*`, `speech-*` | Stripped-down — no TOC sidebar, no Mermaid, no Prism (for list/table-heavy sites) |

## Reading `generated/docs-data` (badges, test logs, accuracy report)

`lang-*` repos publish per-build data — badge JSON + SVGs, lemma/speller test
logs, the spellchecker accuracy report — to a rolling `generated/docs-data`
branch (force-pushed by [divvun-actions](https://github.com/divvun/divvun-actions),
never on `main`). The docs pages read it at view time:

- **Public repo** — live from `raw.githubusercontent.com` (the one GitHub host
  that sends CORS headers).
- **Private repo** — that host needs auth and sends no CORS header, and
  shields.io can't read the repo at all. `giellalt/.github`'s `docs.yml` instead
  copies the branch into the built site and the theme reads it same-origin from
  the access-controlled Pages site.

`_includes/docs-data-base.html` resolves which applies and outputs the URL
prefix; `_includes/language-badges.html`, `_includes/testlogs.html` and
`_layouts/typosreport.html` all `{% capture %}` it. The choice keys on
`_data/ci.yml`, which `giellalt/.github`'s `docs.yml` writes on every CI build:

```yaml
private: true               # gh api repos/<nwo> --jq .private
repo_nwo: giellalt/lang-xxx
```

A docs build that doesn't write this file is treated as public — correct for a
local `jekyll serve`, where there's no embedded copy or private Pages host
either.

## Automatic test logs

`lang-*` repos publish their per-build lemma/speller test results to the rolling
`generated/docs-data` branch (not `main`). The theme renders them client-side:

- `assets/js/testlogs.js` — fetches the manifest and each suite's failures on
  demand, and renders a summary table plus collapsible per-suite failure lists.
- `_includes/testlogs.html` — the mount point. It emits the
  `<div id="testlogs" data-src="…" data-nwo="…">` (data URL from
  `docs-data-base.html`; `data-nwo` so the script can build `github.com` links
  even when `data-src` is a same-origin path) and loads the script.

A consumer opts in with a page that includes it:

```liquid
---
layout: default
title: Automatic test logs
---
<h1>Log files for automatic testing</h1>
<p>…intro prose…</p>
{% include testlogs.html %}
```

`template-lang-und` ships this as `docs/testlogs/index.html`, so every `lang-*`
repo gets it on sync. The data URL scheme and script tag live in the theme —
changing either is a theme-only change.

## Accuracy / typos report

`lang-*` repos publish a spellchecker accuracy report (`speller-accuracy.json`)
to the same rolling `generated/docs-data` branch as the test logs above. The
theme serves a viewer for it — a Rust/Dioxus app built to WebAssembly with
[Trunk](https://trunkrs.dev/) (source: `support/accuracy-viewer` in
[divvun/divvunspell](https://github.com/divvun/divvunspell)), not Node:

- `assets/typosreport/` — the built output (`accuracy-viewer.js`,
  `accuracy-viewer_bg.wasm`, `styles.css`, `global.css`, `snippets/`),
  committed here like `assets/js/testlogs.js` — a build artifact, not source.
  Rebuild and copy these in from `divvunspell` by hand when the viewer
  changes (`trunk build --release` there, see its README); this repo has no
  Rust toolchain of its own.
- `_layouts/typosreport.html` — the standalone page skeleton. Sets
  `window.__DOCS_DATA_BASE__` (from `docs-data-base.html`) before bootstrapping
  the wasm module.

A consumer opts in with just front matter:

```liquid
---
layout: typosreport
title: Accuracy Report
---
```

`template-lang-und` ships this as `docs/typosreport/index.html`, so every
`lang-*` repo gets it on sync.

## Local dev (theme itself)

```bash
bundle install
bundle exec jekyll serve
```

## Local testing against a consumer repo

1. Push this repo to a branch on GitHub (doesn't have to be `main`).
2. In the consumer repo's `docs/_config.yml`, set `remote_theme: giellalt/jekyll-theme-giellalt@your-branch`.
3. In the consumer repo: `cd docs && bundle install && bundle exec jekyll serve`.

`jekyll-remote-theme` fetches and caches the branch the same way it does in the GitHub Pages build, so what you see locally matches production.

## Publishing updates

Push to `main`. Consumer sites pick up the new theme on their next GitHub Pages build. Tag `vN.N.N` and pin via `remote_theme: giellalt/jekyll-theme-giellalt@vN.N.N` if you want to stop rolling updates.

## Overriding in a consumer repo

Any file the consumer places at the same path wins over the theme's. For per-repo tweaks, drop a `docs/_layouts/default.html` or `docs/_sass/custom.scss` in the consumer and it will override. Prefer extending via `_config.yml` or adding a custom layout that front-matters `layout: default`.
