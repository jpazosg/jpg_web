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

        // AÑADIDO: 'index' para saber el orden original
        filas.forEach((filaRaw, index) => {
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
            if (filtroModalidad && modalidad && modalidad.toUpperCase().includes(filtroModalidad.toUpperCase())) {
                mostrar = true;
            }

            if (mostrar) {
                // AÑADIDO: data-fecha, data-titulo y data-indice
                const tarjeta = `
                    <a href="${link}" target="_blank" class="tarjeta tarjeta-dinamica" data-fecha="${fecha}" data-titulo="${titulo}" data-indice="${index}" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${foto}');">
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

            // AÑADIDO: 'index' para el orden original
            filas.forEach((col, index) => {
                // Si la fila está vacía o no tiene al menos 4 datos, se ignora
                if (col.length < 4 || !col[0]) return; 

                const [fecha, titulo, contenidoRaw, foto] = col;
                
                // Transforma los saltos de línea invisibles del Excel en párrafos web
                const contenidoFormateado = contenidoRaw.replace(/\n/g, '<br><br>');

                // Crear el elemento artículo
                const tarjeta = document.createElement('article');
                tarjeta.classList.add('opinion-tarjeta');
                
                // AÑADIDO: Atributos para poder ordenar las columnas
                tarjeta.setAttribute('data-fecha', fecha);
                tarjeta.setAttribute('data-titulo', titulo);
                tarjeta.setAttribute('data-indice', index);
                
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
// --- LÓGICA DEL VISOR CON ZOOM Y ARRASTRE (PROFESIONAL) ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const modal = document.getElementById("visor-modal");
    const modalImg = document.getElementById("img-full");
    const captionText = document.getElementById("modal-caption");
    const spanCerrar = document.getElementsByClassName("cerrar-modal")[0];
    
    // Asegúrate de que tus fotos en papel.html tengan la clase "papel-img"
    const imagenes = document.querySelectorAll('.papel-img');

    // Variables para controlar el zoom y la posición
    let escalaActual = 1;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let startX, startY;

    if (modal && modalImg) {
        
        // --- FUNCIÓN PARA ABRIR EL MODAL ---
        imagenes.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "flex";
                modalImg.src = this.src;
                if(captionText) captionText.innerHTML = this.alt;
                
                // IMPORTANTE: Resetear el zoom cada vez que se abre una foto nueva
                resetZoom();
            });
        });

        // --- FUNCIÓN PARA CERRAR EL MODAL ---
        function cerrarModal() {
            modal.style.display = "none";
            resetZoom(); // Reseteamos al cerrar por si acaso
        }

        if (spanCerrar) spanCerrar.onclick = cerrarModal;
        
        modal.onclick = function(event) {
            // Solo cierra si hacemos clic en el fondo negro, no en la imagen
            if (event.target === modal) cerrarModal();
        }

        // --- LÓGICA DE ZOOM (RUEDA DEL RATÓN) ---
        modal.addEventListener('wheel', function(e) {
            e.preventDefault(); // Evita que la página haga scroll

            // Calculamos la nueva escala (hacia arriba acerca, hacia abajo aleja)
            const delta = e.deltaY * -0.001;
            escalaActual += delta;

            // Limitamos el zoom: Mínimo 1 (tamaño original), Máximo 5 veces más grande
            escalaActual = Math.min(Math.max(1, escalaActual), 5);

            // Si volvemos al tamaño original, reseteamos la posición
            if (escalaActual === 1) {
                currentX = 0;
                currentY = 0;
            }

            aplicarTransformacion();
        });

        // --- LÓGICA DE ARRASTRAR (PANEO) ---
        modalImg.addEventListener('mousedown', function(e) {
            // Solo permitimos arrastrar si hay zoom (escala > 1)
            if (escalaActual > 1) {
                isDragging = true;
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
                modalImg.classList.add('arrastrando'); // Cambia el cursor
                e.preventDefault(); // Evita comportamientos raros del navegador
            }
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                currentX = e.clientX - startX;
                currentY = e.clientY - startY;
                aplicarTransformacion();
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                modalImg.classList.remove('arrastrando');
            }
        });

        // --- FUNCIONES AUXILIARES ---
        
        // Aplica los cambios de CSS a la imagen
        function aplicarTransformacion() {
            modalImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${escalaActual})`;
        }

        // Vuelve la imagen a su estado original
        function resetZoom() {
            escalaActual = 1;
            currentX = 0;
            currentY = 0;
            modalImg.style.transform = "translate(0px, 0px) scale(1)";
        }
    }
});

// =========================================================
// --- LÓGICA PARA LAS 3 ÚLTIMAS OPINIONES EN LA PORTADA ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const contenedorUltimas = document.getElementById('ultimas-opiniones');

    if (contenedorUltimas) {
        const sheetURL = contenedorUltimas.getAttribute('data-sheet');
        
        if (sheetURL && !sheetURL.includes("PEGA_AQUI")) {
            cargarUltimasOpiniones(sheetURL, contenedorUltimas);
        }
    }

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

    // Función para que el navegador entienda las fechas (DD/MM/YYYY)
    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) {
            // JavaScript lee los meses del 0 al 11, por eso restamos 1 al mes
            return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        }
        // Por si alguna vez escribes la fecha en otro formato
        return new Date(fechaStr).getTime() || 0;
    }

    async function cargarUltimasOpiniones(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            const filas = parsearCSV(texto);
            filas.shift(); // Borramos la cabecera (Fila 1)

            // 1. Filtramos las válidas
            const filasValidas = filas.filter(col => col.length >= 4 && col[0].trim() !== '');

            // Ordenamos todas las filas por fecha (de más reciente a más antigua)
            filasValidas.sort((a, b) => {
                const fechaA = convertirFechaParaOrdenar(a[0].trim());
                const fechaB = convertirFechaParaOrdenar(b[0].trim());
                return fechaB - fechaA; // Orden descendente
            });

            // 2. Extraemos ÚNICAMENTE las 3 primeras después de haberlas ordenado
            const lasTresUltimas = filasValidas.slice(0, 3);

            contenedor.innerHTML = ''; 

            lasTresUltimas.forEach(col => {
                const [fecha, titulo, contenido, foto] = col;
                
                const tarjeta = `
                    <a href="opinion.html" class="news-item">
                        <img src="${foto}" alt="${titulo}">
                        <p>${titulo}</p>
                    </a>
                `;
                
                contenedor.innerHTML += tarjeta;
            });

            if (contenedor.innerHTML === '') {
                contenedor.innerHTML = '<p style="text-align:center; width: 100%;">No hay columnas recientes.</p>';
            }

        } catch (error) {
            console.error("Error cargando últimas opiniones:", error);
            contenedor.innerHTML = '<p style="text-align:center; width: 100%;">Error al cargar las columnas de opinión.</p>';
        }
    }
});

// =========================================================
// --- LÓGICA PARA LOS 3 ÚLTIMOS ARTÍCULOS DE AUTOBILD ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const contenedorAutobild = document.getElementById('ultimas-autobild');

    if (contenedorAutobild) {
        const sheetURL = contenedorAutobild.getAttribute('data-sheet');
        if (sheetURL && !sheetURL.includes("PEGA_AQUI")) {
            cargarUltimasAutobild(sheetURL, contenedorAutobild);
        }
    }

    // Traductor de fechas (DD/MM/YYYY) para poder ordenarlas
    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        }
        return new Date(fechaStr).getTime() || 0;
    }

    async function cargarUltimasAutobild(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            // LECTOR CLÁSICO Y SEGURO (No rompe las URLs)
            const filasRaw = texto.split('\n').slice(1); // Separamos por líneas y quitamos la cabecera
            const filasValidas = [];

            filasRaw.forEach(filaStr => {
                if (!filaStr.trim()) return; // Si la línea está vacía, la saltamos
                
                // Cortamos las columnas respetando el formato de Google Sheets
                const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const col = filaStr.split(regex).map(val => val.replace(/^"|"$/g, '').trim());
                
                if (col.length >= 4) {
                    filasValidas.push(col);
                }
            });

            // Ordenamos por fecha de más reciente a más antigua
            filasValidas.sort((a, b) => {
                const fechaA = convertirFechaParaOrdenar(a[0]);
                const fechaB = convertirFechaParaOrdenar(b[0]);
                return fechaB - fechaA; 
            });

            // Nos quedamos solo con las 3 primeras
            const lasTresUltimas = filasValidas.slice(0, 3);
            contenedor.innerHTML = ''; 

            lasTresUltimas.forEach(col => {
                // TU EXCEL: 0:Fecha, 1:Link, 2:Titulo, 3:Foto, 4:Medio, 5:Modalidad
                
                // Arreglamos el link por si le falta el "https://" (Esto evita el error 404 de GitHub)
                let enlace = col[1] ? col[1] : '#';
                if (enlace !== '#' && !enlace.startsWith('http')) {
                    enlace = 'https://' + enlace;
                }

                const titulo = col[2] ? col[2] : 'Sin título';
                const foto = col[3] ? col[3] : '';
                
                // He quitado los estilos forzados. Dejo que tu style.css haga el trabajo limpio.
                // Si la foto falla por cualquier motivo, cargará el logo de tu web por defecto.
                const tarjeta = `
                    <a href="${enlace}" target="_blank" class="news-item">
                        <img src="${foto}" alt="${titulo}" onerror="this.src='img/logo.jpeg'">
                        <p>${titulo}</p>
                    </a>
                `;
                
                contenedor.innerHTML += tarjeta;
            });

            if (contenedor.innerHTML === '') {
                contenedor.innerHTML = '<p style="text-align:center; width: 100%;">No hay artículos recientes.</p>';
            }

        } catch (error) {
            console.error("Error cargando AutoBild:", error);
            contenedor.innerHTML = '<p style="text-align:center; width: 100%;">Error al cargar los artículos.</p>';
        }
    }
});

// =========================================================
// --- LÓGICA UNIVERSAL DE ORDENACIÓN DE TARJETAS ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const selectOrden = document.getElementById('ordenar-noticias');
    // Buscamos el contenedor (sirve tanto para .opiniones-grid como para .grid-tarjetas)
    const contenedorGrid = document.querySelector('.opiniones-grid, .grid-tarjetas');

    if (selectOrden && contenedorGrid) {
        selectOrden.addEventListener('change', (e) => {
            const modo = e.target.value;
            
            // Obtenemos solo las tarjetas (ignorando los textos de "Cargando...")
            const tarjetas = Array.from(contenedorGrid.children).filter(t => t.hasAttribute('data-fecha'));

            if (tarjetas.length === 0) return;

            // Ordenamos el array de tarjetas
            tarjetas.sort((a, b) => {
                // 1. ORDEN ORIGINAL
                if (modo === 'original') {
                    return parseInt(a.getAttribute('data-indice')) - parseInt(b.getAttribute('data-indice'));
                }
                
                // 2. ORDEN POR FECHA
                if (modo === 'fecha-desc' || modo === 'fecha-asc') {
                    const fechaA = convertirFechaParaOrdenar(a.getAttribute('data-fecha'));
                    const fechaB = convertirFechaParaOrdenar(b.getAttribute('data-fecha'));
                    return modo === 'fecha-desc' ? fechaB - fechaA : fechaA - fechaB;
                }
                
                // 3. ORDEN ALFABÉTICO
                if (modo === 'az' || modo === 'za') {
                    const tituloA = a.getAttribute('data-titulo').toLowerCase();
                    const tituloB = b.getAttribute('data-titulo').toLowerCase();
                    if (tituloA < tituloB) return modo === 'az' ? -1 : 1;
                    if (tituloA > tituloB) return modo === 'az' ? 1 : -1;
                    return 0;
                }
            });

            // Vaciamos el contenedor y metemos las tarjetas ya ordenadas
            contenedorGrid.innerHTML = '';
            tarjetas.forEach(t => contenedorGrid.appendChild(t));
        });
    }

    // Traductor de fechas (DD/MM/YYYY) interno para este bloque
    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        }
        return new Date(fechaStr).getTime() || 0;
    }
});
