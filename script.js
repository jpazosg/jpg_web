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

    // --- 2. CARGA DE NOTICIAS (DINÁMICO) ---
    const contenedor = document.getElementById('contenedor-dinamico');

    if (contenedor) {
        const sheetURL = contenedor.getAttribute('data-sheet');
        
        // Detectamos qué tipo de filtro estamos usando
        const editorialFiltro = contenedor.getAttribute('data-editorial');
        const modalidadFiltro = contenedor.getAttribute('data-modalidad');
        
        // Ponemos el título automáticamente
        const tituloPagina = document.getElementById('titulo-pagina');
        if (tituloPagina) {
            if (editorialFiltro) tituloPagina.innerText = "Noticias de " + editorialFiltro;
            if (modalidadFiltro) tituloPagina.innerText = "Noticias de " + modalidadFiltro;
        }

        if (sheetURL) {
            cargarNoticias(sheetURL, editorialFiltro, modalidadFiltro, contenedor);
        }
    }
});

async function cargarNoticias(url, filtroEditorial, filtroModalidad, contenedor) {
    try {
        const respuesta = await fetch(url);
        const texto = await respuesta.text();
        
        // Separar filas
        const filas = texto.split("\n").slice(1); 

        contenedor.innerHTML = ''; 

        filas.forEach(filaRaw => {
            // Regex para respetar comas dentro de comillas
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const col = filaRaw.split(regex).map(val => val.replace(/^"|"$/g, '').trim());

            // IMPORTANTE: Asegúrate de que tu Excel tiene 6 columnas
            // 0:Fecha, 1:Link, 2:Titulo, 3:Foto, 4:Editorial, 5:Modalidad
            if (col.length < 6) return; 

            const [fecha, link, titulo, foto, editorial, modalidad] = col;

            // LÓGICA DE FILTRADO
            let mostrar = false;

            // 1. Si la página pide Editorial, comprobamos la columna 4 (editorial)
            if (filtroEditorial && editorial && editorial.toUpperCase() === filtroEditorial.toUpperCase()) {
                mostrar = true;
            }

            // 2. Si la página pide Modalidad, comprobamos la columna 5 (modalidad)
            // Usamos 'includes' por si en el excel pusiste "F1 " con un espacio sin querer
            if (filtroModalidad && modalidad && modalidad.toUpperCase().includes(filtroModalidad.toUpperCase())) {
                mostrar = true;
            }

            if (mostrar) {
                const tarjeta = `
                    <a href="${link}" target="_blank" class="tarjeta tarjeta-dinamica" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${foto}');">
                        <div class="contenido-tarjeta-dinamica">
                            <span class="fecha-tarjeta">${fecha}</span>
                            <h3 class="titulo-tarjeta">${titulo}</h3>
                            <small style="color:#ddd; font-size:0.7rem; display:block; margin-top:5px;">${editorial}</small>
                        </div>
                    </a>
                `;
                contenedor.innerHTML += tarjeta;
            }
        });

        if (contenedor.innerHTML === '') {
            contenedor.innerHTML = '<p style="text-align:center; width:100%;">No hay noticias disponibles con este filtro.</p>';
        }

    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = "<p>Error cargando noticias.</p>";
    }
}