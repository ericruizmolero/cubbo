document.addEventListener('DOMContentLoaded', function() {
  const wrapper = document.querySelector('[data-cascading-slider-wrap]');
  if (!wrapper) return;

  const viewport = wrapper.querySelector('[data-cascading-viewport]');
  const slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
  
  const globalTextContainer = wrapper.querySelector('.brand_bottom-text-left h3'); 
  const globalBtn = wrapper.querySelector('.brand_bottom-text-layout .button_icon');
  const globalBtnText = globalBtn ? globalBtn.querySelector('div:first-child') : null;

  const prevBtn = wrapper.querySelector('[data-cascading-slider-prev]');
  const nextBtn = wrapper.querySelector('[data-cascading-slider-next]');

  const total = slides.length;
  let activeIndex = 0;
  let isAnimating = false;

  function update() {
    const isMobile = window.innerWidth <= 991;

    // 1. Lógica de niveles del Acordeón
    slides.forEach((slide, i) => {
      const dist = Math.abs(i - activeIndex);
      let level = dist === 0 ? 1 : (dist === 1 ? 2 : (dist === 2 ? 3 : (dist === 3 ? 4 : 5)));
      slide.setAttribute('data-level', level);
      slide.setAttribute('data-status', level === 1 ? 'active' : 'inactive');
    });

    // 2. Control de visibilidad de flechas en Tablet/Mobile (Sin Loop)
    if (isMobile) {
      if (prevBtn) prevBtn.style.opacity = (activeIndex === 0) ? "0.2" : "1";
      if (prevBtn) prevBtn.style.pointerEvents = (activeIndex === 0) ? "none" : "auto";
      
      if (nextBtn) nextBtn.style.opacity = (activeIndex === total - 1) ? "0.2" : "1";
      if (nextBtn) nextBtn.style.pointerEvents = (activeIndex === total - 1) ? "none" : "auto";
    } else {
      // En Desktop siempre visibles (Loop activado)
      if (prevBtn) { prevBtn.style.opacity = "1"; prevBtn.style.pointerEvents = "auto"; }
      if (nextBtn) { nextBtn.style.opacity = "1"; nextBtn.style.pointerEvents = "auto"; }
    }

    // 3. Sincronizar Texto y Botón
    const activeSlide = slides[activeIndex];
    const sourceText = activeSlide.querySelector('.brand_slide-hidden-text h3');
    const sourceLink = activeSlide.querySelector('.brand_slide-hidden-link');

    if (globalTextContainer && sourceText) {
      const footerLayout = wrapper.querySelector('.brand_bottom-text-layout');
      gsap.to(footerLayout, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        onComplete: () => {
          globalTextContainer.innerHTML = sourceText.innerHTML;
          if (globalBtn && sourceLink) {
            globalBtn.setAttribute('href', sourceLink.getAttribute('href'));
            if (globalBtnText) globalBtnText.innerText = sourceLink.innerText;
          }
          gsap.to(footerLayout, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }
      });
    }
  }

  function goTo(idx) {
    if (isAnimating) return;
    const isMobile = window.innerWidth <= 991;
    let nextIdx;

    if (isMobile) {
      // MÓVIL: Lógica lineal capada (Sin Loop)
      nextIdx = Math.max(0, Math.min(total - 1, idx));
    } else {
      // DESKTOP: Lógica circular (Con Loop)
      nextIdx = (idx + total) % total;
    }

    if (nextIdx === activeIndex) return;

    isAnimating = true;
    activeIndex = nextIdx;
    update();
    
    setTimeout(() => { isAnimating = false; }, 400);
  }

  // EVENTOS
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => goTo(i));
  });

  if (prevBtn) prevBtn.onclick = () => goTo(activeIndex - 1);
  if (nextBtn) nextBtn.onclick = () => goTo(activeIndex + 1);

  const proxy = document.createElement('div');
  Draggable.create(proxy, {
    trigger: viewport,
    type: "x",
    onDragEnd: function() {
      if (this.x < -60) goTo(activeIndex + 1);
      if (this.x > 60) goTo(activeIndex - 1);
      gsap.set(this.target, { x: 0 });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
  });

  // Re-chequear al redimensionar (opcional)
  window.addEventListener('resize', update);

  update();
});
