/* Scroll-spy: highlight the #left_toc link for the heading currently
   at the top of the reading column. */
(function () {
  const toc = document.getElementById('left_toc');
  const section = document.querySelector('section');
  if (!toc || !section) return;

  const headings = Array.from(section.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
  if (!headings.length) return;

  const tocLinks = toc.querySelectorAll('a[href^="#"]');
  if (!tocLinks.length) return;

  const linkMap = new Map();
  tocLinks.forEach(link => linkMap.set(link.getAttribute('href').slice(1), link));

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

  function activate(id) {
    if (id === activeId) return;
    if (activeId) {
      const prev = linkMap.get(activeId);
      if (prev) prev.parentElement.classList.remove('toc-active');
    }
    activeId = id;
    if (!id) return;
    const curr = linkMap.get(id);
    if (!curr) return;
    curr.parentElement.classList.add('toc-active');
    // Keep active item visible in the TOC scroll container
    const tocRect = toc.getBoundingClientRect();
    const itemRect = curr.getBoundingClientRect();
    if (itemRect.top < tocRect.top || itemRect.bottom > tocRect.bottom) {
      curr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
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
