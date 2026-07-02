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

**961–1270px — restructure (the main work).**

- Change the grid to "desktop minus the right rail": 2 columns
  `var(--menu-width) minmax(0, var(--reading-width))`, rows `auto 1fr auto`,
  areas:
  ```
  "header  content"
  "sitemap content"
  "footer  content"
  ```
  This is *exactly* the empty-TOC collapse rule already shipped in the >1271
  block — factor it out and reuse it at this width.
- **Sitemap stays in the left column** (under branding). Drop the current
  `position:fixed` hamburger-drawer treatment for this range; the hamburger
  button is already hidden ≥961px.
- **Page TOC:** remove the in-header `#toc` here and instead show the
  `#mobile-toc` "On this page" disclosure (collapsed by default) at the top of
  the content column.
- The current 961–1270 block bleeds the section to the right viewport edge
  *because the sitemap was hidden there*. With the sitemap back in the left
  column, revert to the centered 2-column wrapper so it matches the ≥1271 look.

**721–960px — simplify.**

- Keep the existing stacked single-column (flex-column) layout.
- **Branding:** let the header sit full-width at the top. Remove the current
  two-column internal header split (`header #toc` absolute-right +
  `header > :not(#toc)` at 50%) — it only existed to park the TOC on the right.
- **Sitemap:** hamburger drawer (unchanged).
- **Page TOC:** the same collapsed "On this page" disclosure atop content
  (already visible here once the disclosure shows at ≤1270).
- **Content:** full width below the header.

**≤720px — essentially unchanged.** Header hidden; mobile-controls-bar (theme +
search) + "On this page" disclosure + content; sitemap in the hamburger. Already
matches the target — no work expected beyond confirming it still holds.

### Structural cleanup this unlocks

- The in-header `#toc` / `#left_toc` include becomes **unused at every width**.
  Remove it from `_layouts/default.html` and delete its header-scoped CSS
  (`header #toc`, `header #left_toc`, `header #left_toc > ul`,
  `header > #toc:not(:has(:nth-child(2)))`, and the ≤960 `header #toc` block).
  Page TOC drops from three DOM copies to two, cleanly split at 1270px:
  `#toc-desktop` (rail, ≥1271) and `#mobile_toc_list` (disclosure, ≤1270).
- `.left_toc` then resolves to just `#toc-desktop`; scroll-spy keeps working
  as-is. *(Optional, low priority: give `#mobile_toc_list` the `.left_toc` class
  so the disclosure also highlights the active heading when opened.)*
- Show `#mobile-toc` at ≤1270px (currently ≤720px).
- **Empty-TOC guard:** now that the disclosure appears at ≤1270, hide
  `#mobile-toc` when `#mobile_toc_list` has no `li` (same `:has(li)` test used
  for the rail). This resolves open item #1 by landing on one consistent
  heuristic everywhere.

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

### 1. Unify the two empty-TOC heuristics

Two different selectors decide when to hide an empty TOC:

- In-header copy: `header > #toc:not(:has(:nth-child(2)))` (`assets/css/style.scss:485`)
- Desktop copy: `#toc-desktop:not(:has(li))` (new block, plus the wrapper
  collapse rule `body div.wrapper:has(#toc-desktop:not(:has(li)))`)

They agree today **only** because `toc.html` emits no `<ul>` at all when there
are no h2–h6 headings. If that ever changes to an empty `<ul></ul>`, the
child-count version would show an empty box while the `:has(li)` version would
still hide correctly.

**Action:** unify both on `:has(li)` for robustness. Low priority — the
responsive plan above resolves this by deleting the in-header `#toc` (and its
`:nth-child(2)` heuristic) and adding a `:has(li)` guard to `#mobile-toc`.

### 2. TOC is duplicated in the DOM

Every page now renders two copies of the page TOC: the in-header `#left_toc`
(used ≤1270px) and `#toc-desktop` / `#left_toc_desktop` (used >1270px). This is
a deliberate tradeoff — keeping a separate desktop element avoids moving the
in-header node and disturbing the narrow layouts.

Consequences to keep in mind:

- **Page weight:** two anchor-link subtrees pointing at the same heading IDs
  (valid HTML, but real bytes on every page).
- **Accessibility is fine:** exactly one copy is `display:none` at any width, so
  only one is ever in the accessibility tree — no duplicate-nav announcement.
- `#toc-desktop` carries `data-pagefind-ignore`, so it is not double-indexed by
  search.

**Action:** none required — just a conscious "yes" to the duplication. Note the
responsive plan above changes the picture: once the in-header `#toc` is removed,
the two remaining copies (`#toc-desktop` rail + `#mobile_toc_list` disclosure)
are each the *sole* page TOC at their width rather than one being redundantly
hidden. Revisit only if page weight becomes a concern.

### 3. Header row is `auto` at desktop

In the swapped desktop grid, the header occupies row 1 at `auto` height (it was
effectively `1fr`, filling the column, in the base layout). Since the in-header
`#toc` is hidden at >1270px, header height is just branding + search +
downloads, and the sitemap takes the flexible `1fr` row below it.

`header` has `overflow: hidden`, so if the branding/search/downloads block ever
grows very tall it will clip rather than overflow. Edge case, fine in practice.

**Action:** none for now; watch for it if the header gains content.
