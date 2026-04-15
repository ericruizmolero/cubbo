gsap.registerPlugin(ScrollTrigger);

/**
 * ── CONFIGURACIÓN DE VARIANTES ──
 */
const VARIANT_SECONDARY = "w-variant-f049b74e-d8ad-85d2-d7dd-dc2b9d25238d";
const VARIANT_TERTIARY = "w-variant-16dcf5a4-afee-f7d8-6ac5-8f2539c47ade";
const SCROLL_THRESHOLD = 50;

const variantEls = document.querySelectorAll([
  ".navbar_layout", ".navbar_logo", ".navbar_link", ".navbar_button-plain",
  ".navbar_button-icon", ".navbar_cursor", ".navbar_button", ".first_mobile-ham",
  ".first-mobile-nav_ham-line-1", ".first-mobile-nav_ham-line-2"
].join(", "));

// Estado
let isScrolledPast = false;
let darkModeOverrides = 0; // Usamos contador para evitar bugs con secciones pegadas
let variantRafId; // Variable para el debounce

/**
 * ── LÓGICA DE CONTROL DE VARIANTES ──
 */
function updateNavbar() {
  cancelAnimationFrame(variantRafId);

  variantRafId = requestAnimationFrame(() => {
    const isDarkMode = darkModeOverrides > 0;

    // 1. Si hay Dark Mode -> Quitamos TODAS las variantes (Vuelve a la Matriz base)
    if (isDarkMode) {
      variantEls.forEach(el => {
        el.classList.remove(VARIANT_SECONDARY, VARIANT_TERTIARY);
      });
      return; // Detenemos la ejecución aquí para este frame
    }

    // 2. Si NO hay Dark Mode -> Evaluamos el Scroll
    if (isScrolledPast) {
      // Hemos bajado más de la cuenta -> Variante Secundaria
      variantEls.forEach(el => {
        el.classList.add(VARIANT_SECONDARY);
        el.classList.remove(VARIANT_TERTIARY);
      });
    } else {
      // Estamos arriba del todo -> Variante Terciaria
      variantEls.forEach(el => {
        el.classList.add(VARIANT_TERTIARY);
        el.classList.remove(VARIANT_SECONDARY);
      });
    }
  });
}

/**
 * ── INICIALIZACIÓN ──
 */
const initSecondaryPage = () => {
  
  // Forzar el estado inicial nada más cargar
  updateNavbar();

  // 1. Lógica de Scroll (Cambio entre Terciaria y Secundaria)
  ScrollTrigger.create({
    start: SCROLL_THRESHOLD,
    onEnter: () => { 
      isScrolledPast = true; 
      updateNavbar(); 
    },
    onLeaveBack: () => { 
      isScrolledPast = false; 
      updateNavbar(); 
    }
  });

  // 2. Lógica de Dark Mode (Vuelta a Matriz)
  document.querySelectorAll('[navbar="dark-mode"]').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 80px",
      end: "bottom 80px",
      // Sumamos al entrar, restamos al salir (evita saltos entre secciones juntas)
      onEnter: () => { darkModeOverrides++; updateNavbar(); },
      onLeave: () => { darkModeOverrides--; updateNavbar(); },
      onEnterBack: () => { darkModeOverrides++; updateNavbar(); },
      onLeaveBack: () => { darkModeOverrides--; updateNavbar(); },
      fastScrollEnd: true // Cubre casos de scroll hiper-rápido
    });
  });

  /**
   * ── 3. RECÁLCULO DE SEGURIDAD (ANTI-DESINCRONIZACIÓN) ──
   */
  
  // A. Forzar recálculo cuando las fuentes terminen de cargar y pintar
  if (document.fonts) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  // B. Observador de mutaciones de tamaño (Imágenes lazy-load, expansiones, etc.)
  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100); // Pequeño delay para no saturar la CPU si hay muchos cambios
  });
  ro.observe(document.body);
  
  // C. Recálculo extra preventivo por si algún script externo inyecta cosas tarde
  setTimeout(() => ScrollTrigger.refresh(), 500);
};

// Usar 'load' es clave, ya que espera a imágenes y hojas de estilo
window.addEventListener("load", initSecondaryPage);
