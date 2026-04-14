document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".skill_tab-link");
  const freqs = document.querySelectorAll(".skill_freq");
  const tabContents = document.querySelectorAll(".skill_tab-content");
  const skillSection = document.querySelector(".skill_component"); 

  const prevBtn = document.querySelector(".skill_tabs-prev");
  const nextBtn = document.querySelector(".skill_tabs-next");
  const playPauseBtn = document.querySelector(".skill_tabs-playpause");
  const iconPlay = document.querySelector(".how_icon-play");
  const iconPause = document.querySelector(".how_icon-pause");
  const activeLine = document.querySelector(".skill_active-tab-line");
  const radioLayout = document.querySelector(".skill_radio-layout");

  const tabToPistonMap = [1, 8, 15, 22, 29]; 
  const waveProxy = { pistonIndex: 15 }; 
  let hasAnimated = false; 

  let currentIndex = 2; 
  let isPaused = true; 
  let progressTween = null;
  const TIME_PER_TAB = 6; 
  const MOBILE_BREAKPOINT = 767; 

  // --- PREPARAR TEXTOS ---
  function splitTextToSpans(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.innerText.trim();
      if (!text) return; 
      el.innerHTML = '';
      const words = text.split(' ');
      words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';
        word.split('').forEach(char => {
          const charSpan = document.createElement('span');
          charSpan.innerText = char;
          charSpan.style.display = 'inline-block';
          charSpan.classList.add('anim-char'); 
          wordSpan.appendChild(charSpan);
        });
        el.appendChild(wordSpan);
        if (wordIndex < words.length - 1) {
          el.appendChild(document.createTextNode(' '));
        }
      });
    });
  }

  splitTextToSpans('.skill_bottom-left-head h3, .skill_bottom-left-bottom p');

  // --- LÓGICA DE LA OLA ---
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

  // --- ANIMACIÓN PRINCIPAL ---
  function goToTab(activeIndex) {
    tabs.forEach(t => t.classList.remove("is-active"));
    if (tabs[activeIndex]) tabs[activeIndex].classList.add("is-active");

    tabContents.forEach((c, index) => {
      if (index !== activeIndex) {
        c.classList.remove("is-active");
        c.style.display = "none";
      }
    });

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

      if (chars.length > 0) {
        currentContentAnim.fromTo(chars, 
          { opacity: 0, filter: "blur(10px)" }, 
          { opacity: 1, filter: "blur(0px)", duration: 0.4, stagger: 0.005, ease: "power2.out" }, 
          0
        );
      }

      if (images.length > 0) {
        currentContentAnim.fromTo(images,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.inOut" },
          0
        );
      }
    }

    const targetPiston = tabToPistonMap[activeIndex] || 15; 
    gsap.to(waveProxy, {
      pistonIndex: targetPiston,
      duration: 0.6, 
      ease: "power2.inOut", 
      overwrite: true,
      onUpdate: () => renderWave(waveProxy.pistonIndex)
    });

    if (progressTween) progressTween.kill();
    if (activeLine) {
      progressTween = gsap.fromTo(activeLine, 
        { width: "0%" }, 
        { 
          width: "100%", 
          duration: TIME_PER_TAB, 
          ease: "none",
          onComplete: () => {
            if (!isPaused) {
              currentIndex = (currentIndex + 1) % tabs.length;
              goToTab(currentIndex);
            }
          }
        }
      );
      if (isPaused) progressTween.pause();
    }

    // CENTRAR TABS EN MOBILE
    if (window.innerWidth <= MOBILE_BREAKPOINT) { 
      const stepDist = tabs.length > 1 ? (tabs[1].offsetLeft - tabs[0].offsetLeft) : 0;
      const centerIndex = Math.floor(tabs.length / 2);
      const shiftX = (centerIndex - activeIndex) * stepDist;

      gsap.to(tabs, { x: shiftX, duration: 0.6, ease: "power2.inOut", overwrite: "auto" });
      if (radioLayout) gsap.to(radioLayout, { x: shiftX, duration: 0.6, ease: "power2.inOut", overwrite: "auto" });
    } else {
      gsap.to(tabs, { x: 0, duration: 0.4 });
      if (radioLayout) gsap.to(radioLayout, { x: 0, duration: 0.4 });
    }
  }

  // --- CONTROLES MANUALES ---
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        hasAnimated = true; 
        currentIndex = index; 
        goToTab(currentIndex);
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % tabs.length;
      goToTab(currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      goToTab(currentIndex);
    });
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      isPaused = !isPaused;

      if (iconPlay && iconPause) {
        iconPlay.style.display = isPaused ? "block" : "none";
        iconPause.style.display = isPaused ? "none" : "block";
      }

      if (progressTween) {
        if (isPaused) progressTween.pause();
        else progressTween.play();
      }
    });
  }

  if (iconPlay && iconPause) {
    iconPlay.style.display = isPaused ? "block" : "none";
    iconPause.style.display = isPaused ? "none" : "block";
  }

  window.addEventListener("resize", () => {
    if (hasAnimated) {
       if (window.innerWidth <= MOBILE_BREAKPOINT) {
          const stepDist = tabs.length > 1 ? (tabs[1].offsetLeft - tabs[0].offsetLeft) : 0;
          const centerIndex = Math.floor(tabs.length / 2);
          const shiftX = (centerIndex - currentIndex) * stepDist;
          gsap.set(tabs, { x: shiftX });
          if (radioLayout) gsap.set(radioLayout, { x: shiftX });
       } else {
          gsap.set(tabs, { x: 0 });
          if (radioLayout) gsap.set(radioLayout, { x: 0 });
       }
    }
  });

  // --- INTERSECTION OBSERVER ---
  const observerOptions = { root: null, threshold: 0.3 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true; 
        goToTab(currentIndex); 
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  renderWave(waveProxy.pistonIndex);
  tabContents.forEach(c => c.style.display = "none");

  if (skillSection) {
    observer.observe(skillSection);
  } else {
    goToTab(currentIndex);
  }
});
