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
    // At the bottom of the page, always activate the last heading.
    const atBottom = section.scrollHeight - section.scrollTop - section.clientHeight < 4;
    if (atBottom) {
      const last = headings[headings.length - 1];
      if (last && linkMap.has(last.id)) activate(last.id);
      return;
    }

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
