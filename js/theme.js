(function () {
  var ONLY_THEME = 'blueprint';
  var STORAGE_KEY = 'paper-theme';

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', ONLY_THEME);
    try {
      localStorage.setItem(STORAGE_KEY, ONLY_THEME);
    } catch (e) {}
  }

  applyTheme();
})();
