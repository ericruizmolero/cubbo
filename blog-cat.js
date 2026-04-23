document.addEventListener("DOMContentLoaded", () => {
    // --- 1. CONFIGURACIÓN ---
    const ITEMS_POR_PAGINA = 4; 

    // --- REFERENCIAS DEL DOM ---
    const articulos = Array.from(document.querySelectorAll('.feed_coll-item'));
    const categoriasBtns = document.querySelectorAll('.feed_cat');
    const btnCargarMas = document.querySelector('.feed_button');

    // --- ESTADO INICIAL ---
    let categoriaActual = 'Todos los artículos';
    let articulosVisibles = ITEMS_POR_PAGINA;
    const conteoCategorias = { 'Todos los artículos': articulos.length };

    // --- 2. CONTAR ARTÍCULOS POR CATEGORÍA ---
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

    // --- 3. ACTUALIZAR NÚMEROS DE CATEGORÍA ---
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

    // --- 4. LÓGICA PARA MOSTRAR / OCULTAR CON ANIMACIÓN ---
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
        if (articulosFiltrados.length > articulosVisibles) {
            btnCargarMas.style.display = 'flex';
        } else {
            btnCargarMas.style.display = 'none';
        }
    }

    // --- 5. EVENTOS: CLIC EN CATEGORÍAS ---
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

    // --- 6. EVENTOS: CLIC EN CARGAR MÁS ---
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
