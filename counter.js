function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const initFlag = 'data-odometer-initialized'
  const activeTweens = new WeakMap()

  const defaults = {
    duration: 1.2, // Un poco más de tiempo ayuda a la fluidez
    ease: 'power4.out', // Ease más suave para odómetros
    elementStagger: 0.1,
    digitStagger: 0.05,
    revealDuration: 0.5,
    triggerStart: 'top 85%',
    digitCycles: 2
  }

  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return
    group.setAttribute(initFlag, '')

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'))
    if (!elements.length || prefersReducedMotion) return

    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || 'left'
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger

    const elementData = elements.map(el => {
      const originalText = el.textContent.trim()
      const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0
      const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration
      const step = getLineHeightRatio(el)

      let segments = parseSegments(originalText)
      segments = mapStartDigits(segments, startValue)
      segments = markHiddenSegments(segments, startValue)

      const grow = el.hasAttribute('data-odometer-grow') ? el.getAttribute('data-odometer-grow') !== 'false' : false
      const { rollers, revealEls, singleDigitHeight } = buildRollerDOM(el, segments, step, grow)

      const fontSize = parseFloat(getComputedStyle(el).fontSize)
      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize
        gsap.set(revealEl, { width: 0, overflow: 'hidden' })
        return { el: revealEl, widthEm }
      })

      return { el, rollers, duration, revealData, originalText, singleDigitHeight }
    })

    const ordered = applyStaggerOrder(elementData, staggerOrder)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true
      },
      onComplete() {
        elementData.forEach(({ el, originalText }) => cleanupElement(el, originalText))
      }
    })

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, revealData, singleDigitHeight } = data
      const offset = orderIdx * elementStagger

      revealData.forEach(({ el, widthEm }) => {
        tl.to(el, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: 'power2.out'
        }, offset)
      })

      rollers.forEach(({ roller, targetPos, startDigit, isReveal }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx
        
        // Calculamos la posición exacta en píxeles basada en la altura real renderizada
        const fromY = isReveal ? singleDigitHeight : -(startDigit * singleDigitHeight)
        const toY = -(targetPos * singleDigitHeight)

        tl.fromTo(roller,
          { y: fromY },
          { 
            y: toY, 
            duration, 
            ease: defaults.ease, 
            // Crucial para el lag: forzar GPU y suavizado
            force3D: true,
            rotationZ: 0.01, 
            z: 0.01,
            clearProps: "willChange" 
          },
          offset + reversedIdx * defaults.digitStagger
        )
      })
    })
  })

  // Helpers internos
  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el)
    let lh = cs.lineHeight
    if (lh === 'normal') return 1.2
    return parseFloat(lh) / parseFloat(cs.fontSize)
  }

  function parseSegments(text) {
    return [...text].map(char => ({ type: /\d/.test(char) ? 'digit' : 'static', char }))
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter(s => s.type === 'digit')
    const padded = String(Math.floor(Math.abs(startValue))).padStart(digitSlots.length, '0').slice(-digitSlots.length)
    let di = 0
    return segments.map(s => s.type === 'digit' ? { ...s, startDigit: parseInt(padded[di++], 10) } : s)
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter(s => s.type === 'digit').length
    const absStart = Math.floor(Math.abs(startValue))
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length
    const leadingZeros = Math.max(0, totalDigits - startDigitCount)
    if (leadingZeros === 0) return segments
    let digitsSeen = 0, firstDigitSeen = false, prevDigitHidden = false
    return segments.map(seg => {
      if (seg.type === 'digit') {
        firstDigitSeen = true
        const hidden = digitsSeen < leadingZeros
        prevDigitHidden = hidden
        digitsSeen++
        return { ...seg, hidden }
      }
      return { ...seg, hidden: firstDigitSeen && prevDigitHidden }
    })
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = ''
    const rollers = []
    const revealEls = []
    const totalCells = 10 * defaults.digitCycles

    segments.forEach(seg => {
      const span = document.createElement('span')
      span.style.display = 'inline-block'
      span.style.position = 'relative'
      span.style.height = step + 'em'
      span.style.lineHeight = step

      if (seg.type === 'static') {
        span.textContent = seg.char
        el.appendChild(span)
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 })
          revealEls.push(span)
        }
      } else {
        span.style.overflow = 'hidden'
        span.setAttribute('data-odometer-part', 'mask')
        
        const roller = document.createElement('span')
        roller.style.display = 'block'
        roller.style.whiteSpace = 'pre'
        roller.style.willChange = 'transform'
        // Mejora de rendimiento para Safari
        roller.style.webkitFontSmoothing = 'antialiased'
        
        const digits = []
        for (let d = 0; d < totalCells; d++) digits.push(d % 10)
        roller.textContent = digits.join('\n')
        
        span.appendChild(roller)
        el.appendChild(span)

        const startDigit = seg.startDigit || 0
        const isReveal = grow && seg.hidden
        const endDigit = parseInt(seg.char, 10)
        const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit

        rollers.push({ roller, targetPos, startDigit, isReveal })
        if (isReveal) revealEls.push(span)
      }
    })

    // Medimos la altura real de un dígito para el cálculo de píxeles
    const firstRoller = el.querySelector('span[style*="overflow: hidden"]');
    const singleDigitHeight = firstRoller ? firstRoller.offsetHeight : 0;

    rollers.forEach(({ roller, startDigit, isReveal }) => {
      const initialY = isReveal ? singleDigitHeight : -(startDigit * singleDigitHeight)
      gsap.set(roller, { y: initialY })
    })

    return { rollers, revealEls, singleDigitHeight }
  }

  function cleanupElement(el, originalText) {
    const digits = [...originalText].filter(c => /\d/.test(c))
    let di = 0
    el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
      mask.innerHTML = digits[di++] || ''
      mask.style.overflow = ''
    })
  }

  function applyStaggerOrder(items, order) {
    if (order === 'right') return [...items].reverse()
    if (order === 'random') return [...items].sort(() => Math.random() - 0.5)
    return items
  }
}

document.addEventListener("DOMContentLoaded", initNumberOdometer);
