document.addEventListener("DOMContentLoaded", () => {
  /* ====================================================================
     TRADUCCIÓN Y FORMATO DE FECHA CON TEXTO ADICIONAL
     ==================================================================== */
  const dateElement = document.querySelector('[post-date]');
  
  if (dateElement) {
    // Leemos el texto completo (ej: "12 min / 29 Apr")
    const rawText = dateElement.textContent.trim();
    
    // Separamos el texto usando la barra "/" como punto de corte
    const parts = rawText.split('/');
    
    // Si efectivamente encontramos dos partes (el tiempo y la fecha)
    if (parts.length === 2) {
      const timePart = parts[0].trim(); // "12 min"
      const datePart = parts[1].trim(); // "29 Apr"
      
      // Intentamos crear la fecha solo con "29 Apr"
      const originalDate = new Date(datePart);
      
      if (!isNaN(originalDate.getTime())) {
        const pageLang = document.documentElement.lang.toLowerCase();
        let locale = pageLang.includes('br') ? 'pt-BR' : 'es-ES';
        
        // Al ser una fecha acortada (sin año en tu ejemplo), usamos month: 'short'
        const dateOptions = { day: 'numeric', month: 'short' };
        let formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(originalDate);
        
        // Opcional: Quitar el punto final que a veces añade Intl (ej: "29 abr." -> "29 abr")
        formattedDate = formattedDate.replace('.', '');
        
        // Reconstruimos el texto original con la fecha traducida
        dateElement.textContent = `${timePart} / ${formattedDate}`;
      }
    } 
    // Fallback: Por si en algún post solo viene la fecha y no el "12 min /"
    else {
      const fallbackDate = new Date(rawText);
      if (!isNaN(fallbackDate.getTime())) {
        const pageLang = document.documentElement.lang.toLowerCase();
        let locale = pageLang.includes('br') ? 'pt-BR' : 'es-ES';
        const dateOptions = { day: 'numeric', month: 'short' };
        
        let formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(fallbackDate);
        dateElement.textContent = formattedDate.replace('.', '');
      }
    }
  }
});
