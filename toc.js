document.addEventListener("DOMContentLoaded", () => {
  
  // 1. ENLACES EXTERNOS EN NUEVA PESTAÑA
  const textLinks = document.querySelectorAll('.post_richt-text.w-richtext a');
  textLinks.forEach(link => {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // 2. GENERACIÓN DEL ÍNDICE Y ANCLAS FANTASMA
  const richText = document.querySelector('.post_richt-text.w-richtext');
  const tocWrap = document.querySelector('.post_toc-wrap');
  
  if (!richText || !tocWrap) return;

  const headings = richText.querySelectorAll('h2');
  tocWrap.innerHTML = '';

  if (headings.length === 0) {
    const tocContainer = document.querySelector('.post_right');
    if (tocContainer) tocContainer.style.display = 'none';
    return;
  }

  headings.forEach((h2, index) => {
    const slug = h2.textContent.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/(^-|-$)+/g, '');
      
    const finalId = slug || `seccion-${index}`;
    
    h2.setAttribute('data-ghost-id', finalId);

    // El "Ancla Fantasma"
    const ghostAnchor = document.createElement('div');
    ghostAnchor.id = finalId;
    ghostAnchor.style.position = 'relative';
    ghostAnchor.style.top = '-15vh'; 
    ghostAnchor.style.height = '0';
    ghostAnchor.style.width = '0';
    ghostAnchor.style.pointerEvents = 'none'; 
    
    h2.parentNode.insertBefore(ghostAnchor, h2);

    const link = document.createElement('a');
    link.href = `#${finalId}`;
    link.className = 'post_toc-link';
    link.textContent = h2.textContent;
    tocWrap.appendChild(link);
  });

  // 3. LÓGICA DE SCROLL SPY (AJUSTADA PARA QUE SALTE ANTES)
  const tocLinks = tocWrap.querySelectorAll('.post_toc-link');
  if (tocLinks.length > 0) tocLinks[0].classList.add('is-active');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const offset = window.innerHeight * 0.15;
    
    // NUEVO: Cuántos píxeles antes quieres que se active la clase
    // Puedes modificar este número (ej: 100, 200, 300) a tu gusto
    const activationBuffer = 150; 

    headings.forEach(h2 => {
      const h2Top = h2.getBoundingClientRect().top;
      
      // Salta cuando el H2 entra en la zona de los 15vh + los píxeles extra
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

});
