// battle.js — 속도게이지(CTB) 사이드뷰 전투 + 도트 VFX
import { THREE, scene, quad, dispose, tween, wait, ease, hitstop, shake, spawn, burst, ring, R, pick, popText, flashScreen, el, win, $, ui, listMenu, pushKeys, sfx, clock, onFrame, tex, cam, clearParticles, TOUCH, toStage, portraitView, camKick, camZoom, slowmo, impactFrame, hitSfx } from './engine.js';
import { music } from './music.js';
import { spriteSet, drawBattleBG, drawArc, drawTaiji, drawManja, canvas, IMGS, imageSpriteSet, imagePortrait, frameSpriteSet, bossSpriteSet } from './pixel.js';
import { Meridian, SCHOOL_QI, newCanvas } from './meridian.js';
const JC = 6; // 소주천 한 바퀴 = 혈 6칸
import { ENEMIES, PILLS, SCHOOLS, TIER_NAME, enemyStats, BOSS_ULT } from './data.js';
import { playFx } from './fx.js';

const RATE = 0.01; // 게이지 / ms / 속도1 → 속도10이면 1초에 한 턴
const SLOTS = [[100, 98], [46, 118], [54, 80], [146, 76]];
const SOLO = [96, 88]; // 보스·정예 단독
const HERO_POS = [254, 98];
const MELEE = new Set(['slash', 'slashB', 'petal', 'gold', 'palm', 'claw', 'bite', 'blood', 'staff', 'taiji']);
const HIT_FX = { slash: 'slash', slashB: 'slashB', petal: 'petal', gold: 'gold', taiji: 'taiji', palm: 'palm', roar: 'dust', staff: 'staff', claw: 'claw', bite: 'bite', darts: 'darts', poison: 'poison', dragon: 'dragon', blood: 'blood', wave: 'wave', acid: 'acid' }; // vfx → assets/fx 시트(나머지 hit)
const AMBIENT = [ // 지역별 떠다니는 것: 확률/프레임, 시작 y(-1이면 화면 중간), 속도, 색
  { p: 0.12, y: 245, vx: [-20, -6], vy: [-14, -6], life: 9000, cols: ['#c8d860', '#e0b040', '#90b840'] },
  { p: 0.10, y: -1, vx: [-6, 6], vy: [-3, 3], life: 3000, cols: ['#ffe0a0', '#fff4d0'] },
  { p: 0.14, y: 70, vx: [-5, 5], vy: [6, 14], life: 6000, cols: ['#a0ff80', '#60d060', '#d0ffc0'] },
  { p: 0.16, y: 70, vx: [-8, 8], vy: [10, 24], life: 5000, cols: ['#ff5030', '#ff9040', '#ffd060'] },
  { p: 0.35, y: 245, vx: [-14, 2], vy: [-26, -12], life: 10000, cols: ['#ffffff', '#e0e8ff', '#c8d4f0'] },
];
// 맞은 연출 4단계: 0 일반 · 1 강공 · 2 치명 · 3 결정타(마지막 하나를 쓰러뜨림)
// stop 히트스톱 ms · kick 화면 밀림 px · kms 밀림 길이 · zoom 확대 배율 · inv 흑백 반전 ms · kb 넉백 px · dust 발밑 흙먼지
const HIT_TIER = [
  { stop: 55, kick: 2.5, kms: 180, zoom: 1.02, inv: 0, kb: 5, dust: 0 },
  { stop: 100, kick: 4.5, kms: 260, zoom: 1.06, inv: 0, kb: 10, dust: 1 },
  { stop: 150, kick: 7, kms: 360, zoom: 1.12, inv: 50, kb: 16, dust: 1 },
  { stop: 220, kick: 10, kms: 500, zoom: 1.25, inv: 90, kb: 26, dust: 1 },
];
const ST_ICON = { poison: ['毒', '#70e070'], bleed: ['血', '#ff5060'], stun: ['暈', '#ffe040'], shield: ['盾', '#80c0ff'], counter: ['反', '#60ffff'], atkUp: ['攻↑', '#ffa040'], atkDown: ['攻↓', '#a0a0ff'], defDown: ['防↓', '#c080ff'], evaUp: ['避↑', '#a0ffa0'], critUp: ['必↑', '#ffff80'], reflect: ['返', '#ffd040'] };

// 그림을 밀도 D로(도트 그대로 정수배 확대·축소). 이미 그 밀도면 그대로
function atDensity(c, D) {
  const k = D / (c.d || 1); if (k === 1) return c;
  const o = canvas(Math.round(c.width * k), Math.round(c.height * k)), x = o.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); o.d = D; return o;
}
let VT = null;
export function vfxTex() {
  if (VT) return VT;
  VT = { white: tex(drawArc(14, 5, '#c8d8ff')), blue: tex(drawArc(14, 5, '#60a0ff')), pink: tex(drawArc(13, 5, '#ff80b0')), red: tex(drawArc(15, 6, '#d02030')), brown: tex(drawArc(13, 5, '#c09050')), gold: tex(drawArc(16, 6, '#ffd040')), taiji: tex(drawTaiji(12)), taijiBig: tex(drawTaiji(22)), manja: tex(drawManja(3, '#ffcc30')) };
  return VT;
}

function portrait(src, S, beast) {
  const c = canvas(16, 16), x = c.getContext('2d');
  const hdTop = (S - 2) - Math.round(S * 0.2) + 1 - Math.round(S * 0.27) - Math.round(S * 0.25) + 1;
  if (beast) x.drawImage(src, S - 18, Math.round(S * 0.4) - 8, 16, 16, 0, 0, 16, 16);
  else x.drawImage(src, Math.round(S / 2) - 7, hdTop - 4, 16, 16, 0, 0, 16, 16);
  return c.toDataURL();
}


export class Battle {
  // hero: main에서 계산한 전투용 주인공, enemies: 적 id 배열, region: 0..4
  constructor(hero, enemyIds, region, kind = 'normal', geo = region, mul = {}) { // region=난이도 단계, geo=지도 지역(배경·공기), mul=루트 배율
    this.heroData = hero; this.enemyIds = enemyIds; this.region = region; this.kind = kind; this.geo = geo; this.routeMul = mul;
    this.units = []; this.kills = []; this.counterQ = null; this.waiting = null; this.reviveUsed = false;
    this.lastBar = ''; this.barT = 0; this.idleT = 0;
  }

  // ───────── 준비 ─────────
  makeUnit(d, side, pos) {
    const art = d.art || IMGS[d.img], beast = d.spr.kind === 'beast';
    const anim = d.img && IMGS[d.img + '_idle'] && IMGS[d.img + '_atk_2'];
    // 밀도: HD 그림(c.d = 2)이 섞이면 1배 그림을 같은 밀도로 키워 한 덩어리로 만들고, 월드 크기는 quad가 밀도로 나눈다
    const srcs = d.artFrames ? Object.values(d.artFrames).flat() : anim ? [IMGS[d.img + '_idle'], ...[0, 1, 2].map(k => IMGS[`${d.img}_atk_${k}`])] : art ? [art] : [];
    const D = Math.max(1, ...srcs.map(c => c.d || 1)), dn = c => atDensity(c, D);
    const fr = d.artFrames && Object.fromEntries(Object.entries(d.artFrames).map(([k, v]) => [k, v.map(dn)]));
    const frames = fr ? frameSpriteSet(fr) : anim ? bossSpriteSet(dn(IMGS[d.img + '_idle']), [0, 1, 2].map(k => dn(IMGS[`${d.img}_atk_${k}`])), Array.from({ length: BOSS_ULT[d.img] || 0 }, (_, k) => IMGS[`${d.img}_ult_${k}`]).filter(Boolean).map(dn)) : art ? imageSpriteSet(dn(art), d.img && IMGS[d.img + '_atk'] && dn(IMGS[d.img + '_atk'])) : spriteSet(d.spr), texs = {}, seq = {};
    for (const k in frames) if (k !== 'seq') { frames[k].d = D; texs[k] = tex(frames[k]); }
    for (const k in frames.seq || {}) seq[k] = frames.seq[k].map(c => ((c.d = D), tex(c)));
    const pa = art && atDensity(art, 1), size = pa ? pa.height : d.spr.size || 32, w = pa ? pa.width : size; // 초상·크기는 1배 기준
    const sh = canvas(Math.max(8, Math.round(w * (beast ? 0.8 : 0.6))), 5), shx = sh.getContext('2d');
    shx.fillStyle = '#000'; shx.beginPath(); shx.ellipse(sh.width / 2, 2.5, sh.width / 2, 2.5, 0, 0, Math.PI * 2); shx.fill();
    const shadow = quad(sh, { anchor: 'center', parent: this.group });
    shadow.material.uniforms.opacity.value = 0.32; shadow.renderOrder = -1; shadow.position.set(pos[0], pos[1] + 1, 0);
    const mesh = quad(texs.idle, { parent: this.group });
    mesh.position.set(pos[0], pos[1], 0);
    mesh.renderOrder = 1000 - pos[1];
    if (side === 'hero') mesh.scale.x = -1;
    const u = {
      ...d, side, texs, seq, mesh, size, w, shadow, home: [...pos], hp: d.hp ?? d.maxHp, qi: d.qi ?? d.maxQi ?? 0,
      gauge: R(0, 35), alive: true, pose: 'idle', fx: d.fx || {}, atkCut: !!(d.img && !anim && IMGS[d.img + '_atk']),
      st: { poison: 0, bleed: 0, stun: 0, shield: 0, counter: 0, atkUp: 0, atkDown: 0, defDown: 0, evaUp: 0, critUp: 0, reflect: 0 },
      img: pa ? imagePortrait(pa, beast, 16, d.faceAt && [d.faceAt[0], d.faceAt[1] + 8]).toDataURL() : portrait(frames.idle, size, beast),
      bigImg: pa ? imagePortrait(pa, beast, beast ? 32 : Math.min(40, Math.round(size * 0.42)), d.faceAt).toDataURL() : null, firstHit: true,
    };
    // 태그(체력바/상태) + 클릭 영역
    u.tag = el('div', 'utag' + (side === 'hero' ? ' hero' : ''), '<div class="hpb"><b></b><i></i></div><div class="sts"></div>', this.tagLayer);
    u.hit = el('div', 'uhit', null, this.tagLayer);
    Object.assign(u.hit.style, { width: (art ? w * 0.8 : size * 0.7) + 'px', height: size * 0.9 + 'px' });
    this.units.push(u);
    return u;
  }
  setPose(u, p, f = 0) { if (!u.alive && p !== 'dead') return; u.pose = p; u.mesh.material.uniforms.map.value = u.seq?.[p]?.[f] || u.texs[p]; }
  playSeq(u, p, gap = 110) { // 생성 프레임이 있으면 순서대로(기다리지 않음)
    this.setPose(u, p, 0);
    const n = u.seq?.[p]?.length || 1;
    for (let f = 1; f < n; f++) wait(gap * f).then(() => { if (u.pose === p) this.setPose(u, p, f); });
  }
  center(u) { return [u.mesh.position.x, u.mesh.position.y + u.size * 0.45]; }
  top(u) { return [u.mesh.position.x, u.mesh.position.y + u.size * 0.85]; }
  foes(u) { return this.units.filter(x => x.alive && x.side !== u.side); }
  get enemies() { return this.units.filter(x => x.alive && x.side === 'enemy'); }

  async start() {
    vfxTex();
    this.group = new THREE.Group(); scene.add(this.group);
    cam.x = 0; cam.y = 0;
    const bg = quad(IMGS['bg' + (this.geo + 1)] || drawBattleBG(this.geo + 1), { anchor: 'center', parent: this.group });
    bg.position.set(160, 120, 0); bg.renderOrder = -10; this.bg = bg;
    this.buildUI();
    const h = this.hero = this.makeUnit(this.heroData, 'hero', HERO_POS);
    h.gauge += h.fx.startGauge || 0;
    if (h.fx.shieldStart) h.st.shield = Math.round(h.maxHp * h.fx.shieldStart);
    const solo = this.enemyIds.length === 1 && this.kind !== 'normal';
    this.enemyIds.forEach((id, i) => this.makeUnit(enemyStats(id, this.region, this.routeMul), 'enemy', solo ? SOLO : (this.slots || SLOTS)[i]));
    this.offFrame = onFrame((dt, real) => this.update(dt, real));
    // 등장
    for (const u of this.units) { const x0 = u.mesh.position.x; u.mesh.position.x += u.side === 'hero' ? 90 : -120; tween(u.mesh.position, { x: x0 }, 320, ease.out); }
    await wait(380);
    const stars = this.enemies.filter(e => e.title);
    for (const s of stars) await this.bossIntro(s, stars.length > 1);
    if (!stars.length) this.banner(this.kind === 'elite' ? '강적 출현!' : '전투 개시!');
    await wait(stars.length ? 120 : 450);
    for (;;) {
      const u = await new Promise(r => (this.waiting = r));
      await this.turn(u);
      const end = this.ended();
      if (end) { await this.outro(end); return { result: end, kills: this.kills, hp: Math.max(0, Math.round(this.hero.hp)), reviveUsed: this.reviveUsed }; }
    }
  }
  ended() { return this.yielded ? 'yield' : !this.hero.alive ? 'lose' : this.enemies.length === 0 ? 'win' : null; }

  // ───────── 프레임 ─────────
  update(dt, real = dt) {
    if (this.hero) this.mer.draw(real, this.jcState());
    if (this.waiting) {
      let best = null;
      for (const u of this.units) if (u.alive) { u.gauge += this.spdOf(u) * dt * RATE; if (u.gauge >= 100 && (!best || u.gauge > best.gauge)) best = u; }
      if (best) { const r = this.waiting; this.waiting = null; r(best); }
    }
    this.idleT += dt;
    if (this.idleT > 420) {
      this.idleT = 0;
      for (const u of this.units) if (u.alive && (u.pose === 'idle' || u.pose === 'idle2')) this.setPose(u, u.pose === 'idle' ? 'idle2' : 'idle');
    }
    for (const u of this.units) {
      if (u.charging && u.alive && Math.random() < 0.5) { const [x, y] = this.center(u); spawn({ x: x + R(-14, 14), y: y - 14, vy: R(30, 70), life: 380, size: 2, col: pick(['#ff3040', '#ff9060', '#400010']) }); }
      if (u.side === 'hero' && u.alive && u.st.counter && Math.random() < 0.15) { const [x, y] = this.center(u); spawn({ x: x + R(-10, 10), y: y + R(-10, 10), vy: 20, life: 300, size: 1, col: '#80ffff' }); }
      if (u.trem > 0) { u.trem -= real; u.mesh.material.uniforms.off.value.x = u.trem > 0 ? ((u.trem / 33 | 0) % 2 ? u.tremA : -u.tremA) : 0; } // 맞은 몸 떨림(히트스톱 중에도)
      u.shadow.position.x = Math.round(u.mesh.position.x); u.shadow.visible = u.alive || u.side === 'hero';
      this.barrier(u);
      const x = Math.round(u.mesh.position.x), y = Math.round(240 - u.mesh.position.y);
      u.tag.style.transform = `translate(${x - 15}px, ${y + 1}px)`;
      u.hit.style.transform = `translate(${x - u.size * 0.35}px, ${y - u.size * 0.85}px)`;
    }
    this.barT -= dt;
    if (this.barT <= 0) { this.barT = 80; this.refresh(); }
    const A = AMBIENT[this.geo];
    if (A && Math.random() < A.p * dt / 16) spawn({ x: R(-10, 330), y: A.y < 0 ? R(30, 120) : A.y, vx: R(...A.vx), vy: R(...A.vy), ax: R(-6, 6), life: A.life, size: Math.random() < 0.3 ? 2 : 1, col: pick(A.cols), fade: true });
  }

  // ───────── UI ─────────
  buildUI() {
    const root = this.ui = el('div', 'bui', null, ui);
    this.tagLayer = el('div', 'tags', null, root);
    this.tagLayer.onclick = e => { const u = this.units.find(x => x.alive && (x.tag.contains(e.target) || x.hit === e.target || (x.ib && x.ib.contains(e.target)))); if (u) u.hit.classList.contains('on') ? u.hit.onclick(e) : this.tip(u); }; // 조준 중엔 칩·의도를 눌러도 그 대상을 고른다
    this.bar = el('div', 'turnbar', null, root);
    this.spdBtn = el('div', 'spdbtn', '', root);
    this.spdBtn.onclick = () => this.toggleSpeed();
    this.helpEl = win(40, 22, 240, 18, root, 'help hidden');
    this.cmdWin = win(0, 170, 96, 70, root);
    this.stWin = win(96, 170, 224, 70, root, 'stwin');
    this.skWin = win(0, 42, 320, 62, root, 'skwin hidden');
    this.cursor = el('div', 'tcursor hidden', '▼', root);
    this.jc = { p: 0, stacks: 0, ready: false };
    const mc = newCanvas(); mc.className = 'mer'; root.appendChild(mc); this.mer = new Meridian(mc);
    this.offSpeed = pushKeys(k => { if (k === 'speed') { this.toggleSpeed(); return true; } });
    this.toggleSpeed(true);
  }
  toggleSpeed(init) {
    const S = [1, 2, 3];
    if (!init) { Battle.speedIdx = ((Battle.speedIdx || 0) + 1) % 3; sfx('move'); }
    clock.scale = S[Battle.speedIdx || 0];
    this.spdBtn.textContent = '배속 ×' + clock.scale;
  }
  help(text) {
    if (!text) { this.helpEl.classList.add('hidden'); return; }
    this.helpEl.innerHTML = text; this.helpEl.classList.remove('hidden');
  }
  banner(text, cls = '', ms = 1100) { const b = el('div', 'banner ' + cls, text, this.ui); b.style.animationDuration = ms + 'ms'; setTimeout(() => b.remove(), ms); }
  tip(u) { // 버프·디버프·기믹 설명 창: 아무 데나 누르면 닫힌다
    if (!this.tipLines) return;
    const L = this.tipLines(u); sfx('move');
    const b = el('div', 'stip', `<div class="win"><div class="stn">${u.name}</div>${L.map(([t, c, d]) => `<p><b style="color:${c}">${t}</b>${d}</p>`).join('') || '<p class="dim">걸린 효과가 없다</p>'}<div class="dim">눌러서 닫기</div></div>`, this.ui);
    b.onclick = e => { e.stopPropagation(); b.remove(); };
  }
  stHtml(u) {
    let s = '';
    for (const k in ST_ICON) if (u.st[k]) s += `<b style="color:${ST_ICON[k][1]}">${ST_ICON[k][0]}${['poison', 'bleed', 'shield'].includes(k) ? u.st[k] : ''}</b>`;
    if (u.charging) s += '<b class="blink" style="color:#ff4040">氣!</b>';
    if (u.guard) s += '<b style="color:#80c0ff">運</b>';
    return s;
  }
  refresh() {
    for (const u of this.units) {
      u.tag.style.display = u.alive && u.side === 'enemy' ? '' : 'none';
      u.lag = Math.max(u.hp, (u.lag ?? u.hp) - u.maxHp * 0.025); // 깎인 체력이 천천히 따라 내려온다
      u.tag.firstChild.firstChild.style.width = Math.max(0, u.lag / u.maxHp * 100) + '%';
      u.tag.firstChild.lastChild.style.width = Math.max(0, u.hp / u.maxHp * 100) + '%';
      const s = this.stHtml(u);
      if (u.tag.lastChild.innerHTML !== s) u.tag.lastChild.innerHTML = s;
    }
    const h = this.hero;
    const html = `<div class="nm">${h.name} <span class="dim">${h.realm} Lv${h.level}</span></div>
      <div class="row"><span class="lb">체력</span><div class="bar hp"><i class="lag" style="width:${h.lag / h.maxHp * 100}%"></i><i style="width:${h.hp / h.maxHp * 100}%"></i></div><span class="num">${Math.ceil(h.hp)}/${h.maxHp}</span></div>
      <div class="row"><span class="lb">내력</span><div class="bar qi"><i style="width:${h.qi / h.maxQi * 100}%"></i></div><span class="num">${Math.floor(h.qi)}/${h.maxQi}</span></div>
      <div class="row"><span class="lb">기세</span><div class="bar gg"><i style="width:${Math.min(100, h.gauge)}%"></i></div><span class="sts">${this.stHtml(h)}</span></div>`;
    if (this.stWin.innerHTML !== html) this.stWin.innerHTML = html;
    // 행동 순서
    const order = this.predict(7);
    const bar = '<span class="lb">순서</span>' + order.map((u, i) => `<div class="ti ${u.side}${i === 0 && this.cur === u && !this.waiting ? ' now' : ''}${u.charging ? ' warn' : ''}"><img src="${u.img}"></div>`).join('');
    if (bar !== this.lastBar) { this.bar.innerHTML = bar; this.lastBar = bar; }
  }
  spdOf(u) { return u.spd; }
  predict(n) {
    const sim = this.units.filter(u => u.alive).map(u => ({ u, g: u.gauge }));
    const out = [];
    if (this.cur && !this.waiting && this.cur.alive) out.push(this.cur);
    while (out.length < n && sim.length) {
      let best = null, bt = Infinity;
      for (const s of sim) { const t = s.g >= 100 ? -s.g / 1000 : (100 - s.g) / this.spdOf(s.u); if (t < bt) { bt = t; best = s; } }
      if (bt > 0) for (const s of sim) s.g += this.spdOf(s.u) * bt;
      best.g = Math.max(0, best.g - 100);
      out.push(best.u);
    }
    return out;
  }

  // ───────── 턴 ─────────
  async turn(u) {
    this.cur = u;
    u.gauge = Math.max(0, u.gauge - 100);
    u.guard = false;
    if (u.side === 'hero') {
      const f = u.fx;
      u.qi = Math.min(u.maxQi, u.qi + 3 * (f.qiRegenMul || 1) + (f.qiPerTurn || 0) + this.jc.stacks);
      this.circulate(1);
      if (f.regen) this.heal(u, u.maxHp * f.regen, true);
      if (f.turnShield) u.st.shield = Math.min(Math.round(u.maxHp * 0.4), u.st.shield + Math.round(u.maxHp * f.turnShield));
    }
    if (u.st.poison > 0) {
      const d = Math.round(u.st.poison * (u.poisonPow || 2) * (u.side === 'enemy' ? 1 + (this.hero.fx.poisonDmg || 0) : 1));
      const [x, y] = this.center(u);
      playFx('poison', x, y, { parent: this.group }) || burst(x, y, { n: 10, cols: ['#60e060', '#30a030', '#a0ff80'], spd: [10, 40], up: 30, size: [2, 3] });
      sfx('poison');
      this.damage(u, d, { dot: true });
      u.st.poison--;
      await wait(260);
      if (!u.alive) return;
    }
    if (u.st.stun) {
      u.st.stun = 0;
      popText(...this.top(u), '기절', 'st');
      const [x, y] = this.top(u);
      if (!playFx('stun', x, y, { parent: this.group })) for (let i = 0; i < 6; i++) spawn({ x: x + Math.cos(i) * 8, y,vx: -Math.sin(i) * 30, vy: Math.cos(i) * 10, life: 500, size: 2, col: '#ffe040' });
      await wait(380);
      this.endTurn(u);
      return;
    }
    if (u.final && !u.phase2 && !(u.kit && u.kit.acts) && u.hp <= u.maxHp / 2) await this.phase2(u);
    if (u.side === 'hero') await this.heroTurn(u); else await this.enemyTurn(u);
    if (this.counterQ) { const c = this.counterQ; this.counterQ = null; if (c.by.alive && c.on.alive) await this.counter(c.by, c.on); }
    this.endTurn(u);
  }
  endTurn(u) {
    for (const k of ['atkUp', 'atkDown', 'defDown', 'evaUp', 'critUp', 'reflect', 'bleed']) if (u.st[k] > 0) u.st[k]--;
    this.cur = null;
    this.help('');
  }

  // ───────── 주인공 입력 ─────────
  async heroTurn(h) {
    sfx('ok');
    for (;;) {
      const c = await this.commandMenu(h);
      let targets = null;
      if (c.type === 'attack' || (c.type === 'skill' && c.skill.target === 'one')) {
        targets = await this.selectTarget();
        if (!targets) continue;
      }
      this.cmdWin.innerHTML = '';
      if (c.type === 'attack') {
        await this.useSkill(h, { name: '공격', mult: 1, hits: 1 + (h.fx.basicHits || 0), target: 'one', vfx: 'slash', fx: {}, basic: true }, targets);
        h.qi = Math.min(h.maxQi, h.qi + 6);
      } else if (c.type === 'skill') {
        let sk = c.skill;
        if (this.jc.ready && sk.target !== 'self') { // 대주천: 내력 없이 확정 치명 절초
          sk = { ...sk, name: '절초 · ' + sk.name, mult: sk.mult * 1.3, fx: { ...sk.fx, sureCrit: 1 }, cutin: true };
          this.jc.ready = false; this.jc.stacks = 0;
        } else h.qi -= sk.cost;
        this.mer.stream(this.qiCol(sk));
        await this.useSkill(h, sk, targets || (sk.target === 'all' ? this.enemies : [h]));
      } else if (c.type === 'guard') {
        h.guard = true;
        this.setPose(h, 'cast', 1);
        const hits = await this.circulationGame();
        h.qi = Math.min(h.maxQi, h.qi + h.maxQi * (0.3 + 0.06 * hits));
        h.gauge += 20;
        this.help(`운기조식 — 通 ${hits}/3 · 주천 +${3 + hits + (hits === 3 ? 2 : 0)} · 피해 반감`);
        const [x, y] = this.center(h);
        for (let i = 0; i < 24 + hits * 10; i++) spawn({ x: x + R(-14, 14), y: y - 16 + R(0, 6), vy: R(30, 80), life: R(300, 600), size: R(1, 3), col: pick(['#80c0ff', '#ffffff', this.qiCol()]), delay: i * 12 });
        sfx('buff');
        this.circulate(3 + hits + (hits === 3 ? 2 : 0));
        await wait(450);
        this.setPose(h, 'idle');
      } else if (c.type === 'pill') {
        await this.usePill(h, c.pill);
      }
      return;
    }
  }
  commandMenu(h) {
    return new Promise(res => {
      const skills = h.skills;
      const items = [
        { html: '공격', type: 'attack' },
        { html: '무공', type: 'skill', disabled: !skills.length },
        { html: '운기조식', type: 'guard' },
        { html: '단약', type: 'pill', disabled: !Object.values(h.pills).some(v => v > 0) },
      ];
      const helps = { attack: '기본 초식. 내력 +6', skill: this.jc.ready ? '<span class="gold">대주천! 다음 무공은 내력 없이 확정 치명 절초</span>' : `익힌 초식을 펼친다 · 소주천 ${this.jc.stacks}/3 (무공 피해 +${this.jc.stacks * 12}%)`, guard: '기를 돌린다 — 빛나는 혈에 맞춰 Z(通!) · 주천 +3 · 피해 반감', pill: '단약을 복용한다(기세 +30)' };
      const m = listMenu(this.cmdWin, items, {
        start: Battle.lastCmd || 0,
        onFocus: it => this.help(helps[it.type]),
        onPick: (it, i) => {
          Battle.lastCmd = i;
          if (it.type === 'skill') return this.skillMenu(h, m, res);
          if (it.type === 'pill') return this.pillMenu(h, m, res);
          m.close(); res({ type: it.type });
        },
      });
    });
  }
  skillMenu(h, parent, res) {
    this.skWin.classList.remove('hidden');
    const items = h.skills.map(s => ({
      html: `<span class="sn" style="color:${SCHOOLS[s.school].color}">${s.combo ? '★' : ''}${s.name}</span><span class="tr">${s.combo ? '합격기' : TIER_NAME[s.tier]}</span><span class="cost">${this.jc.ready && s.target !== 'self' ? '<span class="gold">絶</span>' : s.cost}</span>`,
      disabled: s.cost > h.qi && !(this.jc.ready && s.target !== 'self'), s,
    }));
    if (TOUCH) items.push({ html: '<span class="dim">◀ 뒤로</span>', back: true });
    const close = () => { m.close(); this.skWin.classList.add('hidden'); };
    const m = listMenu(this.skWin, items, {
      cols: 2, start: Battle.lastSkill || 0, preview: true,
      onFocus: it => this.help(it.back ? '명령으로 돌아간다' : `<span style="color:${SCHOOLS[it.s.school].color}">[${SCHOOLS[it.s.school].name}]</span> ${it.s.desc} <span class="dim">내력 ${it.s.cost}</span>`),
      onPick: (it, i) => { if (it.back) { close(); parent.focus(parent.idx); return; } Battle.lastSkill = i; close(); parent.close(); res({ type: 'skill', skill: it.s }); },
      onCancel: () => { close(); parent.focus(parent.idx); },
    });
  }
  pillMenu(h, parent, res) {
    this.skWin.classList.remove('hidden');
    const items = Object.entries(h.pills).filter(([, n]) => n > 0).map(([id, n]) => ({ html: `<span class="sn">${PILLS[id].name}</span><span class="cost">×${n}</span>`, id }));
    if (TOUCH) items.push({ html: '<span class="dim">◀ 뒤로</span>', back: true });
    const close = () => { m.close(); this.skWin.classList.add('hidden'); };
    const m = listMenu(this.skWin, items, {
      cols: 2, preview: true,
      onFocus: it => this.help(it.back ? '명령으로 돌아간다' : PILLS[it.id].desc),
      onPick: it => { if (it.back) { close(); parent.focus(parent.idx); return; } close(); parent.close(); res({ type: 'pill', pill: it.id }); },
      onCancel: () => { close(); parent.focus(parent.idx); },
    });
  }
  barrier(u, pulse) { // 호신이 있는 동안 몸 뒤에 막이 떠 있다(생길 때·늘 때 부풀고, 다 깎이면 깨진다)
    const on = u.alive && u.st.shield > 0, x = Math.round(u.mesh.position.x), y = Math.round(u.mesh.position.y) + 1, k = Math.max(1, u.size / 64);
    if (on && !u.barM) { u.barM = playFx('barrier', x, y, { parent: this.group, loop: true, scale: k, opacity: 0.85 }); pulse = true; }
    else if (!on && u.barM) { u.barM.parent.remove(u.barM); u.barM = null; burst(...this.center(u), { n: 18, cols: ['#a0e0ff', '#ffffff', '#4080d0'], spd: [40, 130], up: 10 }); }
    if (!u.barM) return;
    u.barM.position.set(x, y, 0); u.barM.renderOrder = u.mesh.renderOrder - 1;
    if (pulse) { u.barM.scale.set(k * 0.8, k * 0.8, 1); tween(u.barM.scale, { x: k, y: k }, 180, ease.out); }
  }
  aimAt() {} // 겨눈 적이 바뀔 때(카드 전투가 카드 수치를 고친다)
  selectTarget() {
    const list = this.enemies.sort((a, b) => b.mesh.position.y - a.mesh.position.y || a.mesh.position.x - b.mesh.position.x);
    if (list.length === 1) return Promise.resolve([list[0]]);
    return new Promise(res => {
      let i = Math.max(0, list.indexOf(this.lastTarget));
      const show = () => {
        const t = list[i], [x, y] = toStage(...this.top(t));
        Object.assign(this.cursor.style, { left: Math.round(x - 4) + 'px', top: Math.round(y - 12) + 'px' });
        this.help(`${t.name}  <span class="dim">체력 ${Math.ceil(t.hp)}/${t.maxHp}</span>`);
        this.aimAt(t);
      };
      let done = t => { off(); this.aimAt(null); this.cursor.classList.add('hidden'); list.forEach(u => { u.hit.onclick = u.hit.onmouseenter = null; u.hit.classList.remove('on'); }); if (t) this.lastTarget = t; res(t ? [t] : null); };
      list.forEach((u, j) => { u.hit.classList.add('on'); u.hit.onmouseenter = () => { i = j; show(); }; u.hit.onclick = e => { e.stopPropagation(); sfx('ok'); done(u); }; });
      const off = pushKeys(k => {
        if (k === 'left' || k === 'up') { i = (i + list.length - 1) % list.length; sfx('move'); show(); }
        else if (k === 'right' || k === 'down') { i = (i + 1) % list.length; sfx('move'); show(); }
        else if (k === 'ok') { sfx('ok'); done(list[i]); }
        else if (k === 'cancel') { sfx('cancel'); done(null); }
        return k !== 'speed';
      });
      this.cursor.classList.remove('hidden');
      if (TOUCH) { const b = win(4, 172, 88, 22, this.ui, 'tback'); b.textContent = '◀ 취소'; b.onclick = e => { e.stopPropagation(); sfx('cancel'); done(null); }; const d0 = done; done = t => { b.remove(); d0(t); }; }
      show();
    });
  }
  async usePill(h, id) {
    h.pills[id]--;
    this.help(PILLS[id].name + '을(를) 복용했다');
    this.setPose(h, 'cast');
    const [x, y] = this.center(h);
    if (id === 'geumchang') this.heal(h, h.maxHp * 0.35);
    if (id === 'sohwan') { h.qi = Math.min(h.maxQi, h.qi + h.maxQi * 0.5); popText(x, y + 20, '내력 회복', 'qi'); sfx('heal'); this.circulate(2); }
    if (id === 'haedok') { for (const k of ['poison', 'bleed', 'atkDown', 'defDown']) h.st[k] = 0; popText(x, y + 20, '해독', 'heal'); sfx('heal'); }
    if (id === 'daeryeok') { h.st.atkUp = 4; popText(x, y + 20, '공력↑', 'st'); sfx('buff'); }
    burst(x, y, { n: 18, cols: ['#ffffff', '#ffe080', '#80ff80'], spd: [20, 60], up: 30 });
    await wait(300);
    if (id === 'byeokryeok') {
      sfx('boom'); flashScreen('#fff', 150, 0.7); shake(5, 300);
      for (const t of this.enemies) { const [tx, ty] = this.center(t); burst(tx, ty, { n: 40, cols: ['#ffe040', '#ff8020', '#ffffff', '#404040'], spd: [40, 160], size: [2, 4] }); this.damage(t, 30 + this.region * 28, {}); }
      await wait(400);
    }
    h.gauge += 30;
    this.setPose(h, 'idle');
  }

  // ───────── 적 AI ─────────
  async enemyTurn(u) {
    if (u.charging) { const sk = u.charging; u.charging = null; await this.useSkill(u, sk, sk.target === 'self' ? [u] : this.foes(u)); return; }
    const opts = u.skills.filter(s => !(s.target === 'self' && s.fx.buff && Object.keys(s.fx.buff).some(k => u.st[k] > 0)) && !(s.charge && u.hp > u.maxHp * 0.85 && u.boss && Math.random() < 0.5));
    let tot = opts.reduce((a, s) => a + (s.w || 1), 0), r = Math.random() * tot, sk = opts[0];
    for (const s of opts) { r -= s.w || 1; if (r <= 0) { sk = s; break; } }
    if (sk.charge) {
      u.charging = sk;
      this.help(`<span style="color:#ff6060">${u.name}이(가) 「${sk.name}」의 기를 모은다!</span>`);
      this.setPose(u, 'cast'); sfx('charge');
      const [x, y] = this.center(u);
      playFx('charge', x, y, { parent: this.group }) || ring(x, y, 4, ['#ff3040', '#ff8080'], 28, 120);
      popText(...this.top(u), '기를 모은다!', 'warn');
      await wait(650);
      this.setPose(u, 'idle');
      return;
    }
    await this.useSkill(u, sk, sk.target === 'self' ? [u] : this.foes(u));
  }
  async phase2(u) { // 최종 보스 2페이즈: 데이터(phase2)에 이름·소환이 있으면 그걸로, 없으면 천마해체대법
    const P = ENEMIES[u.id].phase2 || { name: '천마해체대법', summon: ['bunsin'], banner: '천마의 분신이 나타났다!', ghost: true };
    await this.cutin(P.name, u, true);
    playFx('phase2', ...this.center(u), { parent: this.group, layer: u.mesh.renderOrder - 1 });
    u.phase2 = true;
    u.spd *= 1.5; u.atk *= 1.15; u.fx = { ...u.fx, lifesteal: 0.15 };
    if (P.ghost) u.mesh.material.uniforms.tint.value.setRGB(1.25, 0.8, 0.8); else u.mesh.material.uniforms.tint.value.setRGB(1.2, 1.1, 0.85);
    [SLOTS[1], SLOTS[3]].forEach((s, i) => {
      const b = this.makeUnit(enemyStats(P.summon[i % P.summon.length], this.region, this.routeMul), 'enemy', s);
      if (P.ghost) b.mesh.material.uniforms.tint.value.setRGB(1.35, 0.55, 0.6);
      b.mesh.material.uniforms.opacity.value = 0;
      tween(b.mesh.material.uniforms.opacity, { value: P.ghost ? 0.85 : 1 }, 400);
      burst(s[0], s[1] + 16, { n: 30, cols: P.ghost ? ['#ff2040', '#600010', '#ff8080'] : ['#ffe080', '#ffffff', '#80c0ff'], spd: [20, 90] });
    });
    this.banner(P.banner, 'red');
    await wait(600);
  }

  // ───────── 초식 실행 ─────────
  async useSkill(a, sk, targets) {
    this.help(`<span style="color:${a.side === 'hero' ? '#ffffff' : '#ffb0b0'}">${a.name}</span> 「${sk.name}」`);
    if (sk.cutin || sk.combo) await this.cutin(sk.name, a, a.side !== 'hero');
    const fx = sk.fx || {};
    if (sk.target === 'self') {
      this.playSeq(a, 'cast');
      await this.castFx(a, sk, [a]);
      this.selfFx(a, fx);
      await wait(220);
      this.setPose(a, 'idle');
      return;
    }
    const melee = MELEE.has(sk.vfx) && sk.target === 'one';
    if (melee) await this.dashTo(a, targets[0]);
    else { this.playSeq(a, a.atkCut ? 'atk' : 'cast', 90); if (a.boss && a.seq?.atk) this.bossGlint(a); await this.castFx(a, sk, targets); }
    let hits = sk.randomHits ? sk.randomHits[0] + Math.floor(Math.random() * (sk.randomHits[1] - sk.randomHits[0] + 1)) : sk.hits || 1;
    if (hits > 1 && a.fx.extraHits && !sk.basic) hits += a.fx.extraHits;
    for (let i = 0; i < hits; i++) {
      const n4 = (a.seq?.atk?.length || 0) >= 4, SF = n4 ? 2 : 1, PF = n4 ? 1 : 0;
      if (a.seq?.atk && (melee || (i === 0 && a.boss))) { if (i === 0 && melee) { this.setPose(a, 'atk', PF); await wait(45); } this.setPose(a, 'atk', i % 2 ? PF : SF); if (i === 0 && a.boss) this.bossStrike(a); }
      else if (melee) { this.setPose(a, i % 2 ? 'idle' : 'atk'); if (i % 2) { a.mesh.position.x += a.side === 'hero' ? 3 : -3; } }
      if (i === 0 && sk.cutin && targets[0]?.alive) playFx('finisher', ...this.center(targets[0]), { parent: this.group, scale: 2, layer: 4500 }); // 절초: 집중선
      for (const t of targets) if (t.alive) this.hitOne(a, t, sk, i === hits - 1, i);
      if (!this.foes(a).length) break;
      await wait(hits > 3 ? 75 : hits > 1 ? 120 : 160);
    }
    if (fx.sealAll) for (const t of this.foes(a)) { t.gauge = Math.max(0, t.gauge - fx.sealAll); popText(...this.top(t), '점혈', 'st'); }
    this.selfFx(a, fx, true);
    if (a.seq?.atk && (melee || a.boss)) { this.setPose(a, 'atk', a.seq.atk.length - 1); if (a.boss) this.bossDust(a); }
    await wait(120);
    if (melee) await this.dashBack(a); else this.setPose(a, 'idle');
  }
  selfFx(a, fx, afterAttack) {
    const [x, y] = this.top(a);
    if (fx.haste) { a.gauge += fx.haste; popText(x, y + 8, '경공 +' + fx.haste, 'st'); }
    if (fx.buff) for (const k in fx.buff) { a.st[k] = fx.buff[k] + 1; popText(x, y, ST_ICON[k][0], 'st'); }
    if (fx.shield) { a.st.shield += Math.round(a.maxHp * fx.shield); popText(x, y - 8, '호신강기', 'qi'); playFx('aura', ...this.center(a), { parent: this.group }); }
    if (fx.counterStance) { a.st.counter = 1; popText(x, y + 16, '반격태세', 'st'); }
    if (fx.qi) a.qi = Math.min(a.maxQi, a.qi + fx.qi);
    if (fx.heal) this.heal(a, a.maxHp * fx.heal);
    if (fx.selfDmgPct && afterAttack) { a.hp = Math.max(1, a.hp - a.maxHp * fx.selfDmgPct); popText(x, y, '-' + Math.round(a.maxHp * fx.selfDmgPct), 'dmg'); }
    if (fx.haste || fx.buff || fx.shield || fx.counterStance) { sfx('buff'); playFx('buff', ...this.center(a), { parent: this.group, tint: a.side === 'hero' ? this.qiCol() : '#ff9090' }); }
  }

  calc(a, t, sk) {
    const sure = sk.fx?.sureCrit || (a.fx.critFirst && a.firstHit && a.side === 'hero');
    let eva = (t.eva || 0) + (t.fx.eva || 0) + (t.st.evaUp ? 25 : 0) + (t.fx.drunkEva ? t.fx.drunkEva * (1 - t.hp / t.maxHp) : 0);
    if (!sk.isCounter && Math.random() * 100 < eva) return { miss: true };
    const low = a.hp < a.maxHp / 2 ? (a.fx.lowHpAtk || 0) : 0;
    const atk = a.atk * (1 + (a.st.atkUp ? 0.3 : 0) - (a.st.atkDown ? 0.25 : 0) + (a.fx.atkPct || 0) + low);
    const def = t.def * (t.st.defDown ? 0.6 : 1) * (1 - (a.fx.pierce || 0));
    let d = atk * sk.mult * 50 / (50 + def) * R(0.9, 1.1);
    if (!sk.basic && !sk.isCounter && a.side === 'hero') d *= 1 + (a.fx.skillDmg || 0) + 0.12 * this.jc.stacks;
    if (sk.mult >= 2) d *= 1 + (a.fx.strongDmg || 0);
    const crit = sure || Math.random() * 100 < (a.crit || 0) + (a.fx.crit || 0) + (a.st.critUp ? 30 : 0);
    if (crit) d *= 1.75 + (a.fx.critDmg || 0);
    if (t.guard) d *= 0.5;
    d *= 1 - Math.min(0.6, t.fx.dmgReduce || 0);
    if (t.st.bleed) d += t.st.bleed * (t.bleedPow || 2);
    a.firstHit = false;
    return { dmg: Math.max(1, Math.round(d)), crit };
  }

  hitOne(a, t, sk, last, idx) {
    const r = this.calc(a, t, sk), fx = sk.fx || {};
    const [x, y] = this.center(t);
    if (r.miss) {
      popText(x, y + 18, 'MISS', 'miss'); sfx('miss');
      const hx = t.home[0] + (t.side === 'hero' ? 8 : -8);
      tween(t.mesh.position, { x: hx }, 80).then(() => tween(t.mesh.position, { x: t.home[0] }, 160));
      return;
    }
    this.hitFx(sk.vfx, t, r.crit, sk.mult >= 2, idx);
    this.damage(t, r.dmg, { crit: r.crit, src: a, strong: sk.mult >= 2, last: last && idx > 0 });
    const ls = (fx.lifesteal || 0) + (a.fx.lifesteal || 0);
    if (ls && a.alive) this.heal(a, r.dmg * ls, true);
    if (a.fx.qiOnHit) a.qi = Math.min(a.maxQi, a.qi + a.fx.qiOnHit);
    if (a.fx.sealOnHit) t.gauge = Math.max(0, t.gauge - a.fx.sealOnHit);
    if (r.crit && a.fx.critBleed) this.addSt(a, t, 'bleed', a.fx.critBleed);
    // 반사
    const refl = (t.fx.thorns || 0) + (t.st.reflect ? 0.5 : 0);
    if (refl && a.alive && !sk.isCounter) this.damage(a, Math.max(1, Math.round(r.dmg * refl)), { dot: true });
    if (!t.alive) return;
    if (last) {
      if (fx.poison) this.addSt(a, t, 'poison', fx.poison);
      if (a.fx.poisonOnHit && !sk.isCounter) this.addSt(a, t, 'poison', a.fx.poisonOnHit);
      if (fx.bleed) this.addSt(a, t, 'bleed', fx.bleed);
      if (fx.defDown) { t.st.defDown = Math.max(t.st.defDown, fx.defDown); popText(...this.top(t), '방어↓', 'st'); }
      if (fx.atkDown) { t.st.atkDown = Math.max(t.st.atkDown, fx.atkDown); popText(...this.top(t), '공력↓', 'st'); }
      if (fx.seal) { t.gauge = Math.max(0, t.gauge - fx.seal); popText(x, y + 26, '점혈 -' + fx.seal, 'st'); if (t.side === 'hero' && this.jc.p > 0) { this.jc.p = Math.max(0, this.jc.p - 2); this.mer.flash(this.jc.p, '#ff3040'); popText(x, y + 34, '혈 막힘', 'warn'); } }
      if (fx.stun) {
        let ch = fx.stun + (a.fx.stunBonus || 0);
        if (t.boss && ch < 1) ch *= 0.5;
        if (Math.random() < ch) { t.st.stun = 1; popText(...this.top(t), '기절!', 'st'); }
      }
      if (fx.poisonBurst && t.st.poison) {
        const d = Math.round(t.st.poison * 6 * (t.poisonPow || 2) * (1 + (a.fx.poisonDmg || 0)));
        burst(x, y, { n: 50, cols: ['#60ff60', '#20a020', '#e0ffe0', '#004000'], spd: [30, 150], size: [2, 4] });
        this.damage(t, d, { crit: true });
        t.st.poison *= 2;
      }
      // 반격
      if (sk.target === 'one' && !sk.isCounter && a.side !== t.side && !this.counterQ && t.alive) {
        const ch = t.st.counter ? 1 : (t.fx.counter || 0);
        if (Math.random() < ch) { t.st.counter = 0; this.counterQ = { by: t, on: a }; }
      }
    }
  }
  addSt(a, t, k, n) {
    if (k === 'poison' && t.fx.poisonImmune) { popText(...this.top(t), '면역', 'st'); return; }
    t.st[k] += n;
    if (k === 'poison') t.poisonPow = Math.max(t.poisonPow || 0, 1 + a.atk * 0.15);
    if (k === 'bleed') t.bleedPow = Math.max(t.bleedPow || 0, 1 + a.atk * 0.12);
    popText(...this.top(t), (k === 'poison' ? '중독 +' : '출혈 +') + n, k === 'poison' ? 'poison' : 'dmg');
  }

  // 연출 단계(HIT_TIER): 쓰러뜨리는 일격·큰 피해·치명일수록 높다. last: 연타의 마지막 타
  hitTier(t, n, { crit, strong, last } = {}) {
    if (t.hp <= 0 && (t.side === 'hero' || !this.enemies.some(u => u !== t))) return 3;
    const s = n / t.maxHp;
    return crit || t.hp <= 0 || n >= 16 || s >= 0.3 ? 2 : strong || last || n >= 8 || s >= 0.15 ? 1 : 0;
  }
  popCls(t, tier, dot) { return dot ? 'dot' : tier >= 2 ? 'crit' : (t.side === 'hero' ? 'hurt' : 'dmg') + (tier === 1 ? ' big' : ''); }
  impact(t, tier) { // 맞은 연출: 단계만큼 멈춤·카메라 밀림·확대·반전·넉백을 키운다(주인공은 오른쪽, 적은 왼쪽 — 맞은 쪽 바깥으로 밀린다)
    const T = HIT_TIER[tier], [x, y] = this.center(t), dir = t.side === 'hero' ? 1 : -1;
    const boost = t.side === 'enemy' ? 1 + Math.min(0.5, 0.12 * Math.max(0, (this.chain || 1) - 1)) : 1; // 연환을 이을수록 세게
    const f = t.mesh.material.uniforms.flash; f.value = 1; tween(f, { value: 0 }, 140 + tier * 40);
    hitstop(T.stop); t.trem = T.stop + 60; t.tremA = tier >= 2 ? 2 : 1;
    camKick(dir, T.kick * boost, T.kms);
    if (T.zoom) camZoom(x, y, T.zoom, T.stop + (tier === 3 ? 520 : 40), tier === 3 ? 420 : 240);
    if (T.inv) impactFrame(T.inv);
    if (tier >= 2) flashScreen('#fff', 80, 0.35);
    if (tier === 3) slowmo(0.3, 900);
    hitSfx(tier, this.lastVfx, t.side === 'hero'); if (tier >= 2) music.duck(tier === 3 ? 0.28 : 0.55, tier === 3 ? 850 : 240); // 큰 타격엔 음악이 잠깐 비켜 준다
    const gx = t.mesh.position.x, gy = t.mesh.position.y;
    if (T.dust) playFx('dust', gx, gy + 1, { parent: this.group, flip: dir < 0 }) || burst(gx, gy + 2, { n: 10, cols: ['#d8c8a8', '#a89878'], spd: [20, 70], up: 20 });
    if (tier >= 1) burst(x, y, { n: 6 + tier * 8, cols: ['#ffffff', '#fff0a0', '#ffd060'], spd: [140, 220 + tier * 50], life: [90, 180], size: [1, 2], drag: 6 }); // 사방으로 튀는 불똥
    if (tier >= 2) ring(x, y, 4, ['#ffffff', '#fff0a0'], 20 + tier * 6, 150 + tier * 30); // 터지는 고리
    if (tier === 3) { playFx('finisher', x, y, { parent: this.group, scale: 1.6, opacity: 0.5, layer: 4500 }); ring(x, gy + 1, 10, ['#e0d0b0', '#ffffff'], 28, 160); } // 집중선 + 땅울림
    if (!t.alive || t.pose === 'atk') return;
    this.playSeq(t, 'hurt', 90);
    if (t.hp <= 0 && t.side === 'enemy') { tween(t.mesh.position, { x: t.home[0] + dir * T.kb * 2 }, 300, ease.out); return; } // 쓰러지는 적은 날아간 채로
    tween(t.mesh.position, { x: t.home[0] + dir * T.kb }, 60 + tier * 20).then(() => tween(t.mesh.position, { x: t.home[0] }, 140 + tier * 60)).then(() => { if (t.alive && t.pose === 'hurt') this.setPose(t, 'idle'); });
  }
  damage(t, d, { crit, strong, dot, last } = {}) {
    if (!t.alive || (t.side === 'hero' && this.yielded)) return;
    const [x, y] = this.center(t);
    if (t.st.shield > 0) {
      const ab = Math.min(t.st.shield, d);
      t.st.shield -= ab; d -= ab;
      playFx('shield', x, y, { parent: this.group, flip: t.side === 'hero' }) || ring(x, y, 10, ['#80c0ff', '#ffffff'], 16, 40);
      sfx('guard'); if (!d) { popText(x, y + 14, '막음', 'qi'); return; }
    }
    t.hp -= d;
    const tier = dot ? -1 : this.hitTier(t, d, { crit, strong, last });
    popText(x + R(-4, 4), y + 14, tier >= 2 ? d + '!' : '' + d, this.popCls(t, tier, dot));
    if (!dot) this.impact(t, tier);
    if (t.hp <= 0) {
      if (t.side === 'hero' && this.kind === 'duel' && !this.toDeath) { t.hp = 1; this.yielded = true; this.banner('손을 멈췄다 — 비무 패배', 'red'); return; }
      if (t.side === 'hero' && t.fx.revive && !this.reviveUsed) {
        this.reviveUsed = true;
        t.hp = Math.round(t.maxHp * t.fx.revive);
        flashScreen('#ffe080', 300, 0.8); sfx('heal');
        burst(x, y, { n: 60, cols: ['#ffe080', '#ffffff', '#ffb040'], spd: [20, 120], up: 40 });
        this.banner('대환단의 약효로 되살아났다!');
        return;
      }
      this.kill(t);
    }
  }
  heal(t, n, quiet) {
    n = Math.round(n);
    if (n <= 0 || !t.alive) return;
    t.hp = Math.min(t.maxHp, t.hp + n);
    const [x, y] = this.center(t);
    popText(x, y + 20, '+' + n, 'heal');
    if (!quiet) { sfx('heal'); if (!playFx('heal', t.mesh.position.x, t.mesh.position.y + 1, { parent: this.group })) for (let i = 0; i < 16; i++) spawn({ x: x + R(-12, 12), y: y - 12, vy: R(20, 60), life: 500, size: 2, col: pick(['#80ff80', '#ffffff']), delay: i * 15 }); }
  }
  kill(t) {
    t.alive = false; t.hp = 0; t.charging = null;
    this.setPose(t, 'dead');
    sfx('die');
    const [x, y] = this.center(t);
    burst(x, y, { n: 24, cols: t.side === 'hero' ? ['#ff4040', '#800000'] : ['#ffffff', '#c0c0c0', '#ff6060'], spd: [20, 100], grav: -150, up: 60 });
    if (t.side === 'enemy') {
      this.kills.push(t.id);
      wait(250).then(() => tween(t.mesh.material.uniforms.opacity, { value: 0 }, 450));
    }
  }
  async counter(by, on) {
    popText(...this.top(by), '반격!', 'st');
    await wait(120);
    await this.useSkill(by, { name: '반격', mult: 0.8, hits: 1, target: 'one', vfx: by.side === 'hero' ? 'slash' : (by.skills[0].vfx || 'slash'), fx: {}, isCounter: true, basic: true }, [on]);
    if (by.fx.counterHaste) by.gauge += by.fx.counterHaste;
  }

  // ───────── 이동 / 잔상 ─────────
  ghost(u, col) {
    const g = quad(u.mesh.material.uniforms.map.value, { parent: this.group });
    g.position.copy(u.mesh.position); g.scale.copy(u.mesh.scale);
    g.renderOrder = u.mesh.renderOrder - 1;
    g.material.uniforms.opacity.value = 0.55;
    g.material.uniforms.tint.value.set(col || (u.side === 'hero' ? '#80c0ff' : '#ff6080'));
    tween(g.material.uniforms.opacity, { value: 0 }, 220).then(() => dispose(g));
  }
  async trail(u, n = 3, gap = 35) { for (let i = 0; i < n; i++) { this.ghost(u); await wait(gap); } }
  async dashTo(a, t) {
    const dir = a.side === 'hero' ? 1 : -1;
    const tx = t.mesh.position.x + dir * (t.w / 2 + a.w / 2 - 10);
    if (a.seq?.atk) { this.setPose(a, 'atk', 0); if (a.boss) this.bossGlint(a); }
    const sy = a.mesh.scale.y, x0 = a.mesh.position.x, y0 = a.mesh.position.y, mv = Math.sign(tx - x0) || -dir;
    await tween(a.mesh.scale, { y: sy * 0.86 }, 70, ease.out); // 웅크렸다가 튀어 나간다
    a.mesh.scale.y = sy * 1.08; tween(a.mesh.scale, { y: sy }, 160); if (a.atkCut) this.setPose(a, 'atk');
    burst(x0, y0 + 2, { n: 8, cols: ['#d8c8a8', '#a89878', '#ffffff'], spd: [30, 80], ang: mv < 0 ? [0, 0.7] : [Math.PI - 0.7, Math.PI], life: [160, 320], size: [1, 2] }); // 박차는 흙먼지
    for (let i = 0; i < 6; i++) { const yy = y0 + R(6, a.size * 0.8); for (let j = 0; j < 5; j++) spawn({ x: x0 - mv * j * 4, y: yy, vx: mv * 90, life: 120 + j * 12, size: 1, col: j ? '#b8c8e8' : '#ffffff', delay: i * 14 }); } // 속도선
    this.trail(a, a.spd > 13 || a.side === 'hero' ? 4 : 2);
    sfx('slash');
    await tween(a.mesh.position, { x: tx, y: t.mesh.position.y - 1 }, 130, ease.in);
    a.mesh.renderOrder = t.mesh.renderOrder + 1;
  }
  async dashBack(a) {
    this.setPose(a, 'idle');
    await tween(a.mesh.position, { x: a.home[0], y: a.home[1] }, 150, ease.out);
    a.mesh.renderOrder = 1000 - a.home[1];
  }

  // ───────── VFX ─────────
  sprite(t, x, y, { scale = [0.6, 1.3], rot = R(-0.8, 0.8), spin = 0, ms = 200, flip = false, op = 1 } = {}) {
    const m = quad(t, { anchor: 'center', parent: this.group });
    m.position.set(x, y, 0); m.rotation.z = rot; m.renderOrder = 4000;
    m.scale.set(scale[0] * (flip ? -1 : 1), scale[0], 1);
    m.material.uniforms.opacity.value = op;
    const s = { k: scale[0], r: rot };
    tween(s, { k: scale[1], r: rot + spin }, ms).then(() => dispose(m));
    const off = onFrame(() => { m.scale.set(s.k * (flip ? -1 : 1), s.k, 1); m.rotation.z = s.r; m.material.uniforms.opacity.value = op * (1 - Math.max(0, (s.k - scale[0]) / (scale[1] - scale[0]) - 0.5) * 2); });
    wait(ms + 5).then(off);
    return m;
  }
  hitFx(v, t, crit, strong, idx) {
    this.lastVfx = v;
    const [x, y] = this.center(t), T = VT, flip = t.side === 'enemy';
    const sparks = (cols, n = 10) => burst(x, y, { n, cols, spd: [50, 160], life: [150, 320], size: [1, 2] });
    const P = (id, px = x, py = y, o) => playFx(id, px, py, { parent: this.group, flip, flipY: idx % 2 === 1, ...o });
    if (v === 'ice') { P('slash', x, y, { tint: '#b8f0ff' }); P('iceHit', x, y, { flip: false, flipY: false, scale: 0.8 }); }
    else if (P(HIT_FX[v] || 'hit', x, v === 'wave' || v === 'roar' || v === 'acid' ? t.mesh.position.y + 1 : y)) { // 시트가 있으면 시트(+상징 스프라이트), 없으면 아래 파티클
      if (v === 'petal' && idx === 0) P('petals', x, y, { flipY: false });
      if (v === 'taiji') this.sprite(T.taiji, x, y, { scale: [0.6, 1.4], rot: 0, spin: 3, ms: 280 });
      if (v === 'gold') this.sprite(T.manja, x, y, { scale: [0.5, 1.6], rot: 0, spin: 0.6, ms: 260 });
      if (v === 'dragon') flashScreen('#fff4c0', 160, 0.6);
    } else switch (v) {
      case 'slash': this.sprite(T.white, x, y, { rot: R(-0.5, 0.5) + (idx % 2) * 2.5, flip }); sparks(['#ffffff', '#fff0a0']); break;
      case 'slashB': this.sprite(T.blue, x, y, { rot: R(-0.5, 0.5) + (idx % 2) * 2.5, flip }); sparks(['#a0d0ff', '#ffffff', '#4080ff']); break;
      case 'petal':
        this.sprite(T.pink, x + R(-6, 6), y + R(-6, 6), { rot: R(0, 6.28), ms: 150 });
        for (let i = 0; i < 9; i++) spawn({ x, y, vx: R(-90, 90), vy: R(-30, 90), ay: -60, drag: 2.5, life: R(400, 750), size: 2, col: pick(['#ffb0d0', '#ff70a0', '#ffffff', '#ffd0e0']) });
        break;
      case 'gold': this.sprite(T.manja, x, y, { scale: [0.5, 1.6], rot: 0, spin: 0.6, ms: 260 }); sparks(['#ffd040', '#ffffff', '#ff9020'], 14); break;
      case 'taiji': this.sprite(T.taiji, x, y, { scale: [0.6, 1.4], rot: 0, spin: 3, ms: 280 }); sparks(['#ffffff', '#80a0ff']); break;
      case 'palm': ring(x, y, 3, ['#ffffff', '#e0e0ff'], 20, 120); sparks(['#ffffff', '#c0c0c0']); break;
      case 'roar': ring(x, y, 4, ['#ffe080', '#ffffff'], 18, 90); sparks(['#ffffff']); break;
      case 'staff': this.sprite(T.brown, x, y, { rot: R(-0.4, 0.4), flip }); sparks(['#ffe040', '#ffffff', '#c09050']); break;
      case 'claw': for (let k = -1; k <= 1; k++) for (let i = 0; i < 9; i++) spawn({ x: x - 10 + i * 2.4, y: y + 10 - i * 2.4 + k * 6, life: 180 + i * 10, size: 1, col: i < 2 ? '#ffffff' : '#ff4050' }); sparks(['#ff6070', '#ffffff'], 6); break;
      case 'bite': sparks(['#ff4050', '#ffffff', '#a01020'], 12); break;
      case 'darts': sparks(['#e0e8ff', '#ffffff', '#8090a8'], 8); break;
      case 'poison': for (let i = 0; i < 12; i++) spawn({ x: x + R(-10, 10), y: y + R(-8, 8), vx: R(-20, 20), vy: R(10, 45), drag: 1, life: R(400, 700), size: R(2, 4), col: pick(['#60e060', '#30a030', '#a0ff80', '#204020']) }); break;
      case 'dragon': burst(x, y, { n: 50, cols: ['#ffe040', '#ffb020', '#ffffff', '#ff8000'], spd: [60, 220], size: [2, 4] }); ring(x, y, 6, ['#ffe040', '#ffffff'], 30, 160); flashScreen('#fff4c0', 160, 0.6); break;
      case 'blood': this.sprite(T.red, x, y, { rot: R(-0.5, 0.5) + (idx % 2) * 2.5, flip }); for (let i = 0; i < 12; i++) spawn({ x, y, vx: R(-80, 80), vy: R(20, 120), ay: -380, life: R(300, 600), size: R(1, 3), col: pick(['#d01020', '#800010', '#ff4050']) }); break;
      case 'wave': for (let i = 0; i < 16; i++) spawn({ x: x + R(-8, 8), y: y - 8, vx: R(-60, 60), vy: R(40, 150), ay: -400, life: R(300, 600), size: 2, col: pick(['#80c0ff', '#ffffff', '#3070c0']) }); break;
      case 'wind': sparks(['#ffffff', '#c0d0e0']); break;
      default: sparks(['#ffffff', '#fff0a0']);
    }
    if (crit) P('crit', x, y, { flipY: false }) || burst(x, y, { n: 16, cols: ['#ffff60', '#ffffff'], spd: [100, 240], life: [120, 260], size: [1, 2] });
    else if (strong) P('strong', x, y, { flipY: false }) || ring(x, y, 2, ['#ffffff'], 16, 140);
  }
  async castFx(a, sk, targets) {
    const [ax, ay] = this.center(a), v = sk.vfx;
    const dirTo = t => { const [tx, ty] = this.center(t); return [tx, ty, tx - ax, ty - ay]; };
    switch (v) {
      case 'nova': case 'toxcloud': { // 적들 발밑 한가운데에 퍼진다
        const cx = targets.reduce((n, t) => n + t.mesh.position.x, 0) / Math.max(1, targets.length), gy = Math.min(...targets.map(t => t.mesh.position.y));
        playFx(v === 'nova' ? 'iceNova' : 'toxCloud', cx, gy, { parent: this.group, layer: 4200, scale: v === 'nova' ? 1 : 1.3 }); if (v === 'toxcloud') for (const t of targets) playFx('poison', ...this.center(t), { parent: this.group, layer: 4200 }); sfx(v === 'nova' ? 'buff' : 'poison'); await wait(300); break;
      }
      case 'darts': {
        sfx('slash');
        for (const t of targets) { const [tx, ty, dx, dy] = dirTo(t); for (let i = 0; i < 4; i++) spawn({ x: ax, y: ay + R(-4, 4), vx: dx * 6, vy: dy * 6, life: 160, size: 2, col: '#e8f0ff', fade: false, delay: i * 25 }); }
        await wait(170); break;
      }
      case 'poison': {
        for (const t of targets) { const [, , dx, dy] = dirTo(t); for (let i = 0; i < 14; i++) spawn({ x: ax, y: ay, vx: dx * 4 + R(-15, 15), vy: dy * 4 + R(-15, 15), life: 250, size: R(2, 4), col: pick(['#60e060', '#208020', '#a0ff80']), delay: i * 10 }); }
        sfx('poison'); await wait(240); break;
      }
      case 'dragon': {
        sfx('charge');
        const [tx, ty] = this.center(targets[0]);
        for (let s = 0; s <= 28; s++) { // 황금 용: 굵은 몸통 + 비늘 + 머리
          const k = s / 28, x = ax + (tx - ax) * k, y = ay + (ty - ay) * k + Math.sin(k * Math.PI * 3) * 18;
          for (let i = 0; i < 7; i++) spawn({ x: x + R(-4, 4), y: y + R(-4, 4), life: 340, size: R(3, 5), col: pick(['#ffe040', '#ffb020', '#ff8000', '#ffffff']), shrink: 0.6 });
          spawn({ x, y: y + 5, life: 300, size: 2, col: '#ff4000' });
          spawn({ x: x + R(-8, 8), y: y + R(-8, 8), vy: R(-20, 20), vx: R(-20, 20), life: 400, size: 1, col: '#fff8c0' });
          spawn({ x, y, life: 90, size: 9, col: '#fff8c0' });
          await wait(12);
        }
        shake(3, 200);
        break;
      }
      case 'roar': {
        sfx('boom'); shake(4, 400); playFx('roar', ax, ay, { parent: this.group });
        for (let i = 0; i < 3; i++) { ring(ax, ay, 4, ['#ffe080', '#ffffff', '#ffb040'], 30, 160 + i * 40); await wait(70); }
        break;
      }
      case 'wave': {
        for (const t of targets) { const [, , dx, dy] = dirTo(t); for (let i = 0; i < 24; i++) spawn({ x: ax, y: ay - 10 + R(-6, 6), vx: dx * 3.2, vy: dy * 3.2 + R(-20, 20), life: 300, size: R(2, 3), col: pick(['#80c0ff', '#ffffff', '#3070c0']), delay: i * 6 }); }
        sfx('slash'); await wait(280); break;
      }
      case 'wind': case 'windP': {
        const cols = v === 'windP' ? ['#ffb0d0', '#ffffff', '#ff70a0'] : ['#ffffff', '#c0e0ff', '#80a0ff'];
        if (!playFx(v, a.mesh.position.x, a.mesh.position.y + 1, { parent: this.group })) for (let i = 0; i < 30; i++) { const ang = i / 30 * Math.PI * 4; spawn({ x: ax + Math.cos(ang) * 14, y: ay - 14 + i, vx: -Math.sin(ang) * 60, vy: 40, life: 350, size: 2, col: pick(cols), delay: i * 6 }); }
        this.trail(a, 3, 40); sfx('slash'); await wait(220); break;
      }
      case 'gold': {
        if (!playFx('goldCast', ax, ay, { parent: this.group, layer: a.mesh.renderOrder - 1 })) { this.sprite(VT.manja, ax, ay, { scale: [0.6, 2.2], rot: 0, spin: 1, ms: 420, op: 0.9 });
        ring(ax, ay, 6, ['#ffd040', '#ffffff'], 28, 90); } sfx('buff'); await wait(300); break;
      }
      case 'taiji': {
        playFx('taijiCast', a.mesh.position.x, a.mesh.position.y + 1, { parent: this.group, layer: a.mesh.renderOrder - 1 });
        this.sprite(VT.taijiBig, ax, ay, { scale: [0.4, 1.2], rot: 0, spin: 5, ms: 420, op: 0.85 });
        await wait(260); break;
      }
      case 'blood': {
        for (const t of targets) { const [, , dx, dy] = dirTo(t); for (let i = 0; i < 18; i++) spawn({ x: ax, y: ay + R(-8, 8), vx: dx * 3.5 + R(-20, 20), vy: dy * 3.5 + R(-20, 20), life: 300, size: R(2, 4), col: pick(['#d01020', '#600010', '#ff3040']), delay: i * 8 }); }
        sfx('slash'); await wait(280); break;
      }
      case 'petal': {
        for (const t of targets) { const [, , dx, dy] = dirTo(t); for (let i = 0; i < 20; i++) spawn({ x: ax, y: ay + R(-10, 10), vx: dx * 3 + R(-30, 30), vy: dy * 3 + R(-30, 30), life: 340, size: 2, col: pick(['#ffb0d0', '#ff70a0', '#ffffff']), delay: i * 8 }); }
        this.trail(a, 2); sfx('slash'); await wait(300); break;
      }
      default: { burst(ax, ay, { n: 10, cols: ['#ffffff'], spd: [20, 60] }); await wait(160); }
    }
  }
  // ── 내공: 주천 ──
  qiCol(sk) { return SCHOOL_QI[(sk && sk.school) || this.hero.sect || 'none'] || SCHOOL_QI.none; }
  jcState(extra = {}) { const h = this.hero; return { p: this.jc.p, stacks: this.jc.stacks, ready: this.jc.ready, qi: h.qi / h.maxQi, col: this.qiCol(), ...extra }; }
  circulate(n) {
    if (this.jc.ready) return;
    this.jc.p += n;
    while (this.jc.p >= JC && !this.jc.ready) {
      this.jc.p -= JC; this.jc.stacks++;
      const [x, y] = this.top(this.hero);
      if (this.jc.stacks >= 3) { this.jc.ready = true; this.jc.p = JC; popText(x, y + 10, '대주천!', 'crit'); sfx('level'); flashScreen('#ffe080', 300, 0.5); }
      else { popText(x, y + 10, '소주천', 'st'); sfx('buff'); }
      burst(...this.center(this.hero), { n: 30, cols: [this.qiCol(), '#ffffff'], spd: [30, 110], up: 20 });
      playFx(this.jc.ready ? 'goldCast' : 'buff', ...this.center(this.hero), { parent: this.group, tint: this.jc.ready ? '#ffffff' : this.qiCol(), layer: this.hero.mesh.renderOrder - 1 }); // 대주천: 금빛 후광, 소주천: 문파색
    }
  }
  circulationGame() { // 커진 경맥도 위로 기가 한 바퀴. 빛나는 혈 3곳에서 Z(또는 클릭) → 通
    return new Promise(res => {
      const ov = el('div', 'jcgame', '<div class="win"><div class="jt">운기조식 — 빛나는 혈에서 Z</div><div class="jr"></div></div>', this.ui);
      const cv = newCanvas(); ov.firstChild.insertBefore(cv, ov.firstChild.lastChild);
      const big = new Meridian(cv), out = ov.querySelector('.jr');
      const idx = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3).sort();
      const targets = idx.map(i => ({ u: big.nodeAt[i], hit: null }));
      const DUR = 1800, t0 = performance.now(); let hits = 0, done = false, last = t0;
      const press = () => {
        const u = (performance.now() - t0) / DUR, tg = targets.filter(t => t.hit === null).sort((a, b) => Math.abs(a.u - u) - Math.abs(b.u - u))[0];
        if (!tg) return;
        if (Math.abs(tg.u - u) < 0.045) { tg.hit = true; hits++; sfx('crit'); out.innerHTML = `<span class="gold">通! ${hits}/3</span>`; }
        else if (tg.u < u + 0.12) { tg.hit = false; sfx('buzz'); out.innerHTML = '<span class="red">막혔다</span>'; }
      };
      const off = pushKeys(k => { if (k === 'ok') press(); return k !== 'speed'; });
      cv.onclick = e => { e.stopPropagation(); press(); };
      const tick = onFrame(() => {
        const now = performance.now(), u = (now - t0) / DUR;
        for (const t of targets) if (t.hit === null && u > t.u + 0.045) t.hit = false;
        big.draw(now - last, this.jcState({ pulse: Math.min(1, u), targets })); last = now;
        if (u >= 1.05 && !done) {
          done = true; tick(); off();
          if (hits === 3) { out.innerHTML = '<span class="gold">大通! 주천 +5</span>'; flashScreen('#ffe080', 200, 0.4); }
          setTimeout(() => { ov.remove(); res(hits); }, 380);
        }
      });
      sfx('charge');
    });
  }
  // ── 보스 공격 연출: 준비(번뜩임) · 일격(진동·충격파) · 마무리(먼지) ──
  bossGlint(a) {
    const [x, y] = this.top(a), dir = a.side === 'hero' ? -1 : 1;
    for (let i = 0; i < 4; i++) spawn({ x: x + dir * 14 + R(-2, 2), y: y - 4, vx: Math.cos(i * 1.57) * 50, vy: Math.sin(i * 1.57) * 50, life: 220, size: 1, col: '#ffffff', drag: 4 });
    spawn({ x: x + dir * 14, y: y - 4, life: 120, size: 4, col: '#fff8c0' });
    ring(a.mesh.position.x, a.mesh.position.y + 2, 10, ['#ffe080', '#ffffff'], 14, 40);
    sfx('charge');
  }
  bossStrike(a) {
    const [x, y] = this.center(a), dir = a.side === 'hero' ? -1 : 1;
    shake(4, 220); flashScreen('#ffffff', 90, 0.25); hitstop(60);
    burst(x + dir * a.w * 0.45, y, { n: 26, cols: a.final ? ['#ff3048', '#ffd060', '#ffffff'] : ['#ffe080', '#ffffff', '#c0d8ff'], spd: [80, 220], life: [150, 320], size: [1, 3], ang: dir > 0 ? [-0.6, 0.6] : [Math.PI - 0.6, Math.PI + 0.6] });
    playFx('hit', x + dir * a.w * 0.4, y, { parent: this.group, flip: dir < 0 }) || ring(x + dir * a.w * 0.4, y, 6, ['#ffffff'], 20, 140);
  }
  bossDust(a) {
    const x = a.mesh.position.x, y = a.mesh.position.y + 1;
    playFx('dust', x, y, { parent: this.group, layer: a.mesh.renderOrder - 1 }) || burst(x, y, { n: 14, cols: ['#c8b088', '#8a7a60', '#e8dcc0'], spd: [20, 70], up: 10, size: [1, 2], ang: [0, Math.PI] });
  }
  async bossIntro(u, quick) {
    sfx('charge'); shake(2, 300);
    flashScreen('#000', 500, 0.6);
    const c = el('div', 'bintro' + (u.final ? ' final' : u.duel ? ' duel' : ''), `<i class="lb t"></i><i class="lb b"></i><div class="bi"><img src="${u.bigImg || u.img}"><div class="bt"><div class="bti">${u.title}</div><div class="nm">${u.name}</div><div class="qt">「${u.quote}」</div></div></div>`, this.ui);
    await wait(380); sfx('boom'); shake(4, 260);
    const [x, y] = this.center(u);
    burst(x, y, { n: 40, cols: u.final ? ['#ff2040', '#600010', '#ffd060'] : ['#ffe080', '#ffffff', '#80c0ff'], spd: [40, 160], size: [1, 3] });
    await wait(quick ? 800 : 1700);
    c.classList.add('out');
    await wait(260);
    c.remove();
  }
  async cutin(name, a, enemy) {
    sfx('charge');
    const c = el('div', 'cutin' + (enemy ? ' enemy' : ''), `<div class="band"><img src="${a.bigImg || a.img}"><span>${name}</span></div>`, this.ui);
    flashScreen(enemy ? '#400008' : '#000', 600, 0.5);
    await wait(750);
    c.remove();
  }

  async outro(end) {
    this.help('');
    if (end === 'win') { sfx('win'); this.banner('승 리', 'big'); }
    else if (end === 'yield') { sfx('lose'); this.banner('한 수 배웠다', 'big'); }
    else { sfx('lose'); this.banner('패 배…', 'big red'); }
    await wait(1100);
    this.destroy();
  }
  destroy() {
    this.offFrame(); this.offSpeed();
    clock.scale = 1;
    for (const u of this.units) for (const k of ['iceM', 'barM']) if (u[k]) { if (u[k].parent) u[k].parent.remove(u[k]); u[k] = null; } // 되풀이 이펙트를 멈춘다
    this.group.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    scene.remove(this.group);
    for (const u of this.units) for (const k in u.texs) u.texs[k].dispose();
    clearParticles(); portraitView(null);
    this.ui.remove();
  }
}
