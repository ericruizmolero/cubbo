document.addEventListener("DOMContentLoaded", async () => {
    // --- 0. PREPARACIÓN: OCULTAR PAGINACIÓN NATIVA DE WEBFLOW ---
    // Ocultamos la paginación estándar de Webflow para usar nuestro propio botón "Cargar más"
    const webflowPagination = document.querySelector('.w-pagination-wrapper');
    if (webflowPagination) webflowPagination.style.display = 'none';

    // --- 1. FUNCIÓN PARA TRAER TODOS LOS ITEMS PAGINADOS (AJAX) ---
    async function cargarTodosLosArticulos() {
        // Buscamos el contenedor donde están los artículos para añadir los nuevos ahí
        const primerArticulo = document.querySelector('.feed_coll-item');
        if (!primerArticulo) return; 
        const contenedor = primerArticulo.parentElement;

        let botonSiguiente = document.querySelector('.w-pagination-next');

        // Mientras exista un botón de "Siguiente página"
        while (botonSiguiente) {
            const urlSiguiente = botonSiguiente.getAttribute('href');
            if (!urlSiguiente) break;

            try {
                // Hacemos la petición a la siguiente página
                const respuesta = await fetch(urlSiguiente);
                const html = await respuesta.text();
                
                // Convertimos el texto HTML en un documento que podemos manipular
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extraemos los artículos de la nueva página
                const nuevosArticulos = Array.from(doc.querySelectorAll('.feed_coll-item'));
                
                // Los añadimos al contenedor de nuestra página actual
                nuevosArticulos.forEach(articulo => {
                    // Opcional: asegurarnos de que empiezan ocultos para que no parpadeen
                    articulo.style.display = 'none'; 
                    contenedor.appendChild(articulo);
                });

                // Buscamos si la página que acabamos de cargar tiene OTRA página siguiente
                botonSiguiente = doc.querySelector('.w-pagination-next');
            } catch (error) {
                console.error("Error cargando más artículos de Webflow:", error);
                break;
            }
        }
    }

    // ESPERAMOS a que se descarguen ocultamente todos los 272 posts
    await cargarTodosLosArticulos();


    // --- 2. CONFIGURACIÓN ---
    const ITEMS_POR_PAGINA = 10; 

    // --- REFERENCIAS DEL DOM (Ahora sí selecciona los 272 posts) ---
    const articulos = Array.from(document.querySelectorAll('.feed_coll-item'));
    const categoriasBtns = document.querySelectorAll('.feed_cat');
    const btnCargarMas = document.querySelector('.feed_button');

    // --- ESTADO INICIAL ---
    let categoriaActual = 'Todos los artículos';
    let articulosVisibles = ITEMS_POR_PAGINA;
    const conteoCategorias = { 'Todos los artículos': articulos.length };

    // --- 3. CONTAR ARTÍCULOS POR CATEGORÍA ---
    articulos.forEach(articulo => {
        const tags = articulo.querySelectorAll('.related_tagline');
        if (tags.length > 1) {
            const categoria = tags[1].textContent.trim();
            articulo.dataset.categoria = categoria; 

            if (!conteoCategorias[categoria]) {
                conteoCategorias[categoria] = 0;
            }
            conteoCategorias[categoria]++;
        }
    });

    // --- 4. ACTUALIZAR NÚMEROS DE CATEGORÍA ---
    categoriasBtns.forEach(btn => {
        const nombreCategoria = btn.querySelector('div:first-child').textContent.trim();
        const numElement = btn.querySelector('.feed_number');

        const cantidad = conteoCategorias[nombreCategoria] || 0;
        if (numElement) {
            numElement.textContent = `[${cantidad}]`;
        }

        if (nombreCategoria === 'Todos los artículos') {
            btn.classList.add('is-active');
        } else {
            btn.classList.remove('is-active');
        }
    });

    // --- 5. LÓGICA PARA MOSTRAR / OCULTAR CON ANIMACIÓN ---
    function renderizarArticulos() {
        let articulosFiltrados = [];

        // 1. Filtrar y preparar para ocultar
        articulos.forEach(articulo => {
            // Quitamos la clase visible para reiniciar la animación
            articulo.classList.remove('is-visible'); 
            articulo.style.display = 'none';

            if (categoriaActual === 'Todos los artículos' || articulo.dataset.categoria === categoriaActual) {
                articulosFiltrados.push(articulo);
            }
        });

        // 2. Mostrar con efecto en cascada (staggered)
        for (let i = 0; i < Math.min(articulosVisibles, articulosFiltrados.length); i++) {
            const articulo = articulosFiltrados[i];
            
            // Primero, lo devolvemos al DOM quitando el display: none
            articulo.style.display = ''; 

            // Usamos setTimeout para añadir la clase que lanza la transición CSS.
            // Multiplicar 'i' por 50ms crea un efecto cascada (aparece uno tras otro rápidamente)
            setTimeout(() => {
                articulo.classList.add('is-visible');
            }, 50 * i);
        }

        // 3. Evaluar el botón de "Cargar más"
        if (btnCargarMas) {
            if (articulosFiltrados.length > articulosVisibles) {
                btnCargarMas.style.display = 'flex';
            } else {
                btnCargarMas.style.display = 'none';
            }
        }
    }

    // --- 6. EVENTOS: CLIC EN CATEGORÍAS ---
    categoriasBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 

            categoriasBtns.forEach(c => c.classList.remove('is-active'));
            btn.classList.add('is-active');

            categoriaActual = btn.querySelector('div:first-child').textContent.trim();
            articulosVisibles = ITEMS_POR_PAGINA; 

            renderizarArticulos();
        });
    });

    // --- 7. EVENTOS: CLIC EN CARGAR MÁS ---
    if (btnCargarMas) {
        btnCargarMas.addEventListener('click', (e) => {
            e.preventDefault();
            articulosVisibles += ITEMS_POR_PAGINA;
            renderizarArticulos();
        });
    }

    // Iniciar
    renderizarArticulos();
});
