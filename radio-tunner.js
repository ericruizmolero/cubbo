document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  
  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 

  // --- 1. PREPARAR TEXTOS (RESPETANDO PALABRAS) ---
  function splitTextToSpans(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Guardamos el texto y vaciamos el contenedor
      const text = el.innerText.trim();
      el.innerHTML = '';
      
      // Separamos por palabras primero
      const words = text.split(' ');
      
      words.forEach((word, wordIndex) => {
        // Creamos un contenedor para la palabra entera para evitar que se corte
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap'; // Obliga a que la palabra no se rompa
        
        // Ahora sí, separamos la palabra por letras
        word.split('').forEach(char => {
          const charSpan = document.createElement('span');
          charSpan.innerText = char;
          charSpan.style.display = 'inline-block';
          charSpan.classList.add('anim-char'); 
          wordSpan.appendChild(charSpan);
        });

        // Añadimos la palabra al elemento principal
        el.appendChild(wordSpan);

        // Añadimos un espacio después de la palabra (excepto en la última)
        if (wordIndex < words.length - 1) {
          const spaceNode = document.createTextNode(' ');
          el.appendChild(spaceNode);
        }
      });
    });
  }

  splitTextToSpans('.skill_bottom-left-head h3, .skill_bottom-left-bottom p');

  // --- 2. LÓGICA DE LA OLA ---
  function renderWave(centerIndex) {
    const roundedCenter = Math.round(centerIndex);
    freqs.forEach((piston, idx) => {
      piston.classList.remove("is-active", "is-active-1", "is-active-2");
      const distance = Math.abs(idx - roundedCenter);
      if (distance === 0) piston.classList.add("is-active");
      else if (distance === 1) piston.classList.add("is-active-1");
      else if (distance === 2) piston.classList.add("is-active-2");
    });
  }

  let currentContentAnim = null;

  // --- 3. ANIMACIÓN PRINCIPAL ---
  function goToTab(activeIndex) {
    // Clases activas de los tabs
    tabs.forEach(t => t.classList.remove("is-active"));
    if (tabs[activeIndex]) tabs[activeIndex].classList.add("is-active");

    // Limpieza de contenidos
    tabContents.forEach((c, index) => {
      if (index !== activeIndex) {
        c.classList.remove("is-active");
        c.style.display = "none";
      }
    });

    // Setup del nuevo contenido
    const activeContent = tabContents[activeIndex];
    if (activeContent) {
      activeContent.classList.add("is-active");
      activeContent.style.display = "grid"; 
      
      const chars = activeContent.querySelectorAll('.anim-char');
      const images = activeContent.querySelectorAll(
        '.skill_bottom-img-abs:not(.is-opacity-0), .skill_mockup:not(.is-opacity-0), .skill_mockup-abs:not(.is-opacity-0)'
      );

      if (currentContentAnim) currentContentAnim.kill();
      currentContentAnim = gsap.timeline();

      // Animación de Textos (Comienza en el segundo 0 de la timeline)
      currentContentAnim.fromTo(chars, 
        { 
          opacity: 0, 
          filter: "blur(10px)", 
          y: 0
        }, 
        { 
          opacity: 1, 
          filter: "blur(0px)", 
          y: 0, 
          duration: 0.4, 
          stagger: 0.005, 
          ease: "power2.out" 
        }, 
        0 // <--- Este '0' le dice a GSAP: "Inicia esta animación al principio del todo"
      );

      // Animación de Imágenes (Comienza también en el segundo 0)
      if (images.length > 0) {
        currentContentAnim.fromTo(images,
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: 0.6, 
            stagger: 0.1, 
            ease: "power2.inOut" 
          },
          0 // <--- Este '0' asegura que arranque EXACTAMENTE a la vez que los textos
        );
      }
    }

    // Animamos la ola del Radio Tuner en paralelo
    const targetPiston = tabToPistonMap[activeIndex];
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.6, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });
  }

  // --- 4. INICIALIZACIÓN ---
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => goToTab(index));
  });

  // Estado Inicial
  renderWave(waveProxy.pistonIndex);
  
  // Ocultamos todos y disparamos el central
  tabContents.forEach(c => c.style.display = "none");
  goToTab(2); 
});
