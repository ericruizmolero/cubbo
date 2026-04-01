document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const ATTR = "custom-automatic-tabs";
  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  // --- 1. Verificación de visibilidad (Evita cambios si no se ve) ---
  function isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight)
    );
  }

  const tabMenus = document.querySelectorAll(`[${ATTR}]`);
  const progressLine = document.querySelector(".client_active-tab-line");
  let isPaused = false;
  let linePausedAt = 0;
  const timers = {};

  // --- Helpers de Línea de Progreso ---
  function initLineEl(el) {
    if (!el) return;
    el.style.width = "100%";
    el.style.transformOrigin = "left center";
    el.style.transform = "scaleX(0)";
    el.style.transition = "none";
  }

  function startLineEl(el, interval, fromProgress = 0) {
    if (!el) return;
    const remaining = interval * (1 - fromProgress);
    el.style.transition = "none";
    el.style.transform = `scaleX(${fromProgress})`;
    el.offsetWidth; 
    el.style.transition = `transform ${remaining}ms linear`;
    el.style.transform = "scaleX(1)";
  }

  function pauseLineEl(el) {
    if (!el) return 0;
    const matrix = getComputedStyle(el).transform;
    const scaleX = matrix === "none" ? 0 : parseFloat(matrix.split(",")[0].replace("matrix(", ""));
    const clamped = Math.min(Math.max(scaleX, 0), 1);
    el.style.transition = "none";
    el.style.transform = `scaleX(${clamped})`;
    return clamped;
  }

  function getActiveTabLine(menu) {
    const current = menu.querySelector(":scope > .w--current");
    return current ? current.querySelector(".client_each-active-tab-line") : null;
  }

  // --- Lógica de Avance Blindada ---
  function scheduleAdvance(menu, index, delay) {
    timers[index] = setTimeout(() => {
      if (!isDesktop() || isPaused) return;

      // Si la sección no está en pantalla, no disparamos el click
      if (!isInViewport(menu)) {
        scheduleAdvance(menu, index, 1000); 
        return;
      }

      const current = menu.querySelector(":scope > .w--current");
      if (!current) return;
      const next = current.nextElementSibling || menu.firstChild;

      if (next) {
        // --- PROTECCIÓN EXTRA PARA SAFARI ---
        const autoClickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });

        // Bloqueamos que el evento llegue al motor de scroll de Webflow/Safari
        autoClickEvent.preventDefault = function() {}; 
        
        next.dispatchEvent(autoClickEvent);
      }
    }, delay);
  }

  tabMenus.forEach((menu, index) => {
    const interval = 1000 * Number(menu.getAttribute(ATTR));
    const tabs = menu.querySelectorAll(":scope > *");
    
    // Inicializar líneas
    tabs.forEach(tab => initLineEl(tab.querySelector(".client_each-active-tab-line")));
    if (progressLine) initLineEl(progressLine);

    // Listener para clicks manuales (aquí sí permitimos propagación)
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        clearTimeout(timers[index]);
        // Reinicio de lógica tras click manual...
        scheduleAdvance(menu, index, interval);
      });
    });

    // Inicio inicial
    scheduleAdvance(menu, index, interval);
    if (progressLine) startLineEl(progressLine, interval);
    requestAnimationFrame(() => startLineEl(getActiveTabLine(menu), interval));
  });
});
