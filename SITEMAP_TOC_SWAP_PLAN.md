# Sitemap / TOC swap — planning notes

Tracking doc for the PR that swaps the page content (TOC) and the sitemap into
the issue #5 desktop hierarchy: **sitemap + search (left) → content → page TOC
(right)** at >1270px.

The first commit shipped the >1270px swap and left the ≤1270px layouts untouched.
The **Responsive breakpoint plan** below is the remaining work: revising the
narrower breakpoints so the whole site feels cohesive at every width. The
**Open items** further down are smaller follow-ups.

## Responsive breakpoint plan (Alternative A — approved)

**Principle:** every nav element gets at most two states as the viewport
narrows, so nothing shuffles around unpredictably.

- **Page TOC** → right rail when wide; otherwise a **collapsed "On this page"
  disclosure** at the top of the content column.
- **Sitemap** → left column when wide; otherwise a **hamburger drawer**.
- **Branding/overview** → left column when there's a sidebar; otherwise
  **full-width at the top**.

### Target matrix

| Width | Branding | Sitemap | Page TOC | Content |
|---|---|---|---|---|
| **≥1271** | left (top) | left (under branding) | right rail (`#toc-desktop`) | center |
| **961–1270** | left (top) | left (under branding) | "On this page" disclosure (collapsed) | right |
| **721–960** | full-width top | hamburger drawer | "On this page" disclosure (collapsed) | full width |
| **≤720** | hidden (controls bar only) | hamburger drawer | "On this page" disclosure (collapsed) | full width |

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
- **Page TOC:** in-header `#toc` hidden; `#mobile-toc` "On this page" disclosure
  shown (collapsed). Its appearance was extracted into a shared `≤1270px` block;
  ≤720 now only sets `display` + hamburger clearance.
- Reverted the old right-edge bleed to a centered 2-column wrapper.
- **Deferred polish:** the disclosure spans the full reading-width content column
  here; may want a `max-width` cap. Confirmed working in-browser at this width.
- **Note — temporary state at 721–960:** still uses the old header-split TOC
  until the next step; no conflict because `#mobile-toc` is only shown at
  961–1270 and ≤720 for now (not the full ≤1270 yet).

**721–960px — simplify. ✅ DONE** (commit `a3495f1`)

- Header stacks full-width at the top; the two-column internal split
  (`header #toc` absolute-right + `header > :not(#toc)` at 50%) is gone,
  replaced by `header > * { margin-bottom: 10px }`. No forced `width: 100%` —
  the children already fill the width, and forcing it ballooned the inline logo.
- `#mobile-toc` now shows across the whole ≤1270px range, so 721–960 gets the
  disclosure. Sitemap stays in the hamburger; content is full width. Confirmed
  in-browser.

**≤720px — essentially unchanged. ✅** Header hidden; mobile-controls-bar (theme +
search) + "On this page" disclosure + content; sitemap in the hamburger.
Confirmed still holds.

### Structural cleanup — ✅ DONE (commit `a3495f1`)

- The in-header `#toc` / `#left_toc` include was **unused at every width** once
  the swap was complete, so it was removed from `_layouts/default.html` along
  with all its CSS (`header #toc`, `header #left_toc`, `header #left_toc > ul`,
  `header > #toc:not(:has(:nth-child(2)))`, the ≤1200 `header div#toc ul` rule,
  the ≤960 header-split block, and the dead `header > #toc` hides in the
  961–1270 and >1271 blocks). Page TOC now has two homes only, split at 1270px:
  `#toc-desktop` (rail, >1270) and `#mobile_toc_list` (disclosure, ≤1270).
- `.left_toc` now resolves to just `#toc-desktop`; scroll-spy works unchanged.
  *(Still open, low priority: give `#mobile_toc_list` the `.left_toc` class so
  the disclosure also highlights the active heading when opened.)*
- **Empty-TOC guard:** the base `#mobile-toc:not(:has(ul))` rule already hides
  the disclosure on heading-less pages, and the in-header `:nth-child(2)`
  heuristic is gone — so open item #1 is effectively resolved (one heuristic:
  `:has(li)`/`:has(ul)` for the rail and the disclosure respectively).

### Remaining polish

- **Rail clipping — ✅ FIXED** (commit `387f65c`). The root `.left_toc <ul>` kept
  the browser-default ~40px `padding-inline-start`, pushing entries past the
  rail's right edge into `#toc-desktop`'s `overflow:hidden`. Added `.left_toc` to
  the root-list reset. Verified in-browser: entries sit flush and wrap.
- **Disclosure width at 961–1270:** it spans the full reading-width content
  column. Consider a `max-width` cap so it reads as an intentional widget rather
  than a full-width bar. (Deferred from the 961–1270 step.)
- **Optional:** scroll-spy the disclosure when open (see `.left_toc` note above).

### Verification checklist

- Resize sweep across the 1271/1270, 961/960, 721/720 boundaries: no element
  should flash or jump, and the disclosure should appear/collapse cleanly.
- Heading-less page at each width: right rail collapses (≥1271), disclosure
  hidden (≤1270).
- Long sitemap: left-column scroll at 961–1270; drawer scroll ≤960.
- Mind the ≤960 screenshot gotchas (pagefind-modal gap, section auto-focus
  scroll) from prior notes — they make narrow screenshots *look* broken when
  they aren't.

## Open items

### 1. Unify the two empty-TOC heuristics — ✅ RESOLVED (commit `a3495f1`)

The in-header `#toc` and its `:nth-child(2)` heuristic are gone. The two
remaining page-TOC homes each have a single clean empty-guard:

- Rail: `#toc-desktop:not(:has(li))` (plus the wrapper collapse rule).
- Disclosure: base `#mobile-toc:not(:has(ul))`.

Both key off the presence of TOC content, so there's no longer a way for an
empty box to render.

### 2. TOC duplicated in the DOM — ✅ RESOLVED (commit `a3495f1`)

The in-header copy is removed. The page TOC now has exactly two homes, each the
*sole* representation at its width (no redundantly-hidden copy):

- `#toc-desktop` (rail, >1270px) — carries `data-pagefind-ignore`.
- `#mobile_toc_list` inside `#mobile-toc` (disclosure, ≤1270px).

Two `toc.html` includes still render per page (rail + disclosure); that's the
minimum for the split and is accepted. Accessibility is fine — exactly one is
displayed at any width.

### 3. Header row is `auto` at desktop

In the swapped desktop grid, the header occupies row 1 at `auto` height (it was
effectively `1fr`, filling the column, in the base layout). Since the in-header
`#toc` is hidden at >1270px, header height is just branding + search +
downloads, and the sitemap takes the flexible `1fr` row below it.

`header` has `overflow: hidden`, so if the branding/search/downloads block ever
grows very tall it will clip rather than overflow. Edge case, fine in practice.

**Action:** none for now; watch for it if the header gains content.
