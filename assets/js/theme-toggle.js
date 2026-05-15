(function () {
  var dm = window.matchMedia('(prefers-color-scheme: dark)');

  function sysTheme() {
    return dm.matches ? 'dark' : 'light';
  }

  function applyStored() {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.dispatchEvent(new CustomEvent('themeChanged'));
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || sysTheme();
  }

  function toggle() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === sysTheme()) {
      // User's pick already matches system — don't persist, fall back to system.
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', next);
    }
    applyStored();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.addEventListener('click', toggle);
    applyStored();
  });

  // If the OS catches up to our stored override, throw the override away
  // so future OS changes propagate (the "smart rejoin" rule).
  dm.addEventListener('change', function () {
    if (localStorage.getItem('theme') === sysTheme()) {
      localStorage.removeItem('theme');
    }
    applyStored();
  });
})();
