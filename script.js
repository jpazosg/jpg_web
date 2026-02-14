document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MENÚ HAMBURGUESA ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navDropdown = document.querySelector('.nav-dropdown');
    
    if (menuToggle && navDropdown) {
        const navLinks = document.querySelectorAll('.nav-dropdown a');
        menuToggle.addEventListener('click', () => {
            navDropdown.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navDropdown.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // --- 2. SISTEMA DE NOTICIAS ---
    const contenedor = document.getElementById('contenedor-dinamico');
    const selectSort = document.getElementById('sort-select');
    const paginationContainer = document.getElementById('pagination');

    let allNews = [];       // Todas las noticias tal cual vienen del CSV
    let currentPage = 1;    // Página actual
    const itemsPerPage = 10; // Límite de noticias por página

    if (contenedor) {
        const sheetURL = contenedor.getAttribute('data-sheet');
        const medioFiltro = contenedor.getAttribute('data-medio');
        const modalidadFiltro = contenedor.getAttribute('data-modalidad');
        
        const tituloPagina = document.getElementById('titulo-pagina');
        if (tituloPagina) {
            if (medioFiltro) tituloPagina.innerText = "Noticias de " + medioFiltro;
            if (modalidadFiltro) tituloPagina.innerText = "Noticias de " + modalidadFiltro;
        }

        if (sheetURL) {
            iniciarAppNoticias(sheetURL, medioFiltro, modalidadFiltro);
        }
    }

    async function iniciarAppNoticias(url, filtroMedio, filtroModalidad) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            // Procesamos y guardamos el orden ORIGINAL del CSV
            allNews = procesarCSV(texto, filtroMedio, filtroModalidad);

            if (selectSort) {
                selectSort.addEventListener('change', () => {
                    currentPage = 1; 
                    renderizarApp();
                });
            }

            // Renderizamos tal cual (orden 'default')
            renderizarApp();

        } catch (error) {
            console.error("Error:", error);
            contenedor.innerHTML = "<p>Error cargando noticias.</p>";
        }
    }

    function renderizarApp() {
        // Obtenemos el criterio. Si no hay select, es 'default'
        const orden = selectSort ? selectSort.value : 'default';
        
        // IMPORTANTE: Hacemos una copia ([...allNews]) para no alterar el array original
        // Así si volvemos a 'default', recuperamos el orden del CSV
        let listaParaMostrar = [...allNews];

        // Solo ordenamos si NO es el orden por defecto
        if (orden !== 'default') {
            ordenarNoticias(listaParaMostrar, orden);
        }

        // Paginación
        const totalPages = Math.ceil(listaParaMostrar.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        const noticiasPagina = listaParaMostrar.slice(startIndex, endIndex);

        pintarNoticias(noticiasPagina);
        pintarPaginacion(totalPages);
    }

    function pintarNoticias(noticias) {
        contenedor.innerHTML = ''; 

        if (noticias.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center; width:100%;">No hay noticias disponibles.</p>';
            return;
        }

        noticias.forEach(item => {
            const tarjeta = `
                <a href="${item.link}" target="_blank" class="tarjeta tarjeta-dinamica" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${item.foto}');">
                    <div class="contenido-tarjeta-dinamica">
                        <span class="fecha-tarjeta">${item.fechaOriginal}</span>
                        <h3 class="titulo-tarjeta">${item.titulo}</h3>
                        <small style="color:#ddd; font-size:0.7rem; display:block; margin-top:5px;">${item.medio}</small>
                    </div>
                </a>
            `;
            contenedor.innerHTML += tarjeta;
        });
    }

    function pintarPaginacion(total) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (total <= 1) return; 

        for (let i = 1; i <= total; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('page-btn');
            if (i === currentPage) btn.classList.add('active');

            btn.addEventListener('click', () => {
                currentPage = i;
                renderizarApp();
                const headerTitle = document.getElementById('titulo-pagina');
                if (headerTitle) headerTitle.scrollIntoView({ behavior: 'smooth' });
            });

            paginationContainer.appendChild(btn);
        }
    }

    function ordenarNoticias(lista, criterio) {
        lista.sort((a, b) => {
            if (criterio === 'date-desc') return b.fechaObjeto - a.fechaObjeto;
            if (criterio === 'date-asc') return a.fechaObjeto - b.fechaObjeto;
            if (criterio === 'title-asc') return a.titulo.localeCompare(b.titulo);
            if (criterio === 'title-desc') return b.titulo.localeCompare(a.titulo);
            return 0;
        });
    }

    function procesarCSV(texto, filtroMedio, filtroModalidad) {
        const filas = texto.split("\n").slice(1);
        const datosLimpios = [];

        filas.forEach(filaRaw => {
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const col = filaRaw.split(regex).map(val => val.replace(/^"|"$/g, '').trim());

            if (col.length < 6) return;

            const [fecha, link, titulo, foto, medio, modalidad] = col;

            let mostrar = false;
            if (filtroMedio && medio && medio.toUpperCase() === filtroMedio.toUpperCase()) mostrar = true;
            if (filtroModalidad && modalidad && modalidad.toUpperCase().includes(filtroModalidad.toUpperCase())) mostrar = true;

            if (mostrar) {
                datosLimpios.push({
                    fechaOriginal: fecha,
                    fechaObjeto: convertirFecha(fecha),
                    link,
                    titulo,
                    foto,
                    medio,
                    modalidad
                });
            }
        });
        return datosLimpios;
    }

    function convertirFecha(fechaStr) {
        if (!fechaStr) return new Date(0);
        const partes = fechaStr.split('/'); 
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]);
        }
        return new Date(0); 
    }
});
