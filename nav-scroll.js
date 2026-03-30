
  Webflow.push(function() {
    const body        = document.body;
    const openBtn     = document.querySelector('.first_mobile-ham');
    const closeBtn    = document.querySelector('.mobile-nav_ham-wrap');
    const mobileMenu  = document.querySelector('.mobile-nav');

    // Función que bloquea/desbloquea el scroll global
    function toggleBodyScroll(freeze) {
      if (freeze) {
        body.classList.add('no-scroll');
        // Previene scroll en body excepto dentro de .mobile-menu
        document.addEventListener('touchmove', preventBodyScroll, { passive: false });
        document.addEventListener('wheel', preventBodyScroll, { passive: false });
      } else {
        body.classList.remove('no-scroll');
        document.removeEventListener('touchmove', preventBodyScroll);
        document.removeEventListener('wheel', preventBodyScroll);
      }
    }

    // Sólo deja pasar eventos si vienen de .mobile-menu
    function preventBodyScroll(e) {
      if (!mobileMenu.contains(e.target)) {
        e.preventDefault();
      }
    }

    // Eventos de apertura y cierre
    openBtn.addEventListener('click', () => toggleBodyScroll(true));
    closeBtn.addEventListener('click', () => toggleBodyScroll(false));
  });

