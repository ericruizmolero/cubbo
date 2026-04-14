document.addEventListener("DOMContentLoaded", () => {
  const arrowWrap = document.querySelector(".skill_arrow-wrap");

  function updateArrowPosition() {
    const activeImgBox = document.querySelector(".skill_tab-content.is-active .skill_bottom-right");
    
    if (!arrowWrap || !activeImgBox || window.innerWidth > 991) {
      if (arrowWrap) arrowWrap.style.cssText = ""; 
      return;
    }

    // 1. Calculamos solo la altura real de la imagen/bloque en píxeles
    const imgHeight = activeImgBox.offsetHeight;
    
    // 2. Usamos calc() de CSS para restarle 1rem directamente
    arrowWrap.style.setProperty("position", "absolute", "important");
    arrowWrap.style.setProperty("bottom", `calc(${imgHeight}px - 2rem)`, "important");
    
    // Limpiamos el resto para evitar conflictos
    arrowWrap.style.setProperty("top", "auto", "important"); 
    arrowWrap.style.setProperty("right", "1rem", "important");
    arrowWrap.style.setProperty("left", "auto", "important");
    arrowWrap.style.setProperty("z-index", "20", "important");
  }

  // --- VIGILANTE DE TAMAÑOS ---
  const parentDiv = arrowWrap ? arrowWrap.parentElement : null;
  if (parentDiv) {
    const resizeObserver = new ResizeObserver(() => updateArrowPosition());
    resizeObserver.observe(parentDiv);
  }

  window.addEventListener("resize", updateArrowPosition);
  window.addEventListener("load", updateArrowPosition);
});
