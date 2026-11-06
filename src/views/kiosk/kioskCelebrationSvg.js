/** @file Biome kiosk celebration art (ported from kiosk-screens-1.html). */

const D = '#3A2A4A';

function C(x, y, r, f) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
}

function E(x, y, a, b, f, t = '') {
    return `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${f}" ${t}/>`;
}

function G(p, f) {
    return `<polygon points="${p}" fill="${f}"/>`;
}

function R(x, y, w, h, f, r = 0) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"/>`;
}

function L(x1, y1, x2, y2, f) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${f}" stroke-width="5" stroke-linecap="round"/>`;
}

function eyes() {
    return (
        C(-18, -5, 7, D) +
        C(18, -5, 7, D) +
        C(-16, -8, 2.5, '#fff') +
        C(20, -8, 2.5, '#fff') +
        E(-32, 10, 8, 5, '#FF8FA8', 'opacity=".7"') +
        E(32, 10, 8, 5, '#FF8FA8', 'opacity=".7"')
    );
}

function mouth(y) {
    return `<path d="M-9 ${y} Q0 ${y + 10} 9 ${y}" stroke="${D}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function body(c, l) {
    return (
        E(0, 52, 36, 26, c) +
        E(-24, 76, 14, 8, l) +
        E(24, 76, 14, 8, l)
    );
}

function sq() {
    return R(-22, -18, 12, 12, D) + R(10, -18, 12, 12, D);
}

function gTransform(t, s) {
    return `<g transform="${t}">${s}</g>`;
}

const KIOSK_CHARACTERS = {
    monkey: () =>
        body('#A9692F', '#F3C99A') +
        C(-48, -8, 14, '#A9692F') +
        C(48, -8, 14, '#A9692F') +
        C(-48, -8, 7, '#F3C99A') +
        C(48, -8, 7, '#F3C99A') +
        C(0, 0, 50, '#A9692F') +
        E(0, 8, 36, 34, '#F3C99A') +
        eyes() +
        mouth(18),
    parrot: () =>
        body('#FF5A5A', '#FFB02E') +
        E(-54, 14, 13, 28, '#3AA0FF') +
        E(54, 14, 13, 28, '#3AA0FF') +
        G('-14,-46 -6,-72 2,-48', '#FFB02E') +
        G('-2,-48 8,-76 16,-46', '#3AA0FF') +
        C(0, 0, 50, '#FF5A5A') +
        E(0, 6, 36, 32, '#fff') +
        eyes() +
        G('-10,10 10,10 0,28', '#FFB02E'),
    tiger: () =>
        body('#FF9F3A', '#FFF1DD') +
        C(-38, -40, 15, '#FF9F3A') +
        C(38, -40, 15, '#FF9F3A') +
        C(-38, -40, 7, '#FFD0A0') +
        C(38, -40, 7, '#FFD0A0') +
        C(0, 0, 50, '#FF9F3A') +
        R(-4, -52, 8, 16, D, 3) +
        R(-50, -10, 14, 5, D, 2) +
        R(-50, 2, 14, 5, D, 2) +
        R(36, -10, 14, 5, D, 2) +
        R(36, 2, 14, 5, D, 2) +
        E(0, 16, 22, 15, '#FFF1DD') +
        E(0, 8, 6, 4, '#FF6F91') +
        eyes() +
        mouth(14),
    fish: () =>
        E(0, 0, 52, 38, '#FF8A3D') +
        G('46,0 82,-28 82,28', '#FF6B1A') +
        E(5, -38, 18, 12, '#FFB36B') +
        C(-26, -8, 11, '#fff') +
        C(-28, -8, 5.5, D) +
        E(-14, 14, 7, 4.5, '#FF8FA8', 'opacity=".7"') +
        `<path d="M-46 8 Q-38 18 -28 12" stroke="${D}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        R(10, -26, 8, 52, '#FFB36B', 4) +
        R(26, -20, 8, 40, '#FFB36B', 4),
    octopus: () =>
        E(-34, 48, 13, 26, '#B07CFF', 'transform="rotate(20 -34 48)"') +
        E(-12, 56, 13, 26, '#B07CFF') +
        E(12, 56, 13, 26, '#B07CFF') +
        E(34, 48, 13, 26, '#B07CFF', 'transform="rotate(-20 34 48)"') +
        C(0, -8, 52, '#B07CFF') +
        C(-30, -38, 5, '#D9C0FF') +
        C(28, -40, 4, '#D9C0FF') +
        gTransform('translate(0,-4)', eyes() + mouth(10)),
    turtle: () =>
        E(-54, 40, 14, 10, '#8EDB9B') +
        E(54, 40, 14, 10, '#8EDB9B') +
        E(0, 38, 54, 42, '#3FB57A') +
        C(-20, 36, 9, '#7ED9A5') +
        C(20, 36, 9, '#7ED9A5') +
        C(0, 58, 9, '#7ED9A5') +
        C(0, -8, 38, '#8EDB9B') +
        gTransform('translate(0,-6) scale(.8)', eyes() + mouth(10)),
    alien: () =>
        body('#7BE0A5', '#5CC98C') +
        L(-20, -42, -30, -68, '#7BE0A5') +
        L(20, -42, 30, -68, '#7BE0A5') +
        C(-30, -70, 7, '#FF8FB8') +
        C(30, -70, 7, '#FF8FB8') +
        E(0, 0, 50, 46, '#7BE0A5') +
        C(-30, -26, 4, '#5CC98C') +
        C(32, -22, 3, '#5CC98C') +
        eyes() +
        mouth(14),
    rocket: () =>
        gTransform(
            'scale(.82)',
            G('-14,60 14,60 0,94', '#FFB02E') +
                G('-8,60 8,60 0,78', '#FFE98A') +
                G('-30,20 -54,60 -28,54', '#FF5A5A') +
                G('30,20 54,60 28,54', '#FF5A5A') +
                E(0, 0, 34, 62, '#F4F4FF') +
                G('-31,-32 0,-84 31,-32', '#FF5A5A') +
                C(0, 0, 23, '#9AD8FF') +
                gTransform('scale(.6)', eyes() + mouth(10))
        ),
    moon: () =>
        C(0, 0, 52, '#FFE98A') +
        C(-30, -26, 8, '#F0CC5E') +
        C(32, 28, 10, '#F0CC5E') +
        C(36, -30, 5, '#F0CC5E') +
        eyes() +
        mouth(14),
    bunnyB: () =>
        R(-30, -88, 16, 46, '#fff', 3) +
        R(14, -88, 16, 46, '#fff', 3) +
        R(-26, -80, 8, 32, '#FFB3C8') +
        R(18, -80, 8, 32, '#FFB3C8') +
        R(-30, 24, 60, 36, '#fff', 3) +
        R(-40, -44, 80, 70, '#fff', 4) +
        sq() +
        R(-34, 2, 10, 8, '#FFB3C8') +
        R(24, 2, 10, 8, '#FFB3C8') +
        R(-5, 2, 10, 8, '#FF8FA8') +
        R(-10, 14, 20, 4, D),
    foxB: () =>
        R(-42, -64, 22, 28, '#FF8A3D') +
        R(20, -64, 22, 28, '#FF8A3D') +
        R(-36, -56, 10, 16, '#FFD9B0') +
        R(26, -56, 10, 16, '#FFD9B0') +
        R(-30, 26, 60, 34, '#FF8A3D', 3) +
        R(-40, -44, 80, 70, '#FF8A3D', 4) +
        R(-40, 4, 28, 22, '#fff') +
        R(12, 4, 28, 22, '#fff') +
        sq() +
        R(-6, 6, 12, 10, D) +
        R(-10, 18, 20, 4, D),
    frogB: () =>
        R(-44, -16, 88, 64, '#5ED06A', 6) +
        R(-40, -48, 32, 32, '#5ED06A', 6) +
        R(8, -48, 32, 32, '#5ED06A', 6) +
        R(-34, -42, 20, 20, '#fff') +
        R(14, -42, 20, 20, '#fff') +
        R(-28, -34, 10, 12, D) +
        R(20, -34, 10, 12, D) +
        R(-38, 6, 12, 8, '#FF9BB0') +
        R(26, 6, 12, 8, '#FF9BB0') +
        R(-24, 20, 48, 6, D) +
        R(-44, 48, 26, 16, '#3FB75B') +
        R(18, 48, 26, 16, '#3FB75B'),
    penguin: () =>
        E(0, 10, 46, 56, '#2E3E6B') +
        E(-50, 16, 10, 28, '#2E3E6B', 'transform="rotate(15 -50 16)"') +
        E(50, 16, 10, 28, '#2E3E6B', 'transform="rotate(-15 50 16)"') +
        E(0, 18, 32, 42, '#fff') +
        E(0, -14, 34, 28, '#fff') +
        E(-18, 66, 16, 7, '#FF9F2E') +
        E(18, 66, 16, 7, '#FF9F2E') +
        gTransform('translate(0,-12)', eyes()) +
        G('-9,-6 9,-6 0,10', '#FF9F2E'),
    polar: () =>
        body('#fff', '#E2EEF8') +
        C(-38, -40, 16, '#fff') +
        C(38, -40, 16, '#fff') +
        C(-38, -40, 8, '#FFC4D4') +
        C(38, -40, 8, '#FFC4D4') +
        C(0, 0, 52, '#fff') +
        E(0, 14, 22, 15, '#E2EEF8') +
        E(0, 8, 6, 4, D) +
        eyes() +
        mouth(16),
    seal: () =>
        E(-52, 42, 16, 10, '#8FA5BA') +
        E(52, 42, 16, 10, '#8FA5BA') +
        E(0, 40, 48, 34, '#9DB4C8') +
        E(0, 0, 54, 46, '#9DB4C8') +
        E(0, 14, 24, 16, '#DCE8F2') +
        E(0, 6, 7, 5, D) +
        C(-10, 16, 2, D) +
        C(10, 16, 2, D) +
        eyes() +
        mouth(20),
    lion: () =>
        C(0, 0, 66, '#E0902B') +
        C(-40, -50, 14, '#FFC15E') +
        C(40, -50, 14, '#FFC15E') +
        C(0, 0, 46, '#FFC15E') +
        E(0, 14, 22, 15, '#FFF1DD') +
        E(0, 6, 6, 4, '#A0522D') +
        eyes() +
        mouth(14),
    giraffe: () =>
        R(-18, 30, 36, 56, '#FFC93C', 6) +
        C(-6, 56, 6, '#C47F1B') +
        C(8, 72, 5, '#C47F1B') +
        L(-18, -40, -22, -64, '#C47F1B') +
        L(18, -40, 22, -64, '#C47F1B') +
        C(-22, -66, 6, '#C47F1B') +
        C(22, -66, 6, '#C47F1B') +
        E(-50, -14, 14, 8, '#FFC93C') +
        E(50, -14, 14, 8, '#FFC93C') +
        E(0, 0, 46, 44, '#FFC93C') +
        C(-26, -28, 7, '#C47F1B') +
        C(30, -22, 6, '#C47F1B') +
        E(0, 18, 24, 16, '#FFF1DD') +
        C(-8, 16, 2.5, '#C47F1B') +
        C(8, 16, 2.5, '#C47F1B') +
        eyes() +
        mouth(24),
    elephant: () =>
        C(-56, -6, 30, '#8FA3C0') +
        C(56, -6, 30, '#8FA3C0') +
        C(-56, -6, 18, '#FFC4D4') +
        C(56, -6, 18, '#FFC4D4') +
        E(0, 40, 13, 34, '#A9B8D0') +
        C(0, 0, 46, '#A9B8D0') +
        E(0, 40, 12, 30, '#A9B8D0') +
        eyes(),
    trex: () =>
        body('#6FD07A', '#A8EBA8') +
        G('-24,-44 -14,-68 -4,-46', '#FF9F3A') +
        G('-4,-48 6,-72 16,-48', '#FF9F3A') +
        G('16,-44 26,-66 34,-40', '#FF9F3A') +
        C(0, 0, 50, '#6FD07A') +
        E(0, 16, 28, 20, '#A8EBA8') +
        C(-8, 10, 2.5, '#3C8F4A') +
        C(8, 10, 2.5, '#3C8F4A') +
        eyes() +
        mouth(24),
    tricera: () =>
        C(0, -6, 64, '#FF9F5A') +
        C(-46, -34, 7, '#FFD84D') +
        C(46, -34, 7, '#FFD84D') +
        C(0, -62, 7, '#FFD84D') +
        G('-30,-34 -22,-74 -14,-36', '#FFF1DD') +
        G('30,-34 22,-74 14,-36', '#FFF1DD') +
        C(0, 0, 46, '#5DC3E8') +
        G('-6,10 6,10 0,-8', '#FFF1DD') +
        eyes() +
        mouth(18),
    egg: () =>
        C(0, -10, 40, '#6FD07A') +
        C(-20, -40, 5, '#8FE39A') +
        C(22, -38, 4, '#8FE39A') +
        gTransform('translate(0,-5)', eyes() + mouth(6)) +
        `<path d="M-52 24 L-34 8 L-17 26 L0 8 L17 26 L34 8 L52 24 V50 Q52 84 0 84 Q-52 84 -52 50Z" fill="#FFF3D6"/>` +
        C(-24, 52, 7, '#FFD9A8') +
        C(20, 60, 6, '#FFD9A8') +
        C(34, 40, 4, '#FFD9A8'),
    cow: () =>
        body('#fff', '#EEE') +
        E(-26, -48, 6, 10, '#FFF1DD') +
        E(26, -48, 6, 10, '#FFF1DD') +
        E(-52, -20, 18, 10, '#fff') +
        E(52, -20, 18, 10, '#fff') +
        C(0, 0, 48, '#fff') +
        E(-30, -24, 15, 12, '#4B3B55') +
        E(0, 18, 28, 20, '#FFB3C8') +
        C(-9, 18, 3.5, '#E0708F') +
        C(9, 18, 3.5, '#E0708F') +
        eyes(),
    sheep: () =>
        E(0, 50, 38, 26, '#F5F0FF') +
        E(-20, 70, 10, 10, '#5B4B66') +
        E(20, 70, 10, 10, '#5B4B66') +
        [
            [-44, -26],
            [-18, -50],
            [18, -50],
            [44, -26],
            [-48, 10],
            [48, 10]
        ]
            .map((p) => C(p[0], p[1], 24, '#F5F0FF'))
            .join('') +
        C(0, -5, 44, '#F5F0FF') +
        E(-38, -6, 14, 8, '#E0B99A') +
        E(38, -6, 14, 8, '#E0B99A') +
        E(0, 6, 32, 36, '#F3D9C4') +
        E(0, 14, 6, 4, '#C98F7A') +
        eyes() +
        mouth(22),
    chick: () =>
        body('#FFD34D', '#FF9F2E') +
        E(-52, 10, 12, 22, '#FFC21A') +
        E(52, 10, 12, 22, '#FFC21A') +
        E(-8, -54, 5, 12, '#FFD34D', 'transform="rotate(-20 -8 -54)"') +
        E(6, -56, 5, 14, '#FFD34D') +
        C(0, 0, 50, '#FFD34D') +
        eyes() +
        G('-9,8 9,8 0,22', '#FF9F2E'),
    owl: () =>
        E(-50, 16, 11, 30, '#8A5A3B', 'transform="rotate(12 -50 16)"') +
        E(50, 16, 11, 30, '#8A5A3B', 'transform="rotate(-12 50 16)"') +
        G('-40,-36 -34,-66 -14,-44', '#A9764F') +
        G('40,-36 34,-66 14,-44', '#A9764F') +
        E(0, 8, 46, 54, '#A9764F') +
        E(0, 26, 28, 32, '#F3D9B8') +
        C(-18, -8, 15, '#fff') +
        C(18, -8, 15, '#fff') +
        C(-15, -8, 6.5, D) +
        C(22, -12, 6.5, D) +
        C(-13, -11, 2, '#fff') +
        C(24, -15, 2, '#fff') +
        G('-7,2 7,2 0,16', '#FF9F2E') +
        E(-16, 62, 12, 6, '#FF9F2E') +
        E(16, 62, 12, 6, '#FF9F2E'),
    robot: () =>
        L(0, -40, 0, -62, '#B8C4D6') +
        C(0, -66, 7, '#FF8FB8') +
        R(-30, 34, 60, 36, '#B8C4D6', 8) +
        C(-44, 48, 9, '#B8C4D6') +
        C(44, 48, 9, '#B8C4D6') +
        R(-46, -42, 92, 72, '#B8C4D6', 16) +
        R(-36, -32, 72, 52, '#2E3E6B', 10) +
        '<path d="M-24 -20 l12 12 m0 -12 l-12 12 M12 -20 l12 12 m0 -12 l-12 12" stroke="#7BE0A5" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M-14 10 q7 -7 14 0 t14 0" stroke="#7BE0A5" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    cloudy: () =>
        E(0, 12, 62, 30, '#fff') +
        C(-24, -4, 28, '#fff') +
        C(14, -12, 34, '#fff') +
        C(40, 6, 24, '#fff') +
        gTransform('translate(0,8)', eyes()) +
        `<path d="M-9 32 Q0 24 9 32" stroke="${D}" stroke-width="3" fill="none" stroke-linecap="round"/>`
};

function twGroup(inner, i, reducedMotion) {
    if (reducedMotion) {
        return inner;
    }
    return `<g class="kiosk-celebration__tw" style="animation-delay:${i * 0.3}s">${inner}</g>`;
}

function st(x, y, s, f, i, reducedMotion) {
    return twGroup(
        `<polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${f}" transform="translate(${x} ${y}) scale(${s / 8})"/>`,
        i,
        reducedMotion
    );
}

function sf(x, y, s, i, reducedMotion) {
    return twGroup(
        [0, 60, 120]
            .map(
                (a) =>
                    `<line x1="${x - s}" y1="${y}" x2="${x + s}" y2="${y}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`
            )
            .join(''),
        i,
        reducedMotion
    );
}

function cloud(x, y, f = '#fff') {
    return E(x, y, 26, 10, f) + E(x - 14, y - 6, 14, 10, f) + E(x + 10, y - 9, 16, 12, f);
}

function pcloud(x, y) {
    return R(x, y + 8, 48, 14, '#fff') + R(x + 10, y, 24, 10, '#fff');
}

function flower(x, y, c) {
    return (
        [0, 72, 144, 216, 288]
            .map(
                (a) =>
                    C(
                        x + Math.cos((a * Math.PI) / 180) * 6,
                        y + Math.sin((a * Math.PI) / 180) * 6,
                        5,
                        c
                    )
            )
            .join('') +
        C(x, y, 4, '#FFD84D')
    );
}

function blade(x, y, h, f) {
    return G(`${x - 5},${y} ${x},${y - h} ${x + 5},${y}`, f);
}

function bf(x, y, c) {
    return (
        E(x - 6, y - 2, 6, 8, c) +
        E(x + 6, y - 2, 6, 8, c) +
        R(x - 1, y - 6, 2, 13, D, 1)
    );
}

function bub(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="3"/>`;
}

function sw(x) {
    return `<path d="M${x} 280 Q${x - 15} 250 ${x} 225 Q${x + 15} 200 ${x} 175" stroke="#2FB574" stroke-width="9" fill="none" stroke-linecap="round"/>`;
}

function coral(x, c) {
    return (
        `<path d="M${x} 280 L${x} 248 M${x} 262 L${x - 12} 250 M${x} 256 L${x + 12} 244" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        C(x, 246, 5, c) +
        C(x - 12, 248, 4, c) +
        C(x + 12, 242, 4, c)
    );
}

function vine(x, d) {
    return (
        `<path d="M${x} 0 Q${x + d} 40 ${x - d / 2} 80 Q${x - d} 110 ${x} 140" stroke="#2E8B4A" stroke-width="5" fill="none"/>` +
        E(x + d, 40, 10, 5, '#3FA45B') +
        E(x - d, 92, 10, 5, '#3FA45B') +
        E(x + d / 2, 125, 10, 5, '#3FA45B')
    );
}

/** @type {Array<{ n: string; bg: string; g1: string; g2: string; tx: string; ch: [string, keyof typeof KIOSK_CHARACTERS][]; sky: (reducedMotion: boolean) => string; front: () => string }>} */
export const KIOSK_THEMES = [
    {
        n: 'Jungle',
        bg: '#BDEFC4',
        g1: '#3FA45B',
        g2: '#2E8B4A',
        tx: '#1F5E34',
        ch: [
            ['Monkey', 'monkey'],
            ['Parrot', 'parrot'],
            ['Tiger', 'tiger']
        ],
        sky: (_reducedMotion) =>
            C(352, 44, 24, '#FFD84D') +
            vine(24, 12) +
            vine(376, -12) +
            E(40, 200, 14, 38, '#3FA45B', 'transform="rotate(-35 40 200)"') +
            E(362, 196, 14, 38, '#3FA45B', 'transform="rotate(35 362 196)"') +
            bf(84, 120, '#FF8FB8') +
            bf(318, 128, '#FFB02E'),
        front: () =>
            blade(92, 252, 20, '#1F6E3B') +
            blade(102, 252, 14, '#1F6E3B') +
            blade(300, 252, 18, '#1F6E3B') +
            blade(310, 252, 24, '#1F6E3B') +
            flower(30, 262, '#FF6FA5') +
            flower(54, 272, '#FFD84D') +
            flower(352, 264, '#FF6FA5') +
            flower(374, 274, '#fff')
    },
    {
        n: 'Ocean',
        bg: '#A8E1F5',
        g1: '#2FA3D8',
        g2: '#1B7FB5',
        tx: '#0C4A6E',
        ch: [
            ['Fish', 'fish'],
            ['Octopus', 'octopus'],
            ['Turtle', 'turtle']
        ],
        sky: (_reducedMotion) =>
            '<polygon points="50,0 90,0 150,260 70,260" fill="#fff" opacity=".18"/>' +
            '<polygon points="300,0 340,0 380,260 290,260" fill="#fff" opacity=".18"/>' +
            bub(44, 70, 8) +
            bub(70, 112, 5) +
            bub(340, 80, 7) +
            bub(366, 132, 5) +
            bub(322, 40, 4) +
            bub(100, 190, 4) +
            E(70, 160, 11, 7, '#FFD84D') +
            G('79,160 89,154 89,166', '#FFD84D') +
            C(64, 158, 2, D) +
            E(330, 118, 11, 7, '#FF8FB8') +
            G('339,118 349,112 349,124', '#FF8FB8') +
            C(324, 116, 2, D) +
            '<path d="M326 190 A16 14 0 0 1 358 190Z" fill="#E7A8FF"/>' +
            '<path d="M332 190 q-3 10 0 18 M342 190 q3 10 0 20 M352 190 q-3 10 0 16" stroke="#E7A8FF" stroke-width="3" fill="none" stroke-linecap="round"/>',
        front: () =>
            sw(24) +
            sw(382) +
            coral(62, '#FF8FB8') +
            coral(338, '#FFB36B') +
            G('108,262 111,254 119,254 113,249 115,241 108,246 101,241 103,249 97,254 105,254', '#FFB02E')
    },
    {
        n: 'Space',
        bg: '#3B2A8C',
        g1: '#5A45B5',
        g2: '#4733A0',
        tx: '#FFE98A',
        ch: [
            ['Alien', 'alien'],
            ['Rocket', 'rocket'],
            ['Moon', 'moon']
        ],
        sky: (reducedMotion) =>
            st(30, 30, 7, '#FFE98A', 0, reducedMotion) +
            st(110, 24, 5, '#fff', 1, reducedMotion) +
            st(300, 22, 6, '#fff', 2, reducedMotion) +
            st(384, 104, 6, '#FFE98A', 3, reducedMotion) +
            st(16, 152, 5, '#fff', 4, reducedMotion) +
            st(120, 110, 4, '#fff', 5, reducedMotion) +
            st(280, 120, 4, '#FFE98A', 6, reducedMotion) +
            st(150, 216, 4, '#fff', 7, reducedMotion) +
            C(352, 44, 24, '#FFF3B0') +
            C(344, 38, 5, '#F0CC5E') +
            C(360, 52, 4, '#F0CC5E') +
            C(62, 190, 22, '#FF6FA5') +
            '<ellipse cx="62" cy="190" rx="38" ry="9" fill="none" stroke="#FFD84D" stroke-width="4" transform="rotate(-18 62 190)"/>' +
            C(345, 150, 26, '#6FD6F5') +
            E(345, 150, 26, 5, '#4BB6E0') +
            C(45, 100, 11, '#FF9F5A') +
            C(41, 97, 3, '#E8803A') +
            '<line x1="92" y1="62" x2="52" y2="84" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>' +
            C(94, 61, 5, '#fff'),
        front: () =>
            E(62, 262, 22, 6, '#3B2A8C', 'opacity=".55"') +
            E(330, 260, 16, 5, '#3B2A8C', 'opacity=".55"') +
            E(360, 282, 12, 4, '#3B2A8C', 'opacity=".55"') +
            R(300, 226, 3, 30, '#fff') +
            G('303,226 322,232 303,240', '#FF5A5A')
    },
    {
        n: 'Blocky world',
        bg: '#8FD3FF',
        g1: '#4CC05A',
        g2: '#9A6A3A',
        tx: '#14507A',
        ch: [
            ['Block bunny', 'bunnyB'],
            ['Block fox', 'foxB'],
            ['Block frog', 'frogB']
        ],
        sky: (_reducedMotion) =>
            R(326, 20, 42, 42, '#FFD84D') +
            pcloud(20, 22) +
            pcloud(300, 100) +
            pcloud(50, 96) +
            R(36, 200, 14, 50, '#7C5329') +
            R(14, 158, 58, 46, '#2E9B45') +
            R(26, 138, 34, 26, '#2E9B45') +
            R(22, 170, 8, 8, '#E0524A') +
            R(346, 210, 12, 40, '#7C5329') +
            R(326, 178, 52, 40, '#2E9B45') +
            R(338, 160, 28, 24, '#2E9B45'),
        front: () =>
            R(100, 246, 8, 8, '#FF6FA5') +
            R(296, 250, 8, 8, '#FFD84D') +
            R(30, 282, 14, 14, '#7C5329') +
            R(120, 284, 14, 14, '#7C5329') +
            R(300, 280, 14, 14, '#7C5329') +
            R(210, 288, 14, 10, '#7C5329')
    },
    {
        n: 'Arctic',
        bg: '#BFE6FF',
        g1: '#DCEEFA',
        g2: '#C2E0F4',
        tx: '#1C5D8A',
        ch: [
            ['Penguin', 'penguin'],
            ['Polar bear', 'polar'],
            ['Seal', 'seal']
        ],
        sky: (reducedMotion) =>
            C(352, 44, 22, '#FFF3B0') +
            G('0,240 50,150 110,240', '#A8D4F0') +
            G('36,176 50,150 64,176', '#fff') +
            G('270,240 335,140 400,240', '#A8D4F0') +
            G('316,172 335,140 354,172', '#fff') +
            sf(40, 40, 8, 0, reducedMotion) +
            sf(384, 110, 7, 1, reducedMotion) +
            sf(300, 24, 6, 2, reducedMotion) +
            sf(18, 112, 6, 3, reducedMotion) +
            sf(96, 24, 6, 4, reducedMotion) +
            sf(124, 130, 5, 5, reducedMotion) +
            sf(274, 150, 5, 6, reducedMotion),
        front: () =>
            '<path d="M314 268 A36 34 0 0 1 386 268Z" fill="#fff" stroke="#9CCBE8" stroke-width="3"/>' +
            '<path d="M322 248 H378 M316 260 H384" stroke="#C2E0F4" stroke-width="2" fill="none"/>' +
            '<path d="M342 268 A8 12 0 0 1 358 268Z" fill="#4A6FA5"/>' +
            R(26, 252, 32, 22, '#E8F6FF', 5) +
            R(50, 262, 26, 18, '#fff', 5)
    },
    {
        n: 'Safari',
        bg: '#FFE3A3',
        g1: '#F2B84B',
        g2: '#E09A2E',
        tx: '#7A4A00',
        ch: [
            ['Lion', 'lion'],
            ['Giraffe', 'giraffe'],
            ['Elephant', 'elephant']
        ],
        sky: (_reducedMotion) =>
            C(352, 44, 26, '#FF8A3D') +
            '<path d="M52 245 Q56 210 48 180" stroke="#8A5A2B" stroke-width="7" fill="none"/>' +
            E(48, 176, 42, 14, '#4C9A3A') +
            E(30, 170, 20, 9, '#5DB04A') +
            E(68, 172, 22, 9, '#5DB04A') +
            '<path d="M352 245 Q350 215 356 195" stroke="#8A5A2B" stroke-width="6" fill="none"/>' +
            E(356, 192, 32, 11, '#4C9A3A') +
            E(344, 188, 14, 7, '#5DB04A') +
            '<path d="M48 80 q6 -8 12 0 q6 -8 12 0 M82 62 q5 -7 10 0 q5 -7 10 0" stroke="#7A4A00" stroke-width="3" fill="none" stroke-linecap="round"/>',
        front: () =>
            blade(30, 258, 22, '#B57A1B') +
            blade(42, 258, 16, '#B57A1B') +
            blade(54, 258, 24, '#B57A1B') +
            blade(344, 262, 20, '#B57A1B') +
            blade(356, 262, 26, '#B57A1B') +
            E(384, 270, 16, 10, '#B58A5A') +
            E(104, 268, 12, 7, '#B58A5A')
    },
    {
        n: 'Dino land',
        bg: '#FFD9A8',
        g1: '#8BCF5A',
        g2: '#6FB544',
        tx: '#6B3A00',
        ch: [
            ['T-rex', 'trex'],
            ['Trike', 'tricera'],
            ['Baby egg', 'egg']
        ],
        sky: (_reducedMotion) =>
            C(50, 40, 24, '#FF7A3D') +
            G('285,240 345,128 405,240', '#8A5A44') +
            G('326,160 345,128 364,160', '#FF7A3D') +
            '<circle cx="350" cy="108" r="10" fill="#fff" opacity=".7"/>' +
            '<circle cx="362" cy="90" r="8" fill="#fff" opacity=".7"/>' +
            '<circle cx="352" cy="74" r="6" fill="#fff" opacity=".7"/>' +
            E(30, 205, 10, 30, '#4C9A3A', 'transform="rotate(-30 30 205)"') +
            E(48, 200, 10, 32, '#5DB04A', 'transform="rotate(10 48 200)"') +
            E(64, 212, 9, 26, '#4C9A3A', 'transform="rotate(35 64 212)"'),
        front: () =>
            E(90, 264, 12, 15, '#FFF3D6') +
            C(86, 260, 2.5, '#FFD9A8') +
            C(94, 268, 2.5, '#FFD9A8') +
            E(114, 270, 10, 12, '#FFF3D6') +
            C(112, 268, 2, '#FFD9A8') +
            E(300, 266, 14, 8, '#8A5A44') +
            blade(24, 262, 18, '#4C9A3A') +
            blade(36, 262, 24, '#4C9A3A')
    },
    {
        n: 'Farm',
        bg: '#CDEBFF',
        g1: '#7ED957',
        g2: '#5CBF3F',
        tx: '#2C5B1A',
        ch: [
            ['Cow', 'cow'],
            ['Sheep', 'sheep'],
            ['Chick', 'chick']
        ],
        sky: (_reducedMotion) =>
            C(352, 44, 24, '#FFD84D') +
            cloud(60, 40) +
            cloud(318, 104) +
            R(14, 172, 82, 72, '#E0524A') +
            G('6,174 55,134 104,174', '#8A2F2A') +
            R(42, 200, 28, 44, '#fff') +
            '<path d="M42 200 L70 244 M70 200 L42 244" stroke="#E0524A" stroke-width="3"/>' +
            R(296, 212, 104, 5, '#C98F5A') +
            R(296, 226, 104, 5, '#C98F5A') +
            R(300, 204, 7, 40, '#C98F5A') +
            R(334, 204, 7, 40, '#C98F5A') +
            R(368, 204, 7, 40, '#C98F5A'),
        front: () =>
            flower(112, 266, '#FF6FA5') +
            flower(138, 274, '#FFD84D') +
            flower(290, 270, '#fff') +
            flower(380, 272, '#FF6FA5') +
            blade(250, 262, 14, '#3E9B2C') +
            blade(262, 262, 20, '#3E9B2C')
    }
];

function qm(x, y, s, c, i, reducedMotion) {
    return twGroup(
        `<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="${s}" fill="${c}">?</text>`,
        i,
        reducedMotion
    );
}

function gear(x, y, r, c, bg) {
    return (
        `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="none" stroke="${c}" stroke-width="8" stroke-dasharray="7 7"/>` +
        C(x, y, r, c) +
        C(x, y, r * 0.4, bg)
    );
}

function wifi(x, y) {
    return (
        `<g fill="none" stroke="#7A93C9" stroke-width="6" stroke-linecap="round"><path d="M${x - 30} ${y - 6} Q${x} ${y - 36} ${x + 30} ${y - 6}"/><path d="M${x - 20} ${y + 4} Q${x} ${y - 18} ${x + 20} ${y + 4}"/><path d="M${x - 10} ${y + 14} Q${x} ${y + 2} ${x + 10} ${y + 14}"/></g>` +
        C(x, y + 24, 4, '#7A93C9') +
        `<line x1="${x - 34}" y1="${y - 26}" x2="${x + 34}" y2="${y + 30}" stroke="#FF8FA8" stroke-width="6" stroke-linecap="round"/>`
    );
}

/** Kiosk error backgrounds from kiosk-screens-1.html (four wired scenes). */
const KIOSK_ERROR_SCENES = {
    notFound: {
        bg: '#E4DAFF',
        g1: '#C9B8F5',
        g2: '#B7A2EE',
        tx: '#4A2C8A',
        sky: (reducedMotion) =>
            qm(62, 120, 36, '#B7A2EE', 0, reducedMotion) +
            qm(344, 110, 42, '#B7A2EE', 1, reducedMotion) +
            qm(100, 200, 24, '#C9B8F5', 2, reducedMotion) +
            qm(310, 190, 26, '#C9B8F5', 3, reducedMotion) +
            qm(28, 60, 22, '#C9B8F5', 4, reducedMotion) +
            qm(376, 52, 24, '#C9B8F5', 5, reducedMotion),
        front: () => ''
    },
    alreadyIn: {
        bg: '#D4F5DD',
        g1: '#7ED9A0',
        g2: '#5CC98C',
        tx: '#1F6B3E',
        sky: (reducedMotion) =>
            st(50, 130, 7, '#FFD84D', 0, reducedMotion) +
            st(344, 150, 6, '#FFD84D', 1, reducedMotion) +
            st(96, 196, 5, '#fff', 2, reducedMotion) +
            st(310, 200, 5, '#fff', 3, reducedMotion) +
            st(28, 60, 5, '#fff', 4, reducedMotion),
        front: () => ''
    },
    alreadyOut: {
        bg: '#D6DEFF',
        g1: '#A9B8F5',
        g2: '#8FA2EE',
        tx: '#2C3A8A',
        sky: (reducedMotion) =>
            st(40, 70, 7, '#fff', 0, reducedMotion) +
            st(352, 56, 8, '#fff', 1, reducedMotion) +
            st(70, 150, 5, '#FFE98A', 2, reducedMotion) +
            st(336, 150, 6, '#FFE98A', 3, reducedMotion) +
            st(100, 200, 4, '#fff', 4, reducedMotion) +
            st(312, 196, 5, '#fff', 5, reducedMotion) +
            st(380, 110, 4, '#fff', 6, reducedMotion),
        front: () => ''
    },
    serverError: {
        bg: '#FFE0CC',
        g1: '#FFB88A',
        g2: '#FF9F66',
        tx: '#8A3A10',
        sky: (reducedMotion) =>
            gear(58, 130, 20, '#FFB88A', '#FFE0CC') +
            gear(342, 140, 26, '#FFB88A', '#FFE0CC') +
            gear(96, 196, 12, '#FFCBA8', '#FFE0CC') +
            st(350, 56, 6, '#FFB88A', 0, reducedMotion) +
            st(36, 60, 5, '#FFB88A', 1, reducedMotion),
        front: () => ''
    },
    offline: {
        bg: '#C9D9F2',
        g1: '#9FB8E6',
        g2: '#86A2DB',
        tx: '#2C4A86',
        sky: (reducedMotion) =>
            wifi(346, 110) +
            cloud(60, 130, '#E8F0FC') +
            cloud(88, 200, '#E8F0FC') +
            cloud(330, 200, '#E8F0FC') +
            st(40, 70, 5, '#fff', 0, reducedMotion),
        front: () => ''
    }
};

/**
 * @param {'notFound'|'alreadyIn'|'alreadyOut'|'serverError'|'offline'} kind
 */
export function buildKioskErrorSkySvg(
    kind,
    { reducedMotion = false } = {}
) {
    const e = KIOSK_ERROR_SCENES[kind];
    if (!e) {
        return '';
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true"><rect width="400" height="300" fill="${e.bg}"/>${e.sky(reducedMotion)}</svg>`;
}

/**
 * @param {'notFound'|'alreadyIn'|'alreadyOut'|'serverError'|'offline'} kind
 */
export function buildKioskErrorGroundSvg(kind) {
    const e = KIOSK_ERROR_SCENES[kind];
    if (!e) {
        return '';
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 215 400 85" preserveAspectRatio="none" aria-hidden="true"><path d="M0 238 Q100 205 200 236 T400 230 V300 H0Z" fill="${e.g1}"/><path d="M0 272 Q120 250 240 274 T400 268 V300 H0Z" fill="${e.g2}"/></svg>`;
}

/**
 * @param {'notFound'|'alreadyIn'|'alreadyOut'|'serverError'|'offline'} kind
 */
export function buildKioskErrorFrontSvg(kind) {
    const e = KIOSK_ERROR_SCENES[kind];
    if (!e) {
        return '';
    }
    const body = e.front();
    if (!body) {
        return '';
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
}

/**
 * @param {'notFound'|'alreadyIn'|'alreadyOut'|'serverError'|'offline'} kind
 */
export function kioskErrorHeroKey(kind) {
    if (kind === 'notFound') {
        return 'owl';
    }
    if (kind === 'alreadyIn') {
        return 'chick';
    }
    if (kind === 'alreadyOut') {
        return 'moon';
    }
    if (kind === 'serverError') {
        return 'robot';
    }
    if (kind === 'offline') {
        return 'cloudy';
    }
    return 'owl';
}

export function buildKioskErrorHeroSvg(
    kind,
    { reducedMotion = false } = {}
) {
    const key = kioskErrorHeroKey(kind);
    const heroBody = KIOSK_CHARACTERS[key]();
    const scaleN = key === 'cloudy' ? 0.82 : 0.88;
    const scale = ` scale(${scaleN})`;
    const heroClass = reducedMotion ? '' : ' kiosk-celebration__hero';
    const inner = heroClass
        ? `<g class="${heroClass.trim()}">${heroBody}</g>`
        : heroBody;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(200 158)${scale}">${inner}</g></svg>`;
}

export function kioskErrorTheme(kind) {
    const e = KIOSK_ERROR_SCENES[kind];
    if (!e) {
        return { bg: '#f1e6fa', tx: '#4a2c7a' };
    }
    return { bg: e.bg, tx: e.tx };
}

export function kioskErrorAriaLabel(kind, message) {
    const key = kioskErrorHeroKey(kind);
    const character =
        key === 'owl'
            ? 'Owl'
            : key === 'chick'
              ? 'Chick'
              : key === 'moon'
                ? 'Moon'
                : key === 'robot'
                  ? 'Robot'
                  : key === 'cloudy'
                    ? 'Cloud'
                    : 'friend';
    const msg = String(message ?? '').trim();
    return msg || `${character} scene`;
}

export function kioskErrorHeadingFontSizeStyle(text) {
    const len = String(text ?? '').length;
    let maxRem = 2.65;
    if (len > 95) {
        maxRem = 1.35;
    } else if (len > 70) {
        maxRem = 1.55;
    } else if (len > 50) {
        maxRem = 1.75;
    } else if (len > 35) {
        maxRem = 2;
    } else if (len > 22) {
        maxRem = 2.35;
    }
    return {
        fontSize: `clamp(1.1rem, min(5.8vw, 4.8vh), ${maxRem}rem)`
    };
}

const THEME_COUNT = KIOSK_THEMES.length;
const CHARS_PER_THEME = 3;

export function buildCelebrationSkySvg(
    themeIndex,
    { reducedMotion = false } = {}
) {
    const t = KIOSK_THEMES[themeIndex];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true"><rect width="400" height="300" fill="${t.bg}"/>${t.sky(reducedMotion)}</svg>`;
}

export function buildCelebrationGroundSvg(themeIndex) {
    const t = KIOSK_THEMES[themeIndex];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 215 400 85" preserveAspectRatio="none" aria-hidden="true"><path d="M0 238 Q100 205 200 236 T400 230 V300 H0Z" fill="${t.g1}"/><path d="M0 272 Q120 250 240 274 T400 268 V300 H0Z" fill="${t.g2}"/></svg>`;
}

export function buildCelebrationFrontSvg(themeIndex) {
    const t = KIOSK_THEMES[themeIndex];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${t.front()}</svg>`;
}

export function buildCelebrationHeroSvg(
    themeIndex,
    animalIndex,
    { reducedMotion = false } = {}
) {
    const t = KIOSK_THEMES[themeIndex];
    const key = t.ch[animalIndex][1];
    const heroBody = KIOSK_CHARACTERS[key]();
    const heroClass = reducedMotion ? '' : ' kiosk-celebration__hero';
    const inner = heroClass
        ? `<g class="${heroClass.trim()}">${heroBody}</g>`
        : heroBody;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(200 150)">${inner}</g></svg>`;
}

export function buildCelebrationGreeting(mode, studentName) {
    const trimmed = String(studentName ?? '').trim().toUpperCase();
    if (mode === 'out') {
        return trimmed ? `BYE, ${trimmed}!` : 'BYE!';
    }
    return trimmed ? `HI, ${trimmed}!` : 'HI!';
}

export function greetingFontSizeStyle(text) {
    const len = text.length;
    let maxRem = 3.25;
    if (len > 20) {
        maxRem = 1.85;
    } else if (len > 16) {
        maxRem = 2.45;
    } else if (len > 12) {
        maxRem = 2.85;
    }
    return {
        fontSize: `clamp(1.5rem, min(8.5vw, 7vh), ${maxRem}rem)`
    };
}

let lastPick = null;

export function pickCelebrationIndices(excludeSameAsLast = true) {
    let ti;
    if (excludeSameAsLast && lastPick && THEME_COUNT > 1) {
        do {
            ti = Math.floor(Math.random() * THEME_COUNT);
        } while (ti === lastPick[0]);
    } else {
        ti = Math.floor(Math.random() * THEME_COUNT);
    }
    const ai = Math.floor(Math.random() * CHARS_PER_THEME);
    lastPick = [ti, ai];
    return { themeIndex: ti, animalIndex: ai };
}

export function celebrationAriaLabel(
    themeIndex,
    animalIndex,
    mode,
    studentName
) {
    const theme = KIOSK_THEMES[themeIndex]?.n ?? 'Celebration';
    const character =
        KIOSK_THEMES[themeIndex]?.ch?.[animalIndex]?.[0] ?? 'friend';
    const namePart = String(studentName ?? '').trim();
    const action = mode === 'out' ? 'Goodbye' : 'Hello';
    return `${action}, ${namePart || 'friend'}. ${theme} with ${character}.`;
}

export function celebrationTextColor(themeIndex) {
    return KIOSK_THEMES[themeIndex]?.tx ?? '#2a1b4d';
}

/** Pill sits on white. Space yellow is for the sky, so the pill uses the theme background. */
export function celebrationPillTextColor(themeIndex) {
    const theme = KIOSK_THEMES[themeIndex];
    if (!theme) {
        return '#2a1b4d';
    }
    if (theme.n === 'Space') {
        return theme.bg;
    }
    return theme.tx;
}

/** Keep each pill line on one row. Sized from the longer line so it fits in about 90vw. */
export function checkoutPillFontSizeStyle(lines) {
    const len = Math.max(
        8,
        ...lines.map((line) => String(line ?? '').trim().length)
    );
    const ems = len * 0.52 + 3.1;
    const vw = Math.min(6.2, 88 / ems);
    return {
        fontSize: `clamp(1.35rem, ${vw.toFixed(2)}vw, 2.75rem)`
    };
}

export function celebrationShellBg(themeIndex) {
    return KIOSK_THEMES[themeIndex]?.bg ?? '#f1e6fa';
}
