/* Toggle .is-overflowing on #left_toc when its content extends below the
   visible viewport. Drives the bottom scroll-shadow pseudo in CSS. */
(function () {
  const toc = document.getElementById('left_toc');
  if (!toc) return;

  const update = () => {
    const hasMoreBelow = toc.scrollHeight - toc.scrollTop - toc.clientHeight > 1;
    toc.classList.toggle('is-overflowing', hasMoreBelow);
  };

  toc.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(toc);
  update();
})();
