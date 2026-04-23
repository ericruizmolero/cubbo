document.addEventListener("DOMContentLoaded", (event) => {
  
  gsap.registerPlugin(ScrollTrigger);

  const circle = document.querySelector('.way_cirle');
  const numberEl = document.querySelector('.way_number');
  const progreso = { valor: 0 };

  // Forzamos a que el círculo empiece con opacidad 0 y oculto desde GSAP
  gsap.set(circle, { autoAlpha: 0 }); 

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hit",         
      endTrigger: ".report",   
      start: "top top",     
      end: "bottom center",    
      scrub: true,             
      
      // Usamos autoAlpha en lugar de opacity para un mejor rendimiento y control
      onEnter: () => gsap.to(circle, { autoAlpha: 1, duration: 0.3 }),
      onLeave: () => gsap.to(circle, { autoAlpha: 0, duration: 0.3 }),
      onEnterBack: () => gsap.to(circle, { autoAlpha: 1, duration: 0.3 }),
      onLeaveBack: () => gsap.to(circle, { autoAlpha: 0, duration: 0.3 })
    }
  });

  tl.to(progreso, {
    valor: 100,
    ease: "none", 
    onUpdate: () => {
      numberEl.innerText = Math.round(progreso.valor);
    }
  });

});
