gsap.registerPlugin(ScrollTrigger);

/**
 * ── CONFIGURACIÓN Y CONSTANTES ──
 */
const SCROLL_START = 50;
const SCROLL_END = 120;
const VARIANT = "w-variant-f049b74e-d8ad-85d2-d7dd-dc2b9d25238d";
const root = document.body;
const heroBg = document.querySelector(".hero_bg-color");

const variantEls = document.querySelectorAll([
  ".navbar_layout", ".navbar_logo", ".navbar_link", ".navbar_button-plain",
  ".navbar_button-icon", ".navbar_cursor", ".navbar_button", ".first_mobile-ham",
  ".first-mobile-nav_ham-line-1", ".first-mobile-nav_ham-line-2"
].join(", "));

const RETURN_DURATION = 1.5;
const RETURN_DELAY = 1.5;
const RETURN_EASE = "power2.out";

// Estado
let baseVariantActive = false;
let darkModeOverrides = 0;
let variantRafId; // Variable para gestionar el requestAnimationFrame

/**
 * Aplica la variante con debounce de 1 frame para evitar parpadeos
 * entre secciones contiguas (boundary overlap de ScrollTrigger).
 */
function applyVariant() {
  cancelAnimationFrame(variantRafId);
  
  variantRafId = requestAnimationFrame(() => {
    const shouldHaveVariant = baseVariantActive && darkModeOverrides === 0;
    variantEls.forEach(el => el.classList.toggle(VARIANT, shouldHaveVariant));
  });
}

/**
 * ── EL CORE: INICIALIZACIÓN ROBUSTA ──
 */
const init = () => {
  const mm = gsap.matchMedia();

  // 1. Lógica de Dispositivos (Desktop vs Mobile)
  mm.add({
    isDesktop: "(min-width: 992px)",
    isMobile: "(max-width: 991px)"
  }, (context) => {
    let { isDesktop } = context.conditions;

    // --- ACTIVACIÓN BASE ---
    ScrollTrigger.create({
      trigger: heroBg,
      // Se activa cuando el "bottom" del hero está a 100px de tocar el "top" de la pantalla.
      start: "bottom 100px", 
      onEnter: () => { baseVariantActive = true; applyVariant(); },
      onLeaveBack: () => { baseVariantActive = false; applyVariant(); },
    });

    // --- ANIMACIONES HERO (Solo Desktop) ---
    if (isDesktop && heroBg) {
      const INITIAL_PAD = parseFloat(getComputedStyle(root).getPropertyValue("--_spacing---hero--padding--hero-pad")) || 0;
      const INITIAL_RADIUS = gsap.getProperty(heroBg, "borderRadius");
      let returnPadTween = null;
      let returnRadiusTween = null;

      // Padding
      ScrollTrigger.create({
        start: SCROLL_START,
        end: SCROLL_END,
        scrub: 2,
        onUpdate: (self) => {
          const val = gsap.utils.interpolate(INITIAL_PAD, 0, self.progress);
          root.style.setProperty("--_spacing---hero--padding--hero-pad", `${val}rem`);
        },
        onEnter: () => { if (returnPadTween) returnPadTween.kill(); },
        onLeaveBack: () => {
          const current = parseFloat(root.style.getPropertyValue("--_spacing---hero--padding--hero-pad")) || 0;
          returnPadTween = gsap.to({ val: current }, {
            val: INITIAL_PAD,
            duration: RETURN_DURATION,
            delay: RETURN_DELAY,
            ease: RETURN_EASE,
            onUpdate: function() { root.style.setProperty("--_spacing---hero--padding--hero-pad", `${this.targets()[0].val}rem`); }
          });
        },
      });

      // Radius
      gsap.to(heroBg, {
        borderRadius: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: SCROLL_START,
          end: SCROLL_END,
          scrub: 1.5,
          onEnter: () => { if (returnRadiusTween) returnRadiusTween.kill(); },
          onLeaveBack: () => {
            returnRadiusTween = gsap.to(heroBg, {
              borderRadius: INITIAL_RADIUS,
              duration: RETURN_DURATION,
              delay: RETURN_DELAY,
              ease: RETURN_EASE
            });
          },
        },
      });
    }
  });

  // 2. Secciones Dark Mode (Independiente del breakpoint)
  document.querySelectorAll('[navbar="dark-mode"]').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 80px",
      end: "bottom 80px",
      onEnter: () => { darkModeOverrides++; applyVariant(); },
      onLeave: () => { darkModeOverrides--; applyVariant(); },
      onEnterBack: () => { darkModeOverrides++; applyVariant(); },
      onLeaveBack: () => { darkModeOverrides--; applyVariant(); },
      fastScrollEnd: true
    });
  });

  // 3. RECÁLCULO DE SEGURIDAD
  
  // A. Forzar al terminar de cargar fuentes
  if (document.fonts) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  // B. Forzar si el layout cambia de altura (ResizeObserver)
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(document.body);
};

// Ejecutar cuando todo esté listo
window.addEventListener("load", init);
