// cardbattle.js — 주천 카드 전투(시제품 proto.html · 본 게임 공용)
// 속도 게이지(CTB) 위에: 손패 5장 · 내력 3 · 주천 1/2/3단 · 연환 · 무게(다음 차례 지연) · 적 의도(공격/경계/절초)
// 카드 기믹: 꽃잎 만들기 · 한 번 더 · 반격 · 되치기 · 간파 · 탈력 · 축기 · 심법 / 대상 상태: 출혈 · 약화 · 내상
// 카드는 DOM으로 그리고 매 프레임 정수 좌표로 옮긴다(도트가 번지지 않게). 연출 시간은 게임 시계(배속·히트스톱)를 따른다.
import { THREE, el, win, sfx, popText, flashScreen, shake, burst, ring, spawn, hitstop, R, pick, wait, tween, ease, pushKeys, listMenu, TOUCH, touchy, portraitView, camZoom, slowmo, tex } from './engine.js';
import { canvas } from './pixel.js';
import { PILLS, ENEMIES, enemyStats, diffOf } from './data.js';
import { Battle, vfxTex } from './battle.js';
import { music } from './music.js';
import { playFx } from './fx.js';
import { CARDS, FOES, BOSS_KIT, TYPE, TYPE_NAME, ST_NAME, SIMS, SIM_SYN, rarity, comboHint } from './cards.js';

export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const val = (v, t) => (Array.isArray(v) ? v[t - 1] : v);
const ULT_MOVE = { m_cheongseong: 'ultCrane', m_sorim: 'ultPalm', m_gaebang: 'ultDragon', m_mudang: 'ultTaiji', m_emei: 'ultLight', m_hwasan: 'ultBloom', m_jongnam: 'ultDipper', m_gonryun: 'ultCloud', m_gongdong: 'ultSeven' }; // 장문인 전용 안무(없으면 ultBasic). 프레임 seq.ult가 있을 때만
let SWORD_T = null;
function swordT() { // 만검귀종의 검: 아래를 겨눈 칼날 + 코등이 + 자루
  if (SWORD_T) return SWORD_T;
  const c = canvas(9, 34), x = c.getContext('2d'), r = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  r('#60c0ff', 2, 7, 5, 24); r('#c8ecff', 3, 7, 3, 26); r('#ffffff', 4, 8, 1, 26); r('#ffd860', 1, 5, 7, 2); r('#305080', 3, 0, 3, 5);
  return (SWORD_T = tex(c));
}
function craneTex() { // 날개를 펼친 학의 그림자: 알파 문턱으로 도트처럼 잘린다
  const c = canvas(120, 64), x = c.getContext('2d'); x.fillStyle = '#fff';
  const poly = (...p) => { x.beginPath(); p.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  poly([52, 34], [30, 6], [4, 0], [16, 14], [6, 16], [20, 26], [12, 30], [30, 36], [44, 42]); // 뒷날개
  poly([62, 32], [76, 8], [102, 2], [90, 14], [100, 18], [84, 28], [90, 32], [72, 38], [60, 42]); // 앞날개
  poly([44, 34], [66, 30], [72, 38], [54, 46], [40, 44]); // 몸
  poly([68, 34], [92, 20], [96, 22], [74, 40]); // 목
  poly([92, 18], [100, 18], [116, 22], [100, 24], [93, 24]); // 머리·부리
  poly([44, 40], [18, 54], [14, 60], [36, 52], [48, 46]); // 꼬리·다리
  return c;
}
function palmTex() { // 여래신장: 금빛 손바닥(외곽선 · 세 톤 · 손금). 크게 그려 줄여 쓴다
  const c = canvas(144, 184), x = c.getContext('2d');
  const hand = (col, d = 0) => {
    x.fillStyle = col; const rr = (a, b, w, h) => { x.beginPath(); x.roundRect(a - d, b - d, w + d * 2, h + d * 2, Math.min(w, h) / 2 + d); x.fill(); };
    rr(32, 80, 80, 78); rr(44, 150, 56, 34);
    [[32, 22, 18, 74], [54, 6, 18, 88], [76, 12, 18, 82], [98, 30, 16, 66]].forEach(f => rr(...f));
    x.save(); x.translate(40, 116); x.rotate(-0.7); rr(-54, -10, 58, 20); x.restore();
  };
  hand('#5a2c00', 3); hand('#ffc830');
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = '#fff4b0'; x.fillRect(30, 0, 12, 184); x.fillRect(54, 0, 8, 80); x.fillRect(76, 0, 8, 80);
  x.fillStyle = '#e09a18'; x.fillRect(102, 0, 42, 184); x.fillRect(0, 138, 144, 46);
  x.fillStyle = '#a05c00'; [[32, 96, 76, 3], [38, 112, 66, 3], [50, 96, 3, 42], [50, 30, 2, 66], [72, 14, 2, 80], [94, 20, 2, 76]].forEach(r => x.fillRect(...r));
  x.fillStyle = '#fff4b0'; x.beginPath(); x.arc(72, 124, 9, 0, 7); x.fill();
  return c;
}
function plumTex() { // 매화 한 송이: 끝이 파인 꽃잎 다섯, 진한 속, 금빛 수술
  const c = canvas(128, 128), x = c.getContext('2d');
  for (let i = 0; i < 5; i++) {
    x.save(); x.translate(64, 64); x.rotate(i / 5 * Math.PI * 2);
    [['#a02050', 27, 33], ['#ffc4d8', 24, 30], ['#ff90b8', 19, 24], ['#d84878', 12, 15]].forEach(([col, rx, ry], k) => { x.fillStyle = col; x.beginPath(); x.ellipse(0, -34 + k * 3, rx, ry, 0, 0, 7); x.fill(); });
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(-6, -70); x.lineTo(6, -70); x.lineTo(0, -58); x.closePath(); x.fill();
    x.restore();
  }
  x.fillStyle = '#ffe070';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 14 + (i % 2) * 6; x.fillRect(64 + Math.cos(a) * r - 2, 64 + Math.sin(a) * r - 2, 4, 4); }
  x.fillStyle = '#fff4b0'; x.beginPath(); x.arc(64, 64, 8, 0, 7); x.fill();
  return c;
}
const SEAL = { dark: { ch: '封', flash: '#180028', emb: ['#000000', '#401060', '#a030e0'] }, ice: { ch: '氷', flash: '#103058', emb: ['#e0f8ff', '#60b0ff', '#ffffff'] }, chain: { ch: '鎖', flash: '#202028', emb: ['#808090', '#d0d0e0', '#404048'] } };
export const TIER_COL = ['#7ab8ff', '#ffd040', '#ff5060'], ROMAN = ['1단', '2단', '3단'];
const DUO_MUL = 0.7, DUO_POS = [[132, 92], [66, 114]]; // 네임드 2인전: 체력·공격 배율, 자리(왼쪽 끝에 잘리지 않게)
const CW = 58, CH = 84, HX0 = 2, HX1 = 260, HY = 156, LIFT = 22, MAX_HAND = 10;
const DECK_AT = [268, 219], DISC_AT = [281, 219]; // 패널의 덱·버림 더미(화면 좌표, 가운데)
const PW_NAME = Object.fromEntries(Object.values(CARDS).filter(c => c.power).map(c => [c.power, c.name]));
let UID = 0;
const SCHOOL_NAME = { bukhae: '북해', dang: '당가', gaebang: '개방', emei: '아미', gonryun: '곤륜', gongdong: '공동', combo: '합격', samryu: '삼류', hwasan: '화산', sorim: '소림', mudang: '무당', namgung: '남궁', magyo: '마교' };
// 본 게임 적: 무공 공격력 성장에 맞춘 체력·공격을 카드 전투 눈금으로 누른다(지역 R1~R5). 체력은 약 3배, 공격은 주인공 체력 성장만큼만 오른다
const HPDIV = [1.2, 1.9, 3.0, 4.0, 5.6], ATKDIV = [1.2, 1.25, 2.0, 2.7, 3.8];
const AURA_MAT = () => new THREE.ShaderMaterial({ // 주천 오오라 테두리: 지금 자세 그림의 실루엣을 한 색으로
  uniforms: { map: { value: null }, col: { value: new THREE.Color() }, opacity: { value: 0.6 } }, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D map; uniform vec3 col; uniform float opacity; varying vec2 vUv; void main(){ if (texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(col, opacity); }',
});
const JC_COL = { mangae: ['#ff70a0', '#ffd0e0', '#601030'], cheonha: ['#60a0ff', '#e0f0ff', '#102060'], mangeom: ['#70d8ff', '#ffffff', '#083050'], bingbaek: ['#a0e8ff', '#ffffff', '#103050'], dokryong: ['#60e060', '#d8ffc8', '#0c3010'], cheonmasin: ['#ff3040', '#ffb0a0', '#300008'] }; // 절초 띠·빛·바탕

export function tierMove(c) { // 이 카드가 주천을 어떻게 하나
  if (c.finisher) return { cls: 'rs', mark: '▼1', txt: '주천을 1단으로 되돌림' };
  if (c.setTo) return { cls: 'kp', mark: '◆' + c.setTo, txt: `주천을 ${c.setTo}단으로 맞춤` };
  if (c.tier > 0) return { cls: 'up', mark: '▲' + (c.tier > 1 ? c.tier : ''), txt: `주천 ${c.tier}단 올림` };
  if (c.tier < 0) return { cls: 'dn', mark: '▼', txt: `주천 ${-c.tier}단 내림` };
  return { cls: 'kp', mark: '●', txt: '주천 그대로' };
}
function staticMain(c, t) { // 전투 밖(보상 화면)에서도 쓰는 주 효과
  const pre = c.target === 'all' ? '전체 ' : '피해 ';
  switch (c.special) {
    case 'mangae': return '6×검기';
    case 'hangma': return '호신만큼';
    case 'daeryeok': return '막은 만큼';
    case 'yeonhwan': return `${val(c.dmg, t)}×낸 수`;
    case 'chilmae': return '꽃잎 X×2';
    case 'heocho': case 'unryong': return '한 번 더';
    case 'parry': return c.block ? '호신 ' + c.block : '되치기';
    case 'samjae': return ['피해4·호신3', '피해 8', '피해 5×2'][t - 1];
    case 'nahyeol': return '호신만큼';
    case 'hyeolu': return '출혈 ×2';
    case 'returned': return '6+되돌림';
    case 'hyeolhae': return '3+출혈×2';
    case 'cheonmasin': return '잃은 만큼';
    case 'mangeom': return '전체 8+';
    case 'hancheon': return '호신 4+한기';
    case 'bingbaek': return '18+한기×3';
    case 'dokryong': return '독×3';
  }
  if (c.main) return c.main;
  if (c.dmg != null) return pre + val(c.dmg, t) + (c.hits > 1 ? '×' + c.hits : '');
  if (c.block != null) return '호신 ' + val(c.block, t);
  if (c.dodge) return '흘림 ' + val(c.dodge, t);
  if (c.blunt) return '절초 약화';
  if (c.energy) return '내력 +' + c.energy;
  if (c.draw) return c.draw + '장 뽑기';
  return '';
}
export function cardFace(id, t = 0, main = null) { // .f(앞면) + .b(뒷면)
  const c = CARDS[id], mv = tierMove(c), tiered = Array.isArray(c.dmg) ? c.dmg : Array.isArray(c.block) ? c.block : Array.isArray(c.dodge) ? c.dodge : null;
  const cells = [1, 2, 3].map(k => `<i class="${k === t ? 'on' : ''}${c.only && c.only !== k ? ' x' : ''}${c.only === k ? ' only' : ''}">${tiered ? tiered[k - 1] : c.only === k ? '★' : k}</i>`).join('');
  const kw = [c.only === 3 && '<em class="jck">절초</em>', c.combo && '<em class="cbk">합격</em>', c.power && '<em class="pw">심법</em>', c.trick && '<em class="ex">간파</em>', c.tal && `<em class="tl">탈력${c.tal}</em>`, c.retain && '<em class="rt">축기</em>', c.token && '<em class="tk">흩날림</em>'].filter(Boolean).join('');
  return `<div class="f" style="--tc:${TYPE[c.type]}"><div class="art" style="background-image:url(assets/c_${id}.png)"></div><span class="cc">${c.cost}</span><span class="tb ${mv.cls}">${mv.mark}</span>`
    + `<div class="cs">${cells}</div><div class="cn">${c.short || c.name}</div><div class="cm">${main ?? staticMain(c, t || 1)}</div><div class="kw">${kw}</div></div><div class="b"></div>`;
}
export const cardClass = id => 'cd2' + (CARDS[id].school === 'oe' ? ' oe' : '') + (CARDS[id].token ? ' tok' : '') + (CARDS[id].combo ? ' cb' : '') + (CARDS[id].only === 3 ? ' jc' : '') + ['', ' r1', ' r2'][rarity(id)];

function intentsFrom(u) { // FOES 표에 없는 적(본 게임): 눌러 둔 공격력과 기술 이름으로 의도를 만든다
  const a = Math.max(3, Math.round(u.atk || 5)), sk = (u.skills || []).filter(s => s.name), big = u.title || u.final || u.mid || u.boss || u.elite || u.duel;
  const list = [{ k: 'atk', name: sk[0] ? sk[0].name : '공격', dmg: a, w: 3, vfx: (sk[0] && sk[0].vfx) || 'slash' }, { k: 'guard', name: '대비', shield: Math.round(a * 1.2), w: 1 }];
  if (sk[1]) list.push({ k: 'atk', name: sk[1].name, dmg: Math.max(2, Math.round(a * 0.6)), hits: 2, w: 1.5, vfx: sk[1].vfx || 'slash' });
  if (big) list.push({ k: 'ult', name: sk.length ? sk.at(-1).name : '절초', dmg: Math.round(a * 2.0), w: 1, vfx: (sk.length && sk.at(-1).vfx) || 'slash' }, { k: 'drain', name: '산공', w: 0.6 });
  return list;
}

export class CardBattle extends Battle {
  constructor(hero, ids, run, kind, opt = {}) {
    super(hero, ids, opt.region || 0, kind, opt.geo || 0, opt.mul);
    this.duo = ids.length === 2 && ids.every(id => ENEMIES[id].boss); if (this.duo) this.slots = DUO_POS; // 네임드 둘이면 한 명씩은 조금 약하게
    run.relics ||= [];
    const sim = SIMS[run.sim] || null; // 장착 심법: 제 효과(power) + 같은 문파 카드 시너지
    this.useRes = run.school === 'hwasan' || (sim && sim.power === 'jaha') || run.deck.some(id => CARDS[id].special === 'mangae' || CARDS[id].power === 'jaha'); // 검기
    this.free = run.school === 'samryu'; // 잡학: 문파를 바꿔 이어 내면 연환 피해 +10%씩 더
    Object.assign(this, { run, tier: 1, heat: 0, res: 0, energy: 0, chain: 0, attacks: 0, guards: 0, weight: 0, drainNext: 0, nextEnergy: 0, nextPetals: 0, echo: null, seen: {}, read: false, cg: 0, dblMul: 2, petalBonus: 0, mixed: 0, lastSchool: null, blocked: 0, returned: 0, dbl: false, mul: 1,
      sim, syn: false, powers: sim ? { [sim.power]: 1 } : {}, auraT: 0, planning: false, picking: null, fi: 0, pile: shuffle(run.deck.slice()), discard: [], exhausted: [], hand: [], vis: new Set() });
  }
  // ── 준비 ──
  buildUI() {
    super.buildUI();
    this.cmdWin.classList.add('hidden'); this.stWin.classList.add('hidden');
    portraitView([17, 50, 1.3]); // 세로 화면: 손패가 아래칸으로 빠지니 무대를 1.3배 당겨 인물을 크고 낮게(유닛 x 20~261, 발 76~, 머리+의도 ~231)
    Object.assign(this.helpEl.style, { left: '132px', width: '186px', height: 'auto', textAlign: 'left' }); // 카드 설명이 길다: 주인공 머리 위 빈자리에 여러 줄로
    this.handEl = el('div', 'hand2', null, this.ui);
    this.pan = el('div', 'ppan', null, this.ui);
    this.endBtn = el('div', 'endb hidden', '차례 끝', this.ui);
    this.pillBtn = el('div', 'pillb hidden', '', this.ui); // 단약: 차례를 쓰지 않고 먹는다(I 키)
    this.pillBtn.onclick = e => { e.stopPropagation(); if (this.picking && !this.pillWin) this.openPills(); };
    this.endBtn.onmouseenter = () => { if (!touchy() && this.picking) this.focus(this.hand.length); };
    this.endBtn.onclick = e => { e.stopPropagation(); if (this.picking) this.pick(this.hand.length); }; // 한 번 누르면 바로
    this.pan.onclick = () => this.tip(this.hero);
    for (const id of new Set([...this.run.deck, 'dg_chim'])) new Image().src = `assets/c_${id}.png`;
  }
  makeUnit(d, side, pos) {
    if (side === 'enemy' && FOES[d.id]) d = { ...d, maxHp: FOES[d.id].hp, hp: undefined };
    else if (side === 'enemy') { const r = Math.max(0, Math.min(4, this.region | 0)); const k = this.duo && d.boss ? DUO_MUL : 1, df = diffOf(this.run); d = { ...d, maxHp: Math.round(d.maxHp / HPDIV[r] * k * df.hp[r]), hp: undefined, atk: d.atk / ATKDIV[r] * k * df.atk[r] }; }
    const por = document.querySelector('#root').classList.contains('por'); // 세로 화면: 손패가 아래칸이라 띄우지 않고, 주인공을 조금 안으로(당겨 볼 때 잘리지 않게)
    const u = super.makeUnit(d, side, [pos[0] - (por && side === 'hero' ? 18 : 0), pos[1] + (por ? 0 : LIFT)]); // 손패가 발치를 가리지 않게 조금 위로
    u.cs = {};
    if (side === 'enemy') {
      u.kit = BOSS_KIT[u.id] || null;
      u.intents = FOES[u.id] ? FOES[u.id].intents : intentsFrom(u);
      if (!u.intents.some(i => i.k === 'ult')) { const top = Math.max(5, ...u.intents.filter(i => i.dmg).map(i => i.dmg * (i.hits || 1))); u.intents = [...u.intents, { k: 'ult', name: '전력 일격', dmg: Math.round(top * 1.8), w: 0, vfx: 'slash' }]; }
      u.tier = u.boss || u.duel ? diffOf(this.run).bossTier : 1; // 적도 주천을 돈다: 차례마다 한 단씩, 3단이면 절초
      u.ib = el('div', 'intent', null, this.tagLayer); this.nextIntent(u);
    }
    return u;
  }
  jcState(extra = {}) { return { p: 6, stacks: this.tier, ready: this.tier === 3, qi: Math.min(1, this.energy / 3), col: TIER_COL[this.tier - 1], ...extra }; }
  circulate() {} // 주천은 카드로만 움직인다
  update(dt, real) {
    super.update(dt, real);
    for (const u of this.units) if (u.ib) {
      u.ib.style.display = u.alive ? '' : 'none';
      u.ib.style.transform = `translate(${Math.round(u.mesh.position.x) - 22}px, ${Math.max(20, Math.round(240 - u.mesh.position.y - u.size - 21))}px)`; // 큰 보스도 순서 바 아래로
      const h = this.intentHtml(u); if (u.ib.innerHTML !== h) u.ib.innerHTML = h;
    }
    this.aura(dt);
    const k = Math.min(1, real / 55);
    for (const v of this.vis) {
      const a = v.a;
      if (!v.busy && v.tx != null) { a.x += (v.tx - a.x) * k; a.y += (v.ty - a.y) * k; if (Math.abs(v.tx - a.x) < 0.5) a.x = v.tx; if (Math.abs(v.ty - a.y) < 0.5) a.y = v.ty; }
      const s = `translate(${Math.round(a.x)}px,${Math.round(a.y)}px) scale(${a.sx.toFixed(3)},${a.sy.toFixed(3)})`;
      if (v.lt !== s) { v.el.style.transform = s; v.lt = s; }
      if (v.lo !== a.op) { v.el.style.opacity = a.op; v.lo = a.op; }
    }
  }
  aura(dt) { // 주천 오오라: 몸 둘레에 단 색 테두리(2단 1px 금빛, 3단 2px 붉은빛)가 숨 쉬고 기운이 피어오른다(적도 제 주천만큼, 약하게)
    this.auraT -= dt;
    const pulse = this.auraT <= 0; if (pulse) this.auraT = 620;
    const breath = 0.7 + 0.3 * Math.sin(performance.now() / 140);
    for (const u of this.units) {
      const t = u === this.hero ? this.tier : u.tier || 1, on = u.alive && t >= 2;
      if (on && !u.auraM) u.auraM = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(o => { const m = new THREE.Mesh(u.mesh.geometry, AURA_MAT()); m.userData.o = o; this.group.add(m); return m; });
      for (const m of u.auraM || []) {
        m.visible = on; if (!on) continue;
        const k = t === 3 ? 2 : 1, U = m.material.uniforms;
        m.position.set(u.mesh.position.x + m.userData.o[0] * k, u.mesh.position.y + m.userData.o[1] * k, 0); m.scale.copy(u.mesh.scale); m.renderOrder = u.mesh.renderOrder - 1;
        U.map.value = u.mesh.material.uniforms.map.value; U.col.value.set(TIER_COL[t - 1]); U.opacity.value = (t === 3 ? 0.85 : 0.75) * breath * (u === this.hero ? 1 : 0.7);
      }
      if (!on) continue;
      const x0 = u.mesh.position.x, y0 = u.mesh.position.y, sp = u.size * 0.3, hot = t === 3, cols = hot ? ['#ff3040', '#ff8030', '#ffd060', '#ff5060'] : ['#ffd040', '#fff0a0', '#ffe080'];
      for (let n = (hot ? 2.2 : 1) * (u === this.hero ? 1 : 0.5) * dt / 16; n > 0; n--) if (Math.random() < n) {
        const s = Math.random() < 0.5 ? -1 : 1;
        spawn({ x: x0 + s * (sp * 0.45 + R(0, sp * 0.55)), y: y0 + R(0, u.size * (hot ? 0.9 : 0.7)), vx: -s * R(0, 8), vy: hot ? R(30, 64) : R(16, 36), life: R(320, hot ? 640 : 520), size: hot && Math.random() < 0.4 ? 2 : 1, col: pick(cols) });
      }
      if (pulse && hot && u === this.hero) ring(x0, y0 + 1, 9, cols, 14, 26);
    }
  }
  refresh() {
    super.refresh();
    if (this.hero) this.hero.tag.style.display = this.hero.alive ? '' : 'none';
    this.refreshPanel();
  }
  stList(u) { // 체력바 아래 버프·디버프(주인공·적 모두): [칩 글자, 색, 눌렀을 때 설명]
    const cs = u.cs || {}, L = [], add = (t, c, d) => L.push([t, c, d]);
    if (u.st.shield) add((u.side === 'hero' ? '호신' : '대비') + u.st.shield, '#80c0ff', '받는 피해를 먼저 막는다' + (u.side === 'hero' ? ' · 보통 다음 내 차례에 사라진다' : ''));
    if (cs.counter) add('반격' + cs.counter, '#60ffff', `맞을 때마다 때린 적에게 ${cs.counter} 피해 · 다음 내 차례까지`);
    if (cs.parry) add('되치기', '#f0f0ff', `공격 ${cs.parry}번을 절반만 받고 절반을 되돌린다 · 절초는 못 되친다 · 다음 내 차례까지`);
    if (cs.dodge) add('흘림' + cs.dodge, '#c8e0ff', `공격 ${cs.dodge}번까지 피해가 절반 · 다음 내 차례까지`);
    if (cs.venom) add('산혼독', '#80e060', `이번 차례 카드를 낼 때마다 체력 −${cs.venom}`);
    if (cs.array) add('팔괘진' + cs.array, '#d0b0ff', `내 차례가 올 때마다 내력 −1 (${cs.array}번 남음) · 허초나 암기를 내면 깨진다`);
    if (cs.evade) add('잔상', '#c0c0ff', '다음 공격 하나를 피한다 · 출혈은 닿는다');
    if (cs.iron) add('금강', '#ffd860', '호신이 크게 쌓였다 · 허초나 암기를 내면 호신이 모두 깨진다');
    if (cs.mirror) add('되돌림', '#d0e0ff', '이 적을 때린 피해의 절반이 내게 돌아온다 · 출혈은 안 돌아온다 · 이 적이 다음 수를 쓰면 풀린다');
    if (cs.cloud) add('구름', '#e0f0ff', '단일 공격이 닿지 않는다 · 전체 공격과 출혈만 닿는다 · 이 적이 다음 수를 쓰면 걷힌다');
    if (cs.bud) add(`봉오리 ${cs.bud.left}·${cs.bud.t}`, '#ff90b8', `내 차례가 ${cs.bud.t}번 끝나기 전에 이 적을 공격해 피해 ${cs.bud.left}을 더 주면 깨진다 · 못 깨면 만개해 내가 ${Math.round(u.intents.find(i => i.k === 'ult').dmg * 0.8)} 피해`);
    if (cs.frozen) add('빙결', '#c8f4ff', '다음 수를 쉰다(쓰려던 수는 그대로 남는다) · 받는 피해 +25% · 쇄빙 카드로 깨면 크게 터지지만 쉬지 않고 움직인다');
    if (cs.frost) add(`한기${cs.frost}/${this.freezeAt(u)}`, '#90d8ff', `느려진다(−${Math.min(5, cs.frost) * 8}%) · ${this.freezeAt(u)}이 차면 빙결 · 행동할 때마다 1 녹는다`);
    if (cs.icewall) add('빙벽', '#90d8ff', '나를 때린 적에게 한기 1 · 다음 내 차례까지');
    if (cs.tlock) add('주천 봉쇄', '#80a0ff', '다음 내 차례가 끝날 때까지 주천을 올리지 못한다');
    const ST_DESC = { poison: `이 적의 차례마다 ${cs.poison} 피해 · 호신을 뚫고 줄지 않는다`, bleed: `차례가 오면 ${cs.bleed} 피해를 입고 1 줄어든다`, weak: `${cs.weak}번 행동하는 동안 주는 피해 −25%`, vuln: `${cs.vuln}번 행동하는 동안 받는 피해 +50%` };
    for (const k in ST_NAME) if (cs[k] && k !== 'frost') add(ST_NAME[k][0] + cs[k], ST_NAME[k][1], ST_DESC[k]);
    return L;
  }
  stHtml(u) { return this.stList(u).map(([t, c]) => `<b class="sc" style="--c:${c}">${t}</b>`).join(''); }
  tipLines(u) { // 눌렀을 때 설명: 다음 수 · 특기 · 걸린 효과(주인공은 주천판의 표시까지)
    const L = [], it = this.rel('aekku') ? null : u.intent, g = u.kit && ((u.phase2 && u.kit.phase) || u.kit.move), amt = d => Math.round(d * (u.cs.weak ? 0.75 : 1));
    if (it) L.push(['다음 수', ...(it.gm ? ['#d890ff', `「${it.name}」${it.dmg ? ` 피해 ${amt(it.dmg)}` : ''} — ${it.say}`]
      : it.k === 'atk' ? ['#ff7070', `「${it.name}」 피해 ${amt(it.dmg)}${it.hits > 1 ? '×' + it.hits : ''}`]
      : it.k === 'ult' ? ['#ffd040', `절초 「${it.name}」 피해 ${amt(it.dmg)} — 끊을 수 없다 · ${it.weak ? '이미 약화됐다' : '절초 약화 카드로 크게 줄일 수 있다'}`]
      : it.k === 'stun' ? ['#c8c8c8', '흔들림 — 이번 수를 쉰다']
      : ['#80c0ff', '경계 — 호신을 쌓거나(대비) 내 주천·내력을 깎는다(산공). 어느 쪽인지는 모른다'])]);
    if (g && !(it && it.gm)) L.push(['특기', '#d890ff', `주천 2단에 「${g.name}」 — ${g.say}`]);
    if (u.kit && u.kit.undying && !u.risen) L.push(['기시회생', '#60e0d0', `쓰러지면 한 번, 체력 ${Math.round(u.kit.undying * 100)}%로 되살아난다`]);
    if (u.kit && u.kit.acts && !u.act) L.push(['불굴', '#ff8080', '쓰러지면 호위 네임드를 부르고, 호위가 쓰러지면 더 강해져 되살아난다']);
    L.push(...this.stList(u));
    if (u === this.hero) {
      if (this.tier === 3 && this.heat && !this.rel('cheongsim')) L.push(['과열', '#ff5060', '다음 내 차례에도 주천 3단이면 주화입마에 빠진다']);
      if (this.run.school === 'sorim' && this.tier === 1 && this.low) L.push(['차오름', '#ffd050', '다음 내 차례에도 1단이면 기가 차올라 2단이 된다 · 달마심법·염화지로 내려온다']);
      if (this.drainNext) L.push([`다음−${this.drainNext}`, '#ff9090', `다음 차례 내력 −${this.drainNext}`]);
      if (this.echo) L.push(['한번더', '#ffd040', this.echo === 'atk' ? '다음 공격 카드가 한 번 더 나간다' : '다음 카드(심법 빼고)가 한 번 더 나간다']);
      if (this.dbl) L.push(['두배', '#ffd040', `다음 공격 피해 ×${this.dblMul}`]);
      if (this.mixed) L.push([`잡학${this.mixed}`, '#ffe080', `이번 차례 피해 +${this.mixed * 10}%`]);
      if (this.nextEnergy) L.push([`다음+${this.nextEnergy}`, '#80c8ff', `다음 차례 내력 +${this.nextEnergy}`]);
    }
    return L;
  }
  refreshPanel() { // 반격·되치기·흘림은 패널 대신 체력바 아래 칩으로
    if (!this.pan || !this.hero) return;
    const h = this.hero, e = Math.max(0, this.energy), cs = h.cs || {};
    const sts = [this.drainNext && `<b style="color:#ff9090">다음−${this.drainNext}</b>`, this.echo && '<b style="color:#ffd040">한번더</b>', this.dbl && '<b style="color:#ffd040">두배</b>', this.mixed && `<b style="color:#ffe080">잡학${this.mixed}</b>`,
      this.nextEnergy && `<b style="color:#80c8ff">다음+${this.nextEnergy}</b>`].filter(Boolean).join(' ');
    const html = `<div class="pt" style="color:${TIER_COL[this.tier - 1]}">${this.tier === 3 && this.heat ? `${ROMAN[2]} <span class="red blink">과열</span>` : this.tier === 1 && this.low && this.run.school === 'sorim' ? `${ROMAN[0]} <span class="gold blink">차오름</span>` : `주천 ${ROMAN[this.tier - 1]}`}</div>`
      + `<div class="pe"><span class="lbl">내력</span>${Array.from({ length: Math.min(4, Math.max(3, e)) }, (_, i) => `<i class="${i < e ? 'on' : ''}"></i>`).join('')}<span class="num">${e}</span></div>`
      + `<div class="pr">${this.useRes ? `<span style="color:#ffb0d0">검기${this.res}</span> ` : ''}<span style="color:#80c0ff">호신${h.st.shield}</span></div>`
      + `<div class="ps">${sts}</div><div class="pw">${[this.sim && this.sim.name, ...Object.entries(this.powers).map(([k, n]) => [k, n - (this.sim && k === this.sim.power ? 1 : 0)]).filter(([k, n]) => n > 0 && PW_NAME[k]).map(([k, n]) => PW_NAME[k] + (n > 1 ? '×' + n : ''))].filter(Boolean).join(' ')}</div>`
      + `<div class="ph">체력 ${Math.ceil(h.hp)}/${h.maxHp}</div>`
      + `<div class="pp"><span class="pk">${this.pile.length}</span><span class="pk dc">${this.discard.length}</span></div>`;
    if (this.pan.innerHTML !== html) this.pan.innerHTML = html;
  }
  // ── 적 의도 ──
  nextIntent(u) { // 3단이면 반드시 절초, 아니면 단이 높을수록 센 수
    if (u.tier >= 3) { const ult = u.intents.find(i => i.k === 'ult'); u.intent = { ...ult }; u.charging = { name: ult.name }; return; }
    const g = u.kit && u.tier === 2 && ((u.phase2 && u.kit.phase) || u.kit.move);
    if (g) { u.intent = { gm: true, ...g }; if (g.mul) u.intent.dmg = Math.round(u.intents.find(i => i.k === 'atk').dmg * g.mul); u.charging = null; return; }
    const opts = u.intents.filter(i => i.k !== 'ult');
    let r = Math.random() * opts.reduce((a, i) => a + i.w, 0), pickd = opts[0];
    for (const i of opts) { r -= i.w; if (r <= 0) { pickd = i; break; } }
    u.intent = { ...pickd }; u.charging = null;
    if (u.intent.dmg) u.intent.dmg = Math.round(u.intent.dmg * (u.tier === 2 ? 1.25 : 1));
  }
  intentHtml(u) {
    const it = u.intent; if (!it) return '';
    if (this.rel('aekku') && !(u.cs && u.cs.frozen)) return '<b class="i-stun">?</b>';
    const wk = u.cs && u.cs.weak ? 0.75 : 1, t = u.tier || 1;
    return `<i class="ep" style="color:${TIER_COL[t - 1]}">${'●'.repeat(t)}${'○'.repeat(3 - t)}</i><br>` + (u.cs && u.cs.frozen ? '<b class="i-stun">빙결</b>' : this.intentText(it, wk));
  }
  intentText(it, wk) {
    if (it.gm) return `<b class="i-gm">${it.label}${it.dmg ? ' ' + Math.round(it.dmg * wk) : ''}</b>`;
    if (it.k === 'atk') return `<b class="i-atk">공격 ${Math.round(it.dmg * wk)}${it.hits > 1 ? '×' + it.hits : ''}</b>`;
    if (it.k === 'ult') return `<b class="i-ult blink">절초 ${Math.round(it.dmg * wk)}${it.weak ? '↓' : '!'}</b>`;
    if (it.k === 'stun') return '<b class="i-stun">흔들림</b>';
    return '<b class="i-calm">경계 ?</b>'; // 대비인지 산공인지 모른다(수읽기)
  }
  interrupt(x) {
    if (!x.alive || !x.intent) return;
    if (x.intent.k === 'ult') { popText(...this.top(x), '절초는 못 끊는다', 'st'); return; }
    if (x.intent.k === 'stun') return;
    x.intent = { k: 'stun', name: '흔들림' }; x.charging = null; x.tier = Math.max(1, (x.tier || 1) - 1); // 혈도를 찔러 주천을 깎는다
    popText(...this.top(x), '끊기! 주천 −1', 'crit'); sfx('crit'); shake(2, 150);
  }
  blunt(x) {
    if (!x.alive || !x.intent || x.intent.k !== 'ult' || x.intent.weak) return;
    x.intent.dmg = Math.round(x.intent.dmg * 0.4); x.intent.weak = true;
    popText(...this.top(x), '허초! 절초 약화', 'crit'); sfx('buff');
  }
  addSt(u, k, n) {
    if (!u.alive || !n) return;
    if (k === 'bleed' && u.side === 'enemy') n += (this.rel('poisonbag') ? 2 : 0) + (this.powers.mandok || 0);
    if (k === 'poison' && u.side === 'enemy' && this.rel('poisonbag')) n += 1;
    u.cs[k] = (u.cs[k] || 0) + n;
    popText(...this.top(u), `${ST_NAME[k][0]} +${n}`, k === 'bleed' ? 'dmg' : k === 'vuln' ? 'warn' : 'st');
    if (k === 'frost') this.checkFreeze(u);
  }
  spdOf(u) { return u.spd * (u.cs && u.cs.frost ? 1 - 0.08 * Math.min(5, u.cs.frost) : 1); } // 한기: 느려진다
  freezeAt(u) { return (u.boss || u.elite || u.title || u.final || u.mid || u.duel ? 7 : 4) + 2 * ((u.cs && u.cs.frozenN) || 0); } // 강적일수록, 얼릴수록 잘 안 언다
  checkFreeze(u) {
    if (!u.alive || u.cs.frozen || u.cs.frost < this.freezeAt(u)) return;
    u.cs.frozen = 1; u.cs.frozenN = (u.cs.frozenN || 0) + 1; u.cs.frost = Math.floor(u.cs.frost / 2);
    const [x, y] = this.center(u); popText(x, y + 24, '빙결!', 'crit'); sfx('crit'); shake(2, 160);
    burst(x, y, { n: 26, cols: ['#ffffff', '#b8f0ff', '#60c8ff'], spd: [40, 150], size: [1, 3] }); ring(x, u.mesh.position.y + 2, 8, ['#c8f0ff', '#ffffff'], 18, 60);
    const o = { parent: this.group, scale: this.iceScale(u), layer: u.mesh.renderOrder + 1 }, gx = u.mesh.position.x, gy = u.mesh.position.y; // 맺히고 → 얼어 있는 동안 되풀이
    const form = playFx('iceForm', gx, gy, { ...o, onDone: () => { if (u.cs.frozen && u.iceM === form) u.iceM = playFx('iceHold', gx, gy, { ...o, loop: true }); } }); u.iceM = form;
    if (this.rel('icepin')) this.gainEnergy(1, '빙정 ');
  }
  thaw(u, broken) { // 빙결이 풀린다(broken: 깨뜨렸다)
    u.cs.frozen = 0; if (this.rel('simhan') && u.alive) u.cs.frost = (u.cs.frost || 0) + 3;
    const m = u.iceM, [x, y] = this.center(u); u.iceM = null; if (m && m.parent) m.parent.remove(m);
    playFx('iceBreak', u.mesh.position.x, u.mesh.position.y, { parent: this.group, scale: this.iceScale(u) * (broken ? 1.5 : 1), layer: u.mesh.renderOrder + 1, speed: broken ? 1 : 1.4 });
    if (broken) { popText(x, y + 26, '파빙!', 'crit'); sfx('boom'); shake(4, 240); flashScreen('#e0f8ff', 110, 0.5); } else sfx('guard');
  }
  iceScale(u) { return Math.max(1, Math.round(u.size / 42 * 2) / 2); } // 시트의 얼음은 42칸 키: 큰 적에 맞춰 반 단위로 키운다
  async enemyTurn(u) {
    if (u.cs.poison) { // 독: 차례마다 쌓인 만큼, 호신을 뚫고 줄지 않는다
      const [x, y] = this.center(u), sh = u.st.shield;
      playFx('poison', x, y, { parent: this.group }) || burst(x, y, { n: 12, cols: ['#60e060', '#30a030'], spd: [20, 60] });
      u.st.shield = 0; this.damage(u, u.cs.poison, { dot: true }); u.st.shield = sh;
      await wait(240); if (!u.alive) return;
    }
    if (u.cs.bleed) { // 출혈: 차례 시작에 n 피해, 1 줄어든다
      const [x, y] = this.center(u);
      playFx('blood', x, y, { parent: this.group }) || burst(x, y, { n: 12, cols: ['#ff3040', '#a00010'], spd: [20, 60] });
      this.damage(u, u.cs.bleed, { dot: true }); u.cs.bleed--;
      await wait(280); if (!u.alive) return;
    }
    if (u.cs.frost) u.cs.frost--; // 한기는 행동할 때마다 녹는다
    if (u.cs.frozen) { // 빙결: 한 수 쉰다. 쓰려던 수(절초 포함)는 그대로 남고 주천도 안 오른다
      this.thaw(u); popText(...this.top(u), '얼어붙어 움직이지 못한다', 'st'); sfx('guard'); await wait(420);
      for (const k of ['weak', 'vuln']) if (u.cs[k]) u.cs[k]--;
      return;
    }
    const it = u.intent || { k: 'atk', name: '공격', dmg: 4 };
    u.cs.mirror = 0; if (u.cs.cloud) { u.cs.cloud = 0; tween(u.mesh.material.uniforms.opacity, { value: 1 }, 200); }
    u.acted = true; u.lastK = it.k; u.charging = null;
    if (it.k === 'stun') { popText(...this.top(u), '흔들림', 'st'); await wait(320); }
    else if (it.gm && !it.mul) await this.gimmick(u, it);
    else if (it.k === 'guard') { this.help(`${u.name} 「${it.name}」 — 대비`); this.setPose(u, 'cast'); u.st.shield += it.shield; popText(...this.top(u), '대비 +' + it.shield, 'qi'); sfx('buff'); await wait(380); this.setPose(u, 'idle'); }
    else if (it.k === 'drain') {
      this.help(`<span class="red">${u.name} 「${it.name}」 — 산공!</span>`); this.setPose(u, 'cast');
      await this.castFx(u, { vfx: 'poison' }, [this.hero]); this.setPose(u, 'idle');
      this.drainNext += 1; this.setTier(this.tier - 1); popText(...this.top(this.hero), '산공! 주천−1 · 다음 내력−1', 'warn'); await wait(300);
    } else {
      const hp0 = this.hero.hp;
      if (it.k === 'ult' && u.seq && u.seq.ult) await this[ULT_MOVE[u.id] || 'ultBasic'](u, it);
      else {
        if (it.k === 'ult') await this.cutin(it.name, u, true);
        await this.useSkill(u, { name: it.name, dmg: it.dmg, hits: it.hits || 1, target: 'one', vfx: it.vfx || 'slash', fx: {} }, [this.hero]);
      }
      if (it.k === 'leech' && hp0 > this.hero.hp) { this.heal(u, (hp0 - this.hero.hp) * 2); this.gmSay(it.say); }
      if (it.k === 'wound' && hp0 > this.hero.hp && this.hero.alive) { const h = this.hero; h.maxHp = Math.max(20, h.maxHp - it.cut); h.hp = Math.min(h.hp, h.maxHp); popText(...this.top(h), `최대 체력 −${it.cut}`, 'warn'); shake(3, 200); this.refreshPanel(); }
    }
    if (it.k === 'ult') u.tier = 1; else if (it.k !== 'stun') u.tier = Math.min(3, (u.tier || 1) + (it.k === 'drain' ? 2 : 1)); // 절초를 쓰면 1단으로
    for (const k of ['weak', 'vuln']) if (u.cs[k]) u.cs[k]--;
    if (u.alive) this.nextIntent(u);
  }
  async ultCut(u, it, title, col) { // 장문인 절초 컷신: 주인공 절초와 같은 무대에 적의 얼굴
    music.duck(0.35, 1150); sfx('charge'); flashScreen('#000', 420, 0.75);
    const e = el('div', 'jcut', `<i class="lb t"></i><i class="lb b"></i><div class="sl"></div><img class="pt" src="${u.bigImg || u.img}"><div class="tx"><div class="jt">${title}</div><div class="jn">${it.name}</div></div>`, this.ui);
    e.style.setProperty('--j1', col[0]); e.style.setProperty('--j2', col[2]); e.style.setProperty('--j3', col[1]);
    await wait(240); sfx('boom'); shake(3, 220);
    await wait(760); e.classList.add('out'); await wait(200); e.remove();
  }
  bladeLine(x, y, a, len, cols, delay = 0) { // 도트로 그은 칼날 한 줄기: 양 끝으로 벌어지며 사라진다
    for (let i = -len; i <= len; i++) spawn({ x: x + Math.cos(a) * i, y: y + Math.sin(a) * i, vx: Math.cos(a) * i * 2, vy: Math.sin(a) * i * 2, life: 190 + (len - Math.abs(i)) * 5, size: Math.abs(i) < len * 0.5 ? 2 : 1, col: Math.abs(i) < len * 0.25 ? '#ffffff' : pick(cols), delay });
  }
  feathers(x, y, n, spread = 40, delay = 0) { // 깃털: 천천히 흔들리며 떨어진다
    for (let i = 0; i < n; i++) spawn({ x: x + R(-spread, spread), y: y + R(-spread * 0.4, spread * 0.6), vx: R(-22, 22), vy: R(-6, 26), ax: R(-14, 14), ay: -28, drag: 1.1, life: R(650, 1300), size: Math.random() < 0.3 ? 2 : 1, col: pick(['#ffffff', '#e8fff8', '#a0e8d8']), delay: delay + i * 6 });
  }
  // ── 절초 공통 뼈대: 컷신·어둠 → 안무 → 타격을 나눠(합은 의도에 적힌 피해 그대로, 마지막이 크다) → 잔심 ──
  ultParts(d, n) { const e = Math.max(1, Math.floor(d * 0.6 / Math.max(1, n - 1))), a = Array(n - 1).fill(e); a.push(Math.max(1, d - e * (n - 1))); return a; }
  ultHit(u, it, dmg, i, last, vfx = 'none') { this.hitOne(u, this.hero, { name: it.name, dmg, hits: 1, target: 'one', vfx, fx: {} }, last, i); }
  ultPose(u, k) { this.setPose(u, 'ult', k); }
  ultMid(u) { return (u.mesh.position.x + this.hero.mesh.position.x) / 2; } // 세로 화면에서도 둘 다 보이게 둘 사이를 당긴다
  async ultOpen(u, it, col, dark) {
    this.help('');
    await this.ultCut(u, it, `절 초 · ${u.title || ''}`, col);
    tween(this.bg.material.uniforms.tint.value, { r: dark[0], g: dark[1], b: dark[2] }, 260);
  }
  async ultClose(u, ms = 360) { tween(this.bg.material.uniforms.tint.value, { r: 1, g: 1, b: 1 }, 360); await wait(ms); await this.dashBack(u); }
  async ultRush(u, ms = 110) { const h = this.hero; this.trail(u, 4, 20); sfx('slash'); await tween(u.mesh.position, { x: h.mesh.position.x - (h.w / 2 + u.w / 2 - 14), y: h.mesh.position.y - 1 }, ms, ease.in); u.mesh.renderOrder = h.mesh.renderOrder + 1; }
  ultCenter() { return this.center(this.hero); }
  async ultCrane(u, it) { // 청성 학명구천: 낮게 모아 → 솟구쳐 학 날개를 펼치고 → 내리꽂으며 칼날 아홉 줄기 → 잔심
    const h = this.hero, gy = u.mesh.position.y, cols = ['#a0f0e0', '#60d0c0', '#e8fff8'];
    await this.ultOpen(u, it, ['#60e0d0', '#ffffff', '#003028'], [0.35, 0.45, 0.5]);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), gy + 30, 1.06, 460, 300);
    const [cx, cy] = this.center(u);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 4, r = 46; spawn({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.8, vy: -Math.sin(a) * r * 1.7, drag: 1.5, life: 380, size: 1, col: pick(cols), delay: i * 7 }); }
    await wait(460);
    this.ultPose(u, 1); sfx('slash'); this.trail(u, 5, 28); burst(u.mesh.position.x, gy + 2, { n: 18, cols: ['#d8c8a8', '#a89878', '#ffffff'], spd: [30, 110], ang: [0, Math.PI], life: [180, 360], size: [1, 2] });
    await tween(u.mesh.position, { x: u.mesh.position.x + 34, y: Math.min(gy + 44, 240 - 118) }, 230, ease.out); // 가장 큰 프레임도 화면 안에
    this.ultPose(u, 2); sfx('crane'); u.mesh.renderOrder = 3000;
    const [ax, ay] = this.center(u), wing = this.sprite(craneTex(), ax, ay - 6, { scale: [0.5, 1.9], rot: 0, ms: 620, op: 0.85 });
    wing.renderOrder = 2900; wing.material.uniforms.tint.value.set('#a0f0e0');
    slowmo(0.35, 420); camZoom(this.ultMid(u), ay, 1.1, 240, 200); flashScreen('#e8fff8', 120, 0.4); this.feathers(ax, ay, 46, 52);
    await wait(170);
    this.ultPose(u, 3); await this.ultRush(u, 90); this.ultPose(u, 4);
    const P = this.ultParts(it.dmg, 3);
    for (let i = 0; i < 3 && h.alive; i++) {
      const [x, y] = this.ultCenter();
      for (let k = 0; k < 3; k++) this.bladeLine(x + R(-16, 16), y + R(-16, 16), R(0.5, 2.6), 26 + i * 6, cols, k * 30);
      this.ultHit(u, it, P[i], i, i === 2); await wait(i === 2 ? 240 : 120);
    }
    if (h.alive) { const [x, y] = this.ultCenter(); ring(x, h.mesh.position.y + 2, 10, ['#e0d0b0', '#ffffff'], 28, 150); this.feathers(x, y, 30, 44); }
    await this.ultClose(u, 420);
  }
  async ultPalm(u, it) { // 소림 여래신장: 금빛이 차오르고 → 거대한 손바닥이 내려찍는다
    const h = this.hero, gold = ['#ffd040', '#fff0a0', '#ff9020', '#ffffff'], T = vfxTex();
    await this.ultOpen(u, it, ['#ffc040', '#ffffff', '#402000'], [0.45, 0.36, 0.28]);
    const [cx, cy] = this.center(u);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), cy, 1.06, 420, 300); this.sprite(T.manja, cx, cy, { scale: [0.8, 2.4], rot: 0, spin: 0.9, ms: 560, op: 0.9 });
    for (let i = 0; i < 44; i++) spawn({ x: cx + R(-34, 34), y: cy - 34 + R(-6, 6), vy: R(40, 110), life: R(300, 520), size: R(1, 3), col: pick(gold), delay: i * 8 });
    await wait(420);
    this.ultPose(u, 1); await wait(200);
    this.ultPose(u, 2); await tween(u.mesh.position, { x: u.mesh.position.x + 16 }, 110, ease.out);
    this.ultPose(u, 3); sfx('boom'); shake(3, 200);
    const [hx, hy] = this.ultCenter(), m = this.sprite(palmTex(), hx - 70, 214, { scale: [0.45, 1.05], rot: -0.25, ms: 560, op: 1 });
    for (let i = 0; i < 40; i++) spawn({ x: hx - 70 + (70 * i) / 40 + R(-26, 26), y: 214 + (hy - 214) * i / 40 + R(-26, 26), life: 300, size: R(1, 3), col: pick(gold), delay: i * 5 });
    await tween(m.position, { x: hx, y: hy + 8 }, 210, ease.in);
    const P = this.ultParts(it.dmg, 2);
    sfx('gong'); this.ultHit(u, it, P[0], 0, false); burst(hx, hy, { n: 30, cols: gold, spd: [60, 200], size: [1, 3] }); await wait(130);
    if (h.alive) { this.ultHit(u, it, P[1], 1, true); flashScreen('#fff0a0', 140, 0.6); ring(hx, h.mesh.position.y + 2, 10, gold, 34, 190); ring(hx, hy, 18, gold, 26, 130); burst(hx, hy, { n: 50, cols: gold, spd: [60, 240], up: 30, size: [1, 3] }); }
    this.ultPose(u, 4); await this.ultClose(u, 460);
  }
  dragonRush(x0, y0, x1, y1, cols, ms = 300) { // 물결치며 날아가는 용: 길을 따라 차례로 켜지는 도트 띠
    const n = 90, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = Math.sin(t * Math.PI * 3.5) * 16 * (1 - t * 0.5), x = x0 + dx * t + nx * w, y = y0 + dy * t + ny * w;
      for (let k = -4; k <= 4; k++) if (Math.abs(k) < 3 + (i % 3 === 0 ? 2 : 0)) spawn({ x: x + nx * k * 2, y: y + ny * k * 2, life: 300 - Math.abs(k) * 20, size: Math.abs(k) < 2 ? 3 : 2, col: k ? pick(cols) : '#ffffff', delay: t * ms });
    }
    for (let i = 0; i < 40; i++) spawn({ x: x1 + R(-12, 12), y: y1 + R(-12, 12), vx: R(-120, 120), vy: R(-80, 120), drag: 3, life: R(200, 420), size: R(2, 4), col: pick(cols), delay: ms });
  }
  async ultDragon(u, it) { // 개방 항룡유회: 취한 듯 젖혔다가 → 뛰어들어 → 쌍장에서 금룡이 뻗는다
    const h = this.hero, gy = u.mesh.position.y, gold = ['#ffe040', '#ffb020', '#ff8000', '#fff0a0'];
    await this.ultOpen(u, it, ['#ffb030', '#ffffff', '#302000'], [0.42, 0.36, 0.3]);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), gy + 30, 1.06, 480, 300); await wait(360);
    this.ultPose(u, 1); await tween(u.mesh.position, { x: u.mesh.position.x + 22 }, 130, ease.in);
    this.ultPose(u, 2); this.trail(u, 4, 24); sfx('slash'); await tween(u.mesh.position, { x: u.mesh.position.x + 26, y: gy + 16 }, 160, ease.out);
    this.ultPose(u, 3); u.mesh.position.y = gy; sfx('roar'); shake(4, 300);
    const [ux, uy] = this.center(u), [hx, hy] = this.ultCenter(); this.dragonRush(ux + 30, uy, hx, hy, gold, 280);
    await wait(280);
    const P = this.ultParts(it.dmg, 3);
    for (let i = 0; i < 3 && h.alive; i++) { this.ultHit(u, it, P[i], i, i === 2); ring(hx, hy, 8 + i * 8, gold, 22, 130); await wait(i === 2 ? 220 : 110); }
    this.ultPose(u, 4); await this.ultClose(u, 420);
  }
  async ultTaiji(u, it) { // 무당 태극혜검: 검으로 원을 그리면 발밑에 태극이 돌고 → 뻗어 세 번 가른다
    const h = this.hero, cols = ['#c8e0ff', '#ffffff', '#80a0e0'], T = vfxTex();
    await this.ultOpen(u, it, ['#a0c0ff', '#ffffff', '#101830'], [0.32, 0.36, 0.5]);
    const [hx, hy] = this.ultCenter(), gy = h.mesh.position.y, disc = this.sprite(T.taiji, hx, hy, { scale: [0.8, 4.2], rot: 0, spin: 7, ms: 1500, op: 0.85 });
    disc.renderOrder = h.mesh.renderOrder - 1; sfx('bell'); camZoom(this.ultMid(u), hy, 1.06, 700, 300);
    for (let f = 0; f < 3; f++) {
      this.ultPose(u, f);
      for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + f, r = 40 - f * 8; spawn({ x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 70, vy: Math.cos(a) * 42, life: 300, size: 1, col: pick(cols), delay: i * 8 }); }
      await wait(250);
    }
    this.ultPose(u, 3); await this.ultRush(u, 120);
    const P = this.ultParts(it.dmg, 3);
    for (let i = 0; i < 3 && h.alive; i++) { this.bladeLine(hx, hy, i * 1.05 + 0.4, 34, cols); this.bladeLine(hx, hy, i * 1.05 + 1.97, 22, cols, 30); this.ultHit(u, it, P[i], i, i === 2); await wait(i === 2 ? 240 : 130); }
    this.ultPose(u, 4); await this.ultClose(u, 400);
  }
  lightPillar(x, gy, w, cols) { for (let y = 240; y > gy; y -= 2) for (let d = -w; d <= w; d += 2) spawn({ x: x + d, y, life: R(170, 320), size: 2, col: Math.abs(d) < w * 0.45 ? '#ffffff' : pick(cols), delay: (240 - y) * 0.7 }); }
  async ultLight(u, it) { // 아미 금정불광: 합장한 뒤 빛을 칼끝에 모아 → 내리그으면 금빛 기둥이 솟는다
    const h = this.hero, gold = ['#ffe080', '#fff4c0', '#ffc040'];
    await this.ultOpen(u, it, ['#ffe080', '#ffffff', '#403010'], [0.38, 0.34, 0.34]);
    const [cx, cy] = this.center(u);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), cy, 1.06, 620, 300); ring(cx, cy + 10, 18, gold, 30, 16); await wait(260);
    this.ultPose(u, 1); await wait(180);
    this.ultPose(u, 2); sfx('buff'); const tx = cx + 6, ty = cy + 50; for (let i = 0; i < 44; i++) { const a = R(0, 6.28), r = R(30, 60); spawn({ x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, life: 300, size: R(1, 2), col: pick(gold), delay: i * 5 }); }
    await wait(320); flashScreen('#fff4c0', 120, 0.5);
    this.ultPose(u, 3); sfx('slash');
    const [hx, hy] = this.ultCenter(), gy = h.mesh.position.y, ux = u.mesh.position.x + 30;
    for (let k = 0; k < 9; k++) { const x = ux + (hx - ux) * k / 8; for (let i = 0; i < 8; i++) spawn({ x: x + R(-3, 3), y: gy + i * 3, life: 200, size: 2, col: pick(gold), delay: k * 22 }); }
    await wait(200); sfx('bell'); sfx('boom'); this.lightPillar(hx, gy, 18, gold); shake(4, 300);
    const P = this.ultParts(it.dmg, 2);
    this.ultHit(u, it, P[0], 0, false); await wait(150);
    if (h.alive) { this.ultHit(u, it, P[1], 1, true); ring(hx, gy + 2, 10, gold, 34, 170); ring(hx, hy, 14, gold, 24, 120); }
    this.ultPose(u, 4); await this.ultClose(u, 460);
  }
  async ultBloom(u, it) { // 화산 매화만개: 꽃잎이 소용돌이치고 → 파고들어 다섯 번 → 한 송이가 활짝
    const h = this.hero, pink = ['#ffb0d0', '#ff70a0', '#ffffff', '#ffd0e0'];
    await this.ultOpen(u, it, ['#ff90b0', '#ffffff', '#400818'], [0.42, 0.3, 0.36]);
    const [cx, cy] = this.center(u);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), cy, 1.06, 460, 300);
    for (let i = 0; i < 54; i++) { const a = i / 54 * Math.PI * 6, r = 50; spawn({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 2.4, vy: -Math.sin(a) * r * 1.7, drag: 1.4, life: 420, size: R(1, 3), col: pick(pink), delay: i * 6 }); }
    await wait(440);
    this.ultPose(u, 1); await this.ultRush(u, 100);
    const P = this.ultParts(it.dmg, 5), F = [1, 2, 3, 2, 4];
    for (let i = 0; i < 5 && h.alive; i++) {
      this.ultPose(u, F[i]); const [x, y] = this.ultCenter(), last = i === 4;
      burst(x, y, { n: last ? 20 : 14, cols: pink, spd: [40, 150], up: 20, size: [1, 3] });
      if (last) { sfx('petal'); const m = this.sprite(plumTex(), x, y, { scale: [0.25, 1.2], rot: 0, spin: 0.6, ms: 680, op: 1 }); m.renderOrder = h.mesh.renderOrder - 1; flashScreen('#ffd0e0', 130, 0.5); for (let k = 0; k < 80; k++) { const a = R(0, 6.28), v = R(40, 190); spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 1.6, ay: -30, life: R(500, 1100), size: R(1, 3), col: pick(pink) }); } }
      this.ultHit(u, it, P[i], i, last); await wait(last ? 260 : 90);
    }
    await this.ultClose(u, 460);
  }
  async ultDipper(u, it) { // 종남 천강북두: 하늘을 가리키면 일곱 별이 차례로 뜨고 → 내리찍으면 별마다 낙뢰
    const h = this.hero, gy0 = u.mesh.position.y, blue = ['#c0e0ff', '#60a0ff', '#ffffff'];
    await this.ultOpen(u, it, ['#80b0ff', '#ffffff', '#081028'], [0.22, 0.26, 0.42]);
    const [hx, hy] = this.ultCenter(), D = [[-52, 64], [-34, 74], [-14, 70], [4, 62], [14, 44], [36, 40], [42, 60]].map(([a, b]) => [hx + a, Math.min(226, hy + b)]);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), hy + 20, 1.05, 760, 300);
    for (let i = 0; i < 7; i++) {
      const [x, y] = D[i]; sfx('star');
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; spawn({ x, y, vx: Math.cos(a) * 34, vy: Math.sin(a) * 34, drag: 4, life: 720, size: k % 2 ? 1 : 2, col: '#ffffff' }); }
      spawn({ x, y, life: 900 - i * 60, size: 4, col: '#ffffff' });
      if (i) { const [a, b] = D[i - 1]; for (let k = 0; k <= 10; k++) spawn({ x: a + (x - a) * k / 10, y: b + (y - b) * k / 10, life: 780 - i * 60, size: 1, col: '#80b0ff', delay: k * 6 }); }
      await wait(80);
    }
    this.ultPose(u, 1); await wait(120);
    this.ultPose(u, 2); this.trail(u, 3, 26); sfx('slash'); await tween(u.mesh.position, { x: u.mesh.position.x + 24, y: Math.min(gy0 + 30, 112) }, 170, ease.out); await wait(80);
    this.ultPose(u, 3); await tween(u.mesh.position, { y: gy0 }, 70, ease.in); sfx('thunder'); shake(4, 300); flashScreen('#c0e0ff', 110, 0.45);
    this.ultPose(u, 4);
    const P = this.ultParts(it.dmg, 7), gy = h.mesh.position.y;
    for (let i = 0; i < 7 && h.alive; i++) {
      const [x, y] = D[i], tx = hx + R(-6, 6), n = 18, last = i === 6;
      for (let k = 0; k <= n; k++) { const t = k / n; spawn({ x: x + (tx - x) * t + (k % n ? R(-4, 4) : 0), y: y + (gy + 20 - y) * t, life: 170, size: k % 3 ? 2 : 3, col: k % 2 ? '#ffffff' : pick(blue) }); }
      this.ultHit(u, it, P[i], i, last); await wait(last ? 260 : 70);
    }
    if (h.alive) ring(hx, gy + 2, 10, blue, 30, 170);
    await this.ultClose(u, 420);
  }
  whirl(x, gy, ms, cols) { // 위로 넓어지는 회오리
    for (let i = 0; i < 150; i++) { const t = i / 150, a = t * Math.PI * 14, h = t * 100, r = 8 + h * 0.34; spawn({ x: x + Math.cos(a) * r, y: gy + h, vx: -Math.sin(a) * 56, vy: 16, life: 300, size: i % 3 ? 1 : 2, col: pick(cols), delay: t * ms }); }
  }
  async ultCloud(u, it) { // 곤륜 운룡승천: 회오리가 주인공을 띄우고 → 함께 솟구쳤다가 → 내리꽂아 떨어뜨린다
    const h = this.hero, gy = u.mesh.position.y, cols = ['#ffffff', '#c8e0f0', '#80b0d0'], hy0 = h.mesh.position.y;
    await this.ultOpen(u, it, ['#b0d8f0', '#ffffff', '#102838'], [0.36, 0.44, 0.52]);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), gy + 40, 1.05, 760, 300);
    const hx = h.mesh.position.x; sfx('gale'); this.whirl(hx, hy0, 620, cols); await wait(300);
    this.ultPose(u, 1); sfx('slash'); this.trail(u, 5, 24); tween(h.mesh.position, { y: hy0 + 24 }, 260, ease.out);
    await tween(u.mesh.position, { x: u.mesh.position.x + 30, y: Math.min(gy + 30, 112) }, 240, ease.out);
    this.ultPose(u, 2); slowmo(0.4, 300); await wait(110);
    this.ultPose(u, 3); await this.ultRush(u, 100); u.mesh.position.y = hy0;
    const P = this.ultParts(it.dmg, 3);
    for (let i = 0; i < 3 && h.alive; i++) { const [x, y] = this.ultCenter(); this.bladeLine(x, y, 2.2 - i * 0.6, 30, cols); this.ultHit(u, it, P[i], i, i === 2); if (i === 2) { h.mesh.position.y = hy0; shake(4, 260); ring(x, hy0 + 2, 10, cols, 32, 180); } await wait(i === 2 ? 240 : 110); }
    h.mesh.position.y = hy0; this.ultPose(u, 4); await this.ultClose(u, 420);
  }
  async ultSeven(u, it) { // 공동 칠상연환: 달려들어 일곱 번 — 맞을 때마다 다른 빛의 충격파
    const h = this.hero, C = ['#ff5040', '#ff9030', '#ffe040', '#60e060', '#40c0ff', '#6080ff', '#c060ff'], F = [1, 2, 3, 1, 2, 3, 4], gy = u.mesh.position.y;
    await this.ultOpen(u, it, ['#e0a060', '#ffffff', '#301808'], [0.42, 0.34, 0.3]);
    this.ultPose(u, 0); sfx('charge'); camZoom(this.ultMid(u), gy + 30, 1.05, 420, 300); burst(u.mesh.position.x, gy + 2, { n: 16, cols: ['#d8c8a8', '#a89878'], spd: [30, 90], ang: [0, Math.PI], size: [1, 2] }); await wait(380);
    await this.ultRush(u, 120);
    const P = this.ultParts(it.dmg, 7);
    for (let i = 0; i < 7 && h.alive; i++) {
      this.ultPose(u, F[i]); const [x, y] = this.ultCenter(), last = i === 6; ring(x + R(-6, 6), y + R(-8, 8), 4 + i * 2, [C[i], '#ffffff'], 18 + i * 2, 110 + i * 14);
      if (last) { flashScreen(C[i], 110, 0.4); burst(x, y, { n: 50, cols: C, spd: [60, 230], size: [1, 3] }); }
      this.ultHit(u, it, P[i], i, last); await wait(last ? 280 : 72);
    }
    await this.ultClose(u, 420);
  }
  async ultBasic(u, it) { // 일반 보스: 컷을 늘린 공용 절초 — 웅크렸다가 → 달려들어 → 치켜들고 → 내리친다
    const h = this.hero;
    this.help(`<span class="red">${u.name} 「${it.name}」</span>`);
    await this.cutin(it.name, u, true);
    this.ultPose(u, 0); sfx('charge'); await wait(300);
    this.ultPose(u, 1); await this.ultRush(u, 130);
    this.ultPose(u, 2); await wait(90);
    this.ultPose(u, 3);
    const P = this.ultParts(it.dmg, 2), v = it.vfx || 'slash';
    this.ultHit(u, it, P[0], 0, false, v); await wait(130);
    if (h.alive) this.ultHit(u, it, P[1], 1, true, v);
    this.ultPose(u, 4); await wait(260); await this.dashBack(u);
  }
  async budTick() { // 화산 꽃봉오리: 내 차례가 끝날 때마다 하나씩 줄고, 다 되면 만개
    for (const u of this.enemies) {
      const b = u.cs.bud; if (!b || --b.t > 0) continue;
      u.cs.bud = null; const h = this.hero, [x, y] = this.center(h), n = Math.round(u.intents.find(i => i.k === 'ult').dmg * 0.8);
      const m = this.sprite(plumTex(), x, y, { scale: [0.3, 1.25], rot: 0, spin: 0.6, ms: 620, op: 1 }); m.renderOrder = h.mesh.renderOrder - 1; flashScreen('#ffd0e0', 130, 0.5);
      for (let k = 0; k < 60; k++) { const a = R(0, 6.28), v = R(40, 180); spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 1.6, ay: -30, life: R(500, 1000), size: R(1, 3), col: pick(['#ffb0d0', '#ff70a0', '#ffffff']) }); }
      this.banner('꽃봉오리가 만개했다!', 'red'); this.damage(h, n, { src: u }); await wait(420);
    }
  }
  gmSay(say) { this.banner(say, 'red gm', Math.max(2400, say.length * 110)); } // 읽을 시간을 글 길이만큼
  async gimmick(u, it) { // 보스의 제 수: 지금 알려 주고, 효과는 다음 내 차례에 닿는다
    const h = this.hero, [x, y] = this.center(u), [hx, hy] = this.center(h), front = { parent: this.group, layer: 4200 };
    this.help(`<span class="red">${u.name} 「${it.name}」</span>`);
    this.setPose(u, 'cast');
    if (it.big) await this.cutin(it.name, u, true); else { sfx('charge'); await wait(260); }
    switch (it.k) {
      case 'seal': { const c = SEAL[it.style].emb; playFx('phase2', x, y, { ...front, tint: it.style === 'dark' ? '#a040ff' : it.style === 'ice' ? '#80c0ff' : '#c0c0d0' }); for (let i = 0; i < 40; i++) spawn({ x, y, vx: (160 - x) * 3 + R(-40, 40), vy: -y * 3 + R(-30, 30), life: 340, size: R(1, 3), col: pick(c), delay: i * 6 }); sfx('burn'); this.sealNext = { n: it.n, style: it.style, costly: it.costly }; break; }
      case 'gale': playFx('wind', h.mesh.position.x, h.mesh.position.y + 1, front); if (h.st.shield) { popText(hx, hy + 14, '호신 날아감', 'warn'); h.st.shield = 0; } this.drawLess = 1; sfx('slash'); break;
      case 'tide': playFx('wave', hx, h.mesh.position.y + 1, front); h.gauge -= it.n; sfx('poison'); break;
      case 'venom': playFx('poison', hx, hy, front); this.venom = 1; sfx('poison'); break;
      case 'array': playFx('taijiCast', h.mesh.position.x, h.mesh.position.y + 1, front); ring(hx, h.mesh.position.y + 2, 14, ['#d0b0ff', '#ffffff'], 28, 40); h.cs.array = it.n; sfx('buff'); break;
      case 'shade': this.trail(u, 4, 40); u.cs.evade = 1; sfx('miss'); break;
      case 'curse': playFx('poison', hx, hy, front); for (let i = 0; i < it.n; i++) this.pile.push('dokgi'); sfx('poison'); break;
      case 'iron': { u.st.shield += Math.round(u.maxHp * it.n); u.cs.iron = 1; u.mesh.material.uniforms.tint.value.setRGB(1.3, 1.12, 0.65); ring(x, y, 14, ['#ffd860', '#ffffff'], 34, 60); sfx('buff'); break; }
      case 'mirror': playFx('taijiCast', u.mesh.position.x, u.mesh.position.y + 1, front); u.cs.mirror = 1; ring(x, y, 22, ['#d0e0ff', '#ffffff'], 30, 30); sfx('buff'); break;
      case 'bud': { const m = this.sprite(plumTex(), hx, hy + 20, { scale: [0.1, 0.5], rot: 0, ms: 520, op: 1 }); m.renderOrder = 4300; u.cs.bud = { left: Math.round(u.maxHp * it.n), t: it.t }; for (let i = 0; i < 26; i++) spawn({ x, y, vx: (hx - x) * 3 + R(-30, 30), vy: (hy - y) * 3 + R(-30, 30), life: 340, size: R(1, 2), col: pick(['#ffb0d0', '#ff70a0', '#ffffff']), delay: i * 6 }); sfx('buff'); break; }
      case 'summon': {
        const free = [[46, 118], [146, 76]].filter(s => !this.enemies.some(e => Math.abs(e.home[0] - s[0]) < 20 && Math.abs(e.home[1] - s[1]) < 40));
        for (const s of free) { const b = this.makeUnit(enemyStats(it.id, this.region), 'enemy', s); b.mesh.material.uniforms.opacity.value = 0; tween(b.mesh.material.uniforms.opacity, { value: 1 }, 300); burst(s[0], s[1] + 16, { n: 24, cols: ['#d8c8a8', '#a89878', '#ffffff'], spd: [20, 90], up: 20 }); }
        sfx(free.length ? 'boom' : 'buzz'); if (!free.length) it = { ...it, say: '자리가 없어 아무도 오지 못했다' }; break;
      }
      case 'pray': { for (const k of ['weak', 'vuln', 'bleed', 'poison', 'frost']) u.cs[k] = 0; this.heal(u, u.maxHp * it.n); ring(x, y, 12, ['#fff0a0', '#ffffff'], 30, 60); for (let i = 0; i < 40; i++) spawn({ x: x + R(-22, 22), y: y - 26 + R(-4, 4), vy: R(30, 80), life: R(320, 620), size: R(1, 2), col: pick(['#fff0a0', '#ffffff', '#ffd860']), delay: i * 8 }); break; }
      case 'haste': this.trail(u, 5, 24); burst(u.mesh.position.x, u.mesh.position.y + 2, { n: 18, cols: ['#a0f0e0', '#ffffff'], spd: [40, 120], ang: [0, Math.PI] }); u.gauge = 100; sfx('slash'); break;
      case 'tierlock': this.setTier(1); h.cs.tlock = 1; ring(hx, h.mesh.position.y + 2, 12, ['#80a0ff', '#ffffff'], 30, 40); shake(3, 220); sfx('boom'); this.refreshCards(); break;
      case 'cloud': u.cs.cloud = 1; tween(u.mesh.material.uniforms.opacity, { value: 0.45 }, 260); for (let i = 0; i < 50; i++) spawn({ x: x + R(-34, 34), y: y + R(-40, 30), vx: R(-16, 16), vy: R(-4, 12), drag: 1, life: R(500, 1000), size: R(2, 3), col: pick(['#ffffff', '#e0f0ff', '#c8d8e8']), delay: i * 5 }); sfx('miss'); break;
    }
    this.gmSay(it.say); this.refreshPanel();
    await wait(1000); this.setPose(u, 'idle');
  }
  async applySeal() { // 패를 태운다: 불길이 아래에서 타올라 이번 차례 못 낸다
    const s = this.sealNext; if (!s) return; this.sealNext = null;
    const can = this.hand.filter(v => !CARDS[v.id].token), go = (s.costly ? can.sort((a, b) => this.cost(CARDS[b.id]) - this.cost(CARDS[a.id])) : shuffle(can)).slice(0, s.n), C = SEAL[s.style];
    flashScreen(C.flash, 420, 0.7); shake(3, 260);
    for (const v of go) {
      await wait(150); sfx('burn');
      v.sealed = s.style; v.el.classList.add('sealing', 'sealed', s.style); this.refreshCards();
      for (let i = 0; i < 16; i++) { const e = el('i', 'emb', null, v.el); e.style.cssText = `left:${R(4, 94)}%;top:${R(20, 95)}%;background:${pick(C.emb)};animation-delay:${Math.round(R(0, 320))}ms`; }
      await wait(380);
      v.el.classList.remove('sealing'); v.el.querySelectorAll('.emb').forEach(e => e.remove());
    }
    if (go.length) popText(...this.top(this.hero), `패 ${go.length}장 봉인`, 'warn');
  }
  // ── 피해 계산: 고정 수치(읽히는 전투). 연환 1장마다 +10% · 내상 +50% · 약화 −25% ──
  calc(a, t, sk) {
    if (sk.dmg == null) return super.calc(a, t, sk);
    let d = sk.dmg * (a.side === 'hero' ? (1 + (this.rel('soesasul') ? 0.2 : 0.1) * Math.max(0, this.chain - 1) + 0.1 * this.mixed) * this.relDmg(t) : 1) * (t.guard ? 0.5 : 1);
    if (t.cs && t.cs.vuln) d *= 1.5;
    if (t.cs && t.cs.frozen) d *= 1.25; // 얼어붙은 몸은 잘 부서진다
    if (a.cs && a.cs.weak) d *= 0.75;
    return { dmg: Math.max(1, Math.round(d)), crit: false };
  }
  relDmg(t) { const h = this.hero; return (this.rel('baesu') && h.hp <= h.maxHp / 2 ? 1.25 : 1) * (this.rel('pilhyeol') && t.cs && t.cs.bleed ? 1.25 : 1) * (this.rel('pimaeng') ? 1.15 : 1); } // 보물의 공격 피해 배율
  heal(t, n, quiet) { super.heal(t, t === this.hero && this.rel('pimaeng') ? n / 2 : n, quiet); }
  damage(t, d, o = {}) {
    const src = o.src;
    if (t.cs && t.cs.cloud && src === this.hero && !o.dot && !this.aoeNow) { popText(...this.top(t), '구름 속!', 'miss'); sfx('miss'); return; }
    if (t.cs && t.cs.evade && src === this.hero && !o.dot) { t.cs.evade = 0; popText(...this.top(t), '잔상!', 'miss'); sfx('miss'); this.ghost(t, '#c0c0ff'); return; }
    if (t === this.hero && src && src !== t && t.alive) {
      if (t.cs.parry && src.lastK === 'ult') popText(...this.top(t), '절초는 못 되친다', 'warn'); // 절초엔 절초 약화·호신
      else if (t.cs.parry) { // 되치기(태극권 등): 절반은 맞고 절반을 되돌린다 — 비무와 같은 규칙
        t.cs.parry--; const back = Math.ceil(d / 2); popText(...this.top(t), '되치기!', 'crit'); sfx('parry');
        playFx('taiji', ...this.center(t), { parent: this.group });
        super.damage(src, back, { dot: true }); this.returned += back; this.refreshPanel(); d -= back;
        if (!d) return;
      }
      if (t.cs.dodge) { t.cs.dodge--; d = Math.ceil(d / 2); popText(...this.top(t), '흘려막기', 'st'); }
      if (t.st.shield > 0) this.blocked += Math.min(t.st.shield, d);
      super.damage(t, d, o);
      if (t.cs.icewall && src.alive) this.addSt(src, 'frost', t.cs.icewall);
      if (t.cs.counter && src.alive) { popText(...this.top(src), '반격 ' + t.cs.counter, 'crit'); super.damage(src, t.cs.counter, { dot: true }); this.returned += t.cs.counter; }
      if (this.rel('gwisik') && !this.gwisikUsed && t.alive && t.hp < t.maxHp * 0.3) { this.gwisikUsed = true; popText(...this.top(t), '귀식대법!', 'crit'); this.heal(t, t.maxHp * 0.25); for (const u of this.enemies) this.interrupt(u); }
      return;
    }
    super.damage(t, d, o);
    if (t.cs && src === this.hero && !o.dot) {
      if (t.cs.poison && t.alive && this.rel('dokju')) t.cs.poison++;
      if (t.cs.mirror) { const b = Math.ceil(d / 2); popText(...this.top(this.hero), `되돌아왔다 −${b}`, 'warn'); super.damage(this.hero, b, { dot: true }); }
      if (t.cs.bud && t.alive && (t.cs.bud.left -= d) <= 0) { t.cs.bud = null; const [x, y] = this.center(this.hero); popText(x, y + 22, '봉오리를 깼다!', 'crit'); sfx('crit'); burst(x, y, { n: 30, cols: ['#ffb0d0', '#ffffff'], spd: [40, 160] }); }
    }
  }
  ended() { return this.downed && this.hero.alive && !this.yielded ? null : super.ended(); } // 최종보스가 쓰러져 있는 동안은 끝이 아니다
  async turn(u) { await super.turn(u); if (this.downed && this.hero.alive && !this.enemies.length) await this.nextAct(); }
  async nextAct() { // 최종보스 3막: 쓰러진 차례가 끝나면 호위를 부르고, 호위가 쓰러진 차례가 끝나면 되살아난다
    const t = this.downed, A = t.kit.acts, U = t.mesh.material.uniforms; this.help('');
    if (!t.guarded) {
      t.guarded = true; this.gmSay(A.call); sfx('boom'); shake(4, 300); await wait(500);
      const g = this.makeUnit(enemyStats(A.guard, this.region, { boss: A.k }), 'enemy', [136, 84]), M = g.mesh.material.uniforms.opacity; g.gauge = 30;
      M.value = 0; tween(M, { value: 1 }, 300); burst(...this.center(g), { n: 40, cols: ['#ffe080', '#ffffff', '#ff8060'], spd: [30, 130], up: 30 });
      await this.bossIntro(g, true); this.refresh(); return;
    }
    await this.cutin(A.name, t, true); music.play('final2');
    this.downed = null; t.act = 2; t.alive = true; t.phase2 = true; t.hp = t.lag = Math.round(t.maxHp * A.hp); t.cs = {}; t.st.shield = 0; t.tier = 2; t.gauge = 40; t.spd *= A.spd;
    t.intents = t.intents.map(i => ({ ...i, dmg: i.dmg && Math.round(i.dmg * A.mul), shield: i.shield && Math.round(i.shield * A.mul) })); this.nextIntent(t);
    this.setPose(t, 'idle'); U.tint.value.setRGB(...A.tint); tween(U.opacity, { value: 1 }, 300); tween(t.mesh.position, { x: t.home[0] }, 300, ease.out);
    const [x, y] = t.home; flashScreen('#fff0d0', 420, 0.85); shake(5, 420); sfx('boom'); playFx('phase2', x, y + t.size * 0.5, { parent: this.group, layer: t.mesh.renderOrder - 1 }); ring(x, y + t.size * 0.5, 18, ['#ffe080', '#ffffff', '#ff6040'], 46, 80);
    this.gmSay(A.rise); this.refresh(); await wait(700);
  }
  kill(t) {
    if (t.iceM) this.thaw(t);
    if (t.side === 'enemy' && t.cs && t.cs.poison && this.rel('odok')) { const n = Math.ceil(t.cs.poison / 2); for (const u of this.enemies) if (u !== t) this.addSt(u, 'poison', n); }
    if (t.kit && t.kit.acts && !t.act) { // 최종보스 1막의 끝: 쓰러지되 물러나 있다 — 이 차례가 끝나면 nextAct
      this.setPose(t, 'hurt'); t.alive = false; t.hp = 0; t.charging = null; t.act = 1; t.cs = {}; t.st.shield = 0; this.downed = t;
      const [x, y] = this.center(t); sfx('die'); flashScreen('#000', 300, 0.5); burst(x, y, { n: 30, cols: ['#ffffff', '#c0c0c0', '#ff6060'], spd: [20, 100], grav: -150, up: 60 });
      tween(t.mesh.position, { x: t.home[0] - 44 }, 500, ease.out); tween(t.mesh.material.uniforms.opacity, { value: 0.4 }, 500); return;
    }
    if (t.kit && t.kit.undying && !t.risen) { // 한 번 되살아난다
      t.risen = true; t.hp = Math.round(t.maxHp * t.kit.undying); t.tier = 1; this.nextIntent(t);
      const [x, y] = this.center(t); flashScreen('#102030', 400, 0.7); burst(x, y, { n: 50, cols: ['#60e0d0', '#a0fff0', '#ffffff'], spd: [20, 110], up: 30 }); sfx('charge');
      popText(x, y + 22, '기시회생!', 'warn'); this.banner(`${t.name}이(가) 되살아났다!`, 'red');
      tween(t.mesh.position, { x: t.home[0] }, 300); return;
    }
    super.kill(t);
    if (t.ib) t.ib.style.display = 'none';
    if (t.side === 'enemy' && this.rel('hyeolpae')) this.heal(this.hero, 4);
    if (t.side === 'enemy' && this.planning) { this.energy++; this.drawCards(1); popText(...this.top(t), '여세! 내력+1', 'crit'); }
  }
  async phase2(u) { // 2페이즈: 약화를 털어 내고 곧바로 바뀐 제 수를 쓴다
    music.play('final2');
    await super.phase2(u);
    for (const k of ['weak', 'vuln', 'bleed', 'frost']) u.cs[k] = 0; if (u.iceM) this.thaw(u);
    if (u.kit && u.kit.phase) { u.tier = 2; this.nextIntent(u); }
  }
  // ── 내 차례 ──
  plannedGauge() { return Math.max(-70, 30 - 20 * this.weight); } // 무게만큼 다음 차례가 늦다
  async heroTurn(h) {
    this.planning = true; this.chain = 0; this.attacks = 0; this.guards = 0; this.darts = 0; this.weight = 0; this.turnsTaken = (this.turnsTaken || 0) + 1; // 기록용
    const R = k => this.run.relics.includes(k);
    const keep = this.powers.bulgoe ? 2 : (this.powers.bulgoeH ? 1 : 0) + (R('geumgangR') ? 1 : 0); // 금강불괴(심법)·금강 염주: 하나면 절반, 둘이면 전부
    h.st.shield = keep >= 2 ? h.st.shield : keep ? Math.floor(h.st.shield / 2) : 0;
    h.cs.counter = 0; h.cs.parry = 0; h.cs.dodge = 0; h.cs.icewall = 0; h.cs.venom = this.venom || 0; this.venom = 0; // 반격·되치기·흘려막기는 다음 내 차례까지만
    if (this.powers.chwipal && h.hp <= h.maxHp / 2) { h.cs.dodge = 1; popText(...this.top(h), '취팔선 — 흘려막기', 'st'); }
    if (this.useRes && !R('maehwa')) this.res = Math.floor(this.res / 2);
    this.mixed = 0; this.lastSchool = null; this.petalBonus = 0;
    if (this.tier === 3) { this.heat++; if (this.heat >= 2 && !R('cheongsim')) await this.qiDeviation(h); } else this.heat = 0;
    if (this.run.school === 'sorim' && this.tier === 1) { this.low = (this.low || 0) + 1; if (this.low >= 2) { this.low = 0; this.setTier(2); popText(...this.top(h), '기가 차오른다!', 'qi'); } } else this.low = 0; // 소림: 1단에 머물면 기가 차올라 단이 오른다
    this.energy = 3 + (R('heavy') ? 1 : 0) + (this.tier === 1 && R('danjeon') ? 1 : 0) + (this.tier === 3 && R('hwaro') ? 1 : 0) + (R('aekku') ? 1 : 0) + (R('jabgi') && this.run.deck.length >= 30 ? 1 : 0) + this.nextEnergy - this.drainNext;
    if (h.cs.array) { h.cs.array--; this.energy = Math.max(0, this.energy - 1); popText(...this.top(h), '팔괘진 — 내력 −1', 'warn'); ring(...this.center(h), 12, ['#d0b0ff', '#ffffff'], 20, 40); }
    this.drunkReady = R('drunk'); this.moktakReady = R('moktak'); this.dartReady = R('ssangbi'); this.hosimReady = R('hosim'); this.emptyReady = R('gonggwi'); this.drainNext = 0; this.nextEnergy = 0;
    if (R('hyeolmaeng') && this.turnsTaken === 1) { this.loseHp(6); this.energy += 2; popText(...this.top(h), '혈맹 내력 +2', 'qi'); }
    if (R('seolsang')) this.gainBlock(2 * this.enemies.filter(u => u.cs.frost).length);
    if (this.powers.yeokgeun && this.tier === 1) this.gainBlock(3 * this.powers.yeokgeun);
    if (this.powers.eumyang && this.tier === 2) { this.energy += this.powers.eumyang; this.gainBlock(3 * this.powers.eumyang); }
    if (this.powers.mahwa) { this.loseHp(2 * this.powers.mahwa); this.energy += this.powers.mahwa; popText(...this.top(h), '마화 내력 +' + this.powers.mahwa, 'qi'); }
    h.gauge = this.plannedGauge();
    this.refreshPanel();
    await this.drawCards((R('heavy') ? 4 : 5) + (this.powers.tonap && this.turnsTaken === 1 ? 1 : 0) + (R('eumyangju') && this.tier === 2 ? 1 : 0) + (R('yalbi') && this.run.deck.length <= 15 ? 1 : 0) + (R('seonsu') && this.turnsTaken === 1 ? 2 : 0) - (this.drawLess || 0)); this.drawLess = 0;
    if (R('fan')) await this.makeCards('petal', 1);
    if (this.powers.mandok && this.enemies.length) this.addSt(pick(this.enemies), 'poison', 2);
    if (R('dokheart')) await this.makeCards('dg_chim', 1);
    if (R('hanok') && this.turnsTaken === 1) for (const u of this.enemies) this.addSt(u, 'frost', 3);
    if (R('darts') && this.enemies.length) this.addSt(this.enemies[Math.floor(Math.random() * this.enemies.length)], 'bleed', 2);
    if (this.nextPetals) { const n = this.nextPetals; this.nextPetals = 0; await this.makeCards('petal', n); }
    await this.applySeal();
    await this.handLoop();
    await this.endHand();
    h.cs.tlock = 0; await this.budTick();
    this.planning = false; this.endBtn.classList.add('hidden'); this.pillBtn.classList.add('hidden'); this.help('');
    h.gauge = this.plannedGauge();
  }
  async qiDeviation(h) { // 주화입마: 3단에 두 차례 이상 머물면
    flashScreen('#ff2040', 300, 0.6); shake(4, 300);
    popText(...this.top(h), '주화입마!', 'warn');
    this.damage(h, Math.round(h.maxHp * 0.12 * (this.rel('hwaro') ? 2 : 1)), { dot: true });
    this.tier = 1; this.heat = 0; await wait(500);
  }
  rel(k) { return this.run.relics.includes(k); }
  cost(c) { return c.cost === 'X' ? this.energy : c.cost; }
  playable(id) { const c = CARDS[id]; return (c.cost === 'X' ? this.energy >= 1 : c.cost <= this.energy) && (!c.only || c.only === this.tier); }
  // ── 카드 그림(DOM) ──
  mkCard(id, x, y, back) {
    const v = { uid: ++UID, id, a: { x, y, sx: 1, sy: 1, op: 1 }, busy: false, tx: null, ty: null };
    v.el = el('div', cardClass(id) + (back ? ' back' : ''), cardFace(id, this.tier, this.mainOf(CARDS[id], this.tier)), this.handEl);
    v.el.onmouseenter = () => { const i = this.hand.indexOf(v); if (!touchy() && this.picking && i >= 0 && i !== this.fi) this.focus(i); };
    v.el.onclick = e => {
      e.stopPropagation(); const i = this.hand.indexOf(v);
      if (!this.picking || i < 0) return;
      if (touchy() && this.fi !== i) { this.focus(i); sfx('move'); return; } // 폰: 첫 탭은 보기, 둘째 탭이 내기
      this.pick(i);
    };
    this.vis.add(v); return v;
  }
  dropCard(v) { this.vis.delete(v); v.el.remove(); }
  layout() {
    const n = this.hand.length, step = n > 1 ? Math.min(CW + 2, (HX1 - HX0 - CW) / (n - 1)) : 0, x0 = HX0 + (HX1 - HX0 - (step * (n - 1) + CW)) / 2;
    this.hand.forEach((v, i) => {
      const up = this.picking && i === this.fi;
      v.tx = Math.round(x0 + i * step); v.ty = HY - (up ? 12 : 0) - (v.raised ? 16 : 0);
      v.el.style.zIndex = up || v.raised ? 60 : 10 + i;
    });
  }
  refreshCards() {
    for (const v of this.hand) {
      const c = CARDS[v.id], html = cardFace(v.id, this.tier, this.mainOf(c, this.tier, v.charge || 0)).replace('<div class="b">', `${v.sealed ? `<span class="sealb ${v.sealed}">${SEAL[v.sealed].ch}</span>` : ''}${v.charge ? `<span class="cgb">축기${v.charge}</span>` : ''}${c.trick && this.seen[v.id] ? '<span class="seenb">간파됨</span>' : ''}${this.sim && c.school === this.sim.school ? '<span class="synb">심법↑</span>' : ''}<div class="b">`).replace(`<span class="cc">${c.cost}</span>`, `<span class="cc">${c.cost === 'X' ? 'X' : this.cost(c)}</span>`);
      if (v.html !== html) { v.el.innerHTML = html; v.html = html; }
      v.el.classList.toggle('dis', !!this.picking && (!!v.sealed || !this.playable(v.id))); v.el.classList.toggle('cg', !!v.charge);
    }
  }
  focus(i) {
    const n = this.hand.length; this.fi = ((i % (n + 1)) + n + 1) % (n + 1);
    this.hand.forEach((v, j) => v.el.classList.toggle('sel', j === this.fi));
    this.endBtn.classList.toggle('sel', this.fi === n);
    this.layout();
    this.help(this.fi === n ? `차례를 끝낸다 — 이번에 ${this.chain}장 냄. 많이 낼수록 위쪽 순서 바에서 내 다음 차례가 뒤로 밀린다` : this.hand[this.fi].sealed ? '<span class="red">봉인됨</span> — 이번 차례에는 낼 수 없다' : this.cardHelp(this.hand[this.fi].id));
  }
  pick(i) {
    if (this.pillWin) return;
    if (i === this.hand.length) { sfx('ok'); return this.resolvePick({ end: true }); }
    const v = this.hand[i];
    if (v.sealed || !this.playable(v.id)) { // 못 내는 카드는 부르르
      sfx('buzz'); if (v.busy) return; v.busy = true; const x = v.a.x;
      tween(v.a, { x: x + 3 }, 35).then(() => tween(v.a, { x: x - 3 }, 50)).then(() => tween(v.a, { x }, 35)).then(() => (v.busy = false));
      return;
    }
    sfx('ok'); this.resolvePick({ card: v });
  }
  resolvePick(r) { const res = this.picking; this.picking = null; this.pillBtn.classList.add('hidden'); if (this.keysOff) this.keysOff(); this.keysOff = null; this.endBtn.classList.remove('sel'); res(r); }
  waitPick() {
    return new Promise(res => {
      this.picking = res;
      this.refreshCards();
      this.endBtn.classList.remove('hidden');
      this.endBtn.classList.toggle('hot', !this.hand.some(v => !v.sealed && this.playable(v.id)));
      const np = this.pillsLeft().reduce((a, [, n]) => a + n, 0);
      this.pillBtn.textContent = `단약 ${np}`; this.pillBtn.classList.toggle('hidden', !np);
      this.keysOff = pushKeys(k => {
        if (k === 'left' || k === 'up') { this.focus(this.fi - 1); sfx('move'); }
        else if (k === 'right' || k === 'down') { this.focus(this.fi + 1); sfx('move'); }
        else if (k === 'ok') this.pick(this.fi);
        else if (k === 'inv') this.openPills();
        else return k !== 'speed';
        return true;
      });
      this.focus(Math.min(this.fi, this.hand.length));
      this.refreshPanel();
    });
  }
  async handLoop() {
    for (;;) {
      if (!this.hero.alive || !this.enemies.length) return;
      const r = await this.waitPick();
      if (r.end) return;
      if (r.pill) { await this.takePill(r.pill); continue; }
      const v = r.card, c = CARDS[v.id];
      let targets = null;
      if (c.target === 'one') {
        v.raised = true; this.layout();
        targets = await this.selectTarget();
        v.raised = false;
        if (!targets) { this.layout(); continue; }
      }
      v.el.classList.remove('sel');
      await this.playCard(v, targets);
    }
  }
  pillsLeft() { return Object.entries(this.hero.pills || {}).filter(([id, n]) => n > 0 && !this.pillUsed?.has(id)); } // 같은 단약은 한 전투에 한 번
  openPills() {
    const items = this.pillsLeft().map(([id, n]) => ({ id, html: `${PILLS[id].name} <span class="dim">×${n}</span>` }));
    if (!items.length || this.pillWin) return;
    items.push({ back: true, html: '<span class="dim">◀ 카드로</span>' });
    const w = this.pillWin = win(176, 92, 140, 0, this.ui, 'pillw'); w.style.height = 'auto';
    const close = () => { m.close(); w.remove(); this.pillWin = null; this.focus(this.fi); };
    const m = listMenu(w, items, {
      preview: true,
      onFocus: it => this.help(it.back ? '카드로 돌아간다' : `${PILLS[it.id].name} — ${PILLS[it.id].desc} <span class="dim">· 차례를 쓰지 않는다</span>`),
      onPick: it => { close(); if (!it.back) this.resolvePick({ pill: it.id }); },
      onCancel: close,
    });
  }
  async takePill(id) { // 카드 전투의 단약
    const h = this.hero, [x, y] = this.center(h);
    h.pills[id]--; (this.pillUsed ||= new Set()).add(id);
    this.help(PILLS[id].name + '을(를) 복용했다'); this.playSeq(h, 'cast');
    burst(x, y, { n: 18, cols: ['#ffffff', '#ffe080', '#80ff80'], spd: [20, 60], up: 30 });
    if (id === 'geumchang') this.heal(h, h.maxHp * 0.35);
    if (id === 'sohwan') { this.gainEnergy(2); sfx('heal'); }
    if (id === 'haedok') { this.heat = 0; this.drainNext = 0; popText(x, y + 20, '기혈이 맑아졌다', 'heal'); sfx('heal'); await this.drawCards(1); }
    if (id === 'daeryeok') { this.dbl = true; popText(x, y + 20, '다음 공격 두 배', 'st'); sfx('buff'); }
    if (id === 'byeokryeok') {
      await wait(200); sfx('boom'); flashScreen('#fff', 150, 0.7); shake(5, 300);
      for (const t of this.enemies) { const [tx, ty] = this.center(t); burst(tx, ty, { n: 40, cols: ['#ffe040', '#ff8020', '#ffffff', '#404040'], spd: [40, 160], size: [2, 4] }); this.damage(t, 10 + 6 * this.region, {}); }
    }
    await wait(300); this.setPose(h, 'idle'); this.refreshPanel(); this.refreshCards();
  }
  // ── 연출 ──
  async animDraw(v, delay) { // 덱에서 날아오며 뒤집힌다
    if (delay) await wait(delay);
    sfx('card');
    const fly = tween(v.a, { x: v.tx, y: v.ty, sy: 1 }, 230, ease.out);
    await tween(v.a, { sx: 0 }, 100);
    v.el.classList.remove('back');
    await tween(v.a, { sx: 1 }, 110, ease.out);
    await fly; v.busy = false;
  }
  async drawCards(n) {
    let last = null;
    for (let k = 0; k < n; k++) {
      if (this.hand.length >= MAX_HAND) { popText(...this.top(this.hero), '손이 가득', 'st'); break; }
      if (!this.pile.length) { if (!this.discard.length) break; await this.reshuffle(); if (!this.pile.length) break; }
      const v = this.mkCard(this.pile.pop(), DECK_AT[0] - CW / 2, DECK_AT[1] - CH / 2, true);
      v.a.sx = v.a.sy = 0.22; v.busy = true;
      this.hand.push(v); this.layout(); this.refreshCards(); this.refreshPanel();
      last = this.animDraw(v, k * 75);
    }
    if (last) await last;
  }
  async reshuffle() { // 버린 더미 → 덱 (더미는 바로 옮기고 그림만 뒤따른다 — 겹친 드로우가 덱을 덮어쓰지 않게)
    const ids = this.discard; this.discard = []; this.pile = shuffle([...this.pile, ...ids]); this.refreshPanel();
    sfx('shuffle');
    const gs = ids.slice(0, 8).map(id => { const v = this.mkCard(id, DISC_AT[0] - CW / 2, DISC_AT[1] - CH / 2, true); v.a.sx = v.a.sy = 0.22; v.busy = true; return v; });
    await Promise.all(gs.map((v, i) => wait(i * 35).then(() => tween(v.a, { y: v.a.y - 14 }, 70, ease.out)).then(() => tween(v.a, { x: DECK_AT[0] - CW / 2, y: DECK_AT[1] - CH / 2 }, 110, ease.in)).then(() => this.dropCard(v))));
  }
  async makeCards(id, n) { // 꽃잎 같은 카드를 손에 만든다(주인공에게서 피어난다)
    const [hx, hy] = this.center(this.hero); let last = null, made = 0;
    for (let k = 0; k < n; k++) {
      if (this.hand.length >= MAX_HAND) { popText(...this.top(this.hero), '손이 가득', 'st'); break; }
      const v = this.mkCard(id, hx - CW / 2, 240 - hy - CH / 2, false);
      v.a.sx = v.a.sy = 0.1; v.busy = true; made++;
      this.hand.push(v); this.layout(); this.refreshCards();
      last = wait(k * 60).then(() => { sfx('card'); burst(hx, hy, { n: 8, cols: id === 'petal' ? ['#ffb0d0', '#ff70a0', '#ffffff'] : ['#a0ff80', '#40c040', '#ffffff'], spd: [20, 70], up: 20 }); return tween(v.a, { x: v.tx, y: v.ty, sx: 1, sy: 1 }, 240, ease.back); }).then(() => (v.busy = false));
    }
    if (made) popText(hx, hy + 30, `${CARDS[id].name} +${made}`, 'qi');
    if (last) await last;
  }
  async animPlay(v, c, tgt) { // 들어 올렸다가 대상에게 꽂힌다
    v.busy = true; v.el.classList.add('glow'); v.el.style.zIndex = 80;
    sfx('card');
    await tween(v.a, { x: 132 - CW / 2, y: 96 - CH / 2 }, 110, ease.out);
    await wait(60);
    let px, py;
    if (c.power) [px, py] = [290, 196];
    else { const u = c.target === 'self' ? this.hero : tgt.find(x => x.alive) || this.hero; const [gx, gy] = this.center(u); px = gx; py = 240 - gy; }
    await tween(v.a, { x: px - CW / 2, y: py - CH / 2, sx: 0.15, sy: 0.15, op: 0.5 }, 120, ease.in);
    this.dropCard(v);
    const gy = 240 - py, cols = c.exhaust && !c.token ? ['#ff8020', '#ffd040', '#ff3010'] : [TYPE[c.type], '#ffffff'];
    burst(px, gy, { n: 16, cols, spd: [30, 110], size: [1, 3] });
    ring(px, gy, 6, cols, 14, 70);
    if (c.trick && this.seen[v.id]) popText(px, gy + 16, '간파당했다', 'st');
  }
  async animToPile(v, delay) {
    v.busy = true; if (delay) await wait(delay);
    await tween(v.a, { x: DISC_AT[0] - CW / 2, y: DISC_AT[1] - CH / 2, sx: 0.22, sy: 0.22 }, 190, ease.in);
    this.dropCard(v);
  }
  async animBurn(v, delay) { // 흩날림·소멸
    v.busy = true; if (delay) await wait(delay);
    v.el.classList.add('burn'); sfx('burn');
    const gx = v.a.x + CW / 2, gy = 240 - (v.a.y + CH / 2);
    burst(gx, gy, { n: 22, cols: CARDS[v.id].token ? ['#ffb0d0', '#ff70a0', '#ffffff'] : ['#ff8020', '#ffd040', '#ff3010'], spd: [20, 80], up: 40, size: [1, 3] });
    await tween(v.a, { y: v.a.y - 10, op: 0 }, 260);
    this.dropCard(v);
  }
  async endHand() { // 차례 끝: 축기 카드만 남아 기를 모으고, 꽃잎은 흩날리고, 나머지는 버린 더미로
    if (this.rel('chukgi')) this.nextEnergy += Math.max(0, Math.min(2, this.energy));
    if (this.rel('budongR') && this.hero.st.shield >= 15) { this.nextEnergy++; popText(...this.top(this.hero), '부동 내력 +1', 'qi'); }
    if (this.rel('geomgyeol')) this.gainBlock(this.res);
    const go = this.hand.filter(v => !CARDS[v.id].retain);
    const pois = go.filter(v => v.id === 'dokgi').length; if (pois) this.loseHp(3 * pois);
    this.hand = this.hand.filter(v => CARDS[v.id].retain);
    for (const v of this.hand) { if ((v.charge || 0) < 3) { v.charge = (v.charge || 0) + 1; const [x, y] = [v.a.x + CW / 2, 240 - v.a.y - 20]; burst(x, y, { n: 10, cols: ['#a0e0ff', '#ffffff'], spd: [10, 40], up: 20 }); } if (CARDS[v.id].special === 'mannyeon') for (const u of this.enemies) this.addSt(u, 'frost', 1); }
    if (this.rel('scabbard')) { const can = go.filter(v => !CARDS[v.id].token); if (can.length) { const v = can[Math.floor(Math.random() * can.length)]; go.splice(go.indexOf(v), 1); this.hand.push(v); } } // 낡은 검집
    this.refreshCards();
    this.hand.forEach(v => { v.sealed = null; v.html = null; v.el.classList.remove('sel', 'dis', 'sealed', 'dark', 'ice', 'chain'); });
    go.forEach((v, i) => { if (CARDS[v.id].token) this.animBurn(v, i * 30); else { this.discard.push(v.id); this.animToPile(v, i * 40); } });
    this.layout();
    if (go.length) { sfx('card'); await wait(200 + go.length * 40); }
    this.refreshPanel();
  }
  // ── 카드 얼굴·도움말 ──
  mainOf(c, t, cg = 0) { // 지금 상태에서의 주 효과(cg: 축기)
    const s = this.hero ? this.hero.st.shield : 0;
    if (c.cgBlock) return `호신 ${val(c.block, t) + c.cgBlock * cg}`;
    switch (c.special) {
      case 'jeonghwa': return `회복 ${4 + 3 * cg}`;
      case 'double': return `다음 ×${2 + 0.5 * cg}`;
      case 'mangae': return `피해 6×${Math.min(12, Math.max(1, this.res))}`;
      case 'hangma': return `피해 ${Math.max(1, Math.round(s * [1, 0.7, 0.5][t - 1]))}`;
      case 'daeryeok': return `피해 ${Math.min(50, Math.max(1, this.blocked))}`;
      case 'yeonhwan': return `${val(c.dmg, t)}×${Math.min(8, this.chain + 1)}`;
      case 'ilseom': return `피해 ${val(c.dmg, t)}${this.chain + 1 >= 3 ? '×2' : ''}`;
      case 'nahan': return `${c.target === 'all' ? '전체 ' : '피해 '}${val(c.dmg, t) + (t === 1 ? Math.min(8, Math.floor(s / 3)) : 0)}`;
      case 'petal': return `피해 ${val(c.dmg, t) + 3 * (this.powers.nakyeong || 0) + this.petalBonus}`;
      case 'nahyeol': return `피해 ${Math.max(1, Math.min(30, s))}`;
      case 'chilmae': return `꽃잎 ${Math.max(0, this.energy) * 2}장`;
      case 'gyeonsu': return `호신 ${c.block + 3 * this.guards}`;
      case 'returned': return `피해 ${6 + this.returned}`;
      case 'cheonmasin': return `피해 ${Math.min(60, Math.max(5, Math.round(this.hero.maxHp - this.hero.hp)))}`;
      case 'hyeolgap': return `호신 ${val(c.block, t) * (this.hero.hp <= this.hero.maxHp / 2 ? 2 : 1)}`;
      case 'noejeong': return `피해 ${val(c.dmg, t) * (this.heat ? 2 : 1)}`;
      case 'hancheon': return `호신 ${4 + Math.min(20, this.enemies.reduce((a, u) => a + (u.cs.frost || 0), 0))}`;
      case 'haedok': return `회복 ${Math.min(12, Math.ceil(this.enemies.reduce((a, u) => a + (u.cs.poison || 0), 0) / 3)) + 3 * cg}`;
      case 'yanggeom': return cg ? `내력 +${cg}` : '내력 모음';
      case 'geomsim': return t === 3 ? '2장·식힘' : '1장 뽑기';
      case 'mangeom': return `전체 ${8 + 6 * this.attacks}`;
    }
    return staticMain(c, t);
  }
  cardHelp(id) {
    const c = CARDS[id], mv = tierMove(c), nt = Math.max(1, Math.min(3, c.finisher ? (this.run.relics.includes('hori') ? 2 : 1) : c.setTo || this.tier + (c.tier || 0)));
    const why = !this.playable(id) ? (this.cost(c) > this.energy || c.cost === 'X' ? ' <span class="red">· 내력 부족</span>' : ` <span class="red">· ${ROMAN[c.only - 1]}에서만</span>`) : '';
    const hint = comboHint(id, this.run) + (c.trick && this.seen[id] ? (comboHint(id, this.run) ? ' · ' : '') + '이미 간파당했다: 끊기·절초 약화 실패, 상태 절반' : '');
    const syn = this.sim && c.school === this.sim.school ? ` <span style="color:#80ffc0">· 심법 「${this.sim.name}」 시너지: 피해 +${SIM_SYN.dmg * 100}% · 호신 +${SIM_SYN.block}</span>` : '';
    const tag = (c.only === 3 ? '<span style="color:#ff6070">[절초]</span>' : '') + (c.combo ? '<span class="gold">[합격기]</span>' : `<span style="color:${TYPE[c.type]}">[${TYPE_NAME[c.type]}${this.free && SCHOOL_NAME[c.school] ? ' · ' + SCHOOL_NAME[c.school] : ''}]</span>`);
    return `${tag} ${c.name} — ${c.desc} <span class="dim">· 내력 ${c.cost} · ${mv.txt}${nt !== this.tier ? ` (${ROMAN[this.tier - 1]}→${ROMAN[nt - 1]})` : ''}</span>${why}${syn}${hint ? ` <span style="color:#ffb060">· ${hint}</span>` : ''}`;
  }
  comboPop(n) {
    const e = el('div', 'combo', `${n}연환!`, this.ui); setTimeout(() => e.remove(), 800);
    sfx(n >= 4 ? 'crit' : 'hit'); if (n >= 4) shake(2, 160);
  }
  setTier(n) {
    n = Math.max(1, Math.min(3, n));
    if (n === this.tier) return;
    const up = n > this.tier;
    if (up && this.hero.cs.tlock) { popText(...this.top(this.hero), '주천 봉쇄!', 'warn'); sfx('buzz'); return; }
    const drop = this.tier - n; this.tier = n; if (n < 3) this.heat = 0;
    if (drop > 0 && this.powers.bingbaek) for (const u of this.enemies) this.addSt(u, 'frost', drop * this.powers.bingbaek);
    if (drop > 0 && this.rel('yeokhaeng')) this.drawCards(1);
    popText(...this.top(this.hero), `${ROMAN[n - 1]} 주천`, up ? 'crit' : 'st');
    burst(...this.center(this.hero), { n: 16 + n * 10, cols: [TIER_COL[n - 1], '#ffffff'], spd: [30, 110], up: 20 });
    if (up) { sfx('buff'); playFx('aura', ...this.center(this.hero), { parent: this.group, tint: TIER_COL[n - 1], layer: this.hero.mesh.renderOrder - 1 }); }
    if (this.rel('taegeukpae')) this.gainBlock(3);
    if (up && this.powers.jaha) { this.res += 2 * this.powers.jaha; popText(...this.center(this.hero), '자하 검기 +' + 2 * this.powers.jaha, 'qi'); }
    if (up && n === 3 && this.run.relics.includes('samhwa')) { this.drawCards(2); popText(...this.top(this.hero), '삼화취정 +2장', 'qi'); }
    this.refreshPanel(); this.refreshCards();
  }
  loseHp(n) { // 제 체력을 태운다(호신 무시, 1은 남긴다)
    const h = this.hero; n = Math.min(n, Math.ceil(h.hp) - 1); if (n <= 0) return;
    h.hp -= n; if (this.rel('bloodjade')) this.bloodBonus = (this.bloodBonus || 0) + n; const [x, y] = this.center(h); popText(x, y + 14, '-' + n, 'hurt'); burst(x, y, { n: 8, cols: ['#ff3040', '#800010'], spd: [20, 60] }); sfx('hit');
  }
  cardBlock(n) { this.gainBlock(n + (this.syn ? SIM_SYN.block : 0)); } // 카드가 주는 호신(심법 시너지 포함)
  gainBlock(n) { if (n <= 0) return; if (this.hosimReady) { this.hosimReady = false; n += 4; } this.hero.st.shield += n; popText(...this.top(this.hero), '호신 +' + n, 'qi'); sfx('buff'); }
  gainEnergy(n, why = '') { this.energy += n; popText(...this.top(this.hero), `${why}내력 +${n}`, 'qi'); }
  async selfAnim(c) { // 제 몸에 거는 초식: 시전 빛을 몸 앞에(뒤 후광은 몸에 가려 안 보였다), 막는 카드는 앞에 막이 선다
    const h = this.hero, [x, y] = this.center(h), front = { parent: this.group, layer: h.mesh.renderOrder + 2 };
    this.playSeq(h, 'cast');
    if (c.vfx === 'gold') { playFx('goldCast', x, y, front); sfx('buff'); await wait(260); }
    else if (c.vfx === 'taiji') { playFx('taijiCast', h.mesh.position.x, h.mesh.position.y + 1, front); sfx('buff'); await wait(260); }
    else await this.castFx(h, { vfx: c.vfx }, [h]);
    if (c.type === '수') playFx('shield', x - 8, y, { ...front, flip: true });
    this.setPose(h, 'idle');
  }
  async strike(c, tgt, dmg, hits, extra = {}) {
    const alive = tgt.filter(x => x.alive); if (!alive.length) return;
    if (c.type === '공') dmg = dmg * this.mul + (this.tier === 3 ? 3 * (this.powers.daegeom || 0) : 0);
    if (c.type === '공' && this.bloodBonus) { dmg += this.bloodBonus; popText(...this.top(this.hero), '혈옥 +' + this.bloodBonus, 'warn'); this.bloodBonus = 0; }
    if (this.syn) dmg *= 1 + SIM_SYN.dmg;
    if (c.only === 3) return this.jeolcho(c, alive, dmg, hits);
    await this.useSkill(this.hero, { name: c.name, dmg, hits, target: c.target === 'all' ? 'all' : 'one', vfx: c.vfx, fx: {}, ...extra }, alive);
  }
  // ── 절초: 3단 전용 카드. 컷신 → 전용 동작(hero_<jc>_0..3, 없으면 기공·베기 자세) → 화려한 이펙트 → 연타 ──
  async jcCut(c, col) {
    const h = this.hero;
    music.duck(0.35, 1150); sfx('charge'); flashScreen('#000', 420, 0.75);
    const e = el('div', 'jcut', `<i class="lb t"></i><i class="lb b"></i><div class="sl"></div><img class="pt" src="${h.bigImg || h.img}"><div class="tx"><div class="jt">절 초 · ${SCHOOL_NAME[c.school] || ''}</div><div class="jn">${c.name}</div></div>`, this.ui);
    e.style.setProperty('--j1', col[0]); e.style.setProperty('--j2', col[2]); e.style.setProperty('--j3', col[1]);
    await wait(240); sfx('boom'); shake(3, 220);
    await wait(880); e.classList.add('out'); await wait(200); e.remove();
  }
  jcPose(k, f) { // 전용 동작 프레임(없으면 0·1=기공, 2·3=베기)
    const h = this.hero, s = h.seq && h.seq[k];
    if (s && s.length) return this.setPose(h, k, Math.min(f, s.length - 1));
    if (f < 2) this.setPose(h, 'cast', Math.min(f, ((h.seq && h.seq.cast) || [0]).length - 1)); else this.setPose(h, 'atk', h.seq && h.seq.atk ? Math.min(f, h.seq.atk.length - 1) : 0);
  }
  async jeolcho(c, tgt, dmg, hits) {
    const h = this.hero, k = c.jc, col = JC_COL[k] || ['#ffd040', '#ffffff', '#402000'], front = { parent: this.group, layer: 4200 };
    this.help(`<span style="color:${col[1]}">절초</span> 「${c.name}」`);
    const first = !this.jcShown; this.jcShown = true;
    if (first) await this.jcCut(c, col);
    const sk = { name: c.name, dmg, hits, target: c.target === 'all' ? 'all' : 'one', vfx: c.vfx, fx: {} }, t0 = tgt[0], [hx, hy] = this.center(h);
    const hitAll = (i, last) => { for (const t of tgt) if (t.alive) this.hitOne(h, t, sk, last, i); };
    const impact = (t, flash) => { const [tx, ty] = this.center(t); flashScreen(flash, 150, 0.8); shake(6, 360); hitstop(130); playFx('finisher', tx, ty, { parent: this.group, scale: 2, layer: 4500 }); playFx('crit', tx, ty, front); };
    const goTo = async (t, dy = 0, ms = 130) => { this.trail(h, 4, 30); sfx('slash'); await tween(h.mesh.position, { x: t.mesh.position.x + (t.w / 2 + h.w / 2 - 10), y: t.mesh.position.y - 1 + dy }, ms, ease.in); h.mesh.renderOrder = t.mesh.renderOrder + 1; };
    if (k === 'mangae') { // 매화만개: 꽃잎이 소용돌이쳐 모이고 → 파고들어 휘돌며 연타 → 찌르기와 함께 만개
      this.jcPose(k, 0); sfx('charge');
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 4, r = 34; spawn({ x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.6, vy: -Math.sin(a) * r * 1.6, drag: 1.5, life: 420, size: 2, col: pick(['#ffb0d0', '#ff70a0', '#ffffff']), delay: i * 8 }); }
      playFx('windP', h.mesh.position.x, h.mesh.position.y + 1, front); await wait(380);
      await goTo(t0);
      for (let i = 0; i < hits; i++) {
        const last = i === hits - 1; this.jcPose(k, last ? 3 : 1 + (i % 2));
        if (i % 3 === 0) { const [tx, ty] = this.center(t0); playFx('petals', tx, ty, front); ring(tx, ty, 10, ['#ffb0d0', '#ffffff'], 16, 90); }
        if (last) impact(t0, '#ffd0e0');
        hitAll(i, last); if (!this.enemies.length) break;
        await wait(last ? 160 : hits > 6 ? 60 : 95);
      }
      for (const t of tgt) { const [tx, ty] = this.center(t); burst(tx, ty, { n: 60, cols: ['#ffb0d0', '#ff70a0', '#ffffff', '#ffd0e0'], spd: [40, 170], size: [1, 3], up: 20 }); }
      await wait(320); await this.dashBack(h); return;
    }
    if (k === 'cheonha') { // 천하제일검: 하늘로 검을 들어 뇌기를 모으고 → 솟구쳐 → 수직으로 내리꽂는다
      this.jcPose(k, 0); sfx('charge'); playFx('charge', hx, hy + 6, { ...front, tint: '#a0c8ff' });
      for (let i = 0; i < 30; i++) spawn({ x: hx + R(-22, 22), y: hy - 20 + R(0, 10), vy: R(80, 160), life: 300, size: 1, col: pick(['#e0f0ff', '#60a0ff', '#ffffff']), delay: i * 10 });
      await wait(420);
      this.jcPose(k, 1); this.trail(h, 5, 30); sfx('slash');
      await tween(h.mesh.position, { x: t0.mesh.position.x + 6, y: t0.mesh.position.y + 58 }, 210, ease.out); h.mesh.renderOrder = t0.mesh.renderOrder + 1;
      await wait(110); this.jcPose(k, 2);
      await tween(h.mesh.position, { y: t0.mesh.position.y - 1 }, 80, ease.in);
      const [tx, ty] = this.center(t0), gy = t0.mesh.position.y;
      for (let y = 240; y > gy; y -= 3) spawn({ x: tx + R(-2, 2), y, life: 260, size: Math.random() < 0.5 ? 3 : 2, col: pick(['#ffffff', '#c0e0ff', '#60a0ff']), shrink: 0.5 });
      impact(t0, '#e8f4ff'); playFx('slashB', tx, ty, { ...front, scale: 2, flipY: true }); playFx('dust', tx, gy + 2, { ...front, scale: 1.6 });
      for (let i = 0; i < 3; i++) ring(tx, gy + 1, 8 + i * 8, ['#c0e0ff', '#ffffff', '#4080ff'], 22, 70 + i * 40);
      for (let i = 0; i < hits; i++) { hitAll(i, i === hits - 1); if (!this.enemies.length) break; await wait(110); }
      this.jcPose(k, 3); await wait(420); await this.dashBack(h); return;
    }
    if (k === 'cheonmasin') { // 천마신공: 핏빛 기운을 빨아들여 → 몸을 젖히고 → 두 손바닥으로 혈해를 쏟아낸다
      this.jcPose(k, 0); sfx('charge'); flashScreen('#300008', 520, 0.55);
      for (let i = 0; i < 48; i++) { const a = R(0, Math.PI * 2), r = R(40, 70); spawn({ x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * 1.5, life: 430, size: R(1, 3), col: pick(['#ff3040', '#a00010', '#400008', '#ff8070']), delay: i * 6 }); }
      await wait(380); this.jcPose(k, 1); playFx('phase2', hx, hy, { parent: this.group, tint: '#ff6070', scale: 0.8, layer: h.mesh.renderOrder - 1 }); await wait(300);
      this.jcPose(k, 2); sfx('boom');
      for (const t of tgt) { const [tx, ty] = this.center(t); for (let i = 0; i < 40; i++) spawn({ x: hx - 8, y: hy + R(-8, 8), vx: (tx - hx) * 4 + R(-30, 30), vy: (ty - hy) * 4 + R(-30, 30), life: 260, size: R(2, 4), col: pick(['#d01020', '#600010', '#ff3040', '#000000']), delay: i * 5 }); }
      await wait(220);
      for (const t of tgt) { const [tx, ty] = this.center(t); playFx('blood', tx, ty, { ...front, scale: 2 }); playFx('phase2', tx, ty, { ...front, tint: '#ff4050' }); }
      impact(t0, '#ff2030');
      for (let i = 0; i < hits; i++) { hitAll(i, i === hits - 1); if (!this.enemies.length) break; await wait(110); }
      this.jcPose(k, 3); await wait(360); this.setPose(h, 'idle'); return;
    }
    if (k === 'bingbaek') { // 빙백신장: 눈보라가 몰아치고 → 땅에서 얼음 가시가 솟아 → 얼음 손바닥이 내리찍는다
      this.jcPose(k, 0); sfx('charge'); playFx('charge', hx, hy + 6, { ...front, tint: '#c8f4ff' });
      for (let i = 0; i < 90; i++) spawn({ x: R(0, 340), y: R(70, 240), vx: -R(120, 220), vy: -R(20, 60), life: R(500, 900), size: i % 4 ? 1 : 2, col: pick(['#ffffff', '#c8f4ff', '#90d8ff']), delay: i * 6 });
      await wait(420); this.jcPose(k, 2); const [tx, ty] = this.center(t0), gy = t0.mesh.position.y;
      playFx('iceSpikes', tx, gy, { ...front, flip: true, scale: 1.2 }); sfx('slash'); await wait(300); sfx('slash');
      playFx('palm', tx, ty, { ...front, scale: 2, tint: '#c8f4ff' }); impact(t0, '#e8fcff'); ring(tx, gy + 1, 10, ['#c8f4ff', '#ffffff', '#3090e0'], 28, 110);
      for (let i = 0; i < hits; i++) hitAll(i, i === hits - 1);
      await wait(460); this.setPose(h, 'idle'); return;
    }
    if (k === 'dokryong') { // 독룡폭: 독연기가 용이 되어 적을 삼키고 터진다
      this.jcPose(k, 0); sfx('charge'); playFx('charge', hx, hy + 6, { ...front, tint: '#a0ff80' }); await wait(300); this.jcPose(k, 2);
      const [tx, ty] = this.center(t0);
      for (let s = 0; s <= 24; s++) { const q = s / 24, x = hx + (tx - hx) * q, y = hy + (ty - hy) * q + Math.sin(q * Math.PI * 3) * 16; for (let i = 0; i < 6; i++) spawn({ x: x + R(-4, 4), y: y + R(-4, 4), life: 340, size: Math.round(R(3, 5)), col: pick(['#60e060', '#208020', '#a0ff80', '#104010']), shrink: 0.6 }); await wait(10); }
      playFx('acid', tx, t0.mesh.position.y + 1, { ...front, scale: 1.6 }); impact(t0, '#c8ffb0'); for (let i = 0; i < 40; i++) spawn({ x: tx + R(-10, 10), y: ty + R(-10, 10), vx: R(-120, 120), vy: R(-20, 150), drag: 1.4, life: R(400, 800), size: Math.round(R(2, 4)), col: pick(['#60e060', '#30a030', '#a0ff80', '#204020']) });
      for (let i = 0; i < hits; i++) hitAll(i, i === hits - 1);
      await wait(320); this.setPose(h, 'idle'); return;
    }
    if (k === 'mangeom') { // 만검귀종: 검을 들면 하늘에 검기가 모이고 → 적마다 쏟아져 → 한꺼번에 꽂힌다
      this.jcPose(k, 0); sfx('charge'); playFx('charge', hx, hy + 6, { ...front, tint: '#a0e0ff' });
      for (let i = 0; i < 40; i++) spawn({ x: R(20, 300), y: 240 - R(0, 16), vx: R(-6, 6), life: 420, size: 2, col: pick(['#ffffff', '#a0e0ff', '#60b0ff']), delay: i * 8 });
      await wait(380); this.jcPose(k, 2);
      for (let i = 0; i < 8; i++) { // 검이 하나씩 떨어져 적 둘레에 꽂힌다
        for (const t of tgt) {
          const gy = t.mesh.position.y, x = this.center(t)[0] + R(-30, 30), y = gy + 17 + R(-4, 18), m = this.sprite(swordT(), x, 268, { scale: [1, 1.01], rot: 0, ms: 1100 - i * 60 });
          tween(m.position, { y }, 110, ease.in).then(() => burst(x, y - 17, { n: 6, cols: ['#c8ecff', '#ffffff'], spd: [20, 70], up: 20 }));
        }
        if (i % 2 === 0) sfx('slash');
        await wait(55);
      }
      for (const t of tgt) tween(this.sprite(swordT(), this.center(t)[0], 290, { scale: [2.2, 2.21], rot: 0, ms: 640 }).position, { y: t.mesh.position.y + 36 }, 100, ease.in); // 마지막에 큰 검
      await wait(100);
      for (const t of tgt) { const [tx, ty] = this.center(t), gy = t.mesh.position.y; playFx('slashB', tx, ty, { ...front, scale: 2, flipY: true }); playFx('dust', tx, gy + 2, front); for (let i = 0; i < 2; i++) ring(tx, gy + 1, 8 + i * 10, ['#c8ecff', '#ffffff', '#3090e0'], 20, 70 + i * 40); }
      impact(t0, '#e0f6ff');
      hitAll(0, true);
      await wait(420); this.setPose(h, 'idle'); return;
    }
    await this.useSkill(h, sk, tgt); // 전용 연출이 없는 절초
  }
  takeEcho(c) { // 허초: 다음 공격 카드 / 운룡대팔식: 다음 카드 — 한 번 더 발동 (보물: 취선 호로·소림 목탁)
    if (this.drunkReady && c.type === '공') { this.drunkReady = false; popText(...this.top(this.hero), '취선 호로!', 'qi'); return true; }
    if (this.dartReady && c.type === '암') { this.dartReady = false; popText(...this.top(this.hero), '쌍비침!', 'qi'); return true; }
    if (this.moktakReady && c.type === '수' && this.tier === 1) { this.moktakReady = false; popText(...this.top(this.hero), '소림 목탁!', 'qi'); return true; }
    if (!this.echo || c.power || (this.echo === 'atk' && c.type !== '공')) return false;
    this.echo = null; return true;
  }
  async playCard(v, targets) {
    const c = CARDS[v.id], h = this.hero, x = this.cost(c);
    this.help(''); this.energy -= x; this.played = (this.played || 0) + 1;
    this.read = !!(c.trick && this.seen[v.id]); if (c.trick) this.seen[v.id] = (this.seen[v.id] || 0) + 1;
    this.cg = v.charge || 0; this.syn = !!(this.sim && c.school === this.sim.school); this.jcShown = false;
    this.mul = c.type === '공' && this.dbl ? this.dblMul : 1; if (this.mul > 1) this.dbl = false;
    if (c.type === '공' && this.rel('sutdol') && !this.sutdolUsed) { this.sutdolUsed = true; this.mul *= 2; popText(...this.top(h), '숫돌!', 'qi'); }
    if (c.type === '공' && this.rel('oesu') && this.hand.length === 1) { this.mul *= 2; popText(...this.top(h), '외수!', 'qi'); }
    if (h.cs.venom) this.loseHp(h.cs.venom);
    if (h.cs.array && (c.type === '허' || c.type === '암')) { h.cs.array = 0; popText(...this.top(h), '파진!', 'crit'); sfx('crit'); ring(...this.center(h), 8, ['#d0b0ff', '#ffffff'], 28, 110); }
    this.aoeNow = c.target === 'all';
    if (c.type === '허' || c.type === '암') for (const u of this.enemies) if (u.cs.iron) { u.cs.iron = 0; u.st.shield = 0; u.mesh.material.uniforms.tint.value.setRGB(1, 1, 1); const [x, y] = this.center(u); popText(x, y + 22, '금강 파훼!', 'crit'); sfx('crit'); burst(x, y, { n: 40, cols: ['#ffd860', '#ffffff', '#c08020'], spd: [60, 200] }); }
    if (c.hpCost) this.loseHp(c.hpCost); this.chain++; this.weight += c.w * (this.rel('boots') ? 0.5 : 1);
    if (c.type === '공') this.attacks++;
    if (c.type === '수') this.guards++;
    if (c.type === '암') this.darts = (this.darts || 0) + 1;
    h.gauge = this.plannedGauge();
    this.hand.splice(this.hand.indexOf(v), 1); this.layout(); this.refreshPanel();
    const tgt = targets || (c.target === 'all' ? this.enemies : [h]);
    await this.animPlay(v, c, tgt);
    if (this.free && this.lastSchool && c.school !== this.lastSchool) { this.mixed++; popText(...this.top(h), `잡학! 피해 +${this.mixed * 10}%`, 'qi'); }
    this.lastSchool = c.school;
    if (this.chain >= 2) this.comboPop(this.chain);
    this.mer.stream(TYPE[c.type]);
    const reps = this.takeEcho(c) ? 2 : 1; let skip = false;
    for (let r = 0; r < reps; r++) {
      let tg = c.target === 'all' ? this.enemies : tgt;
      if (c.target === 'one' && !tg[0].alive) { if (!this.enemies.length) break; tg = [this.enemies[0]]; }
      if (r) { popText(...this.top(h), '한 번 더!', 'crit'); flashScreen('#fff4c0', 80, 0.3); await wait(120); }
      if ((await this.effect(c, tg, this.tier, x)) === 'skip') skip = true;
    }
    if (c.type === '공' && this.useRes && !c.finisher) this.res += c.target === 'all' ? 2 : 1;
    this.mul = 1; this.syn = false; this.aoeNow = false;
    if (!skip) { if (c.tier) this.setTier(this.tier + c.tier); if (c.setTo) this.setTier(c.setTo); if (c.draw) await this.drawCards(c.draw); }
    if (c.energy) this.gainEnergy(c.energy);
    if (c.type === '운' && this.rel('qiflow')) await this.drawCards(1);
    if (v.id === 'petal' && this.rel('hyangnang')) this.gainBlock(2);
    if (c.tal) { this.drainNext += c.tal; popText(...this.center(h), `탈력 — 다음 차례 내력 −${c.tal}`, 'warn'); }
    if (c.make) await this.makeCards(c.makeId || 'petal', c.make);
    if (c.finisher) { this.res = 0; this.setTier(this.run.relics.includes('hori') ? 2 : 1); }
    if (c.exhaust || c.power) { if (!c.token) this.exhausted.push(v.id); } else this.discard.push(v.id);
    if (this.emptyReady && !this.hand.length && this.enemies.length) { this.emptyReady = false; popText(...this.top(h), '공수 +2장', 'qi'); await this.drawCards(2); }
    this.refreshPanel(); this.refreshCards();
  }
  async effect(c, tgt, t, x) { // case가 return하면 기본 처리를 건너뛴다
    const h = this.hero, foes = () => tgt.filter(u => u.side === 'enemy' && u.alive);
    switch (c.special) {
      case 'ilseom': await this.strike(c, tgt, val(c.dmg, t), this.chain >= 3 ? 2 : 1); return;
      case 'amhyang': if (t === 3) { await this.selfAnim(c); await this.makeCards('petal', 2); return 'skip'; } break;
      case 'biwol': if (this.attacks - 1 >= 2) this.gainEnergy(1, '비월 '); break;
      case 'heocho': this.echo = 'atk'; popText(...this.top(h), '다음 공격 한 번 더', 'st'); break;
      case 'geomjin': this.nextPetals += [1, 1, 2][t - 1]; break;
      case 'mangae': await this.strike(c, tgt, 6, Math.min(12, Math.max(1, this.res)), { cutin: true }); return;
      case 'isipsa': {
        await this.strike(c, tgt, val(c.dmg, t), 2);
        const ps = this.hand.filter(k => k.id === 'petal');
        if (ps.length && this.enemies.length) { // 손의 꽃잎이 모두 날아간다
          this.hand = this.hand.filter(k => k.id !== 'petal'); this.layout();
          await Promise.all(ps.map((p, i) => { p.busy = true; const [ex, ey] = this.center(this.enemies[i % this.enemies.length]); return wait(i * 40).then(() => tween(p.a, { x: ex - CW / 2, y: 240 - ey - CH / 2, sx: 0.2, sy: 0.2 }, 150, ease.in)).then(() => { this.dropCard(p); burst(ex, ey, { n: 8, cols: ['#ffb0d0', '#fff'], spd: [30, 90] }); }); }));
          await this.strike({ ...c, name: '꽃잎 폭풍' }, this.enemies, 4 + 3 * (this.powers.nakyeong || 0), ps.length);
        }
        return;
      }
      case 'yeonhwan': await this.strike(c, tgt, val(c.dmg, t), Math.min(8, this.chain)); return;
      case 'chilmae': await this.selfAnim(c); await this.makeCards('petal', x * 2); return;
      case 'nextEnergy': this.nextEnergy += 1; break;
      case 'petal': await this.strike(c, tgt, val(c.dmg, t) + 3 * (this.powers.nakyeong || 0) + this.petalBonus, 1); return;
      case 'samjae': if (t === 1) this.cardBlock(3); await this.strike(c, tgt, [4, 8, 5][t - 1], t === 3 ? 2 : 1); return;
      case 'taemae': await this.strike(c, tgt, val(c.dmg, t), 1); h.cs.parry = (h.cs.parry || 0) + 1; popText(...this.center(h), '되치기 자세', 'st'); return;
      case 'hyeolu': this.playSeq(h, 'cast'); await this.castFx(h, { vfx: c.vfx }, foes()); this.setPose(h, 'idle'); for (const u of foes()) { this.interrupt(u); this.addSt(u, 'bleed', u.cs.bleed || 5); } return;
      case 'changnak': await this.strike(c, tgt, val(c.dmg, t), 1); if (t === 3) { this.petalBonus += 3; popText(...this.top(h), '꽃잎 피해 +3', 'qi'); } return;
      case 'nahyeol': await this.strike(c, tgt, Math.max(1, Math.min(30, h.st.shield)), 1); return;
      case 'hyeolpo': this.cardBlock(c.block); if (h.hp <= h.maxHp / 2) { h.cs.counter = (h.cs.counter || 0) + 6; popText(...this.center(h), '반격 ' + h.cs.counter, 'st'); } await this.selfAnim(c); return;
      case 'nahan': await this.strike(c, tgt, val(c.dmg, t) + (t === 1 ? Math.min(8, Math.floor(h.st.shield / 3)) : 0), 1); return;
      case 'cheolpo': { const had = h.st.shield >= 10; this.cardBlock(val(c.block, t)); await this.selfAnim(c); if (had) await this.drawCards(1); return; }
      case 'noejeong': await this.strike(c, tgt, val(c.dmg, t) * (this.heat ? 2 : 1), 1); return;
      case 'icewall': h.cs.icewall = 1; popText(...this.center(h), '빙벽', 'st'); break;
      case 'shatter': { const u = tgt[0], f = u.cs.frozen; await this.strike(c, tgt, val(c.dmg, t) * (f ? 2.5 : 1), 1); if (f && u.alive) this.thaw(u, true); return; }
      case 'hancheon': this.cardBlock(4 + Math.min(20, this.enemies.reduce((a, u) => a + (u.cs.frost || 0), 0))); await this.selfAnim(c); return;
      case 'bukmyeong': this.playSeq(h, 'cast'); await this.castFx(h, { vfx: c.vfx }, foes()); this.setPose(h, 'idle'); for (const u of foes()) this.addSt(u, 'frost', Math.max(2, u.cs.frost || 0)); return;
      case 'bingbaek': { const u = tgt[0], f = u.cs.frozen, n = u.cs.frost || 0; u.cs.frost = 0; await this.strike(c, tgt, (18 + 3 * n) * (f ? 2 : 1), 1); if (f && u.alive) this.thaw(u, true); return; }
      case 'dokbal': await this.strike(c, tgt, Math.max(1, Math.round((tgt[0].cs.poison || 0) * [1, 1.5, 2][t - 1])), 1); return;
      case 'hwagol': if (tgt[0].st.shield) { tgt[0].st.shield = 0; popText(...this.top(tgt[0]), '호신이 녹았다', 'crit'); } break;
      case 'dgchain': await this.strike(c, tgt, 1, 1); for (const u of foes()) this.addSt(u, 'poison', Math.min(5, this.darts)); return;
      case 'haedok': this.heal(h, Math.min(12, Math.ceil(this.enemies.reduce((a, u) => a + (u.cs.poison || 0), 0) / 3)) + 3 * this.cg); await this.selfAnim(c); return;
      case 'dokryong': { const all = foes(); for (const u of all) if (u.alive) await this.strike(c, [u], Math.max(5, (u.cs.poison || 0) * 3), 1); return; }
      case 'yanggeom': if (this.cg) this.gainEnergy(this.cg, '양검 '); await this.selfAnim(c); return;
      case 'geomsim': if (t === 3) { await this.selfAnim(c); this.heat = 0; popText(...this.center(h), '과열이 식었다', 'qi'); await this.drawCards(2); return 'skip'; } break;
      case 'mangeom': await this.strike(c, tgt, 8 + 6 * (this.attacks - 1), 1); return;
      case 'sajahu': case 'jewanggi': if (t === (c.special === 'sajahu' ? 1 : 3)) { this.playSeq(h, 'cast'); await this.castFx(h, { vfx: c.vfx }, foes()); this.setPose(h, 'idle'); for (const u of foes()) { if (!this.read) { this.blunt(u); this.interrupt(u); } this.addSt(u, 'weak', this.read ? 1 : 2); } return; } break;
      case 'yeomhwa': await this.strike(c, tgt, 2, 1); for (const u of foes()) this.interrupt(u); return;
      case 'hangma': await this.strike(c, tgt, Math.max(1, Math.round(h.st.shield * [1, 0.7, 0.5][t - 1])), 1); h.st.shield = Math.floor(h.st.shield / 2); return;
      case 'daeryeok': await this.strike(c, tgt, Math.min(50, Math.max(1, this.blocked)), 1, { cutin: true }); this.blocked = 0; return;
      case 'chamseon': if (t === 1) this.nextEnergy += 1; break;
      case 'gyeonsu': this.cardBlock(c.block + 3 * (this.guards - 1)); await this.selfAnim(c); return;
      case 'parry': h.cs.parry = (h.cs.parry || 0) + 1; popText(...this.center(h), '되치기 자세', 'st'); break;
      case 'bokho': this.heal(h, 6); break;
      case 'unryong': this.echo = 'any'; popText(...this.top(h), '다음 카드 한 번 더', 'st'); break;
      case 'yuun': await this.strike(c, tgt, val(c.dmg, t), c.hits); if (t === 2) this.cardBlock(4); return;
      case 'jwasu': await this.strike(c, tgt, val(c.dmg, t) * (tgt[0].intent && tgt[0].intent.k === 'stun' ? 2 : 1), 1); return;
      case 'returned': await this.strike(c, tgt, 6 + this.returned, 1, { cutin: this.returned >= 20 }); return;
      case 'jeonghwa': this.heal(h, 4 + 3 * this.cg); this.nextEnergy += 1; break;
      case 'manryu': await this.strike(c, tgt, val(c.dmg, t), 1); h.cs.parry = (h.cs.parry || 0) + 1; popText(...this.center(h), '되치기 자세', 'st'); return;
      case 'cool': this.heat = 0; popText(...this.center(h), '과열이 식었다', 'qi'); break;
      case 'noeun': await this.strike(c, tgt, val(c.dmg, t), 1); if (t === 3) for (const u of foes()) this.addSt(u, 'vuln', 2); return;
      case 'double': this.dbl = true; this.dblMul = 2 + 0.5 * this.cg; popText(...this.top(h), `다음 공격 ×${this.dblMul}`, 'st'); break;
      case 'heupsu': { const u = tgt[0], bl = u.cs.bleed, before = u.hp; await this.strike(c, tgt, val(c.dmg, t), 1); if (bl) this.heal(h, Math.max(0, before - Math.max(0, u.hp))); return; }
      case 'hyeolgap': this.cardBlock(val(c.block, t) * (h.hp <= h.maxHp / 2 ? 2 : 1)); await this.selfAnim(c); return;
      case 'hyeolhae': await this.strike(c, tgt, 3 + 2 * (tgt[0].cs.bleed || 0), 1); return;
      case 'cheonmasin': await this.strike(c, tgt, Math.min(60, Math.max(5, Math.round(h.maxHp - h.hp))), 1, { cutin: true }); return;
      case 'changgung': await this.strike(c, tgt, val(c.dmg, t), 1); if (t === 3) for (const u of this.enemies) this.addSt(u, 'vuln', 2); return;
      case 'heupseong': { const u = tgt[0], before = u.hp; await this.strike(c, tgt, val(c.dmg, t), 1); this.heal(h, Math.max(0, before - Math.max(0, u.hp))); return; }
    }
    if (c.power) { this.powers[c.power] = (this.powers[c.power] || 0) + 1; popText(...this.top(h), '심법 — ' + c.name, 'crit'); await this.selfAnim(c); return; }
    if (c.block != null) this.cardBlock(val(c.block, t) + (c.cgBlock || 0) * this.cg);
    if (c.dodge) { h.cs.dodge = (h.cs.dodge || 0) + val(c.dodge, t); popText(...this.center(h), '흘려막기 ' + h.cs.dodge, 'st'); }
    if (c.counter) { h.cs.counter = (h.cs.counter || 0) + c.counter; popText(...this.center(h), '반격 ' + h.cs.counter, 'st'); }
    if (c.dmg != null) await this.strike(c, tgt, val(c.dmg, t), c.hits || 1);
    else if (c.target === 'self') await this.selfAnim(c);
    else { this.playSeq(h, 'cast'); await this.castFx(h, { vfx: c.vfx }, foes()); this.setPose(h, 'idle'); }
    for (const u of foes()) { if (c.interrupt && !this.read) this.interrupt(u); if (c.blunt && !this.read) this.blunt(u); if (c.st) for (const k in c.st) this.addSt(u, k, this.read ? Math.floor(c.st[k] / 2) : c.st[k]); if (c.stT) for (const k in c.stT) this.addSt(u, k, val(c.stT[k], t)); }
  }
}
