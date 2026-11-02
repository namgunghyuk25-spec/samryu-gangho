// pixel.js — 코드로 찍는 도트: 인형 / 짐승 / 아이콘 / 배경 / 중원지도
// 모든 스프라이트는 네이티브 해상도로 찍고 1px 외곽선을 자동으로 두른다 (RM2003 감성).
import { ATLAS } from './atlas.js';

export const OUTLINE = [26, 16, 32];

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export function shade(h, f) {
  const k = v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  const [r, g, b] = rgb(h);
  return '#' + [k(r), k(g), k(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function painter(ctx) {
  const r = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const line = (x0, y0, x1, y1, c, t = 1) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    ctx.fillStyle = c;
    for (;;) {
      ctx.fillRect(x0 - (t >> 1), y0 - (t >> 1), t, t);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  return { r, line, px: (x, y, c) => r(x, y, 1, 1, c) };
}

export function outline(c, col = OUTLINE) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const d = ctx.getImageData(0, 0, w, h), a = d.data;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) on[i] = a[i * 4 + 3] > 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (on[i]) continue;
    if ((x > 0 && on[i - 1]) || (x < w - 1 && on[i + 1]) || (y > 0 && on[i - w]) || (y < h - 1 && on[i + w])) {
      a[i * 4] = col[0]; a[i * 4 + 1] = col[1]; a[i * 4 + 2] = col[2]; a[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

// ───────────────────────── 인형(사람) ─────────────────────────
// spec: size, skin, hair, robe, trim, pants, belt, hat, weapon, beard, mask, cape, build, armsForward, longhair
// pose: idle | idle2 | atk | cast | hurt | dead
export function drawHuman(spec, pose) {
  if (pose === 'dead') return lieDown(drawHuman(spec, 'hurt'), spec.size || 32);
  const S = spec.size || 32, c = canvas(S, S), g = painter(c.getContext('2d'));
  const sk = spec.skin || '#f2c79a', skD = shade(sk, 0.78);
  const robe = spec.robe || '#3a5aa0', robeD = shade(robe, 0.68), robeL = shade(robe, 1.25);
  const trim = spec.trim || '#e8dcc0', pants = spec.pants || '#3a3040', hair = spec.hair || '#2a1c14';
  const belt = spec.belt || shade(robe, 0.5);
  const bw = spec.build || 1, u = S / 32;
  const gy = S - 2;
  const legH = Math.round(S * 0.2), torH = Math.round(S * 0.27), hdH = Math.round(S * 0.25), hdW = hdH;
  const torW = Math.round(S * 0.3 * bw), legW = Math.max(2, Math.round(S * 0.09 * bw));
  const t = Math.max(1, Math.round(2 * u * Math.min(bw, 1.3))); // 팔 두께
  const bob = pose === 'idle2' ? 1 : 0;
  const lean = pose === 'atk' ? Math.round(2 * u) : pose === 'hurt' ? -Math.round(2 * u) : 0;
  const cx = Math.floor(S / 2) - Math.round(u);
  const legTop = gy - legH + 1, torTop = legTop - torH + bob, hdTop = torTop - hdH + 1;
  const tx = cx - (torW >> 1) + lean;

  // 망토(뒤)
  if (spec.cape) {
    const cd = shade(spec.cape, 0.7);
    g.r(tx - 2 * u, torTop + 1, torW * 0.6, torH + legH * 0.8, spec.cape);
    g.r(tx - 3 * u, torTop + torH * 0.5, 2 * u, torH * 0.5 + legH * 0.8, cd);
  }
  // 긴 머리(뒤)
  if (spec.longhair) g.r(tx + (torW - hdW) / 2 - u, hdTop + 2, 3 * u, hdH + torH * 0.6, hair);

  // 다리
  let fx = cx + Math.round(u), bx = cx - Math.round(3 * u);
  if (pose === 'atk') { fx = cx + Math.round(4 * u); bx = cx - Math.round(5 * u); }
  if (pose === 'hurt') { fx = cx; bx = cx - Math.round(4 * u); }
  g.r(bx, legTop, legW, legH, shade(pants, 0.72));
  g.r(fx, legTop, legW, legH, pants);
  g.r(bx, gy, legW + 1, 1, '#2a1a12');
  g.r(fx, gy, legW + 1, 1, '#3a2418');

  // 뒷팔
  const sx = tx + torW - Math.round(2 * u), sy = torTop + Math.round(2 * u);
  const bsx = tx + Math.round(u);
  let fh, bh, wa; // 앞손, 뒷손, 무기각도
  switch (pose) {
    case 'atk': fh = [sx + 7 * u, sy + 1]; bh = [tx - 3 * u, sy + 3 * u]; wa = 0; break;
    case 'cast': fh = [sx + 3 * u, sy - 5 * u]; bh = [sx + 1 * u, sy - 6 * u]; wa = 80; break;
    case 'hurt': fh = [sx - u, sy + 6 * u]; bh = [tx - 3 * u, sy + u]; wa = 230; break;
    default: fh = [sx + 3 * u, sy + torH * 0.45]; bh = [bsx - u, sy + torH * 0.5]; wa = 55;
  }
  if (spec.armsForward) { fh = [sx + 8 * u, sy]; bh = [sx + 7 * u, sy - u]; wa = null; }
  g.line(bsx, sy, bh[0], bh[1], robeD, t);
  g.r(bh[0] - (t >> 1), bh[1] - (t >> 1), t + 1, t + 1, skD);

  // 몸통 + 치마
  const skirtH = Math.round(legH * 0.6);
  g.r(tx - u, torTop + torH - 2, torW + 2 * u, skirtH + 2, robe);
  g.r(tx - u, torTop + torH - 2, 2 * u, skirtH + 2, robeD);
  g.r(tx - u, torTop + torH + skirtH - 1, torW + 2 * u, 1, trim);
  g.r(tx, torTop, torW, torH, robe);
  g.r(tx, torTop, Math.max(1, 2 * u), torH, robeD);
  g.r(tx + torW - 2 * u, torTop + 1, u, torH - 3, robeL);
  g.line(tx + torW - 1 - 3 * u, torTop, tx + torW - 1 - u, torTop + 3 * u, trim, Math.max(1, Math.round(u)));
  g.r(tx, torTop + torH - 3 * u, torW, Math.max(1, 2 * u), belt);

  // 머리
  const hx = tx + Math.round((torW - hdW) / 2) + Math.round(u);
  g.r(hx, hdTop, hdW, hdH, sk);
  g.r(hx, hdTop + hdH - 1, hdW, 1, skD);
  const hat = spec.hat || 'topknot';
  if (hat !== 'bald' && hat !== 'hood') {
    g.r(hx, hdTop, hdW, Math.max(2, 2 * u), hair);
    g.r(hx, hdTop, Math.round(hdW * 0.45), hdH - 2 * u, hair);
  }
  if (hat === 'bald') { g.px(hx + 2 * u, hdTop + u, '#fff2d8'); }
  const ey = hdTop + Math.round(hdH * 0.5);
  g.px(hx + hdW - 2 * u, ey, '#101018');
  if (u > 1.2) g.px(hx + hdW - 2 * u, ey + 1, '#101018');
  g.px(hx + hdW - 3 * u, ey - Math.max(1, u), hat === 'bald' ? skD : hair);
  g.r(hx + hdW - 3 * u, ey - Math.max(1, u), 2 * u, 1, hat === 'bald' ? skD : hair);
  g.px(hx + Math.round(hdW * 0.45), ey, skD);
  if (spec.beard) { g.r(hx + hdW - 4 * u, hdTop + hdH - 2 * u, 4 * u, 3 * u, spec.beardColor || hair); }
  if (spec.mask) g.r(hx + hdW * 0.4, ey + u, hdW * 0.6 + u, hdH - (ey - hdTop) - u, spec.mask);

  switch (hat) {
    case 'topknot':
      g.r(hx + hdW * 0.35, hdTop - 2 * u, 3 * u, 2 * u, hair);
      g.r(hx + hdW * 0.35, hdTop - u, 3 * u, Math.max(1, u), spec.band || trim);
      break;
    case 'bandana': {
      const bc = spec.band || '#c02828';
      g.r(hx, hdTop + u, hdW, 2 * u, bc);
      g.r(hx - 3 * u, hdTop + 2 * u, 3 * u, Math.max(1, u), bc);
      g.r(hx - 4 * u, hdTop + 3 * u, 2 * u, Math.max(1, u), bc);
      break;
    }
    case 'bamboo': {
      const hc = spec.band || '#c8a860';
      g.r(hx - 3 * u, hdTop, hdW + 6 * u, Math.max(1, u), shade(hc, 0.7));
      g.r(hx - u, hdTop - u, hdW + 2 * u, Math.max(1, u), hc);
      g.r(hx + u, hdTop - 2 * u, hdW - 2 * u, Math.max(1, u), hc);
      g.r(hx + hdW * 0.35, hdTop - 3 * u, 3 * u, Math.max(1, u), shade(hc, 1.2));
      break;
    }
    case 'crown': {
      const gc = spec.band || '#e8c040';
      g.r(hx + hdW * 0.25, hdTop - 3 * u, hdW * 0.5, 3 * u, gc);
      g.px(hx + hdW * 0.25, hdTop - 4 * u, gc);
      g.px(hx + hdW * 0.75 - 1, hdTop - 4 * u, gc);
      g.r(hx + hdW * 0.4, hdTop - 2 * u, 2 * u, u, '#c02030');
      break;
    }
    case 'hood': {
      const hc = spec.band || robe;
      g.r(hx - u, hdTop - u, hdW + u, 3 * u, hc);
      g.r(hx - u, hdTop - u, Math.round(hdW * 0.55), hdH + u, hc);
      g.r(hx - u, hdTop - u, Math.round(hdW * 0.3), hdH + u, shade(hc, 0.7));
      break;
    }
    case 'official': { // 청나라 관모(강시)
      const hc = spec.band || '#202030';
      g.r(hx - u, hdTop - 2 * u, hdW + 2 * u, 3 * u, hc);
      g.r(hx + hdW * 0.3, hdTop - 4 * u, hdW * 0.4, 2 * u, hc);
      g.px(hx + hdW * 0.5, hdTop - 5 * u, '#d02020');
      g.r(hx + hdW - u, ey - u, 2 * u, 4 * u, '#e8d050'); // 부적
      break;
    }
  }

  // 앞팔 + 무기
  g.line(sx, sy, fh[0], fh[1], robe, t);
  g.line(sx, sy, sx, sy, robeL, t);
  if (spec.armsForward) g.line(sx - u, sy - u, fh[0] - u, fh[1] - u, robeD, t);
  const gl = spec.weapon === 'claw' ? '#802020' : sk;
  g.r(fh[0] - (t >> 1), fh[1] - (t >> 1), t + 1, t + 1, gl);
  if (wa !== null && !(pose === 'cast' && spec.weapon !== 'staff' && spec.weapon !== 'spear')) drawWeapon(g, spec.weapon, fh[0], fh[1], wa, S);

  return outline(c);
}

function drawWeapon(g, w, hx, hy, deg, S) {
  if (!w || w === 'none') return;
  const a = deg * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a), u = S / 32;
  const L = Math.round(S * 0.42);
  const at = k => [hx + dx * k, hy + dy * k];
  const steel = '#dfe6f2', steelD = '#8c98b0';
  switch (w) {
    case 'sword': {
      const [ex, ey] = at(L), [bx, by] = at(-3 * u);
      g.line(bx, by, hx, hy, '#6a3a20', Math.max(1, Math.round(u)));
      g.line(...at(1), ex, ey, steel, Math.max(1, Math.round(u)));
      g.line(...at(2).map((v, i) => v + (i ? 1 : 0)), ex, ey + 1, steelD, 1);
      g.line(hx - dy * 2 * u, hy + dx * 2 * u, hx + dy * 2 * u, hy - dx * 2 * u, '#e0b030', 1);
      break;
    }
    case 'saber': {
      const [ex, ey] = at(L);
      g.line(...at(-3 * u), hx, hy, '#5a2a18', Math.max(1, Math.round(u)));
      g.line(...at(1), ex, ey, steel, Math.max(2, Math.round(2 * u)));
      g.line(...at(2), ex, ey, steelD, 1);
      break;
    }
    case 'axe': {
      const [ex, ey] = at(L * 0.85);
      g.line(...at(-2 * u), ex, ey, '#7a4a28', Math.max(1, Math.round(1.5 * u)));
      g.r(ex - 2 * u, ey - 3 * u, 5 * u, 6 * u, steelD);
      g.r(ex - u, ey - 3 * u, 3 * u, 6 * u, steel);
      break;
    }
    case 'staff': case 'spear': {
      const [ex, ey] = at(L * 1.2), [bx, by] = at(-L * 0.5);
      g.line(bx, by, ex, ey, '#8a5a30', Math.max(1, Math.round(u)));
      if (w === 'spear') { g.line(...at(L * 1.2), ...at(L * 1.2 + 4 * u), steel, Math.max(2, Math.round(2 * u))); g.px(...at(L * 1.1), '#d02020'); }
      break;
    }
    case 'fan': {
      g.r(hx - u, hy - 4 * u, 5 * u, 5 * u, '#f0e8d0');
      g.line(hx, hy, hx + 4 * u, hy - 4 * u, '#806040', 1);
      break;
    }
    case 'darts': {
      g.line(hx, hy, ...at(5 * u), steel, 1);
      g.line(hx, hy + 2, ...at(5 * u).map((v, i) => v + (i ? 2 : 0)), steel, 1);
      break;
    }
    case 'claw': {
      for (let i = -1; i <= 1; i++) g.line(hx, hy + i * 2 * u, hx + 4 * u, hy + i * 2 * u - u, steel, 1);
      break;
    }
  }
}

function lieDown(src, S) {
  const c = canvas(S, S), ctx = c.getContext('2d');
  ctx.translate(S, Math.round(S * 0.3));
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return c;
}

// ───────────────────────── 짐승 ─────────────────────────
// spec: size, body, belly, stripe(tiger)|spots, eye
export function drawBeast(spec, pose) {
  if (pose === 'dead') return lieFlat(drawBeast(spec, 'hurt'), spec.size || 32);
  const S = spec.size || 32, c = canvas(S, S), g = painter(c.getContext('2d')), u = S / 32;
  const body = spec.body || '#8a7050', dark = shade(body, 0.65), belly = spec.belly || shade(body, 1.35);
  const gy = S - 2, legH = Math.round(S * 0.2), bh = Math.round(S * 0.24), bwid = Math.round(S * 0.52);
  const bob = pose === 'idle2' ? 1 : 0, push = pose === 'atk' ? Math.round(3 * u) : pose === 'hurt' ? -Math.round(2 * u) : 0;
  const x0 = Math.round(S * 0.14) + push, y0 = gy - legH - bh + 1 + bob;
  // 꼬리
  g.line(x0, y0 + 2, x0 - 4 * u, y0 - 3 * u + (pose === 'atk' ? 2 : 0), dark, Math.max(1, Math.round(2 * u)));
  // 뒷다리(먼쪽)
  const lw = Math.max(2, Math.round(2.5 * u));
  const legs = pose === 'atk' ? [[x0 + 1, -2], [x0 + bwid - 4 * u, 3]] : [[x0 + 2 * u, 0], [x0 + bwid - 5 * u, 0]];
  for (const [lx, o] of legs) g.r(lx + 2 * u + o, y0 + bh - 1, lw, legH + 1 - bob, dark);
  // 몸통
  g.r(x0, y0, bwid, bh, body);
  g.r(x0, y0 + bh - 3 * u, bwid, 3 * u, belly);
  g.r(x0, y0, bwid, Math.max(1, u), shade(body, 1.15));
  if (spec.stripe) for (let i = 2; i < bwid - 2; i += Math.round(4 * u)) g.r(x0 + i, y0, Math.max(1, u), bh * 0.6, spec.stripe);
  if (spec.spots) for (let i = 3; i < bwid - 3; i += Math.round(5 * u)) g.r(x0 + i, y0 + 2 * u + (i % 2), 2 * u, 2 * u, spec.spots);
  // 앞다리(가까운쪽)
  for (const [lx, o] of legs) g.r(lx + o, y0 + bh - 1, lw, legH + 1 - bob, body);
  // 머리
  const hw = Math.round(S * 0.24), hh = Math.round(S * 0.2);
  const hx = x0 + bwid - 3 * u, hy = y0 - Math.round(hh * 0.45) + (pose === 'atk' ? 2 : 0);
  g.r(hx, hy, hw, hh, body);
  g.r(hx + hw - u, hy + hh * 0.4, 4 * u, hh * 0.6, body); // 주둥이
  g.px(hx + hw + 3 * u - 1, hy + hh * 0.4, '#1a1010');
  g.r(hx + u, hy - 3 * u, 3 * u, 3 * u, dark); // 귀
  g.r(hx + hw - 4 * u, hy - 2 * u, 2 * u, 2 * u, dark);
  if (spec.stripe) g.r(hx + 2 * u, hy + u, hw * 0.4, Math.max(1, u), spec.stripe);
  g.r(hx + hw - 3 * u, hy + 2 * u, Math.max(1, u), Math.max(1, u), spec.eye || '#f0e040');
  if (pose === 'atk') { g.r(hx + hw - u, hy + hh - 2 * u, 5 * u, 3 * u, '#5a1010'); g.px(hx + hw + u, hy + hh - u, '#ffffff'); g.px(hx + hw + 3 * u, hy + hh - u, '#ffffff'); }
  return outline(c);
}
function lieFlat(src, S) {
  const c = canvas(S, S), ctx = c.getContext('2d');
  ctx.translate(S, 0); ctx.scale(-1, 1); // 뒤집혀 쓰러진 느낌
  ctx.drawImage(src, 0, Math.round(S * 0.12));
  return c;
}

export function drawSprite(spec, pose) {
  return spec.kind === 'beast' ? drawBeast(spec, pose) : drawHuman(spec, pose);
}
export const POSES = ['idle', 'idle2', 'atk', 'cast', 'hurt', 'dead'];
export function spriteSet(spec) {
  const o = {};
  for (const p of POSES) o[p] = drawSprite(spec, p);
  return o;
}

// ───────────────────────── 아이콘 12×12 ─────────────────────────
const ICONS = {
  sword: ['..........dc', '.........dca', '........dca.', '.......dca..', '......dca...', '.....dca....', '..e.dca.....', '...eca......', '...be.......', '..b..e......', '.b..........', 'b...........'],
  armor: ['..aa....aa..', '.abba..abba.', '.abbaaaabba.', '.aabbbbbbaa.', '.aabeebbbaa.', '..abeebbba..', '..abbbbbba..', '..aeeeeeea..', '..abbbbbba..', '..abbbbbba..', '..aaaaaaaa..', '............'],
  boots: ['...aaaa.....', '...abba.....', '...abba.....', '...abba.....', '...abba.....', '...abbaaa...', '..eabbbbaa..', '..abbbbbbba.', '..abbbbbbbba', '..aaaaaaaaaa', '............', '............'],
  root: ['.....ee.....', '....e..e....', '.....ee.....', '.....aa.....', '....abba....', '....abba....', '...ab.ba....', '...a.bba....', '..a..b.ba...', '.a..b...a...', '....a....a..', '...a........'],
  jade: ['.....dd.....', '.....d......', '....eee.....', '...eaaae....', '..eacaaae...', '..eaaaaae...', '..eaaaaae...', '...eaaae....', '....eee.....', '.....d......', '....ddd.....', '...d.d.d....'],
  spool: ['..eeeeeeee..', '...bbbbbb...', '...aaaaaa...', '...acaaaa...', '...aaaaaa...', '...acaaaa...', '...aaaaaa...', '...aaaaaa.a.', '...bbbbbb..a', '..eeeeeeee.a', '...........a', '..........a.'],
  pill: ['............', '....aaaa....', '...acaaaa...', '..accaaaab..', '..acaaaaab..', '..aaaaaaab..', '..aaaaaaab..', '...aaaaab...', '....bbbb....', '............', '............', '............'],
  gourd: ['.....ee.....', '.....bb.....', '....abba....', '....acaa....', '.....aa.....', '....aaaa....', '...acaaaa...', '..aacaaaab..', '..aaaaaaab..', '..aaaaaaab..', '...aaaaab...', '....bbbb....'],
  bomb: ['.........e..', '........e.e.', '.......b....', '......b.....', '....aaaa....', '...acaaaa...', '..accaaaab..', '..acaaaaab..', '..aaaaaaab..', '..aaaaaaab..', '...aaaaab...', '....bbbb....'],
  book: ['............', '.dddddddddd.', '.daaaaaaaacd', '.dabeeeebacd', '.daaeaaeaacd', '.daaeaaeaacd', '.dabeeeebacd', '.daaaaaaaacd', '.daaaaaaaacd', '.dddddddddcd', '..cccccccccd', '...ddddddddd'],
  orb: ['............', '....dddd....', '...dacaad...', '..dacccaad..', '..daccaaad..', '..daaaaaad..', '..daaaaaad..', '...daaaad...', '....dddd....', '...eeeeee...', '..eeeeeeee..', '............'],
};
// cols: {a,b,c,d,e}
export function drawIcon(name, cols) {
  const rows = ICONS[name] || ICONS.orb, c = canvas(14, 14), ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    ctx.fillStyle = cols[ch] || '#ff00ff';
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }));
  return outline(c);
}
export function iconCols(main, accent = '#e8c040') {
  return { a: main, b: shade(main, 0.6), c: shade(main, 1.45), d: shade(main, 0.4), e: accent };
}

// 지도 노드 배지: 한자 한 글자 + 원
export function drawBadge(glyph, col, size = 14) {
  const c = canvas(size, size), ctx = c.getContext('2d'), g = painter(ctx), r = size / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x + 0.5 - r, y + 0.5 - r);
    if (d < r - 0.5) g.px(x, y, d < r - 2 ? col : shade(col, 0.55));
  }
  pixText(ctx, glyph, r, r - (size <= 14 ? 5 : 6), `${size <= 14 ? 10 : 12}px G9, G11, monospace`, '#fff8e0');
  return outline(c);
}
// 안티앨리어스 없는 도트 텍스트(임시 캔버스에 찍고 알파 문턱 처리)
export function pixText(ctx, text, x, y, font, color, align = 'center') {
  const t = canvas(text.length * 14 + 8, 18), tc = t.getContext('2d');
  tc.font = font; tc.fillStyle = color; tc.textBaseline = 'top';
  const w = Math.ceil(tc.measureText(text).width);
  tc.fillText(text, 2, 2);
  hardAlpha(t);
  const ox = align === 'center' ? Math.round(x - w / 2) - 2 : Math.round(x) - 2;
  ctx.drawImage(t, ox, Math.round(y) - 2);
}
// 텍스트 안티앨리어스 제거 → 도트 느낌 유지
export function hardAlpha(c, th = 110) {
  const ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 3; i < a.length; i += 4) a[i] = a[i] > th ? 255 : 0;
  ctx.putImageData(d, 0, 0);
  return c;
}

// ───────────────────────── VFX 텍스처 ─────────────────────────
export function drawArc(r, thick, col, frac = 0.55) {
  const S = r * 2 + 4, c = canvas(S, S), g = painter(c.getContext('2d'));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - S / 2, dy = y - S / 2, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (a < -Math.PI * frac || a > Math.PI * frac * 0.2) continue;
    const k = (a + Math.PI * frac) / (Math.PI * frac * 1.2); // 0..1 꼬리→머리
    const w = thick * k;
    if (d > r - w && d < r) g.px(x, y, d > r - 1.5 ? '#ffffff' : col);
  }
  return c;
}
export function drawTaiji(R) {
  const S = R * 2 + 2, c = canvas(S, S), g = painter(c.getContext('2d')), o = S / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - o, dy = y + 0.5 - o, d = Math.hypot(dx, dy);
    if (d > R) continue;
    if (d > R - 1) { g.px(x, y, '#20283a'); continue; }
    let white = dx < 0;
    if (Math.hypot(dx, dy + R / 2) < R / 2) white = true;
    if (Math.hypot(dx, dy - R / 2) < R / 2) white = false;
    if (Math.hypot(dx, dy + R / 2) < R / 7) white = false;
    if (Math.hypot(dx, dy - R / 2) < R / 7) white = true;
    g.px(x, y, white ? '#f0f4ff' : '#20283a');
  }
  return c;
}
export function drawManja(n, col) { // 卍
  const S = n * 5 + 2, c = canvas(S, S), g = painter(c.getContext('2d'));
  const pat = ['XXX.X', '..X.X', 'XXXXX', 'X.X..', 'X.XXX'];
  pat.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') g.r(1 + x * n, 1 + y * n, n, n, col); }));
  return outline(c, [120, 60, 0]);
}

// ───────────────────────── 전투 배경 320×240 ─────────────────────────
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function bands(g, cols, y0, y1) { // 디더 그라데이션
  const n = cols.length, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    g.r(0, y0 + i * h, 320, h + 1, cols[i]);
    if (i < n - 1) for (let x = 0; x < 320; x++) { if (x % 2 === 0) g.px(x, y0 + (i + 1) * h - 1, cols[i + 1]); if (x % 4 === 1) g.px(x, y0 + (i + 1) * h - 2, cols[i + 1]); }
  }
}
function ridge(g, R, y, amp, col, snow) {
  const p = [R() * 6, R() * 6, R() * 6];
  for (let x = 0; x < 320; x++) {
    const h = y - amp * (0.5 * Math.sin(x / 37 + p[0]) + 0.3 * Math.sin(x / 13 + p[1]) + 0.2 * Math.sin(x / 5.3 + p[2]) + 0.6);
    g.r(x, h, 1, 240 - h, col);
    if (snow && h < y - amp * 0.75) g.r(x, h, 1, 2 + (x % 3 === 0), snow);
  }
}
function pine(g, x, y, s, col) {
  const d = shade(col, 0.7);
  g.r(x, y - 2, 2, 4, '#4a3020');
  for (let i = 0; i < 3; i++) { const w = (3 - i) * s + 2, yy = y - 4 - i * s * 1.6; g.r(x + 1 - w / 2, yy, w, s * 1.6, col); g.r(x + 1 - w / 2, yy + s * 1.2, w, 1 + s * 0.4, d); }
}

export const BG_THEMES = {
  1: { sky: ['#5aa0e8', '#78b8f0', '#98ccf0', '#bfe0f0'], far: '#7a9ab8', mid: '#4a7a50', ground: '#8a7a50', ground2: '#a08a58', deco: 'pine' },
  2: { sky: ['#e07850', '#f09a60', '#f8bc78', '#f8d898'], far: '#8a6070', mid: '#506a58', ground: '#6a7a60', ground2: '#3a6080', deco: 'river' },
  3: { sky: ['#8ab8a8', '#a8ccb8', '#c0dcc8', '#d8e8d8'], far: '#6a9a88', mid: '#3a6a48', ground: '#4a6a3a', ground2: '#5a7a40', deco: 'bamboo' },
  4: { sky: ['#5a1820', '#8a2a28', '#b84a30', '#d87840'], far: '#4a2a30', mid: '#3a2020', ground: '#5a3a30', ground2: '#6a4436', deco: 'dead' },
  5: { sky: ['#0a0a20', '#141836', '#20284a', '#30365a'], far: '#4a5878', mid: '#2a2038', ground: '#c8d0e0', ground2: '#a8b0c8', deco: 'palace', snow: '#f0f4ff' },
};

export function drawBattleBG(region, seed = 7) {
  const T = BG_THEMES[region], c = canvas(320, 240), g = painter(c.getContext('2d')), R = rng(seed + region * 99);
  bands(g, T.sky, 0, 110);
  if (region === 5) for (let i = 0; i < 70; i++) g.px(R() * 320, R() * 90, R() < 0.3 ? '#ffffff' : '#8890c0');
  if (region === 5) { g.r(250, 18, 14, 14, '#e8e8d0'); g.r(253, 18, 11, 3, '#c8c8b0'); }
  if (region === 4) { g.r(60, 30, 18, 18, '#f0a050'); g.r(63, 27, 12, 24, '#f0a050'); }
  ridge(g, R, 88, 34, T.far, T.snow);
  ridge(g, R, 108, 18, T.mid, null);
  // 바닥
  g.r(0, 108, 320, 132, T.ground);
  for (let y = 108; y < 240; y += 2) for (let x = (y / 2) % 2 ? 1 : 0; x < 320; x += 7 + Math.floor(R() * 9)) g.px(x, y, R() < 0.5 ? T.ground2 : shade(T.ground, 0.85));
  g.r(0, 108, 320, 1, shade(T.ground, 0.7));
  if (T.deco === 'pine') { for (let i = 0; i < 9; i++) pine(g, 10 + i * 36 + R() * 10, 108, 3 + R() * 2, '#2a6a3a'); g.r(0, 150, 320, 18, T.ground2); }
  if (T.deco === 'river') { g.r(0, 110, 320, 16, '#3a6890'); for (let i = 0; i < 60; i++) g.r(R() * 320, 111 + R() * 14, 4 + R() * 6, 1, '#80b0d0'); for (let i = 0; i < 40; i++) { const x = R() * 320; g.r(x, 120 + R() * 10, 1, 8, '#7a8a40'); } }
  if (T.deco === 'bamboo') for (let i = 0; i < 26; i++) { const x = R() * 320, h = 60 + R() * 50; g.r(x, 108 - h, 3, h, i % 2 ? '#5a9a4a' : '#3a7a3a'); for (let y = 108 - h; y < 108; y += 9) g.r(x - 1, y, 5, 1, '#2a5a2a'); g.r(x + 3, 108 - h + 6, 5, 2, '#4a8a3a'); }
  if (T.deco === 'dead') for (let i = 0; i < 7; i++) { const x = 10 + i * 48 + R() * 20; g.line(x, 108, x + 2, 70, '#2a1414', 2); g.line(x + 1, 85, x + 10, 76, '#2a1414', 1); g.line(x + 1, 92, x - 7, 84, '#2a1414', 1); }
  if (T.deco === 'palace') {
    g.r(40, 50, 240, 58, '#2a1a2a'); g.r(30, 44, 260, 8, '#4a1a20'); g.r(24, 40, 272, 4, '#1a1018');
    for (let x = 50; x < 280; x += 30) { g.r(x, 52, 6, 56, '#8a1a1a'); g.r(x - 2, 52, 10, 2, '#c8a040'); }
    for (let x = 64; x < 270; x += 60) { g.r(x, 60, 6, 8, '#e04020'); g.px(x + 2, 62, '#ffd060'); }
    g.r(120, 70, 80, 38, '#120a10'); g.r(150, 56, 20, 10, '#c8a040');
  }
  return c;
}

// ───────────────────────── 중원지도 640×400 ─────────────────────────
// 지역(1~5): 서→동 좌표. 동쪽에서 출발해 서북 천산으로.
export const MAP_W = 640, MAP_H = 400;
export function drawWorldMap(regions) {
  const c = canvas(MAP_W, MAP_H), ctx = c.getContext('2d'), g = painter(ctx), R = rng(2003);
  // 바다(동쪽) + 양피지
  g.r(0, 0, MAP_W, MAP_H, '#d8c290');
  for (let i = 0; i < 9000; i++) g.px(R() * MAP_W, R() * MAP_H, R() < 0.5 ? '#ccb580' : '#e2cea0');
  for (let y = 0; y < MAP_H; y++) {
    const coast = 600 - 30 * Math.sin(y / 40) - 18 * Math.sin(y / 13) - (y > 250 ? (y - 250) * 0.4 : 0);
    g.r(coast, y, MAP_W - coast, 1, '#6a94b0');
    g.r(coast - 1, y, 2, 1, '#4a6a80');
    if (y % 6 === 0) g.r(coast + 10 + (y * 7) % 20, y, 5, 1, '#90b8d0');
  }
  // 사막(서북)
  for (let i = 0; i < 1600; i++) { const x = R() * 260, y = R() * 160; if (x + y < 300) g.px(x, y, '#e8d098'); }
  // 산맥
  const mount = (x, y, s, col = '#8a6a48') => { for (let i = 0; i < s; i++) g.r(x - i, y + i, i * 2 + 1, 1, i < 2 && col === '#7a7a90' ? '#ffffff' : col); g.r(x, y + s - 1, s, 1, shade(col, 0.6)); };
  for (let i = 0; i < 70; i++) { const x = 30 + R() * 260, y = 40 + R() * 320; if (x < 140 || y > 230) mount(x, y, 4 + R() * 4, x < 130 && y < 140 ? '#7a7a90' : '#8a6a48'); }
  for (let i = 0; i < 20; i++) mount(40 + R() * 90, 30 + R() * 80, 6 + R() * 4, '#7a7a90'); // 천산
  // 강: 황하(북), 장강(남)
  const river = (pts, w) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; for (let t = 0; t <= 1; t += 0.01) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * 9 + i) * 3; g.r(x, y, w, w, '#5a86a8'); g.px(x, y, '#80aac8'); } } };
  river([[200, 120], [260, 90], [320, 60], [360, 110], [420, 130], [500, 140], [600, 150]], 2);
  river([[180, 300], [260, 280], [330, 255], [400, 250], [470, 240], [530, 245], [600, 240]], 3);
  // 만리장성
  for (let x = 160; x < 560; x += 3) { const y = 50 + Math.sin(x / 30) * 8 - (x < 300 ? (300 - x) * 0.08 : 0); g.r(x, y, 2, 2, '#7a4a3a'); if (x % 9 === 0) g.r(x, y - 2, 2, 2, '#7a4a3a'); }
  // 테두리
  ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, MAP_W - 6, MAP_H - 6);
  ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1; ctx.strokeRect(7.5, 7.5, MAP_W - 15, MAP_H - 15);
  // 지역명
  for (const r of regions) pixText(ctx, r.place, r.label[0], r.label[1], '12px G11B, G11, monospace', '#6a3a1a');
  pixText(ctx, '東海', 620, 290, '10px G9, monospace', '#2a4a60');
  for (const [t, x, y] of [['萬里長城', 380, 30], ['黃河', 400, 114], ['長江', 430, 256]]) pixText(ctx, t, x, y, '10px G9, monospace', '#6a3a1a');
  return c;
}

// 생성 고지도 위에 지명(테두리 글씨)
export function labelWorldMap(img, regions) {
  const c = canvas(MAP_W, MAP_H), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  for (const r of regions) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) pixText(ctx, r.place, r.label[0] + dx, r.label[1] + dy, '12px G11B, G11, monospace', '#2a1408');
    pixText(ctx, r.place, r.label[0], r.label[1], '12px G11B, G11, monospace', '#ffe8b0');
  }
  return c;
}

// ───────────────────────── 생성 원화 도트(assets/*.png) ─────────────────────────
// tools/genart.py(지피티 생성) → tools/pixelize.py(도트화) 결과를 캔버스로 들고 있는다
export const IMGS = {};
// HD 파일럿: #hd = 2배(assets/hd), #hd15 = 1.5배(assets/hd15), 뒤에 -b면 애니 비율. 1 = 화풍별 폴더(a|b), 0 = 공용. 밀도 c.d = 2 / 1.5
const HDM = (location.search + location.hash).match(/(?:^|[?&#])hd(15)?(-b)?\b/), HDV = HDM && (HDM[2] ? 'b' : 'a'), HDD = HDM && (HDM[1] ? 1.5 : 2);
const HD_ART = { hero_idle_0: 1, hero_idle_1: 1, hero_attack_0: 1, hero_attack_1: 1, hero_attack_2: 1, hero_attack_3: 1, n_sanjeok: 0, bg1: 0 };
export async function loadArt(ids) {
  const sheet = HDV ? null : await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/atlas.png'; }); // 낱장을 묶은 한 장(tools/atlas.py)
  const rest = ids.filter(id => {
    const r = sheet && ATLAS[id]; if (!r) return true;
    const c = canvas(r[2], r[3]); c.getContext('2d').drawImage(sheet, -r[0], -r[1]); IMGS[id] = c; return false;
  });
  return Promise.all(rest.map(id => new Promise(res => {
    const im = new Image(), hd = HDV && id in HD_ART;
    im.onload = () => { const c = canvas(im.width, im.height); c.getContext('2d').drawImage(im, 0, 0); if (hd) c.d = HDD; IMGS[id] = c; res(); };
    im.onerror = () => res(); // 없으면 코드 도트로 대체
    im.src = hd ? `assets/${HDM[1] ? 'hd15' : 'hd'}/${HD_ART[id] ? HDV + '/' : ''}${id}.png` : `assets/${id}.png`;
  })));
}
// 한 장 → 6포즈: 숨쉬기·앞기울기·뒤기울기는 행 단위로 밀어서 만든다(도트 격자 유지)
function shearRows(src, f) {
  const c = canvas(src.width + 6, src.height + 1), x = c.getContext('2d');
  for (let y = 0; y < src.height; y++) { const [dx, dy] = f(y / src.height); x.drawImage(src, 0, y, src.width, 1, 3 + dx, y + dy, src.width, 1); }
  return c;
}
function tinted(src, col, a) {
  const c = canvas(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
export function imageSpriteSet(img, atkCut) { // atkCut: 그려 둔 공격 컷(있으면 앞기울기 대신)
  const top = k => (k < 0.55 ? 1 : 0);
  const dead = canvas(img.height + 2, img.width + 2), dx = dead.getContext('2d');
  dx.translate(dead.width, 0); dx.rotate(Math.PI / 2); dx.drawImage(tinted(img, '#200818', 0.35), 1, 1);
  const f = {
    idle: shearRows(img, () => [0, 0]), idle2: shearRows(img, k => [0, top(k)]),
    atk: atkCut ? shearRows(atkCut, () => [0, 0]) : shearRows(img, k => [Math.round(3 * (1 - k)), 0]),
    cast: tinted(shearRows(img, k => [0, -top(k)]), '#fff4c0', 0.18),
    hurt: shearRows(img, k => [-Math.round(3 * (1 - k)), 0]), dead,
  };
  // 모든 포즈를 같은 상자(바닥·가운데 정렬)에 — 텍스처만 바꿔 끼우므로 크기가 같아야 한다
  const W = Math.max(...Object.values(f).map(c => c.width)), H = Math.max(...Object.values(f).map(c => c.height));
  for (const k in f) { const c = canvas(W, H); c.getContext('2d').drawImage(f[k], (W - f[k].width) >> 1, H - f[k].height); f[k] = c; }
  return f;
}
// 생성 프레임 묶음({idle:[..], attack:[..], cast:[..], hurt:[..]}) → 포즈 세트 + 순서(seq). 쓰러짐만 코드로 눕힌다
export function frameSpriteSet(fr) {
  const h = fr.hurt[fr.hurt.length - 1], dead = canvas(h.height + 2, h.width + 2), dx = dead.getContext('2d');
  dx.translate(dead.width, 0); dx.rotate(Math.PI / 2); dx.drawImage(tinted(h, '#200818', 0.35), 1, 1);
  const all = [...Object.values(fr).flat(), dead];
  const W = Math.max(...all.map(c => c.width)), H = Math.max(...all.map(c => c.height));
  const box = c => { const o = canvas(W, H); o.getContext('2d').drawImage(c, (W - c.width) >> 1, H - c.height); return o; };
  const seq = { atk: fr.attack.map(box), cast: fr.cast.map(box), hurt: fr.hurt.map(box) };
  for (const k in fr) if (!['idle', 'attack', 'cast', 'hurt'].includes(k)) seq[k] = fr[k].map(box); // 절초 전용 동작 등
  return { idle: box(fr.idle[0]), idle2: box(fr.idle[1] || fr.idle[0]), atk: seq.atk[2] || seq.atk[0], cast: seq.cast[0], hurt: seq.hurt[0], dead: box(dead), seq };
}
// 보스: 정지 그림 + 생성 공격 3장(같은 캔버스) → 포즈 세트. 숨쉬기·피격·쓰러짐은 정지 그림에서, 기공은 준비 자세에 빛
export function bossSpriteSet(idle, atk, ult = []) { // ult: 전용 절초 프레임(있으면 seq.ult)
  const top = k => (k < 0.55 ? 1 : 0), still = () => [0, 0];
  const dead = canvas(idle.height + 2, idle.width + 2), dx = dead.getContext('2d');
  dx.translate(dead.width, 0); dx.rotate(Math.PI / 2); dx.drawImage(tinted(idle, '#200818', 0.35), 1, 1);
  const f = { idle: shearRows(idle, still), idle2: shearRows(idle, k => [0, top(k)]), hurt: shearRows(idle, k => [-Math.round(3 * (1 - k)), 0]), cast: tinted(shearRows(atk[0], still), '#fff4c0', 0.22), dead };
  const seq = atk.map(c => shearRows(c, still)), us = ult.map(c => shearRows(c, still)), all = [...Object.values(f), ...seq, ...us];
  const W = Math.max(...all.map(c => c.width)), H = Math.max(...all.map(c => c.height));
  const box = c => { const o = canvas(W, H); o.getContext('2d').drawImage(c, (W - c.width) >> 1, H - c.height); return o; };
  for (const k in f) f[k] = box(f[k]);
  return { ...f, atk: box(seq[1]), seq: { atk: seq.map(box), ...(us.length ? { ult: us.map(box) } : {}) } };
}
// 도포 색 치환: 기준 색상(hue)대의 채도 있는 픽셀을 목표색 명암으로 바꾼다
export function recolorHue(src, h0, h1, target, fixedRef) {
  const c = canvas(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); c.d = src.d; // 밀도는 그대로
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data, [tr, tg, tb] = rgb(target);
  const hit = [];
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 28) continue;
    let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
    h = (h * 60 + 360) % 360;
    if (h >= h0 && h <= h1) hit.push(i, (r * 0.3 + g * 0.59 + b * 0.11) / 255);
  }
  let ref = 0; for (let k = 1; k < hit.length; k += 2) ref += hit[k]; ref = fixedRef || ref / (hit.length / 2) || 0.5;
  c.ref = ref;
  for (let k = 0; k < hit.length; k += 2) {
    const i = hit[k], f = hit[k + 1] / ref;
    const m = v => Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1) * 0.8)));
    a[i] = m(tr); a[i + 1] = m(tg); a[i + 2] = m(tb);
  }
  x.putImageData(d, 0, 0);
  return c;
}
// 얼굴 자르기(순서 바 16px · 컷인 큰 초상): 사람은 피부색 픽셀이 처음 나오는 줄 = 얼굴, 짐승은 오른쪽(머리) 위
export function imagePortrait(img, beast, n = 16, at = null) { // at: [얼굴 가운데 x, 위 y] 직접 지정
  const { width: w, height: h } = img, a = img.getContext('2d').getImageData(0, 0, w, h).data;
  const skin = i => { const r = a[i], g = a[i + 1], b = a[i + 2]; return a[i + 3] && r > 120 && r > g && g > b && r - b > 18 && r - b < 115 && b > 55 && r - g < 80; }; // 금빛·주황 옷은 제외
  let cx = w / 2, sy = 0, found = false;
  if (!beast) for (let y = 0; y < h * 0.6 && !found; y++) {
    let n0 = 0, sx = 0;
    for (let x = 0; x < w; x++) if (skin((y * w + x) * 4)) { n0++; sx += x; }
    if (n0 >= 3) { found = true; cx = sx / n0; sy = Math.max(0, y - Math.round(n * 0.3)); }
  }
  if (!beast && !found) { // 피부가 안 보이면(가면·복면) 가운데 절반에서 가장 위 불투명 줄
    outer: for (let y = 0; y < h; y++) for (let x = w >> 2; x < w - (w >> 2); x++) if (a[(y * w + x) * 4 + 3]) { cx = x; sy = Math.max(0, y - 1); break outer; }
  }
  if (beast) { cx = w - n / 2 - 1; sy = Math.round(h * 0.1); }
  if (at) { cx = at[0]; sy = Math.max(0, Math.round(at[1] - (n - 40) / 2)); }
  const c = canvas(n, n);
  c.getContext('2d').drawImage(img, Math.round(cx - n / 2), sy, n, n, 0, 0, n, n);
  return c;
}
