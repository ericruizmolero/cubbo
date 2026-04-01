// Resource: Number Odometer Pro (Safari-Fix + No-Jump + Programmatic Update)
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initFlag = 'data-odometer-initialized';
  const activeTweens = new WeakMap();

  const defaults = {
    duration: 1.2,
    ease: 'power4.out',
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: 'power2.out',
    triggerStart: 'top 80%',
    staggerOrder: 'left',
    digitCycles: 2
  };

  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder;
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart;
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger;

    const elementData = elements.map(el => {
      const originalText = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute('data-odometer-start');
      const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0;
      const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration;

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const stepRatio = getLineHeightRatio(el);
      const pxStep = Math.round(fontSize * stepRatio);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, pxStep, grow);

      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: 'hidden' });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, pxStep, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true
      }
    });

    ordered.forEach((data, orderIdx) => {
      const { el, rollers, duration, pxStep, revealData, originalText } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el: rEl, widthEm }) => {
        tl.to(rEl, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase
        }, offset);
      });

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
              // FIX: digitIdx === 0 has reversedIdx = rollers.length - 1,
              // meaning it starts last and finishes last — correct cleanup point.
              // Previously used rollers.length - 1 which fires first, not last.
              if (digitIdx === 0) cleanupElement(el, originalText);
            }
          },
          offset + reversedIdx * defaults.digitStagger
        );
      });
    });
  });

  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease = options.ease || defaults.ease;

    const existing = activeTweens.get(el);
    if (existing) { existing.kill(); gsap.set(el, { clearProps: 'width,overflow' }); }

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const pxStep = Math.round(fontSize * getLineHeightRatio(el));
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments = parseSegments(currentText);
    const startDigitsStr = startSegments.filter(s => s.type === 'digit').map(s => s.char).join('');
    const startValue = parseInt(startDigitsStr, 10) || 0;

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);

    const { rollers, revealEls } = buildRollerDOM(el, segments, pxStep, true);
    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) gsap.set(el, { width: oldWidthEm + 'em', overflow: 'hidden' });

    const tl = gsap.timeline({
      onComplete() { cleanupElement(el, newText); activeTweens.delete(el); }
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(el, { width: newWidthEm + 'em', duration: defaults.revealDuration, ease: defaults.revealEase }, 0);
    }

    rollers.forEach(({ roller, targetPos, startDigit, isReveal }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      const fromY = isReveal ? pxStep : -(startDigit * pxStep);
      const toY = -(targetPos * pxStep);

      tl.fromTo(roller,
        { y: fromY },
        { y: toY, duration, ease, force3D: true },
        reversedIdx * defaults.digitStagger
      );
    });
  };

  // Helpers
  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    if (cs.lineHeight === 'normal') return 1.2;
    return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
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
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0, firstDigitSeen = false, prevDigitHidden = false;
    return segments.map(seg => {
      if (seg.type === 'digit') {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      return { ...seg, hidden: firstDigitSeen && prevDigitHidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute('data-odometer-grow')) return el.getAttribute('data-odometer-grow') !== 'false';
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
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
        span.setAttribute('data-odometer-part', 'static');
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) { gsap.set(span, { opacity: 0 }); revealEls.push(span); }
      } else {
        span.setAttribute('data-odometer-part', 'mask');
        span.style.overflow = 'hidden';
        const roller = document.createElement('span');
        roller.setAttribute('data-odometer-part', 'roller');
        roller.style.display = 'block';
        roller.style.willChange = 'transform';
        // FIX: white-space: pre is required so \n creates actual line breaks.
        // Without it, all digits collapse into a single line and y-translation has no effect.
        roller.style.whiteSpace = 'pre';

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
      }
    });

    rollers.forEach(({ roller, startDigit, isReveal }) => {
      gsap.set(roller, { y: isReveal ? pxStep : -(startDigit * pxStep) });
    });

    return { rollers, revealEls };
  }

  function cleanupElement(el, originalText) {
    const currentH = el.offsetHeight;
    el.style.height = currentH + 'px';
    el.innerHTML = originalText;
    el.style.overflow = '';
    requestAnimationFrame(() => { el.style.height = ''; });
  }

  function recalcOnResize() {
    document.querySelectorAll('[data-odometer-element]').forEach(el => {
      const running = activeTweens.get(el);
      if (running) { running.progress(1); activeTweens.delete(el); }
      const hasRollers = el.querySelector('[data-odometer-part="roller"]');
      if (hasRollers) {
        const fontSize = parseFloat(getComputedStyle(el).fontSize);
        const pxStep = Math.round(fontSize * getLineHeightRatio(el));
        el.querySelectorAll('[data-odometer-part="mask"], [data-odometer-part="static"]').forEach(s => {
          s.style.height = pxStep + 'px';
          s.style.lineHeight = pxStep + 'px';
        });
      }
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  });

  function applyStaggerOrder(items, order) {
    if (order === 'right') return [...items].reverse();
    if (order === 'random') return [...items].sort(() => Math.random() - 0.5);
    return items;
  }
}

document.addEventListener("DOMContentLoaded", initNumberOdometer);
