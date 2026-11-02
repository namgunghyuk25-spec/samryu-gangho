// meridian.js — 경맥도: 좌선한 몸(생성 원화 body_chart) 위로 소주천을 따라 기가 돈다
// 소주천 = 단전 → 명문 → 대추 → 백회 → 인당 → 전중 → 단전. 혈 7곳이 주천 게이지(p)의 칸이다.
import { canvas, IMGS } from './pixel.js';

export const SCHOOL_QI = { none: '#a8d0ff', sorim: '#ffd040', mudang: '#d8f0ff', hwasan: '#ff90c8', dang: '#70ff70', gaebang: '#f0a848', magyo: '#ff3048', emei: '#e0b0ff', cheongseong: '#70f0a8', jongnam: '#a8b8f0', gonryun: '#c8f8ff', gongdong: '#f8c878' };
export const NODE_NAMES = ['단전', '명문', '대추', '백회', '인당', '전중'];
const W = 56, H = 64;

export class Meridian {
  constructor(el) {
    this.el = el; this.c = el.getContext('2d'); this.t = 0; this.streams = []; this.flashes = [];
    const body = IMGS.body_chart;
    let x0 = 4, y0 = 2, w = 48, h = 60;
    if (body) { // 몸 그림의 실제 윤곽에서 혈 위치를 잡는다
      const a = body.getContext('2d').getImageData(0, 0, body.width, body.height).data;
      let mnx = 1e9, mxx = -1, mny = 1e9, mxy = -1;
      for (let y = 0; y < body.height; y++) for (let x = 0; x < body.width; x++) if (a[(y * body.width + x) * 4 + 3]) { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); }
      this.ox = Math.round((W - body.width) / 2); this.oy = H - body.height;
      x0 = mnx + this.ox; y0 = mny + this.oy; w = mxx - mnx + 1; h = mxy - mny + 1;
    }
    const cx = x0 + w / 2;
    // 혈 7곳(단전은 시작과 끝) + 팔(무공이 뻗어 나가는 곳)
    this.nodes = [[cx, y0 + 0.60 * h], [cx - 0.15 * w, y0 + 0.60 * h], [cx - 0.09 * w, y0 + 0.27 * h], [cx, y0 + 0.04 * h], [cx + 0.05 * w, y0 + 0.13 * h], [cx + 0.07 * w, y0 + 0.40 * h]];
    this.hand = [cx + 0.30 * w, y0 + 0.50 * h];
    // 닫힌 고리를 부드럽게(카트멀-롬) 샘플링
    const P = this.nodes, n = P.length, pts = [], nodeAt = [];
    for (let i = 0; i < n; i++) {
      nodeAt.push(pts.length);
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let s = 0; s < 1; s += 1 / 24) {
        const t = s, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    this.pts = pts; this.nodeAt = nodeAt.map(i => i / pts.length); // 혈의 고리 위 위치(0..1)
  }
  at(u) { const p = this.pts, f = ((u % 1) + 1) % 1 * p.length, i = Math.floor(f); return p[i]; }
  stream(col) { this.streams.push({ t: 0, col }); }                 // 단전 → 팔로 기가 치고 나간다
  flash(node, col) { this.flashes.push({ node, col, t: 0 }); }
  // st: {p 주천 칸(0..7), stacks 소주천 수(0..3), ready 대주천, qi 0..1, col 문파색, pulse 미니게임 기의 위치(0..1|null), targets [{u, hit}]}
  draw(real, st) {
    const c = this.c; this.t += real;
    c.clearRect(0, 0, W, H);
    if (IMGS.body_chart) { c.globalAlpha = 0.9; c.drawImage(IMGS.body_chart, this.ox, this.oy); c.globalAlpha = 1; }
    const done = st.p / 6, col = st.ready ? '#ffe060' : st.col;
    // 경로: 점선(안 열린 곳) / 문파색(열린 곳)
    this.pts.forEach(([x, y], i) => {
      const u = i / this.pts.length;
      if (u <= done) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
      else if (i % 3 === 0) { c.fillStyle = '#5a6aa0'; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
    });
    // 흐르는 기: 내력이 많을수록 빠르고 많다
    const speed = 0.00025 + 0.0006 * st.qi, k = 2 + Math.round(st.qi * 3) + (st.ready ? 3 : 0);
    for (let j = 0; j < k; j++) {
      const [x, y] = this.at(this.t * speed + j / k);
      c.fillStyle = j % 2 ? '#ffffff' : col; c.fillRect(Math.round(x), Math.round(y), 1, 1);
      const [x2, y2] = this.at(this.t * speed + j / k - 0.012); c.globalAlpha = 0.5; c.fillRect(Math.round(x2), Math.round(y2), 1, 1); c.globalAlpha = 1;
    }
    // 혈자리
    this.nodes.forEach(([x, y], i) => {
      const open = i < st.p || st.ready;
      c.fillStyle = open ? '#ffffff' : '#283058'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      if (open) { c.fillStyle = col; c.fillRect(Math.round(x) - 1, Math.round(y) + 1, 2, 1); }
    });
    // 미니게임: 표적 혈 + 도는 기
    for (const tg of st.targets || []) {
      const [x, y] = this.at(tg.u), blink = Math.floor(this.t / 90) % 2;
      c.fillStyle = tg.hit === true ? '#80ff80' : tg.hit === false ? '#ff4040' : blink ? '#ffe060' : '#ff9020';
      c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    }
    if (st.pulse != null) {
      for (let j = 0; j < 6; j++) { const [x, y] = this.at(st.pulse - j * 0.008); c.fillStyle = j ? col : '#ffffff'; c.globalAlpha = 1 - j * 0.15; c.fillRect(Math.round(x) - (j ? 0 : 1), Math.round(y) - (j ? 0 : 1), j ? 1 : 3, j ? 1 : 3); }
      c.globalAlpha = 1;
    }
    // 단전 구슬: 내력만큼 크고 맥박친다
    const [dx, dy] = this.nodes[0], r = 1 + st.qi * 2.6 + (Math.sin(this.t / 160) > 0 ? 0.6 : 0);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y); if (d <= r) { c.fillStyle = d < r - 1.2 ? '#ffffff' : col; c.fillRect(Math.round(dx + x), Math.round(dy + y), 1, 1); } }
    // 무공: 단전 → 팔 기류
    for (const s of this.streams) {
      s.t += real;
      const k2 = Math.min(1, s.t / 260), [hx, hy] = this.hand;
      for (let j = 0; j < 8; j++) { const q = Math.max(0, k2 - j * 0.06); c.fillStyle = j ? s.col : '#ffffff'; c.fillRect(Math.round(dx + (hx - dx) * q), Math.round(dy + (hy - dy) * q - Math.sin(q * Math.PI) * 6), 1 + (j === 0), 1 + (j === 0)); }
      if (k2 >= 1) { c.fillStyle = s.col; for (let j = 0; j < 6; j++) c.fillRect(Math.round(hx + Math.cos(j + s.t / 50) * 3), Math.round(hy + Math.sin(j + s.t / 50) * 3), 1, 1); }
    }
    this.streams = this.streams.filter(s => s.t < 420);
    for (const f of this.flashes) { f.t += real; const [x, y] = this.nodes[f.node % 6]; if (Math.floor(f.t / 70) % 2 === 0) { c.fillStyle = f.col; c.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); } }
    this.flashes = this.flashes.filter(f => f.t < 500);
    // 소주천 수(◆) · 대주천
    for (let i = 0; i < 3; i++) { c.fillStyle = i < st.stacks || st.ready ? (st.ready ? '#ffe060' : col) : '#283058'; c.fillRect(2 + i * 5, 2, 3, 3); c.fillRect(3 + i * 5, 1, 1, 5); c.fillRect(1 + i * 5, 3, 5, 1); }
    if (st.ready && Math.floor(this.t / 120) % 2) { c.strokeStyle = '#ffe060'; c.strokeRect(0.5, 0.5, W - 1, H - 1); }
  }
}
export const newCanvas = () => canvas(W, H);
