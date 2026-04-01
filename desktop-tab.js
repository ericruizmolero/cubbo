document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const ATTR = "custom-automatic-tabs";
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

  // --- Generic line helpers (work on any element) ---

  function initLineEl(el) {
    if (!el) return;
    el.style.width = "100%";
    el.style.transformOrigin = "left center";
    el.style.transform = "scaleX(0)";
    el.style.transition = "none";
  }

  function resetLineEl(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "scaleX(0)";
    el.offsetWidth;
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

  // --- Global line wrappers (maintain linePausedAt) ---

  function resetLine() { resetLineEl(progressLine); }

  function startLine(interval, fromProgress = 0) {
    startLineEl(progressLine, interval, fromProgress);
  }

  function pauseLine() {
    linePausedAt = pauseLineEl(progressLine);
  }

  function resumeLine(interval) {
    startLineEl(progressLine, interval, linePausedAt);
    linePausedAt = 0;
  }

  // --- Per-tab line helpers ---

  function getActiveTabLine(menu) {
    const current = menu.querySelector(":scope > .w--current");
    return current ? current.querySelector(".client_each-active-tab-line") : null;
  }

  function resetAllTabLines(menu) {
    menu.querySelectorAll(".client_each-active-tab-line").forEach(el => resetLineEl(el));
  }

  // Init global line
  initLineEl(progressLine);

  function setIcon(playing) {
    if (!iconPlay || !iconPause) return;
    iconPlay.style.display = playing ? "none" : "block";
    iconPause.style.display = playing ? "block" : "none";
  }

  function scheduleAdvance(menu, index, delay) {
    timers[index] = setTimeout(() => {
      if (!isDesktop() || isPaused) return;
      const current = menu.querySelector(":scope > .w--current");
      if (!current) return;
      const next = current.nextElementSibling || menu.firstChild;
      if (next) {
        next.dispatchEvent(new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        }));
      }
    }, delay);
  }

  tabMenus.forEach((menu, index) => {
    const tabs = menu.querySelectorAll(":scope > *");
    const interval = 1000 * Number(menu.getAttribute(ATTR));
    const pauseOnHover = menu.getAttribute("pause-on-hover");

    // Init all per-tab lines upfront
    tabs.forEach(tab => initLineEl(tab.querySelector(".client_each-active-tab-line")));

    function resetTimer() {
      clearTimeout(timers[index]);
      resetLine();
      resetAllTabLines(menu);
      linePausedAt = 0;
      if (!isPaused) {
        scheduleAdvance(menu, index, interval);
        startLine(interval);
        // Defer one frame so Webflow has time to apply .w--current
        requestAnimationFrame(() => {
          startLineEl(getActiveTabLine(menu), interval);
        });
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        if (pauseOnHover && menu.matches(":hover") && e.isTrusted) return;
        resetTimer();
      });
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".client_tabs-prev") || e.target.closest(".client_tabs-next")) {
        resetTimer();
      }
    });

    if (pauseOnHover) {
      menu.addEventListener("mouseover", () => {
        clearTimeout(timers[index]);
        pauseLine();
        pauseLineEl(getActiveTabLine(menu));
      });
      menu.addEventListener("mouseout", () => {
        if (!isPaused) {
          const savedProgress = linePausedAt;
          scheduleAdvance(menu, index, interval * (1 - savedProgress));
          resumeLine(interval);
          requestAnimationFrame(() => {
            startLineEl(getActiveTabLine(menu), interval, savedProgress);
          });
        }
      });
    }

    // Initial start
    scheduleAdvance(menu, index, interval);
    startLine(interval);
    requestAnimationFrame(() => {
      startLineEl(getActiveTabLine(menu), interval);
    });
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
          pauseLineEl(getActiveTabLine(menu));
        } else {
          const savedProgress = linePausedAt;
          scheduleAdvance(menu, index, interval * (1 - savedProgress));
          resumeLine(interval);
          requestAnimationFrame(() => {
            startLineEl(getActiveTabLine(menu), interval, savedProgress);
          });
        }
      });
    });

    setIcon(true);
  }
});
