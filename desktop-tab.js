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
    // Forzamos reflow para asegurar que el navegador registre el estado 0
    progressLine.offsetWidth;
  }

  function startLine(interval, fromProgress = 0) {
    if (!progressLine) return;
    const remaining = interval * (1 - fromProgress);
    
    progressLine.style.transition = "none";
    progressLine.style.transform = `scaleX(${fromProgress})`;
    
    progressLine.offsetWidth; // Reflow crítico

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

  function scheduleAdvance(menu, index, interval) {
    // Limpiamos cualquier timer previo para evitar duplicados
    clearTimeout(timers[index]);
    
    timers[index] = setTimeout(() => {
      if (!isDesktop() || isPaused) return;
      
      const current = menu.querySelector(":scope > .w--current");
      if (!current) return;
      
      const next = current.nextElementSibling || menu.firstChild;
      
      if (next) {
        // Al disparar el clic, el listener del tab ejecutará resetTimer()
        // lo que reiniciará la línea y el siguiente ciclo.
        next.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
      }
    }, interval);
  }

  tabMenus.forEach((menu, index) => {
    const tabs = menu.querySelectorAll(":scope > *");
    const interval = 1000 * Number(menu.getAttribute(ATTR));
    const pauseOnHover = menu.getAttribute("pause-on-hover");

    function startCycle() {
      resetLine();
      startLine(interval);
      scheduleAdvance(menu, index, interval);
    }

    function resetTimer() {
      clearTimeout(timers[index]);
      linePausedAt = 0;
      if (!isPaused) {
        startCycle();
      } else {
        resetLine();
      }
    }

    if (pauseOnHover) {
      menu.addEventListener("mouseenter", () => {
        if (!isPaused) {
          clearTimeout(timers[index]);
          pauseLine();
        }
      });
      menu.addEventListener("mouseleave", () => {
        if (!isPaused) {
          const remainingTime = interval * (1 - linePausedAt);
          scheduleAdvance(menu, index, remainingTime);
          resumeLine(interval);
        }
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        // IMPORTANTE: Esto unifica el comportamiento del clic automático y el manual
        // pero solo reinicia el timer global si es un clic real o el disparado por nosotros
        resetTimer();
      });
    });

    // Inicio inicial
    startCycle();
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
          // Si retomamos, calculamos el tiempo restante basado en la posición de la línea
          const remainingTime = interval * (1 - linePausedAt);
          scheduleAdvance(menu, index, remainingTime);
          resumeLine(interval);
        }
      });
    });
    
    setIcon(true);
  }
});
