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

    async function cargarOpiniones(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            // Separar filas quitando la cabecera
            const filas = texto.split("\n").slice(1); 
            contenedor.innerHTML = ''; 

            filas.forEach(filaRaw => {
                const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const col = filaRaw.split(regex).map(val => val.replace(/^"|"$/g, '').trim());

                // Google Sheets de Opinión: 0:Fecha, 1:Titulo, 2:Contenido, 3:Foto
                if (col.length < 4) return; 

                const [fecha, titulo, contenidoRaw, foto] = col;
                
                // Formatear saltos de línea para que se vean bien los párrafos
                const contenidoFormateado = contenidoRaw.replace(/\\n/g, '<br><br>').replace(/\n/g, '<br><br>');

                // Crear el elemento artículo
                const tarjeta = document.createElement('article');
                tarjeta.classList.add('opinion-tarjeta');
                
                // HTML de la tarjeta (Corta y Larga)
                tarjeta.innerHTML = `
                    <div class="opinion-vista-corta" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.9)), url('${foto}');">
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

                // --- LÓGICA DE EXPANSIÓN ---
                const vistaCorta = tarjeta.querySelector('.opinion-vista-corta');
                const btnCerrar = tarjeta.querySelector('.btn-cerrar-articulo');

                // Al hacer click en la foto (Vista corta)
                vistaCorta.addEventListener('click', () => {
                    // Opcional: Cerrar cualquier otro artículo que estuviera abierto
                    document.querySelectorAll('.opinion-tarjeta.expandida').forEach(t => t.classList.remove('expandida'));
                    
                    // Expandir este artículo
                    tarjeta.classList.add('expandida');
                    
                    // Hacer un pequeño scroll automático para centrar el título en la pantalla
                    setTimeout(() => {
                        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                });

                // Al hacer click en el botón de cerrar
                btnCerrar.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que se disparen otros clicks
                    tarjeta.classList.remove('expandida');
                    
                    // Volver a hacer scroll para no perder de vista la tarjeta original
                    setTimeout(() => {
                        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
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