// Fade in menu bar on recent mouse movement
let menuTimeout;
const header = document.querySelector('header');

function showMenuBar() {
    header.classList.add('menu-visible');
    clearTimeout(menuTimeout);
    menuTimeout = setTimeout(() => {
        header.classList.remove('menu-visible');
        // Re-evaluate color when header position changes
        checkNavbarPosition();
    }, 2000);
    // Ensure color is correct when menu appears
    checkNavbarPosition();
}

document.addEventListener('mousemove', showMenuBar);

window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    let timeoutId;

    function showMenu() {
        header.classList.add('menu-visible');
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            header.classList.remove('menu-visible');
            checkNavbarPosition();
        }, 2000);
        checkNavbarPosition();
    }

    document.addEventListener('mousemove', showMenu);
    showMenu(); // Show menu briefly on initial load
});

// Check what is visually under the header and set text color accordingly
function checkNavbarPosition() {
    const header = document.querySelector('header');
    if (!header) return;

    // Sample around the vertical middle of the header, but consider what's BEHIND the header
    const rect = header.getBoundingClientRect();
    // Sample just below the header to reflect what's visually adjacent
    let sampleY = Math.round(rect.bottom + 2);
    sampleY = Math.min(Math.max(sampleY, 0), window.innerHeight - 1);

    // Sample multiple X positions to avoid edge artifacts
    const xs = [
        Math.round(rect.left + rect.width * 0.15),
        Math.round(rect.left + rect.width * 0.5),
        Math.round(rect.left + rect.width * 0.85)
    ].map(x => Math.min(Math.max(x, 0), window.innerWidth - 1));

    function pickUnderlyingElement(x, y) {
        const stack = (document.elementsFromPoint && document.elementsFromPoint(x, y)) || [document.elementFromPoint(x, y)];
        return stack.find(e => e && !header.contains(e)) || document.body;
    }

    // Walk up DOM to find an element with a non-transparent background
    function getEffectiveBg(elem) {
        while (elem && elem !== document.documentElement) {
            const cs = getComputedStyle(elem);
            const bg = cs.backgroundColor;
            // rgba(0,0,0,0) or transparent
            if (bg && bg !== 'transparent' && !bg.endsWith(', 0)')) {
                return bg;
            }
            elem = elem.parentElement;
        }
        // Fallback to body
        return getComputedStyle(document.body).backgroundColor;
    }

    function isLight(color) {
        // Expect formats like rgb(r, g, b) or rgba(r, g, b, a)
        const m = color && color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return false;
        const r = parseInt(m[1], 10) / 255;
        const g = parseInt(m[2], 10) / 255;
        const b = parseInt(m[3], 10) / 255;
        // Relative luminance per WCAG
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return lum > 0.7; // treat as "light" when very bright
    }

    // Majority decision across samples
    let lightCount = 0;
    for (const x of xs) {
        const el = pickUnderlyingElement(x, sampleY);
        const bgColor = getEffectiveBg(el);
        if (isLight(bgColor)) lightCount++;
    }

    if (lightCount >= 2) {
        header.classList.add('over-white');
    } else {
        header.classList.remove('over-white');
    }
}

// Run on scroll and load
window.addEventListener('scroll', checkNavbarPosition);
window.addEventListener('DOMContentLoaded', checkNavbarPosition);
window.addEventListener('resize', checkNavbarPosition);

// --- Parallax effect for main hero and page hero titles ---
(function setupParallaxAll() {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // Respect user preference

    const targets = [];

    // Main landing hero (if present)
    const hero = document.querySelector('.hero');
    if (hero) {
        const title = hero.querySelector('h1');
        const portrait = hero.querySelector('.hero-photo');
        if (title) {
            targets.push({
                container: hero,
                title,
                extra: portrait,
                mulContainer: -0.30, // faster upward container movement
                mulTitle: 0.70,      // faster downward title movement
                mulExtra: 0.55       // portrait follows title but slightly less
            });
            // hint to engine
            title.style.willChange = 'transform';
            hero.style.willChange = 'transform';
            if (portrait) portrait.style.willChange = 'transform';
        }
    }

    // Page hero sections across subpages
    document.querySelectorAll('.page-hero').forEach(ph => {
        const t = ph.querySelector('h1');
        if (t) {
            targets.push({
                container: ph,
                title: t,
                mulContainer: -0.08, // subtler movement for smaller hero
                mulTitle: 0.22
            });
            t.style.willChange = 'transform';
            ph.style.willChange = 'transform';
        }
    });

    if (!targets.length) return;

    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
        lastScrollY = window.scrollY || window.pageYOffset || 0;
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }

    function update() {
        const sy = lastScrollY;
        for (const t of targets) {
            const top = t.container.offsetTop;
            const height = t.container.offsetHeight || window.innerHeight;
            const relY = Math.min(Math.max(sy - top, 0), height);

            const cShift = relY * t.mulContainer;
            const titleShift = relY * t.mulTitle;

            t.container.style.transform = `translate3d(0, ${cShift}px, 0)`;
            t.title.style.transform = `translate3d(0, ${titleShift}px, 0)`;
            if (t.extra) {
                const extraShift = relY * (t.mulExtra ?? t.mulTitle);
                t.extra.style.transform = `translate3d(0, ${extraShift}px, 0)`;
            }
        }
        ticking = false;
    }

    // Initial paint
    update();

    // Smooth, passive scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
})();