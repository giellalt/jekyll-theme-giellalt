# Sitemap / TOC swap — planning notes

Tracking doc for the PR that swaps the page content (TOC) and the sitemap into
the issue #5 desktop hierarchy: **sitemap + search (left) → content → page TOC
(right)** at >1270px.

The first commit shipped the >1270px swap and left the ≤1270px layouts untouched.
The **Responsive breakpoint plan** below is the remaining work: revising the
narrower breakpoints so the whole site feels cohesive at every width. The
**Open items** further down are smaller follow-ups.

## Responsive breakpoint plan

**Final direction:** the in-page TOC lives **only** in the >1270px right sidebar
rail (`#toc-desktop`). Below 1270px there is **no in-page TOC** at all.

> **History / direction change.** An earlier approach (Alternative A) also showed
> the page TOC as a collapsed "On this page" disclosure at the top of the content
> column below 1270px. That disclosure was built (961–1270, 721–960, ≤720) and
> then **removed** (commit `b08c9a9`) by decision — it sat awkwardly above the
> page title and added complexity for little value on narrow screens. The
> breakpoint *restructure* work below still stands (sitemap placement, header
> stacking, in-header-TOC removal); only the disclosure was dropped.

**Principle:** each nav element has at most two states as the viewport narrows.

- **Page TOC** → right rail at >1270px; **absent** below (rail only).
- **Sitemap** → left column when wide; otherwise a **hamburger drawer**.
- **Branding/overview** → left column when there's a sidebar; otherwise
  **full-width at the top**.

### Target matrix

| Width | Branding | Sitemap | Page TOC | Content |
|---|---|---|---|---|
| **≥1271** | left (top) | left (under branding) | right rail (`#toc-desktop`) | center |
| **961–1270** | left (top) | left (under branding) | — none | right |
| **721–960** | full-width top | hamburger drawer | — none | full width |
| **≤720** | hidden (controls bar only) | hamburger drawer | — none | full width |

### Breakpoint-by-breakpoint

**≥1271px — done, unchanged.** The shipped 3-column swap: branding + sitemap
left, content center, page TOC as the right rail (`#toc-desktop`).

**961–1270px — restructure (the main work). ✅ DONE** (commit `1ecd8e0`)

- Grid is now "desktop minus the right rail": 2 columns
  `var(--menu-width) minmax(0, var(--reading-width))`, rows `auto 1fr auto`,
  areas `header/sitemap/footer` (col 1) + `content` (col 2) — the same shape as
  the >1271 empty-TOC collapse, one band down.
- **Sitemap** sits in the left column under the branding, styled to match the
  >1271 view. The hamburger + drawer-sitemap rules were **retagged from ≤1270 to
  ≤960**, so the hamburger reverts to its base `display:none` at 961–1270 and
  ≤960 is unchanged.
- **Page TOC:** none here. The in-header `#toc` was hidden, and the "On this
  page" disclosure that briefly lived here was later **removed** (see direction
  change above).
- Reverted the old right-edge bleed to a centered 2-column wrapper.

**721–960px — simplify. ✅ DONE** (commit `a3495f1`)

- Header stacks full-width at the top; the two-column internal split
  (`header #toc` absolute-right + `header > :not(#toc)` at 50%) is gone,
  replaced by `header > * { margin-bottom: 10px }`. No forced `width: 100%` —
  the children already fill the width, and forcing it ballooned the inline logo.
- No in-page TOC (the disclosure that briefly appeared here was removed).
  Sitemap stays in the hamburger; content is full width. Confirmed in-browser.

**≤720px — essentially unchanged. ✅** Header hidden; mobile-controls-bar (theme +
search) + content; sitemap in the hamburger. No in-page TOC.

### Structural cleanup — ✅ DONE (commit `a3495f1`)

- The in-header `#toc` / `#left_toc` include was **unused at every width** once
  the swap was complete, so it was removed from `_layouts/default.html` along
  with all its CSS (`header #toc`, `header #left_toc`, `header #left_toc > ul`,
  `header > #toc:not(:has(:nth-child(2)))`, the ≤1200 `header div#toc ul` rule,
  the ≤960 header-split block, and the dead `header > #toc` hides in the
  961–1270 and >1271 blocks). With the disclosure since removed too, the page TOC
  now has a **single home**: `#toc-desktop` (the >1270px rail).
- `.left_toc` resolves to just `#toc-desktop`; scroll-spy works unchanged.
- **Empty-TOC guard:** the rail collapses on heading-less pages via
  `#toc-desktop:not(:has(li))` plus the wrapper collapse rule.

### Remaining polish

- **Rail clipping — ✅ FIXED** (commit `387f65c`). The root `.left_toc <ul>` kept
  the browser-default ~40px `padding-inline-start`, pushing entries past the
  rail's right edge into `#toc-desktop`'s `overflow:hidden`. Added `.left_toc` to
  the root-list reset. Verified in-browser: entries sit flush and wrap.
- **Disclosure width cap** (commits `df8a53a`, then removed in `b08c9a9`). Was
  capped to `var(--menu-width)`; now moot — the disclosure is gone entirely.
- ~~Scroll-spy the disclosure when open~~ — moot; no disclosure.

### Verification checklist

- Resize sweep across the 1271/1270, 961/960, 721/720 boundaries: no element
  should flash or jump.
- Heading-less page: right rail collapses (≥1271); nothing to check below 1270
  (no in-page TOC there).
- Long sitemap: left-column scroll at 961–1270; drawer scroll ≤960.
- Mind the ≤960 screenshot gotchas (pagefind-modal gap, section auto-focus
  scroll) from prior notes — they make narrow screenshots *look* broken when
  they aren't.

## Open items

### 1. Empty-TOC heuristic — ✅ RESOLVED

With the in-header `#toc` and the disclosure both removed, there's a single
page-TOC home and a single guard: the rail collapses via
`#toc-desktop:not(:has(li))` plus the wrapper collapse rule. No way for an empty
box to render.

### 2. TOC duplicated in the DOM — ✅ RESOLVED

No duplication left. The page TOC has a **single home**, `#toc-desktop` (the
>1270px rail, `data-pagefind-ignore`). Only one `toc.html` include renders per
page now.

### 3. Header row is `auto` at desktop

In the swapped desktop grid, the header occupies row 1 at `auto` height (it was
effectively `1fr`, filling the column, in the base layout). With the in-header
`#toc` gone, header height is just branding + search + downloads, and the
sitemap takes the flexible `1fr` row below it.

`header` has `overflow: hidden`, so if the branding/search/downloads block ever
grows very tall it will clip rather than overflow. Edge case, fine in practice.

**Action:** none for now; watch for it if the header gains content.
