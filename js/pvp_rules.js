// pvp_rules.js — 비무 대전(PvP) 규칙: PvP용으로 다듬은 카드 표 · 동시 공개 판정 · AI. 화면이 없다(두 기기가 같은 시드로 같은 결과를 낸다)
// 한 차례: 둘이 동시에 손패에서 최대 4장을 순서대로 고르고, 1번 칸부터 동시에 뒤집는다.
// 상성: 공격은 허초를 끊고 방어에 막힌다 · 방어는 허초에 깨진다 · 암기는 공격·허초를 끊고 방어에 막힌다 · 공격끼리는 부딪혀 큰 쪽이 차이만큼 들어간다(상쇄) · 운기는 제 몸만 다스린다
// 3판 2선승. 판이 끝날 때마다 보급 카드 셋 중 하나를 덱에 넣는다. 속도는 없다(모든 칸이 동시)
import { CARDS, DECKS, OUTER, TYPE, TYPE_NAME } from './cards.js';

export const RULE = { guard: 'once', parry: 'half', heat: 2, copies: 2, t3mul: 1, t3add: 3 };
// guard 막기 유지(turn 차례 내내 · once 반격은 한 번 터지면 끝 · slot 낸 칸에서만) · parry 되치기(turn 첫 공격을 0으로 · slot 낸 칸만 · half 절반은 맞고 절반을 되돌림)
// heat 3단으로 몇 차례를 넘기면 주화입마 · copies 같은 카드 최대 장수(기본 덱에 원래 더 있으면 그만큼) · t3mul/t3add 3단에서 내는 공격(절초 빼고)의 보상
export const HP = 60, ENERGY = 3, HAND = 5, MAX_HAND = 8, SLOTS = 4, TURN_CAP = 8, WIN_ROUNDS = 2;
export const SCHOOLS = ['samryu', 'hwasan', 'sorim', 'mudang', 'namgung', 'magyo'];
export const SCHOOL_KO = { samryu: '삼류', hwasan: '화산', sorim: '소림', mudang: '무당', namgung: '남궁', magyo: '마교', combo: '합격', dang: '당가', gaebang: '개방', emei: '아미', gonryun: '곤륜', gongdong: '공동' };
export const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const v = (x, t) => (Array.isArray(x) ? x[t - 1] : x) || 0;

// ── PvP 카드 표 ── t 종류 · c 내력(X=남은 전부) · d 피해 · h 타수 · b 호신 · ctr 반격(차례 안에 한 번) · parry 되치기(다음 공격 한 번의 절반을 되돌림) · half 흘림(받는 공격 절반, 횟수)
// tier 주천± · set 주천 맞춤 · fin 쓰면 1단으로 · only 그 단에서만 · en 내력+(이번 차례) · enN 다음 차례 내력+ · tal 다음 차례 내력− · drawN 다음 차례 1장 더 · petN 다음 차례 꽃잎
// heal 회복 · hp 체력 대가 · st 맞힌 상대에 상태(bleed 출혈·weak 약화·vuln 내상) · blunt 상대 절초 약화(이번 차례 절반) · cut 상대 주천 −1 · ls 흡혈 · pierce 호신 무시 · dbl 다음 공격 두 배 · x 특수
export const PV = {
  sr_samjae: { t: '공', c: 1, d: [5, 8, 6], h: [1, 1, 2], b: [3, 0, 0] },
  sr_makgi: { t: '수', c: 1, half: [1, 2, 2] },
  sr_sum: { t: '운', c: 0, tier: 1 },
  sr_gaessa: { t: '공', c: 1, d: 5, st: { weak: 1 } },
  sr_morae: { t: '암', c: 0, cut: 1 },
  ilseom: { t: '공', c: 1, d: [3, 6, 8], x: 'late' }, // 0내력 카드로 앞 칸을 채우면 거의 늘 두 번 벤다 → 낮춤
  nakhwa: { t: '공', c: 1, d: [3, 4, 6], h: 2, petN: 1 },
  amhyang: { t: '운', c: 0, tier: 1, x: 'amhyang' }, // 0내력에 1장 더까지는 과했다
  biwol: { t: '공', c: 1, d: 4, tier: 1 },
  bichim: { t: '암', c: 1, d: 3, st: { bleed: 3 } },
  heocho: { t: '허', c: 1, blunt: true, x: 'echo' },
  geomjin: { t: '수', c: 1, b: [5, 7, 9], petN: [1, 1, 2] },
  mangae: { t: '공', c: 2, only: 3, fin: true, d: 6, h: 4 },
  isipsa: { t: '공', c: 2, d: [5, 6, 8], h: 2, x: 'isipsa' }, // 본 게임의 전체 공격: 상대가 하나라 단일 값으로 올림
  yeonhwan: { t: '공', c: 1, d: [2, 3, 4], x: 'yeonhwan' },
  chilmae: { t: '운', c: 'X', x: 'chilmae' },
  amhyangbu: { t: '운', c: 1, b: 4, enN: 1 },
  petal: { t: '공', c: 0, d: [1, 2, 3], token: true },
  nahan: { t: '공', c: 1, d: [6, 7, 8], x: 'nahan' },
  geumgang: { t: '수', c: 1, b: [8, 5, 3], ctr: 3 },
  cheolpo: { t: '수', c: 1, b: [11, 7, 4] },
  bantan: { t: '수', c: 1, b: [4, 3, 2], ctr: 3 },
  sajahu: { t: '허', c: 1, blunt: true, st: { weak: 2 }, x: 'sajahu' },
  yeomhwa: { t: '암', c: 0, d: 2, x: 'yeomhwa' },
  dalma: { t: '운', c: 0, tier: -1, en: 1 },
  budong: { t: '수', c: 2, only: 1, b: 18, ctr: 5 },
  hangma: { t: '공', c: 2, x: 'hangma' },
  nahanjin: { t: '공', c: 2, d: [10, 11, 12], x: 'nahan' }, // 전체 공격 → 단일 값으로 올림
  daeryeok: { t: '공', c: 2, tal: 1, x: 'daeryeok' },
  chamseon: { t: '운', c: 1, b: 6, x: 'chamseon' },
  gyeonsu: { t: '수', c: 0, b: 3, x: 'gyeonsu' },
  md_yangui: { t: '공', c: 1, d: [5, 9, 6] },
  md_yuun: { t: '공', c: 1, d: [3, 4, 3], h: 2, x: 'yuun' },
  md_taeguk: { t: '수', c: 1, b: 4, parry: 1 },
  md_seonhwan: { t: '운', c: 0, set: 2, drawN: 1 },
  md_myeonjang: { t: '수', c: 1, b: [5, 8, 5], ctr: 3, st: { weak: 1 } },
  md_jwasu: { t: '공', c: 1, d: [6, 8, 6], x: 'jwasu' },
  md_taegeukgeom: { t: '공', c: 2, x: 'returned' },
  md_jeonghwa: { t: '운', c: 1, heal: 4, enN: 1 },
  md_manryu: { t: '공', c: 2, only: 2, d: 12, parry: 1 },
  md_cheonji: { t: '허', c: 1, blunt: true, cut: 1 },
  ng_changgung: { t: '공', c: 1, d: [5, 8, 13] },
  ng_mueo: { t: '운', c: 0, tier: 1, b: 3, cool: true }, // 발놀림으로 기를 흘린다 — 3단에 머무는 남궁의 숨구멍(주화입마)
  ng_jewang: { t: '공', c: 2, d: [8, 14, 24] },
  ng_cheongong: { t: '공', c: 1, d: [3, 5, 8], pierce: true },
  ng_gyeonggeom: { t: '수', c: 1, b: [6, 7, 8], cool: true },
  ng_noeun: { t: '공', c: 1, d: [4, 6, 9], x: 'noeun' },
  ng_bonggeom: { t: '운', c: 1, tier: 1, dbl: true },
  ng_gaju: { t: '운', c: 1, en: 2, tal: 1, drawN: 1 },
  ng_cheonha: { t: '공', c: 3, only: 3, fin: true, d: 40 },
  ng_cheolbyeok: { t: '수', c: 1, b: 8, ctr: 2 },
  mg_hyeolin: { t: '공', c: 1, d: [6, 8, 10], st: { bleed: 2 } },
  mg_hyeolgeom: { t: '공', c: 0, hp: 2, d: [5, 7, 9] },
  mg_heupsu: { t: '공', c: 1, d: [4, 5, 6], x: 'heupsu' },
  mg_mabo: { t: '운', c: 0, hp: 2, tier: 1, en: 1 },
  mg_hyeolgap: { t: '수', c: 1, b: [6, 7, 8], x: 'hyeolgap' },
  mg_cheonma: { t: '공', c: 2, d: [9, 11, 14], st: { bleed: 3 } }, // 전체 공격 → 단일 값으로 올림
  mg_hyeolhae: { t: '공', c: 1, x: 'hyeolhae' },
  mg_heupseong: { t: '공', c: 1, d: 10, tal: 1, ls: 1 },
  mg_cheonmasin: { t: '공', c: 2, only: 3, fin: true, x: 'cheonmasin' },
  mg_hyeolmu: { t: '허', c: 1, blunt: true, st: { weak: 2, bleed: 2 } },
  cb_taemae: { t: '공', c: 1, d: [6, 9, 12], parry: 1, petN: 2 },
  cb_hyeolu: { t: '암', c: 1, x: 'hyeolu' },
  cb_geumtae: { t: '수', c: 1, b: 10, ctr: 4, parry: 1 },
  cb_changnak: { t: '공', c: 1, d: [5, 8, 13], petN: 2 },
  cb_nahyeol: { t: '공', c: 0, hp: 3, x: 'nahyeol' },
  cb_unbo: { t: '운', c: 0, set: 3, drawN: 1, cool: true },
  cb_hyeolpo: { t: '수', c: 1, b: 12, x: 'hyeolpo' },
  cb_tanji: { t: '암', c: 0, d: 3, h: 3, st: { bleed: 2 } },
  cb_jewanghyeol: { t: '공', c: 2, d: [10, 16, 26], st: { bleed: 4 } },
  cb_cheolgeum: { t: '수', c: 1, b: [10, 12, 14], ctr: 3, drawN: 1 },
  oe_manchun: { t: '암', c: 2, d: 2, h: 4, st: { bleed: 4 }, tal: 1 },
  oe_tagu: { t: '공', c: 1, d: 6, st: { weak: 2, vuln: 1 } },
  oe_bokho: { t: '수', c: 1, heal: 6, b: 6, tal: 1 },
  oe_unryong: { t: '운', c: 1, drawN: 1, dbl: true },
  oe_chilsang: { t: '공', c: 1, hp: 4, d: [14, 16, 20] },
};
const X_DESC = { late: '3번 칸 이후면 두 번 벤다', amhyang: '이미 3단이면 대신 꽃잎 2장', echo: '이번 차례 다음 공격 두 배', isipsa: '손의 꽃잎을 모두 날려 장당 피해 4', yeonhwan: '칸 번호만큼 연타', chilmae: '남은 내력 1마다 다음 차례 꽃잎 2장', nahan: '1단이면 호신의 절반만큼 더', sajahu: '1단이면 상대 주천 −1', yeomhwa: '1단이면 다음 차례 내력 +1', hangma: '호신 ×1·0.7·0.5배 피해', daeryeok: '이번 판 막아낸 피해를 쏟는다(최대 40)', chamseon: '1단이면 다음 차례 내력 +1', gyeonsu: '이번 차례 앞서 낸 방어마다 호신 +3', yuun: '2단이면 호신 4', jwasu: '상대가 약화면 두 배', returned: '6 + 이번 판 되돌린 피해(최대 30)', noeun: '3단이면 내상 2', heupsu: '상대가 출혈이면 흡혈', hyeolgap: '체력 절반 이하면 두 배', hyeolhae: '3 + 상대 출혈 ×2', cheonmasin: '잃은 체력만큼 피해(최대 40)', hyeolu: '출혈이 없으면 5, 있으면 두 배', nahyeol: '지금 호신만큼 피해(최대 30)', hyeolpo: '체력 절반 이하면 반격 6' };
const ST_KO = { bleed: '출혈', weak: '약화', vuln: '내상' };
export const fmt = x => (Array.isArray(x) ? x.join('/') : x);
export function pvDesc(id) { // 카드 설명(PvP 수치)
  const p = PV[id], out = [];
  if (p.only) out.push(`[${p.only}단 전용]`);
  if (p.hp) out.push(`체력 ${p.hp} 대가`);
  if (p.d) out.push(`피해 ${fmt(p.d)}${p.h ? '×' + fmt(p.h) : ''}`);
  if (p.pierce) out.push('호신 무시');
  if (p.b) out.push(`호신 ${fmt(p.b)}`);
  if (p.ctr) out.push(`반격 ${p.ctr}`);
  if (p.parry) out.push('되치기(다음 공격의 절반을 되돌리고 나머지만 받는다)');
  if (p.half) out.push(`흘림 ${fmt(p.half)}(받는 공격 절반)`);
  if (p.heal) out.push(`체력 ${p.heal} 회복`);
  if (p.tier) out.push(`주천 ${p.tier > 0 ? '+' : ''}${p.tier}`);
  if (p.set) out.push(`주천 ${p.set}단으로`);
  if (p.en) out.push(`내력 +${p.en}`);
  for (const k in p.st || {}) out.push(`${ST_KO[k]} ${p.st[k]}`);
  if (p.blunt) out.push('상대 절초 약화');
  if (p.cut) out.push('상대 주천 −1');
  if (p.ls) out.push('흡혈');
  if (p.dbl) out.push('다음 공격 두 배');
  if (p.petN) out.push(`다음 차례 꽃잎 ${fmt(p.petN)}`);
  if (p.drawN) out.push('다음 차례 1장 더');
  if (p.enN) out.push(`다음 차례 내력 +${p.enN}`);
  if (p.tal) out.push(`탈력${p.tal}(다음 차례 내력 −${p.tal})`);
  if (p.x) out.push(X_DESC[p.x]);
  if (p.fin) out.push('쓰면 주천 1단으로');
  if (p.cool) out.push('과열을 식힌다');
  return out.join(' · ');
}
export const MATCHUP = { 공: '허초를 끊고 · 방어에 막힘 · 공격끼리는 상쇄(절초는 일반 공격을 부순다)', 수: '공격·암기를 막음 · 허초에 깨짐', 허: '방어를 깨뜨림 · 공격·암기에 끊김', 암: '공격·허초를 끊음 · 방어에 막힘', 운: '제 몸만 다스림(맞으면 그대로 맞는다)' };
export const typeName = id => TYPE_NAME[PV[id].t];
export const typeCol = id => TYPE[PV[id].t];
export const nameOf = id => CARDS[id].short || CARDS[id].name;

// ── 덱·보급 ──
const COMMON = s => DECKS[s].pool.filter(id => !PV[id]?.only && !['isipsa', 'chilmae', 'hangma', 'daeryeok', 'md_taegeukgeom', 'mg_cheonma'].includes(id));
export const poolOf = s => [...new Set(s === 'samryu' ? ['sr_samjae', 'sr_makgi', 'sr_sum', 'sr_gaessa', 'sr_morae', ...OUTER, ...SCHOOLS.slice(1).flatMap(COMMON)] : DECKS[s].pool)].filter(id => PV[id]); // 삼류 = 잡학: 모든 문파의 보통 초식
export const supplyN = (s, round) => round; // 판 사이 보급 장수 — 판이 갈수록 는다(1판 뒤 1장, 2판 뒤 2장)
export const swapsOf = s => (s === 'samryu' ? 5 : 1); // 덱 교체: 문파는 1장(나머지는 보급으로 판마다 는다) · 삼류는 잡학 5장
export const startDeck = s => DECKS[s].start.filter(id => PV[id]).concat(s === 'samryu' ? ['sr_gaessa', 'oe_tagu'] : []); // 삼류는 두 장 더(떠돌며 주운 한 수)
const SUPPLY = [...OUTER, 'cb_taemae', 'cb_hyeolu', 'cb_geumtae', 'cb_changnak', 'cb_nahyeol', 'cb_unbo', 'cb_hyeolpo', 'cb_tanji', 'cb_jewanghyeol', 'cb_cheolgeum', 'mangae', 'isipsa', 'budong', 'hangma', 'daeryeok', 'md_taegeukgeom', 'md_manryu', 'ng_cheonha', 'mg_cheonmasin', 'mg_cheonma', 'heocho', 'sajahu', 'md_cheonji', 'mg_hyeolmu'];
export function validDeck(s, deck) { // 문파 기본 덱에서 정해진 장수(문파 1·삼류 5)만 바꿨나
  const base = startDeck(s), pool = new Set([...base, ...poolOf(s)]);
  if (deck.length !== base.length || deck.some(id => !pool.has(id))) return false;
  const left = [...base]; let diff = 0;
  for (const id of deck) { const i = left.indexOf(id); if (i >= 0) left.splice(i, 1); else diff++; }
  if (RULE.copies && deck.some(id => countIn(deck, id) > Math.max(RULE.copies, countIn(base, id)))) return false;
  return diff <= swapsOf(s);
}

// ── 대전 상태 ──
export const hpOf = s => (s === 'samryu' ? 72 : HP); // 삼류는 맷집으로 버틴다
const freshP = (deck, school) => ({ school, deck: [...deck], maxHp: hpOf(school), hp: hpOf(school), tier: 1, pile: [], disc: [], hand: [], bleed: 0, weak: 0, vuln: 0, enN: 0, talN: 0, drawN: 0, petN: 0, blocked: 0, returned: 0, block: 0, ctr: 0, parry: 0, half: 0, blunt: false, dbl: false, heat: 0, energy: ENERGY });
export function newMatch(seed, decks, schools) {
  const m = { seed, r: rng(seed), round: 0, wins: [0, 0], turn: 0, p: [freshP(decks[0], schools[0]), freshP(decks[1], schools[1])], over: null, offers: null };
  newRound(m);
  return m;
}
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function newRound(m) {
  m.round++; m.turn = 0; m.offers = null;
  m.p = m.p.map(p => ({ ...freshP(p.deck, p.school) }));
  for (const p of m.p) p.pile = shuffle([...p.deck], m.r);
  startTurn(m);
}
function draw(p, n, r) {
  for (let i = 0; i < n && p.hand.length < MAX_HAND; i++) {
    if (!p.pile.length) { if (!p.disc.length) return; p.pile = shuffle(p.disc, r); p.disc = []; }
    p.hand.push(p.pile.pop());
  }
}
export function startTurn(m) {
  m.turn++;
  for (const p of m.p) {
    p.energy = Math.max(0, ENERGY + p.enN - p.talN); p.enN = 0; p.talN = 0;
    draw(p, Math.max(0, HAND - p.hand.length) + p.drawN, m.r); p.drawN = 0;
    for (let i = 0; i < p.petN && p.hand.length < MAX_HAND; i++) p.hand.push('petal');
    p.petN = 0;
  }
}

// 고른 순서가 낼 수 있나(제 내력·주천만으로 미리 따진다 — 상대가 주천을 끊으면 전용 카드는 흩어질 수 있다)
export function planOf(p, seq) {
  let en = p.energy, tier = p.tier;
  const steps = [];
  for (const id of seq) {
    const c = PV[id];
    if (c.only && tier !== c.only) return null;
    const cost = c.c === 'X' ? en : c.c;
    if (cost > en) return null;
    en -= cost; en += c.en || 0;
    steps.push({ id, tier, cost });
    tier = nextTier(c, tier);
  }
  return { steps, en, tier };
}
const nextTier = (c, t) => (c.fin ? 1 : c.set ? c.set : Math.max(1, Math.min(3, t + (c.tier || 0))));
export const legal = (p, seq) => seq.length <= SLOTS && !!planOf(p, seq) && seq.every((id, i) => countIn(p.hand, id) >= countIn(seq.slice(0, i + 1), id));
const countIn = (a, id) => a.reduce((n, x) => n + (x === id), 0);

// ── 한 차례 판정 ── seqs: [[id…], [id…]] → 사건 목록(연출용). m을 바꾼다
export function resolveTurn(m, seqs) {
  const ev = [], P = m.p;
  seqs = seqs.map((s, i) => (legal(P[i], s) ? s : [])); // 손에 없거나 못 내는 순서는 빈 수로
  const plans = seqs.map((s, i) => planOf(P[i], s));
  for (let i = 0; i < 2; i++) for (const id of seqs[i]) P[i].hand.splice(P[i].hand.indexOf(id), 1);
  const played = [[], []];
  for (let k = 0; k < SLOTS; k++) {
    const ids = [seqs[0][k] || null, seqs[1][k] || null];
    if (!ids[0] && !ids[1]) break;
    const S = ids.map((id, i) => {
      if (!id) return null;
      const c = PV[id], p = P[i], tier = p.tier;
      const cost = plans[i].steps[k] ? plans[i].steps[k].cost : 0;
      return { i, id, c, tier, cost, cls: c.only && tier !== c.only ? null : c.t };
    });
    ev.push({ k, ids, kind: 'reveal', tiers: [P[0].tier, P[1].tier] });
    for (const s of S) if (s && !s.cls) ev.push({ k, kind: 'fizzle', side: s.i, why: '주천이 맞지 않아 흩어졌다' });
    const cls = S.map(s => s && s.cls);
    const cancelled = [0, 1].map(i => { const me = cls[i], op = cls[1 - i]; return (me === '공' && op === '암') || (me === '허' && (op === '공' || op === '암')); });
    const broken = [0, 1].map(i => cls[i] === '수' && cls[1 - i] === '허');
    for (const i of [0, 1]) if (cancelled[i]) ev.push({ k, kind: 'cut', side: i });
    for (const i of [0, 1]) if (cls[1 - i] === '허' && !cancelled[1 - i] && (broken[i] || P[i].block || P[i].ctr || P[i].parry || P[i].half)) { // 허초가 들면 이미 쌓은 호신도 깨진다
      P[i].block = 0; P[i].ctr = 0; P[i].parry = 0; P[i].half = 0; ev.push({ k, kind: 'break', side: i });
    }
    // 1) 대가와 제 몸 효과
    for (const s of S) {
      if (!s || !s.cls) continue;
      const p = P[s.i], o = P[1 - s.i], c = s.c;
      if (c.hp) { p.hp -= c.hp; ev.push({ k, kind: 'cost', side: s.i, n: c.hp }); }
      if (cancelled[s.i]) continue;
      if (!broken[s.i]) self(m, s, p, o, ev, k, played[s.i]);
    }
    // 2) 허초·암기가 상대에게
    for (const s of S) {
      if (!s || !s.cls || cancelled[s.i]) continue;
      const p = P[s.i], o = P[1 - s.i], c = s.c;
      if (s.cls === '허') { applySt(o, c.st, ev, k, 1 - s.i); if (c.blunt) { o.blunt = true; ev.push({ k, kind: 'blunt', side: 1 - s.i }); } if (c.cut || (c.x === 'sajahu' && s.tier === 1)) cut(o, ev, k, 1 - s.i); if (c.x === 'echo') p.dbl = true; }
      if (s.cls === '암') {
        let d = v(c.d, s.tier) * (v(c.h, s.tier) || 1);
        if (c.x === 'hyeolu') { const n = o.bleed ? o.bleed : 5; o.bleed += n; ev.push({ k, kind: 'st', side: 1 - s.i, st: 'bleed', n }); }
        if (d) hit(m, s.i, d, ev, k, { amg: true });
        applySt(o, c.st, ev, k, 1 - s.i);
        if (c.cut) cut(o, ev, k, 1 - s.i);
        if (c.x === 'yeomhwa' && s.tier === 1) p.enN += 1;
      }
    }
    // 3) 공격: 둘 다 공격이면 부딪혀 상쇄
    const atk = S.map(s => (s && s.cls === '공' && !cancelled[s.i] ? s : null));
    const dmg = atk.map((s, i) => (s ? attackDmg(m, s, P[i], P[1 - i], k, played[i]) : 0));
    const jc = atk.map(s => !!(s && s.c.only === 3));
    if (atk[0] && atk[1] && jc[0] !== jc[1]) { const w = jc[0] ? 0 : 1; ev.push({ k, kind: 'crush', side: 1 - w }); land(m, atk[w], dmg[w], ev, k); }
    else if (atk[0] && atk[1]) {
      ev.push({ k, kind: 'clash', n: dmg });
      const w = dmg[0] > dmg[1] ? 0 : dmg[1] > dmg[0] ? 1 : -1;
      if (w >= 0) land(m, atk[w], dmg[w] - dmg[1 - w], ev, k);
    } else for (const i of [0, 1]) if (atk[i]) land(m, atk[i], dmg[i], ev, k);
    // 4) 주천은 칸이 끝날 때 움직인다(이 칸의 값은 시작 단으로)
    for (const s of S) if (s && s.cls && !cancelled[s.i]) { const p = P[s.i], t0 = p.tier; p.tier = nextTier(s.c, p.tier); if (p.tier !== t0) ev.push({ k, kind: 'tier', side: s.i, from: t0, to: p.tier }); }
    for (const s of S) if (s) played[s.i].push(s.id);
    if (RULE.guard === 'slot') for (const p of P) { p.block = 0; p.ctr = 0; p.parry = 0; p.half = 0; }
    if (RULE.parry === 'slot') for (const p of P) p.parry = 0;
    if (P[0].hp <= 0 || P[1].hp <= 0) break;
  }
  // 차례 끝: 출혈, 쌓은 것 흩어짐, 낸 카드는 버림
  for (let i = 0; i < 2; i++) {
    const p = P[i];
    if (p.bleed > 0 && p.hp > 0) { p.hp -= p.bleed; ev.push({ kind: 'bleed', side: i, n: p.bleed }); p.bleed--; }
    if (p.tier === 3) { if (++p.heat >= RULE.heat && p.hp > 0) { const n = Math.round(p.maxHp * 0.12); p.hp -= n; p.tier = 1; p.heat = 0; ev.push({ kind: 'deviate', side: i, n }); } else ev.push({ kind: 'heat', side: i }); } else p.heat = 0;
    p.block = 0; p.ctr = 0; p.parry = 0; p.half = 0; p.blunt = false; p.dbl = false;
    for (const id of seqs[i]) if (!PV[id].token) p.disc.push(id);
  }
  const end = roundEnd(m);
  if (end) ev.push({ kind: 'round', winner: end.winner });
  else startTurn(m);
  return ev;
}
function self(m, s, p, o, ev, k, playedBefore) {
  const c = s.c, t = s.tier;
  let b = v(c.b, t);
  if (c.x === 'hyeolgap' && p.hp <= p.maxHp / 2) b *= 2;
  if (c.x === 'gyeonsu') b += 3 * playedBefore.filter(id => PV[id].t === '수').length;
  if (c.x === 'yuun' && t === 2) b += 4;
  if (b) { p.block += b; ev.push({ k, kind: 'block', side: s.i, n: b }); }
  const ctr = (c.ctr || 0) + (c.x === 'hyeolpo' && p.hp <= p.maxHp / 2 ? 6 : 0);
  if (ctr) { p.ctr += ctr; ev.push({ k, kind: 'counterOn', side: s.i, n: ctr }); }
  if (c.parry) { p.parry += c.parry; ev.push({ k, kind: 'parryOn', side: s.i }); }
  if (c.half) { p.half += v(c.half, t); ev.push({ k, kind: 'halfOn', side: s.i, n: v(c.half, t) }); }
  if (c.heal) { const n = Math.min(c.heal, p.maxHp - p.hp); p.hp += n; ev.push({ k, kind: 'heal', side: s.i, n }); }
  if (c.enN) p.enN += c.enN;
  if (c.x === 'chamseon' && t === 1) p.enN += 1;
  if (c.tal) p.talN += c.tal;
  if (c.drawN) p.drawN += c.drawN;
  let pet = v(c.petN, t);
  if (c.x === 'amhyang' && t === 3) pet += 2;
  if (c.x === 'chilmae') pet += 2 * s.cost;
  if (pet) { p.petN += pet; ev.push({ k, kind: 'petal', side: s.i, n: pet }); }
  if (c.dbl) { p.dbl = true; ev.push({ k, kind: 'dbl', side: s.i }); }
  if (c.cool && p.heat) { p.heat = 0; ev.push({ k, kind: 'cool', side: s.i }); }
  if (c.t === '수') applySt(o, c.st, ev, k, 1 - s.i);
}
function applySt(o, st, ev, k, side) { for (const key in st || {}) { o[key] += st[key]; ev.push({ k, kind: 'st', side, st: key, n: st[key] }); } }
function cut(o, ev, k, side) { if (o.tier > 1) { o.tier--; ev.push({ k, kind: 'tier', side, from: o.tier + 1, to: o.tier, cut: true }); } }
function attackDmg(m, s, p, o, k, playedBefore) {
  const c = s.c, t = s.tier;
  let d = v(c.d, t), h = v(c.h, t) || 1;
  switch (c.x) {
    case 'late': if (k >= 2) h = 2; break;
    case 'isipsa': { const n = p.hand.filter(id => id === 'petal').length; p.hand = p.hand.filter(id => id !== 'petal'); d = d * h + 4 * n; h = 1; break; }
    case 'yeonhwan': h = k + 1; break;
    case 'nahan': if (t === 1) d += Math.floor(p.block / 2); break;
    case 'hangma': d = Math.floor(p.block * [1, 0.7, 0.5][t - 1]); break;
    case 'nahyeol': d = Math.min(30, p.block); break;
    case 'daeryeok': d = Math.min(40, p.blocked); p.blocked = 0; break;
    case 'returned': d = 6 + Math.min(30, p.returned); break;
    case 'jwasu': if (o.weak > 0) d *= 2; break;
    case 'hyeolhae': d = 3 + o.bleed * 2; break;
    case 'cheonmasin': d = Math.min(40, p.maxHp - Math.max(0, p.hp)); break;
  }
  let n = d * h;
  if (p.dbl) { n *= 2; p.dbl = false; }
  if (t === 3 && !c.fin) n = n * RULE.t3mul + RULE.t3add; // 3단의 보상(주화입마를 무릅쓴 값)
  if (p.weak > 0) { n = Math.floor(n * 0.75); p.weak--; }
  if (c.fin && p.blunt) n = Math.floor(n / 2);
  return Math.max(0, Math.round(n));
}
function land(m, s, n, ev, k) { // 공격이 들어간다(상쇄 뒤 남은 피해)
  const c = s.c, p = m.p[s.i], o = m.p[1 - s.i];
  const dealt = hit(m, s.i, n, ev, k, { pierce: c.pierce });
  if (dealt >= 0 && n > 0) { // 되돌려졌으면(−1) 상태도 안 걸린다
    let st = c.st;
    if (c.x === 'noeun' && s.tier === 3) st = { ...st, vuln: 2 };
    applySt(o, st, ev, k, 1 - s.i);
  }
  if ((c.ls || (c.x === 'heupsu' && o.bleed > 0)) && dealt > 0) { const h = Math.min(dealt, p.maxHp - p.hp); if (h > 0) { p.hp += h; ev.push({ k, kind: 'heal', side: s.i, n: h }); } }
}
function hit(m, from, n, ev, k, { pierce, amg } = {}) { // from이 상대를 친다 → 실제 깎인 체력(되돌려지면 −1)
  const a = m.p[from], o = m.p[1 - from], to = 1 - from;
  if (n <= 0) return 0;
  if (o.vuln > 0) { n = Math.round(n * 1.3); o.vuln--; }
  if (!amg && o.parry > 0) { o.parry--; const r = Math.ceil(n / 2); o.returned += r; a.hp -= r; ev.push({ k, kind: 'reflect', side: to, n: r }); if (RULE.parry !== 'half') return -1; n -= r; }
  if (!amg && o.half > 0) { n = Math.ceil(n / 2); o.half--; ev.push({ k, kind: 'halved', side: to }); }
  let ab = 0;
  if (!pierce && o.block > 0) { ab = Math.min(o.block, n); o.block -= ab; o.blocked += ab; n -= ab; }
  o.hp -= n;
  ev.push({ k, kind: 'hit', side: to, n, ab, amg: !!amg });
  if (!amg && o.ctr > 0) { a.hp -= o.ctr; o.returned += o.ctr; ev.push({ k, kind: 'counter', side: from, n: o.ctr }); if (RULE.guard === 'once') o.ctr = 0; }
  return n;
}
function roundEnd(m) {
  const [a, b] = m.p, dead = a.hp <= 0 || b.hp <= 0, cap = m.turn >= TURN_CAP;
  if (!dead && !cap) return null;
  const winner = a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1;
  if (winner >= 0) m.wins[winner]++;
  if (m.wins[0] >= WIN_ROUNDS || m.wins[1] >= WIN_ROUNDS) m.over = { winner: m.wins[0] > m.wins[1] ? 0 : 1 };
  else m.offers = m.p.map(p => shuffle([...SUPPLY], m.r).slice(0, Math.max(3, supplyN(p.school, m.round) + 1)));
  return { winner };
}
export function takeSupply(m, picks) { // 판 사이 보급: 둘이 고른 카드들을 덱에 넣고 다음 판
  picks.forEach((ids, i) => { const n = supplyN(m.p[i].school, m.round); for (const id of new Set([].concat(ids || []).slice(0, n))) if (m.offers[i].includes(id)) m.p[i].deck.push(id); });
  newRound(m);
}

// ── AI ── 낼 수 있는 순서를 뽑아 상대의 그럴듯한 수들과 가상으로 맞붙여 본다
function sequences(p, limit = 400) {
  const out = [[]], hand = p.hand;
  const walk = (seq, used) => {
    if (out.length >= limit || seq.length >= SLOTS) return;
    const seen = new Set();
    for (let i = 0; i < hand.length; i++) {
      if (used & (1 << i) || seen.has(hand[i])) continue;
      seen.add(hand[i]);
      const next = [...seq, hand[i]];
      if (!planOf(p, next)) continue;
      out.push(next); walk(next, used | (1 << i));
    }
  };
  walk([], 0);
  return out;
}
const clone = m => ({ ...m, r: rng(1), p: m.p.map(p => ({ ...p, hand: [...p.hand], pile: [...p.pile], disc: [...p.disc], deck: p.deck })), wins: [...m.wins], over: null, offers: null });
export function aiPick(m, side, rand = Math.random, samples = 24, width = 160) {
  const mine = sequences(m.p[side]), theirs = sequences(m.p[1 - side]);
  const opp = Array.from({ length: Math.min(samples, theirs.length) }, () => theirs[Math.floor(rand() * theirs.length)]);
  const cand = mine.length > width ? Array.from({ length: width }, () => mine[Math.floor(rand() * mine.length)]) : mine;
  let best = [], bestS = -1e9;
  for (const seq of cand) {
    let s = 0;
    for (const o of opp) {
      const c = clone(m), me = c.p[side], op = c.p[1 - side], h0 = me.hp, o0 = op.hp;
      resolveTurn(c, side === 0 ? [seq, o] : [o, seq]);
      s += (o0 - Math.max(-10, op.hp)) - (h0 - Math.max(-10, me.hp)) * 1.1 + (op.hp <= 0 ? 30 : 0) - (me.hp <= 0 ? 40 : 0) + (me.tier - m.p[side].tier) * 1.5;
    }
    s = s / Math.max(1, opp.length) + rand() * 1.5;
    if (s > bestS) { bestS = s; best = seq; }
  }
  return best;
}
export function aiSupply(m, side, rand = Math.random) { return shuffle([...m.offers[side]], rand).slice(0, supplyN(m.p[side].school, m.round)); }
export function aiDeck(s, rand = Math.random) { // 기본 덱에서 무작위로 1~3장 교체
  const deck = startDeck(s), pool = poolOf(s);
  for (let n = 1 + Math.floor(rand() * swapsOf(s)); n > 0; n--) { const i = Math.floor(rand() * deck.length), was = deck[i]; deck[i] = pool[Math.floor(rand() * pool.length)]; if (!validDeck(s, deck)) deck[i] = was; }
  return deck;
}
