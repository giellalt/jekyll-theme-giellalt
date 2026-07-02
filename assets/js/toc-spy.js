/* Scroll-spy: highlight the TOC link for the heading currently at the top of
   the reading column. Iterates every .left_toc container (currently just the
   >1270px #toc-desktop rail; the query is left plural so any future copy is
   picked up automatically). The ≤1270px "On this page" disclosure is not
   scroll-spied — it is collapsed by default. */
(function () {
  const tocs = Array.from(document.querySelectorAll('.left_toc'));
  const section = document.querySelector('section');
  if (!tocs.length || !section) return;

  const headings = Array.from(section.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
  if (!headings.length) return;

  // id -> array of TOC links (one per container) pointing at that heading.
  const linkMap = new Map();
  tocs.forEach(toc => {
    toc.querySelectorAll('a[href^="#"]').forEach(link => {
      const id = link.getAttribute('href').slice(1);
      if (!linkMap.has(id)) linkMap.set(id, []);
      linkMap.get(id).push(link);
    });
  });
  if (!linkMap.size) return;

  let activeId = null;

  // ID of the last heading explicitly navigated to via hash (link click,
  // keyboard, or URL bar). Cleared when the user scrolls away from the
  // bottom, at which point normal scroll-spy logic resumes.
  let clickedId = null;

  // Honour a hash already in the URL on first load.
  const initialHash = location.hash.slice(1);
  if (initialHash && linkMap.has(initialHash)) clickedId = initialHash;

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (linkMap.has(id)) {
      clickedId = id;
      update(); // scroll may not fire if the page is already at the bottom
    }
  });

  function setActive(id, on) {
    const links = linkMap.get(id);
    if (!links) return;
    links.forEach(link => link.parentElement.classList.toggle('toc-active', on));
  }

  function activate(id) {
    if (id === activeId) return;
    if (activeId) setActive(activeId, false);
    activeId = id;
    if (!id) return;
    setActive(id, true);
    // Keep the active item visible within whichever TOC is actually on screen.
    (linkMap.get(id) || []).forEach(link => {
      const toc = link.closest('.left_toc');
      if (!toc || toc.offsetParent === null) return; // skip hidden containers
      const tocRect = toc.getBoundingClientRect();
      const itemRect = link.getBoundingClientRect();
      if (itemRect.top < tocRect.top || itemRect.bottom > tocRect.bottom) {
        link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  function update() {
    const atBottom = section.scrollHeight - section.scrollTop - section.clientHeight < 4;

    if (atBottom) {
      // If the user explicitly navigated to a heading that is still visible
      // in the viewport, honour that choice over the last-heading fallback.
      if (clickedId) {
        const el = document.getElementById(clickedId);
        if (el) {
          const sectionRect = section.getBoundingClientRect();
          const elTop = el.getBoundingClientRect().top;
          if (elTop >= sectionRect.top && elTop < sectionRect.bottom) {
            activate(clickedId);
            return;
          }
        }
      }
      const last = headings[headings.length - 1];
      if (last && linkMap.has(last.id)) activate(last.id);
      return;
    }

    // Not at bottom: release the explicit-navigation override so normal
    // scroll-spy takes over if the user scrolls back down.
    clickedId = null;

    const sectionTop = section.getBoundingClientRect().top;
    // The active heading is the last one whose top edge is at or above a
    // threshold 60px below the section top (gives a bit of breathing room).
    const threshold = sectionTop + 60;
    let active = null;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= threshold) {
        active = h;
      } else {
        break;
      }
    }
    // If nothing has scrolled past the threshold yet, activate the first heading.
    if (!active) active = headings[0];
    if (active && linkMap.has(active.id)) activate(active.id);
  }

  section.addEventListener('scroll', update, { passive: true });
  update();
})();
