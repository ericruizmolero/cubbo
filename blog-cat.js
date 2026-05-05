document.addEventListener("DOMContentLoaded", () => {
    // --- 0. PREPARACIÓN ---
    
    // 1. Detectar el idioma basado en la URL (si estamos en /br o no)
    const esPortugues = window.location.pathname.includes('/br');
    // 2. Asignar el texto dinámicamente
    const TEXTO_TODOS = esPortugues ? 'Todos os artigos' : 'Todos los artículos';

    const webflowPagination = document.querySelector('.w-pagination-wrapper');
    if (webflowPagination) webflowPagination.style.display = 'none';

    const ITEMS_POR_PAGINA = 10; 
    let articulos = Array.from(document.querySelectorAll('.feed_coll-item'));
    const categoriasBtns = document.querySelectorAll('.feed_cat');
    const btnCargarMas = document.querySelector('.feed_button');
    
    // 3. Usar la variable en la inicialización
    let categoriaActual = TEXTO_TODOS; 
    let articulosVisibles = ITEMS_POR_PAGINA;

    // --- 1. FUNCIÓN CENTRALIZADA PARA CONTAR Y RENDERIZAR ---
    function procesarYRenderizar() {
        // 1A. Recalcular las categorías con los artículos actuales usando la variable
        const conteoCategorias = {};
        conteoCategorias[TEXTO_TODOS] = articulos.length;

        articulos.forEach(articulo => {
            const tags = articulo.querySelectorAll('.related_tagline');
            if (tags.length > 1) {
                const categoria = tags[1].textContent.trim();
                articulo.dataset.categoria = categoria; 

                if (!conteoCategorias[categoria]) conteoCategorias[categoria] = 0;
                conteoCategorias[categoria]++;
            }
        });

        // 1B. Actualizar los números visuales en los botones
        categoriasBtns.forEach(btn => {
            const nombreCategoria = btn.querySelector('div:first-child').textContent.trim();
            const numElement = btn.querySelector('.feed_number');
            const cantidad = conteoCategorias[nombreCategoria] || 0;
            
            if (numElement) numElement.textContent = `[${cantidad}]`;

            // Mantener la clase activa correctamente
            if (nombreCategoria === categoriaActual) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        });

        // 1C. Filtrar y mostrar/ocultar con animación
        let articulosFiltrados = [];
        articulos.forEach(articulo => {
            articulo.classList.remove('is-visible'); 
            articulo.style.display = 'none';

            // 4. Usar la variable en el filtro condicional
            if (categoriaActual === TEXTO_TODOS || articulo.dataset.categoria === categoriaActual) {
                articulosFiltrados.push(articulo);
            }
        });

        for (let i = 0; i < Math.min(articulosVisibles, articulosFiltrados.length); i++) {
            const articulo = articulosFiltrados[i];
            articulo.style.display = ''; 
            setTimeout(() => articulo.classList.add('is-visible'), 50 * i);
        }

        if (btnCargarMas) {
            btnCargarMas.style.display = (articulosFiltrados.length > articulosVisibles) ? 'flex' : 'none';
        }
    }

    // --- 2. ARRANCAR INSTANTÁNEAMENTE CON LA PÁGINA 1 ---
    procesarYRenderizar();

    // --- 3. DESCARGAR EL RESTO EN SEGUNDO PLANO ---
    async function cargarRestoEnSegundoPlano() {
        const primerArticulo = document.querySelector('.feed_coll-item');
        if (!primerArticulo) return; 
        const contenedor = primerArticulo.parentElement;

        let botonSiguiente = document.querySelector('.w-pagination-next');

        while (botonSiguiente) {
            const urlSiguiente = botonSiguiente.getAttribute('href');
            if (!urlSiguiente) break;

            try {
                const respuesta = await fetch(urlSiguiente);
                const html = await respuesta.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const nuevosArticulos = Array.from(doc.querySelectorAll('.feed_coll-item'));
                
                nuevosArticulos.forEach(articulo => {
                    articulo.style.display = 'none'; 
                    contenedor.appendChild(articulo);
                    articulos.push(articulo); 
                });

                procesarYRenderizar();

                botonSiguiente = doc.querySelector('.w-pagination-next');
            } catch (error) {
                console.error("Error en carga de segundo plano:", error);
                break;
            }
        }
    }

    cargarRestoEnSegundoPlano();

    // --- 4. EVENTOS DE CLIC ---
    categoriasBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            categoriaActual = btn.querySelector('div:first-child').textContent.trim();
            articulosVisibles = ITEMS_POR_PAGINA; 
            procesarYRenderizar();
        });
    });

    if (btnCargarMas) {
        btnCargarMas.addEventListener('click', (e) => {
            e.preventDefault();
            articulosVisibles += ITEMS_POR_PAGINA;
            procesarYRenderizar();
        });
    }
});
