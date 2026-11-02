// engine.js — three.js 320×240 렌더, 트윈/히트스톱, 도트 파티클, 화면흔들림, DOM UI 헬퍼, 효과음
import * as THREE from 'three';
export { THREE };

export const W = 320, H = 240;
const HDM = (location.search + location.hash).match(/(?:^|[?&#])hd(15)?\b/); // HD 파일럿: 주소 끝이 #hd(2배)·#hd15(1.5배), 뒤에 -b면 애니 비율
export const HD = HDM ? (HDM[1] ? 1.5 : 2) : 1; // 캔버스 밀도 — 좌표는 그대로, HD 그림(c.d = HD)은 밀도로 나눈 크기로 놓여 1:1
export const $ = (s, el = document) => el.querySelector(s);
export const ui = $('#ui');

export const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: false, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(W * HD, H * HD, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // 캔버스 색을 그대로 통과
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
export const camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);
camera.position.set(0, 0, 10);
export const cam = { x: 0, y: 0 }; // 흔들림 전 기준 위치

// 보는 범위: 세로 전투는 무대를 당겨 본다(view.por = [x, y, 배율]). 카메라와 월드 좌표에 붙는 DOM(.tags·데미지 숫자·조준 커서)이 같이 따른다
export const view = { x: 0, y: 0, z: 1, por: null };
export const toStage = (x, y) => [(x - view.x) * view.z, (view.y + H / view.z - y) * view.z]; // 월드(y 위) → 무대 화면 좌표
// 타격 확대: 무대 위 한 점(x, y)을 화면에 붙박아 두고 k배 당겨 본다(camZoom)
const zoom = { k: 1, x: 0, y: 0, peak: 1, t: 0, hold: 0, out: 0 };
export const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches; // 기기에서 '움직임 줄이기'를 켰으면 흔들림·번쩍임·확대를 약하게
// 무대 키: 세로 화면의 타이틀·지도는 tallStage(true)로 무대를 #root 키 전체(320×RH)로 늘린다
export let SH = H;
let tall = false;
export function tallStage(on) { tall = on; fit(); }
function applyView() {
  const [bx, by, bz] = view.por && $('#root').classList.contains('por') ? view.por : [0, 0, 1], k = zoom.k;
  const x = zoom.x - (zoom.x - bx) / k, y = zoom.y - (zoom.y - by) / k, z = bz * k;
  Object.assign(view, { x, y, z });
  camera.left = x; camera.right = x + W / z; camera.bottom = y; camera.top = y + SH / z; camera.updateProjectionMatrix();
  $('#root').style.setProperty('--view', z === 1 ? 'none' : `translate(${-x * z}px, ${-(H - y - H / z) * z}px) scale(${z})`);
}
export function portraitView(v) { view.por = v; applyView(); }
// 화면 정수배 확대. 세로 화면(키가 폭의 1.1배 이상)이면 폭에 맞추고 남는 키를 #root에 더한다 — 320×240 무대(#stage)는 그 안에, 카드 전투면 손패가 아래로
function fit() {
  const root = $('#root'), por = !!$('#stage') && innerHeight >= innerWidth * 1.1;
  const s = por ? innerWidth / W : Math.max(1, Math.min(innerWidth / W, innerHeight / H));
  const k = s >= 2 ? Math.floor(s) : s, RH = por ? Math.min(720, Math.floor(innerHeight / k)) : H;
  root.classList.toggle('por', por); root.style.height = RH + 'px';
  root.classList.toggle('pf', por && RH - H >= 250); root.classList.toggle('pc', por && RH - H < 250); // 아래칸이 넉넉하면 크게, 모자라면 가로 배치의 아래 띠를 그대로 내린다
  const dock = Math.min(RH - H, 290); // 전투 아래칸(설명·주천판·손패·단추) 높이 — 무대+아래칸을 세로 가운데에
  root.style.setProperty('--sy', Math.round((RH - H) / 2) + 'px'); root.style.setProperty('--dock', dock + 'px'); root.style.setProperty('--sb', Math.round((RH - H - dock) / 2) + 'px');
  root.style.transform = `translate(${Math.round((innerWidth - W * k) / 2)}px, ${Math.round((innerHeight - RH * k) / 2)}px) scale(${k})`;
  root.dataset.k = k;
  SH = por && tall ? RH : H; root.classList.toggle('tall', SH > H); renderer.setSize(W * HD, SH * HD, false);
  applyView();
}
addEventListener('resize', fit); fit();
export function toGame(e) { // 마우스 → 320×240 화면 좌표
  const r = $('#gl').getBoundingClientRect(), k = r.width / W;
  return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
}

export function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}
const VS = 'uniform vec2 off; varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(off, 0.0), 1.0); }'; // off: 맞은 몸 떨림(트윈이 쓰는 position과 따로)
const FS = `uniform sampler2D map; uniform float flash; uniform float opacity; uniform vec3 tint; varying vec2 vUv;
void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.5) discard; gl_FragColor = vec4(mix(c.rgb * tint, vec3(1.0), flash), opacity); }`;
export function spriteMat(t) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: t }, flash: { value: 0 }, opacity: { value: 1 }, tint: { value: new THREE.Color(1, 1, 1) }, off: { value: new THREE.Vector2() } },
    vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });
}
// 바닥 기준(anchor bottom) 스프라이트 쿼드
export function quad(canvasOrTex, { anchor = 'bottom', parent = scene } = {}) {
  const t = canvasOrTex.isTexture ? canvasOrTex : tex(canvasOrTex);
  const d = t.image.d || 1, w = t.image.width / d, h = t.image.height / d; // d: 그림 밀도(HD = 2)
  const geo = new THREE.PlaneGeometry(w, h);
  if (anchor === 'bottom') geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, spriteMat(t));
  parent.add(m);
  return m;
}
export function dispose(m) {
  m.parent && m.parent.remove(m);
  m.geometry.dispose(); m.material.dispose();
}

// ───────── 시간: 배속 + 히트스톱 ─────────
export const clock = { scale: 1, hitstop: 0 };
const tweens = [];
export const ease = { lin: k => k, out: k => 1 - (1 - k) * (1 - k), in: k => k * k, back: k => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2) };
export function tween(obj, to, ms, e = ease.out) {
  return new Promise(res => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    tweens.push({ obj, from, to, dur: Math.max(1, ms), t: 0, e, res });
  });
}
export const wait = ms => new Promise(res => tweens.push({ obj: null, dur: Math.max(1, ms), t: 0, res }));
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i];
    w.t += dt;
    const k = Math.min(1, w.t / w.dur);
    if (w.obj) for (const key in w.to) w.obj[key] = w.from[key] + (w.to[key] - w.from[key]) * w.e(k);
    if (k >= 1) { tweens.splice(i, 1); w.res(); }
  }
}
export function hitstop(ms) { clock.hitstop = Math.max(clock.hitstop, ms); }
let slow = null; // 슬로모: 배속(clock.scale)에 곱한다. 실제 시간으로 ms 동안 k배, 끝 40%는 1로 풀린다
export function slowmo(k, ms) { slow = { k, t: 0, ms }; }

// ───────── 카메라: 흔들림 · 맞은 방향 밀림 · 확대 ─────────
let shakeAmt = 0, shakeT = 0, kick = null;
export function shake(a, ms = 200) { if (CALM) a *= 0.3; shakeAmt = Math.max(shakeAmt, a); shakeT = Math.max(shakeT, ms); }
export function camKick(dx, a, ms = 200) { if (CALM) a *= 0.3; if (!kick || a >= kick.a * (1 - kick.t / kick.ms)) kick = { dx, a, t: 0, ms }; } // 화면이 맞은 방향(dx ±1)으로 튀었다가 출렁이며 돌아온다
export function camZoom(x, y, k, hold = 80, out = 240) { if (CALM || (zoom.peak > 1 && k <= zoom.peak)) return; Object.assign(zoom, { x, y, peak: k, t: 0, hold, out }); }
function stepZoom(real) {
  if (zoom.peak <= 1) return;
  const IN = 50, t = (zoom.t += real), p = (t - IN - zoom.hold) / zoom.out;
  zoom.k = p >= 1 ? 1 : 1 + (zoom.peak - 1) * (t < IN ? t / IN : p < 0 ? 1 : 1 - ease.out(p));
  if (p >= 1) zoom.peak = 1;
  applyView();
}
export function impactFrame(ms = 50) { if (CALM) return; const g = $('#gl'); g.classList.add('impact'); clearTimeout(impactFrame.t); impactFrame.t = setTimeout(() => g.classList.remove('impact'), ms); } // 흑백 반전 한두 프레임

// ───────── 도트 파티클 (Points, 정사각 픽셀) ─────────
const MAXP = 4000;
const pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3), pSize = new Float32Array(MAXP), pA = new Float32Array(MAXP);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));
pGeo.setAttribute('alpha', new THREE.BufferAttribute(pA, 1));
const pMat = new THREE.ShaderMaterial({
  vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; void main(){ vC = color; vA = alpha; gl_PointSize = size * ${HD.toFixed(1)}; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: 'varying vec3 vC; varying float vA; void main(){ if (vA <= 0.02) discard; gl_FragColor = vec4(vC, vA); }',
  transparent: true, depthTest: false, depthWrite: false,
});
export const particles = new THREE.Points(pGeo, pMat);
particles.frustumCulled = false;
particles.renderOrder = 5000;
scene.add(particles);
const P = [];
const colCache = {};
const toRGB = c => colCache[c] || (colCache[c] = new THREE.Color(c).toArray());
// o: x y vx vy ax ay life size col drag shrink fade
export function spawn(o) {
  if (P.length >= MAXP) return;
  P.push({ x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, ay: o.ay || 0, ax: o.ax || 0, life: o.life || 400, t: 0, size: o.size || 2, col: toRGB(o.col || '#ffffff'), drag: o.drag ?? 0.0, shrink: o.shrink || 0, fade: o.fade ?? true, delay: o.delay || 0 });
}
export const R = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// 방사형 폭발
export function burst(x, y, { n = 12, cols = ['#ffffff'], spd = [40, 140], life = [200, 450], size = [1, 3], grav = 0, ang = [0, Math.PI * 2], drag = 2, up = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = R(ang[0], ang[1]), s = R(spd[0], spd[1]);
    spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + up, ay: grav, life: R(life[0], life[1]), size: Math.round(R(size[0], size[1])), col: pick(cols), drag });
  }
}
export function ring(x, y, r, cols, n = 24, spd = 80) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; spawn({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.5, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd * 0.5, life: 300, size: 2, col: pick(cols), drag: 3 }); }
}
function stepParticles(dt) {
  const s = dt / 1000;
  let n = 0;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.t += dt;
    if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    p.vx += p.ax * s; p.vy += p.ay * s;
    const d = Math.max(0, 1 - p.drag * s);
    p.vx *= d; p.vy *= d;
    p.x += p.vx * s; p.y += p.vy * s;
  }
  for (const p of P) {
    if (p.delay > 0) continue;
    const k = p.t / p.life;
    pPos[n * 3] = Math.round(p.x); pPos[n * 3 + 1] = Math.round(p.y); pPos[n * 3 + 2] = 0;
    pCol[n * 3] = p.col[0]; pCol[n * 3 + 1] = p.col[1]; pCol[n * 3 + 2] = p.col[2];
    pSize[n] = Math.max(1, Math.round(p.size * (p.shrink ? 1 - k * p.shrink : 1)));
    pA[n] = p.fade ? (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4) : 1;
    n++;
  }
  pGeo.setDrawRange(0, n);
  for (const a of ['position', 'color', 'size', 'alpha']) pGeo.attributes[a].needsUpdate = true;
}
export function clearParticles() { P.length = 0; }

// ───────── 메인 루프 ─────────
const hooks = new Set();
export const onFrame = f => (hooks.add(f), () => hooks.delete(f));
let last = performance.now();
function loop(now) {
  const real = Math.min(50, now - last); last = now;
  let sk = 1;
  if (slow) { slow.t += real; const p = slow.t / slow.ms; if (p >= 1) slow = null; else sk = p < 0.6 ? slow.k : slow.k + (1 - slow.k) * (p - 0.6) / 0.4; }
  let dt = real * clock.scale * sk;
  const stop = clock.hitstop > 0;
  if (stop) { clock.hitstop -= real; dt = 0; }
  stepTweens(dt);
  stepParticles(stop ? real * clock.scale * sk : dt); // 멈춤 중에도 불꽃은 튄다
  for (const f of hooks) f(dt, real);
  stepZoom(real);
  let ox = 0, oy = 0;
  if (shakeT > 0) { shakeT -= real; const a = shakeAmt * Math.min(1, shakeT / 120); ox = R(-a, a); oy = R(-a, a); if (shakeT <= 0) shakeAmt = 0; }
  if (kick) { kick.t += real; const k = kick.t / kick.ms; if (k >= 1) kick = null; else ox -= kick.dx * kick.a * (1 - k) * (1 - k) * Math.cos(k * Math.PI * 3); }
  camera.position.x = cam.x + Math.round(ox); camera.position.y = cam.y + Math.round(oy);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ───────── DOM UI ─────────
export function el(tag, cls, html, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function win(x, y, w, h, parent = ui, cls = '') {
  const e = el('div', 'win ' + cls, null, parent);
  Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  return e;
}
export function popText(x, y, text, cls = '') { // 게임 월드 좌표(y 위)
  const e = el('div', 'pop ' + cls, text, $('#fx'));
  const [sx, sy] = toStage(x, y); e.style.left = Math.round(sx) + 'px'; e.style.top = Math.round(sy) + 'px';
  setTimeout(() => e.remove(), 900);
}
// 화면 블록 와이프(대각선 순서로 덮었다 걷기) — RM2003 전투 전환
export function wipe(on = true, ms = 340) {
  return new Promise(res => {
    let w = $('#wipe');
    if (!w) { w = el('div', 'wipe', null, $('#fx')); w.id = 'wipe'; for (let i = 0; i < 80; i++) el('i', null, null, w); }
    [...w.children].forEach((c, i) => (c.style.transitionDelay = Math.round(((i % 10) + ((i / 10) | 0)) * ms / 17) + 'ms'));
    requestAnimationFrame(() => w.classList.toggle('on', on));
    setTimeout(res, ms + 140);
  });
}
export function flashScreen(color = '#fff', ms = 120, op = 0.8) {
  const e = el('div', 'flash', null, $('#fx'));
  e.style.background = color; e.style.opacity = CALM ? op * 0.3 : op;
  e.style.transition = `opacity ${ms}ms linear`;
  requestAnimationFrame(() => requestAnimationFrame(() => (e.style.opacity = 0)));
  setTimeout(() => e.remove(), ms + 50);
}

// 키 입력: 스택 위에서부터, true를 돌려준 핸들러에서 멈춘다
const keyStack = [];
export function pushKeys(fn) { keyStack.push(fn); return () => { const i = keyStack.lastIndexOf(fn); if (i >= 0) keyStack.splice(i, 1); }; }
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', X: 'cancel', Escape: 'cancel', i: 'inv', I: 'inv', Tab: 'speed', m: 'mute', M: 'mute' };
addEventListener('keydown', e => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (k === 'mute') { setMuted(!muted); return; }
  for (let i = keyStack.length - 1; i >= 0; i--) if (keyStack[i](k)) break;
});

// 리스트 메뉴: items [{html, disabled, data}] → onPick(item, i)
// modal: 처리 못한 키도 아래로 안 넘김(배속 Tab 제외)
// 터치 기기(호버 없음): preview 메뉴는 첫 탭 = 선택(설명 보기), 같은 항목 다시 탭 = 결정
// 터치: S펜 갤럭시(폴드 등)는 '올릴 수 있음'으로 보고해 hover만으론 못 잡는다 → 터치 화면인지(TOUCH: 받기 단추 등)와 방금 입력이 손가락·펜이었는지(touchy)를 따로
export const TOUCH = matchMedia('(hover: none)').matches || matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
let lastPtr = TOUCH ? 'touch' : 'mouse';
addEventListener('pointerdown', e => (lastPtr = e.pointerType), true);
export const touchy = () => lastPtr !== 'mouse';
export function listMenu(container, items, { onPick, onCancel, onFocus, start = 0, cols = 1, modal = true, preview = false, tapOnly = false } = {}) { // tapOnly: 손가락으론 고르기만, 받기는 pick()(받기 단추)으로
  container.innerHTML = '';
  let idx = Math.min(start, items.length - 1), armed = -1; // armed: 터치로 한 번 짚은 항목(처음 커서·마우스 올림은 짚은 게 아니다)
  const rows = items.map((it, i) => {
    const r = el('div', 'opt' + (it.disabled ? ' dis' : ''), it.html, container);
    r.onmouseenter = () => { if (!touchy()) focus(i); };
    r.onclick = e => { e.stopPropagation(); if (touchy() && (tapOnly || (preview && armed !== i))) { armed = i; focus(i); sfx('move'); return; } focus(i); pick(); };
    return r;
  });
  function focus(i) {
    if (!items.length) return;
    idx = (i + items.length) % items.length;
    rows.forEach((r, j) => r.classList.toggle('sel', j === idx));
    rows[idx].scrollIntoView({ block: 'nearest' });
    onFocus && onFocus(items[idx], idx);
  }
  function pick() {
    const it = items[idx];
    if (!it || it.disabled) { sfx('buzz'); return; }
    sfx('ok');
    onPick && onPick(it, idx);
  }
  const off = pushKeys(k => {
    if (k === 'up') { focus(idx - cols); sfx('move'); }
    else if (k === 'down') { focus(idx + cols); sfx('move'); }
    else if (k === 'left' && cols > 1) { focus(idx - 1); sfx('move'); }
    else if (k === 'right' && cols > 1) { focus(idx + 1); sfx('move'); }
    else if (k === 'ok') pick();
    else if (k === 'cancel' && onCancel) { sfx('cancel'); onCancel(); }
    else return modal && k !== 'speed';
    return true;
  });
  focus(idx);
  return { close() { off(); container.innerHTML = ''; }, off, focus, pick, get idx() { return idx; } };
}

// ───────── 효과음 (WebAudio 합성) ─────────
// 모든 효과음은 압축기를 지나 나간다(겹쳐도 깨지지 않게). 큰 소리만 전각 울림(리버브)을 조금 더한다
let ac = null, noiseBuf = null, out = null, verb = null, shaper = null, lim = null;
export let muted = false;
export const setMuted = m => (muted = m);
function A() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.14;
    lim = ac.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1; lim.connect(ac.destination); // 효과음과 음악이 겹쳐도 넘치지 않게
    out = ac.createGain(); out.gain.value = 1; out.connect(comp); comp.connect(lim);
    const n = ac.sampleRate * 0.8, ir = ac.createBuffer(2, n, ac.sampleRate); // 전각 울림: 짧게 사라지는 잡음
    for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { lp += (Math.random() * 2 - 1 - lp) * 0.35; x[i] = lp * Math.pow(1 - i / n, 3); } }
    verb = ac.createConvolver(); verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.9; verb.connect(vg); vg.connect(comp);
    shaper = ac.createWaveShaper(); const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const v = i / 512 - 1; cv[i] = Math.tanh(v * 5); } shaper.curve = cv; const sg = ac.createGain(); sg.gain.value = 0.7; shaper.connect(sg); sg.connect(out);
  }
  return ac;
}
export { A as audioCtx };
export const limiter = () => (A(), lim);
function tone(type, f0, f1, dur, vol = 0.15, t0 = 0, send = 0) {
  const a = A(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out); if (send) { const w = a.createGain(); w.gain.value = send; g.connect(w).connect(verb); } o.start(t); o.stop(t + dur);
}
function noise(dur, vol = 0.2, f = 2000, t0 = 0, q = 1, type = 'bandpass', o2 = {}) { // o2: f1 필터 쓸기 · send 울림 · drive 거칠게
  const a = A(), s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0;
  s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (o2.f1) fl.frequency.exponentialRampToValueAtTime(o2.f1, t + dur);
  if (o2.bell) { g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * o2.bell); } else g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(fl).connect(g).connect(o2.drive ? shaper : out); if (o2.send) { const w = a.createGain(); w.gain.value = o2.send; g.connect(w).connect(verb); }
  s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.01);
}
const ringOf = (fs, dur, v, t0 = 0, send = 0) => fs.forEach((f, i) => tone('sine', f, f * 0.985, dur / (1 + i * 0.35), v / (1 + i * 0.5), t0, send)); // 쇠·종: 어긋난 배음
const crack = (v, t0 = 0, f = 3200) => { noise(0.006, v, f, t0, 0.7, 'highpass'); noise(0.04, v * 0.55, 1900, t0, 0.8); };
const BLADE = new Set(['slash', 'slashB', 'petal', 'wind', 'windP', 'none']), FLESH = new Set(['claw', 'bite', 'blood', 'poison']), BLUNT = new Set(['palm', 'staff', 'gold', 'taiji', 'roar', 'dragon', 'wave']);
// 타격음: tier 0 일반 · 1 강공 · 2 치명 · 3 결정타. 칼은 쇠소리, 주먹·봉은 묵직하게, 할큄·피는 축축하게. hero: 주인공이 맞으면 더 둔탁하고 낮게
export function hitSfx(tier = 0, vfx = 'slash', hero = false) {
  if (muted) return;
  try {
    A(); const L = [0.6, 0.85, 1.1, 1.35][tier] || 0.6, kind = FLESH.has(vfx) ? 'flesh' : BLUNT.has(vfx) ? 'blunt' : BLADE.has(vfx) ? 'blade' : 'blunt', low = hero ? 0.78 : 1;
    crack(0.5 * L, 0, hero ? 1800 : 3200);
    tone('sine', (kind === 'blunt' ? 170 : 210) * low, (kind === 'blunt' ? 44 : 58) * low, 0.12 + tier * 0.06, 0.62 * L, 0, tier >= 2 ? 0.25 : 0); // 몸통 울림
    noise(0.07 + tier * 0.035, 0.42 * L, (kind === 'blunt' ? 720 : 1500) * low, 0.002, 0.9, 'bandpass', { drive: true }); // 거친 충돌
    if (kind === 'blade') { ringOf([2380, 3560, 5310], 0.1 + tier * 0.05, 0.075 * L, 0, tier >= 2 ? 0.35 : 0); noise(0.1, 0.12 * L, 5200, 0.01, 1.2, 'bandpass', { f1: 2200 }); }
    if (kind === 'flesh') { noise(0.13 + tier * 0.03, 0.26 * L, 950, 0.008, 3, 'bandpass', { f1: 320 }); tone('triangle', 240, 90, 0.09, 0.14 * L, 0.01); }
    if (kind === 'blunt') tone('triangle', 120 * low, 52 * low, 0.16 + tier * 0.05, 0.28 * L, 0.004);
    if (hero) { tone('sine', 92, 40, 0.16, 0.34 * L, 0.05); noise(0.09, 0.14 * L, 420, 0.03, 1, 'lowpass'); } // 묵직한 둘째 울림
    if (tier >= 2) noise(0.28 + (tier - 2) * 0.3, 0.2 * L, 520, 0.02, 0.7, 'lowpass', { send: 0.5 }); // 여운
    if (tier === 3) { tone('sine', 96, 26, 0.85, 0.75, 0.01, 0.6); noise(0.55, 0.4, 340, 0.02, 0.6, 'lowpass', { drive: true, send: 0.5 }); ringOf([1180, 1770, 2660], 0.5, 0.05, 0.01, 0.6); }
  } catch (e) { /* 오디오 미허용 */ }
}
export function sfx(k) {
  if (muted) return;
  try {
    A();
    switch (k) {
      case 'move': tone('square', 880, 880, 0.03, 0.04); break;
      case 'ok': tone('square', 660, 990, 0.06, 0.06); break;
      case 'cancel': tone('square', 500, 300, 0.07, 0.06); break;
      case 'buzz': tone('square', 120, 100, 0.12, 0.08); break;
      case 'hit': hitSfx(0, 'none'); break;
      case 'crit': hitSfx(2, 'none'); break;
      case 'slash': noise(0.13, 0.6, 1300, 0, 1.6, 'bandpass', { f1: 6400, bell: 0.55 }); break; // 칼바람: 필터가 치솟는다
      case 'miss': noise(0.2, 0.5, 2600, 0, 2, 'bandpass', { f1: 700, bell: 0.3 }); break;
      case 'dart': noise(0.09, 0.5, 5200, 0, 3, 'bandpass', { f1: 2100, bell: 0.3 }); tone('square', 2100, 1500, 0.03, 0.1, 0.05); break;
      case 'guard': crack(0.36, 0, 2400); ringOf([1180, 1860, 2650], 0.2, 0.13, 0.002, 0.3); tone('sine', 170, 80, 0.1, 0.34); break; // 막아 내는 쇳소리
      case 'parry': crack(0.42, 0, 3600); ringOf([2120, 3180, 4770, 6300], 0.32, 0.13, 0, 0.5); noise(0.16, 0.2, 5200, 0.015, 1.4, 'bandpass', { f1: 1500 }); break;
      case 'heal': tone('sine', 400, 900, 0.3, 0.12, 0, 0.3); tone('sine', 600, 1200, 0.3, 0.08, 0.08, 0.3); break;
      case 'buff': tone('triangle', 300, 1200, 0.35, 0.12, 0, 0.25); break;
      case 'poison': noise(0.25, 0.2, 500, 0, 4); tone('sine', 200, 140, 0.25, 0.08); break;
      case 'charge': tone('sawtooth', 70, 420, 0.62, 0.1, 0, 0.2); noise(0.62, 0.2, 240, 0, 1.2, 'bandpass', { f1: 3400, bell: 0.9, send: 0.3 }); break; // 기운이 차오른다
      case 'boom': tone('sine', 118, 26, 0.95, 0.85, 0, 0.5); noise(0.5, 0.5, 380, 0, 0.6, 'lowpass', { drive: true, send: 0.5 }); crack(0.45, 0, 1500); break;
      case 'die': tone('sine', 150, 34, 0.6, 0.3, 0, 0.3); noise(0.34, 0.18, 300, 0.02, 0.7, 'lowpass'); noise(0.16, 0.2, 700, 0.3, 1, 'bandpass', { drive: true }); break; // 쓰러지는 소리
      case 'coin': tone('square', 990, 990, 0.05, 0.06); tone('square', 1320, 1320, 0.12, 0.06, 0.05); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, 0.14, 0.07, i * 0.1)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f, 0.3, 0.1, i * 0.22)); break;
      case 'level': [523, 784, 1046, 1568].forEach((f, i) => tone('square', f, f, 0.1, 0.06, i * 0.07)); break;
      case 'step': tone('triangle', 200, 150, 0.05, 0.05); break;
      case 'card': noise(0.05, 0.12, 4200, 0, 1.5); tone('square', 1400, 1900, 0.025, 0.025); break; // 카드 넘김
      case 'shuffle': for (let i = 0; i < 6; i++) noise(0.035, 0.1, 3200 + i * 260, i * 0.04, 2); break;
      case 'burn': noise(0.42, 0.22, 900, 0, 0.7, 'bandpass', { f1: 240, drive: true }); tone('sawtooth', 220, 70, 0.3, 0.05); for (let i = 0; i < 6; i++) noise(0.012, 0.12, 3800, 0.04 + i * 0.05, 1.5); break; // 타닥타닥
      // 절초 전용
      case 'gong': ringOf([104, 171, 262, 402, 590], 2.2, 0.5, 0, 0.7); noise(0.05, 0.3, 700, 0, 0.8); break; // 범종
      case 'bell': ringOf([660, 1320, 1985, 2640, 3960], 1.3, 0.16, 0, 0.7); break; // 풍경·종
      case 'crane': { const a = ac, t = a.currentTime, o = a.createOscillator(), g = a.createGain(), w = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1350, t); o.frequency.exponentialRampToValueAtTime(2500, t + 0.13); o.frequency.exponentialRampToValueAtTime(1750, t + 0.62); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.06); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); w.gain.value = 0.8; o.connect(g).connect(out); g.connect(w).connect(verb); o.start(t); o.stop(t + 0.72); break; } // 학 울음
      case 'thunder': crack(0.7, 0, 2600); noise(0.9, 0.55, 520, 0.01, 0.6, 'lowpass', { f1: 90, drive: true, send: 0.5 }); tone('sine', 76, 28, 0.9, 0.7, 0.02, 0.4); break;
      case 'gale': noise(0.95, 0.42, 300, 0, 2.2, 'bandpass', { f1: 2600, bell: 0.7, send: 0.35 }); noise(0.95, 0.2, 620, 0, 5, 'bandpass', { f1: 1400, bell: 0.5 }); break;
      case 'roar': tone('sawtooth', 96, 54, 0.75, 0.34, 0, 0.4); tone('sawtooth', 98, 56, 0.75, 0.24, 0, 0.3); noise(0.75, 0.4, 480, 0, 1.4, 'bandpass', { f1: 1500, bell: 0.2, drive: true, send: 0.4 }); break; // 용의 포효
      case 'petal': [1046, 1319, 1568, 2093, 2637].forEach((f, i) => tone('triangle', f, f, 0.4, 0.09, i * 0.055, 0.5)); break;
      case 'star': tone('sine', 1760, 1760, 0.3, 0.1, 0, 0.6); tone('sine', 2640, 2640, 0.2, 0.05, 0.01, 0.6); break;
    }
  } catch (e) { /* 오디오 미허용 */ }
}
