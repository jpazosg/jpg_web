document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // --- 0. INYECCIÓN DINÁMICA DE MENÚ Y FOOTER (MEJORA 3) ---
    // =========================================================
    const navbarDiv = document.getElementById('navbar-dinamico');
    const footerDiv = document.getElementById('footer-dinamico');

    if (navbarDiv) {
        navbarDiv.innerHTML = `
        <nav class="navbar">
            <div class="nav-center">
                <a href="index.html" class="nav-title">
                    <img src="img/logo.jpeg" alt="Logo" class="nav-logo">
                    INICIO
                </a>
            </div>
            <div class="menu-toggle" id="mobile-menu">
                <span class="bar"></span><span class="bar"></span><span class="bar"></span>
            </div>
            <ul class="nav-dropdown" id="nav-dropdown">
                <li><a href="index.html">Volver al Inicio</a></li>
                <li><a href="#" id="btn-tema"><i class="fas fa-moon"></i> Modo Oscuro</a></li>
            </ul>
        </nav>`;
    }

    if (footerDiv) {
        footerDiv.innerHTML = `
        <footer id="contacto">
            <div class="footer-content">
                <p class="copyright">&copy; 2026 Javier Pazos Gurich. Todos los derechos reservados.</p>
            </div>
        </footer>`;
    }

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
            
            const filas = parsearCSV(texto);
            filas.shift(); // Borra la fila 0 (Cabecera)

            contenedor.innerHTML = ''; 

            filas.forEach((col, index) => {
                if (col.length < 4 || !col[0]) return; 

                const [fecha, titulo, contenidoRaw, foto] = col;
                const contenidoFormateado = contenidoRaw.replace(/\n/g, '<br><br>');

                const tarjeta = document.createElement('article');
                tarjeta.classList.add('opinion-tarjeta');
                
                tarjeta.setAttribute('data-fecha', fecha);
                tarjeta.setAttribute('data-titulo', titulo);
                tarjeta.setAttribute('data-indice', index);
                
                // --- PREPARATIVOS PARA LOS BOTONES DE COMPARTIR ---
                const urlCompartir = encodeURIComponent(window.location.href);
                const tituloCompartir = encodeURIComponent(titulo);
                
                // Lee el contador de compartidos de la memoria local
                let compartidos = localStorage.getItem('shares_opinion_' + index) || 0;
                
                // AÑADIDO loading="lazy" a la imagen y BOTONES DE REDES SOCIALES
                tarjeta.innerHTML = `
                    <div class="opinion-vista-corta" style="background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('${foto}');">
                        <span class="opinion-fecha-corta">${fecha}</span>
                        <h3 class="opinion-titulo-corto">${titulo}</h3>
                    </div>

                    <div class="opinion-vista-larga">
                        <h1 class="opinion-titulo-largo">${titulo}</h1>
                        <span class="opinion-fecha-larga">${fecha}</span>
                        
                        <img src="${foto}" alt="${titulo}" class="opinion-imagen-larga" loading="lazy">
                        
                        <div class="opinion-texto-largo">${contenidoFormateado}</div>
                        
                        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                            
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span style="font-weight: bold; color: #666; font-size: 0.9rem; text-transform: uppercase;">Compartir:</span>
                                
                                <a href="https://api.whatsapp.com/send?text=${tituloCompartir} - ${urlCompartir}" target="_blank" class="btn-share-social" style="color: #25D366; font-size: 1.6rem; transition: transform 0.2s;"><i class="fab fa-whatsapp"></i></a>
                                
                                <a href="https://twitter.com/intent/tweet?text=${tituloCompartir}&url=${urlCompartir}" target="_blank" class="btn-share-social icono-x" style="font-size: 1.6rem; transition: transform 0.2s;"><i class="fa-brands fa-x-twitter"></i></a>
                                
                                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${urlCompartir}" target="_blank" class="btn-share-social" style="color: #0A66C2; font-size: 1.6rem; transition: transform 0.2s;"><i class="fab fa-linkedin"></i></a>
                                
                                <button class="btn-share-social btn-instagram" style="background: none; border: none; color: #E1306C; font-size: 1.6rem; cursor: pointer; padding: 0; transition: transform 0.2s;" title="Copiar enlace para Instagram"><i class="fab fa-instagram"></i></button>
                            </div>

                            <div style="font-size: 0.9rem; color: #888; font-weight: bold; background: #f5f5f5; padding: 5px 12px; border-radius: 15px;" class="fondo-contador">
                                <i class="fas fa-share-nodes"></i> <span class="share-counter-num">${compartidos}</span> compartidos
                            </div>

                        </div>
                        
                        <button class="btn-cerrar-articulo" style="margin-top: 30px;">Cerrar Artículo</button>
                    </div>
                `;

                // --- Lógica del Contador y de Instagram ---
                const botonesShare = tarjeta.querySelectorAll('.btn-share-social');
                const contadorNum = tarjeta.querySelector('.share-counter-num');
                const btnInstagram = tarjeta.querySelector('.btn-instagram');

                // Sumar al contador al hacer clic
                botonesShare.forEach(btn => {
                    btn.addEventListener('click', () => {
                        let actual = parseInt(localStorage.getItem('shares_opinion_' + index) || 0);
                        actual++;
                        localStorage.setItem('shares_opinion_' + index, actual);
                        contadorNum.innerText = actual;
                    });
                });

                // Copiar enlace en Instagram
                if (btnInstagram) {
                    btnInstagram.addEventListener('click', (e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(window.location.href).then(() => {
                            alert("¡Enlace copiado al portapapeles!\nYa puedes pegarlo en tu historia o biografía de Instagram.");
                        });
                    });
                }

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

// =========================================================
// --- LÓGICA PARA EL MODO OSCURO / CLARO ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnTema = document.getElementById('btn-tema');
    const body = document.body;

    // 1. Al cargar la página, comprobamos si el usuario ya había elegido el modo oscuro antes
    const temaGuardado = localStorage.getItem('modoPreferido');
    
    if (temaGuardado === 'oscuro') {
        body.classList.add('dark-mode');
        // Si hay botón en esta página, le cambiamos el icono y el texto
        if (btnTema) {
            btnTema.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
        }
    }

    // 2. Qué pasa cuando hacemos clic en el botón
    if (btnTema) {
        btnTema.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que la página salte hacia arriba al hacer clic
            
            // Ponemos o quitamos la clase 'dark-mode'
            body.classList.toggle('dark-mode');
            
            // Si después del clic está oscuro, guardamos 'oscuro' y cambiamos icono
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('modoPreferido', 'oscuro');
                btnTema.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
            } else {
                // Si está claro, guardamos 'claro' y ponemos la luna
                localStorage.setItem('modoPreferido', 'claro');
                btnTema.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
            }
        });
    }
});

// =========================================================
// --- LÓGICA DEL BUSCADOR EN TIEMPO REAL ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const buscador = document.getElementById('buscador-noticias');
    const contenedorGrid = document.querySelector('.opiniones-grid, .grid-tarjetas');

    if (buscador && contenedorGrid) {
        buscador.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            // Cogemos todas las tarjetas que tengan el atributo data-titulo
            const tarjetas = Array.from(contenedorGrid.children).filter(t => t.hasAttribute('data-titulo'));

            tarjetas.forEach(tarjeta => {
                const titulo = tarjeta.getAttribute('data-titulo').toLowerCase();
                // Si el título incluye lo que hemos escrito, se muestra. Si no, se oculta.
                if (titulo.includes(termino)) {
                    tarjeta.style.display = '';
                } else {
                    tarjeta.style.display = 'none';
                }
            });
        });
    }
});

// =========================================================
// --- LÓGICA DEL BOTÓN VOLVER ARRIBA ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnArriba = document.getElementById("btn-volver-arriba");

    if (btnArriba) {
        // Cuando el usuario hace scroll hacia abajo 300px, mostramos el botón
        window.onscroll = function() {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                btnArriba.style.display = "block";
            } else {
                btnArriba.style.display = "none";
            }
        };

        // Al hacer clic, sube suavemente
        btnArriba.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
