document.addEventListener("DOMContentLoaded", () => {
  /* ====================================================================
     TRADUCCIÓN Y FORMATO DE FECHA EN TODOS LOS ELEMENTOS
     ==================================================================== */
  
  // 1. Seleccionamos TODOS los elementos con el atributo 'post-date'
  const dateElements = document.querySelectorAll('[post-date]');
  
  // 2. Determinamos el idioma de la página una sola vez para ser más eficientes
  const pageLang = document.documentElement.lang.toLowerCase();
  const locale = pageLang.includes('br') ? 'pt-BR' : 'es-ES';
  
  // 3. Opciones de fecha (mes corto y día)
  const dateOptions = { day: 'numeric', month: 'short' };

  // 4. Iteramos sobre cada elemento encontrado
  dateElements.forEach((dateElement) => {
    // Leemos el texto completo (ej: "12 min / 29 Apr")
    const rawText = dateElement.textContent.trim();
    
    // Separamos el texto usando la barra "/"
    const parts = rawText.split('/');
    
    // Si tiene el formato "tiempo / fecha"
    if (parts.length === 2) {
      const timePart = parts[0].trim(); // ej: "12 min"
      const datePart = parts[1].trim(); // ej: "29 Apr"
      
      const originalDate = new Date(datePart);
      
      if (!isNaN(originalDate.getTime())) {
        let formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(originalDate);
        formattedDate = formattedDate.replace('.', ''); // Limpiamos el punto final si aparece
        
        // Actualizamos ESTE elemento en concreto
        dateElement.textContent = `${timePart} / ${formattedDate}`;
      }
    } 
    // Fallback: Si el post solo tiene la fecha (ej: "29 Apr")
    else {
      const fallbackDate = new Date(rawText);
      
      if (!isNaN(fallbackDate.getTime())) {
        let formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(fallbackDate);
        dateElement.textContent = formattedDate.replace('.', '');
      }
    }
  });
});
