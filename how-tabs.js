document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const ATTR = "second-automatic-tabs";
  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  const tabMenus = document.querySelectorAll(`[${ATTR}]`);
  const playPauseBtn = document.querySelector(".how_tabs-playpause");
  const prevBtn = document.querySelector(".how_tabs-prev");
  const nextBtn = document.querySelector(".how_tabs-next");
  const globalLine = document.querySelector(".how_active-tab-line");
  
  // NUEVO: Inicia en true para que el slider arranque en pausa
  let isGlobalPaused = true; 
  const state = new Map();

  // --- 1. Helpers de Líneas ---
  function getTabLine(tab) { return tab.querySelector('[class*="how_tab-link-line-"]'); }

  function resetBar(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "0%";
  }

  function startBar(el, duration, fromPercent = 0) {
    if (!el) return;
    const remainingTime = duration * (1 - (fromPercent / 100));
    el.style.transition = "none";
    el.style.width = `${fromPercent}%`;
    el.offsetWidth; 
    el.style.transition = `width ${remainingTime}ms linear`;
    el.style.width = "100%";
  }

  function pauseBar(el) {
    if (!el) return 0;
    const widthPx = parseFloat(window.getComputedStyle(el).width) || 0;
    const parentWidthPx = el.parentElement.offsetWidth || 1;
    const percent = (widthPx / parentWidthPx) * 100;
    el.style.transition = "none";
    el.style.width = `${percent}%`;
    return percent;
  }

  function resetAllLines(menu) {
    menu.querySelectorAll(".how_tab-link").forEach(tab => resetBar(getTabLine(tab)));
    resetBar(globalLine);
  }

  // --- 2. Silent Click Blindado (Anti-Scroll Safari) ---
  function silentClick(element) {
    if (!element) return;
    
    const originalTabIndex = element.getAttribute("tabindex");
    element.setAttribute("tabindex", "-1");
    element.style.outline = "none"; 

    const event = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      composed: true
    });

    element.dispatchEvent(event);
    element.blur();

    if (originalTabIndex !== null) element.setAttribute("tabindex", originalTabIndex);
    else element.removeAttribute("tabindex");
  }

  function runCycle(menu) {
    const data = state.get(menu);
    const duration = (Number(menu.getAttribute(ATTR)) || 6) * 1000;
    clearTimeout(data.timer);
    if (isGlobalPaused) return;

    const remainingTime = duration * (1 - (data.progress / 100));
    data.timer = setTimeout(() => {
      const tabs = Array.from(menu.querySelectorAll(".how_tab-link"));
      const current = menu.querySelector(".w--current");
      let currentIndex = tabs.indexOf(current);
      if (currentIndex === -1) currentIndex = 0;
      const nextIndex = (currentIndex + 1) % tabs.length;
      
      resetAllLines(menu);
      data.progress = 0;
      silentClick(tabs[nextIndex]);
    }, remainingTime);
  }

  // --- 3. Inicialización de los Tabs ---
  tabMenus.forEach((menu) => {
    const duration = (Number(menu.getAttribute(ATTR)) || 6) * 1000;
    state.set(menu, { timer: null, progress: 0 });

    const tabs = Array.from(menu.querySelectorAll(".how_tab-link"));
    resetAllLines(menu);

    tabs.forEach(tab => {
      tab.removeAttribute("href"); 

      tab.addEventListener("click", (e) => {
        if (e.isTrusted) { 
            // Click humano
        }
        
        e.preventDefault(); 

        const data = state.get(menu);
        clearTimeout(data.timer);
        resetAllLines(menu);
        data.progress = 0;

        if (!isGlobalPaused) {
          startBar(getTabLine(tab), duration, 0);
          startBar(globalLine, duration, 0);
          runCycle(menu);
        }

        setTimeout(() => {
          if (window.location.hash.includes("w-tabs-")) {
            history.replaceState(null, null, window.location.pathname + window.location.search);
          }
        }, 10);
      });
    });

    const initialTab = menu.querySelector(".w--current") || tabs[0];
    if (initialTab && !isGlobalPaused) {
      startBar(getTabLine(initialTab), duration, 0);
      startBar(globalLine, duration, 0);
      runCycle(menu);
    }
  });

  // --- 4. Play / Pause ---
  if (playPauseBtn) {
    const iconPlay = playPauseBtn.querySelector(".how_icon-play");
    const iconPause = playPauseBtn.querySelector(".how_icon-pause");

    // NUEVO: Configurar la visualización inicial de los iconos
    if (iconPlay && iconPause) {
      iconPlay.style.setProperty("display", "block", "important"); // Mostrar Play al inicio
      iconPause.style.setProperty("display", "none", "important");  // Ocultar Pause al inicio
    }

    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); 
      isGlobalPaused = !isGlobalPaused;

      if (iconPlay && iconPause) {
        iconPlay.style.setProperty("display", isGlobalPaused ? "block" : "none", "important");
        iconPause.style.setProperty("display", isGlobalPaused ? "none" : "block", "important");
      }

      tabMenus.forEach(menu => {
        const data = state.get(menu);
        const currentTab = menu.querySelector(".w--current");
        const duration = (Number(menu.getAttribute(ATTR)) || 6) * 1000;

        if (isGlobalPaused) {
          clearTimeout(data.timer);
          data.progress = pauseBar(getTabLine(currentTab));
          pauseBar(globalLine); 
        } else {
          startBar(getTabLine(currentTab), duration, data.progress);
          startBar(globalLine, duration, data.progress);
          runCycle(menu);
        }
      });
    });
  }

  // --- 5. Flechas ---
  function handleArrow(direction) {
    tabMenus.forEach(menu => {
      const tabs = Array.from(menu.querySelectorAll(".how_tab-link"));
      const current = menu.querySelector(".w--current");
      let currentIndex = tabs.indexOf(current);
      if (currentIndex === -1) currentIndex = 0;
      let targetIndex = (direction === 'next') 
        ? (currentIndex + 1) % tabs.length 
        : (currentIndex - 1 + tabs.length) % tabs.length;
      
      silentClick(tabs[targetIndex]);
    });
  }

  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); handleArrow('next'); });
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); handleArrow('prev'); });
});
