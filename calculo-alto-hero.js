let anchoVentana = window.innerWidth;
const breakpointTablet = 1024; 

const calcularAltoBuscador = () => {
  if (window.matchMedia(`(max-width: ${breakpointTablet}px)`).matches) {
    // 1. Creamos un elemento temporal para medir cuánto es 100vh reales en píxeles
    const medidor = document.createElement('div');
    medidor.style.height = '100vh';
    medidor.style.position = 'absolute';
    medidor.style.visibility = 'hidden';
    document.body.appendChild(medidor);
    
    const altoCienVh = medidor.clientHeight; // 100vh en px
    document.body.removeChild(medidor); // Lo borramos
    
    // 2. window.innerHeight nos da el alto libre que deja Safari
    const altoVisible = window.innerHeight;
    
    // 3. Calculamos la diferencia: ese es el alto exacto de la barra de iOS
    // (Usamos Math.max para evitar números negativos si la barra desaparece)
    const altoBuscador = Math.max(0, altoCienVh - altoVisible);
    
    // 4. Guardamos SOLAMENTE el alto del buscador en la variable
    document.documentElement.style.setProperty('--buscador-height', `${altoBuscador}px`);
  } else {
    // En desktop limpiamos la variable
    document.documentElement.style.removeProperty('--buscador-height');
  }
};

document.addEventListener('DOMContentLoaded', calcularAltoBuscador);

window.addEventListener('resize', () => {
  // Solo recalculamos si cambia el ancho (se gira el móvil)
  if (window.innerWidth !== anchoVentana) {
    anchoVentana = window.innerWidth;
    calcularAltoBuscador();
  }
});
