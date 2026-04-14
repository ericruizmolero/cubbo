document.addEventListener("DOMContentLoaded", () => {
  // 1. SELECTORES PRINCIPALES
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  const skillSection = document.querySelector(".skill_component"); 
  
  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 
  let hasAnimated = false; 

  // --- NUEVAS VARIABLES PARA AUTOPLAY ---
  let autoPlayTimer = null;
  let currentIndex = 2; // Empezamos en el index 2 (la mitad)
  const tiempoAutoplay = 4000; // 4000 = 4 segundos. Cámbialo si lo quieres más rápido o lento.

  // --- 2. PREPARAR TEXTOS ---
  function splitTextToSpans(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.innerText.trim();
      if (!text) return; 
      
      el.innerHTML = '';
      const words = text.split(' ');
      
      words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';
        
        word.split('').forEach(char => {
          const charSpan = document.createElement('span');
          charSpan.innerText = char;
          charSpan.style.display = 'inline-block';
          charSpan.classList.add('anim-char'); 
          wordSpan.appendChild(charSpan);
        });
        
        el.appendChild(wordSpan);
        if (wordIndex < words.length - 1) {
          el.appendChild(document.createTextNode(' '));
        }
      });
    });
  }

  splitTextToSpans('.skill_bottom-left-head h3, .skill_bottom-left-bottom p');

  // --- 3. LÓGICA DE LA OLA ---
  function renderWave(centerIndex) {
    const roundedCenter = Math.round(centerIndex);
    freqs.forEach((piston, idx) => {
      piston.classList.remove("is-active", "is-active-1", "is-active-2");
      const distance = Math.abs(idx - roundedCenter);
      if (distance === 0) piston.classList.add("is-active");
      else if (distance === 1) piston.classList.add("is-active-1");
      else if (distance === 2) piston.classList.add("is-active-2");
    });
  }

  let currentContentAnim = null;

  // --- 4. ANIMACIÓN PRINCIPAL ---
  function goToTab(activeIndex) {
    tabs.forEach(t => t.classList.remove("is-active"));
    if (tabs[activeIndex]) tabs[activeIndex].classList.add("is-active");

    tabContents.forEach((c, index) => {
      if (index !== activeIndex) {
        c.classList.remove("is-active");
        c.style.display = "none";
      }
    });

    const activeContent = tabContents[activeIndex];
    if (activeContent) {
      activeContent.classList.add("is-active");
      activeContent.style.display = "grid"; 
      
      const chars = activeContent.querySelectorAll('.anim-char');
      const images = activeContent.querySelectorAll(
        '.skill_bottom-img-abs:not(.is-opacity-0), .skill_mockup:not(.is-opacity-0), .skill_mockup-abs:not(.is-opacity-0)'
      );

      if (currentContentAnim) currentContentAnim.kill();
      currentContentAnim = gsap.timeline();

      if (chars.length > 0) {
        currentContentAnim.fromTo(chars, 
          { opacity: 0, filter: "blur(10px)" }, 
          { opacity: 1, filter: "blur(0px)", duration: 0.4, stagger: 0.005, ease: "power2.out" }, 
          0
        );
      }

      if (images.length > 0) {
        currentContentAnim.fromTo(images,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.inOut" },
          0
        );
      }
    }

    const targetPiston = tabToPistonMap[activeIndex] || 15; 
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.6, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });
  }

  // --- 5. LÓGICA DE AUTOPLAY ---
  function startAutoPlay() {
    // Evitamos duplicar timers
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    
    autoPlayTimer = setInterval(() => {
      currentIndex++; // Pasamos al siguiente tab
      // Si llegamos al final, volvemos al primero (loop)
      if (currentIndex >= tabs.length) {
        currentIndex = 0;
      }
      goToTab(currentIndex);
    }, tiempoAutoplay);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  // --- 6. INTERSECTION OBSERVER (INICIO AL HACER SCROLL) ---
  const observerOptions = {
    root: null, 
    threshold: 0.3 
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true; 
        currentIndex = 2; // Aseguramos que empiece en la mitad
        goToTab(currentIndex);
        startAutoPlay(); // Arrancamos el carrusel automático
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // --- 7. INICIALIZACIÓN ---
  renderWave(waveProxy.pistonIndex);
  tabContents.forEach(c => c.style.display = "none");

  // Interacciones manuales
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        hasAnimated = true; 
        stopAutoPlay(); // Detenemos el autoplay si el usuario interactúa manualmente
        currentIndex = index; // Actualizamos el índice actual
        goToTab(currentIndex);
    });
  });

  if (skillSection) {
    observer.observe(skillSection);
  } else {
    // Fallback si no se encuentra la sección
    console.warn("GSAP Anim: No se encontró el contenedor '.skill_component'. Forzando inicio y autoplay.");
    goToTab(currentIndex);
    startAutoPlay();
  }
});
