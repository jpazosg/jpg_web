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
        
        const filas = texto.split("\n").slice(1); 
        contenedor.innerHTML = ''; 

        filas.forEach((filaRaw, index) => {
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const col = filaRaw.split(regex).map(val => val.replace(/^"|"$/g, '').trim());

            if (col.length < 6) return; 

            const [fecha, link, titulo, foto, medio, modalidad] = col;
            let mostrar = false;

            if (filtroMedio && medio && medio.toUpperCase() === filtroMedio.toUpperCase()) mostrar = true;
            if (filtroModalidad && modalidad && modalidad.toUpperCase().includes(filtroModalidad.toUpperCase())) mostrar = true;

            if (mostrar) {
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
            fotosOcultas.forEach(foto => foto.classList.remove('oculta'));
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
            filas.shift(); 

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
                
                // --- PREPARATIVOS PARA COMPARTIR ---
                const urlCompartir = encodeURIComponent(window.location.href);
                const tituloCompartir = encodeURIComponent(titulo);
                let compartidos = localStorage.getItem('shares_opinion_' + index) || 0;

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
                                <button class="btn-share-social btn-copy-link" style="background: none; border: none; color: #888; font-size: 1.6rem; cursor: pointer; padding: 0; transition: transform 0.2s;" title="Copiar enlace"><i class="fas fa-link"></i></button>
                            </div>
                            <div style="font-size: 0.9rem; color: #888; font-weight: bold; background: #f5f5f5; padding: 5px 12px; border-radius: 15px;" class="fondo-contador">
                                <i class="fas fa-share-nodes"></i> <span class="share-counter-num">${compartidos}</span> compartidos
                            </div>
                        </div>
                        
                        <button class="btn-cerrar-articulo" style="margin-top: 30px;">Cerrar Artículo</button>
                    </div>
                `;

                // Sumar compartidos
                const botonesShare = tarjeta.querySelectorAll('.btn-share-social');
                const contadorNum = tarjeta.querySelector('.share-counter-num');
                const btnCopy = tarjeta.querySelector('.btn-copy-link');

                botonesShare.forEach(btn => {
                    btn.addEventListener('click', () => {
                        let actual = parseInt(localStorage.getItem('shares_opinion_' + index) || 0);
                        actual++;
                        localStorage.setItem('shares_opinion_' + index, actual);
                        contadorNum.innerText = actual;
                    });
                });

                // Copiar enlace
                if (btnCopy) {
                    btnCopy.addEventListener('click', (e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(window.location.href).then(() => {
                            alert("¡Enlace copiado al portapapeles!\nYa puedes pegarlo donde quieras.");
                        });
                    });
                }

                // Abrir/Cerrar
                const vistaCorta = tarjeta.querySelector('.opinion-vista-corta');
                const btnCerrar = tarjeta.querySelector('.btn-cerrar-articulo');

                vistaCorta.addEventListener('click', () => {
                    document.querySelectorAll('.opinion-tarjeta.expandida').forEach(t => t.classList.remove('expandida'));
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

            if (contenedor.innerHTML === '') contenedor.innerHTML = '<p class="mensaje-carga">No hay opiniones publicadas todavía.</p>';
        } catch (error) {
            console.error("Error cargando opiniones:", error);
            contenedor.innerHTML = "<p class='mensaje-carga'>Error cargando las columnas de opinión.</p>";
        }
    }
});

// =========================================================
// --- LÓGICA DEL VISOR CON ZOOM Y ARRASTRE ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("visor-modal");
    const modalImg = document.getElementById("img-full");
    const captionText = document.getElementById("modal-caption");
    const spanCerrar = document.getElementsByClassName("cerrar-modal")[0];
    const imagenes = document.querySelectorAll('.papel-img');

    let escalaActual = 1, currentX = 0, currentY = 0, isDragging = false, startX, startY;

    if (modal && modalImg) {
        imagenes.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "flex";
                modalImg.src = this.src;
                if(captionText) captionText.innerHTML = this.alt;
                resetZoom();
            });
        });

        function cerrarModal() { modal.style.display = "none"; resetZoom(); }
        if (spanCerrar) spanCerrar.onclick = cerrarModal;
        modal.onclick = function(event) { if (event.target === modal) cerrarModal(); }

        modal.addEventListener('wheel', function(e) {
            e.preventDefault(); 
            escalaActual += (e.deltaY * -0.001);
            escalaActual = Math.min(Math.max(1, escalaActual), 5);
            if (escalaActual === 1) { currentX = 0; currentY = 0; }
            aplicarTransformacion();
        });

        modalImg.addEventListener('mousedown', function(e) {
            if (escalaActual > 1) {
                isDragging = true; startX = e.clientX - currentX; startY = e.clientY - currentY;
                modalImg.classList.add('arrastrando'); e.preventDefault(); 
            }
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) { currentX = e.clientX - startX; currentY = e.clientY - startY; aplicarTransformacion(); }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) { isDragging = false; modalImg.classList.remove('arrastrando'); }
        });
        
        function aplicarTransformacion() { modalImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${escalaActual})`; }
        function resetZoom() { escalaActual = 1; currentX = 0; currentY = 0; modalImg.style.transform = "translate(0px, 0px) scale(1)"; }
    }
});

// =========================================================
// --- LÓGICA PARA LAS 3 ÚLTIMAS OPINIONES EN LA PORTADA ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const contenedorUltimas = document.getElementById('ultimas-opiniones');
    if (contenedorUltimas) {
        const sheetURL = contenedorUltimas.getAttribute('data-sheet');
        if (sheetURL && !sheetURL.includes("PEGA_AQUI")) cargarUltimasOpiniones(sheetURL, contenedorUltimas);
    }

    function parsearCSV(str) {
        const arr = []; let quote = false; let row = 0, col = 0;
        for (let c = 0; c < str.length; c++) {
            let cc = str[c], nc = str[c+1];
            arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || '';
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

    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        return new Date(fechaStr).getTime() || 0;
    }

    async function cargarUltimasOpiniones(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            const filas = parsearCSV(texto);
            filas.shift(); 

            const filasValidas = filas.filter(col => col.length >= 4 && col[0].trim() !== '');

            filasValidas.sort((a, b) => {
                return convertirFechaParaOrdenar(b[0].trim()) - convertirFechaParaOrdenar(a[0].trim()); 
            });

            const lasTresUltimas = filasValidas.slice(0, 3);
            contenedor.innerHTML = ''; 

            lasTresUltimas.forEach(col => {
                const titulo = col[1] ? col[1].trim() : 'Sin título';
                const foto = col[3] ? col[3].trim() : '';
                
                // NOTA: Sin loading="lazy" para que carguen siempre en la portada. 
                // Añadido onerror para que no se rompa la imagen si falla el link.
                const tarjeta = `
                    <a href="opinion.html" class="news-item">
                        <img src="${foto}" alt="${titulo}" onerror="this.onerror=null; this.src='img/logo.jpeg';">
                        <p>${titulo}</p>
                    </a>
                `;
                contenedor.innerHTML += tarjeta;
            });

            if (contenedor.innerHTML === '') contenedor.innerHTML = '<p style="text-align:center; width: 100%;">No hay columnas recientes.</p>';
        } catch (error) {
            console.error("Error:", error);
            contenedor.innerHTML = '<p style="text-align:center; width: 100%;">Error al cargar las columnas.</p>';
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
        if (sheetURL && !sheetURL.includes("PEGA_AQUI")) cargarUltimasAutobild(sheetURL, contenedorAutobild);
    }

    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        return new Date(fechaStr).getTime() || 0;
    }

    async function cargarUltimasAutobild(url, contenedor) {
        try {
            const respuesta = await fetch(url);
            const texto = await respuesta.text();
            
            const filasRaw = texto.split('\n').slice(1); 
            const filasValidas = [];

            filasRaw.forEach(filaStr => {
                if (!filaStr.trim()) return; 
                const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const col = filaStr.split(regex).map(val => val.replace(/^"|"$/g, '').trim());
                if (col.length >= 4) filasValidas.push(col);
            });

            filasValidas.sort((a, b) => {
                return convertirFechaParaOrdenar(b[0]) - convertirFechaParaOrdenar(a[0]); 
            });

            const lasTresUltimas = filasValidas.slice(0, 3);
            contenedor.innerHTML = ''; 

            lasTresUltimas.forEach(col => {
                let enlace = col[1] ? col[1] : '#';
                if (enlace !== '#' && !enlace.startsWith('http')) enlace = 'https://' + enlace;

                const titulo = col[2] ? col[2] : 'Sin título';
                const foto = col[3] ? col[3] : '';
                
                // NOTA: Sin loading="lazy" y con onerror de seguridad
                const tarjeta = `
                    <a href="${enlace}" target="_blank" class="news-item">
                        <img src="${foto}" alt="${titulo}" onerror="this.onerror=null; this.src='img/logo.jpeg';">
                        <p>${titulo}</p>
                    </a>
                `;
                contenedor.innerHTML += tarjeta;
            });

            if (contenedor.innerHTML === '') contenedor.innerHTML = '<p style="text-align:center; width: 100%;">No hay artículos recientes.</p>';
        } catch (error) {
            console.error("Error:", error);
            contenedor.innerHTML = '<p style="text-align:center; width: 100%;">Error al cargar los artículos.</p>';
        }
    }
});

// =========================================================
// --- LÓGICA UNIVERSAL DE ORDENACIÓN DE TARJETAS ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const selectOrden = document.getElementById('ordenar-noticias');
    const contenedorGrid = document.querySelector('.opiniones-grid, .grid-tarjetas');

    if (selectOrden && contenedorGrid) {
        selectOrden.addEventListener('change', (e) => {
            const modo = e.target.value;
            const tarjetas = Array.from(contenedorGrid.children).filter(t => t.hasAttribute('data-fecha'));

            if (tarjetas.length === 0) return;

            tarjetas.sort((a, b) => {
                if (modo === 'original') return parseInt(a.getAttribute('data-indice')) - parseInt(b.getAttribute('data-indice'));
                if (modo === 'fecha-desc' || modo === 'fecha-asc') {
                    const fechaA = convertirFechaParaOrdenar(a.getAttribute('data-fecha'));
                    const fechaB = convertirFechaParaOrdenar(b.getAttribute('data-fecha'));
                    return modo === 'fecha-desc' ? fechaB - fechaA : fechaA - fechaB;
                }
                if (modo === 'az' || modo === 'za') {
                    const tituloA = a.getAttribute('data-titulo').toLowerCase();
                    const tituloB = b.getAttribute('data-titulo').toLowerCase();
                    if (tituloA < tituloB) return modo === 'az' ? -1 : 1;
                    if (tituloA > tituloB) return modo === 'az' ? 1 : -1;
                    return 0;
                }
            });

            contenedorGrid.innerHTML = '';
            tarjetas.forEach(t => contenedorGrid.appendChild(t));
        });
    }

    function convertirFechaParaOrdenar(fechaStr) {
        if (!fechaStr) return 0;
        const partes = fechaStr.split('/');
        if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        return new Date(fechaStr).getTime() || 0;
    }
});

// =========================================================
// --- LÓGICA PARA EL MODO OSCURO / CLARO ---
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnTema = document.getElementById('btn-tema');
    const body = document.body;

    const temaGuardado = localStorage.getItem('modoPreferido');
    
    if (temaGuardado === 'oscuro') {
        body.classList.add('dark-mode');
        if (btnTema) btnTema.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
    }

    if (btnTema) {
        btnTema.addEventListener('click', (e) => {
            e.preventDefault(); 
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('modoPreferido', 'oscuro');
                btnTema.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
            } else {
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
            const tarjetas = Array.from(contenedorGrid.children).filter(t => t.hasAttribute('data-titulo'));

            tarjetas.forEach(tarjeta => {
                const titulo = tarjeta.getAttribute('data-titulo').toLowerCase();
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
        window.onscroll = function() {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                btnArriba.style.display = "block";
            } else {
                btnArriba.style.display = "none";
            }
        };

        btnArriba.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
