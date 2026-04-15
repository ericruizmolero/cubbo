// Constantes de los paths del SVG basándonos en tu HTML
const FAQ_ARROW_DOWN = 'M0.530273 0.53125L4.03027 4.03125L7.53027 0.53125';
const FAQ_ARROW_UP   = 'M0.530273 4.03125L4.03027 0.53125L7.53027 4.03125';

// Duraciones (ajustables)
const FAQ_DUR = { 
  accordion: 0.4, 
  arrowMorph: 0.3 
};

// Referencias del DOM
const faqItems = document.querySelectorAll('.faq_item');

// Estado
let activeFaq = null;

// Configuración Inicial
// Es fundamental poner overflow 'hidden' para que al cambiar el height a 0px no se desborde el texto
gsap.set('.faq_answer', { height: 0, overflow: 'hidden' });

// Funciones Helpers
function openFaq(item) {
  const question = item.querySelector('.faq_question');
  const answer = item.querySelector('.faq_answer');
  const path = item.querySelector('.faq_icon svg path');

  item.isOpen = true;

  // Animar el contenedor de la respuesta a height: auto
  gsap.to(answer, { height: 'auto', duration: FAQ_DUR.accordion, ease: 'power2.inOut' });
  
  // Cambiar el color del texto a la variable de Cubbo
  gsap.to(question, { color: 'var(--_colores---primary--cubbo-core)', duration: FAQ_DUR.accordion, ease: 'power2.inOut' });
  
  // Morph de la flecha hacia arriba
  if (path) {
    gsap.to(path, { attr: { d: FAQ_ARROW_UP }, duration: FAQ_DUR.arrowMorph, ease: 'power2.inOut' });
  }
}

function closeFaq(item) {
  const question = item.querySelector('.faq_question');
  const answer = item.querySelector('.faq_answer');
  const path = item.querySelector('.faq_icon svg path');

  item.isOpen = false;

  // Regresar a height 0px
  gsap.to(answer, { height: 0, duration: FAQ_DUR.accordion, ease: 'power2.inOut' });
  
  // Remover el color en línea (el string vacío hace que retorne a su color CSS por defecto)
  gsap.to(question, { color: '', duration: FAQ_DUR.accordion, ease: 'power2.inOut' }); 
  
  // Morph de la flecha hacia abajo
  if (path) {
    gsap.to(path, { attr: { d: FAQ_ARROW_DOWN }, duration: FAQ_DUR.arrowMorph, ease: 'power2.inOut' });
  }
}

// Inicialización de Eventos
faqItems.forEach(item => {
  const question = item.querySelector('.faq_question');
  
  // Guardamos el estado en el propio elemento del DOM
  item.isOpen = false;
  
  // Cambiar el cursor sobre el trigger para mejorar UX
  question.style.cursor = 'pointer';

  question.addEventListener('click', () => {
    const isOpening = !item.isOpen;

    // Si quieres que las demás se cierren al abrir una nueva (Comportamiento Acordeón)
    if (isOpening && activeFaq && activeFaq !== item) {
      closeFaq(activeFaq);
    }

    if (isOpening) {
      openFaq(item);
      activeFaq = item;
    } else {
      closeFaq(item);
      activeFaq = null;
    }
  });
});
