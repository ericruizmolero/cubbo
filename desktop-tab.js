document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const ATTR = "r-automatic-tabs";
  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  const tabMenus = document.querySelectorAll(`[${ATTR}]`);
  const playPauseBtn = document.querySelector(".client_tabs-playpause");
  const arrowWrap = document.querySelector(".client_arrow-wrap");
  const iconPlay = document.querySelector(".client_tabs-playpause .icon-play");
  const iconPause = document.querySelector(".client_tabs-playpause .icon-pause");
  const progressLine = document.querySelector(".client_active-tab-line");

  // NUEVO: Seleccionar las flechas de navegación
  const arrows = document.querySelectorAll(".client_arrow-next, .client_arrow-prev, .client_arrow-wrap");

  let isPaused = false;
  let linePausedAt = 0;
  const timers = {};

  if (progressLine) {
    progressLine.style.width = "100%";
    progressLine.style.transformOrigin = "left center";
    progressLine.style.transform = "scaleX(0)";
    progressLine.style.transition = "none";
  }

  function setIcon(playing) {
    if (!iconPlay || !iconPause) return;
    iconPlay.style.display = playing ? "none" : "block";
    iconPause.style.display = playing ? "block" : "none";
  }

  function resetLine() {
    if (!progressLine) return;
    progressLine.style.transition = "none";
    progressLine.style.transform = "scaleX(0)";
    progressLine.offsetWidth; 
  }

  function startLine(interval, fromProgress = 0) {
    if (!progressLine) return;
    const remaining = interval * (1 - fromProgress);
    progressLine.style.transition = "none";
    progressLine.style.transform = `scaleX(${fromProgress})`;
    progressLine.offsetWidth; 
    progressLine.style.transition = `transform ${remaining}ms linear`;
    progressLine.style.transform = "scaleX(1)";
  }

  function pauseLine() {
    if (!progressLine) return;
    const matrix = getComputedStyle(progressLine).transform;
    const scaleX = matrix === "none" ? 0 : parseFloat(matrix.split(",")[0].replace("matrix(", ""));
    linePausedAt = Math.min(Math.max(scaleX, 0), 1);
    progressLine.style.transition = "none";
    progressLine.style.transform = `scaleX(${linePausedAt})`;
  }

  function resumeLine(interval) {
    startLine(interval, linePausedAt);
    linePausedAt = 0;
  }

  function scheduleAdvance(menu, index, delay) {
    timers[index] = setTimeout(() => {
      if (!isDesktop() || isPaused) return;
      const current = menu.querySelector(":scope > .w--current");
      if (!current) return;
      const next = current.nextElementSibling || menu.firstChild;
      
      if (next) {
        // Disparo manual para evitar scroll en Safari
        next.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
      }
    }, delay);
  }

  tabMenus.forEach((menu, index) => {
    const tabs = menu.querySelectorAll(":scope > *");
    const interval = 1000 * Number(menu.getAttribute(ATTR));
    const pauseOnHover = menu.getAttribute("pause-on-hover");

    function resetTimer() {
      clearTimeout(timers[index]);
      resetLine();
      linePausedAt = 0;
      if (!isPaused) {
        scheduleAdvance(menu, index, interval);
        startLine(interval);
      }
    }

    // 1. Escuchar clics en los Tabs
    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        // No detenemos propagación para que Webflow se entere, 
        // pero reseteamos nuestro timer.
        if (pauseOnHover && menu.matches(":hover") && e.isTrusted) return;
        resetTimer();
      });
    });

    // 2. Escuchar clics en las Flechas (Resetea la línea)
    arrows.forEach(arrow => {
      arrow.addEventListener("click", () => {
        resetTimer();
      });
    });

    if (pauseOnHover) {
      menu.addEventListener("mouseover", () => {
        clearTimeout(timers[index]);
        pauseLine();
      });
      menu.addEventListener("mouseout", () => {
        if (!isPaused) {
          scheduleAdvance(menu, index, interval * (1 - linePausedAt));
          resumeLine(interval);
        }
      });
    }

    // Inicio inicial
    resetLine();
    scheduleAdvance(menu, index, interval);
    startLine(interval);
  });

  if (playPauseBtn) {
    playPauseBtn.style.pointerEvents = "all";
    playPauseBtn.style.cursor = "pointer";
    const clickTarget = arrowWrap || playPauseBtn;

    clickTarget.addEventListener("click", (e) => {
      if (!e.target.closest(".client_tabs-playpause")) return;
      if (!isDesktop()) return;

      isPaused = !isPaused;
      setIcon(!isPaused);

      tabMenus.forEach((menu, index) => {
        const interval = 1000 * Number(menu.getAttribute(ATTR));
        if (isPaused) {
          clearTimeout(timers[index]);
          pauseLine();
        } else {
          scheduleAdvance(menu, index, interval * (1 - linePausedAt));
          resumeLine(interval);
        }
      });
    });

    setIcon(true);
  }
});
