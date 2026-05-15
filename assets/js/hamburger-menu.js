/**
 * Touch-funksjonalitet for hamburgermenyen
 * Handterer vising/gøyming av sitemap på små skjermar
 */
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const sitemap = document.querySelector('#sitemap');
  
  if (hamburgerMenu && sitemap) {
    const setOpen = (open) => {
      hamburgerMenu.classList.toggle('active', open);
      sitemap.classList.toggle('show', open);
      hamburgerMenu.setAttribute('aria-expanded', String(open));
    };

    hamburgerMenu.addEventListener('click', function(e) {
      e.stopPropagation();
      setOpen(!hamburgerMenu.classList.contains('active'));
    });

    document.addEventListener('click', function(e) {
      if (!sitemap.contains(e.target) && !hamburgerMenu.contains(e.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
        setOpen(false);
        hamburgerMenu.focus();
      }
    });
    
  }
});