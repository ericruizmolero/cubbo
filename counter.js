function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const initFlag = 'data-odometer-initialized'
  const activeTweens = new WeakMap()

  const defaults = {
    duration: 1.4, 
    ease: 'power4.out',
    elementStagger: 0.1,
    digitStagger: 0.05,
    revealDuration: 0.4,
    triggerStart: 'top 85%',
    digitCycles: 2
  }

  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return
    group.setAttribute(initFlag, '')

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'))
    if (!elements.length || prefersReducedMotion) return

    const elementData = elements.map(el => {
      const originalText = el.textContent.trim()
      const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0
      const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration
      
      // PASO 1: Calcular altura exacta y fijarla
      const fontSize = parseFloat(getComputedStyle(el).fontSize)
      const lhRatio = getLineHeightRatio(el)
      const exactPxHeight = Math.round(fontSize * lhRatio)
      
      let segments = parseSegments(originalText)
      segments = mapStartDigits(segments, startValue)
      segments = markHiddenSegments(segments, startValue)

      const grow = el.hasAttribute('data-odometer-grow') ? el.getAttribute('data-odometer-grow') !== 'false' : false
      
      // PASO 2: Construir DOM con alturas fijas en PX
      const { rollers, revealEls } = buildRollerDOM(el, segments, exactPxHeight, grow)

      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize
        gsap.set(revealEl, { width: 0, overflow: 'hidden' })
        return { el: revealEl, widthEm }
      })

      return { el, rollers, duration, revealData, originalText, exactPxHeight }
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart,
        once: true
      }
    })

    elementData.forEach((data, orderIdx) => {
      const { el, rollers, duration, revealData, exactPxHeight, originalText } = data
      const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger
      const offset = orderIdx * elementStagger

      revealData.forEach(({ el: rEl, widthEm }) => {
        tl.to(rEl, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: 'power2.out'
        }, offset)
      })

      rollers.forEach(({ roller, targetPos, startDigit, isReveal }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx
        
        // PASO 3: Destinos en píxeles enteros (Math.round) para evitar el salto
        const fromY = isReveal ? exactPxHeight : -(startDigit * exactPxHeight)
        const toY = -(targetPos * exactPxHeight)

        tl.fromTo(roller,
          { y: fromY },
          { 
            y: toY, 
            duration, 
            ease: defaults.ease, 
            force3D: true,
            // Evita que el renderizado de texto cambie al final
            onComplete: () => {
                // Solo limpiamos si es el último dígito del elemento para evitar parpadeos
                if(digitIdx === rollers.length - 1) {
                    cleanupElement(el, originalText)
                }
            }
          },
          offset + reversedIdx * defaults.digitStagger
        )
      })
    })
  })

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el)
    if (cs.lineHeight === 'normal') return 1.2
    return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)
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

  function buildRollerDOM(el, segments, pxHeight, grow) {
    el.innerHTML = ''
    const rollers = []
    const revealEls = []
    const totalCells = 10 * defaults.digitCycles

    segments.forEach(seg => {
      const span = document.createElement('span')
      span.style.display = 'inline-block'
      span.style.height = pxHeight + 'px'
      span.style.lineHeight = pxHeight + 'px'
      span.style.verticalAlign = 'top' // Alineación estricta

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
        
        const digits = []
        for (let d = 0; d < totalCells; d++) digits.push(d % 10)
        roller.textContent = digits.join('\n')
        
        span.appendChild(roller)
        el.appendChild(span)

        const startDigit = seg.startDigit || 0
        const isReveal = grow && seg.hidden
        const targetPos = parseInt(seg.char, 10) + (10 * (defaults.digitCycles - 1))

        rollers.push({ roller, targetPos, startDigit, isReveal })
        if (isReveal) revealEls.push(span)
      }
    })

    rollers.forEach(({ roller, startDigit, isReveal }) => {
      const initialY = isReveal ? pxHeight : -(startDigit * pxHeight)
      gsap.set(roller, { y: initialY })
    })

    return { rollers, revealEls }
  }

  function cleanupElement(el, originalText) {
    // Para evitar el "salto", solo removemos los estilos de transformación
    // pero mantenemos la estructura si es necesario.
    // O mejor, reemplazamos por el texto final pero asegurando que el line-height se mantenga.
    const containerHeight = el.offsetHeight
    el.style.height = containerHeight + 'px'
    el.innerHTML = originalText
    
    // Limpiamos los estilos inline después de un frame para que sea suave
    requestAnimationFrame(() => {
        el.style.height = ''
    })
  }
}

document.addEventListener("DOMContentLoaded", initNumberOdometer);
