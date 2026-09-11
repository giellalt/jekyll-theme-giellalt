// Automatisk oppdatering av tema basert på systeminnstillingar
function updatePrismTheme() {
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme === 'dark' ||
                (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const themeLink = document.querySelector('link[href*="prism"]');
  if (isDark) {
    themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
  } else {
    themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
  }

  // Oppdater Prism
  if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
  }
}

// Køyr ved oppstart
updatePrismTheme();

// Lytt etter system tema-endringar
window.matchMedia('(prefers-color-scheme: dark)').addListener(updatePrismTheme);

// Lytt etter lokale tema-endringar
document.addEventListener('themeChanged', updatePrismTheme);
