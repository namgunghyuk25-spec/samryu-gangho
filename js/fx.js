// fx.js — pixelfx로 미리 구운 스프라이트 시트 플립북(전투 VFX). 시트: 위 색 격자(알파) + 아래 빛 격자(가산), tools/fxsheets.mjs가 만든다
import { THREE, scene, onFrame, dispose } from './engine.js';

const SHEETS = {}; // id → { d: 메타(w h n cols fps ox oy light), t: 텍스처 }
const BASE = 'assets/fx/';
// 모듈을 불러오는 순간(=게임 시작) 읽기 시작. 파일이 없거나 깨져도 조용히 넘어가고 hasFx가 false → 기존 파티클로 대체
export const fxReady = fetch(BASE + 'fx.json').then(r => (r.ok ? r.json() : { fx: {} })).then(m => Promise.all(Object.entries(m.fx || {}).map(([id, d]) => new Promise(res => {
  const img = new Image();
  img.onload = () => {
    const t = new THREE.Texture(img);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true;
    SHEETS[id] = { d, t }; res();
  };
  img.onerror = () => res();
  img.src = BASE + d.file;
})))).catch(() => {});
export const hasFx = id => !!SHEETS[id];

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// 미리곱 알파 한 번에: 색은 덮고(src.a), 빛은 더한다 → blend ONE, ONE_MINUS_SRC_ALPHA
const FS = `uniform sampler2D map; uniform vec4 rect; uniform float lightOff; uniform float opacity; uniform vec3 tint; varying vec2 vUv;
void main(){ vec2 uv = rect.xy + vec2(vUv.x, 1.0 - vUv.y) * rect.zw; vec4 c = texture2D(map, uv);
  vec3 l = lightOff > 0.0 ? texture2D(map, uv + vec2(0.0, lightOff)).rgb : vec3(0.0); float a = c.a * opacity;
  gl_FragColor = vec4((c.rgb * a + l * opacity) * tint, a); }`;

// 화면(게임 좌표, y 위) x,y에 효과 기준점을 맞춰 한 번 재생. 시계(clock.scale·히트스톱)를 따른다. 시트가 없으면 null
// o: parent(기본 scene) scale flip(좌우) flipY(상하) layer(renderOrder, 기본 4000) tint opacity speed onDone loop(되풀이 — 멈추려면 부모에서 떼어 낸다)
export function playFx(id, x, y, { parent = scene, scale = 1, flip = false, flipY = false, layer = 4000, tint = '#ffffff', opacity = 1, speed = 1, onDone, loop = false } = {}) {
  const s = SHEETS[id];
  if (!s) return null;
  const { w, h, n, cols, fps, ox, oy, light } = s.d, img = s.t.image, rows = Math.ceil(n / cols);
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(w / 2 - ox, oy - h / 2, 0);
  const u = { map: { value: s.t }, rect: { value: new THREE.Vector4(0, 0, w / img.width, h / img.height) }, lightOff: { value: light ? (rows * h) / img.height : 0 }, opacity: { value: opacity }, tint: { value: new THREE.Color(tint) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(Math.round(x), Math.round(y), 0);
  m.scale.set(scale * (flip ? -1 : 1), scale * (flipY ? -1 : 1), 1);
  m.renderOrder = layer;
  parent.add(m);
  let t = 0, f = -1;
  const show = k => { f = k; u.rect.value.x = (k % cols) * w / img.width; u.rect.value.y = Math.floor(k / cols) * h / img.height; };
  show(0);
  const off = onFrame(dt => {
    t += dt * speed;
    const k = Math.floor(t * fps / 1000) % (loop ? n : Infinity);
    if (k >= n || !m.parent) { off(); dispose(m); onDone && onDone(); return; }
    if (k !== f) show(k);
  });
  return m;
}
