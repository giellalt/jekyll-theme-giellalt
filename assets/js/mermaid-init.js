// Initialiser Mermaid med rett tema
function updateMermaidTheme() {
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme === 'dark' ||
                (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  mermaid.initialize({
    startOnLoad: false, // Endra til false for å handtera oppteikning sjølv
    theme: isDark ? 'dark' : 'default',
    darkMode: isDark
  });

  // Finn alle pre-element med mermaid klasse og teikn diagramma
  document.querySelectorAll('pre > code.language-mermaid').forEach(el => {
    // Fjern Prism-formatering
    el.parentElement.classList.remove('language-mermaid');
    el.className = '';

    // Lag ny div for Mermaid-diagram
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = el.textContent;

    // Byt ut pre-elementet med den nye div-en
    el.parentElement.parentNode.replaceChild(div, el.parentElement);
  });

  // Teikn alle Mermaid-diagram på nytt
  mermaid.init();
}

// Køyr før Prism for å unngå konfliktar
document.addEventListener('DOMContentLoaded', () => {
  updateMermaidTheme();

  // Automatisk fokus på hovudinnhald for tastaturnavigasjon
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    // Set ein liten forseinking for å sikre at alt er lasta
    // preventScroll: focus() alone can trigger a browser scroll-into-view
    // (thresholds differ per engine — e.g. a few px on mobile Chrome/Safari,
    // none on Firefox), shifting in-flow content relative to fixed elements
    // like the sitemap drawer. The section is already in view; suppress
    // the scroll side-effect so layout doesn't shift on load in any browser.
    setTimeout(() => { mainContent.focus({ preventScroll: true }); }, 100);
  }
}, { once: true });

// Oppdater ved tema-endringar
document.addEventListener('themeChanged', updateMermaidTheme);
window.matchMedia('(prefers-color-scheme: dark)').addListener(updateMermaidTheme);
