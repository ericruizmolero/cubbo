document.addEventListener("DOMContentLoaded", () => {
    // --- 0. PREPARACIÓN: OCULTAR PAGINACIÓN NATIVA ---
    const webflowPagination = document.querySelector('.w-pagination-wrapper');
    if (webflowPagination) webflowPagination.style.display = 'none';

    // --- 1. CONFIGURACIÓN INICIAL ---
    const ITEMS_POR_PAGINA = 10; // Ajustado a 4 según tu último código
    let articulos = Array.from(document.querySelectorAll('.feed_coll-item'));
    const categoriasBtns = document.querySelectorAll('.feed_cat');
    const btnCargarMas = document.querySelector('.feed_button');

    // NUEVO: Buscamos el elemento que tiene el atributo 'blog-cat'
    const elementoCategoriaActual = document.querySelector('[blog-cat]');

    // NUEVO: Si existe, leemos su texto para arrancar en esa categoría.
    let categoriaActual = 'Todos los artículos';
    if (elementoCategoriaActual) {
        categoriaActual = elementoCategoriaActual.textContent.trim();
    }

    let articulosVisibles = ITEMS_POR_PAGINA;

    // --- 2. FUNCIÓN CENTRALIZADA (CONTAR, ACTUALIZAR Y RENDERIZAR) ---
    function procesarYRenderizar() {
        // 2A. Recalcular las categorías con los artículos actuales
        const conteoCategorias = { 'Todos los artículos': articulos.length };

        articulos.forEach(articulo => {
            const tags = articulo.querySelectorAll('.related_tagline');
            if (tags.length > 1) {
                const categoria = tags[1].textContent.trim();
                articulo.dataset.categoria = categoria; 

                if (!conteoCategorias[categoria]) conteoCategorias[categoria] = 0;
                conteoCategorias[categoria]++;
            }
        });

        // 2B. Actualizar los números visuales y el botón activo
        categoriasBtns.forEach(btn => {
            const nombreCategoria = btn.querySelector('div:first-child').textContent.trim();
            const numElement = btn.querySelector('.feed_number');
            const cantidad = conteoCategorias[nombreCategoria] || 0;
            
            if (numElement) numElement.textContent = `[${cantidad}]`;

            // Mantener activo el botón que coincida con la categoría que leímos de [blog-cat]
            if (nombreCategoria === categoriaActual) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        });

        // 2C. Filtrar y mostrar/ocultar con animación
        let articulosFiltrados = [];
        articulos.forEach(articulo => {
            articulo.classList.remove('is-visible'); 
            articulo.style.display = 'none';

            if (categoriaActual === 'Todos los artículos' || articulo.dataset.categoria === categoriaActual) {
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

    // --- 3. ARRANCAR INSTANTÁNEAMENTE ---
    // Carga los primeros artículos en menos de un segundo
    procesarYRenderizar();

    // --- 4. DESCARGAR EL RESTO EN SEGUNDO PLANO ---
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
                    articulos.push(articulo); // Los añadimos a nuestra lista global
                });

                // Como han llegado artículos nuevos por detrás, recalculamos todo para actualizar los números y los filtros
                procesarYRenderizar();

                botonSiguiente = doc.querySelector('.w-pagination-next');
            } catch (error) {
                console.error("Error en carga de segundo plano:", error);
                break;
            }
        }
    }

    // Ejecutamos sin "await" para no bloquear la pantalla del usuario
    cargarRestoEnSegundoPlano();

    // --- 5. EVENTOS DE CLIC ---
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
