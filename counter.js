/**
 * Number Odometer Pro - Versión Multi-Grupo Optimizada
 * Soporta múltiples [data-odometer-group] con activación independiente al hacer scroll.
 */
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initFlag = 'data-odometer-initialized';
  const activeTweens = new WeakMap();

  // Configuración por defecto
  const defaults = {
    duration: 1.2,
    ease: 'power4.out',
    elementStagger: 0.1,
    digitStagger: 0.03,
    revealDuration: 0.5,
    revealEase: 'power2.out',
    triggerStart: 'top 85%',
    staggerOrder: 'left',
    digitCycles: 2
  };

  // Seleccionamos todos los grupos de la página
  const groups = document.querySelectorAll('[data-odometer-group]');

  groups.forEach(group => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    // Configuración específica del grupo o defaults
    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder;
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart;
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger;

    // Pre-procesamos los datos pero NO construimos el DOM aún para evitar saltos visuales
    const elementData = elements.map(el => {
      return {
        el,
        originalText: el.textContent.trim(),
        hasExplicitStart: el.hasAttribute('data-odometer-start'),
        startValue: parseFloat(el.getAttribute('data-odometer-start')) || 0,
        duration: parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration
      };
    });

    const orderedData = applyStaggerOrder(elementData, staggerOrder);

    // Creamos el ScrollTrigger para este grupo específico
    ScrollTrigger.create({
      trigger: group,
      start: triggerStart,
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();

        orderedData.forEach((data, orderIdx) => {
          const { el, originalText, startValue, duration, hasExplicitStart } = data;
          const offset = orderIdx * elementStagger;

          // 1. Cálculos de estilo
          const fontSize = parseFloat(getComputedStyle(el).fontSize);
          const pxStep = Math.round(fontSize * getLineHeightRatio(el));

          // 2. Parseo de segmentos
          let segments = parseSegments(originalText);
          segments = mapStartDigits(segments, startValue);
          segments = markHiddenSegments(segments, startValue);

          const grow = shouldGrow(el, hasExplicitStart, startValue, segments);

          // 3. Construcción del DOM justo en el momento de animar
          const { rollers, revealEls } = buildRollerDOM(el, segments, pxStep, grow);

          // 4. Animación de revelado (ancho)
          revealEls.forEach(revealEl => {
            const widthEm = revealEl.offsetWidth / fontSize;
            gsap.set(revealEl, { width: 0, opacity: 0, overflow: 'hidden' });
            
            tl.to(revealEl, {
              width: widthEm + 'em',
              opacity: 1,
              duration: defaults.revealDuration,
              ease: defaults.revealEase
            }, offset);
          });

          // 5. Animación de los rodillos
          rollers.forEach(({ roller, targetPos, startDigit, isReveal }, digitIdx) => {
            const reversedIdx = rollers.length - 1 - digitIdx;
            const fromY = isReveal ? pxStep : -(startDigit * pxStep);
            const toY = -(targetPos * pxStep);

            tl.fromTo(roller,
              { y: fromY },
              { 
                y: toY, 
                duration, 
                ease: defaults.ease, 
                force3D: true,
                onComplete: () => {
                  if (digitIdx === rollers.length - 1) cleanupElement(el, originalText);
                }
              },
              offset + (reversedIdx * defaults.digitStagger)
            );
          });
        });
      }
    });
  });

  // --- Funciones de Utilidad ---

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === 'normal') return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text) {
    return [...text].map(char => ({ type: /\d/.test(char) ? 'digit' : 'static', char }));
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter(s => s.type === 'digit');
    const padded = String(Math.floor(Math.abs(startValue))).padStart(digitSlots.length, '0').slice(-digitSlots.length);
    let di = 0;
    return segments.map(s => s.type === 'digit' ? { ...s, startDigit: parseInt(padded[di++], 10) } : s);
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter(s => s.type === 'digit').length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    
    let digitsSeen = 0;
    let prevDigitHidden = false;
    
    return segments.map(seg => {
      if (seg.type === 'digit') {
        const hidden = digitsSeen < leadingZeros;
        digitsSeen++;
        prevDigitHidden = hidden;
        return { ...seg, hidden };
      }
      return { ...seg, hidden: prevDigitHidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute('data-odometer-grow')) return el.getAttribute('data-odometer-grow') !== 'false';
    if (!hasExplicitStart) return false;
    const startDigitCount = String(Math.floor(Math.abs(startValue))).length;
    const endDigitCount = segments.filter(s => s.type === 'digit').length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, pxStep, grow) {
    el.innerHTML = '';
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;

    segments.forEach(seg => {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.height = pxStep + 'px';
      span.style.lineHeight = pxStep + 'px';
      span.style.verticalAlign = 'top';

      if (seg.type === 'static') {
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) revealEls.push(span);
      } else {
        span.style.overflow = 'hidden';
        const roller = document.createElement('span');
        roller.style.display = 'block';
        roller.style.willChange = 'transform';
        
        const digits = [];
        for (let d = 0; d < totalCells; d++) digits.push(d % 10);
        roller.textContent = digits.join('\n');
        
        span.appendChild(roller);
        el.appendChild(span);

        const startDigit = seg.startDigit || 0;
        const isReveal = grow && seg.hidden;
        const targetPos = parseInt(seg.char, 10) + (10 * (defaults.digitCycles - 1));

        rollers.push({ roller, targetPos, startDigit, isReveal });
        if (isReveal) revealEls.push(span);
        
        gsap.set(roller, { y: isReveal ? pxStep : -(startDigit * pxStep) });
      }
    });

    return { rollers, revealEls };
  }

  function cleanupElement(el, text) {
    const currentH = el.offsetHeight;
    el.style.height = currentH + 'px';
    el.innerHTML = text;
    requestAnimationFrame(() => { el.style.height = ''; });
  }

  function applyStaggerOrder(items, order) {
    if (order === 'right') return [...items].reverse();
    if (order === 'random') return [...items].sort(() => Math.random() - 0.5);
    return items;
  }

  // Manejo de Resize para recalcular posiciones de ScrollTrigger
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
  });
}

// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  // Asegurarnos de que GSAP y ScrollTrigger están presentes
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initNumberOdometer();
  } else {
    console.warn("GSAP o ScrollTrigger no encontrados.");
  }
});
