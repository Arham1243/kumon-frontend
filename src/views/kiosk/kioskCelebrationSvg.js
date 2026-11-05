export const KIOSK_THEMES = [
    {
        n: 'Jungle',
        bg: '#BDEFC4',
        g1: '#3FA45B',
        g2: '#2E8B4A',
        tx: '#1F5E34',
        sun: '#FFD84D',
        pr: 'leaf',
        pc: ['#FF6FA5', '#FF8A3D', '#FFD84D'],
        cols: ['#FF9F5A', '#B7A0FF', '#FFD34D', '#FF8FB8', '#9AD0FF']
    },
    {
        n: 'Ocean',
        bg: '#A8E1F5',
        g1: '#2FA3D8',
        g2: '#1B7FB5',
        tx: '#0C4A6E',
        sun: '#FFF3B0',
        pr: 'bubble',
        pc: ['#fff', '#E6F7FF', '#fff'],
        cols: ['#FF8A3D', '#FF8FB8', '#FFD34D', '#B7A0FF', '#7BE0A5']
    },
    {
        n: 'Space',
        bg: '#3B2A8C',
        g1: '#5A45B5',
        g2: '#4733A0',
        tx: '#FFE98A',
        sun: '#FFF3B0',
        pr: 'star',
        pc: ['#FFE98A', '#fff', '#FF8FB8'],
        cols: ['#7BE0A5', '#FF8FB8', '#FFD34D', '#6EC6F5', '#FF9F5A']
    },
    {
        n: 'Candy',
        bg: '#FFD3E8',
        g1: '#FF9CCB',
        g2: '#FF7FB9',
        tx: '#8A1F5C',
        sun: '#FFF3B0',
        pr: 'dot',
        pc: ['#7BE0A5', '#6EC6F5', '#FFD34D'],
        cols: ['#B7A0FF', '#6EC6F5', '#7BE0A5', '#FFD34D', '#FF9F5A']
    },
    {
        n: 'Blocks',
        bg: '#8FD3FF',
        g1: '#4CC05A',
        g2: '#9A6A3A',
        tx: '#14507A',
        sun: '#FFD84D',
        pr: 'square',
        pc: ['#FF6FA5', '#FFD84D', '#fff'],
        cols: ['#FF8FB8', '#FF9F5A', '#B7A0FF', '#FFD34D', '#6EC6F5']
    }
];

export const KIOSK_ANIMALS = ['Mochi', 'Floppy', 'Puff', 'Pip', 'Bloop'];

const D = '#3A2A4A';
const PROP_POSITIONS = [
    [34, 92, 10],
    [368, 100, 9],
    [60, 150, 7],
    [342, 160, 8],
    [110, 60, 7],
    [300, 70, 10],
    [30, 200, 8],
    [372, 205, 7]
];

function mix(hex, t) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v + (255 - v) * t);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function eyes() {
    return `<circle cx="-18" cy="-5" r="7" fill="${D}"/><circle cx="18" cy="-5" r="7" fill="${D}"/><circle cx="-16" cy="-8" r="2.5" fill="#fff"/><circle cx="20" cy="-8" r="2.5" fill="#fff"/><ellipse cx="-32" cy="10" rx="8" ry="5" fill="#FF8FA8" opacity=".7"/><ellipse cx="32" cy="10" rx="8" ry="5" fill="#FF8FA8" opacity=".7"/>`;
}

function mouth(y) {
    return `<path d="M-9 ${y} Q0 ${y + 10} 9 ${y}" stroke="${D}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function animal(k, c) {
    const l = mix(c, 0.6);
    const b = `<ellipse cx="0" cy="52" rx="36" ry="26" fill="${c}"/><ellipse cx="-24" cy="76" rx="14" ry="8" fill="${l}"/><ellipse cx="24" cy="76" rx="14" ry="8" fill="${l}"/>`;
    if (k === 0) {
        return (
            b +
            `<polygon points="-46,-28 -40,-72 -12,-46" fill="${c}"/><polygon points="46,-28 40,-72 12,-46" fill="${c}"/><polygon points="-40,-34 -37,-60 -22,-44" fill="#FF9BB0"/><polygon points="40,-34 37,-60 22,-44" fill="#FF9BB0"/><circle r="52" fill="${c}"/><ellipse cx="0" cy="14" rx="24" ry="16" fill="${l}"/>` +
            eyes() +
            `<ellipse cx="0" cy="6" rx="5" ry="3.5" fill="${D}"/>` +
            mouth(12)
        );
    }
    if (k === 1) {
        return (
            b +
            `<g transform="rotate(-12 -22 -50)"><ellipse cx="-22" cy="-72" rx="13" ry="34" fill="${c}"/><ellipse cx="-22" cy="-70" rx="6" ry="24" fill="#FF9BB0"/></g><g transform="rotate(12 22 -50)"><ellipse cx="22" cy="-72" rx="13" ry="34" fill="${c}"/><ellipse cx="22" cy="-70" rx="6" ry="24" fill="#FF9BB0"/></g><ellipse rx="54" ry="48" fill="${c}"/><ellipse cx="0" cy="16" rx="18" ry="12" fill="${l}"/>` +
            eyes() +
            `<ellipse cx="0" cy="8" rx="5" ry="3.5" fill="#FF6F91"/>` +
            mouth(14)
        );
    }
    if (k === 2) {
        return (
            `<ellipse cx="-58" cy="10" rx="16" ry="26" fill="${l}" transform="rotate(25 -58 10)"/><ellipse cx="58" cy="10" rx="16" ry="26" fill="${l}" transform="rotate(-25 58 10)"/>` +
            b +
            `<polygon points="-24,-46 -16,-74 -6,-48" fill="#FFD84D"/><polygon points="24,-46 16,-74 6,-48" fill="#FFD84D"/><circle r="52" fill="${c}"/><circle cx="-30" cy="-30" r="6" fill="${l}"/><circle cx="30" cy="-34" r="5" fill="${l}"/><circle cx="4" cy="-42" r="4" fill="${l}"/>` +
            eyes() +
            mouth(14)
        );
    }
    if (k === 3) {
        return (
            `<ellipse cx="-56" cy="14" rx="14" ry="24" fill="${l}" transform="rotate(20 -56 14)"/><ellipse cx="56" cy="14" rx="14" ry="24" fill="${l}" transform="rotate(-20 56 14)"/>` +
            b +
            `<ellipse cx="-8" cy="-56" rx="6" ry="14" fill="${c}" transform="rotate(-20 -8 -56)"/><ellipse cx="6" cy="-58" rx="6" ry="16" fill="${c}"/><ellipse cx="18" cy="-54" rx="6" ry="13" fill="${c}" transform="rotate(25 18 -54)"/><circle r="52" fill="${c}"/><ellipse cx="0" cy="22" rx="26" ry="18" fill="${l}"/>` +
            eyes() +
            `<polygon points="-9,8 9,8 0,22" fill="#FF9F2E"/>`
        );
    }
    return (
        b +
        `<circle cx="-40" cy="-42" r="17" fill="${c}"/><circle cx="40" cy="-42" r="17" fill="${c}"/><circle cx="-40" cy="-42" r="8" fill="${l}"/><circle cx="40" cy="-42" r="8" fill="${l}"/><circle r="52" fill="${c}"/><ellipse cx="0" cy="14" rx="22" ry="15" fill="${l}"/>` +
        eyes() +
        `<ellipse cx="0" cy="6" rx="6" ry="4" fill="${D}"/>` +
        mouth(14)
    );
}

function prop(t, x, y, s, col, i, reducedMotion) {
    const animClass = reducedMotion ? '' : ' kiosk-celebration__tw';
    const delay = reducedMotion ? '' : ` style="animation-delay:${i * 0.25}s"`;
    const a = `${animClass ? `class="${animClass.trim()}"` : ''}${delay}`;
    if (t === 'leaf') {
        return `<ellipse ${a} cx="${x}" cy="${y}" rx="${s * 0.5}" ry="${s}" fill="${col}" transform="rotate(${i * 37} ${x} ${y})"/>`;
    }
    if (t === 'bubble') {
        return `<circle ${a} cx="${x}" cy="${y}" r="${s * 0.8}" fill="none" stroke="${col}" stroke-width="3"/>`;
    }
    if (t === 'star') {
        return `<polygon ${a} points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${col}" transform="translate(${x} ${y}) scale(${s / 8})"/>`;
    }
    if (t === 'dot') {
        return `<circle ${a} cx="${x}" cy="${y}" r="${s * 0.7}" fill="${col}"/>`;
    }
    return `<rect ${a} x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${col}"/>`;
}

export function buildCelebrationGreeting(mode, studentName) {
    const trimmed = String(studentName ?? '').trim().toUpperCase();
    if (mode === 'out') {
        return trimmed ? `Bye, ${trimmed}!` : 'Bye!';
    }
    return trimmed ? `Hi, ${trimmed}!` : 'Hi!';
}

export function greetingFontSizeStyle(text) {
    const len = text.length;
    let maxRem = 4.5;
    if (len > 20) {
        maxRem = 2.35;
    } else if (len > 16) {
        maxRem = 3.15;
    } else if (len > 12) {
        maxRem = 3.85;
    }
    return {
        fontSize: `clamp(2rem, min(12vw, 10vh), ${maxRem}rem)`
    };
}

let lastPick = null;

export function pickCelebrationIndices(excludeSameAsLast = true) {
    let ti;
    let ai;
    do {
        ti = Math.floor(Math.random() * 5);
        ai = Math.floor(Math.random() * 5);
    } while (
        excludeSameAsLast &&
        lastPick &&
        lastPick[0] === ti &&
        lastPick[1] === ai
    );
    lastPick = [ti, ai];
    return { themeIndex: ti, animalIndex: ai };
}

export function buildCelebrationSvg(
    themeIndex,
    animalIndex,
    { reducedMotion = false } = {}
) {
    const t = KIOSK_THEMES[themeIndex];
    const c = t.cols[animalIndex];
    const heroClass = reducedMotion ? '' : ' kiosk-celebration__hero';

    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" role="img" aria-hidden="true"><rect width="400" height="300" fill="${t.bg}"/><circle cx="352" cy="44" r="26" fill="${t.sun}"/>`;
    if (t.pr === 'square') {
        s +=
            '<rect x="40" y="70" width="46" height="14" fill="#fff"/><rect x="52" y="58" width="22" height="14" fill="#fff"/>';
    }
    s += PROP_POSITIONS.map((p, i) =>
        prop(t.pr, p[0], p[1], p[2], t.pc[i % 3], i, reducedMotion)
    ).join('');
    s += `<path d="M0 238 Q100 205 200 236 T400 230 V300 H0Z" fill="${t.g1}"/><path d="M0 272 Q120 250 240 274 T400 268 V300 H0Z" fill="${t.g2}"/>`;
    s += `<g transform="translate(200 198) scale(0.76)"><g class="${heroClass.trim()}">${animal(animalIndex, c)}</g></g></svg>`;
    return s;
}

export function celebrationAriaLabel(themeIndex, animalIndex, mode, studentName) {
    const theme = KIOSK_THEMES[themeIndex]?.n ?? 'Celebration';
    const animal = KIOSK_ANIMALS[animalIndex] ?? 'friend';
    const namePart = String(studentName ?? '').trim();
    const action = mode === 'out' ? 'Goodbye' : 'Hello';
    return `${action}, ${namePart || 'friend'}. ${theme} theme with ${animal}.`;
}
