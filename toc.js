document.addEventListener("DOMContentLoaded", () => {
  
  // Seleccionamos el contenedor principal de texto una sola vez para usarlo en todo el script
  const richText = document.querySelector('.post_richt-text.w-richtext');
  if (!richText) return; // Si no estamos en un post, detenemos el script aquí para ahorrar recursos

  /* ====================================================================
     1. ENLACES EXTERNOS EN NUEVA PESTAÑA
     ==================================================================== */
  const textLinks = richText.querySelectorAll('a');
  textLinks.forEach(link => {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* ====================================================================
     2. CÁLCULO DEL TIEMPO ESTIMADO DE LECTURA
     ==================================================================== */
  const readTimeElement = document.querySelector('[post-read]');
  
  if (readTimeElement) {
    // Obtenemos todo el texto puro (sin etiquetas HTML)
    const textContent = richText.innerText || richText.textContent;
    
    // Separamos el texto por espacios para contar cuántas palabras hay en total
    const wordCount = textContent.trim().split(/\s+/).length;
    
    // Velocidad promedio de lectura en español (200 palabras por minuto)
    const wordsPerMinute = 200; 
    
    // Calculamos los minutos. Math.ceil redondea hacia arriba (ej: 1.2 min -> 2 min)
    // Math.max(1, ...) asegura que incluso en textos muy cortos siempre ponga "1 min" como mínimo
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    
    // Inyectamos el resultado en tu elemento
    readTimeElement.textContent = `${minutes} min`;
  }

  /* ====================================================================
     3. GENERACIÓN DEL ÍNDICE Y ANCLAS FANTASMA
     ==================================================================== */
  const tocWrap = document.querySelector('.post_toc-wrap');
  
  if (tocWrap) {
    const headings = richText.querySelectorAll('h2');
    tocWrap.innerHTML = '';

    if (headings.length === 0) {
      const tocContainer = document.querySelector('.post_right');
      if (tocContainer) tocContainer.style.display = 'none';
    } else {
      headings.forEach((h2, index) => {
        // Generamos el ID limpio
        const slug = h2.textContent.trim().toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          .replace(/[^a-z0-9]+/g, '-') 
          .replace(/(^-|-$)+/g, '');
          
        const finalId = slug || `seccion-${index}`;
        
        h2.setAttribute('data-ghost-id', finalId);

        // El "Ancla Fantasma" anti-Webflow
        const ghostAnchor = document.createElement('div');
        ghostAnchor.id = finalId;
        ghostAnchor.style.position = 'relative';
        ghostAnchor.style.top = '-15vh'; 
        ghostAnchor.style.height = '0';
        ghostAnchor.style.width = '0';
        ghostAnchor.style.pointerEvents = 'none'; 
        
        h2.parentNode.insertBefore(ghostAnchor, h2);

        // Creamos el enlace
        const link = document.createElement('a');
        link.href = `#${finalId}`;
        link.className = 'post_toc-link';
        link.textContent = h2.textContent;
        tocWrap.appendChild(link);
      });

      /* ====================================================================
         4. LÓGICA DE SCROLL SPY (MENÚ ACTIVO)
         ==================================================================== */
      const tocLinks = tocWrap.querySelectorAll('.post_toc-link');
      if (tocLinks.length > 0) tocLinks[0].classList.add('is-active');

      window.addEventListener('scroll', () => {
        let currentId = '';
        const offset = window.innerHeight * 0.15;
        const activationBuffer = 150; 

        headings.forEach(h2 => {
          const h2Top = h2.getBoundingClientRect().top;
          
          if (h2Top <= offset + activationBuffer) { 
            currentId = h2.getAttribute('data-ghost-id');
          }
        });

        if (currentId) {
          tocLinks.forEach(link => {
            link.classList.remove('is-active');
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('is-active');
            }
          });
        }
      });
    }
  }
});
