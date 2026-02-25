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
        const medioFiltro = contenedor.getAttribute('data-medio');
        const modalidadFiltro = contenedor.getAttribute('data-modalidad');
        
        // Ponemos el título automáticamente
        const tituloPagina = document.getElementById('titulo-pagina');
        if (tituloPagina) {
            if (medioFiltro) tituloPagina.innerText = "Noticias de " + medioFiltro;
            if (modalidadFiltro) tituloPagina.innerText = "Noticias de " + modalidadFiltro;
        }

        if (sheetURL) {
            cargarNoticias(sheetURL, medioFiltro, modalidadFiltro, contenedor);
        }
    }
});

async function cargarNoticias(url, filtroMedio, filtroModalidad, contenedor) {
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
            // 0:Fecha, 1:Link, 2:Titulo, 3:Foto, 4:Medio, 5:Modalidad
            if (col.length < 6) return; 

            const [fecha, link, titulo, foto, medio, modalidad] = col;

            // LÓGICA DE FILTRADO
            let mostrar = false;

            // 1. Si la página pide Medio, comprobamos la columna 4 (medio)
            if (filtroMedio && medio && medio.toUpperCase() === filtroMedio.toUpperCase()) {
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
                            <small style="color:#ddd; font-size:0.7rem; display:block; margin-top:5px;">${medio}</small>
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

// Mostrar más fotos en la página En Papel
document.addEventListener('DOMContentLoaded', () => {
    const botonMas = document.getElementById('boton-cargar-mas');
    const fotosOcultas = document.querySelectorAll('.oculta');

    if (botonMas) {
        botonMas.addEventListener('click', (evento) => {
            evento.preventDefault(); 
            
            // Hace visibles las 9 fotos ocultas
            fotosOcultas.forEach(foto => foto.classList.remove('oculta'));

            // Esconde el botón
            botonMas.style.display = 'none';
        });
    }
});

// =========================================================
// --- LÓGICA PARA COLUMNAS DE OPINIÓN EXPANDIBLES ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const contenedorOpiniones = document.getElementById('contenedor-opiniones');

    if (contenedorOpiniones) {
        const sheetURL = contenedorOpiniones.getAttribute('data-sheet');
        
        if (sheetURL && !sheetURL.includes("PEGA_AQUI")) {
            cargarOpiniones(sheetURL, contenedorOpiniones);
        } else {
            contenedorOpiniones.innerHTML = '<p class="mensaje-carga">Falta añadir el enlace del CSV de Google Sheets en el HTML.</p>';
        }
    }

    // --- NUEVO PARSEADOR CSV ROBUSTO ---
    // Esta función lee el Excel sin romperse por culpa de los párrafos largos
    function parsearCSV(str) {
        const arr = [];
        let quote = false;
        let row = 0, col = 0;
        for (let c = 0; c < str.length; c++) {
            let cc = str[c], nc = str[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            
            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; } 
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }
            
            arr[row][col] += cc;
        }
        return arr;
    }

    async function cargarOpiniones(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            // Leemos el texto con nuestra nueva función y quitamos la cabecera
            const filas = parsearCSV(texto);
            filas.shift(); // Borra la fila 0 (Cabecera)

            contenedor.innerHTML = ''; 

            filas.forEach(col => {
                // Si la fila está vacía o no tiene al menos 4 datos, se ignora
                if (col.length < 4 || !col[0]) return; 

                const [fecha, titulo, contenidoRaw, foto] = col;
                
                // Transforma los saltos de línea invisibles del Excel en párrafos web
                const contenidoFormateado = contenidoRaw.replace(/\n/g, '<br><br>');

                // Crear el elemento artículo
                const tarjeta = document.createElement('article');
                tarjeta.classList.add('opinion-tarjeta');
                
                tarjeta.innerHTML = `
                    <div class="opinion-vista-corta" style="background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('${foto}');">
                        <span class="opinion-fecha-corta">${fecha}</span>
                        <h3 class="opinion-titulo-corto">${titulo}</h3>
                    </div>

                    <div class="opinion-vista-larga">
                        <h1 class="opinion-titulo-largo">${titulo}</h1>
                        <span class="opinion-fecha-larga">${fecha}</span>
                        
                        <img src="${foto}" alt="${titulo}" class="opinion-imagen-larga">
                        
                        <div class="opinion-texto-largo">${contenidoFormateado}</div>
                        
                        <button class="btn-cerrar-articulo">Cerrar Artículo</button>
                    </div>
                `;

                // --- LÓGICA DE ABRIR Y CERRAR ---
                const vistaCorta = tarjeta.querySelector('.opinion-vista-corta');
                const btnCerrar = tarjeta.querySelector('.btn-cerrar-articulo');

                vistaCorta.addEventListener('click', () => {
                    // Cierra las demás
                    document.querySelectorAll('.opinion-tarjeta.expandida').forEach(t => t.classList.remove('expandida'));
                    // Abre esta
                    tarjeta.classList.add('expandida');
                    setTimeout(() => tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                });

                btnCerrar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tarjeta.classList.remove('expandida');
                    setTimeout(() => tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                });

                contenedor.appendChild(tarjeta);
            });

            if (contenedor.innerHTML === '') {
                contenedor.innerHTML = '<p class="mensaje-carga">No hay opiniones publicadas todavía.</p>';
            }

        } catch (error) {
            console.error("Error cargando opiniones:", error);
            contenedor.innerHTML = "<p class='mensaje-carga'>Error cargando las columnas de opinión.</p>";
        }
    }
});

// =========================================================
// --- LÓGICA DEL VISOR DE IMÁGENES (LIGHTBOX) ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos del visor
    const modal = document.getElementById("visor-modal");
    const modalImg = document.getElementById("img-full");
    const captionText = document.getElementById("modal-caption");
    const spanCerrar = document.getElementsByClassName("cerrar-modal")[0];

    // Seleccionamos todas las imágenes de la galería "En Papel"
    // (Asegúrate de que tus fotos en papel.html tengan la clase "papel-img")
    const imagenes = document.querySelectorAll('.papel-img');

    if (modal && modalImg) {
        imagenes.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "flex"; // Mostramos el visor
                modalImg.src = this.src;      // Ponemos la foto clicada
                if(captionText) captionText.innerHTML = this.alt; // Ponemos el texto alternativo como pie de foto
            });
        });

        // Cerrar al pulsar la X
        if (spanCerrar) {
            spanCerrar.onclick = function() { 
                modal.style.display = "none";
            }
        }

        // Cerrar al pulsar fuera de la imagen (en el fondo negro)
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
    }
});