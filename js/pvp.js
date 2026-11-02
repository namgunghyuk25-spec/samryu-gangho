// pvp.js — 비무 대전 화면: 메뉴(AI 연습·방 만들기·들어가기) · 덱 짜기 · 대전(동시 공개 연출) · 판 사이 보급. 규칙은 pvp_rules.js, 온라인은 room 기능(pvpnet)
import { THREE, scene, quad, tween, wait, ease, spawn, burst, ring, hitstop, R, pick, popText, flashScreen, shake, el, win, $, ui, listMenu, pushKeys, sfx, onFrame, cam, clock, TOUCH, touchy, portraitView } from './engine.js';
import { IMGS, recolorHue, drawBattleBG } from './pixel.js';
import { HERO_FRAMES } from './data.js';
import { Battle, vfxTex } from './battle.js';
import { cardClass } from './cardbattle.js';
import { CARDS, TYPE, TYPE_NAME } from './cards.js';
import { playFx } from './fx.js';
import { music } from './music.js';
import * as P from './pvp_rules.js';

const JC_COL = { mangae: ['#ff70a0', '#ffd0e0', '#601030'], cheonha: ['#60a0ff', '#e0f0ff', '#102060'], cheonmasin: ['#ff3040', '#ffb0a0', '#300008'] }; // 절초 띠·빛·바탕(본 게임과 같게)
const ROBE = { samryu: '#a89878', hwasan: '#d04870', sorim: '#e0a030', mudang: '#5878b0', namgung: '#e8e4d8', magyo: '#a01828' };
const CW = 58, HX0 = 2, HX1 = 260, HY = 156, FOOT = 84; // 발 높이: 결과가 날 땐 손패가 비니 띄우지 않는다(발끝이 손패 윗줄)
const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };
const por = () => $('#root').classList.contains('por');
const vv = (x, t) => (Array.isArray(x) ? x[t - 1] : x);

// ── 카드 앞면(PvP 수치) ──
function pvMain(id, t) {
  const p = P.PV[id];
  if (p.d) return `피해 ${vv(p.d, t)}${vv(p.h, t) > 1 ? '×' + vv(p.h, t) : ''}${t === 3 && !p.fin && P.RULE.t3add ? '+' + P.RULE.t3add : ''}`; // 3단 보상까지
  const sp = { hangma: '호신만큼', nahyeol: '호신만큼', daeryeok: '막은 만큼', returned: '6+되돌림', hyeolhae: '3+출혈×2', cheonmasin: '잃은 만큼', chilmae: '꽃잎 X×2', hyeolu: '출혈 ×2' }[p.x];
  if (sp) return sp;
  if (p.b) return '호신 ' + vv(p.b, t);
  if (p.parry) return '되치기';
  if (p.half) return '흘림 ' + vv(p.half, t);
  if (p.heal) return '회복 ' + p.heal;
  if (p.blunt) return '절초 약화';
  if (p.cut) return '주천 끊기';
  if (p.set) return `주천 ${p.set}단`;
  if (p.tier) return `주천 ${p.tier > 0 ? '+' : ''}${p.tier}`;
  if (p.en) return '내력 +' + p.en;
  if (p.dbl) return '다음 두 배';
  return '';
}
export function pvFace(id, t = 1) {
  const c = CARDS[id], p = P.PV[id], tiered = [p.d, p.b, p.half].find(Array.isArray);
  const mv = p.fin ? ['rs', '▼1'] : p.set ? ['kp', '◆' + p.set] : p.tier > 0 ? ['up', '▲'] : p.tier < 0 ? ['dn', '▼'] : ['kp', '●'];
  const cells = [1, 2, 3].map(k => `<i class="${k === t ? 'on' : ''}${p.only && p.only !== k ? ' x' : ''}${p.only === k ? ' only' : ''}">${tiered ? tiered[k - 1] : p.only === k ? '★' : k}</i>`).join('');
  const kw = [p.only === 3 && '<em class="jck">절초</em>', `<em style="color:${TYPE[p.t]}">${TYPE_NAME[p.t]}</em>`, p.tal && `<em class="tl">탈력${p.tal}</em>`, p.ctr && `<em class="ex">반격${p.ctr}</em>`].filter(Boolean).join('');
  return `<div class="f" style="--tc:${TYPE[p.t]}"><div class="art" style="background-image:url(assets/c_${id}.png)"></div><span class="cc">${p.c}</span><span class="tb ${mv[0]}">${mv[1]}</span>`
    + `<div class="cs">${cells}</div><div class="cn">${c.short || c.name}</div><div class="cm">${pvMain(id, t)}</div><div class="kw">${kw}</div></div><div class="b"></div>`;
}
const cardHtml = (id, t = 1, extra = '') => `<div class="${cardClass(id)} static${extra}">${pvFace(id, t)}</div>`;
const kind = id => (P.PV[id].only === 3 ? ['절초', '#ff7080'] : [TYPE_NAME[P.PV[id].t], TYPE[P.PV[id].t]]); // 종류 이름·색 — 3단 전용은 '절초'
const tipOf = id => `<span style="color:${kind(id)[1]}">[${kind(id)[0]}]</span> ${CARDS[id].name} — ${P.pvDesc(id)}<br><span class="dim">${P.MATCHUP[P.PV[id].t]}</span>`;

// ── 공용 화면 ──
function screen(cls = '') { return el('div', 'screen ' + cls, null, ui); }
function choose(title, text, items, { cancel = false, cols = 1, wide = false } = {}) {
  return new Promise(res => {
    const s = screen('dimbg'), w = win(wide ? 8 : 24, wide ? 10 : 30, wide ? 304 : 272, 0, s, 'msg');
    w.style.height = 'auto';
    w.innerHTML = `<div class="mh">${title}</div><div class="mt">${text}</div><div class="mb"></div><div class="mdesc dim"></div>`;
    if (wide) Object.assign(w.children[2].style, { maxHeight: '150px', overflowY: 'auto' }); // 긴 목록은 안에서 굴린다
    const m = listMenu(w.children[2], items, { cols, preview: items.some(it => it.desc), onFocus: it => (w.children[3].innerHTML = it.desc || ''), onPick: (it, i) => { m.close(); s.remove(); res(i); }, onCancel: cancel ? () => { m.close(); s.remove(); res(-1); } : null });
  });
}
const message = (text, btn = '계속') => choose('', text, [{ html: btn }]);
const RULES = `둘이 동시에 손패에서 <span class="gold">최대 4장</span>을 순서대로 고르고, 1번 칸부터 동시에 뒤집는다.<br>
<span style="color:${TYPE['공']}">공격</span>은 허초를 끊고 방어에 막힌다 · 공격끼리 부딪히면 <span class="gold">큰 쪽이 차이만큼</span> 들어간다<br>
<span style="color:${TYPE['수']}">방어</span>는 공격·암기를 막고 허초에 깨진다 · 호신은 그 차례 내내, 반격은 한 번 터지면 끝 · 되치기는 절반을 되돌리고 절반은 맞는다<br>
<span style="color:${TYPE['허']}">허초</span>는 쌓은 호신까지 깨뜨리고 절초를 약화 · <span style="color:${TYPE['암']}">암기</span>는 공격·허초를 끊는다 · <span style="color:${TYPE['운']}">운기</span>는 제 몸만 · <span class="gold">절초</span>는 일반 공격을 부수고 들어간다<br>
3단에서 내는 공격은 피해 +3(절초 빼고) · 3단으로 두 차례를 넘기면 <span class="red">주화입마</span>(체력 −12%, 1단으로) — 절초로 터뜨리거나 경검·무애보로 식혀라<br>
내력 ${P.ENERGY} · 체력 ${P.HP}(삼류 72) · ${P.TURN_CAP}차례가 지나면 체력이 많은 쪽 승. <span class="gold">3판 2선승</span>. 덱 교체는 문파 1장(삼류 5장)·같은 카드는 2장까지, 대신 판이 끝날 때마다 보급이 는다(1장→2장).`;

// ── 덱 짜기 ──
async function pickSchool() {
  const items = P.SCHOOLS.map(s => ({ html: `<span style="color:${ROBE[s]}">●</span> ${P.SCHOOL_KO[s]}`, desc: DECK_DESC[s], s }));
  const i = await choose('문파 선택', '어느 문파의 초식으로 겨룰까?', [...items, { html: '<span class="dim">◀ 뒤로</span>' }], { cancel: true, cols: 2 });
  return i < 0 || i >= items.length ? null : items[i].s;
}
const DECK_DESC = { samryu: '잡학 — 모든 문파의 보통 초식에서 5장까지 바꿔 낀다 · 체력 72', hwasan: '꽃잎 연환 — 꽃잎으로 칸을 채워 몰아친다 · 3단 「매화만개」', sorim: '금강 — 호신과 반격으로 받아친다 · 1단 「금강부동」', mudang: '태극 — 되치기로 되돌린다 · 2단 「만류귀종」', namgung: '제왕검 — 3단까지 끌어올려 「천하제일검」', magyo: '혈공 — 피를 태워 몰아친다 · 출혈과 흡혈' };
export async function buildDeck(s) {
  const base = P.startDeck(s), pool = P.poolOf(s), key = 'samryu_pvp_deck_' + s;
  let deck = store.get(key); if (!deck || !P.validDeck(s, deck)) deck = [...base];
  const swaps = () => { const left = [...base]; let n = 0; for (const id of deck) { const i = left.indexOf(id); if (i >= 0) left.splice(i, 1); else n++; } return n; };
  for (;;) {
    const items = deck.map((id, i) => ({ html: `<div class="pvmini">${cardHtml(id)}</div>`, desc: tipOf(id), i }));
    items.push({ html: '<div class="pvbtn ok">이 덱으로</div>', desc: '이 덱으로 겨룬다', done: true }, { html: '<div class="pvbtn rs">기본으로</div>', desc: '문파 기본 덱으로 되돌린다', reset: true }); // 카드 줄 아래 따로 한 줄
    const r = await new Promise(res => {
      const sc = screen('dimbg'), w = win(4, 4, 312, 232, sc, 'msg pvdeckw');
      w.innerHTML = `<div class="mh">${P.SCHOOL_KO[s]} 덱 <span class="dim">교체 ${swaps()}/${P.swapsOf(s)} · 바꿀 카드를 고른다</span></div><div class="pvdeck"></div><div class="mdesc"></div>`;
      const m = listMenu(w.children[1], items, { cols: 7, preview: true, onFocus: it => (w.children[2].innerHTML = it.desc || ''), onPick: it => { m.close(); sc.remove(); res(it); }, onCancel: () => { m.close(); sc.remove(); res(null); } });
      const g = w.children[1].children; Object.assign(g[deck.length].style, { gridColumn: '1 / span 3', marginTop: '2px' }); Object.assign(g[deck.length + 1].style, { gridColumn: '5 / span 3', marginTop: '2px' }); // 단추는 카드 아래 따로 한 줄
    });
    if (!r) return null;
    if (r.done) { store.set(key, deck); return deck; }
    if (r.reset) { deck = [...base]; continue; }
    const cands = pool.filter(id => id !== deck[r.i]).map(id => ({ id, html: `${P.nameOf(id)} <span class="dim">${TYPE_NAME[P.PV[id].t]} · ${P.PV[id].c}</span>`, desc: tipOf(id) }));
    const j = await choose(`「${P.nameOf(deck[r.i])}」 대신`, '덱에 넣을 초식', [...cands, { html: '<span class="dim">◀ 그대로</span>' }], { cancel: true, cols: 2, wide: true });
    if (j < 0 || j >= cands.length) continue;
    const next = [...deck]; next[r.i] = cands[j].id;
    if (P.validDeck(s, next)) deck = next; else await message(next.filter(x => x === cands[j].id).length > Math.max(P.RULE.copies, base.filter(x => x === cands[j].id).length) ? `같은 카드는 덱에 ${P.RULE.copies}장까지다.` : `교체는 ${P.swapsOf(s)}장까지다. 다른 카드를 기본으로 되돌린 뒤 바꿔라.`);
  }
}

// ── 대전 화면 ──
const frameCache = {};
function fighter(school, name) {
  const col = ROBE[school], key = school;
  if (!frameCache[key] && IMGS.hero_idle_0) {
    const ref = recolorHue(IMGS.hero_idle_0, 200, 262, col).ref, out = {};
    for (const [s, n] of Object.entries(HERO_FRAMES)) out[s] = Array.from({ length: n }, (_, i) => recolorHue(IMGS[`hero_${s}_${i}`], 200, 262, col, ref));
    frameCache[key] = { frames: out, art: IMGS.hero && recolorHue(IMGS.hero, 200, 262, col) };
  }
  const f = frameCache[key] || {}, hp = P.hpOf(school);
  return { name, sect: school, spr: { robe: col, trim: '#e0c040', belt: '#e0c040', band: '#e0c040', pants: '#404858', hat: 'topknot', weapon: 'sword' }, art: f.art, artFrames: f.frames, maxHp: hp, hp, qi: 0, maxQi: 1, fx: {}, skills: [] };
}
class PvpBattle extends Battle {
  constructor(me, op, mySide, geo) { super(me, [], 0, 'pvp', geo); this.opData = op; this.mySide = mySide; this.sel = []; this.fi = 0; }
  toggleSpeed() { clock.scale = 1; } // 속도 없음(배속도 고정)
  async start() {
    vfxTex();
    this.group = new THREE.Group(); scene.add(this.group);
    cam.x = 0; cam.y = 0;
    const bg = quad(IMGS['bg' + (this.geo + 1)] || drawBattleBG(this.geo + 1), { anchor: 'center', parent: this.group });
    bg.position.set(160, 120, 0); bg.renderOrder = -10;
    this.buildUI();
    this.hero = this.makeUnit(this.heroData, 'hero', [250, FOOT]);
    this.foe = this.makeUnit(this.opData, 'enemy', [70, FOOT]);
    this.offFrame = onFrame((dt, real) => this.update(dt, real));
    for (const u of this.units) { const x0 = u.mesh.position.x; u.mesh.position.x += u.side === 'hero' ? 90 : -90; tween(u.mesh.position, { x: x0 }, 320, ease.out); }
    await wait(380);
  }
  buildUI() {
    super.buildUI();
    for (const e of [this.cmdWin, this.stWin, this.bar, this.spdBtn, this.mer.canvas || this.ui.querySelector('canvas.mer')]) e && e.classList.add('hidden');
    this.mer = { draw() {} };
    portraitView([28, 50, 1.3]); // 세로 화면: 무대를 당겨 본다(손패는 아래칸)
    Object.assign(this.helpEl.style, { left: '4px', top: '24px', width: '312px', height: 'auto', textAlign: 'left' });
    this.hud = el('div', 'pvhud', null, this.ui);
    this.rev = el('div', 'pvrev'); // 공개 줄: 손패 자리(아래 띠)에 — 세로 화면이면 손패와 함께 아래칸으로
    this.handEl = el('div', 'hand2', null, this.ui);
    this.pan = el('div', 'ppan', null, this.ui);
    this.endBtn = el('div', 'endb hidden', '결정', this.ui);
    this.clrBtn = el('div', 'pillb hidden', '비우기', this.ui);
    this.pan.onclick = () => this.tip(this.hero);
  }
  ui2(u) { return u === this.mySide ? this.hero : this.foe; }
  sync(m) { // 상태를 화면 체력에 맞춘다
    this.m = m;
    for (const i of [0, 1]) { const u = this.ui2(i); u.hp = m.p[i].hp; u.maxHp = m.p[i].maxHp; }
    this.refresh();
  }
  refresh() {
    const m = this.m; if (!m) return;
    const me = m.p[this.mySide], op = m.p[1 - this.mySide];
    for (const u of this.units) {
      u.lag = Math.max(u.hp, (u.lag ?? u.hp) - u.maxHp * 0.025);
      u.tag.style.display = '';
      u.tag.firstChild.firstChild.style.width = Math.max(0, u.lag / u.maxHp * 100) + '%';
      u.tag.firstChild.lastChild.style.width = Math.max(0, u.hp / u.maxHp * 100) + '%';
      const s = this.stList(u === this.hero ? me : op).map(([t, c]) => `<b class="sc" style="--c:${c}">${t}</b>`).join('');
      if (u.tag.lastChild.innerHTML !== s) u.tag.lastChild.innerHTML = s;
    }
    const wins = (n) => '●'.repeat(n) + '○'.repeat(P.WIN_ROUNDS - n), side = (p, u, nm, w) => `<div class="pvs"><div class="pvl"><b style="color:${ROBE[p.school]}">${nm}</b><span class="gold">${wins(w)}</span><span class="pvn">${Math.max(0, Math.ceil(u.hp))}/${u.maxHp} ${p.tier}단${p.tier === 3 && p.heat ? '<span class="red blink">!</span>' : ''}</span></div><div class="pvbar"><i style="width:${Math.max(0, u.hp / u.maxHp * 100)}%"></i></div></div>`;
    const html = side(op, this.foe, this.opData.name, m.wins[1 - this.mySide]) + `<div class="pvmid">${m.round}판<br>${m.turn}차례</div>` + side(me, this.hero, P.SCHOOL_KO[me.school] + '(나)', m.wins[this.mySide]);
    if (this.hud.innerHTML !== html) this.hud.innerHTML = html;
    const used = this.plan ? this.plan.en : me.energy;
    const pan = `<div class="pt">주천 ${me.tier}단${me.tier === 3 && me.heat ? ' <span class="red blink">과열</span>' : ''}</div><div class="pe"><span class="lbl">내력</span>${Array.from({ length: Math.max(me.energy, 3) }, (_, i) => `<i class="${i < used ? 'on' : ''}"></i>`).join('')}<span class="num">${used}</span></div><div class="pr">호신${me.block}</div><div class="ps">${me.bleed ? `<b style="color:#ff5060">출혈${me.bleed}</b>` : ''}</div><div class="pw">${P.SCHOOL_KO[me.school]}</div><div class="ph">체력 ${Math.max(0, Math.ceil(this.hero.hp))}/${me.maxHp}</div><div class="pp"><span class="pk">${me.pile.length}</span><span class="pk dc">${me.disc.length}</span></div>`;
    if (this.pan.innerHTML !== pan) this.pan.innerHTML = pan;
  }
  stList(p) { // 체력바 아래 칩: [글자, 색, 눌렀을 때 설명]
    return [p.block && ['호신' + p.block, '#80c0ff', '이번 차례 받는 피해를 먼저 막는다 · 허초가 들면 깨진다'],
      p.ctr && ['반격' + p.ctr, '#60ffff', `공격을 맞으면 때린 쪽에 ${p.ctr} 피해, 한 번 터지면 끝난다 · 허초가 들면 깨진다`],
      p.parry && ['되치기', '#f0f0ff', '다음 공격의 절반을 되돌리고 나머지만 받는다 · 허초가 들면 깨진다'],
      p.bleed && ['출혈' + p.bleed, '#ff5060', `차례 끝에 ${p.bleed} 피해를 입고 1 줄어든다`],
      p.weak && ['약화' + p.weak, '#a0a0ff', `다음 공격 ${p.weak}번의 피해 −25%`],
      p.vuln && ['내상' + p.vuln, '#ffa040', `받는 공격 ${p.vuln}번의 피해 +30%`]].filter(Boolean);
  }
  tipLines(u) { return this.m ? this.stList(this.m.p[u === this.hero ? this.mySide : 1 - this.mySide]) : []; }
  // ── 고르기: 손패를 눌러 순서대로 최대 4장 ──
  pick(m) {
    this.sync(m); this.sel = []; this.plan = P.planOf(m.p[this.mySide], []);
    this.renderHand(); this.focus(0);
    this.endBtn.classList.remove('hidden'); this.clrBtn.classList.remove('hidden');
    return new Promise(res => {
      const done = () => { this.keysOff(); this.endBtn.classList.add('hidden'); this.clrBtn.classList.add('hidden'); this.help(''); res(this.sel.map(i => this.hand[i])); };
      this.endBtn.onclick = e => { e.stopPropagation(); sfx('ok'); done(); };
      this.clrBtn.onclick = e => { e.stopPropagation(); this.sel = []; this.update2(); sfx('cancel'); };
      this.keysOff = pushKeys(k => {
        const n = this.hand.length;
        if (k === 'left' || k === 'up') { this.focus(this.fi - 1); sfx('move'); }
        else if (k === 'right' || k === 'down') { this.focus(this.fi + 1); sfx('move'); }
        else if (k === 'ok') { if (this.fi === n) { sfx('ok'); done(); } else this.toggle(this.fi); }
        else if (k === 'cancel') { this.sel.pop(); this.update2(); sfx('cancel'); }
        else return k !== 'speed';
        return true;
      });
    });
  }
  renderHand() {
    const me = this.m.p[this.mySide];
    this.hand = [...me.hand];
    this.handEl.innerHTML = '';
    this.cards = this.hand.map((id, i) => {
      const e = el('div', cardClass(id), pvFace(id, me.tier), this.handEl);
      e.onclick = ev => { ev.stopPropagation(); this.focus(i); this.toggle(i); };
      e.onmouseenter = () => { if (!touchy()) this.focus(i); };
      return e;
    });
    this.update2();
  }
  toggle(i) {
    const at = this.sel.indexOf(i), me = this.m.p[this.mySide];
    if (at >= 0) { this.sel.splice(at, 1); sfx('cancel'); }
    else {
      const next = [...this.sel, i].map(j => this.hand[j]);
      if (this.sel.length >= P.SLOTS) { sfx('buzz'); this.help('한 차례에 4장까지'); return; }
      if (!P.planOf(me, next)) { sfx('buzz'); this.help(P.PV[this.hand[i]].only ? `${P.PV[this.hand[i]].only}단에서만 낼 수 있다(앞 칸으로 주천을 맞춰라)` : '내력이 모자란다'); return; }
      this.sel.push(i); sfx('ok');
    }
    this.update2();
  }
  update2() { // 고른 순서 배지·내력·자리
    const me = this.m.p[this.mySide], seq = this.sel.map(j => this.hand[j]);
    this.plan = P.planOf(me, seq) || this.plan;
    const n = this.cards.length, step = n > 1 ? Math.min(CW + 2, (HX1 - HX0 - CW) / (n - 1)) : 0, x0 = HX0 + (HX1 - HX0 - (step * (n - 1) + CW)) / 2;
    this.cards.forEach((e, i) => {
      const k = this.sel.indexOf(i), up = i === this.fi;
      e.style.transform = `translate(${Math.round(x0 + i * step)}px, ${HY - (k >= 0 ? 18 : 0) - (up ? 6 : 0)}px)`;
      e.style.zIndex = up ? 60 : 10 + i;
      e.classList.toggle('sel', up); e.classList.toggle('pvon', k >= 0);
      let b = e.querySelector('.pvno'); if (k >= 0) { if (!b) b = el('span', 'pvno', '', e); b.textContent = k + 1; } else if (b) b.remove();
      const ok = k >= 0 || (this.sel.length < P.SLOTS && P.planOf(me, [...seq, this.hand[i]]));
      e.classList.toggle('dis', !ok);
    });
    this.endBtn.textContent = this.sel.length ? `결정 ${this.sel.length}장` : '결정(빈 수)';
    this.endBtn.classList.toggle('sel', this.fi === n);
    this.refresh();
  }
  focus(i) {
    const n = this.cards ? this.cards.length : 0; this.fi = ((i % (n + 1)) + n + 1) % (n + 1);
    if (this.fi < n) this.help(tipOf(this.hand[this.fi])); else this.help('고른 순서대로 낸다 · 덜 골라도 된다');
    if (this.cards) this.update2();
  }
  // ── 공개 연출 ──
  async play(ev, seqs) {
    const me = this.mySide, U = i => this.ui2(i);
    this.handEl.innerHTML = ''; this.cards = []; this.help('');
    this.handEl.appendChild(this.rev);
    const row = i => `<div class="pvrow ${i === me ? 'me' : 'op'}">${[0, 1, 2, 3].map(k => `<div class="pvmini q" data-k="${k}">${seqs[i][k] ? cardHtml(seqs[i][k], 1, ' back') : ''}</div>`).join('')}</div>`;
    this.rev.innerHTML = row(1 - me) + '<div class="pvvs">VS</div>' + row(me);
    const pops = (i, t, cls = 'st') => { const [x, y] = this.top(U(i)); popText(x, y + 6, t, cls); };
    let k0 = -1;
    for (const e of ev) {
      if (e.k !== k0 && k0 >= 0) { await wait(500); this.spot?.remove(); } // 칸이 끝나면 한숨 돌리고 다음 칸
      if (e.k != null) k0 = e.k; else k0 = -1;
      switch (e.kind) {
        case 'reveal': {
          this.rev.querySelectorAll('.pvmini').forEach(d => d.classList.toggle('now', +d.dataset.k === e.k));
          for (const i of [0, 1]) { const d = this.rev.children[i === me ? 2 : 0].children[e.k]; const c = d.querySelector('.cd2'); if (c) { c.classList.remove('back'); c.innerHTML = pvFace(e.ids[i], e.tiers[i]); } }
          sfx('move');
          for (const i of [0, 1]) if (e.ids[i] && P.PV[e.ids[i]].only === 3 && e.tiers[i] === 3) await this.jcCut(U(i), e.ids[i]);
          const names = [0, 1].map(i => (e.ids[i] ? `<span style="color:${kind(e.ids[i])[1]}">${P.PV[e.ids[i]].only === 3 ? '절초 ' : ''}${CARDS[e.ids[i]].name}</span>` : '<span class="dim">—</span>'));
          this.help(`${e.k + 1}번 칸 · ${names[1 - me]} <span class="dim">vs</span> ${names[me]}`);
          this.showSpot(e); sfx('card');
          await wait(1100); break;
        }
        case 'fizzle': pops(e.side, '흩어짐'); sfx('buzz'); await wait(250); break;
        case 'cut': pops(e.side, '끊김!', 'warn'); sfx('buzz'); burst(...this.center(U(e.side)), { n: 12, cols: ['#c0c8e0', '#ffffff'], spd: [40, 120] }); await wait(300); break;
        case 'break': pops(e.side, '방어 깨짐!', 'warn'); sfx('crit'); burst(...this.center(U(e.side)), { n: 20, cols: ['#80c0ff', '#ffffff'], spd: [60, 160] }); shake(2, 150); await wait(300); break;
        case 'cost': U(e.side).hp -= e.n; pops(e.side, '-' + e.n, 'hurt'); await wait(150); break;
        case 'block': { const u = U(e.side), [x, y] = this.center(u); playFx('shield', x, y, { parent: this.group, flip: u.side === 'hero' }); popText(x, y + 18, '호신 +' + e.n, 'qi'); sfx('guard'); await wait(220); break; }
        case 'counterOn': pops(e.side, '반격 ' + e.n, 'qi'); await wait(160); break;
        case 'parryOn': pops(e.side, '되치기', 'qi'); await wait(160); break;
        case 'halfOn': pops(e.side, '흘림 ' + e.n, 'qi'); await wait(160); break;
        case 'heal': this.heal(U(e.side), e.n); await wait(220); break;
        case 'petal': pops(e.side, '꽃잎 +' + e.n, 'heal'); await wait(160); break;
        case 'dbl': pops(e.side, '다음 두 배!', 'crit'); await wait(160); break;
        case 'st': pops(e.side, { bleed: '출혈', weak: '약화', vuln: '내상' }[e.st] + ' ' + e.n, 'poison'); await wait(160); break;
        case 'blunt': pops(e.side, '절초 약화', 'warn'); await wait(160); break;
        case 'tier': pops(e.side, e.cut ? `주천 끊김 ${e.to}단` : `주천 ${e.to}단`, e.to > e.from ? 'heal' : 'warn'); if (e.to > e.from) burst(...this.center(U(e.side)), { n: 10, cols: ['#ffe060', '#ffffff'], spd: [20, 60], up: 30 }); await wait(200); break;
        case 'clash': await this.clash(e, seqs); break;
        case 'crush': pops(e.side, '절초에 부서졌다!', 'warn'); sfx('crit'); burst(...this.center(U(e.side)), { n: 18, cols: ['#ffffff', '#ffd060', '#ff6040'], spd: [60, 180] }); shake(3, 180); await wait(280); break;
        case 'cool': pops(e.side, '과열이 식었다', 'qi'); await wait(160); break;
        case 'heat': pops(e.side, '과열 — 다음에도 3단이면 주화입마', 'warn'); await wait(380); break;
        case 'deviate': { const u = U(e.side); flashScreen('#ff2040', 300, 0.6); pops(e.side, '주화입마!', 'warn'); await wait(160); this.hurt(u, e.n, true); await wait(500); break; }
        case 'hit': await this.hitAnim(e, seqs); break;
        case 'reflect': { const a = U(1 - e.side); pops(e.side, '되치기!', 'crit'); await wait(120); this.hurt(a, e.n, true); await wait(300); break; }
        case 'counter': { pops(1 - e.side, '반격!', 'st'); await wait(100); this.hurt(U(e.side), e.n); await wait(260); break; }
        case 'bleed': this.hurt(U(e.side), e.n, false, true); await wait(260); break;
        case 'round': break;
      }
      this.refresh();
    }
    await wait(500);
    this.spot?.remove(); this.rev.remove();
  }
  showSpot(e) { // 이 칸의 두 카드: 상대 것은 상대 머리 위(왼쪽), 내 것은 내 머리 위(오른쪽)
    this.spot?.remove();
    const me = this.mySide, box = i => {
      const id = e.ids[i], side = i === me ? 'me' : 'op';
      if (!id) return `<div class="pvsp ${side} none">빈 칸</div>`;
      const p = P.PV[id];
      return `<div class="pvsp ${side}" style="--tc:${TYPE[p.t]}"><div class="art" style="background-image:url(assets/c_${id}.png)"></div><div class="nm"><span class="ty" style="color:${kind(id)[1]}">${kind(id)[0]}</span>${CARDS[id].name}</div><div class="mn">${pvMain(id, e.tiers[i]) || P.pvDesc(id).split(' · ')[0]}</div></div>`;
    };
    this.spot = el('div', 'pvspot', box(1 - me) + `<div class="pvk">${e.k + 1}<small>번 칸</small></div>` + box(me), this.ui);
  }
  async clash(e, seqs) { // 둘이 가운데서 부딪힌다 → 큰 쪽이 차이만큼(다음 hit 사건)
    const a = this.hero, b = this.foe, ax = a.mesh.position.x, bx = b.mesh.position.x, mid = (ax + bx) / 2;
    this.trail(a, 3); this.trail(b, 3); sfx('slash');
    if (a.seq?.attack) this.setPose(a, 'attack', 0); if (b.seq?.attack) this.setPose(b, 'attack', 0);
    await Promise.all([tween(a.mesh.position, { x: mid + 16 }, 130, ease.in), tween(b.mesh.position, { x: mid - 16 }, 130, ease.in)]);
    const y = a.mesh.position.y + 26;
    playFx('crit', mid, y, { parent: this.group }) || burst(mid, y, { n: 30, cols: ['#ffffff', '#ffe080', '#ff8040'], spd: [60, 200] });
    burst(mid, y, { n: 24, cols: ['#fff8c0', '#ffffff', '#80c0ff'], spd: [80, 220], life: [150, 320], size: [1, 3] });
    flashScreen('#fff', 90, 0.5); shake(4, 220); sfx('crit');
    const n = e.n, me = this.mySide;
    popText(mid, y + 22, `${n[1 - me]} 상쇄 ${n[me]}`, 'st');
    await wait(260);
    if (n[0] === n[1]) await Promise.all([this.dashBack(a), this.dashBack(b)]); else this.clashing = true; // 이긴 쪽 피해(hit)는 가운데서 바로
  }
  async hitAnim(e, seqs) { // e.side가 맞는다
    const t = this.ui2(e.side), a = this.ui2(1 - e.side), id = seqs[1 - e.side][e.k];
    if (id && CARDS[id].jc && !e.amg && !this.clashing) return this.jcMove(a, t, id, e);
    const vfx = (id && CARDS[id].vfx) || 'slash';
    if (!e.amg && !this.clashing && Math.abs(a.mesh.position.x - a.home[0]) < 4) { await this.dashTo(a, t); }
    else if (e.amg) { sfx('dart'); await wait(120); }
    this.hitFx(vfx, t, e.n >= 15, e.n >= 10, 0);
    if (e.ab) { const [x, y] = this.center(t); playFx('shield', x, y, { parent: this.group, flip: t.side === 'hero' }); popText(x - 10, y + 22, '막음 ' + e.ab, 'qi'); }
    this.hurt(t, e.n, e.n >= 15);
    await wait(200);
    if (this.clashing) { this.clashing = false; await Promise.all([this.dashBack(a), this.dashBack(t)]); }
    else if (Math.abs(a.mesh.position.x - a.home[0]) > 4) await this.dashBack(a);
  }
  // ── 절초: 본 게임과 같은 컷신 → 전용 동작(hero_<jc>_0..3) → 이펙트 → 연타. 누가 쓰든(상대면 좌우를 뒤집는다) ──
  async jcCut(u, id) {
    const c = CARDS[id], col = JC_COL[c.jc] || ['#ffd040', '#ffffff', '#402000'];
    sfx('charge'); flashScreen('#000', 420, 0.75);
    const e = el('div', 'jcut', `<i class="lb t"></i><i class="lb b"></i><div class="sl"></div><img class="pt" src="${u.bigImg || u.img}"><div class="tx"><div class="jt">절 초 · ${P.SCHOOL_KO[c.school] || ''}</div><div class="jn">${c.name}</div></div>`, this.ui);
    e.style.setProperty('--j1', col[0]); e.style.setProperty('--j2', col[2]); e.style.setProperty('--j3', col[1]);
    await wait(240); sfx('boom'); shake(3, 220);
    await wait(880); e.classList.add('out'); await wait(200); e.remove();
  }
  jcPose(u, k, f) { // 전용 동작 프레임(없으면 0·1=기공, 2·3=베기)
    const s = u.seq && u.seq[k];
    if (s && s.length) return this.setPose(u, k, Math.min(f, s.length - 1));
    if (f < 2) this.setPose(u, 'cast', Math.min(f, ((u.seq && u.seq.cast) || [0]).length - 1)); else this.setPose(u, 'atk', u.seq && u.seq.atk ? Math.min(f, u.seq.atk.length - 1) : 0);
  }
  async jcMove(a, t, id, e) { // 판정이 낸 피해(e.n)를 연타로 나눠 보여 준다
    const k = CARDS[id].jc, dir = a.side === 'hero' ? 1 : -1, front = { parent: this.group, layer: 4200 }, [hx, hy] = this.center(a);
    const hits = Math.max(1, vv(P.PV[id].h, 3) || 1), parts = Array.from({ length: hits }, (_, i) => Math.floor(e.n / hits) + (i === hits - 1 ? e.n % hits : 0));
    const impact = flash => { const [tx, ty] = this.center(t); flashScreen(flash, 150, 0.8); shake(6, 360); hitstop(130); playFx('finisher', tx, ty, { parent: this.group, scale: 2, layer: 4500 }); playFx('crit', tx, ty, front); };
    const blow = (i, last) => { this.hitFx(CARDS[id].vfx, t, last, true, i); this.hurt(t, parts[i], last); if (last && e.ab) { const [x, y] = this.center(t); playFx('shield', x, y, { parent: this.group, flip: t.side === 'hero' }); popText(x - 10, y + 22, '막음 ' + e.ab, 'qi'); } };
    const goTo = async (dy = 0, ms = 130) => { this.trail(a, 4, 30); sfx('slash'); await tween(a.mesh.position, { x: t.mesh.position.x + dir * (t.w / 2 + a.w / 2 - 10), y: t.mesh.position.y - 1 + dy }, ms, ease.in); a.mesh.renderOrder = t.mesh.renderOrder + 1; };
    if (k === 'mangae') { // 매화만개: 꽃잎이 소용돌이쳐 모이고 → 파고들어 휘돌며 연타 → 찌르기와 함께 만개
      this.jcPose(a, k, 0); sfx('charge');
      for (let i = 0; i < 36; i++) { const g = i / 36 * Math.PI * 4, r = 34; spawn({ x: hx + Math.cos(g) * r, y: hy + Math.sin(g) * r * 0.6, vx: -Math.cos(g) * r * 2.6, vy: -Math.sin(g) * r * 1.6, drag: 1.5, life: 420, size: 2, col: pick(['#ffb0d0', '#ff70a0', '#ffffff']), delay: i * 8 }); }
      playFx('windP', a.mesh.position.x, a.mesh.position.y + 1, front); await wait(380);
      await goTo();
      for (let i = 0; i < hits; i++) {
        const last = i === hits - 1; this.jcPose(a, k, last ? 3 : 1 + (i % 2));
        if (i % 3 === 0) { const [tx, ty] = this.center(t); playFx('petals', tx, ty, front); ring(tx, ty, 10, ['#ffb0d0', '#ffffff'], 16, 90); }
        if (last) impact('#ffd0e0');
        blow(i, last); await wait(last ? 160 : 95);
      }
      const [tx, ty] = this.center(t); burst(tx, ty, { n: 60, cols: ['#ffb0d0', '#ff70a0', '#ffffff', '#ffd0e0'], spd: [40, 170], size: [1, 3], up: 20 });
      await wait(320); await this.dashBack(a); return;
    }
    if (k === 'cheonha') { // 천하제일검: 하늘로 검을 들어 뇌기를 모으고 → 솟구쳐 → 수직으로 내리꽂는다
      this.jcPose(a, k, 0); sfx('charge'); playFx('charge', hx, hy + 6, { ...front, tint: '#a0c8ff' });
      for (let i = 0; i < 30; i++) spawn({ x: hx + R(-22, 22), y: hy - 20 + R(0, 10), vy: R(80, 160), life: 300, size: 1, col: pick(['#e0f0ff', '#60a0ff', '#ffffff']), delay: i * 10 });
      await wait(420);
      this.jcPose(a, k, 1); this.trail(a, 5, 30); sfx('slash');
      await tween(a.mesh.position, { x: t.mesh.position.x + dir * 6, y: t.mesh.position.y + 58 }, 210, ease.out); a.mesh.renderOrder = t.mesh.renderOrder + 1;
      await wait(110); this.jcPose(a, k, 2);
      await tween(a.mesh.position, { y: t.mesh.position.y - 1 }, 80, ease.in);
      const [tx, ty] = this.center(t), gy = t.mesh.position.y;
      for (let y = 240; y > gy; y -= 3) spawn({ x: tx + R(-2, 2), y, life: 260, size: Math.random() < 0.5 ? 3 : 2, col: pick(['#ffffff', '#c0e0ff', '#60a0ff']), shrink: 0.5 });
      impact('#e8f4ff'); playFx('slashB', tx, ty, { ...front, scale: 2, flipY: true }); playFx('dust', tx, gy + 2, { ...front, scale: 1.6 });
      for (let i = 0; i < 3; i++) ring(tx, gy + 1, 8 + i * 8, ['#c0e0ff', '#ffffff', '#4080ff'], 22, 70 + i * 40);
      for (let i = 0; i < hits; i++) { blow(i, i === hits - 1); await wait(110); }
      this.jcPose(a, k, 3); await wait(420); await this.dashBack(a); return;
    }
    if (k === 'cheonmasin') { // 천마신공: 핏빛 기운을 빨아들여 → 몸을 젖히고 → 두 손바닥으로 혈해를 쏟아낸다
      this.jcPose(a, k, 0); sfx('charge'); flashScreen('#300008', 520, 0.55);
      for (let i = 0; i < 48; i++) { const g = R(0, Math.PI * 2), r = R(40, 70); spawn({ x: hx + Math.cos(g) * r, y: hy + Math.sin(g) * r * 0.7, vx: -Math.cos(g) * r * 2.2, vy: -Math.sin(g) * r * 1.5, life: 430, size: R(1, 3), col: pick(['#ff3040', '#a00010', '#400008', '#ff8070']), delay: i * 6 }); }
      await wait(380); this.jcPose(a, k, 1); playFx('phase2', hx, hy, { parent: this.group, tint: '#ff6070', scale: 0.8, layer: a.mesh.renderOrder - 1 }); await wait(300);
      this.jcPose(a, k, 2); sfx('boom');
      const [tx, ty] = this.center(t);
      for (let i = 0; i < 40; i++) spawn({ x: hx - 8 * dir, y: hy + R(-8, 8), vx: (tx - hx) * 4 + R(-30, 30), vy: (ty - hy) * 4 + R(-30, 30), life: 260, size: R(2, 4), col: pick(['#d01020', '#600010', '#ff3040', '#000000']), delay: i * 5 });
      await wait(220);
      playFx('blood', tx, ty, { ...front, scale: 2 }); playFx('phase2', tx, ty, { ...front, tint: '#ff4050' });
      impact('#ff2030');
      for (let i = 0; i < hits; i++) { blow(i, i === hits - 1); await wait(110); }
      this.jcPose(a, k, 3); await wait(360); this.setPose(a, 'idle'); return;
    }
    for (let i = 0; i < hits; i++) blow(i, i === hits - 1);
  }
  hurt(t, n, crit, dot) {
    if (n <= 0) return;
    t.hp -= n;
    const [x, y] = this.center(t), tier = dot ? -1 : this.hitTier(t, n, { crit });
    popText(x + R(-4, 4), y + 14, tier >= 2 ? n + '!' : '' + n, this.popCls(t, tier, dot));
    if (!dot) this.impact(t, tier);
  }
  async roundOver(winner, m) {
    const me = this.mySide, lose = winner < 0 ? null : this.ui2(1 - winner);
    if (lose) { this.setPose(lose, 'dead'); sfx('die'); burst(...this.center(lose), { n: 24, cols: ['#ff4040', '#800000', '#ffffff'], spd: [20, 100], up: 60 }); }
    await wait(500);
    this.banner(winner < 0 ? `${m.round}판 — 무승부` : winner === me ? `${m.round}판 승리!` : `${m.round}판 패배`, 'big' + (winner === me ? '' : ' red'));
    sfx(winner === me ? 'win' : 'lose');
    await wait(1400);
  }
  revive(m) { for (const u of this.units) { u.alive = true; this.setPose(u, 'idle'); u.mesh.material.uniforms.opacity.value = 1; u.mesh.position.x = u.home[0]; u.lag = undefined; } this.sync(m); }
}

// ── 보급: 판 사이에 셋 중 하나 ──
async function supplyScreen(offers, round, n) { // n장을 하나씩 고른다(삼류는 판마다 는다)
  const got = [], left = [...offers];
  while (got.length < n && left.length) got.push(await new Promise(res => {
    const s = screen('dimbg'), w = win(8, 18, 304, 212, s, 'reward'), cols = Math.max(3, left.length);
    w.innerHTML = `<div class="mh">${round}판 끝 — 보급${n > 1 ? ` <span class="gold">${got.length + 1}/${n}장</span>` : ''}</div><div class="rl dim">덱에 넣을 카드를 고르시오(다음 판부터 섞인다)${n > 1 ? ' · 판이 갈수록 보급이 는다' : ''}</div><div class="rdesc"></div><div class="cards"></div>`;
    const grid = w.lastChild;
    grid.classList.add('pvsup'); grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const m = listMenu(grid, left.map(id => ({ id, html: cardHtml(id) })), { cols, preview: true, tapOnly: true, onFocus: it => { w.querySelector('.rdesc').innerHTML = tipOf(it.id); }, onPick: it => { m.close(); s.remove(); left.splice(left.indexOf(it.id), 1); res(it.id); } });
    if (TOUCH) { const take = el('div', 'opt take', '받기', grid); take.onclick = e => { e.stopPropagation(); m.pick(); }; } // 한 번 눌러 보고 받기로 받는다
  }));
  return got;
}

// ── 대전 진행 ── link: AI면 null, 온라인이면 { send, wait } (상대 수를 받아 온다)
export async function playMatch({ seed, decks, schools, mySide, names, link }) {
  const m = P.newMatch(seed, decks, schools), op = 1 - mySide;
  const B = new PvpBattle(fighter(schools[mySide], '나'), fighter(schools[op], names[op]), mySide, seed % 4); // 배경도 두 기기가 같게
  window.PVP = { m, B };
  music.play('boss');
  await B.start(); B.sync(m);
  B.banner(`1판 — ${P.SCHOOL_KO[schools[op]]} 대 ${P.SCHOOL_KO[schools[mySide]]}`); await wait(900);
  try { while (!m.over) {
    if (m.offers) {
      const mine = await supplyScreen(m.offers[mySide], m.round, P.supplyN(schools[mySide], m.round));
      const theirs = link ? await link.trade('supply', m.round, mine) : P.aiSupply(m, op);
      P.takeSupply(m, mySide === 0 ? [mine, theirs] : [theirs, mine]);
      B.revive(m); B.banner(`${m.round}판`); await wait(800);
      continue;
    }
    const mySeq = await B.pick(m);
    B.help(link ? '상대가 고르는 중…' : '상대가 수를 고른다…');
    const opSeq = link ? await link.trade('pick', `${m.round}.${m.turn}`, mySeq) : await new Promise(r => setTimeout(() => r(P.aiPick(m, op)), 450));
    const seqs = mySide === 0 ? [mySeq, opSeq] : [opSeq, mySeq];
    const ev = P.resolveTurn(m, seqs);
    await B.play(ev, seqs);
    B.sync(m);
    const rd = ev.find(e => e.kind === 'round');
    if (rd) await B.roundOver(rd.winner, m);
  } } catch (e) { // 온라인 상대가 떠났다
    if (!link) throw e;
    B.help(''); B.banner(e.message, 'big red'); sfx('lose'); await wait(1800); B.destroy(); return null;
  }
  const won = m.over.winner === mySide;
  B.banner(won ? '비무 승리!' : '비무 패배', 'big' + (won ? '' : ' red')); sfx(won ? 'win' : 'lose');
  music.play(won ? 'victory' : 'defeat');
  await wait(1500);
  B.destroy();
  return won;
}

// ── 메뉴 ── net: 온라인 모듈(없으면 AI 연습만)
export async function pvpMain(net) {
  for (;;) {
    const opts = [{ html: 'AI와 연습', v: 'ai', desc: '혼자 규칙을 익힌다' }, { html: '방 만들기', v: 'host', desc: '방 번호를 만들어 동료를 부른다', disabled: !net }, { html: '방 들어가기', v: 'join', desc: '동료가 알려 준 방 번호로 들어간다', disabled: !net }, { html: '규칙', v: 'rules', desc: '동시 공개·상성·보급' }, { html: '<span class="dim">◀ 돌아가기</span>', v: 'back' }];
    const i = await choose('비무 대전', '덱을 짜서 동시에 수를 낸다. 3판 2선승.', opts, { cancel: true });
    const v = i < 0 ? 'back' : opts[i].v;
    if (v === 'back') return;
    if (v === 'rules') { await choose('비무 규칙', RULES, [{ html: '알았다' }], { wide: true }); continue; }
    const s = await pickSchool(); if (!s) continue;
    const deck = await buildDeck(s); if (!deck) continue;
    if (v === 'ai') {
      const os = pick(P.SCHOOLS.filter(x => x !== s)), od = P.aiDeck(os);
      for (;;) {
        await playMatch({ seed: Math.floor(Math.random() * 1e9), decks: [deck, od], schools: [s, os], mySide: 0, names: ['나', `${P.SCHOOL_KO[os]} 고수`], link: null });
        if (await choose('비무 끝', '한 번 더?', [{ html: '다시 겨룬다' }, { html: '그만한다' }]) !== 0) break;
      }
    } else await net.online(v, s, deck, { playMatch, choose, message });
  }
}

// ── 화면 모양(처음 쓸 때 한 번) ──
const css = el('style', '', `
.pvhud { position: absolute; left: 2px; right: 2px; top: 2px; height: 20px; display: flex; gap: 4px; z-index: 7; pointer-events: none; font: 10px/10px G9; text-shadow: 1px 1px #000; }
.pvhud .pvs { flex: 1; background: rgba(8,10,40,.7); border: 1px solid #6070c8; padding: 1px 3px; position: relative; }
.pvhud .pvs:last-child { text-align: right; }
.pvhud .pvbar { height: 3px; background: #300; border: 1px solid #000; margin-top: 1px; } .pvhud .pvbar i { display: block; height: 100%; background: linear-gradient(#ff8080, #d02030); }
.pvhud .pvs:last-child .pvbar i { margin-left: auto; }
.pvhud .pvl { display: flex; gap: 3px; white-space: nowrap; } .pvhud .pvn { margin-left: auto; color: #fff; } .pvhud .pvs:last-child .pvl { flex-direction: row-reverse; } .pvhud .pvs:last-child .pvn { margin: 0 auto 0 0; }
.pvhud .pvmid { width: 36px; text-align: center; color: var(--gold); font: 9px/9px G9; padding-top: 1px; }
.pvrev { position: absolute; left: 2px; width: 258px; top: 172px; height: 44px; display: flex; justify-content: center; align-items: center; gap: 3px; pointer-events: none; }
.pvrow { display: flex; gap: 1px; } .pvvs { font: 10px G11B; color: var(--gold); text-shadow: 1px 1px #000; }
.pvrev .pvmini { width: 29px; height: 42px; } .pvrev .pvmini .cd2 { transform: scale(.5); }
.pvmini { width: 33px; height: 47px; position: relative; }
.pvmini .cd2 { transform: scale(.55); transform-origin: 0 0; position: absolute; left: 0; top: 0; pointer-events: none; }
.pvrev .pvmini.q { background: rgba(8,10,40,.5); border: 1px dashed #4a5490; box-sizing: border-box; }
.pvrev .pvmini.now { outline: 2px solid var(--gold); outline-offset: 1px; }
.hand2 .cd2.pvon .f { box-shadow: 0 0 0 1px #fff, 0 0 5px 1px var(--gold); }
.cd2 .pvno { position: absolute; left: 50%; top: -9px; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background: var(--gold); color: #201000; font: 10px/14px G11B; text-align: center; box-shadow: 1px 1px 0 #000; z-index: 2; }
.pvdeck { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px 2px; margin: 4px 0; }
.pvdeck .opt { padding: 0; min-height: 0; display: flex; justify-content: center; } .pvdeck .opt::before { display: none; }
.pvdeck .opt.sel .pvmini { outline: 2px solid var(--gold); }
.pvdeck .pvbtn { width: 100%; height: 18px; box-sizing: border-box; border: 1px solid var(--gold); display: flex; align-items: center; justify-content: center; font: 10px G9; color: var(--gold); background: rgba(40,30,0,.4); }
.pvdeck .opt.sel .pvbtn { box-shadow: 0 0 0 1px #fff, 0 0 4px 1px var(--gold); }
.pvdeckw .mdesc { font: 10px/11px G9; min-height: 33px; }
.pvspot { position: absolute; left: 4px; right: 4px; top: 40px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 9; pointer-events: none; }
.pvsp { width: 96px; box-sizing: border-box; border: 2px solid var(--tc, #6070c8); border-radius: 3px; background: rgba(10,12,40,.92); box-shadow: 2px 2px 0 #000; text-shadow: 1px 1px #000; animation: pvIn .22s steps(4) both; }
.pvsp .art { height: 26px; background: #0a0c24 center / cover no-repeat; image-rendering: pixelated; border-bottom: 1px solid var(--tc); }
.pvsp .nm { font: 12px/14px G11B; color: #fff; padding: 1px 3px 0; white-space: nowrap; overflow: hidden; } .pvsp .ty { font: 9px G9; color: var(--tc); margin-right: 3px; }
.pvsp .mn { font: 10px/12px G9; color: var(--gold); padding: 0 3px 2px; white-space: nowrap; }
.pvsp.none { padding: 10px 0; text-align: center; font: 10px G9; color: var(--dim); border-style: dashed; }
.pvk { font: 16px/16px G11B; color: var(--gold); text-align: center; text-shadow: 1px 1px #000, -1px 0 #000; padding-top: 10px; } .pvk small { display: block; font: 9px G9; }
@keyframes pvIn { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pvcode input { display: block; width: 100%; box-sizing: border-box; margin: 2px 0 6px; font: 16px/20px G11; letter-spacing: 6px; text-align: center; color: #fff; background: #0c1030; border: 1px solid var(--gold); outline: none; }
.pvcb { display: flex; gap: 6px; justify-content: center; } .pvbtn2 { padding: 2px 10px; border: 1px solid #c0c8f0; background: #202858; cursor: pointer; }
.cards.pvsup > .opt:last-child:not(.take) { grid-column: auto; padding: 4px 3px; }
.cards.pvsup > .opt.take { grid-column: 1 / -1; min-height: 0; padding: 1px; text-align: center; color: var(--gold); border-color: var(--gold); }
`);
document.body.appendChild(css); // 아티팩트는 게임 스타일이 본문에 있다 — 그 뒤에 붙여야 같은 우선순위에서 이긴다(카드 축소 등)
