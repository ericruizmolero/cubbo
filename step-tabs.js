document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const wrapper = document.querySelector(".step_tabs-wrapper");
  if (!wrapper) return;

  const tabs = Array.from(wrapper.querySelectorAll(".step_tab-layout"));
  const dynamicLine = wrapper.querySelector(".step_general-dynamic");
  const activeLine = wrapper.querySelector(".step_active-tab-line");
  const playPauseBtn = wrapper.querySelector(".step_tabs-playpause");
  const nextBtn = wrapper.querySelector(".step_tabs-next");
  const prevBtn = wrapper.querySelector(".step_tab-prev");

  const iconPlay = playPauseBtn?.querySelector(".icon-play");
  const iconPause = playPauseBtn?.querySelector(".icon-pause");

  // --- CONFIGURACIÓN COMPARTIDA ---
  const TOTAL_TABS = tabs.length; 
  const BREAKPOINT = 992; 

  // --- CONFIGURACIÓN DESKTOP (TIEMPO) ---
  const DURATION_PER_TAB = 6000; 
  const TOTAL_DURATION = DURATION_PER_TAB * TOTAL_TABS;
  const ICON_OFFSET_PX = 23; 
  let currentTime = 0;
  let lastTimestamp = performance.now();
  let isPaused = false;
  let desktopAnimFrame;

  // --- CONFIGURACIÓN MOBILE (SCROLL) ---
  const SCROLL_TRIGGER_VH = 0.65; // La línea imaginaria en el 65% de la pantalla

  // Función Helper: Aplicar/Quitar clases activas
  function toggleActiveClasses(tab, isActive) {
    const selectors = ".step_icon-wrapper, .step_icon-lines-wrapper, .step_line-h, .step_line-v, .step_icon-embed, .step_title, .step_subtitle";
    if (isActive) {
      tab.classList.add("is-active");
      tab.querySelectorAll(selectors).forEach(el => el.classList.add("is-active"));
    } else {
      tab.classList.remove("is-active");
      tab.querySelectorAll(".is-active").forEach(el => el.classList.remove("is-active"));
    }
  }

  // ==========================================
  // MOTOR DESKTOP: Animación por Tiempo
  // ==========================================
  function updateDesktopTimeline(timestamp) {
    if (window.innerWidth < BREAKPOINT) return; 

    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    if (!isPaused) {
      currentTime += deltaTime;
      if (currentTime >= TOTAL_DURATION) currentTime = 0;
    }

    const currentTabIndex = Math.floor(currentTime / DURATION_PER_TAB);
    const tabProgress = (currentTime % DURATION_PER_TAB) / DURATION_PER_TAB;

    let generalPercent = 0;
    if (currentTabIndex < TOTAL_TABS - 1) {
      generalPercent = (currentTabIndex * 20) + (tabProgress * 20);
    } else {
      generalPercent = 80;
    }
    
    if (dynamicLine) {
      dynamicLine.style.height = ""; 
      dynamicLine.style.width = generalPercent + "%";
    }

    if (activeLine) {
      activeLine.style.height = "";
      activeLine.style.width = (tabProgress * 100) + "%";
    }

    const containerWidth = wrapper.offsetWidth || 1; 
    const offsetPercent = (ICON_OFFSET_PX / containerWidth) * 100;

    tabs.forEach((tab, index) => {
      const stationPercent = index * 20; 
      const activationThreshold = index === 0 ? -1 : stationPercent - offsetPercent;
      const isNowActive = generalPercent >= activationThreshold;
      toggleActiveClasses(tab, isNowActive);
    });

    desktopAnimFrame = requestAnimationFrame(updateDesktopTimeline);
  }


  // ==========================================
  // MOTOR MOBILE: Animación por Scroll
  // ==========================================
  function handleMobileScroll() {
    if (window.innerWidth >= BREAKPOINT) return; 

    const rect = wrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    const triggerPoint = windowHeight * SCROLL_TRIGGER_VH;

    let progress = (triggerPoint - rect.top) / rect.height;
    progress = Math.max(0, Math.min(progress, 1)); 

    const generalPercent = progress * 80;

    if (dynamicLine) {
      dynamicLine.style.width = ""; 
      dynamicLine.style.height = generalPercent + "%";
    }

    if (activeLine) {
      activeLine.style.width = "0%";
      activeLine.style.height = "0%"; 
    }

    // MATEMÁTICA DE PRECISIÓN ABSOLUTA:
    // 1. Convertimos la mitad de la estación (1.1rem) a píxeles
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const halfStationPx = 1.1 * remInPx;
    // 2. Calculamos qué porcentaje del wrapper representa ese 1.1rem
    const offsetPercent = (halfStationPx / rect.height) * 100;

    tabs.forEach((tab, index) => {
      const centerPercent = index * 20;
      
      // Restamos el equivalente a 1.1rem para activar el tab cuando la línea toca el top (0rem)
      const activationThreshold = index === 0 ? -1 : centerPercent - offsetPercent;
      
      const isNowActive = generalPercent >= activationThreshold;
      toggleActiveClasses(tab, isNowActive);
    });
  }


  // ==========================================
  // INICIALIZACIÓN Y RESIZE LISTENER
  // ==========================================
  function initMode() {
    if (window.innerWidth >= BREAKPOINT) {
      lastTimestamp = performance.now();
      cancelAnimationFrame(desktopAnimFrame); 
      desktopAnimFrame = requestAnimationFrame(updateDesktopTimeline);
      window.removeEventListener("scroll", handleMobileScroll);
    } else {
      cancelAnimationFrame(desktopAnimFrame);
      window.addEventListener("scroll", handleMobileScroll);
      handleMobileScroll(); 
    }
  }

  window.addEventListener("resize", initMode);

  // ==========================================
  // CONTROLES MANUALES (Solo Desktop)
  // ==========================================
  function jumpToTab(index) {
    if (window.innerWidth < BREAKPOINT) return;
    currentTime = index * DURATION_PER_TAB;
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => jumpToTab(index));
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.innerWidth < BREAKPOINT) return;
    let index = Math.floor(currentTime / DURATION_PER_TAB);
    jumpToTab((index + 1) % TOTAL_TABS);
  });

  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.innerWidth < BREAKPOINT) return;
    let index = Math.floor(currentTime / DURATION_PER_TAB);
    jumpToTab((index - 1 + TOTAL_TABS) % TOTAL_TABS);
  });

  playPauseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.innerWidth < BREAKPOINT) return;
    
    isPaused = !isPaused;
    if (iconPlay && iconPause) {
      iconPlay.style.display = isPaused ? "block" : "none";
      iconPause.style.display = isPaused ? "none" : "block";
    }
  });

  if (iconPlay && iconPause) {
    iconPlay.style.display = isPaused ? "block" : "none";
    iconPause.style.display = isPaused ? "none" : "block";
  }

  initMode();
});
