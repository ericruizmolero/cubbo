// Textos en Castellano
const taglinesES = [
  "Plataforma operativa",
  "Logística inteligente",
  "Control total del fulfillment",
  "Tu operación, centralizada",
  "Fulfillment sin fricción",
];

// Textos en Portugués (Brasileño)
const taglinesBR = [
  "Plataforma operacional",
  "Logística inteligente",
  "Controle total do fulfillment",
  "Sua operação, centralizada",
  "Fulfillment sem atrito",
];

// Detectar si estamos en la versión de Brasil mirando la URL
const isBrazilian = window.location.pathname.startsWith('/br');

// Asignar los taglines correctos según el idioma
const taglines = isBrazilian ? taglinesBR : taglinesES;

const el = document.querySelector("[hero-data-tagline]");

let currentIndex = 0;
let charIndex = 0;

const TYPE_SPEED = 60;
const DELETE_SPEED = 30;
const PAUSE_AFTER_TYPE = 2000;

function type() {
  if (!el) return; // Evita errores si el elemento no existe en la página actual

  const current = taglines[currentIndex];

  el.textContent = current.substring(0, charIndex + 1);
  charIndex++;

  if (charIndex < current.length) {
    setTimeout(type, TYPE_SPEED);
  } else {
    setTimeout(erase, PAUSE_AFTER_TYPE);
  }
}

function erase() {
  if (!el) return;

  const current = taglines[currentIndex]; // ✅ aquí estaba el bug

  el.textContent = current.substring(0, charIndex - 1);
  charIndex--;

  if (charIndex > 0) {
    setTimeout(erase, DELETE_SPEED);
  } else {
    currentIndex = (currentIndex + 1) % taglines.length;
    setTimeout(type, TYPE_SPEED);
  }
}

type();
