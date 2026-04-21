document.addEventListener('DOMContentLoaded', function() {
  const wrapper = document.querySelector('[data-cascading-slider-wrap]');
  if (!wrapper) return;

  const viewport = wrapper.querySelector('[data-cascading-viewport]');
  const slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
  
  // SELECTORES DE DESTINO (Donde se muestra el texto)
  // Buscamos el div con la clase de Rich Text de Webflow
  const globalTextContainer = wrapper.querySelector('.brand_bottom-text-left .w-richtext'); 
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

    // 2. Control de visibilidad de flechas
    if (isMobile) {
      if (prevBtn) {
        prevBtn.style.opacity = (activeIndex === 0) ? "0.2" : "1";
        prevBtn.style.pointerEvents = (activeIndex === 0) ? "none" : "auto";
      }
      if (nextBtn) {
        nextBtn.style.opacity = (activeIndex === total - 1) ? "0.2" : "1";
        nextBtn.style.pointerEvents = (activeIndex === total - 1) ? "none" : "auto";
      }
    } else {
      if (prevBtn) { prevBtn.style.opacity = "1"; prevBtn.style.pointerEvents = "auto"; }
      if (nextBtn) { nextBtn.style.opacity = "1"; nextBtn.style.pointerEvents = "auto"; }
    }

    // 3. Sincronizar Rich Text y Botón
    const activeSlide = slides[activeIndex];
    
    // SELECTORES DE ORIGEN (El contenido oculto en cada slide)
    const sourceRichText = activeSlide.querySelector('.brand_slide-hidden-text .w-richtext');
    const sourceLink = activeSlide.querySelector('.brand_slide-hidden-link');

    if (globalTextContainer && sourceRichText) {
      const footerLayout = wrapper.querySelector('.brand_bottom-text-layout');
      const yOffset = isMobile ? 0 : 10;

      gsap.to(footerLayout, {
        opacity: 0,
        y: yOffset,
        duration: 0.3,
        onComplete: () => {
          // Inyectamos todo el HTML interno (h5, em, etc.)
          globalTextContainer.innerHTML = sourceRichText.innerHTML;

          if (globalBtn && sourceLink) {
            globalBtn.setAttribute('href', sourceLink.getAttribute('href'));
            if (globalBtnText) globalBtnText.innerText = sourceLink.innerText;
          }
          
          gsap.to(footerLayout, { 
            opacity: 1, 
            y: 0, 
            duration: 0.4, 
            ease: "power2.out" 
          });
        }
      });
    }
  }

  function goTo(idx) {
    if (isAnimating) return;
    const isMobile = window.innerWidth <= 991;
    let nextIdx;

    if (isMobile) {
      nextIdx = Math.max(0, Math.min(total - 1, idx));
    } else {
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

  // Draggable
  const proxy = document.createElement('div');
  Draggable.create(proxy, {
    trigger: viewport,
    type: "x",
    dragClickables: true,
    onDragEnd: function() {
      if (this.x < -60) goTo(activeIndex + 1);
      if (this.x > 60) goTo(activeIndex - 1);
      gsap.set(this.target, { x: 0 });
    }
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
  });

  // Resize
  let windowWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth !== windowWidth) {
      windowWidth = window.innerWidth;
      update();
    }
  });

  update();
});
