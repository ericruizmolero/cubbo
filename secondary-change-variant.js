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
let darkModeActive = false;

/**
 * ── LÓGICA DE CONTROL DE VARIANTES ──
 */
function updateNavbar() {
  // 1. Si hay Dark Mode -> Quitamos TODAS las variantes (Vuelve a la Matriz base)
  if (darkModeActive) {
    variantEls.forEach(el => {
      el.classList.remove(VARIANT_SECONDARY, VARIANT_TERTIARY);
    });
    return; // Detenemos la función aquí
  }

  // 2. Si NO hay Dark Mode -> Evaluamos el Scroll
  if (isScrolledPast) {
    // Hemos bajado más de 50px -> Variante Secundaria
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
}

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
      onEnter: () => { darkModeActive = true; updateNavbar(); },
      onLeave: () => { darkModeActive = false; updateNavbar(); },
      onEnterBack: () => { darkModeActive = true; updateNavbar(); },
      onLeaveBack: () => { darkModeActive = false; updateNavbar(); }
    });
  });

  // Refrescar para asegurar precisión en los triggers
  ScrollTrigger.refresh();
};

// Ejecutar al cargar
window.addEventListener("load", initSecondaryPage);
