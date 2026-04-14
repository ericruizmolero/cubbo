document.addEventListener("DOMContentLoaded", () => {
  // 1. SELECTORES PRINCIPALES
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  
  // ASEGÚRATE de que esta clase sea la del contenedor que envuelve toda la sección
  const skillSection = document.querySelector(".skill_component"); 
  
  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 
  let hasAnimated = false; 

  // --- 2. PREPARAR TEXTOS ---
  function splitTextToSpans(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.innerText.trim();
      if (!text) return; // Evita errores si el elemento está vacío
      
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

  // Solo ejecuta si encuentra los elementos
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

    const targetPiston = tabToPistonMap[activeIndex] || 15; // Fallback por si el índice no existe
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.6, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });
  }

  // --- 5. INTERSECTION OBSERVER (AUTO-START) ---
  const observerOptions = {
    root: null, 
    threshold: 0.3 
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true; 
        goToTab(2); // Inicia en la mitad
        observer.unobserve(entry.target); // Dejamos de observar para ahorrar recursos
      }
    });
  }, observerOptions);

  // --- 6. INICIALIZACIÓN Y MEDIDAS DE SEGURIDAD ---
  // Estado inicial off-screen
  renderWave(waveProxy.pistonIndex);
  tabContents.forEach(c => c.style.display = "none");

  // Interacciones manuales
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        hasAnimated = true; // Cancela el auto-start si el usuario hace click antes
        goToTab(index);
    });
  });

  // MEDIDA DE SEGURIDAD: Si la sección existe, la observamos. 
  // Si no existe (error tipográfico en la clase o cambio en el HTML), forzamos el inicio para no romper la web.
  if (skillSection) {
    observer.observe(skillSection);
  } else {
    console.warn("GSAP Anim: No se encontró el contenedor '.skill_component'. Forzando inicio automático.");
    goToTab(2);
  }
});
