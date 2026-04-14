document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. SELECTORES PRINCIPALES
  // ==========================================
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  const skillSection = document.querySelector(".skill_component"); 

  // Nuevos selectores de controles
  const prevBtn = document.querySelector(".skill_tabs-prev");
  const nextBtn = document.querySelector(".skill_tabs-next");
  const playPauseBtn = document.querySelector(".skill_tabs-playpause");
  const iconPlay = document.querySelector(".how_icon-play");
  const iconPause = document.querySelector(".how_icon-pause");
  const activeLine = document.querySelector(".skill_active-tab-line");

  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 
  let hasAnimated = false; 

  // Variables de Estado para Autoplay
  let currentIndex = 2; // Inicia en la mitad
  let isPaused = false; 
  let progressTween = null;
  const TIME_PER_TAB = 4; // Segundos que tarda en llenarse la línea y cambiar de tab

  // ==========================================
  // 2. PREPARAR TEXTOS
  // ==========================================
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

  // ==========================================
  // 3. LÓGICA DE LA OLA (FRECUENCIAS)
  // ==========================================
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

  // ==========================================
  // 4. ANIMACIÓN PRINCIPAL Y LÍNEA DE PROGRESO
  // ==========================================
  function goToTab(activeIndex) {
    // Actualizar visualmente los tabs
    tabs.forEach(t => t.classList.remove("is-active"));
    if (tabs[activeIndex]) tabs[activeIndex].classList.add("is-active");

    // Ocultar contenidos inactivos
    tabContents.forEach((c, index) => {
      if (index !== activeIndex) {
        c.classList.remove("is-active");
        c.style.display = "none";
      }
    });

    // Mostrar el contenido activo y animarlo
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

    // Animar la ola
    const targetPiston = tabToPistonMap[activeIndex] || 15; 
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.6, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });

    // GESTIONAR LA LÍNEA DE PROGRESO Y AUTOPLAY
    if (progressTween) progressTween.kill(); // Matamos la animación anterior de la línea

    if (activeLine) {
      progressTween = gsap.fromTo(activeLine, 
        { width: "0%" }, 
        { 
          width: "100%", 
          duration: TIME_PER_TAB, 
          ease: "none",
          onComplete: () => {
            // Cuando la línea llega al 100%, pasa al siguiente tab automáticamente
            if (!isPaused) {
              currentIndex = (currentIndex + 1) % tabs.length;
              goToTab(currentIndex);
            }
          }
        }
      );

      // Si estaba pausado, congelamos la línea de inmediato
      if (isPaused) progressTween.pause();
    }
  }

  // ==========================================
  // 5. EVENTOS DE LOS CONTROLES MANUALES
  // ==========================================
  
  // Click en un tab específico
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        hasAnimated = true; 
        currentIndex = index; 
        goToTab(currentIndex);
    });
  });

  // Botón Siguiente
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % tabs.length;
      goToTab(currentIndex);
    });
  }

  // Botón Previo
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      goToTab(currentIndex);
    });
  }

  // Botón Play/Pause
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      isPaused = !isPaused;

      // Intercambiar los iconos
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPaused ? "block" : "none";
        iconPause.style.display = isPaused ? "none" : "block";
      }

      // Pausar o reanudar la línea de progreso
      if (progressTween) {
        if (isPaused) {
          progressTween.pause();
        } else {
          progressTween.play();
        }
      }
    });
  }

  // Estado visual inicial de los iconos
  if (iconPlay && iconPause) {
    iconPlay.style.display = isPaused ? "block" : "none";
    iconPause.style.display = isPaused ? "none" : "block";
  }

  // ==========================================
  // 6. INTERSECTION OBSERVER (AUTO-START)
  // ==========================================
  const observerOptions = {
    root: null, 
    threshold: 0.3 
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true; 
        goToTab(currentIndex); 
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // ==========================================
  // 7. INICIALIZACIÓN
  // ==========================================
  renderWave(waveProxy.pistonIndex);
  tabContents.forEach(c => c.style.display = "none");

  if (skillSection) {
    observer.observe(skillSection);
  } else {
    console.warn("GSAP Anim: No se encontró el contenedor. Forzando inicio.");
    goToTab(currentIndex);
  }
});
