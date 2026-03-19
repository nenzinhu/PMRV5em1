(function () {
  function updateBottomNav(activeScreen) {
    const items = document.querySelectorAll('.bottom-nav-item');
    items.forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-nav-screen') === activeScreen);
    });
  }

  function bindBottomNav() {
    const originalGo = window.go;
    if (typeof originalGo !== 'function' || originalGo.__bottomNavWrapped) return;

    function wrappedGo(name) {
      originalGo(name);
      updateBottomNav(name);
    }

    wrappedGo.__bottomNavWrapped = true;
    window.go = wrappedGo;
    updateBottomNav('home');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindBottomNav, { once: true });
  } else {
    bindBottomNav();
  }
})();
