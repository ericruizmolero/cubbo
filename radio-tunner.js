document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. SELECTORES Y CONFIGURACIÓN
  // ==========================================
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  const skillSection = document.querySelector(".skill_component"); 

  const prevBtn = document.querySelector(".skill_tabs-prev");
  const nextBtn = document.querySelector(".skill_tabs-next");
  const playPauseBtn = document.querySelector(".skill_tabs-playpause");
  const iconPlay = document.querySelector(".how_icon-play");
  const iconPause = document.querySelector(".how_icon-pause");
  const activeLine = document.querySelector(".skill_active-tab-line");
  const radioLayout = document.querySelector(".skill_radio-layout");

  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 
  let hasAnimated = false; 

  let currentIndex = 2;   
  let isPaused = false; 
  let progressTween = null;
  let currentContentAnim = null;
  const TIME_PER_TAB = 6; 
  const MOBILE_BREAKPOINT = 767; 

  // ==========================================
  // 2. UTILIDADES (ANCHO RADIO)
  // ==========================================
  function syncRadioWidth() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      if (tabs.length > 0 && radioLayout) {
        const remValue = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const adjustment = 5 * remValue; 
        const firstTab = tabs[0];
        const lastTab = tabs[tabs.length - 1];
        let totalWidth = (lastTab.offsetLeft + lastTab.offsetWidth) - firstTab.offsetLeft;
        const finalWidth = Math.max(0, totalWidth - adjustment);
        radioLayout.style.width = `${finalWidth}px`;
      }
    } else {
      if (radioLayout) radioLayout.style.width = "";
    }
  }

  // ==========================================
  // 3. LÓGICA DE LA OLA (PISTONES)
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

  // ==========================================
  // 4. FUNCIÓN MAESTRA (ANIMACIÓN Y CAMBIO)
  // ==========================================
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
      
      // SOLUCIÓN: Buscamos directamente el h3 y el p completos
      const textBlocks = activeContent.querySelectorAll('.skill_bottom-left-head h3, .skill_bottom-left-bottom p');
      const images = activeContent.querySelectorAll(
        '.skill_bottom-img-abs:not(.is-opacity-0), .skill_mockup:not(.is-opacity-0), .skill_mockup-abs:not(.is-opacity-0)'
      );

      if (currentContentAnim) currentContentAnim.kill();
      currentContentAnim = gsap.timeline();

      // ANIMACIÓN BLUR PARA BLOQUES DE TEXTO COMPLETOS
      if (textBlocks.length > 0) {
        currentContentAnim.fromTo(textBlocks, 
          { 
            opacity: 0, 
            filter: "blur(10px)", 
            y: 15 // Entran desde un poquito más abajo
          }, 
          { 
            opacity: 1, 
            filter: "blur(0px)", 
            y: 0,
            duration: 0.8, 
            stagger: 0.15, // Primero entra el h3, luego el p
            ease: "power3.out" 
          }, 
          0
        );
      }

      if (images.length > 0) {
        currentContentAnim.fromTo(images,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "power2.inOut" },
          0.1
        );
      }
    }

    const targetPiston = tabToPistonMap[activeIndex] || 15; 
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.8, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });

    if (progressTween) progressTween.kill();
    if (activeLine) {
      progressTween = gsap.fromTo(activeLine, 
        { width: "0%" }, 
        { 
          width: "100%", 
          duration: TIME_PER_TAB, 
          ease: "none",
          onComplete: () => {
            if (!isPaused) {
              currentIndex = (currentIndex + 1) % tabs.length;
              goToTab(currentIndex);
            }
          }
        }
      );
      if (isPaused) progressTween.pause();
    }

    if (window.innerWidth <= MOBILE_BREAKPOINT) { 
      const stepDist = tabs.length > 1 ? (tabs[1].offsetLeft - tabs[0].offsetLeft) : 0;
      const centerIndex = Math.floor(tabs.length / 2);
      const shiftX = (centerIndex - activeIndex) * stepDist;
      gsap.to([tabs, radioLayout], { x: shiftX, duration: 0.6, ease: "power2.inOut", overwrite: "auto" });
    } else {
      gsap.to([tabs, radioLayout], { x: 0, duration: 0.4 });
    }
  }

  // ==========================================
  // 5. EVENTOS (CLICKS Y CONTROLES)
  // ==========================================
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      hasAnimated = true; 
      currentIndex = index; 
      goToTab(currentIndex);
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % tabs.length;
      goToTab(currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      goToTab(currentIndex);
    });
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      isPaused = !isPaused;
      
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPaused ? "block" : "none";
        iconPause.style.display = isPaused ? "none" : "block";
      }
      
      if (progressTween) {
        if (isPaused) progressTween.pause();
        else progressTween.play();
      }
    });
  }

  window.addEventListener("resize", () => {
    syncRadioWidth(); 
    if (hasAnimated) {
       if (window.innerWidth <= MOBILE_BREAKPOINT) {
          const stepDist = tabs.length > 1 ? (tabs[1].offsetLeft - tabs[0].offsetLeft) : 0;
          const centerIndex = Math.floor(tabs.length / 2);
          const shiftX = (centerIndex - currentIndex) * stepDist;
          gsap.set([tabs, radioLayout], { x: shiftX });
       } else {
          gsap.set([tabs, radioLayout], { x: 0 });
       }
    }
  });

  // ==========================================
  // 6. INICIALIZACIÓN Y OBSERVER
  // ==========================================
  const observerOptions = { root: null, threshold: 0.3 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true; 
        syncRadioWidth(); 
        goToTab(currentIndex); 
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  renderWave(waveProxy.pistonIndex);
  tabContents.forEach(c => c.style.display = "none");

  if (iconPlay && iconPause) {
    iconPlay.style.display = isPaused ? "block" : "none";
    iconPause.style.display = isPaused ? "none" : "block";
  }

  if (skillSection) {
    observer.observe(skillSection);
  } else {
    syncRadioWidth();
    goToTab(currentIndex);
  }
});
