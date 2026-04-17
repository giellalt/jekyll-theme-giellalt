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
