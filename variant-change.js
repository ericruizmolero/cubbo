gsap.registerPlugin(ScrollTrigger);

const SCROLL_START = 50;
const SCROLL_END   = 120;
const VARIANT      = "w-variant-f049b74e-d8ad-85d2-d7dd-dc2b9d25238d";
const root         = document.body;
const heroBg       = document.querySelector(".hero_bg-color");

const variantEls = document.querySelectorAll([
  ".navbar_layout",
  ".navbar_logo",
  ".navbar_link",
  ".navbar_button-plain",
  ".navbar_button-icon",
  ".navbar_cursor",
  ".navbar_button",
  ".first_mobile-ham",
  ".first-mobile-nav_ham-line-1",
  ".first-mobile-nav_ham-line-2"
].join(", "));

const RETURN_DURATION = 1.5;
const RETURN_DELAY    = 1.5;
const RETURN_EASE     = "power2.out";

// ── Variant state management ──────────────────────────────
// baseVariantActive  → el scroll principal ha cruzado el threshold
// darkModeOverrides  → contador de secciones dark-mode que el navbar está solapando
// La variante se aplica solo si base=true Y overrides=0

let baseVariantActive = false;
let darkModeOverrides = 0;  // counter para soportar múltiples secciones solapadas

function applyVariant() {
  const shouldHaveVariant = baseVariantActive && darkModeOverrides === 0;
  variantEls.forEach(el => el.classList.toggle(VARIANT, shouldHaveVariant));
}

// ── 1. Variant class toggle ───────────────────────────────
const mm2 = gsap.matchMedia();

mm2.add("(min-width: 992px)", () => {
  ScrollTrigger.create({
    start:       () => Math.min(window.innerHeight + 220, parseFloat(getComputedStyle(document.documentElement).fontSize) * 60),
    onEnter:     () => { baseVariantActive = true;  applyVariant(); },
    onLeaveBack: () => { baseVariantActive = false; applyVariant(); },
  });
});

mm2.add("(max-width: 991px)", () => {
  ScrollTrigger.create({
    start:       () => window.innerHeight - 200,
    onEnter:     () => { baseVariantActive = true;  applyVariant(); },
    onLeaveBack: () => { baseVariantActive = false; applyVariant(); },
  });
});

// ── Dark-mode sections override ───────────────────────────
// Cuando el top de la sección queda a 60px del top del viewport
// el navbar entra en la sección → suprimimos la variante mientras esté ahí.

document.querySelectorAll('[navbar="dark-mode"]').forEach(section => {
  ScrollTrigger.create({
    trigger: section,
    start: "top 60px",   // top de la sección a 60px del viewport top
    end:   "bottom 60px",
    onEnter:      () => { darkModeOverrides++; applyVariant(); },
    onLeave:      () => { darkModeOverrides--; applyVariant(); },
    onEnterBack:  () => { darkModeOverrides++; applyVariant(); },
    onLeaveBack:  () => { darkModeOverrides--; applyVariant(); },
  });
});

// ── 2 & 3. Padding + radius — desktop only (≥992px) ───────
const mm = gsap.matchMedia();

mm.add("(min-width: 992px)", () => {

  const INITIAL_PAD = parseFloat(
    getComputedStyle(root).getPropertyValue("--_spacing---hero--padding--hero-pad")
  );
  root.style.setProperty("--_spacing---hero--padding--hero-pad", `${INITIAL_PAD}rem`);

  const INITIAL_RADIUS = gsap.getProperty(heroBg, "borderRadius");

  let returnPadTween    = null;
  let returnRadiusTween = null;

  // ── 2. CSS variable: INITIAL_PAD → 0rem ────────────────
  ScrollTrigger.create({
    start: SCROLL_START,
    end:   SCROLL_END,
    scrub: 2,
    onUpdate: (self) => {
      const val = gsap.utils.interpolate(INITIAL_PAD, 0, self.progress);
      root.style.setProperty("--_spacing---hero--padding--hero-pad", `${val}rem`);
    },
    onEnter: () => {
      if (returnPadTween) { returnPadTween.kill(); returnPadTween = null; }
    },
    onLeaveBack: () => {
      if (returnPadTween) { returnPadTween.kill(); returnPadTween = null; }
      const current = parseFloat(
        root.style.getPropertyValue("--_spacing---hero--padding--hero-pad")
      ) || 0;
      returnPadTween = gsap.to({ val: current }, {
        val:      INITIAL_PAD,
        duration: RETURN_DURATION,
        delay:    RETURN_DELAY,
        ease:     RETURN_EASE,
        onUpdate: function () {
          root.style.setProperty(
            "--_spacing---hero--padding--hero-pad",
            `${this.targets()[0].val}rem`
          );
        },
        onComplete: () => { returnPadTween = null; },
      });
    },
  });

  // ── 3. Border-radius hero_bg-color → 0px ───────────────
  gsap.to(heroBg, {
    borderRadius: 0,
    ease: "none",
    scrollTrigger: {
      start: SCROLL_START,
      end:   SCROLL_END,
      scrub: 1.5,
      onEnter: (self) => {
        if (returnRadiusTween) { returnRadiusTween.kill(); returnRadiusTween = null; }
        self.animation.resume();
        self.animation.progress(self.progress);
      },
      onLeaveBack: (self) => {
        self.animation.pause();
        returnRadiusTween = gsap.to(heroBg, {
          borderRadius: INITIAL_RADIUS,
          duration: RETURN_DURATION,
          delay:    RETURN_DELAY,
          ease:     RETURN_EASE,
          onComplete: () => { returnRadiusTween = null; },
        });
      },
    },
  });

  return () => {
    if (returnPadTween)    { returnPadTween.kill();    returnPadTween    = null; }
    if (returnRadiusTween) { returnRadiusTween.kill(); returnRadiusTween = null; }
    root.style.removeProperty("--_spacing---hero--padding--hero-pad");
    gsap.set(heroBg, { borderRadius: INITIAL_RADIUS });
  };
});
