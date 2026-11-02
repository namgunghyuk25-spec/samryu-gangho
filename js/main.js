// main.js — 런 상태, 중원지도, 보상/상점/객잔/기연/행낭 화면, 저장, 타이틀
import { THREE, scene, quad, dispose, tween, wait, ease, spawn, burst, R, pick, el, win, $, ui, listMenu, pushKeys, sfx, onFrame, tex, cam, toGame, flashScreen, clearParticles, wipe, TOUCH, touchy, muted, setMuted, H, SH, tallStage } from './engine.js';
import { drawWorldMap, drawBadge, drawIcon, iconCols, drawHuman, MAP_W, MAP_H, canvas, IMGS, loadArt, recolorHue, labelWorldMap, imagePortrait, hardAlpha, outline } from './pixel.js';
import * as D from './data.js';
import { Battle } from './battle.js';
import { CardBattle, cardFace, cardClass } from './cardbattle.js';
import { teleStart, teleFight, telePick, teleSave } from './tele.js';
import { hasRank, RANKED, rankStart, runRecord, tally, scoreParts, scoreOf, api } from './rank.js';
import { CARDS, DECKS, OUTER, RELICS, rollCards, rollRelics, rarity, checkCombos, comboMade, comboHint, SIMS, SIM_SYN, SECT_SIM, BOOK_SIM, rollSim } from './cards.js';
import { music } from './music.js';
import { charSelect } from './charselect.js';

const SAVE = 'samryu_run_v1', BEST = 'samryu_best_v1', DISC = 'samryu_disc_v1';
const DIFF_BEST = 'samryu_diff_best';
const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }, del: k => { try { localStorage.removeItem(k); } catch { } } };

// ───────── 주인공 ─────────
const ROBES = [['#a89878', '#5a4a38'], ['#5070b0', '#e8e0c8'], ['#e8e0d0', '#3050a0'], ['#2a3040', '#e0c040'], ['#f4f4ff', '#e0c040'], ['#f4f4ff', '#e0c040']];
const artCache = {};
const robeFrames = realm => { // 경지별 도포색을 프레임마다 같은 기준 명암으로
  if (!IMGS.hero_idle_0) return null;
  const key = 'frames' + realm;
  if (artCache[key]) return artCache[key];
  const col = ROBES[realm][0] === '#f4f4ff' ? '#e8ecf8' : ROBES[realm][0], ref = recolorHue(IMGS.hero_idle_0, 200, 262, col).ref, out = {};
  for (const [s, n] of Object.entries(D.HERO_FRAMES)) out[s] = Array.from({ length: n }, (_, i) => recolorHue(IMGS[`hero_${s}_${i}`], 200, 262, col, ref));
  return (artCache[key] = out);
};
function pcFrames(pc) { // 전용 캐릭터: 프레임을 가로로 이은 한 장을 잘라 쓴다(절초 동작이 없으면 기공·베기 자세로 대신한다)
  const key = 'pc' + pc, sheet = IMGS['pc_' + pc];
  if (artCache[key] || !sheet) return artCache[key] || null;
  const W = sheet.width / Object.values(D.PC_FRAMES).reduce((a, b) => a + b), out = {}; let at = 0;
  for (const [s, n] of Object.entries(D.PC_FRAMES)) out[s] = Array.from({ length: n }, () => { const c = canvas(W, sheet.height); c.getContext('2d').drawImage(sheet, -W * at++, 0); return c; });
  return (artCache[key] = out);
}
const pcOf = () => D.ORIGINS[run.origin]?.pc;
const heroFrames = () => (pcOf() && pcFrames(pcOf())) || robeFrames(run.realm);
function pcMap(pc) { // 지도 위 말: 서 있는 그림을 작게
  const key = 'pcmap' + pc, f = pcFrames(pc)?.idle[0];
  if (artCache[key] || !f) return artCache[key] || null;
  const h = 26, w = Math.round(f.width * h / f.height), c = canvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(f, 0, 0, w, h);
  return (artCache[key] = c);
}
const heroArt = (id = 'hero') => (pcOf() && pcFrames(pcOf()) ? (id === 'hero_map' ? pcMap(pcOf()) : pcFrames(pcOf()).idle[0]) : IMGS[id] && (artCache[id + run.realm] ||= recolorHue(IMGS[id], 200, 262, ROBES[run.realm][0] === '#f4f4ff' ? '#e8ecf8' : ROBES[run.realm][0])));
const heroSpr = () => { const [robe, trim] = ROBES[run.realm]; return { robe, trim, belt: trim, band: trim, pants: '#404858', hat: 'topknot', weapon: 'sword', cape: run.realm >= 3 ? '#283050' : null }; };
const { BASE, GROW, REALM_UP, SET_FX } = D; // 성장·시너지 수치는 data.js
const FX_NAME = { strongDmg: '강타 피해', pierce: '방어 무시', basicHits: '기본공격 추가타', lifesteal: '흡혈', qiOnHit: '타격당 내력', critBleed: '치명 시 출혈', dmgReduce: '피해 감소', eva: '회피', regen: '턴당 회복', shieldStart: '시작 호신강기', thorns: '반사', startGauge: '시작 게이지', spdPct: '속도%', sealOnHit: '타격당 점혈', critFirst: '첫타 치명', revive: '부활', qiPerTurn: '턴당 내력', lowHpAtk: '빈사 공력', counter: '반격', skillDmg: '무공 피해', critDmg: '치명 피해', maxHpPct: '최대체력%', qiRegenMul: '내력회복 배수', crit: '치명', poisonImmune: '중독 면역', poisonDmg: '독 피해', atkPct: '공력%', drunkEva: '취권 회피', turnShield: '턴당 호신강기', counterHaste: '반격 게이지', extraHits: '연격 +', poisonOnHit: '타격 중독', stunBonus: '기절 확률' };

let run = null;
const REG = () => { const R = D.ROUTES[run.route || 'normal']; return run.defected ? R.map((r, i) => (i === 4 ? D.DEFECT_STAGE : r)) : R; }; // 지금 루트의 단계들(변절하면 천산이 무림맹의 토벌)
const geo = () => REG()[run.region].geo;           // 지금 단계의 지도 지역
const need = lv => 20 + 12 * (lv - 1);
const add = (o, k, v) => (o[k] = (o[k] || 0) + v);

const schoolCount = () => D.schoolCountOf(run);
const combosOn = () => D.combosOf(run);
const heroStats = () => D.heroStatsOf(run);
const DF = () => D.diffOf(run);
function heroForBattle() {
  const s = heroStats();
  const skills = run.slots.filter(Boolean).map(id => ({ ...D.skillOf(id, run.books[id]) }));
  for (const id of combosOn()) skills.push({ ...D.skillOf(id, 0), combo: true });
  return { name: pcOf() ? D.ORIGINS[run.origin].sel.short : '무명', realm: D.REALMS[run.realm], level: run.level, spr: heroSpr(), art: heroArt(), artFrames: heroFrames(), sect: run.sect, ...s, hp: Math.min(run.hp, s.maxHp), qi: s.maxQi, skills, pills: run.pills };
}

// ───────── 지도 생성 ─────────
function genMap(route = 'normal', df = D.DIFFS[0]) {
  const nodes = [];
  let id = 0, prevBoss = null;
  D.ROUTES[route].forEach((reg, r) => {
    const [p0, p1] = reg.path, dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy), px = -dy / len, py = dx / len;
    const rows = [];
    for (let L = 0; L <= 6; L++) {
      const n = L === 0 || L === 3 || L === 6 ? 1 : L === 1 ? 2 : Math.random() < 0.6 ? 3 : 2, row = [];
      for (let k = 0; k < n; k++) {
        const t = L / 6, off = (k - (n - 1) / 2) * 25;
        row.push({ id: id++, region: r, layer: L, x: Math.round(p0[0] + dx * t + px * off + R(-3, 3)), y: Math.round(p0[1] + dy * t + py * off + R(-3, 3)), type: 'battle', next: [] });
      }
      rows.push(row);
    }
    rows[0][0].type = 'start'; rows[3][0].type = 'mboss'; rows[6][0].type = 'boss'; // 소챕터마다 보스: 가운데 두목, 끝 지역 보스
    for (const L of [2, 4, 5]) for (const nd of rows[L]) {
      const w = [['battle', 45], ['event', 20], ['shop', 11], ['inn', 9], ['elite', (L >= 4 ? 15 : r >= 1 ? 6 : 0) * df.elite]];
      let x = Math.random() * w.reduce((a, b) => a + b[1], 0);
      for (const [t, v] of w) { x -= v; if (x <= 0) { nd.type = t; break; } }
    }
    if (!rows[5].some(n => n.type === 'inn')) pick(rows[5]).type = 'inn';
    if (![2, 4].some(L => rows[L].some(n => n.type === 'shop'))) pick(rows[4]).type = 'shop';
    const dn = pick([...rows[2], ...rows[4], ...rows[5]].filter(n => n.type !== 'shop' && n.type !== 'inn'));
    if (dn) { dn.type = route === 'magyo' ? 'rank' : 'duel'; dn.master = pick(reg.duel); }
    for (let L = 0; L < 6; L++) {
      const A = rows[L], B = rows[L + 1], n = A.length, m = B.length, e = new Set();
      A.forEach((a, i) => e.add(i + ',' + Math.round(i * (m - 1) / Math.max(1, n - 1))));
      B.forEach((b, j) => e.add(Math.round(j * (n - 1) / Math.max(1, m - 1)) + ',' + j));
      for (const s of e) { const [i, j] = s.split(',').map(Number); A[i].next.push(B[j].id); }
    }
    if (prevBoss) prevBoss.next.push(rows[0][0].id);
    prevBoss = rows[6][0];
    nodes.push(...rows.flat());
  });
  return { nodes };
}
const node = id => run.map.nodes[id];

function newRun(origin = 'musa', diff = 0) {
  const O = D.ORIGINS[origin], df = D.DIFFS[diff];
  run = { origin, diff, route: O.route, rank: 0, level: 1, exp: 0, realm: 0, gold: O.gold || 30, bonus: {}, books: { samjae: 0, ...(O.books || {}) }, slots: [...(O.slots || ['samjae']), null, null, null].slice(0, 4), heart: null, bag: [], pills: { geumchang: df.pills, sohwan: 1 }, region: 0, visited: [], seenEvents: [], seenStory: [], arrived: [], sect: null, family: null, titles: [...(O.titles || [])], fxBonus: {}, kills: 0, wins: 0, map: genMap(O.route, df), school: O.school || null, deck: O.school ? [...DECKS[O.school].start] : [], relics: [], sims: [], sim: null };
  if (O.family) joinFamily(O.family);
  if (O.sim) { run.sims = [O.sim]; run.sim = O.sim; } // 심법은 드물다: 무명은 빈손으로 시작(문파 출신은 사문 심법, 남궁 방계는 가문 입문으로 창궁심결)
  if (O.sect) { run.sect = O.sect; for (const k in D.SECTS[O.sect].stats || {}) add(run.bonus, k, D.SECTS[O.sect].stats[k]); }
  run.hp = heroStats().maxHp;
  run.cur = 0; run.visited.push(0);
  teleStart(run); teleSave(run, heroStats().maxHp); rankStart(run);
}

// ───────── 아이콘 ─────────
const iconCache = {};
function iconURL(kind, id) {
  const key = kind + ':' + id;
  if (iconCache[key]) return iconCache[key];
  let c;
  if (kind === 'book') { const b = D.BOOKS[id] || D.COMBOS[id]; c = drawIcon('book', iconCols(D.SCHOOLS[b.school].color, b.type === 'heart' ? '#ffe060' : '#f8f0e0')); }
  else if (kind === 'item') { const it = D.itemInfo(id); c = drawIcon(it.icon, iconCols(it.col)); }
  else { const p = D.PILLS[id]; c = drawIcon(p.icon, iconCols(p.col)); }
  return (iconCache[key] = c.toDataURL());
}
const icon = (kind, id, cls = 'ic') => `<img class="${cls}" src="${iconURL(kind, id)}">`;
const sc = id => D.SCHOOLS[D.BOOKS[id].school];

// ───────── 보상 / 획득 ─────────
// 카드 전투: 무공서를 얻으면 카드로 받는다. 제 문파 책이면 제 문파 초식, 남의 문파 책이면 그 문파의 초식 한 장
const OUTER_OF = Object.fromEntries(OUTER.map(k => [CARDS[k].school, k])); // 덱 없는 문파(당가·개방·아미·곤륜·공동)의 한 수
async function revealCombos() { // 합격기 깨달음: 문파가 다른 두 초식이 모였다
  for (const cb of checkCombos(run)) {
    sfx('level'); flashScreen('#ffe080', 300, 0.6);
    await message(`<div class="big gold">합격기 깨달음!</div>「${cb.from[0]}」과 「${cb.from[1]}」의 이치가 하나로 이어졌다.<div class="cbshow"><div class="${cardClass(cb.id)} static">${cardFace(cb.id, 1)}</div></div>${CARDS[cb.id].desc.replace('합격기 · ', '')}`, '익혔다');
  }
}
async function relicPick(tag) { // 보물 둘 중 하나 — 두목이면 그 성향 먼저
  const ks = rollRelics(run, 2, tag); if (!ks.length) return;
  const i = await choose('보물 — 하나를 고르시오', tag ? `<span class="gold">${tag}</span> 성향의 보물이 눈에 띈다.` : '쓸 만한 보물이 눈에 띈다.', ks.map(k => ({ html: `<span class="gold">${RELICS[k].name}</span> <span class="dim">${RELICS[k].tag}</span>`, desc: RELICS[k].desc })));
  run.relics.push(ks[i]); sfx('coin'); telePick(run, 'relic', RELICS[ks[i]].name); teleSave(run, heroStats().maxHp);
}
function giveRelic() { const k = rollRelics(run, 1)[0]; if (!k) { run.gold += 30; return '은자 +30'; } run.relics.push(k); return `보물 「${RELICS[k].name}」 — ${RELICS[k].desc}`; }
function giveCard(id) { run.deck.push(id); return `「${CARDS[id].name}」 카드를 덱에 넣었다`; }
// 심법: 하나만 운용한다. 기연 심법서·문파/가문 입문으로만 깨친다. 새로 깨치면 run.simQ에 쌓았다가 simPrompt가 바꿔 낄지 묻는다(비어 있으면 바로 운용)
const SIM_SCH = { samryu: '삼류', hwasan: '화산', sorim: '소림', mudang: '무당', namgung: '남궁', magyo: '마교', dang: '당가', gaebang: '개방' };
const simCol = k => (D.SCHOOLS[SIMS[k].school] || {}).color || '#50e0b0';
const simSyn = k => `같은 문파(${SIM_SCH[SIMS[k].school]}) 카드: 공격 피해 +${Math.round(SIM_SYN.dmg * 100)}% · 호신 +${SIM_SYN.block}`;
const simInfo = k => `<span style="color:${simCol(k)}">[${SIM_SCH[SIMS[k].school]}]</span> ${SIMS[k].desc}<br><span class="dim">${simSyn(k)}</span>`;
const eul = s => ((s.charCodeAt(s.length - 1) - 0xac00) % 28 ? '을' : '를');
function giveSim(id) {
  const S = SIMS[id];
  if (run.sims.includes(id)) { run.gold += 20; return `이미 깨친 「${S.name}」의 구결이다 — 은자 +20`; }
  run.sims.push(id); telePick(run, 'sim', S.name);
  if (!run.sim) run.sim = id; else (run.simQ ||= []).push(id);
  return `심법 「${S.name}」${eul(S.name)} 깨쳤다 — ${S.desc}${run.sim === id ? ' <span class="gold">(운용)</span>' : ''}`;
}
async function simPrompt() { // 쌓인 새 심법마다 바꿔 낄지 묻는다 — 기연·이야기 결과를 보여 준 뒤(runEvent)
  while (run.simQ && run.simQ.length) {
    const k = run.simQ.shift(), C = SIMS[run.sim]; if (run.sim === k) continue;
    const i = await choose(`새 심법 — 「${SIMS[k].name}」`, `${simInfo(k)}<br><span class="dim">지금 운용: ${C ? `「${C.name}」 ${C.desc}` : '없음'}</span>`, [{ html: '장착한다' }, { html: '그대로 둔다 <span class="dim">(행낭 › 심법에서 언제든 교체)</span>' }]);
    if (i === 0) { run.sim = k; sfx('level'); toast(`「${SIMS[k].name}」 운용`); }
  }
}
function schoolCard() { return rollCards(run, 1)[0]; }
function outerCard(exclude = []) { return rollCards(run, 1, 'elite', exclude, true)[0] || schoolCard(); } // 제 문파 밖의 한 장
function giveBook(id) {
  const b = D.BOOKS[id], s = b && b.school;
  if (run.school && b && b.type === 'heart' && BOOK_SIM[id]) return giveSim(BOOK_SIM[id]); // 심법서는 카드 대신 심법
  if (run.school) return giveCard(DECKS[s] && s !== run.school ? pick(DECKS[s].pool) : OUTER_OF[s] && s !== run.school && !run.deck.includes(OUTER_OF[s]) ? OUTER_OF[s] : schoolCard());
  if (id in run.books) {
    if (run.books[id] < 2) { run.books[id]++; return `「${b.name}」 ${D.TIER_NAME[run.books[id]]} 달성!`; }
    add(run.bonus, 'atk', 2); return `「${b.name}」 깨달음 — 공력 +2`;
  }
  run.books[id] = 0;
  if (b.type === 'skill') { const i = run.slots.indexOf(null); if (i >= 0) run.slots[i] = id; }
  else if (!run.heart) run.heart = id;
  return `「${b.name}」 획득!`;
}
function addItem(id) { run.bag.push(id); return `${D.itemInfo(id).name} 획득`; }
function rollBook(minR, maxR, exclude = []) {
  const pool = Object.keys(D.BOOKS).filter(id => { const b = D.BOOKS[id]; return b.rarity >= minR && b.rarity <= maxR && (run.books[id] ?? -1) < 2 && !exclude.includes(id); });
  if (!pool.length) return null;
  // 합격기 짝 / 이미 가진 책 가중치
  const w = pool.map(id => 1 + (id in run.books ? 1 : 0) + (Object.values(D.COMBOS).some(c => c.need.includes(id) && c.need.some(o => o !== id && o in run.books)) ? 2 : 0) + (sc(id) && schoolCount()[D.BOOKS[id].school] ? 1 : 0));
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { x -= w[i]; if (x <= 0) return pool[i]; }
  return pool[0];
}
const randPart = () => pick('ABCDEF'.split(''));
function cardsFor(kind, master) {
  const out = [], books = [];
  const book = () => { const id = rollCards(run, 1, run.relics.includes('geumseo') ? 'elite' : kind, books)[0]; books.push(id); out.push({ kind: 'card', id }); };
  const outer = () => { const id = outerCard(books); books.push(id); out.push({ kind: 'card', id }); };
  if (run.school) { // 카드 전투 보상: 제 문파 초식 + 가끔 다른 문파의 한 수
    if (kind === 'normal') { book(); book(); Math.random() < 0.3 ? outer() : book(); }
    else if (kind === 'duel') { const m = D.ENEMIES[master].master, k = DECKS[m] && m !== run.school ? pick(DECKS[m].pool) : OUTER_OF[m] && !run.deck.includes(OUTER_OF[m]) ? OUTER_OF[m] : outerCard(); books.push(k); out.push({ kind: 'card', id: k }); book(); book(); }
    else { const m = D.ENEMIES[master] && D.ENEMIES[master].master; const k = m && m !== run.school && (DECKS[m] ? pick(DECKS[m].pool) : OUTER_OF[m]); if (k) { books.push(k); out.push({ kind: 'card', id: k }); } book(); book(); if (!k) outer(); } // 장문인을 쓰러뜨리면 그 문파 초식
    if (run.relics.includes('token')) book();
    out.length -= Math.min(out.length - 1, DF().choices + (run.relics.includes('geumseo') ? 1 : 0));
    return out;
  }
  if (kind === 'normal') { book(1, Math.random() < 0.15 ? 2 : 1); out.push({ kind: 'part', id: randPart() }); Math.random() < 0.5 ? book(1, 2) : out.push(Math.random() < 0.5 ? { kind: 'part', id: randPart() } : { kind: 'pill', id: pick(Object.keys(D.PILLS)) }); }
  else if (kind === 'elite') { book(2, 2); book(1, 2); out.push({ kind: 'part', id: randPart() }); }
  else if (kind === 'duel') { // 장문인의 문파 비급: 비전서 + 문파 책 / 문파 책이 없으면 희귀서
    const sch = D.ENEMIES[master].master, sig = Object.keys(D.BOOKS).find(id => D.BOOKS[id].school === sch && D.BOOKS[id].rarity === 3);
    if (sig && (run.books[sig] ?? -1) < 2) { books.push(sig); out.push({ kind: 'book', id: sig }); }
    const own = Object.keys(D.BOOKS).filter(id => D.BOOKS[id].school === sch && D.BOOKS[id].rarity < 3 && (run.books[id] ?? -1) < 2);
    while (out.length < 3 && own.length) { const id = own.splice(Math.floor(Math.random() * own.length), 1)[0]; books.push(id); out.push({ kind: 'book', id }); }
    while (out.length < 3) book(2, 2);
  }
  else { book(2, 2); book(1, 2); book(1, 2); }
  return out;
}
function cardHtml(c) {
  if (c.kind === 'card') return `<div class="${cardClass(c.id)} static">${cardFace(c.id, 1)}${comboMade(c.id, run).length ? '<i class="cbnew">합격기 생성!</i>' : ''}</div>`;
  if (c.kind === 'book') {
    const b = D.BOOKS[c.id], s = D.SCHOOLS[b.school], t = run.books[c.id];
    const tag = t === undefined ? '<em class="new">신규</em>' : t < 2 ? `<em class="up">→${D.TIER_NAME[t + 1]}</em>` : '<em>깨달음</em>';
    return `${icon('book', c.id, 'ic2')}<div class="cn" style="color:${s.color}">${b.name}</div><div class="ct">${s.name} · ${b.type === 'heart' ? '심법' : '초식'} ${tag}</div><div class="cd">${b.desc}${b.cost ? ` <span class="dim">(내력 ${b.cost})</span>` : ''}</div>`;
  }
  if (c.kind === 'part') { const it = D.itemInfo(c.id); return `${icon('item', c.id, 'ic2')}<div class="cn">${it.name}</div><div class="ct">재료</div><div class="cd">${it.desc}<br><span class="dim">둘을 합쳐 완성품으로</span></div>`; }
  const p = D.PILLS[c.id];
  return `${icon('pill', c.id, 'ic2')}<div class="cn">${p.name}</div><div class="ct">단약</div><div class="cd">${p.desc}</div>`;
}
function takeCard(c) { if (c.kind === 'relic') { run.relics.push(c.id); return `보물 「${RELICS[c.id].name}」 획득`; } if (c.kind === 'card') return giveCard(c.id); if (c.kind === 'book') return giveBook(c.id); if (c.kind === 'part') return addItem(c.id); add(run.pills, c.id, 1); return `${D.PILLS[c.id].name} 획득`; }

// ───────── 공용 화면 헬퍼 ─────────
function screen(cls = '') { return el('div', 'screen ' + cls, null, ui); }
function toast(text, ms = 1400) { const t = el('div', 'toast', text, ui); setTimeout(() => t.remove(), ms); }
function message(lines, btn = '계속', y = 70) { // 단순 메시지 창
  return new Promise(res => {
    const s = screen('dimbg');
    const w = win(30, y, 260, 0, s, 'msg');
    Object.assign(w.style, { height: 'auto', maxHeight: '232px', overflowY: 'auto' });
    w.innerHTML = `<div class="mt">${lines}</div><div class="mb"></div>`;
    const m = listMenu(w.lastChild, [{ html: btn }], { onPick: () => { m.close(); s.remove(); res(); }, onCancel: () => { m.close(); s.remove(); res(); } });
    w.style.top = Math.max(4, Math.min(y, 236 - w.offsetHeight)) + 'px'; // 길면 위로 올려 단추를 화면 안에(가로 화면은 240 밖이 잘린다)
  });
}
const faceURL = id => IMGS[id] ? imagePortrait(IMGS[id], false, 40, Object.values(D.ENEMIES).find(e => e.img === id && e.faceAt)?.faceAt).toDataURL() : null;
function choose(title, text, items, { cancel = false, face = null, cols = 1 } = {}) { // items [{html, disabled, desc}] → index
  return new Promise(res => {
    const s = screen('dimbg');
    const w = win(24, 34, 272, 0, s, 'msg');
    w.style.height = 'auto';
    const f = face && faceURL(face);
    w.innerHTML = `<div class="mh">${title}</div><div class="mt">${f ? `<img class="face" src="${f}">` : ''}${text}</div><div class="mb"></div><div class="mdesc dim"></div>`;
    const m = listMenu(w.children[2], items, {
      cols, preview: items.some(it => it.desc),
      onFocus: it => (w.children[3].innerHTML = it.desc || ''),
      onPick: (it, i) => { m.close(); s.remove(); res(i); },
      onCancel: cancel ? () => { m.close(); s.remove(); res(-1); } : null,
    });
  });
}

const LV_HEAL = [0.3, 0.3, 0.15, 0.15, 0.1]; // 레벨업 회복: 초반엔 버팀목, 후반엔 덤
function gainExp(n) {
  run.exp += n;
  const msgs = [];
  while (run.exp >= need(run.level)) {
    run.exp -= need(run.level); run.level++;
    const mh = heroStats().maxHp;
    const heal = (LV_HEAL[run.region] ?? 0.1) * DF().lvHeal[run.region];
    run.hp = Math.min(mh, run.hp + Math.round(mh * heal));
    msgs.push(`<span class="gold">레벨 업! Lv${run.level}</span>${heal ? ` 체력 ${Math.round(heal * 100)}% 회복` : ''}`);
  }
  if (msgs.length) sfx('level');
  return msgs;
}

async function rewardScreen(kind, ids, master) {
  const r = run.region;
  const exp = Math.round(ids.reduce((a, id) => a + (D.ENEMIES[id].mid ? 30 : D.ENEMIES[id].boss ? 50 : D.ENEMIES[id].elite ? 20 : 7), 0) * (1 + 0.6 * r));
  const gold = Math.round(ids.reduce((a, id) => a + (D.ENEMIES[id].mid ? 40 : D.ENEMIES[id].boss ? 60 : D.ENEMIES[id].elite ? 28 : 7), 0) * (1 + 0.1 * r) * R(0.85, 1.15) * DF().gold);
  run.gold += gold;
  const lv = gainExp(exp);
  let extra = '';
  if (kind !== 'normal' && !run.school) { const p = randPart(); addItem(p); extra = ` · ${D.itemInfo(p).name}`; }
  if (Math.random() < 0.25 && kind === 'normal') { const p = pick(['geumchang', 'sohwan', 'haedok']); add(run.pills, p, 1); extra += ` · ${D.PILLS[p].name}`; }
  sfx('coin');
  const cards = cardsFor(kind, master), skipGold = run.relics.includes('yeopjeon') ? 40 : 10;
  await new Promise(res => {
    const s = screen('dimbg');
    const w = win(8, 6, 304, 228, s, 'reward');
    w.innerHTML = `<div class="mh">전리품</div><div class="rl">은자 +${gold} · 경험 +${exp}${extra}</div>${lv.map(x => `<div class="rl">${x}</div>`).join('')}<div class="rl dim">하나를 고르시오</div><div class="rdesc"></div><div class="cards"></div>`;
    const items = cards.map(c => ({ html: cardHtml(c), c })), cols = Math.max(3, cards.length), grid = w.lastChild; // 4장이면 한 줄에
    items.push({ html: `<div class="skip">건너뛰기 (은자 +${skipGold})</div>` });
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; grid.classList.toggle('tch', TOUCH);
    let take; // 모바일: 한 번 누르면 효과 보기, 받기 버튼으로 받는다
    const m = listMenu(grid, items, {
      cols, preview: true, tapOnly: true, // 폰: 탭은 보기만, 받기 단추로 받는다
      onFocus: it => { if (take) take.textContent = it.c ? '받기' : '건너뛰기'; const d = w.querySelector('.rdesc'); if (d) d.innerHTML = !it.c ? `카드를 받지 않고 은자 ${skipGold}을 챙긴다` : it.c.kind === 'card' ? `${CARDS[it.c.id].sect ? `<span class="gold">[${CARDS[it.c.id].sect} 외문]</span> ` : ''}${CARDS[it.c.id].name} — ${CARDS[it.c.id].desc} <span class="dim">· 내력 ${CARDS[it.c.id].cost}</span>${comboMade(it.c.id, run).length ? ` <span class="gold">· 합격기 생성! 「${comboMade(it.c.id, run).map(k => CARDS[k].name).join('」「')}」</span>` : comboHint(it.c.id, run) ? ` <span style="color:#ffb060">· ${comboHint(it.c.id, run)}</span>` : ''}` : ''; },
      onPick: it => { m.close(); s.remove(); telePick(run, 'reward', it.c ? (it.c.kind === 'card' ? CARDS[it.c.id].name : it.c.kind + ':' + it.c.id) : 'skip'); if (it.c) toast(takeCard(it.c)); else run.gold += skipGold; res(); },
    });
    if (TOUCH) { take = el('div', 'opt take', items[m.idx].c ? '받기' : '건너뛰기', grid); take.onclick = e => { e.stopPropagation(); m.pick(); }; } // 받기 = 지금 보고 있는 것을 받는다
  });
  await revealCombos();
  if (run.bag.length > 6) await invScreen(true);
}

// ───────── 전투 ─────────
const FOE_THEME = { heukpung: '공격', jangang: '공격', dangNo: '독공', hyeolJang: '혈공', cheonmaBoss: '혈공', mb_gwiyeong: '주천', mb_heukryong: '공격', mb_odok: '독공', mb_gangsiwang: '혈공', mb_seolma: '빙공', m_bukhae: '빙공',
  m_sorim: '방어', m_mudang: '주천', m_hwasan: '꽃잎', m_emei: '방어', m_gaebang: '공격', m_cheongseong: '공격', m_jongnam: '주천', m_gonryun: '운기', m_gongdong: '혈공' }; // 이긴 두목의 성향 = 보물 성향
async function chooseFoe(mainId) { // 두목 칸: 이 지역 두목과 구파일방 장문인 중 고른다
  if (!run.school) return [mainId];
  const ms = Object.keys(D.ENEMIES).filter(k => /^m_/.test(k) && D.ENEMIES[k].master && D.ENEMIES[k].master !== 'magyo' && D.ENEMIES[k].master !== run.school && !(run.beat || []).includes(k));
  if (!ms.length) return [mainId];
  const opts = [mainId, pick(ms)];
  const i = await choose('누구와 겨룰 것인가', '이긴 상대의 성향대로 보물과 초식이 달라진다.', opts.map(id => ({ html: `<span class="gold">${D.ENEMIES[id].name}</span> <span class="dim">${D.ENEMIES[id].title || ''}</span>`, desc: `보상 성향: <span class="gold">${FOE_THEME[id] || '공격'}</span>${D.ENEMIES[id].master ? ` · ${D.SCHOOLS[D.ENEMIES[id].master].name} 초식` : ''}` })));
  (run.beat ||= []).push(opts[i]); telePick(run, 'foe', D.ENEMIES[opts[i]].name);
  return [opts[i]];
}
function pickEnemies(n) {
  const reg = REG()[n.region], elite = Array.isArray(reg.elite) ? pick(reg.elite) : reg.elite;
  if (n.type === 'boss') return [reg.boss];
  if (n.type === 'mboss') return [reg.mid];
  if (n.type === 'duel' || n.type === 'rank') return [n.master || reg.duel[0]];
  if (n.type === 'elite') return n.region >= 3 && reg.duo ? pick(reg.duo) : n.region >= 2 ? [elite, pick(reg.pool)] : [elite]; // R3부터 정예 칸은 네임드 둘
  const cnt = n.layer <= 1 ? (Math.random() < 0.5 ? 1 : 2) : n.layer <= 3 ? 2 + (Math.random() < 0.3 ? 1 : 0) : 2 + (Math.random() < 0.6 ? 1 : 0);
  return Array.from({ length: Math.min(3, cnt + (n.layer >= 2 ? DF().extraMob : 0)) }, () => pick(reg.pool));
}
async function battle(ids, kind) {
  const res = await combat(ids, kind);
  if (res.result === 'lose') return 'dead';
  if (res.result === 'yield') { const lv = gainExp(Math.round(15 * (1 + 0.6 * run.region))); await message(`<div class="mh">비무 패배</div>"좋은 승부였네. 다음엔 더 강해져서 오게."<br>체력이 바닥났지만 목숨은 건졌다.<br><span class="dim">경험을 조금 얻었다</span>${lv.map(x => '<br>' + x).join('')}`); return 'ok'; }
  run.wins++; run.kills += res.kills.length;
  if (D.ENEMIES[ids[0]].rank) await rankUp(D.ENEMIES[ids[0]].rank);
  await rewardScreen(kind, res.kills, ids[0]);
  if (run.school && (kind === 'elite' || kind === 'boss' || (kind === 'mboss' && DF().midRelic))) await relicPick(kind === 'elite' ? null : FOE_THEME[ids[0]] || '공격');
  return 'ok';
}
async function rankUp(r) { // 마교 루트 직위: 말단 → … → 소교주. 오를 때마다 공력 +2 · 최대체력 +12
  if ((run.rank || 0) >= r) return;
  const n = r - (run.rank || 0);
  run.titles = run.titles.filter(t => !D.RANKS.includes(t)); run.rank = r; run.titles.push(D.RANKS[r]);
  add(run.bonus, 'atk', 2 * n); add(run.bonus, 'maxHp', 12 * n); run.hp += 12 * n;
  sfx('level'); flashScreen('#ff4050', 300, 0.5);
  await message(`<div class="big gold">직위 상승!</div>신교의 「<span class="red">${D.RANKS[r]}</span>」이(가) 되었다.<br>공력 +${2 * n} · 최대체력 +${12 * n}${r === 5 ? '<br>천마가 처음으로 이름을 불렀다.' : ''}`);
}
async function combat(ids, kind) {
  await revealCombos();
  sfx('boom');
  await wipe(true);
  showMap(false);
  const foe = D.ENEMIES[ids[0]]; music.play(foe.final ? 'final' : foe.master || kind === 'duel' ? 'duel' : kind === 'boss' ? 'boss' : kind === 'mboss' || foe.boss ? 'mboss' : kind === 'elite' ? 'elite' : 'battle');
  const hp0 = Math.min(run.hp, heroStats().maxHp);
  const b = run.school ? new CardBattle(heroForBattle(), ids, run, kind, { region: run.region, geo: geo(), mul: REG()[run.region].mul }) : new Battle(heroForBattle(), ids, run.region, kind, geo(), REG()[run.region].mul);
  const started = b.start(); wipe(false);
  const res = await started;
  run.hp = res.hp;
  if (res.result === 'win' && res.hp >= hp0 && run.relics.includes('musang')) { add(run.bonus, 'maxHp', 2); run.hp += 2; toast('무상 부적 — 최대 체력 +2'); }
  teleFight(run, { region: run.region, kind, foes: ids, result: res.result, hp0, hp1: res.hp, maxHp: heroStats().maxHp, turns: b.turnsTaken || 0, played: b.played || 0, blocked: b.blocked || 0, deck: run.deck.length });
  teleSave(run, heroStats().maxHp, res.result === 'lose' ? 'dead' : null);
  music.play(res.result === 'win' ? 'victory' : 'defeat');
  if (res.reviveUsed) run.bag.splice(run.bag.indexOf('DD'), 1);
  return res;
}
// 용봉지회: 후기지수 셋과 연속 비무. 라운드 사이 30% 회복, 우승하면 칭호·희귀서·공력
async function tournament() {
  const field = [...D.YONGBONG].sort(() => Math.random() - 0.5).slice(0, 3);
  for (let i = 0; i < 3; i++) {
    const e = D.ENEMIES[field[i]];
    await message(`<div class="mh">용봉지회 · ${['1회전', '준결승', '결승'][i]}</div>${f3(field[i])}<span class="gold">${e.title}</span> ${e.name}<br>「${e.quote}」`, '비무대에 오른다');
    const res = await combat([field[i]], 'duel');
    if (res.result !== 'win') {
      const lv = gainExp(Math.round(20 * (i + 1) * (1 + 0.6 * run.region)));
      await message(`<div class="mh">용봉지회 ${['1회전 탈락', '4강', '준우승'][i]}</div>관중의 박수가 쏟아졌다. 강호에 이름이 조금 알려졌다.${lv.map(x => '<br>' + x).join('')}`);
      if (i === 2) run.titles.push('용봉지회 준우승');
      return 'ok';
    }
    run.wins++; run.gold += Math.round(25 * (1 + 0.1 * run.region));
    run.hp = Math.min(heroStats().maxHp, run.hp + Math.round(heroStats().maxHp * 0.3));
  }
  run.titles.push('용봉지회 우승'); add(run.bonus, 'atk', 3);
  sfx('level'); flashScreen('#ffe080', 400, 0.8);
  await message(`<div class="big gold">용봉지회 우승!</div>칭호 「용봉지회 우승」 · 공력 +3<br>천하의 후기지수들이 무명의 이름을 기억한다.`, '우승 상품');
  await rewardScreen('elite', [field[2]]);
  return 'ok';
}
const f3 = id => { const u = faceURL(D.ENEMIES[id].img); return u ? `<img class="face" src="${u}">` : ''; };
// 문파·세가 소속
function joinSect(key) {
  const S = D.SECTS[key], out = [];
  if (run.sect) out.push(leaveSect());
  run.sect = key;
  for (const k in S.stats || {}) add(run.bonus, k, S.stats[k]);
  if (key === 'magyo' && (run.route || 'normal') === 'normal' && !run.defected) { run.defected = true; out.push('<span class="red">무림맹이 배신자를 처단하러 천산으로 진격한다!</span>'); }
  out.push(`<span class="gold">「${S.name}」의 제자가 되었다!</span> (${S.desc})`);
  if (run.school && SECT_SIM[key]) out.push(giveSim(SECT_SIM[key])); // 사문의 심법
  if (run.school && run.school !== 'samryu' && DECKS[key] && key !== run.school) { run.school = key; out.push(`<span class="gold">이제부터 ${DECKS[key].name} 초식이 손에 익는다</span> — 보상 카드가 이 문파로 바뀐다`); }
  if (S.book) out.push(giveBook(S.book));
  const own = Object.keys(D.BOOKS).filter(id => D.BOOKS[id].school === key && D.BOOKS[id].rarity < 3 && (run.books[id] ?? -1) < 2);
  if (own.length) out.push(giveBook(pick(own)));
  return out.join('<br>');
}
function leaveSect() {
  if (!run.sect) return '';
  const S = D.SECTS[run.sect];
  for (const k in S.stats || {}) add(run.bonus, k, -S.stats[k]);
  run.sect = null;
  return `「${S.name}」에서 이름이 지워졌다.`;
}
function joinFamily(key) {
  const F = D.FAMILIES[key];
  run.family = key;
  for (const k in F.stats || {}) add(run.bonus, k, F.stats[k]);
  for (const k in F.fx || {}) add(run.fxBonus, k, F.fx[k]);
  for (const k in F.pills || {}) add(run.pills, k, F.pills[k]);
  run.hp = Math.min(heroStats().maxHp, run.hp + (F.stats?.maxHp || 0));
  return `<span class="gold">「${F.name}」의 일원이 되었다!</span> (${F.desc})` + (run.school && SECT_SIM[key] ? '<br>' + giveSim(SECT_SIM[key]) : ''); // 가전 심법
}

// ───────── 객잔 / 전장 / 기연 ─────────
async function inn() {
  const s = heroStats();
  const trainable = Object.keys(run.books).filter(id => run.books[id] < 2), rest = DF().inn + (run.relics.includes('uiseo') ? 0.2 : 0);
  const i = await choose('객잔', '등불 아래 따뜻한 국밥 냄새가 난다. 하룻밤 무엇을 할까?', [
    { html: `휴식 — 체력 ${Math.round(rest * 100)}% 회복`, desc: `체력 ${run.hp} → ${Math.min(s.maxHp, run.hp + Math.round(s.maxHp * rest))}` },
    run.school ? { html: '수련 — 군더더기 초식 하나를 덜어낸다', disabled: run.deck.length <= 6, desc: '덱에서 카드 한 장을 뺀다 — 좋은 카드가 더 자주 손에 온다' } : { html: '수련 — 무공 하나의 성취 +1', disabled: !trainable.length, desc: '입문→소성→대성' },
  ]);
  if (i === 0) { run.hp = Math.min(s.maxHp, run.hp + Math.round(s.maxHp * rest)); sfx('heal'); toast('푹 쉬었다. 체력 회복'); }
  else if (run.school) {
    const ids = [...new Set(run.deck)];
    const j = await choose('수련', '어떤 초식을 덜어낼까?', ids.map(id => ({ html: `<span style="color:${CARDS[id].sect ? '#ffd040' : '#fff'}">${CARDS[id].name}</span> <span class="dim">×${run.deck.filter(x => x === id).length}</span>`, desc: CARDS[id].desc })), { cols: 2 });
    run.deck.splice(run.deck.indexOf(ids[j]), 1); sfx('level'); toast(`「${CARDS[ids[j]].name}」을(를) 덜어냈다`);
  }
  else {
    const j = await choose('수련', '어떤 무공을 갈고닦을까?', trainable.map(id => ({ html: `<span style="color:${sc(id).color}">${D.BOOKS[id].name}</span> ${D.TIER_NAME[run.books[id]]}→${D.TIER_NAME[run.books[id] + 1]}`, desc: D.BOOKS[id].desc })));
    sfx('level'); toast(giveBook(trainable[j]));
  }
}
async function shopCards() { // 전장(카드 전투): 카드·보물·단약을 펼쳐 놓는다
  const stock = [], bks = [];
  for (let i = 0; i < 3; i++) { const id = i === 2 ? outerCard(bks) : rollCards(run, 1, 'elite', bks)[0]; bks.push(id); stock.push({ kind: 'card', id, price: [45, 65, 95][rarity(id)] }); }
  const rk = rollRelics(run, 1)[0]; if (rk) stock.push({ kind: 'relic', id: rk, price: 110 });
  for (const id in D.PILLS) stock.push({ kind: 'pill', id, price: D.PILLS[id].price, left: id === 'geumchang' ? 1 : 2 }); // 금창약은 한 상점에 1알, 나머지는 2알까지
  stock.push({ kind: 'heal', price: 20, left: 1 }, { kind: 'thin', price: 50 });
  const pm = DF().price * (run.relics.includes('jupan') ? 0.8 : 1); for (const it of stock) it.price = Math.round(it.price * pm);
  const tile = it => it.kind === 'card' ? `<div class="${cardClass(it.id)} static">${cardFace(it.id, 1)}</div>`
    : it.kind === 'relic' ? `<div class="rlc"><i>◆</i>${RELICS[it.id].name}<span class="dim">${RELICS[it.id].tag}</span></div>`
    : it.kind === 'pill' ? `<div class="stl">${icon('pill', it.id)}${D.PILLS[it.id].name}<span class="dim">×${it.left}</span></div>`
    : `<div class="stl">${it.kind === 'heal' ? '침술' : it.kind === 'thin' ? '초식<br>덜기' : '떠난다'}</div>`;
  const descOf = it => it.kind === 'card' ? `${CARDS[it.id].name} — ${CARDS[it.id].desc}` : it.kind === 'relic' ? `보물 「${RELICS[it.id].name}」 — ${RELICS[it.id].desc}` : it.kind === 'pill' ? `${D.PILLS[it.id].name} — ${D.PILLS[it.id].desc}` : it.kind === 'heal' ? '침술 — 체력 30% 회복' : it.kind === 'thin' ? '수련 — 덱에서 카드 한 장을 뺀다' : '전장을 나선다';
  await new Promise(res => {
    const s = screen('dimbg'), w = win(8, 6, 304, 228, s, 'shop2');
    const draw = () => {
      w.innerHTML = `<div class="mh">전장 <span class="gold right">은자 ${run.gold}</span></div><div class="sgrid"></div><div class="mdesc"></div>`;
      const items = [...stock, { kind: 'leave' }].map(it => ({ it, html: `${tile(it)}${it.price ? `<span class="pr">${it.price}</span>` : ''}`, disabled: it.price > run.gold || (it.kind === 'thin' && run.deck.length <= 6) }));
      const m = listMenu(w.children[1], items, {
        cols: 4, start: Math.min(draw.idx || 0, items.length - 1), preview: true,
        onFocus: x => (w.lastChild.innerHTML = descOf(x.it)),
        onPick: async (x, i) => {
          const it = x.it;
          if (it.kind === 'leave') { m.close(); s.remove(); return res(); }
          m.close();
          if (it.kind === 'thin') {
            const ids = [...new Set(run.deck)];
            const j = await choose('수련', '어떤 초식을 덜어낼까?', ids.map(id => ({ html: `${CARDS[id].name} <span class="dim">×${run.deck.filter(x => x === id).length}</span>`, desc: CARDS[id].desc })), { cols: 2, cancel: true });
            if (j < 0) return draw();
            run.deck.splice(run.deck.indexOf(ids[j]), 1); toast(`「${CARDS[ids[j]].name}」을(를) 덜어냈다`);
          } else if (it.kind === 'heal') { const mh = heroStats().maxHp; run.hp = Math.min(mh, run.hp + Math.round(mh * 0.3)); toast('기혈이 돌아온다'); }
          else toast(takeCard(it));
          run.gold -= it.price; sfx('coin'); telePick(run, 'shop', it.kind === 'card' ? CARDS[it.id].name : it.kind === 'relic' ? RELICS[it.id].name : it.kind === 'pill' ? D.PILLS[it.id].name : it.kind);
          if (!(--it.left > 0)) stock.splice(stock.indexOf(it), 1);
          draw.idx = Math.min(i, stock.length); draw();
        },
        onCancel: () => { m.close(); s.remove(); res(); },
      });
      const grid = w.children[1], firstSmall = items.findIndex(x => !['card', 'relic'].includes(x.it.kind));
      if (firstSmall > 0) grid.insertBefore(el('div', 'brk'), grid.children[firstSmall]);
    };
    draw();
  });
}
async function shop() {
  if (run.school) return shopCards();
  const stock = [];
  const bks = [];
  if (run.school) { for (let i = 0; i < 3; i++) { const id = i === 2 ? outerCard(bks) : rollCards(run, 1, 'elite', bks)[0]; bks.push(id); stock.push({ kind: 'card', id, price: CARDS[id].sect ? 80 : [45, 65, 95][rarity(id)] }); } }
  else for (let i = 0; i < 3; i++) { const id = rollBook(1, 2, bks); if (id) { bks.push(id); stock.push({ kind: 'book', id, price: D.BOOKS[id].rarity === 2 ? 70 : 45 }); } }
  for (let i = 0; i < 3; i++) stock.push({ kind: 'part', id: randPart(), price: 35 });
  for (const id in D.PILLS) stock.push({ kind: 'pill', id, price: D.PILLS[id].price, left: id === 'geumchang' ? 1 : 2 }); // 금창약은 한 상점에 1알, 나머지는 2알까지
  stock.push({ kind: 'heal', price: 20, left: 1 });
  await new Promise(res => {
    const s = screen('dimbg');
    const w = win(8, 8, 304, 224, s, 'shop');
    const draw = () => {
      w.innerHTML = `<div class="mh">전장(錢莊) <span class="gold right">은자 ${run.gold}</span></div><div class="slist"></div><div class="mdesc"></div>`;
      const items = stock.map(it => {
        const name = it.kind === 'card' ? `<span style="color:${CARDS[it.id].sect ? '#ffd040' : '#fff'}">${CARDS[it.id].name}</span> <span class="dim">${CARDS[it.id].sect ? CARDS[it.id].sect + ' 외문' : '초식 카드'}</span>` : it.kind === 'book' ? `<span style="color:${sc(it.id).color}">${D.BOOKS[it.id].name}</span> <span class="dim">${sc(it.id).name}${it.id in run.books ? ' ↑' : ''}</span>` : it.kind === 'part' ? D.itemInfo(it.id).name + ' <span class="dim">재료</span>' : it.kind === 'pill' ? `${D.PILLS[it.id].name} <span class="dim">보유 ${run.pills[it.id] || 0}</span>` : '침술 치료 <span class="dim">체력 30%</span>';
        const ic = it.kind === 'heal' || it.kind === 'card' ? '<span class="ic"></span>' : icon(it.kind === 'book' ? 'book' : it.kind === 'part' ? 'item' : 'pill', it.id);
        const desc = it.kind === 'card' ? CARDS[it.id].desc : it.kind === 'book' ? D.BOOKS[it.id].desc : it.kind === 'part' ? D.itemInfo(it.id).desc : it.kind === 'pill' ? D.PILLS[it.id].desc : '체력 30% 회복';
        return { html: `${ic}${name}<span class="price">${it.price}</span>`, disabled: run.gold < it.price, it, desc };
      });
      items.push({ html: '<span class="ic"></span>떠난다', desc: '' });
      const m = listMenu(w.children[1], items, {
        start: draw.idx || 0, preview: true,
        onFocus: x => (w.lastChild.innerHTML = x.desc || ''),
        onPick: (x, i) => {
          if (!x.it) { m.close(); s.remove(); return res(); }
          const it = x.it;
          run.gold -= it.price; sfx('coin');
          if (it.kind === 'heal') { const mh = heroStats().maxHp; run.hp = Math.min(mh, run.hp + Math.round(mh * 0.3)); toast('기혈이 돌아온다'); }
          else toast(takeCard(it));
          if (!(--it.left > 0)) stock.splice(stock.indexOf(it), 1);
          draw.idx = Math.min(i, stock.length);
          m.close(); draw();
        },
        onCancel: () => { m.close(); s.remove(); res(); },
      });
    };
    draw();
  });
  if (run.bag.length > 6) await invScreen(true);
}
const STORY = () => D.STORY || [];
const storyOk = (e, api) => (e.route || 'normal') === (run.route || 'normal') && e.regions.includes(geo()) && !run.seenStory.includes(e.id) && (!e.when || e.when(api));
const arrivesHere = e => e.arrival === true || (Array.isArray(e.arrival) && e.arrival.includes(geo()));
async function arrival() { // 지역에 들어서면: 후보 이야기 중 무작위 하나(같은 얼굴 변형은 앞의 것만)
  const api = eventApi(), faces = new Set();
  const cand = STORY().filter(e => arrivesHere(e) && storyOk(e, api) && !faces.has(e.face) && faces.add(e.face));
  const mine = cand.filter(e => e.mine); // 출신 전용 이야기가 있으면 그것부터
  return cand.length ? runEvent(pick(mine.length ? mine : cand), api) : 'ok';
}
async function event(n) {
  const api = eventApi();
  const story = STORY().filter(e => e.arrival !== true && storyOk(e, api));
  if (story.length && Math.random() < 0.65) return runEvent(pick(story), api);
  const ok = D.EVENTS.map((e, i) => i).filter(i => !D.EVENTS[i].regions || D.EVENTS[i].regions.includes(geo()));
  const left = ok.filter(i => !run.seenEvents.includes(i));
  const ei = left.length ? pick(left) : pick(ok);
  run.seenEvents.push(ei);
  return runEvent(D.EVENTS[ei], api);
}
let pending = null; // 기연 결과 뒤에 이어지는 전투/비무/용봉지회
function eventApi() {
  pending = null;
  const mh = () => heroStats().maxHp;
  return {
    get gold() { return run.gold; }, set gold(v) { run.gold = Math.max(0, v); },
    rand: Math.random, region: run.region, geo: geo(), realm: run.realm, level: run.level, origin: run.origin || 'musa', get rank() { return run.rank || 0; },
    hurt: p => (run.hp = Math.max(1, Math.round(run.hp - mh() * p))),
    heal: p => (run.hp = Math.min(mh(), Math.round(run.hp + mh() * p))),
    stat: (k, v) => { add(run.bonus, k, v); if (k === 'maxHp') run.hp = Math.max(1, Math.min(mh(), run.hp + Math.max(0, v))); },
    give: (kind, a, n = 1) => {
      if (kind === 'book') return giveBook(rollBook(a || 1, a || 2) || 'samjae');
      if (kind === 'magyo') return giveBook(pick(['hyeolma', 'cheonma', 'hyeolyeong', 'cheonmaSin']));
      if (kind === 'school') { const c = Object.keys(D.BOOKS).filter(id => D.BOOKS[id].school === a && D.BOOKS[id].rarity < 3 && (run.books[id] ?? -1) < 2); return c.length ? giveBook(pick(c)) : giveBook(rollBook(1, 2) || 'samjae'); }
      if (kind === 'pill') { add(run.pills, a, n); return `${D.PILLS[a].name} ×${n} 획득`; }
      if (kind === 'relic') return giveRelic();
      if (kind === 'sim') { if (!run.school) return ''; const k = rollSim(run); return k ? giveSim(k) : (run.gold += 30, '아는 구결뿐이다 — 팔아서 은자 +30'); } // 무공서 모드는 '' — a.give('sim') || a.give('book')
      if (kind === 'card') return giveCard(a && DECKS[a] ? pick(DECKS[a].pool) : a && OUTER_OF[a] ? OUTER_OF[a] : schoolCard());
      if (run.school) { run.gold += 15; return '쓸 만한 물건을 팔아 은자 +15'; } // 카드 전투엔 재료가 없다
      return addItem(a || randPart());
    },
    removeCard: () => { if (run.deck.length <= 6) return ''; const basic = run.deck.filter(id => CARDS[id].school === 'samryu' || (DECKS[run.school] && DECKS[run.school].start.includes(id))); const id = pick(basic.length ? basic : run.deck); run.deck.splice(run.deck.indexOf(id), 1); return `「${CARDS[id].name}」을(를) 덜어냈다`; },
    has: id => id in run.books, hasSchool: k => run.school === k || run.deck.some(id => CARDS[id].school === k) || Object.keys(run.books).some(id => D.BOOKS[id].school === k),
    exp: n => { const lv = gainExp(n); return `경험 +${n}` + lv.map(x => '<br>' + x).join(''); },
    pill: id => (run.pills[id] || 0) > 0, usePill: id => run.pills[id]--,
    fight: (ids, kind = 'elite') => { const el = REG()[run.region].elite; pending = () => battle(ids || [Array.isArray(el) ? pick(el) : el], kind); return '칼을 뽑았다!'; },
    duel: id => { pending = () => battle([id], 'duel'); return '비무가 시작된다!'; },
    tournament: () => { pending = tournament; return '<span class="gold">용봉지회의 막이 올랐다!</span>'; },
    get sect() { return run.sect; }, get family() { return run.family; }, get titles() { return run.titles; },
    countSchool: k => run.deck.filter(id => CARDS[id].school === k).length + Object.keys(run.books).filter(id => D.BOOKS[id].school === k).length,
    learnSim: (id, line) => (run.school && !run.sims.includes(id) ? line + ' ' + giveSim(id) : ''), // 이야기가 직접 일러 주는 심법(카드 전투만, 이미 있으면 조용히)
    joinSect, leaveSect, joinFamily, title: t => (run.titles.push(t), `칭호 「${t}」`),
    train: () => { if (run.school) return giveCard(schoolCard()); const t = Object.keys(run.books).filter(id => run.books[id] < 2); return t.length ? giveBook(pick(t)) : null; },
  };
}
async function runEvent(ev, api) {
  if (ev.id) run.seenStory.push(ev.id);
  const i = await choose(ev.story ? ev.title : `기연 — ${ev.title}`, typeof ev.text === 'function' ? ev.text(api) : ev.text, ev.choices.map(c => ({ html: c.label, disabled: c.need && !c.need(api) })), { face: ev.face });
  const out = ev.choices[i].run(api);
  telePick(run, 'event', `${ev.title}: ${ev.choices[i].label} → ${out}`); teleSave(run, heroStats().maxHp);
  sfx('ok');
  await message(out);
  await simPrompt();
  if (pending) { const p = pending; pending = null; return p(); }
  if (run.bag.length > 6) await invScreen(true);
  return 'ok';
}

// ───────── 행낭(장착·조합) ─────────
function invScreen(mustFix = false) {
  return new Promise(res => {
    const s = screen('inv');
    const w = win(0, 0, 320, 240, s, 'invwin');
    let tab = mustFix ? 1 : 0, sub = null, sel = null;
    const offTop = pushKeys(k => {
      if (k === 'inv' || k === 'cancel') close();
      if (k === 'left') { tab = (tab + 3) % 4; sub = null; sel = null; sfx('move'); render(); }
      if (k === 'right') { tab = (tab + 1) % 4; sub = null; sel = null; sfx('move'); render(); }
      return true;
    });
    let menus = [];
    const closeMenus = () => { menus.forEach(m => m.close()); menus = []; };
    function close() {
      if (mustFix && run.bag.length > 6) { sfx('buzz'); toast('패낭이 넘친다! 조합하거나 버려라'); return; }
      closeMenus(); offTop(); s.remove(); sfx('cancel'); res();
    }
    function render() {
      closeMenus();
      const tabs = run.school ? ['덱', '심법', '보물', '상태'] : ['무공', '패낭', '조합표', '상태'];
      w.innerHTML = `<div class="tabs">${tabs.map((t, i) => `<span class="tab${i === tab ? ' on' : ''}" data-i="${i}">${t}</span>`).join('')}<span class="x">✕</span></div><div class="body"></div><div class="ihelp"></div>`;
      w.querySelectorAll('.tab').forEach(t => (t.onclick = () => { tab = +t.dataset.i; sub = null; sel = null; sfx('move'); render(); }));
      w.querySelector('.x').onclick = close;
      const body = w.children[1], help = w.children[2];
      (run.school ? [deckTab, simTab, relicTab, statTab] : [booksTab, bagTab, recipeTab, statTab])[tab](body, help);
    }
    function simTab(body, help) { // 심법: 하나만 운용 — 고르면 바꿔 낀다
      body.innerHTML = `<div class="sub">심법 ${run.sims.length}가지 — 하나만 운용한다 · 고르면 바꿔 낀다</div><div class="rlist simlist"></div>`;
      if (!run.sims.length) { body.lastChild.innerHTML = '<div class="dim">아직 없다 — 문파·세가에 들거나 기연에서 심법서를 얻는다</div>'; help.innerHTML = ''; return; }
      const m = listMenu(body.lastChild, run.sims.map(k => ({ k, html: `<span style="color:${simCol(k)}">${SIMS[k].name}</span> <span class="dim">${SIM_SCH[SIMS[k].school]}</span>${run.sim === k ? ' <span class="gold">◆운용 중</span>' : ''}<br><span class="dim">${SIMS[k].desc}</span>` })), {
        start: Math.max(0, run.sims.indexOf(run.sim)), modal: false, preview: true,
        onFocus: it => (help.innerHTML = `<span style="color:${simCol(it.k)}">${SIMS[it.k].name}</span> — ${simSyn(it.k)}${run.sim === it.k ? ' <span class="gold">· 운용 중</span>' : ' <span class="dim">· 고르면 운용</span>'}`),
        onPick: it => { if (run.sim === it.k) return; run.sim = it.k; sfx('level'); toast(`「${SIMS[it.k].name}」 운용`); render(); },
      });
      menus.push(m);
    }
    function relicTab(body, help) {
      body.innerHTML = `<div class="sub">보물 ${run.relics.length}개</div><div class="rlist"></div>`;
      if (!run.relics.length) { body.lastChild.innerHTML = '<div class="dim">아직 없다 — 강적·두목을 쓰러뜨리거나 전장에서 산다</div>'; return; }
      const m = listMenu(body.lastChild, run.relics.map(k => ({ k, html: `<span class="gold">${RELICS[k].name}</span> <span class="dim">${RELICS[k].tag}</span>` })), { cols: 2, modal: false, preview: true, onFocus: it => (help.innerHTML = RELICS[it.k].desc), onPick: () => {} });
      menus.push(m);
    }
    function deckTab(body, help) {
      body.innerHTML = `<div class="sub">${DECKS[run.school].name} · ${run.deck.length}장</div><div class="deckgrid"></div>`;
      const ids = [...run.deck].sort((a, b) => (CARDS[a].sect ? 1 : 0) - (CARDS[b].sect ? 1 : 0) || a.localeCompare(b));
      const m = listMenu(body.lastChild, ids.map(id => ({ id, html: `<div class="${cardClass(id)} static">${cardFace(id, 1)}</div>` })), { cols: 6, modal: false, preview: true, onFocus: it => (help.innerHTML = `${CARDS[it.id].sect ? `<span class="gold">[${CARDS[it.id].sect} 외문]</span> ` : ''}${CARDS[it.id].name} — ${CARDS[it.id].desc}${comboHint(it.id, run) ? ` <span style="color:#ffb060">· ${comboHint(it.id, run)}</span>` : ''}`), onPick: () => {} });
      menus.push(m);
    }
    function booksTab(body, help) {
      body.innerHTML = '<div class="col l"><div class="sub">장착</div><div class="slots"></div></div><div class="col r"><div class="sub">서고</div><div class="lib"></div></div><div class="sets"></div>';
      const cnt = schoolCount();
      body.querySelector('.sets').innerHTML = Object.entries(cnt).filter(([k]) => D.SCHOOLS[k].s2).map(([k, v]) => { const S = D.SCHOOLS[k]; return `<div style="color:${S.color}">${S.name} ${v}/4 <span class="${v >= 2 ? '' : 'dim'}">▸${S.s2}</span>${v >= 4 ? ` ▸${S.s4}` : ''}</div>`; }).join('') || '<div class="dim">같은 문파 2권/4권 장착 시 시너지 발동</div>';
      const slotItems = [0, 1, 2, 3].map(i => ({ i, html: run.slots[i] ? bookLine(run.slots[i]) : `<span class="dim">초식 ${i + 1} — 비어 있음</span>` }));
      slotItems.push({ i: 'heart', html: run.heart ? '심법 ' + bookLine(run.heart) : '<span class="dim">심법 — 비어 있음</span>' });
      for (const c of combosOn()) slotItems.push({ combo: c, html: `<span class="gold">★${D.COMBOS[c].name}</span> <span class="dim">합격기</span>` });
      const libLines = Object.keys(run.books).map(id => ({ id, html: bookLine(id) + ((run.slots.includes(id) || run.heart === id) ? ' <span class="dim">E</span>' : '') }));
      body.querySelector('.lib').innerHTML = libLines.map(l => `<div class="opt">${l.html}</div>`).join('');
      const descOf = id => { const b = D.BOOKS[id] || D.COMBOS[id]; const combo = Object.values(D.COMBOS).find(c => c.need.includes(id)); return `<span style="color:${D.SCHOOLS[b.school].color}">[${D.SCHOOLS[b.school].name}]</span> ${b.desc}${b.cost ? ` · 내력 ${b.cost}` : ''}${combo && D.BOOKS[id] ? ` <span class="dim">· 합격 단서: ${combo.need.map(n => D.BOOKS[n].name).join('+')}</span>` : ''}`; };
      const m = listMenu(body.querySelector('.slots'), slotItems, {
        start: sub || 0, modal: false, preview: true,
        onFocus: it => (help.innerHTML = it.combo ? `${D.COMBOS[it.combo].desc} · 내력 ${D.COMBOS[it.combo].cost}` : (it.i === 'heart' ? run.heart : run.slots[it.i]) ? descOf(it.i === 'heart' ? run.heart : run.slots[it.i]) : '선택해서 무공서를 장착'),
        onPick: (it, idx) => {
          if (it.combo) return;
          sub = idx;
          const isHeart = it.i === 'heart';
          const cands = Object.keys(run.books).filter(id => D.BOOKS[id].type === (isHeart ? 'heart' : 'skill') && !run.slots.includes(id) && run.heart !== id);
          const items = [{ html: '— 해제 —', id: null }, ...cands.map(id => ({ id, html: bookLine(id) })), ...(TOUCH ? [{ html: '<span class="dim">◀ 뒤로</span>', back: true }] : [])];
          const lib = body.querySelector('.lib');
          const m2 = listMenu(lib, items, {
            modal: false,
            onFocus: x => (help.innerHTML = x.id ? descOf(x.id) : '장착 해제'),
            preview: true,
            onPick: x => { if (x.back) { sub = null; render(); return; } if (isHeart) run.heart = x.id; else run.slots[it.i] = x.id; if (!run.slots.some(Boolean) && !x.id) run.slots[it.i] = null; sub = idx; render(); },
            onCancel: () => { sub = null; render(); },
          });
          menus.push(m2);
        },
      });
      menus.push(m);
    }
    function bookLine(id) { const b = D.BOOKS[id]; return `${icon('book', id)}<span style="color:${D.SCHOOLS[b.school].color}">${b.name}</span> <span class="dim">${D.TIER_NAME[run.books[id]]}</span>`; }
    function bagTab(body, help) {
      body.innerHTML = `<div class="sub">패낭 ${run.bag.length}/6 ${run.bag.length > 6 ? '<span class="red">넘침!</span>' : ''} <span class="dim">— 재료 둘을 차례로 고르면 조합</span></div><div class="bag"></div><div class="pills"></div>`;
      body.querySelector('.pills').innerHTML = '단약 ' + (Object.entries(run.pills).filter(([, n]) => n > 0).map(([id, n]) => `${icon('pill', id)}${D.PILLS[id].name}×${n}`).join(' ') || '<span class="dim">없음</span>');
      const items = run.bag.map((id, i) => { const it = D.itemInfo(id); return { i, id, html: `${icon('item', id)}<span class="${it.part ? '' : 'gold'}">${it.name}</span>${sel === i ? ' <span class="red">◀선택</span>' : ''}` }; });
      if (!items.length) { body.querySelector('.bag').innerHTML = '<div class="dim">비어 있다. 전투에서 재료를 얻자.</div>'; help.innerHTML = ''; return; }
      const m = listMenu(body.querySelector('.bag'), items, {
        cols: 2, start: sub || 0, modal: false, preview: true,
        onFocus: x => {
          const it = D.itemInfo(x.id);
          let h = `${it.name}: ${D.statText(it.stats)}${it.part ? '' : ' · ' + it.desc}`;
          if (sel !== null && sel !== x.i && it.part && D.itemInfo(run.bag[sel]).part) { const r = D.itemInfo(D.recipeKey(run.bag[sel], x.id)); h = `조합 → <span class="gold">${r.name}</span>: ${D.statText(r.stats)} · ${r.desc}`; }
          help.innerHTML = h;
        },
        onPick: async x => {
          sub = x.i;
          const it = D.itemInfo(x.id);
          if (sel === null) { sel = x.i; render(); return; }
          if (sel === x.i) {
            m.off();
            const k = await choose(it.name, '어떻게 할까?', [{ html: '선택 취소' }, { html: '버린다' }], { cancel: true });
            if (k === 1) { run.bag.splice(x.i, 1); sfx('cancel'); }
            sel = null; sub = 0; render(); return;
          }
          const a = D.itemInfo(run.bag[sel]);
          if (!a.part || !it.part) { sfx('buzz'); toast('완성품은 다시 조합할 수 없다'); sel = null; render(); return; }
          const key = D.recipeKey(run.bag[sel], x.id);
          const hi = Math.max(sel, x.i), lo = Math.min(sel, x.i);
          run.bag.splice(hi, 1); run.bag.splice(lo, 1, key);
          const disc = store.get(DISC) || []; if (!disc.includes(key)) { disc.push(key); store.set(DISC, disc); }
          sel = null; sub = lo;
          sfx('level'); flashScreen('#ffe080', 200, 0.5);
          toast(`조합 성공! <span class="gold">${D.RECIPES[key].name}</span>`);
          render();
        },
        onCancel: () => { if (sel !== null) { sel = null; render(); } else close(); },
      });
      menus.push(m);
    }
    function recipeTab(body, help) {
      const P = 'ABCDEF', disc = store.get(DISC) || [];
      let h = '<table class="rtab"><tr><td></td>' + [...P].map(p => `<td>${icon('item', p)}</td>`).join('') + '</tr>';
      for (const a of P) {
        h += `<tr><td>${icon('item', a)}</td>`;
        for (const b of P) { const k = D.recipeKey(a, b); h += `<td class="rc${disc.includes(k) ? '' : ' unk'}" data-k="${k}">${disc.includes(k) ? icon('item', k) : '?'}</td>`; }
        h += '</tr>';
      }
      body.innerHTML = h + '</table><div class="sub dim" style="text-align:center">만들어 본 완성품만 밝혀진다</div>';
      body.querySelectorAll('.rc').forEach(td => (td.onclick = td.onmouseenter = () => { const k = td.dataset.k, r = D.itemInfo(k), [a, b] = k.split(''); help.innerHTML = `${D.PARTS[a].name} + ${D.PARTS[b].name} → ` + (disc.includes(k) ? `<span class="gold">${r.name}</span> ${r.desc}` : '???'); }));
      help.innerHTML = '칸에 마우스를 올려 보시오';
    }
    function statTab(body, help) {
      const s = heroStats();
      const fx = Object.entries(s.fx).map(([k, v]) => `${FX_NAME[k] || k} ${v === 1 && ['poisonImmune', 'critFirst', 'basicHits'].includes(k) ? '' : v < 1 && v > 0 ? '+' + Math.round(v * 100) + '%' : '+' + Math.round(v * 10) / 10}`).join(' · ');
      body.innerHTML = `<div class="stats">
        <div><span class="gold">${DF().name}</span> · ${D.REALMS[run.realm]} · Lv${run.level} <span class="dim">경험 ${run.exp}/${need(run.level)}</span></div>
        <div>체력 ${run.hp}/${s.maxHp}　내력 ${s.maxQi}</div>
        <div>공력 ${s.atk.toFixed(1)}　방어 ${s.def.toFixed(1)}　속도 ${s.spd.toFixed(1)}</div>
        <div>치명 ${Math.round(s.crit + (s.fx.crit || 0))}%　회피 ${Math.round(s.eva + (s.fx.eva || 0))}%</div>
        <div>은자 ${run.gold}　처치 ${run.kills}　승리 ${run.wins}</div>
        <div class="aff">${[run.sect && '문파 ' + D.SECTS[run.sect].name, run.family && '세가 ' + D.FAMILIES[run.family].name, ...(run.titles || []).map(t => '「' + t + '」')].filter(Boolean).join(' · ') || '<span class="dim">소속 없음 — 문파·세가에 들어 보자</span>'}</div>
        <div class="fxl">${fx || '<span class="dim">특수 효과 없음</span>'}</div></div>`;
      help.innerHTML = '';
    }
    render();
  });
}

// ───────── 중원지도 장면 ─────────
let mapG = null, mapCanvas = null, edgeCanvas, edgeTex, nodeMesh = {}, token, mapHud, mapActive = false, selIdx = 0, badgeTex = {};
const MZ = 2; // 지도 확대 배율(정수배라 도트가 고르다)
function buildMap() {
  if (mapG) { mapG.traverse(o => o.isMesh && (o.geometry.dispose(), o.material.dispose())); scene.remove(mapG); }
  mapG = new THREE.Group(); scene.add(mapG); mapG.visible = false; mapG.scale.set(MZ, MZ, 1);
  mapCanvas = mapCanvas || (IMGS.worldmap ? labelWorldMap(IMGS.worldmap, D.REGIONS) : drawWorldMap(D.REGIONS));
  const bg = quad(mapCanvas, { anchor: 'center', parent: mapG }); bg.position.set(MAP_W / 2, MAP_H / 2, 0); bg.renderOrder = -5;
  edgeCanvas = canvas(MAP_W, MAP_H); edgeTex = tex(edgeCanvas);
  const em = quad(edgeTex, { anchor: 'center', parent: mapG }); em.position.set(MAP_W / 2, MAP_H / 2, 0); em.renderOrder = -4;
  for (const t in D.NODE_TYPES) badgeTex[t] = badgeTex[t] || tex(drawBadge(D.NODE_TYPES[t].glyph, D.NODE_TYPES[t].col, t === 'boss' ? 18 : 14));
  nodeMesh = {};
  for (const n of run.map.nodes) {
    const foe = n.type === 'boss' ? REG()[n.region].boss : n.type === 'mboss' ? REG()[n.region].mid : null;
    const m = quad(foe ? tex(faceBadge(foe, D.NODE_TYPES[n.type].col, n.type === 'boss' ? 20 : 17)) : badgeTex[n.type], { anchor: 'center', parent: mapG }); m.position.set(n.x, MAP_H - n.y, 0); m.renderOrder = 10; nodeMesh[n.id] = m; }
  refreshToken();
  drawEdges();
}
function faceBadge(id, col, size) { // 원 안에 그 보스의 얼굴
  const e = D.ENEMIES[id], img = e && IMGS[e.img];
  if (!img) return drawBadge(D.NODE_TYPES.boss.glyph, col, size);
  const c = canvas(size, size), x = c.getContext('2d'), r = size / 2;
  x.fillStyle = col; x.beginPath(); x.arc(r, r, r - 0.5, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.arc(r, r, r - 2, 0, Math.PI * 2); x.clip(); x.fillStyle = '#100810'; x.fillRect(0, 0, size, size);
  x.drawImage(imagePortrait(img, e.spr && e.spr.kind === 'beast', size - 4, e.faceAt), 2, 2); x.restore();
  return outline(hardAlpha(c));
}
function refreshToken() {
  if (token) dispose(token);
  token = quad(heroArt('hero_map') || drawHuman({ ...heroSpr(), size: 24, cape: null }, 'idle'), { parent: mapG });
  token.renderOrder = 20; token.scale.x = -1;
  const n = node(run.cur); token.position.set(n.x, MAP_H - n.y - 3, 0);
}
function drawEdges() {
  const c = edgeCanvas.getContext('2d');
  c.clearRect(0, 0, MAP_W, MAP_H);
  const solid = new Set();
  for (let i = 0; i < run.visited.length - 1; i++) solid.add(run.visited[i] + '-' + run.visited[i + 1]);
  for (const n of run.map.nodes) for (const j of n.next) {
    const m = node(j), on = solid.has(n.id + '-' + j), len = Math.hypot(m.x - n.x, m.y - n.y);
    for (let d = 7; d < len - 7; d += on ? 1 : 4) {
      const x = Math.round(n.x + (m.x - n.x) * d / len), y = Math.round(n.y + (m.y - n.y) * d / len);
      c.fillStyle = on ? '#e02020' : '#1e120a'; c.fillRect(x, y, 2, 2); // 지나온 길=붉은 실선, 갈 길=점선
      if (!on) { c.fillStyle = '#f4e2b0'; c.fillRect(x, y, 1, 1); }
    }
  }
  edgeTex.needsUpdate = true;
  for (const n of run.map.nodes) { const v = run.visited.includes(n.id) && n.id !== run.cur; nodeMesh[n.id].material.uniforms.tint.value.setScalar(v ? 0.5 : 1); }
}
const avail = () => node(run.cur).next.map(node);
let mapT = 0;
onFrame((dt, real) => {
  if (!mapActive || !run) return;
  mapT += real;
  const n = node(run.cur), av = avail(), sel = av[selIdx];
  const focus = sel || n;
  const tx = Math.max(0, Math.min(MAP_W * MZ - 320, (focus.x + n.x) / 2 * MZ - 160)), ty = Math.max(0, Math.min(MAP_H * MZ - SH, (MAP_H - (focus.y + n.y) / 2) * MZ - SH / 2));
  cam.x += (tx - cam.x) * Math.min(1, real / 150); cam.y += (ty - cam.y) * Math.min(1, real / 150);
  cam.x = Math.round(cam.x * 4) / 4; cam.y = Math.round(cam.y * 4) / 4;
  for (const id in nodeMesh) nodeMesh[id].scale.setScalar(1);
  av.forEach((a, i) => nodeMesh[a.id].scale.setScalar(i === selIdx ? 1 + 0.25 * (Math.sin(mapT / 120) > 0 ? 1 : 0) : 1 + 0.1 * (Math.sin(mapT / 200) > 0 ? 1 : 0)));
  if (sel && Math.random() < 0.3) spawn({ x: (sel.x + R(-6, 6)) * MZ, y: (MAP_H - sel.y + R(-6, 6)) * MZ, vy: 15, life: 400, size: 1, col: '#fff0a0' });
});

function hud() {
  const s = heroStats();
  mapHud.innerHTML = `<div class="win hudtop"><span>${D.ORIGINS[run.origin]?.sel.tab || '무명'} <span class="dim">${D.REALMS[run.realm]} Lv${run.level}</span></span><span>체력 <b class="${run.hp < s.maxHp * 0.3 ? 'red' : ''}">${run.hp}</b>/${s.maxHp}</span><span class="gold">은자 ${run.gold}</span><span class="btn snd">${muted ? '소리✕' : '소리'}</span><span class="btn inv">행낭${TOUCH ? '' : '(I)'}</span></div>
    <div class="win hudbot"><div class="rg">${REG()[run.region].name} <span class="dim">${node(run.cur).layer}/6</span></div><div class="nd"></div></div>`;
  mapHud.querySelector('.inv').onclick = e => { e.stopPropagation(); openInv(); };
  mapHud.querySelector('.snd').onclick = e => { e.stopPropagation(); setMuted(!muted); hud(); };
  updSel();
}
const NODE_DESC = { mboss: '소챕터 두목 — 상대를 골라 겨룬다, 이기면 보물', rank: '신교 서열전 — 이기면 직위가 오르고 마공서, 져도 죽지 않는다', duel: '구파일방 장문인과 비무 — 이기면 비급, 져도 죽지 않는다', battle: '적과 싸운다 — 초식 카드', elite: '강적 — 초식 카드와 보물', inn: '휴식하거나 수련한다', shop: '은자로 초식 카드·보물·단약을 산다', event: '무슨 일이 일어날지 모른다', boss: '지역의 패자. 쓰러뜨리면 경지 돌파', start: '' };
function updSel() {
  const a = avail()[selIdx], nd = mapHud.querySelector('.nd');
  const foe = a && (a.type === 'boss' ? REG()[a.region].boss : a.type === 'mboss' ? REG()[a.region].mid : null);
  if (nd && a) nd.innerHTML = `<span style="color:${D.NODE_TYPES[a.type].col}">▶${D.NODE_TYPES[a.type].glyph} ${D.NODE_TYPES[a.type].name}${foe ? ' · ' + D.ENEMIES[foe].name : ''}</span> <span class="dim">${foe ? D.ENEMIES[foe].title : NODE_DESC[a.type]}</span>`;
}
function showMap(on) {
  mapActive = on; mapG.visible = on; tallStage(on); // 세로 화면이면 지도가 화면 키를 다 쓴다
  if (on) music.play('map');
  mapHud.classList.toggle('hidden', !on);
  if (on) { clearParticles(); hud(); }
}
let invOpen = false;
async function openInv() { if (invOpen) return; invOpen = true; await invScreen(); invOpen = false; hud(); refreshToken(); }

function chooseNode() {
  return new Promise(res => {
    const av = avail();
    selIdx = Math.min(selIdx, av.length - 1);
    if (selIdx < 0) selIdx = 0;
    updSel();
    const go = i => { off(); $('#root').removeEventListener('click', onClick); $('#root').removeEventListener('mousemove', onMove); res(av[i]); };
    const off = pushKeys(k => {
      if (invOpen) return;
      if (k === 'left' || k === 'up') { selIdx = (selIdx + av.length - 1) % av.length; sfx('move'); updSel(); }
      if (k === 'right' || k === 'down') { selIdx = (selIdx + 1) % av.length; sfx('move'); updSel(); }
      if (k === 'ok') { sfx('ok'); go(selIdx); }
      if (k === 'inv') openInv();
      return true;
    });
    const at = e => { const [mx, my] = toGame(e), wx = (cam.x + mx) / MZ, wy = (cam.y + (SH - my)) / MZ; return av.findIndex(n => Math.hypot(n.x - wx, MAP_H - n.y - wy) < 10); };
    const onMove = e => { if (invOpen || touchy()) return; const i = at(e); if (i >= 0 && i !== selIdx) { selIdx = i; sfx('move'); updSel(); } }; // 터치는 올림 신호로 고르지 않는다(한 번 짚고 한 번 더)
    let tapped = -1; // 터치로 한 번 짚은 칸(처음 골라 둔 칸도 한 번은 짚어야 간다)
    const onClick = e => { if (invOpen || e.target.closest('.win')) return; const i = at(e); if (i < 0) return; if (touchy() && tapped !== i) { tapped = i; selIdx = i; sfx('move'); updSel(); return; } sfx('ok'); go(i); };
    $('#root').addEventListener('click', onClick);
    $('#root').addEventListener('mousemove', onMove);
  });
}
async function moveTo(n) {
  sfx('step');
  const from = node(run.cur);
  token.scale.x = n.x < from.x ? -1 : 1;
  await tween(token.position, { x: n.x, y: MAP_H - n.y - 3 }, 260, ease.lin);
  run.cur = n.id; run.visited.push(n.id); selIdx = 0;
  drawEdges();
}

async function enter(n) {
  switch (n.type) {
    case 'battle': return battle(pickEnemies(n), 'normal');
    case 'elite': return battle(pickEnemies(n), 'elite');
    case 'mboss': {
      const ids = await chooseFoe(REG()[n.region].mid), duo = REG()[n.region].duo;
      if (n.region === 4 && duo) ids.push(pick(duo.flat().filter(id => id !== ids[0]))); // 마지막 지역 중간 두목은 혼자 오지 않는다
      return battle(ids, 'mboss');
    }
    case 'duel': case 'rank': return battle(pickEnemies(n), 'duel');
    case 'inn': await inn(); return 'ok';
    case 'shop': await shop(); return 'ok';
    case 'event': return event(n);
    case 'boss': {
      const r = await battle(n.region < REG().length - 1 ? await chooseFoe(REG()[n.region].boss) : pickEnemies(n), 'boss'); // 마지막 두목은 고정
      if (r !== 'ok') return r;
      if (n.region === 4) { teleSave(run, heroStats().maxHp, 'victory'); return 'victory'; }
      await breakthrough();
      run.region++;
      const start = node(n.next[0]);
      run.cur = start.id; run.visited.push(start.id);
      return 'ok';
    }
  }
  return 'ok';
}
async function breakthrough() {
  const from = D.REALMS[run.realm];
  run.realm++;
  const bh = DF().breakHeal[run.region]; run.hp = Math.min(heroStats().maxHp, run.hp + Math.round(heroStats().maxHp * bh));
  showMap(true); refreshToken();
  sfx('level'); flashScreen('#fff', 600, 1);
  const n = node(run.cur);
  for (let i = 0; i < 80; i++) spawn({ x: (n.x + R(-4, 4)) * MZ, y: (MAP_H - n.y + R(0, 8)) * MZ, vx: R(-60, 60), vy: R(20, 120), life: R(500, 1200), size: R(1, 3), col: pick(['#ffe080', '#ffffff', '#80c0ff']), delay: i * 8 });
  await message(`<div class="big gold">경지 돌파!</div>${from} → <span class="gold">${D.REALMS[run.realm]}</span><br>체력 +30 · 내력 +10 · 공력 +4 · 방어 +2 · 속도 +1.5<br>${bh >= 1 ? '기혈이 완전히 회복되었다.' : `기혈이 ${Math.round(bh * 100)}% 돌아왔다.`}`, '다음 지역으로');
}

// ───────── 루프 / 타이틀 / 종료 ─────────
async function mapLoop() {
  buildMap();
  for (;;) {
    showMap(true);
    run.arrived ||= []; run.seenStory ||= []; run.titles ||= []; run.fxBonus ||= {}; run.route ||= 'normal'; run.origin ||= 'musa'; if (run.school && !run.sims) { run.sims = []; run.sim = null; } // 옛 저장: 심법 없음
    if (!run.arrived.includes(run.region)) { run.arrived.push(run.region); if (await arrival() === 'dead') return end(false); buildMap(); continue; }
    store.set(SAVE, run); rankStart(run);
    const n = await chooseNode();
    await moveTo(n);
    const r = await enter(n);
    if (r === 'dead') return end(false);
    if (r === 'victory') return end(true);
  }
}
async function end(win) {
  store.del(SAVE);
  const best = store.get(BEST) || { region: 0, wins: 0, clears: 0 };
  best.region = Math.max(best.region, run.region + 1); best.wins = Math.max(best.wins, run.wins); if (win) best.clears = (best.clears || 0) + 1;
  if (win) { const b = store.get(DIFF_BEST) || {}; b[run.origin] = Math.max(b[run.origin] ?? -1, run.diff || 0); store.set(DIFF_BEST, b); } // 출신별로 깬 길
  store.set(BEST, best);
  showMap(false);
  const s = screen(win ? 'ending win' : 'ending');
  const ENDING = {
    musa: ['천하제일인', '천마의 검이 부러지고, 천산에 새벽이 왔다.<br>이름 없던 삼류무사는 이제 강호의 전설이 되었다.'],
    sega: ['남궁세가 가주', '천마의 검이 부러졌다.<br>남궁세가는 방계의 아들을 새 가주로 맞았다. 남궁현이 먼저 무릎을 꿇었다.'],
    magyo: run.rank >= 5 ? ['천하제일마', '무림맹주가 쓰러지고 숭산에 검은 깃발이 올랐다.<br>천마는 웃으며 그를 후계라 불렀다.'] : ['마도의 패자', '무림맹주가 쓰러지고 숭산에 검은 깃발이 올랐다.<br>말단 교도였던 자의 이름이 중원을 떨게 했다.'],
    hwasan: ['매화검선', '천마의 검이 부러지고, 천산에 매화가 피었다.<br>말석 제자였던 검은 이제 화산의 이름이 되었다.'],
    sorim: ['살아 있는 나한', '천마의 검이 주먹 앞에 부러졌다.<br>천 계단을 내려갔던 속가제자는 소림의 전설이 되어 돌아왔다.'],
    mudang: ['태극진인', '천마의 검이 허공을 베고 부러졌다.<br>어린 도사는 아무 말 없이 무당으로 돌아갔다.'],
    bukhae: ['빙궁의 후계', '천마의 피가 얼어붙었다. 천산에 처음으로 고요가 내렸다.<br>궁주가 내궁의 문을 열고 말했다. "이제 네 얼음이다."'],
    dang: ['만독의 주인', '천마가 제 피에 번진 독을 알아챘을 때는 이미 늦었다.<br>외문 독수의 이름이 당가 가보에 첫 줄로 적혔다.'],
  }[run.origin || 'musa'];
  if (run.defected) ENDING.splice(0, 2, '배신자의 검', `무림맹주가 천산 설원에 쓰러졌다.<br>${run.origin === 'sega' ? '남궁에서 파문당한 검은' : '정파를 버린 검은'} 이제 천마신교의 검이다.`);
  s.innerHTML = win
    ? `<div class="et">${ENDING[0]}</div><div class="es">${ENDING[1]}</div>`
    : `<div class="et red">강호에 스러지다</div><div class="es">${REG()[run.region].name}에서<br>${{ magyo: '한 마두가', sega: '남궁의 방계가', hwasan: '화산의 말석 제자가', sorim: '소림의 속가제자가', mudang: '무당의 어린 도사가', bukhae: '북해의 제자가', dang: '당가의 외문 독수가' }[run.origin] || '무명의 협객이'} 쓰러졌다.</div>`;
  el('div', 'es dim', `${DF().name}의 길 · ${D.REALMS[run.realm]} Lv${run.level} · 승리 ${run.wins} · 처치 ${run.kills}<br>최고 기록: ${best.region}지역 · 완주 ${best.clears || 0}회`, s);
  music.play(win ? 'victory' : 'defeat');
  await wait(600);
  await new Promise(r => { const off = pushKeys(k => { if (k === 'ok') { off(); r(); } return true; }); s.onclick = () => (off(), r()); el('div', 'es blink', '— 결정 키 —', s); });
  s.remove();
  if (hasRank && RANKED.includes(run.diff)) await rankBox(win);
}
const NICK = 'samryu_nick';
function rankBox(won) { // 판이 끝나면 점수를 보여 주고 이름을 받아 명부에 올린다
  const rec = runRecord(run, won, heroStats().maxHp, REG()[run.region].name), c = tally(rec.fights), P = scoreParts({ ...rec, ...c }), token = run.lbt, cm = n => n.toLocaleString('ko-KR');
  return new Promise(res => {
    const off = pushKeys(() => true), s = el('div', 'screen dimbg', null, ui), w = win(24, 44, 272, 0, s, 'msg rkbox');
    w.style.height = 'auto';
    const done = () => { off(); s.remove(); res(); };
    w.innerHTML = `<div class="mh">강호 명부 · ${DF().name}의 길</div><div class="mt">이 판의 점수 <span class="gold">${cm(scoreOf({ ...rec, ...c }))}점</span><br><span class="dim">지역 ${cm(P.region)} · 격파 ${cm(P.fight)}${won ? ` · 완주 ${cm(P.clear)} · 체력 ${cm(P.hp)} · 턴 ${cm(P.speed)}` : ''}</span></div><div class="rkin"></div><div class="rks" role="status"></div><div class="rkb"></div>`;
    const box = w.querySelector('.rkin'), say = w.querySelector('.rks'), btns = w.querySelector('.rkb');
    const btn = (t, f) => { const b = el('span', 'pvbtn2', t, btns); b.onclick = f; return b; };
    if (!token) { say.textContent = '이번 판은 서버와 닿지 않아 명부에 남길 수 없다.'; btn('확인', done); return; }
    box.innerHTML = '<input maxlength="10" placeholder="이름 (10자까지)" autocomplete="nickname" aria-label="명부에 남길 이름">';
    const inp = box.firstChild; inp.value = store.get(NICK) || '';
    const ERR = { name: '이름을 적어 주시오.', record: '이 기록은 명부에 올릴 수 없다.', time: '이 기록은 명부에 올릴 수 없다.', token: '이 판은 이미 올렸거나 표식이 맞지 않는다.', too_fast: '같은 이름은 10초 뒤에 다시 올릴 수 있다.' };
    let busy = false;
    const send = async () => {
      if (busy) return;
      const name = inp.value.trim();
      if (!name) { say.textContent = ERR.name; sfx('buzz'); inp.focus(); return; }
      busy = true; say.textContent = '명부에 적는 중…';
      try {
        const j = await api({ ...rec, name, token });
        if (j.ok) {
          store.set(NICK, name); sfx('level');
          box.remove(); btns.innerHTML = '';
          say.innerHTML = `${DF().name}의 길 <span class="gold">${j.rank}위</span> <span class="dim">(${j.total}판 중)</span>`;
          btn('명부 보기', () => { location.href = 'ranking.html#d' + run.diff; }); btn('확인', done);
          return;
        }
        say.textContent = ERR[j.error] || '명부에 올리지 못했다.';
      } catch { say.textContent = '서버에 닿지 못했다. 다시 눌러 주시오.'; }
      busy = false;
    };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') send(); if (e.key === 'Escape') done(); };
    btn('이름 남기기', send); btn('그만두기', done);
    setTimeout(() => inp.focus(), 50);
  });
}

let titleBg = null;
async function title() {
  for (;;) {
    run = run || { realm: 0 }; tallStage(true);
    if (IMGS.title) { // 생성 일러스트 타이틀 + 매화 꽃잎
      cam.x = 0; cam.y = 0; if (mapG) mapG.visible = false;
      titleBg ||= quad(IMGS.title, { anchor: 'center' }); titleBg.renderOrder = -20; titleBg.visible = true;
    } else { cam.x = 160; cam.y = 80; if (!mapG) { run = { realm: 0, map: genMap(), cur: 0, visited: [0], region: 0 }; buildMap(); } mapG.visible = true; }
    music.play('title');
    const offPetal = onFrame(() => {
      if (titleBg) { const z = SH / H, c = Math.max(160 / z, Math.min(320 - 160 / z, 85)); titleBg.scale.set(z, z, 1); titleBg.position.set(160 + (160 - c) * z, SH / 2, -1); } // 세로 화면: 그림을 키에 맞게 키우고 무사(x≈85) 쪽으로 자른다
      if (Math.random() < 0.18) spawn({ x: R(40, 360), y: SH + 6, vx: R(-26, -8), vy: R(-22, -10), ax: R(-4, 4), life: 16000, size: Math.random() < 0.3 ? 2 : 1, col: pick(['#ffc8dc', '#ff98c0', '#fff0f6']), fade: false }); });
    const s = screen('title');
    const saved = store.get(SAVE);
    s.innerHTML = `<div class="tt">삼류강호</div><div class="ts">三流江湖 · 도트 무협 로그라이트</div><div class="win tmenu"></div><div class="tc">방향키·Z 결정·X 취소·I 행낭·Tab 배속·M 소리 / 마우스 가능</div>`;
    const choice = await new Promise(res => {
      s.querySelector('.tmenu').classList.toggle('m5', hasRank);
      const m = listMenu(s.querySelector('.tmenu'), [{ html: '새 강호행', v: 'new' }, { html: '이어하기', v: 'cont', disabled: !saved }, { html: '비무 대전', v: 'pvp' }, ...(hasRank ? [{ html: '강호 명부', v: 'rank' }] : []), { html: '강호 견문록', v: 'help' }], { onPick: it => { m.close(); res(it.v); } });
    });
    s.remove(); offPetal(); clearParticles();
    if (titleBg) titleBg.visible = false;
    if (choice === 'rank') { location.href = 'ranking.html'; return; }
    if (choice === 'help') { await message(HELP, '닫기', 6); continue; }
    if (choice === 'pvp') { tallStage(false); const [{ pvpMain }, { netInit }] = await Promise.all([import('./pvp.js'), import('./pvpnet.js')]); await pvpMain(await netInit()); continue; } // 비무 대전: 끝나면 타이틀로
    if (choice === 'cont') run = saved;
    else {
      const key = await charSelect(k => (D.ORIGINS[k].pc && pcFrames(D.ORIGINS[k].pc)) || robeFrames(0));
      if (!key) continue;
      const dbest = store.get(DIFF_BEST) || {};
      const diff = await choose('강호의 길', `<span class="dim">${D.ORIGINS[key].sel.short}, 어떤 길로 나설까?</span>`, D.DIFFS.map((d, i) => ({ html: `<span class="gold">${d.name}</span> <span class="dim">${d.tag}</span>${(dbest[key] ?? -1) >= i ? ' <span class="gold">★</span>' : ''}`, desc: d.desc + (hasRank && RANKED.includes(i) ? ' 명부에 점수가 남는다.' : '') })), { cancel: true });
      if (diff < 0) continue;
      newRun(key, diff);
      await message(`<div class="mh">${D.ORIGINS[key].name}</div>${D.ORIGINS[key].intro}`, '강호로');
    }
    await mapLoop();
    if (!titleBg) mapG.visible = true; else mapG.visible = false;
  }
}
const HELP = `<div class="mh">강호 견문록</div><div style="font: 10px/12px G9">
<b>주천 카드 전투</b>: 차례마다 카드 5장 · 내력 3. 여러 장을 이어 내면 연환 피해가 오른다. 주천 1·2·3단에 따라 카드 값이 바뀐다. 3단에서만 내는 카드는 <span class="gold">절초</span>.<br>
<b>심법</b>: 카드가 아닌 장착 — <b>하나만</b> 운용하고 싸움 밖이면 행낭 › 심법에서 바꿔 낀다. 문파·세가 입문, 기연 심법서로 깨친다. 같은 문파 카드 피해 +20% · 호신 +2.<br>
<b>적도 주천을 돈다</b>: 머리 위 ●가 셋이면 다음 수는 절초. 암기로 끊으면 적 주천 −1. 체력바 아래 칩이 버프·디버프.<br>
<b>덱 빌딩</b>: 삼류무사는 여러 문파 초식을 주워 모은다(잡학 — 문파를 바꿔 이어 내면 피해↑). 다른 문파 두 초식이 모이면 숨은 <span class="gold">합격기</span>.<br>
<b>보물</b>: 강적·두목을 쓰러뜨리면 플레이를 바꾸는 보물. 두목 칸에선 상대를 골라, 그 성향의 보물을 얻는다.<br>
<b>한기·빙결</b>: 한기가 쌓이면 적이 느려지고, 차면 얼어 한 수 쉰다(쓰려던 수는 남는다). <b>독</b>: 적 차례마다 쌓인 만큼 피해, 호신을 뚫고 줄지 않는다.</div>`;

if (/^(localhost|127.0.0.1)$/.test(location.hostname) || window.claude) window.SAMRYU = { get run() { return run; }, heroStats: () => heroStats(), fight: (ids, kind = 'duel') => battle(ids, kind), story: id => runEvent(STORY().find(e => e.id === id), eventApi()), tournament: () => tournament(), shop: () => shop(), chooseFoe: id => chooseFoe(id), relicPick: tag => relicPick(tag), revealCombos: () => revealCombos(), reward: (kind, ids, master) => rewardScreen(kind, ids, master), end: win => end(win) }; // 디버그·치트용
(async () => {
  await Promise.all([...['12px G11', '12px G11B', '10px G9'].map(f => document.fonts.load(f, '삼류강호刀凶宿金奇王出武河南')), loadArt(D.ART_IDS)]);
  mapHud = el('div', 'maphud hidden', null, ui);
  title();
})();
