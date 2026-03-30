
const taglines = [
  "Plataforma operativa",
  "Logística inteligente",
  "Control total del fulfillment",
  "Tu operación, centralizada",
  "Fulfillment sin fricción",
];

const el = document.querySelector("[hero-data-tagline]");

let currentIndex = 0;
let charIndex = 0;

const TYPE_SPEED = 60;
const DELETE_SPEED = 30;
const PAUSE_AFTER_TYPE = 2000;

function type() {
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

