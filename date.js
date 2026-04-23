document.addEventListener("DOMContentLoaded", () => {
  /* ====================================================================
     TRADUCCIÓN Y FORMATO DE LA FECHA
     ==================================================================== */
  const dateElement = document.querySelector('[post-date]');
  
  if (dateElement) {
    // Leemos la fecha original
    const originalDate = new Date(dateElement.textContent.trim());
    
    // Si la fecha es válida, procedemos a traducirla
    if (!isNaN(originalDate.getTime())) {
      const pageLang = document.documentElement.lang.toLowerCase();
      
      // Idioma por defecto (español) y variante para portugués
      let locale = 'es-ES'; 
      if (pageLang.includes('br')) {
        locale = 'pt-BR';
      }

      // Opciones de formato (ej: 24 de octubre de 2023)
      const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(originalDate);
      
      // Reemplazamos el texto
      dateElement.textContent = formattedDate;
    }
  }
});
