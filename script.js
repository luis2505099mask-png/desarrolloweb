document.addEventListener('DOMContentLoaded', () => {
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const esTactil = window.matchMedia('(pointer: coarse)').matches;

    iniciarPestanas(reducirMovimiento);
    if (!reducirMovimiento) iniciarMatriz();
    if (!reducirMovimiento && !esTactil) iniciarCursor();
});

/* ---------- 1. PESTAÑAS ---------- */
function iniciarPestanas(reducirMovimiento) {
    const enlaces = document.querySelectorAll('nav a[href^="#"]');
    const secciones = document.querySelectorAll('#leer, #juegos, #aprender');
    if (!enlaces.length || !secciones.length) return;

    const ids = [...secciones].map(sec => sec.id);

    function mostrar(id) {
        if (!ids.includes(id)) id = ids[0]; // por defecto, la primera

        secciones.forEach(sec => {
            const activa = sec.id === id;
            const estabaOculta = sec.hidden;
            sec.hidden = !activa;

            if (activa && estabaOculta && !reducirMovimiento) {
                sec.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
            }
        });

        enlaces.forEach(enlace => {
            const activo = enlace.getAttribute('href') === `#${id}`;
            enlace.classList.toggle('activo', activo);
            if (activo) enlace.setAttribute('aria-current', 'page');
            else enlace.removeAttribute('aria-current');
        });
    }

    enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            const href = enlace.getAttribute('href');
            history.pushState(null, '', href); // el botón "atrás" funciona
            mostrar(href.slice(1));
        });
    });

    window.addEventListener('popstate', () => mostrar(location.hash.slice(1)));

    // Al cargar, respeta el # de la URL (si existe)
    mostrar(location.hash.slice(1));
}

/* ---------- 2. FONDO MATRIZ ---------- */
function iniciarMatriz() {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '-1',
        opacity: '0.25'
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const caracteres = [...'01HALO01DOOM01PYTHON01TRON01'];
    const tamFuente = 14;
    const msPorFrame = 40;
    let gotas = [];
    let ultimoFrame = 0;

    function ajustar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.font = `${tamFuente}px monospace`; // cambiar el tamaño del canvas reinicia el contexto

        const columnas = Math.floor(canvas.width / tamFuente);
        // Conserva las gotas existentes y completa las columnas nuevas
        gotas = Array.from({ length: columnas }, (_, i) => gotas[i] ?? 1);
    }

    function dibujar(tiempo) {
        requestAnimationFrame(dibujar);
        if (tiempo - ultimoFrame < msPorFrame) return;
        ultimoFrame = tiempo;

        ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00d4ff';

        gotas.forEach((y, i) => {
            const letra = caracteres[Math.floor(Math.random() * caracteres.length)];
            ctx.fillText(letra, i * tamFuente, y * tamFuente);

            if (y * tamFuente > canvas.height && Math.random() > 0.975) {
                gotas[i] = 0;
            }
            gotas[i]++;
        });
    }

    let temporizador;
    window.addEventListener('resize', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(ajustar, 150); // evita recalcular en cada píxel
    });

    ajustar();
    requestAnimationFrame(dibujar); // se pausa solo en pestañas ocultas
}

/* ---------- 3. CURSOR DISCO DE LUZ ---------- */
function iniciarCursor() {
    const colores = {
        leer: 'var(--neon-blue)',
        juegos: 'var(--neon-orange)',
        aprender: 'var(--neon-red)'
    };
    const colorBase = 'var(--neon-blue)';

    const disco = document.createElement('div');
    disco.setAttribute('aria-hidden', 'true');
    Object.assign(disco.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '20px',
        height: '20px',
        border: `2px solid ${colorBase}`,
        borderRadius: '50%',
        boxShadow: '0 0 12px currentColor, inset 0 0 8px currentColor',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0',
        willChange: 'transform',
        transition: 'border-color 0.3s, opacity 0.3s, width 0.2s, height 0.2s'
    });
    document.body.appendChild(disco);

    let x = 0;
    let y = 0;
    let framePendiente = false;

    document.addEventListener('mousemove', (e) => {
        x = e.clientX;
        y = e.clientY;
        disco.style.opacity = '1';

        if (framePendiente) return;
        framePendiente = true;
        requestAnimationFrame(() => {
            disco.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
            framePendiente = false;
        });
    });

    document.documentElement.addEventListener('mouseleave', () => {
        disco.style.opacity = '0';
    });

    // Un solo listener para todo el documento (delegación de eventos)
    document.addEventListener('mouseover', (e) => {
        const seccion = e.target.closest('#leer, #juegos, #aprender');
        disco.style.borderColor = seccion ? colores[seccion.id] : colorBase;

        const sobreEnlace = Boolean(e.target.closest('a'));
        disco.style.width = disco.style.height = sobreEnlace ? '32px' : '20px';
    });
}