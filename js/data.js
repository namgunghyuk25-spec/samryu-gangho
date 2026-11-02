// data.js — 삼류강호 콘텐츠: 문파 · 무공서 · 합격기 · 아이템/조합 · 단약 · 적 · 지역 · 기연

export const REALMS = ['삼류무사', '이류고수', '일류고수', '절정고수', '초절정고수', '화경'];
export const TIER_NAME = ['입문', '소성', '대성'];

export const SCHOOLS = {
  none:    { name: '무명', color: '#a8a8b0' },
  sorim:   { name: '소림', color: '#e0a030', s2: '받는 피해 -12%', s4: '매 턴 호신강기(최대체력 8%)' },
  mudang:  { name: '무당', color: '#70a8e8', s2: '반격 확률 +25%', s4: '반격 시 게이지 +30' },
  hwasan:  { name: '화산', color: '#f078a8', s2: '치명 +15%', s4: '모든 연격 타수 +1' },
  dang:    { name: '당문', color: '#58c060', s2: '독 피해 +50%', s4: '모든 공격에 중독 +1' },
  gaebang: { name: '개방', color: '#c88a48', s2: '기절 확률 +15%', s4: '강타(2배↑) 피해 +30%' },
  magyo:   { name: '마교', color: '#d02838', s2: '흡혈 10%', s4: '체력 50% 이하 공력 +40%' },
  // 비무로만 얻는 장문인 비전(문파 시너지 없음)
  emei: { name: '아미', color: '#c8a8e8' }, cheongseong: { name: '청성', color: '#60c890' }, jongnam: { name: '종남', color: '#8ca0d0' },
  gonryun: { name: '곤륜', color: '#a8e0ff' }, gongdong: { name: '공동', color: '#d0a868' }, bukhae: { name: '북해', color: '#a0e0ff' },
};

// 무공서. type: skill(초식) | heart(심법). rarity 1 일반 / 2 희귀
// fx 키: poison bleed stun seal haste shield counterStance qi atkDown defDown lifesteal buff{evaUp|critUp} sureCrit sealAll poisonBurst selfDmgPct reflect
export const BOOKS = {
  samjae:   { name: '삼재검법', school: 'none', type: 'skill', rarity: 0, cost: 6, target: 'one', mult: 1.5, vfx: 'slash', desc: '기본 검법. 무난한 일격.' },
  nahan:    { name: '나한권', school: 'sorim', type: 'skill', rarity: 1, cost: 10, target: 'one', mult: 2.0, fx: { defDown: 2 }, vfx: 'gold', desc: '강타 + 방어↓(2턴)' },
  geumgang: { name: '금강장', school: 'sorim', type: 'skill', rarity: 1, cost: 12, target: 'one', mult: 1.3, fx: { shield: 0.15 }, vfx: 'gold', desc: '장력 + 호신강기(체력 15%)' },
  saja:     { name: '사자후', school: 'sorim', type: 'skill', rarity: 1, cost: 18, target: 'all', mult: 0.9, fx: { stun: 0.35 }, vfx: 'roar', desc: '전체 공격 + 기절 35%' },
  yeokgeun: { name: '역근경', school: 'sorim', type: 'heart', rarity: 2, passive: { maxHpPct: 0.25, regen: 0.03 }, desc: '최대체력 +25%, 턴마다 3% 회복' },
  taeguk:   { name: '태극권', school: 'mudang', type: 'skill', rarity: 1, cost: 8, target: 'one', mult: 1.2, fx: { counterStance: true, qi: 8 }, vfx: 'taiji', desc: '반격태세 + 내력 회복' },
  yangui:   { name: '양의검', school: 'mudang', type: 'skill', rarity: 1, cost: 12, target: 'one', hits: 2, mult: 0.9, fx: { seal: 25 }, vfx: 'slashB', desc: '2연격 + 점혈(게이지 -25)' },
  jeun:     { name: '제운종', school: 'mudang', type: 'skill', rarity: 1, cost: 10, target: 'self', fx: { haste: 60, buff: { evaUp: 2 } }, vfx: 'wind', desc: '경공: 게이지 +60, 회피↑(2턴)' },
  taegukSim:{ name: '태극심법', school: 'mudang', type: 'heart', rarity: 2, passive: { qiRegenMul: 2, counter: 0.1 }, desc: '내력 회복 2배, 반격 +10%' },
  maehwa:   { name: '매화검법', school: 'hwasan', type: 'skill', rarity: 1, cost: 12, target: 'one', hits: 4, mult: 0.55, vfx: 'petal', desc: '4연격' },
  isipsa:   { name: '이십사수매화', school: 'hwasan', type: 'skill', rarity: 1, cost: 22, target: 'all', hits: 3, mult: 0.5, vfx: 'petal', desc: '전체 3연격' },
  amhyang:  { name: '암향표', school: 'hwasan', type: 'skill', rarity: 1, cost: 8, target: 'self', fx: { haste: 40, buff: { critUp: 2 } }, vfx: 'windP', desc: '경공: 게이지 +40, 치명↑(2턴)' },
  jaha:     { name: '자하신공', school: 'hwasan', type: 'heart', rarity: 2, passive: { critDmg: 0.5, crit: 5 }, desc: '치명 피해 +50%, 치명 +5%' },
  mancheon: { name: '만천화우', school: 'dang', type: 'skill', rarity: 1, cost: 18, target: 'all', hits: 2, mult: 0.45, fx: { poison: 2 }, vfx: 'darts', desc: '전체 암기 2연 + 중독 2' },
  dokjang:  { name: '독장', school: 'dang', type: 'skill', rarity: 1, cost: 10, target: 'one', mult: 1.1, fx: { poison: 3 }, vfx: 'poison', desc: '독 장력 + 중독 3' },
  bido:     { name: '비도술', school: 'dang', type: 'skill', rarity: 1, cost: 9, target: 'one', hits: 2, mult: 0.75, fx: { bleed: 2 }, vfx: 'darts', desc: '비도 2연 + 출혈 2' },
  mandok:   { name: '만독불침', school: 'dang', type: 'heart', rarity: 2, passive: { poisonImmune: 1, poisonDmg: 0.5 }, desc: '중독 면역, 독 피해 +50%' },
  hangryong:{ name: '항룡십팔장', school: 'gaebang', type: 'skill', rarity: 1, cost: 20, target: 'one', mult: 2.6, vfx: 'dragon', desc: '2.6배 강타' },
  tagu:     { name: '타구봉법', school: 'gaebang', type: 'skill', rarity: 1, cost: 12, target: 'one', mult: 1.1, fx: { seal: 35, stun: 0.4 }, vfx: 'staff', desc: '점혈(-35) + 기절 40%' },
  chwigwon: { name: '취권', school: 'gaebang', type: 'skill', rarity: 1, cost: 12, target: 'one', randomHits: [3, 5], mult: 0.5, vfx: 'palm', desc: '비틀비틀 3~5타' },
  chwipal:  { name: '취팔선', school: 'gaebang', type: 'heart', rarity: 2, passive: { drunkEva: 35 }, desc: '체력이 낮을수록 회피 최대 +35%' },
  hyeolma:  { name: '혈마검', school: 'magyo', type: 'skill', rarity: 2, cost: 14, target: 'one', mult: 1.8, fx: { lifesteal: 0.5 }, vfx: 'blood', desc: '흡혈 강타(피해 50% 회복)' },
  cheonma:  { name: '천마군림보', school: 'magyo', type: 'skill', rarity: 2, cost: 20, target: 'all', mult: 1.0, fx: { atkDown: 2 }, vfx: 'blood', desc: '전체 + 공력↓(2턴)' },
  hyeolyeong:{ name: '혈영신법', school: 'magyo', type: 'skill', rarity: 2, cost: 10, target: 'one', hits: 2, mult: 0.9, fx: { bleed: 2, haste: 30 }, vfx: 'blood', desc: '2연 + 출혈 2 + 게이지 +30' },
  cheonmaSin:{ name: '천마신공', school: 'magyo', type: 'heart', rarity: 2, passive: { atkPct: 0.2, lifesteal: 0.08 }, desc: '공력 +20%, 흡혈 8%' },
  // 장문인 비전 (rarity 3: 비무 승리 보상 전용)
  emeiBok:  { name: '아미복호검', school: 'emei', type: 'skill', rarity: 3, cost: 14, target: 'one', hits: 3, mult: 0.6, fx: { stun: 0.2 }, vfx: 'slashB', desc: '3연격 + 기절 20%' },
  songpung: { name: '송풍검법', school: 'cheongseong', type: 'skill', rarity: 3, cost: 10, target: 'one', hits: 2, mult: 0.8, fx: { bleed: 2, haste: 25 }, vfx: 'slash', desc: '2연 + 출혈 2 + 게이지 +25' },
  cheongang:{ name: '천강북두검', school: 'jongnam', type: 'skill', rarity: 3, cost: 16, target: 'one', mult: 2.3, fx: { defDown: 2 }, vfx: 'slashB', desc: '2.3배 강타 + 방어↓(2턴)' },
  unryong:  { name: '운룡대팔식', school: 'gonryun', type: 'skill', rarity: 3, cost: 12, target: 'one', hits: 2, mult: 0.75, fx: { haste: 45 }, vfx: 'slashB', desc: '2연격 + 게이지 +45' },
  changgung:{ name: '창궁무애검', school: 'none', type: 'skill', rarity: 3, cost: 10, target: 'one', hits: 3, mult: 0.6, fx: { haste: 15 }, vfx: 'slashB', desc: '남궁세가 가전 검법. 3연격 + 게이지 +15' },
  chilsang: { name: '칠상권', school: 'gongdong', type: 'skill', rarity: 3, cost: 12, target: 'one', mult: 1.7, fx: { bleed: 3, selfDmgPct: 0.05 }, vfx: 'palm', desc: '강타 + 출혈 3 (자신 체력 5% 소모)' },
};

// 합격기: 두 초식 동시 장착 + 둘 다 소성 이상
export const COMBOS = {
  taegukHye:   { name: '태극혜검', need: ['taeguk', 'yangui'], school: 'mudang', cost: 30, target: 'one', hits: 3, mult: 1.0, fx: { counterStance: true, sealAll: 40 }, vfx: 'taiji', desc: '3연격 + 반격태세 + 적 전원 점혈' },
  maehwaNan:   { name: '매화난무', need: ['maehwa', 'amhyang'], school: 'hwasan', cost: 32, target: 'all', hits: 6, mult: 0.42, fx: { sureCrit: 1 }, vfx: 'petal', desc: '전체 6연격, 치명 확정' },
  geumgangBu:  { name: '금강부동', need: ['nahan', 'geumgang'], school: 'sorim', cost: 25, target: 'self', fx: { shield: 0.4, buff: { reflect: 2 } }, vfx: 'gold', desc: '호신강기 40% + 피해 반사(2턴)' },
  mandokGwi:   { name: '만독귀종', need: ['mancheon', 'dokjang'], school: 'dang', cost: 28, target: 'all', mult: 0.6, fx: { poisonBurst: 1 }, vfx: 'poison', desc: '적 전원 독 폭발(중첩×6) 후 중첩 2배' },
  hangryongYu: { name: '항룡유회', need: ['hangryong', 'tagu'], school: 'gaebang', cost: 34, target: 'one', mult: 4.0, fx: { stun: 1 }, vfx: 'dragon', desc: '4배 강타 + 기절 확정' },
  cheonmaHae:  { name: '천마해체', need: ['hyeolma', 'cheonma'], school: 'magyo', cost: 30, target: 'all', mult: 3.0, fx: { selfDmgPct: 0.3, lifesteal: 0.3 }, vfx: 'blood', desc: '체력 30% 소모, 전체 3배 흡혈' },
};

// 성취 단계 반영한 실제 초식
export function skillOf(id, tier = 0) {
  const b = BOOKS[id] || COMBOS[id];
  const fx = { ...(b.fx || {}) };
  if (tier) {
    for (const k of ['poison', 'bleed']) if (fx[k]) fx[k] += tier;
    if (fx.stun && fx.stun < 1) fx.stun = Math.min(1, fx.stun + 0.1 * tier);
    for (const k of ['seal', 'haste', 'sealAll']) if (fx[k]) fx[k] += 10 * tier;
    if (fx.shield) fx.shield += 0.05 * tier;
  }
  return { id, ...b, fx, hits: b.hits || 1, mult: (b.mult || 0) * (1 + 0.25 * tier), tier };
}

// ───────────── 아이템: 재료 6 + 완성품 21 ─────────────
export const PARTS = {
  A: { name: '정강철', icon: 'sword', col: '#b8c4d8', stats: { atk: 4 }, desc: '공력 +4' },
  B: { name: '연갑', icon: 'armor', col: '#8a6a48', stats: { def: 4 }, desc: '방어 +4' },
  C: { name: '비연화', icon: 'boots', col: '#4a7ab8', stats: { spd: 3 }, desc: '속도 +3' },
  D: { name: '천년삼', icon: 'root', col: '#e8d098', stats: { maxHp: 20 }, desc: '최대체력 +20' },
  E: { name: '청옥패', icon: 'jade', col: '#58c0a0', stats: { maxQi: 12 }, desc: '최대내력 +12' },
  F: { name: '혈사', icon: 'spool', col: '#d03040', stats: { crit: 8 }, desc: '치명 +8%' },
};
// 완성품: key = 재료 두 글자(정렬). fx = 고유 효과
export const RECIPES = {
  AA: { name: '현철중검', icon: 'sword', col: '#606878', fx: { strongDmg: 0.3 }, desc: '강타(2배↑) 피해 +30%' },
  AB: { name: '파갑창', icon: 'sword', col: '#c0a060', fx: { pierce: 0.35 }, desc: '적 방어 35% 무시' },
  AC: { name: '유성추', icon: 'bomb', col: '#8090a8', fx: { basicHits: 1 }, desc: '기본 공격 2연타' },
  AD: { name: '반룡도', icon: 'sword', col: '#d0b040', fx: { lifesteal: 0.08 }, desc: '흡혈 8%' },
  AE: { name: '청강검', icon: 'sword', col: '#58c0d0', fx: { qiOnHit: 2 }, desc: '타격마다 내력 +2' },
  AF: { name: '혈인도', icon: 'sword', col: '#c02030', fx: { critBleed: 2 }, desc: '치명타 시 출혈 2' },
  BB: { name: '금사갑', icon: 'armor', col: '#e0b030', fx: { dmgReduce: 0.1 }, desc: '받는 피해 -10%' },
  BC: { name: '경신의', icon: 'armor', col: '#a0c8e8', fx: { eva: 10 }, desc: '회피 +10%' },
  BD: { name: '영기갑', icon: 'armor', col: '#70b060', fx: { regen: 0.04 }, desc: '턴마다 체력 4% 회복' },
  BE: { name: '태청포', icon: 'armor', col: '#f0f0f8', fx: { shieldStart: 0.2 }, desc: '전투 시작 호신강기 20%' },
  BF: { name: '가시갑', icon: 'armor', col: '#803040', fx: { thorns: 0.25 }, desc: '받은 피해 25% 반사' },
  CC: { name: '등평도수화', icon: 'boots', col: '#70d0f0', fx: { startGauge: 60 }, desc: '전투 시작 게이지 +60' },
  CD: { name: '신행부', icon: 'jade', col: '#e8d070', fx: { spdPct: 0.15 }, desc: '속도 +15%' },
  CE: { name: '풍뢰선', icon: 'orb', col: '#9080e0', fx: { sealOnHit: 8 }, desc: '타격마다 적 게이지 -8' },
  CF: { name: '그림자단검', icon: 'sword', col: '#404058', fx: { critFirst: 1 }, desc: '전투 첫 공격 치명 확정' },
  DD: { name: '대환단', icon: 'pill', col: '#f0c040', fx: { revive: 0.5 }, desc: '사망 시 1회 체력 50% 부활' },
  DE: { name: '소환단 호리병', icon: 'gourd', col: '#c87840', fx: { qiPerTurn: 4 }, desc: '턴마다 내력 +4' },
  DF: { name: '혈삼', icon: 'root', col: '#d04050', fx: { lowHpAtk: 0.3 }, desc: '체력 50% 이하 공력 +30%' },
  EE: { name: '태극옥', icon: 'jade', col: '#e8f0ff', fx: { counter: 0.2 }, desc: '반격 확률 +20%' },
  EF: { name: '마령주', icon: 'orb', col: '#a02060', fx: { skillDmg: 0.2 }, desc: '무공 피해 +20%' },
  FF: { name: '혈룡사', icon: 'spool', col: '#ff3050', fx: { critDmg: 0.5 }, desc: '치명 피해 +50%' },
};
export const recipeKey = (a, b) => [a, b].sort().join('');
export function itemInfo(id) { // id: 'A'..'F' 또는 'AB' 등
  if (id.length === 1) return { id, part: true, ...PARTS[id] };
  const r = RECIPES[id], [a, b] = id.split('');
  const stats = {};
  for (const p of [a, b]) for (const [k, v] of Object.entries(PARTS[p].stats)) stats[k] = (stats[k] || 0) + v;
  return { id, part: false, ...r, stats };
}
export const statText = st => Object.entries(st).map(([k, v]) => ({ atk: '공력', def: '방어', spd: '속도', maxHp: '체력', maxQi: '내력', crit: '치명%' }[k] + ' +' + v)).join(' ');

export const PILLS = {
  geumchang: { name: '금창약', icon: 'pill', col: '#e05050', price: 40, desc: '체력 35% 회복' },
  sohwan:    { name: '소환단', icon: 'pill', col: '#5080e0', price: 16, desc: '내력 +2' },
  haedok:    { name: '해독단', icon: 'pill', col: '#60c060', price: 12, desc: '과열·산공을 풀고 1장 뽑기' },
  byeokryeok:{ name: '벽력탄', icon: 'bomb', col: '#505060', price: 24, desc: '적 전체 피해 10 (지역마다 +6)' },
  daeryeok:  { name: '대력환', icon: 'gourd', col: '#e08030', price: 20, desc: '다음 공격 카드 피해 두 배' },
};

// ───────────── 적 ─────────────
// stats는 1지역 기준값 → 지역 배율 적용. skills: name, mult, hits, target(one/all/self), fx, vfx, w(가중치), charge(1턴 기모으기), cond
const H = (o) => ({ kind: 'human', ...o });
export const ENEMIES = {
  // 1. 하남
  sanjeok: { name: '산적', spr: H({ robe: '#8a6a40', pants: '#4a3a2a', hat: 'bandana', weapon: 'saber', beard: true }), hp: 30, atk: 7, def: 2, spd: 8, skills: [{ name: '칼질', mult: 1, w: 3, vfx: 'slash' }, { name: '난도질', mult: 0.6, hits: 2, w: 1, vfx: 'slash' }] },
  nangin: { name: '낭인', spr: H({ robe: '#6a6a7a', pants: '#3a3a48', hat: 'bamboo', weapon: 'sword' }), hp: 34, atk: 9, def: 3, spd: 11, skills: [{ name: '베기', mult: 1, w: 3, vfx: 'slash' }, { name: '발도술', mult: 1.6, w: 1, vfx: 'slash' }] },
  deulgae: { name: '도부수', spr: H({ robe: '#7a5a3a', pants: '#4a3a2a', hat: 'bandana', weapon: 'saber' }), hp: 22, atk: 6, def: 2, spd: 10, skills: [{ name: '도끼질', mult: 1, w: 3, vfx: 'slash' }, { name: '난도질', mult: 0.6, hits: 2, w: 1, vfx: 'slash' }] },
  sanjeokDu: { name: '산적 두목', elite: true, spr: H({ size: 40, robe: '#7a2a20', pants: '#3a2a20', hat: 'bald', weapon: 'axe', beard: true, build: 1.3 }), hp: 95, atk: 11, def: 4, spd: 9, skills: [{ name: '도끼질', mult: 1.2, w: 3, vfx: 'slash' }, { name: '대부일격', mult: 2.2, w: 1, vfx: 'slash' }, { name: '호통', target: 'self', fx: { buff: { atkUp: 2 } }, w: 1, vfx: 'roar' }] },
  heukpung: { name: '흑풍채주', boss: true, spr: H({ size: 48, robe: '#202028', trim: '#c03030', hat: 'topknot', weapon: 'axe', beard: true, cape: '#501818', build: 1.25 }), hp: 210, atk: 13, def: 5, spd: 9, skills: [{ name: '흑풍참', mult: 1.3, w: 3, vfx: 'slash' }, { name: '흑풍회오리', target: 'all', mult: 0.8, w: 2, vfx: 'wind' }, { name: '파산부', mult: 3.0, charge: true, w: 1, vfx: 'slash' }] },
  // 2. 장강
  sujeok: { name: '수적', spr: H({ robe: '#307080', pants: '#203040', hat: 'bandana', band: '#e0d040', weapon: 'saber' }), hp: 30, atk: 8, def: 2, spd: 10, skills: [{ name: '갈고리질', mult: 1, w: 3, vfx: 'slash' }, { name: '물귀신', mult: 0.7, fx: { bleed: 2 }, w: 1, vfx: 'slash' }] },
  sapa: { name: '사파 무인', spr: H({ robe: '#5a3a7a', pants: '#2a2038', hat: 'topknot', weapon: 'claw' }), hp: 32, atk: 9, def: 3, spd: 12, skills: [{ name: '음조', mult: 1, w: 3, vfx: 'claw' }, { name: '흑살수', mult: 0.5, hits: 3, w: 1, vfx: 'claw' }] },
  suri: { name: '수리검 자객', spr: H({ robe: '#283048', pants: '#181c28', hat: 'hood', mask: '#181c28', weapon: 'darts' }), hp: 24, atk: 8, def: 1, spd: 14, skills: [{ name: '수리검', mult: 0.45, hits: 3, w: 3, vfx: 'darts' }, { name: '연막', target: 'self', fx: { buff: { evaUp: 2 } }, w: 1, vfx: 'wind' }] },
  subu: { name: '수채 부채주', elite: true, spr: H({ size: 40, robe: '#205868', pants: '#182838', hat: 'bandana', band: '#e0d040', weapon: 'saber', beard: true, build: 1.2 }), hp: 90, atk: 11, def: 4, spd: 11, skills: [{ name: '쌍도난무', mult: 0.6, hits: 3, w: 3, vfx: 'slash' }, { name: '도강', mult: 1.8, fx: { bleed: 2 }, w: 1, vfx: 'slash' }] },
  jangang: { name: '장강수채 총채주', boss: true, spr: H({ size: 48, robe: '#1a4a6a', trim: '#e0d040', hat: 'bandana', band: '#e0d040', weapon: 'spear', beard: true, cape: '#103048', build: 1.2 }), hp: 175, atk: 12, def: 5, spd: 11, skills: [{ name: '장강일섬', mult: 0.8, hits: 2, fx: { bleed: 2 }, w: 3, vfx: 'slashB' }, { name: '탁류', target: 'all', mult: 0.7, fx: { seal: 30 }, w: 2, vfx: 'wave' }, { name: '수룡파', mult: 3.0, charge: true, w: 1, vfx: 'wave' }] },
  // 3. 사천
  dokin: { name: '독인', spr: H({ robe: '#2a4a2a', pants: '#1a2a1a', hat: 'hood', skin: '#a8c890', weapon: 'claw' }), hp: 34, atk: 8, def: 3, spd: 9, skills: [{ name: '독수', mult: 0.8, fx: { poison: 2 }, w: 3, vfx: 'poison' }, { name: '독무', target: 'all', mult: 0.3, fx: { poison: 1 }, w: 1, vfx: 'poison' }] },
  amgi: { name: '당가 암기수', spr: H({ robe: '#2a5a3a', pants: '#1a3020', hat: 'topknot', weapon: 'darts', mask: '#183020' }), hp: 26, atk: 9, def: 2, spd: 13, skills: [{ name: '비황석', mult: 0.5, hits: 2, w: 3, vfx: 'darts' }, { name: '독침', mult: 0.6, fx: { poison: 2 }, w: 2, vfx: 'darts' }] },
  dokpyo: { name: '독검수', spr: H({ robe: '#2a4a2a', pants: '#1a2a1a', hat: 'topknot', weapon: 'sword' }), hp: 28, atk: 9, def: 2, spd: 12, skills: [{ name: '독검', mult: 1, fx: { poison: 2 }, w: 3, vfx: 'slash' }, { name: '비독침', mult: 0.6, hits: 2, w: 1, vfx: 'darts' }] },
  dangDok: { name: '당가 독수', elite: true, spr: H({ size: 40, robe: '#1a4028', trim: '#80e060', pants: '#102018', hat: 'hood', mask: '#102018', weapon: 'darts' }), hp: 85, atk: 10, def: 3, spd: 13, skills: [{ name: '만천독우', target: 'all', mult: 0.4, hits: 2, fx: { poison: 1 }, w: 3, vfx: 'darts' }, { name: '단장독', mult: 1.2, fx: { poison: 4 }, w: 1, vfx: 'poison' }] },
  dangNo: { name: '독수 당노파', boss: true, spr: H({ size: 44, robe: '#3a2a4a', trim: '#80e060', hat: 'hood', band: '#4a3a5a', skin: '#d8c0a0', hair: '#d8d8d8', weapon: 'staff', longhair: true }), hp: 190, atk: 11, def: 4, spd: 10, skills: [{ name: '만독장', mult: 1.0, fx: { poison: 4 }, w: 3, vfx: 'poison' }, { name: '독무진', target: 'all', mult: 0.4, fx: { poison: 2, seal: 20 }, w: 2, vfx: 'poison' }, { name: '산혼독', target: 'all', mult: 1.5, fx: { poison: 4 }, charge: true, w: 1, vfx: 'poison' }] },
  // 4. 혈교
  hyeolgyo: { name: '혈교도', spr: H({ robe: '#6a1820', pants: '#2a0a10', hat: 'hood', band: '#3a0810', weapon: 'sword' }), hp: 32, atk: 9, def: 3, spd: 11, skills: [{ name: '혈검', mult: 1, fx: { lifesteal: 0.3 }, w: 3, vfx: 'blood' }, { name: '혈참', mult: 0.6, fx: { bleed: 2 }, w: 1, vfx: 'blood' }] },
  gangsi: { name: '혈검수', spr: H({ robe: '#7a1a20', pants: '#2a0a10', hat: 'topknot', weapon: 'saber' }), hp: 44, atk: 9, def: 4, spd: 9, skills: [{ name: '혈검', mult: 1.1, w: 3, vfx: 'blood' }, { name: '혈인참', mult: 0.8, fx: { bleed: 2 }, w: 1, vfx: 'blood' }] },
  hyeollang: { name: '쌍도객', spr: H({ robe: '#6a1a24', pants: '#2a0a10', hat: 'topknot', longhair: true, weapon: 'saber' }), hp: 26, atk: 9, def: 2, spd: 13, skills: [{ name: '쌍도난무', mult: 0.5, hits: 3, w: 3, vfx: 'slash' }, { name: '혈아도', mult: 0.9, fx: { bleed: 1 }, w: 1, vfx: 'blood' }] },
  hyeolHobeop: { name: '혈교 호법', elite: true, spr: H({ size: 40, robe: '#801828', trim: '#200808', hat: 'topknot', weapon: 'saber', beard: true, cape: '#300810' }), hp: 95, atk: 11, def: 4, spd: 12, skills: [{ name: '혈풍참', mult: 1.2, fx: { lifesteal: 0.4 }, w: 3, vfx: 'blood' }, { name: '혈우', target: 'all', mult: 0.6, fx: { bleed: 2 }, w: 1, vfx: 'blood' }] },
  hyeolJang: { name: '혈교 장로', boss: true, spr: H({ size: 48, robe: '#901020', trim: '#f0d0d0', hat: 'topknot', hair: '#f0f0f0', beard: true, beardColor: '#f0f0f0', longhair: true, weapon: 'fan', cape: '#401018' }), hp: 250, atk: 14, def: 5, spd: 11, skills: [{ name: '혈수인', mult: 1.3, fx: { lifesteal: 0.6 }, w: 3, vfx: 'blood' }, { name: '혈해', target: 'all', mult: 0.8, fx: { bleed: 2 }, w: 2, vfx: 'blood' }, { name: '흡성대법', mult: 2.6, fx: { lifesteal: 1 }, charge: true, w: 1, vfx: 'blood' }] },
  // 5. 천산
  magyodo: { name: '마교 교도', spr: H({ robe: '#1a1018', trim: '#c02030', hat: 'topknot', band: '#c02030', weapon: 'saber' }), hp: 34, atk: 10, def: 3, spd: 11, skills: [{ name: '마도', mult: 1.1, w: 3, vfx: 'slash' }, { name: '마기참', mult: 0.6, hits: 2, fx: { bleed: 1 }, w: 1, vfx: 'blood' }] },
  hyeolmaSa: { name: '혈마 무사', spr: H({ robe: '#3a0a12', trim: '#c02030', hat: 'hood', band: '#1a0408', mask: '#c02030', weapon: 'sword' }), hp: 30, atk: 11, def: 3, spd: 13, skills: [{ name: '혈마검', mult: 1, fx: { lifesteal: 0.4 }, w: 3, vfx: 'blood' }, { name: '분광', mult: 0.5, hits: 3, w: 1, vfx: 'slash' }] },
  seollang: { name: '빙장수', spr: H({ robe: '#d8e0f0', trim: '#80a0d0', pants: '#a0b0c8', hat: 'topknot', weapon: 'none' }), hp: 28, atk: 10, def: 2, spd: 11, skills: [{ name: '빙백장', mult: 1, fx: { seal: 15 }, w: 3, vfx: 'palm' }, { name: '한빙기', target: 'all', mult: 0.5, w: 1, vfx: 'wind' }] },
  hobeop: { name: '천마신교 호법', elite: true, spr: H({ size: 40, robe: '#2a0a20', trim: '#e0c040', hat: 'crown', band: '#c0c0c0', weapon: 'spear', cape: '#600818' }), hp: 100, atk: 12, def: 5, spd: 12, skills: [{ name: '천마창', mult: 1.3, w: 3, vfx: 'slash' }, { name: '마령파', target: 'all', mult: 0.7, fx: { atkDown: 2 }, w: 1, vfx: 'blood' }] },
  cheonmaBoss: { name: '천마(마교주)', boss: true, final: true, spr: H({ size: 56, robe: '#18101a', trim: '#e0c040', pants: '#100810', hat: 'crown', hair: '#0a0608', longhair: true, weapon: 'sword', cape: '#a01020', build: 1.15 }), hp: 190, atk: 11, def: 6, spd: 12,
    skills: [{ name: '천마검', mult: 1.4, w: 3, vfx: 'blood' }, { name: '혈영파', target: 'all', mult: 0.7, fx: { bleed: 3 }, w: 2, vfx: 'blood' }, { name: '천마군림', mult: 3.6, charge: true, w: 1, vfx: 'blood', cutin: true }] },
  bunsin: { name: '혈마 분신', spr: H({ robe: '#a01828', trim: '#ff6070', pants: '#600810', hat: 'crown', hair: '#400008', skin: '#e08080', weapon: 'sword', longhair: true }), hp: 30, atk: 9, def: 2, spd: 13, skills: [{ name: '혈영검', mult: 1, fx: { bleed: 1 }, w: 1, vfx: 'blood' }] },

  // ── 구파일방 장문인 (비무: 져도 죽지 않는다) ──
  m_sorim: { name: '현오대사', title: '少林 方丈', master: 'sorim', boss: true, duel: true, quote: '아미타불… 시주의 무공, 노납이 받아 보겠소.', spr: H({ size: 48, robe: '#e0a030', trim: '#a02020', hat: 'bald', weapon: 'staff', beard: true, beardColor: '#f0f0f0', build: 1.2 }), hp: 162, atk: 11, def: 8, spd: 9,
    skills: [{ name: '금강장', mult: 1.3, w: 3, vfx: 'gold' }, { name: '사자후', target: 'all', mult: 0.8, fx: { stun: 0.3 }, w: 2, vfx: 'roar' }, { name: '달마역근', target: 'self', fx: { shield: 0.2, buff: { atkUp: 2 } }, w: 1, vfx: 'gold' }, { name: '여래신장', mult: 3.2, charge: true, w: 1, vfx: 'gold', cutin: true }] },
  m_gaebang: { name: '황보삼', title: '丐幇 幇主', master: 'gaebang', boss: true, duel: true, quote: '끄윽… 술값 내기 비무 어떤가, 젊은이?', spr: H({ size: 48, robe: '#7a6a40', trim: '#4a7a3a', hat: 'bandana', weapon: 'staff', beard: true }), hp: 153, atk: 12, def: 5, spd: 11,
    skills: [{ name: '타구봉법', mult: 1.0, fx: { seal: 35, stun: 0.3 }, w: 3, vfx: 'staff' }, { name: '취권', randomHits: [3, 5], mult: 0.45, w: 2, vfx: 'palm' }, { name: '항룡십팔장', mult: 2.2, w: 1, vfx: 'dragon' }, { name: '항룡유회', mult: 3.4, charge: true, w: 1, vfx: 'dragon', cutin: true }] },
  m_mudang: { name: '청허진인', title: '武當 掌門', master: 'mudang', boss: true, duel: true, quote: '부드러움이 강함을 이기는 법. 와 보거라.', spr: H({ size: 48, robe: '#e8f0f8', trim: '#3060a0', hat: 'official', weapon: 'sword', beard: true, beardColor: '#e0e0e0' }), hp: 140, atk: 11, def: 6, spd: 12,
    skills: [{ name: '태극검', hits: 2, mult: 0.8, fx: { seal: 20 }, w: 3, vfx: 'taiji' }, { name: '양의검진', target: 'self', fx: { counterStance: true, buff: { evaUp: 2 } }, w: 1, vfx: 'taiji' }, { name: '면장', mult: 1.2, fx: { atkDown: 2 }, w: 2, vfx: 'palm' }, { name: '태극혜검', hits: 3, mult: 1.1, charge: true, w: 1, vfx: 'taiji', cutin: true }] },
  m_emei: { name: '정혜사태', title: '峨嵋 掌門', master: 'emei', boss: true, duel: true, quote: '아미의 검은 사정을 두지 않는다.', spr: H({ size: 48, robe: '#c8c8d0', trim: '#5a5a68', hat: 'hood', weapon: 'sword' }), hp: 149, atk: 12, def: 5, spd: 12,
    skills: [{ name: '아미검법', hits: 3, mult: 0.5, w: 3, vfx: 'slashB' }, { name: '복호장', mult: 1.1, fx: { stun: 0.3 }, w: 2, vfx: 'palm' }, { name: '정심주', target: 'self', fx: { heal: 0.15 }, w: 1, vfx: 'gold' }, { name: '금정불광', mult: 3.0, charge: true, w: 1, vfx: 'gold', cutin: true }] },
  m_cheongseong: { name: '송학자', title: '靑城 掌門', master: 'cheongseong', boss: true, duel: true, quote: '청성의 바람이 그대를 시험하리라.', spr: H({ size: 48, robe: '#2a6a40', trim: '#e8e8d0', hat: 'topknot', weapon: 'sword', beard: true }), hp: 140, atk: 12, def: 5, spd: 14,
    skills: [{ name: '송풍검법', hits: 2, mult: 0.75, fx: { bleed: 1 }, w: 3, vfx: 'slash' }, { name: '청성비검', hits: 3, mult: 0.4, w: 2, vfx: 'darts' }, { name: '송학보', target: 'self', fx: { haste: 40, buff: { evaUp: 2 } }, w: 1, vfx: 'wind' }, { name: '학명구천', mult: 3.0, charge: true, w: 1, vfx: 'slashB', cutin: true }] },
  m_hwasan: { name: '운학', title: '華山 掌門', master: 'hwasan', boss: true, duel: true, quote: '매화는 추위 속에서 피는 법. 검을 뽑아라.', spr: H({ size: 48, robe: '#f0f0f0', trim: '#d04070', hat: 'topknot', weapon: 'sword' }), hp: 149, atk: 13, def: 5, spd: 12,
    skills: [{ name: '매화검법', hits: 4, mult: 0.42, w: 3, vfx: 'petal' }, { name: '암향표', target: 'self', fx: { haste: 40, buff: { critUp: 2 } }, w: 1, vfx: 'windP' }, { name: '낙화유수', target: 'all', mult: 0.9, fx: { bleed: 2 }, w: 2, vfx: 'petal' }, { name: '매화만개', hits: 6, mult: 0.6, charge: true, w: 1, vfx: 'petal', cutin: true }] },
  m_jongnam: { name: '목진', title: '終南 掌門', master: 'jongnam', boss: true, duel: true, quote: '종남의 검은 무겁다. 버틸 수 있겠나.', spr: H({ size: 48, robe: '#3a4a68', trim: '#c0c8d8', hat: 'official', weapon: 'saber', beard: true }), hp: 170, atk: 12, def: 8, spd: 10,
    skills: [{ name: '천강검', mult: 1.5, fx: { defDown: 2 }, w: 3, vfx: 'slashB' }, { name: '종남검진', target: 'self', fx: { shield: 0.2 }, w: 1, vfx: 'gold' }, { name: '북두참', mult: 1.0, fx: { seal: 30 }, w: 2, vfx: 'slash' }, { name: '천강북두', mult: 3.4, charge: true, w: 1, vfx: 'slashB', cutin: true }] },
  bk_wisa: { name: '빙궁 위사', spr: H({ robe: '#d8e4f4', trim: '#80b0e0', pants: '#a0b0c8', hat: 'topknot', weapon: 'spear' }), hp: 34, atk: 10, def: 3, spd: 10, skills: [{ name: '빙창', mult: 1.1, w: 3, vfx: 'slash' }, { name: '한빙창진', mult: 0.6, hits: 2, w: 1, vfx: 'slash' }] },
  bk_gung: { name: '한빙 궁녀', spr: H({ robe: '#e8f0fa', trim: '#90c0e8', pants: '#b0c0d8', hat: 'topknot', weapon: 'none' }), hp: 24, atk: 11, def: 2, spd: 13, skills: [{ name: '한빙장', mult: 1, w: 3, vfx: 'palm' }, { name: '빙무', mult: 0.5, hits: 2, w: 1, vfx: 'wind' }] },
  bk_hobeop: { name: '빙궁 호법', elite: true, spr: H({ size: 40, robe: '#c8d8ec', trim: '#6090c8', hat: 'topknot', hair: '#e8e8f0', beard: true, weapon: 'spear', cape: '#e8f0fa' }), hp: 100, atk: 12, def: 5, spd: 10, skills: [{ name: '빙월도', mult: 1.3, w: 3, vfx: 'slash' }, { name: '한천벽', mult: 0.7, hits: 2, w: 1, vfx: 'wind' }] },
  m_bukhae: { name: '설무향', title: '北海氷宮 宮主', master: 'bukhae', boss: true, duel: true, quote: '북해의 얼음은 만 년을 기다렸다. 그대 하나쯤 더 기다릴 수 있지.', spr: H({ size: 48, robe: '#e8f0fa', trim: '#4070b0', hat: 'crown', hair: '#f0f0ff', longhair: true, weapon: 'none', cape: '#f0f4ff' }), hp: 150, atk: 13, def: 5, spd: 13,
    skills: [{ name: '한빙신장', mult: 1.2, w: 3, vfx: 'palm' }, { name: '빙백탄지', hits: 2, mult: 0.8, w: 2, vfx: 'darts' }, { name: '빙심결', target: 'self', fx: { buff: { evaUp: 2 } }, w: 1, vfx: 'wind' }, { name: '북명빙천장', mult: 3.0, charge: true, w: 1, vfx: 'wave', cutin: true }] },
  m_gonryun: { name: '백결', title: '崑崙 掌門', master: 'gonryun', boss: true, duel: true, quote: '곤륜의 구름은 잡히지 않는다.', spr: H({ size: 48, robe: '#e8f0ff', trim: '#70a8e0', hat: 'topknot', hair: '#e8e8f0', longhair: true, weapon: 'sword' }), hp: 144, atk: 12, def: 5, spd: 15,
    skills: [{ name: '운룡대팔식', hits: 2, mult: 0.8, fx: { haste: 25 }, w: 3, vfx: 'slashB' }, { name: '곤륜검', mult: 1.1, fx: { seal: 30 }, w: 2, vfx: 'slash' }, { name: '운중보', target: 'self', fx: { buff: { evaUp: 2 } }, w: 1, vfx: 'wind' }, { name: '운룡승천', mult: 3.0, charge: true, w: 1, vfx: 'wind', cutin: true }] },
  m_gongdong: { name: '마도원', title: '崆峒 掌門', master: 'gongdong', boss: true, duel: true, quote: '칠상권 일곱 대, 다 받아 내면 인정하지.', spr: H({ size: 48, robe: '#8a6a3a', trim: '#3a2a1a', hat: 'topknot', hair: '#909090', weapon: 'none', beard: true, beardColor: '#909090', build: 1.35 }), hp: 174, atk: 13, def: 6, spd: 9,
    skills: [{ name: '칠상권', mult: 1.5, fx: { bleed: 2 }, w: 3, vfx: 'palm' }, { name: '공동권', mult: 1.0, fx: { stun: 0.25 }, w: 2, vfx: 'palm' }, { name: '기공폭발', target: 'self', fx: { buff: { atkUp: 2 } }, w: 1, vfx: 'roar' }, { name: '칠상연환', hits: 7, mult: 0.5, charge: true, w: 1, vfx: 'palm', cutin: true }] },

  // ── 용봉지회 후기지수 (비무 규칙: 져도 죽지 않는다) ──
  y_namgung: { name: '남궁현', title: '南宮世家 少家主', boss: true, duel: true, quote: '남궁의 검은 하늘을 가른다. 각오는 됐나?', spr: H({ size: 40, robe: '#a8d0f0', trim: '#f0f0ff', hat: 'crown', weapon: 'sword' }), hp: 115, atk: 11, def: 5, spd: 12,
    skills: [{ name: '창궁무애검', hits: 3, mult: 0.55, w: 3, vfx: 'slashB' }, { name: '제왕검형', mult: 1.5, fx: { defDown: 2 }, w: 2, vfx: 'slashB' }, { name: '창궁보', target: 'self', fx: { haste: 40 }, w: 1, vfx: 'wind' }, { name: '창궁대연검', mult: 2.8, charge: true, w: 1, vfx: 'slashB', cutin: true }] },
  y_maehwa: { name: '연소하', title: '華山 梅花劍俠', boss: true, duel: true, quote: '매화검수의 검, 한 수 청하겠어요!', spr: H({ size: 40, robe: '#f8f0f0', trim: '#e05080', hat: 'topknot', longhair: true, weapon: 'sword' }), hp: 100, atk: 12, def: 4, spd: 13,
    skills: [{ name: '매화검법', hits: 4, mult: 0.4, w: 3, vfx: 'petal' }, { name: '암향표', target: 'self', fx: { haste: 40, buff: { critUp: 2 } }, w: 1, vfx: 'windP' }, { name: '매화낙영', hits: 5, mult: 0.55, charge: true, w: 1, vfx: 'petal', cutin: true }] },
  y_jegal: { name: '제갈운', title: '諸葛世家 神算', boss: true, duel: true, quote: '이미 세 수 앞을 읽었소. 판은 내 것이오.', spr: H({ size: 40, robe: '#f0f0f8', trim: '#9080c0', hat: 'bandana', weapon: 'fan' }), hp: 105, atk: 10, def: 5, spd: 12,
    skills: [{ name: '팔괘진', mult: 0.8, fx: { seal: 40 }, w: 3, vfx: 'taiji' }, { name: '우선풍', mult: 1.2, fx: { atkDown: 2 }, w: 2, vfx: 'wind' }, { name: '기문둔갑', target: 'self', fx: { shield: 0.15, buff: { evaUp: 2 } }, w: 1, vfx: 'taiji' }, { name: '제갈신산', mult: 2.6, fx: { stun: 0.5 }, charge: true, w: 1, vfx: 'taiji', cutin: true }] },
  y_dang: { name: '당소소', title: '四川唐家 毒鳳', boss: true, duel: true, quote: '후훗, 독침은 아프지 않게 놔 드릴게요.', spr: H({ size: 40, robe: '#2a5030', trim: '#e0c040', hat: 'hood', weapon: 'darts' }), hp: 95, atk: 11, def: 4, spd: 14,
    skills: [{ name: '만천화우', hits: 3, mult: 0.4, fx: { poison: 1 }, w: 3, vfx: 'darts' }, { name: '독봉침', mult: 1.0, fx: { poison: 3 }, w: 2, vfx: 'poison' }, { name: '폭우이화침', hits: 6, mult: 0.42, fx: { poison: 2 }, charge: true, w: 1, vfx: 'darts', cutin: true }] },

  // ── 마교 루트: 정파 무사 · 신교 보스 · 서열전 · 무림맹주 ──
  gaebangdo: { name: '개방 방도', spr: H({ robe: '#806040', hat: 'topknot', weapon: 'staff' }), hp: 22, atk: 7, def: 2, spd: 11, skills: [{ name: '타구', mult: 1, w: 3, vfx: 'staff' }, { name: '동냥 발길', mult: 0.7, w: 1, vfx: 'palm' }] },
  somu: { name: '소림 무승', spr: H({ robe: '#d08030', hat: 'bald', weapon: 'staff' }), hp: 34, atk: 9, def: 4, spd: 9, skills: [{ name: '봉술', mult: 1, w: 3, vfx: 'staff' }, { name: '나한권', mult: 1.4, w: 1, vfx: 'gold' }] },
  dosa: { name: '무당 도사', spr: H({ robe: '#a8b8d0', hat: 'official', weapon: 'sword' }), hp: 30, atk: 9, def: 3, spd: 11, skills: [{ name: '태극검', hits: 2, mult: 0.6, fx: { seal: 15 }, w: 3, vfx: 'taiji' }, { name: '면장', mult: 1.1, fx: { atkDown: 2 }, w: 1, vfx: 'palm' }] },
  geomsu: { name: '화산 검수', spr: H({ robe: '#f0f0f0', trim: '#e05080', hat: 'topknot', weapon: 'sword' }), hp: 28, atk: 10, def: 3, spd: 12, skills: [{ name: '매화검', hits: 3, mult: 0.42, w: 3, vfx: 'petal' }, { name: '암향', target: 'self', fx: { haste: 30 }, w: 1, vfx: 'windP' }] },
  m_oedang: { name: '마도철', title: '天魔神敎 外堂主', boss: true, quote: '말단 주제에 외당을 넘보느냐!', spr: H({ size: 48, robe: '#301018', trim: '#c02030', hat: 'bald', weapon: 'saber', cape: '#200810', build: 1.25 }), hp: 210, atk: 13, def: 5, spd: 9,
    skills: [{ name: '혈도참', mult: 1.3, fx: { bleed: 2 }, w: 3, vfx: 'blood' }, { name: '마도난무', hits: 3, mult: 0.5, w: 2, vfx: 'slash' }, { name: '광혈', target: 'self', fx: { buff: { atkUp: 2 } }, w: 1, vfx: 'roar' }, { name: '외당혈참', mult: 3.0, charge: true, w: 1, vfx: 'blood', cutin: true }] },
  sadae: { name: '혁련무극', title: '天魔神敎 四大護法', boss: true, rank: 4, quote: '말단 출신이 소교주라니, 교의 수치다!', spr: H({ size: 48, robe: '#281830', trim: '#e0c040', hat: 'crown', hair: '#d0d0e0', longhair: true, weapon: 'spear' }), hp: 220, atk: 13, def: 6, spd: 12,
    skills: [{ name: '천마창', mult: 1.3, w: 3, vfx: 'slash' }, { name: '사령진', target: 'all', mult: 0.7, fx: { seal: 30 }, w: 2, vfx: 'blood' }, { name: '마령파', mult: 1.0, fx: { atkDown: 2 }, w: 1, vfx: 'blood' }, { name: '사대천마극', mult: 3.2, charge: true, w: 1, vfx: 'blood', cutin: true }] },
  maengju: { name: '백리청운', title: '武林盟主', boss: true, final: true, quote: '마도의 싹은 여기서 자른다. 천하를 위하여!', spr: H({ size: 56, robe: '#f4f0e0', trim: '#e0c040', hat: 'crown', weapon: 'sword', beard: true, cape: '#3050a0' }), hp: 225, atk: 12, def: 6, spd: 12,
    phase2: { name: '천하무림 총궐기', summon: ['somu', 'geomsu'], banner: '구파일방 고수들이 맹주를 돕는다!' },
    skills: [{ name: '정천검', mult: 1.4, w: 3, vfx: 'gold' }, { name: '만검귀종', target: 'all', mult: 0.7, fx: { defDown: 2 }, w: 2, vfx: 'slashB' }, { name: '정기호신', target: 'self', fx: { shield: 0.15 }, w: 1, vfx: 'gold' }, { name: '천하제일검', mult: 3.6, charge: true, w: 1, vfx: 'gold', cutin: true }] },
  // 서열전(位): 져도 죽지 않는다 · 이기면 직위 상승(rank) + 마교 책
  rk_1: { name: '사도광', title: '外堂 序列 一位', boss: true, duel: true, rank: 1, master: 'magyo', quote: '외당 일위 자리는 피로 지키는 거다.', spr: H({ robe: '#3a0a12', mask: '#c02030', hat: 'hood', weapon: 'sword' }), hp: 115, atk: 10, def: 4, spd: 13,
    skills: [{ name: '혈영검', hits: 2, mult: 0.7, fx: { bleed: 1 }, w: 3, vfx: 'blood' }, { name: '분광', hits: 3, mult: 0.45, w: 2, vfx: 'slash' }, { name: '혈영섬', mult: 2.6, charge: true, w: 1, vfx: 'blood', cutin: true }] },
  rk_2: { name: '독고혁', title: '內堂 血狼隊主', boss: true, duel: true, rank: 2, master: 'magyo', quote: '혈랑대는 약한 놈을 물어뜯는다.', spr: H({ size: 40, robe: '#801828', hat: 'topknot', weapon: 'saber', beard: true, cape: '#300810' }), hp: 130, atk: 11, def: 5, spd: 12,
    skills: [{ name: '혈풍참', mult: 1.3, fx: { lifesteal: 0.3 }, w: 3, vfx: 'blood' }, { name: '혈우', target: 'all', mult: 0.6, fx: { bleed: 2 }, w: 2, vfx: 'blood' }, { name: '혈랑아', mult: 2.8, charge: true, w: 1, vfx: 'blood', cutin: true }] },
  rk_3: { name: '혁련소', title: '血魔堂 左護法', boss: true, duel: true, rank: 3, master: 'magyo', quote: '호법의 창은 한 번 뻗으면 돌아오지 않는다.', spr: H({ size: 40, robe: '#2a0a20', trim: '#e0c040', hat: 'crown', weapon: 'spear', cape: '#600818' }), hp: 140, atk: 12, def: 5, spd: 12,
    skills: [{ name: '천마창', mult: 1.3, w: 3, vfx: 'slash' }, { name: '마령파', target: 'all', mult: 0.7, fx: { atkDown: 2 }, w: 2, vfx: 'blood' }, { name: '마창관일', mult: 3.0, charge: true, w: 1, vfx: 'slash', cutin: true }] },
  rk_4: { name: '천마', title: '天魔神敎 敎主', boss: true, duel: true, rank: 5, master: 'magyo', quote: '본좌의 검을 받아 내면, 너를 소교주라 부르마.', spr: H({ size: 56, robe: '#18101a', trim: '#e0c040', hat: 'crown', longhair: true, weapon: 'sword', cape: '#a01020' }), hp: 170, atk: 12, def: 6, spd: 12,
    skills: [{ name: '천마검', mult: 1.4, w: 3, vfx: 'blood' }, { name: '혈영파', target: 'all', mult: 0.7, fx: { bleed: 3 }, w: 2, vfx: 'blood' }, { name: '천마군림', mult: 3.2, charge: true, w: 1, vfx: 'blood', cutin: true }] },

  // ── 소챕터 두목(지역 가운데 將) ──
  mb_gwiyeong: { name: '조천', title: '鬼影刀', boss: true, mid: true, quote: '내 칼에 그림자가 비치면, 이미 늦은 거다.', spr: H({ size: 44, robe: '#808090', hat: 'bamboo', weapon: 'sword', longhair: true }), hp: 150, atk: 11, def: 4, spd: 12,
    skills: [{ name: '귀영참', mult: 1.3, w: 3, vfx: 'slashB' }, { name: '혼령베기', hits: 2, mult: 0.75, fx: { bleed: 1 }, w: 2, vfx: 'slash' }, { name: '귀화', target: 'self', fx: { buff: { evaUp: 2 } }, w: 1, vfx: 'wind' }, { name: '귀영일섬', mult: 2.8, charge: true, w: 1, vfx: 'slashB', cutin: true }] },
  mb_heukryong: { name: '마흑룡', title: '黑龍幇主', boss: true, mid: true, quote: '장강의 물길은 흑룡방이 쥐고 있다.', spr: H({ size: 44, robe: '#202028', trim: '#e0c040', hat: 'bald', weapon: 'staff', build: 1.3 }), hp: 160, atk: 11, def: 5, spd: 10,
    skills: [{ name: '흑룡편', mult: 1.1, fx: { seal: 20 }, w: 3, vfx: 'staff' }, { name: '용조쇄', hits: 3, mult: 0.45, w: 2, vfx: 'staff' }, { name: '흑룡출수', mult: 2.8, charge: true, w: 1, vfx: 'staff', cutin: true }] },
  mb_odok: { name: '남소요', title: '五毒門主', boss: true, mid: true, quote: '오독의 맛, 하나씩 천천히 보여 주지.', spr: H({ size: 44, robe: '#4a2a5a', trim: '#c0c0d0', hat: 'crown', longhair: true, weapon: 'claw' }), hp: 145, atk: 10, def: 4, spd: 11,
    skills: [{ name: '오독장', mult: 1.0, fx: { poison: 3 }, w: 3, vfx: 'poison' }, { name: '사갈독무', target: 'all', mult: 0.4, fx: { poison: 2 }, w: 2, vfx: 'poison' }, { name: '독사출동', hits: 2, mult: 0.6, fx: { poison: 1 }, w: 1, vfx: 'bite' }, { name: '오독귀원', mult: 2.4, fx: { poison: 4 }, charge: true, w: 1, vfx: 'poison', cutin: true }] },
  mb_gangsiwang: { name: '귀검', title: '血敎 長老 鬼劍', boss: true, mid: true, quote: '방울이 울리면 네 혼은 이미 내 것이다.', spr: H({ size: 48, robe: '#5a4a6a', trim: '#c02030', hat: 'topknot', hair: '#e8e8e8', beard: true, weapon: 'sword', build: 1.2 }), hp: 190, atk: 11, def: 6, spd: 8,
    skills: [{ name: '귀검참', mult: 1.2, w: 3, vfx: 'slash' }, { name: '귀화', mult: 0.9, fx: { poison: 3 }, w: 2, vfx: 'poison' }, { name: '혼령진', target: 'all', mult: 0.6, w: 1, vfx: 'palm' }, { name: '귀검강림', mult: 3.0, charge: true, w: 1, vfx: 'slashB', cutin: true }] },
  mb_seolma: { name: '빙설화', title: '天山 雪魔女', boss: true, mid: true, quote: '천산의 눈은 피를 얼려 꽃으로 만든다.', spr: H({ size: 44, robe: '#202838', trim: '#a0d0ff', hat: 'topknot', hair: '#f0f0ff', longhair: true, weapon: 'fan' }), hp: 150, atk: 11, def: 4, spd: 12,
    skills: [{ name: '빙백장', mult: 1.1, fx: { seal: 25 }, w: 3, vfx: 'wind' }, { name: '설풍', target: 'all', mult: 0.6, fx: { seal: 15 }, w: 2, vfx: 'wind' }, { name: '빙결', target: 'self', fx: { shield: 0.15 }, w: 1, vfx: 'gold' }, { name: '천산빙하', mult: 2.8, fx: { stun: 0.5 }, charge: true, w: 1, vfx: 'wind', cutin: true }] },
};
// 생성 원화(assets/<id>.png). 없으면 위 spr로 코드 도트를 찍는다
const ART = {
  sanjeok: 'n_sanjeok', nangin: 'n_nangin', deulgae: 'n_dobu', sanjeokDu: 'e_sanjeokdu', heukpung: 'b_heukpung',
  sujeok: 'n_sujeok', sapa: 'n_sapa', suri: 'n_suri', subu: 'e_subu', jangang: 'b_jangang',
  dokin: 'n_dokin', amgi: 'n_amgi', dokpyo: 'n_dokgeom', dangDok: 'e_dangdok', dangNo: 'b_dangno',
  hyeolgyo: 'n_hyeolgyo', gangsi: 'n_hyeolgeom', hyeollang: 'n_ssangdo', hyeolHobeop: 'e_hyeolhobeop', hyeolJang: 'b_hyeoljang',
  magyodo: 'n_magyodo', hyeolmaSa: 'n_hyeolmasa', seollang: 'n_bingjang', hobeop: 'e_hobeop', cheonmaBoss: 'b_cheonma', bunsin: 'bunsin',
  bk_wisa: 'n_bkwisa', bk_gung: 'n_bkgung', bk_hobeop: 'e_bkhobeop', m_bukhae: 'b_bukhae',
  m_sorim: 'b_sorim', m_gaebang: 'b_gaebang', m_mudang: 'b_mudang', m_emei: 'b_emei', m_cheongseong: 'b_cheongseong', m_hwasan: 'b_hwasan', m_jongnam: 'b_jongnam', m_gonryun: 'b_gonryun', m_gongdong: 'b_gongdong',
  y_namgung: 'y_namgung', y_maehwa: 'y_maehwa', y_jegal: 'y_jegal', y_dang: 'y_dang',
  gaebangdo: 'n_gaebangdo', somu: 'n_somu', dosa: 'n_dosa', geomsu: 'n_geomsu', m_oedang: 'b_oedang', sadae: 'b_sadae', maengju: 'b_maengju',
  rk_1: 'n_hyeolmasa', rk_2: 'e_hyeolhobeop', rk_3: 'e_hobeop', rk_4: 'b_cheonma',
  mb_gwiyeong: 'mb_gwiyeong', mb_heukryong: 'mb_heukryong', mb_odok: 'mb_odok', mb_gangsiwang: 'b_gwigeom', mb_seolma: 'mb_seolma',
};
for (const k in ART) ENEMIES[k].img = ART[k];
Object.assign(ENEMIES.heukpung, { title: '黑風寨主', quote: '여기서부터는 흑풍채의 땅이다!' });
Object.assign(ENEMIES.jangang, { title: '長江水寨 總寨主', quote: '장강의 고기밥으로 만들어 주마.' });
Object.assign(ENEMIES.dangNo, { title: '唐門 毒手', quote: '흐흐… 독 맛 좀 보겠느냐.' });
Object.assign(ENEMIES.hyeolJang, { title: '血敎 長老', quote: '네 피는 꽤 뜨겁겠구나.' });
Object.assign(ENEMIES.cheonmaBoss, { title: '天魔神敎 敎主', quote: '천하는 본좌의 발아래 있다.', faceAt: [62, 2] });
Object.assign(ENEMIES.rk_4, { faceAt: [62, 2] }); Object.assign(ENEMIES.maengju, { faceAt: [50, 2] }); Object.assign(ENEMIES.sadae, { faceAt: [38, 4] }); // 자동 얼굴 찾기가 손·칼을 잡는 원화
export const HERO_FRAMES = { idle: 2, attack: 4, cast: 3, hurt: 2, mangae: 4, cheonha: 4, cheonmasin: 4 }; // sprite-gen 행 생성 → tools/heroframes.py · 절초 동작은 tools/heroult.py
export const PC_FRAMES = { idle: 2, attack: 4, cast: 3, hurt: 2 }; // 전용 캐릭터(assets/pc_<id>.png 한 장에 이 순서로) — tools/rosterframes.py
// 공격 3장이 있는 보스(tools/animrows.py → bossframes.py): <img>_idle, <img>_atk_0..2
export const BOSS_ANIM = ['b_bukhae', 'b_sorim', 'b_gaebang', 'b_mudang', 'b_emei', 'b_cheongseong', 'b_hwasan', 'b_jongnam', 'b_gonryun', 'b_gongdong', 'b_heukpung', 'b_jangang', 'b_dangno', 'b_hyeoljang', 'b_cheonma', 'b_oedang', 'b_sadae', 'b_maengju', 'mb_gwiyeong', 'mb_heukryong', 'mb_odok', 'mb_seolma', 'y_namgung', 'y_maehwa', 'y_jegal', 'y_dang'];
export const BOSS_ULT = { b_bukhae: 5, b_sorim: 5, b_gaebang: 5, b_mudang: 5, b_emei: 5, b_cheongseong: 5, b_hwasan: 5, b_jongnam: 5, b_gonryun: 5, b_gongdong: 5, b_heukpung: 5, b_jangang: 5, b_dangno: 5, b_hyeoljang: 5, b_cheonma: 5, b_oedang: 5, b_sadae: 5, b_maengju: 5, mb_gwiyeong: 5, mb_heukryong: 5, mb_odok: 5, mb_seolma: 5, y_namgung: 5, y_maehwa: 5, y_jegal: 5, y_dang: 5 }; // 전용 절초 프레임 수(tools/bossult.py)
export const MOB_ATK = ['n_bkwisa', 'n_bkgung', 'e_bkhobeop', 'n_sanjeok', 'n_nangin', 'n_dobu', 'n_sujeok', 'n_sapa', 'n_suri', 'n_dokin', 'n_amgi', 'n_dokgeom', 'n_hyeolgyo', 'n_hyeolgeom', 'n_ssangdo', 'n_magyodo', 'n_hyeolmasa', 'n_bingjang', 'n_somu', 'n_dosa', 'n_geomsu', 'e_sanjeokdu', 'e_subu', 'e_dangdok', 'e_hyeolhobeop', 'e_hobeop', 'n_gaebangdo']; // 일반 몹·정예 공격 컷(<id>_atk)
export const ART_IDS = [...new Set(Object.values(ART)), ...MOB_ATK.map(m => m + '_atk'), ...Object.entries(BOSS_ULT).flatMap(([b, n]) => Array.from({ length: n }, (_, k) => `${b}_ult_${k}`)), 'hero', 'hero_map', 'worldmap', 'body_chart', 'pc_sega', 'pc_magyo', 'pc_hwasan', 'pc_sorim', 'pc_mudang', 'pc_bukhae', 'pc_dang', ...BOSS_ANIM.flatMap(b => [b + '_idle', b + '_atk_0', b + '_atk_1', b + '_atk_2']), ...Object.entries(HERO_FRAMES).flatMap(([s, n]) => Array.from({ length: n }, (_, i) => `hero_${s}_${i}`)), 'bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'title'];

// ───────────── 지역 ─────────────
// path: 지도상 시작→보스 좌표(동→서), label: 지역명 위치
export const REGIONS = [
  { id: 1, name: '하남 · 낙양 외곽', place: '河南', label: [427, 200], path: [[476, 230], [370, 180]], pool: ['sanjeok', 'nangin', 'deulgae'], elite: 'sanjeokDu', mid: 'mb_gwiyeong', boss: 'heukpung', duel: ['m_sorim', 'm_gaebang'] },
  { id: 2, name: '호북 · 장강 수로', place: '湖北', label: [322, 300], path: [[357, 210], [260, 270]], pool: ['sujeok', 'sapa', 'suri'], elite: 'subu', mid: 'mb_heukryong', boss: 'jangang', duel: ['m_mudang'] },
  { id: 3, name: '사천 · 당가 외곽', place: '四川', label: [190, 340], path: [[242, 300], [137, 310]], pool: ['dokin', 'amgi', 'dokpyo'], elite: 'dangDok', mid: 'mb_odok', boss: 'dangNo', duel: ['m_emei', 'm_cheongseong'] },
  { id: 4, name: '섬서 · 혈교 잔당', place: '陝西', label: [216, 150], path: [[146, 270], [194, 140]], pool: ['hyeolgyo', 'gangsi', 'hyeollang'], elite: 'hyeolHobeop', mid: 'mb_gangsiwang', boss: 'hyeolJang', duel: ['m_hwasan', 'm_jongnam'], duo: [['mb_gwiyeong', 'mb_heukryong'], ['mb_odok', 'y_dang'], ['y_namgung', 'y_maehwa']] },
  { id: 5, name: '신강 · 천산 마교 총단', place: '天山', label: [53, 128], path: [[168, 115], [40, 75]], pool: ['magyodo', 'hyeolmaSa', 'seollang', 'bk_wisa', 'bk_gung'], elite: ['hobeop', 'bk_hobeop'], mid: 'mb_seolma', boss: 'cheonmaBoss', duel: ['m_gonryun', 'm_gongdong', 'm_bukhae'], duo: [['mb_seolma', 'rk_3'], ['m_oedang', 'rk_2'], ['mb_gangsiwang', 'mb_odok']] },
];
// 강호의 길(난이도). hp·atk은 지역별 적 배율, 나머지는 회복·보상. 유람은 예전 그대로다
export const DIFFS = [
  { name: '유람', tag: '입문', desc: '예전 그대로. 회복이 넉넉해 이야기와 카드를 구경하기 좋다.', hp: [1, 1, 1, 1, 1], atk: [1, 1, 1, 1, 1], lvHeal: [1, 1, 1, 1, 1], breakHeal: [1, 1, 1, 1, 1], inn: 0.4, gold: 1, price: 1, elite: 1, extraMob: 0, midRelic: true, pills: 2, bossTier: 1, choices: 0 },
  { name: '출사', tag: '권장', desc: '초반은 같고, 사천부터 적이 점점 세지며 레벨업·경지 돌파 회복이 줄어든다.', hp: [1, 1.05, 1.2, 1.3, 1.4], atk: [1, 1.02, 1.1, 1.15, 1.2], lvHeal: [1, 1, 0.5, 0.5, 0.5], breakHeal: [1, 1, 0.7, 0.5, 0.5], inn: 0.4, gold: 1, price: 1, elite: 1, extraMob: 0, midRelic: true, pills: 2, bossTier: 1, choices: 0 },
  { name: '혈로', tag: '고수', desc: '출사보다 적이 더 세다. 정예가 두 배, 잡졸이 한 명 더. 중간 두목은 보물을 주지 않고 물건값이 오른다.', hp: [1.05, 1.25, 1.45, 1.65, 1.8], atk: [1, 1.1, 1.25, 1.35, 1.45], lvHeal: [0.7, 0.5, 0.25, 0.25, 0.25], breakHeal: [0.7, 0.6, 0.5, 0.4, 0.4], inn: 0.35, gold: 0.9, price: 1.25, elite: 2, extraMob: 1, midRelic: false, pills: 1, bossTier: 1, choices: 0 },
  { name: '아수라', tag: '지옥', desc: '혈로에 더해 두목이 첫 수부터 기믹을 쓰고, 전리품 선택지가 하나 줄며, 레벨업으로는 회복하지 못한다.', hp: [1.1, 1.35, 1.6, 1.85, 2.1], atk: [1.05, 1.2, 1.35, 1.5, 1.6], lvHeal: [0, 0, 0, 0, 0], breakHeal: [0.5, 0.4, 0.3, 0.25, 0.25], inn: 0.3, gold: 0.8, price: 1.5, elite: 2, extraMob: 1, midRelic: false, pills: 0, bossTier: 2, choices: 1 },
];
export const diffOf = run => DIFFS[(run && run.diff) || 0];
export const SCALE = { hp: [0.85, 1.9, 3.7, 6.2, 10], atk: [0.85, 1.4, 2.5, 3.7, 5.5], def: [1, 1.7, 2.7, 3.8, 5.0], spd: [0, 1, 2, 3, 4] };

// ───────────── 문파 · 세가 소속 (런마다 하나씩) ─────────────
// 문파: set = 그 문파 책 1권을 더 장착한 것처럼 시너지 계산 / stats·book = 시너지 없는 문파의 대신 혜택
export const SECTS = {
  sorim: { name: '소림', set: 1, desc: '소림 시너지 +1권' }, gaebang: { name: '개방', set: 1, desc: '개방 시너지 +1권' },
  mudang: { name: '무당', set: 1, desc: '무당 시너지 +1권' }, hwasan: { name: '화산', set: 1, desc: '화산 시너지 +1권' },
  magyo: { name: '천마신교', set: 1, stats: { atk: 4 }, desc: '마교 시너지 +1권, 공력 +4' },
  emei: { name: '아미', stats: { eva: 6 }, book: 'emeiBok', desc: '회피 +6%, 「아미복호검」' }, cheongseong: { name: '청성', stats: { spd: 2 }, book: 'songpung', desc: '속도 +2, 「송풍검법」' },
  jongnam: { name: '종남', stats: { def: 3 }, book: 'cheongang', desc: '방어 +3, 「천강북두검」' }, gonryun: { name: '곤륜', stats: { spd: 1, eva: 3 }, book: 'unryong', desc: '속도 +1, 회피 +3%, 「운룡대팔식」' },
  gongdong: { name: '공동', stats: { atk: 3 }, book: 'chilsang', desc: '공력 +3, 「칠상권」' },
  bukhae: { name: '북해빙궁', stats: { def: 1 }, desc: '방어 +1' },
};
export const FAMILIES = {
  namgung: { name: '남궁세가', stats: { atk: 2, crit: 5 }, desc: '공력 +2, 치명 +5%' },
  jegal: { name: '제갈세가', fx: { startGauge: 30, sealOnHit: 4 }, desc: '시작 게이지 +30, 타격마다 점혈 4' },
  dang: { name: '사천당가', fx: { poisonDmg: 0.3 }, pills: { haedok: 2 }, desc: '독 피해 +30%, 해독단 2' },
  hwangbo: { name: '황보세가', stats: { maxHp: 20, def: 2 }, desc: '최대체력 +20, 방어 +2' },
};
export const YONGBONG = ['y_namgung', 'y_maehwa', 'y_jegal', 'y_dang']; // 용봉지회 출전자

// ───────────── 출신 · 루트 ─────────────
export const ORIGINS = {
  musa: { name: '무명 삼류무사', route: 'normal', school: 'samryu', desc: '검 한 자루로 시작한다. 문파 없이 여러 문파의 초식을 주워 모아 덱을 짠다(잡학). 정파의 길 — 최종 상대 천마.',
    sel: { short: '삼류무사', tab: '무명', han: '無', col: '#7890d8', style: '잡학', st: [2, 2, 3], show: ['sr_samjae', 'sr_makgi', 'sr_morae'], blurb: '문파 없이 여러 초식을 주워 섞는다. 섞어 낼수록 세진다.' },
    intro: '이름도 문파도 없다. 낡은 검 한 자루와 금창약 두 알.<br>그래도 언젠가는 천하에 이름을 떨치리라.' },
  sega: { name: '남궁세가 방계', pc: 'sega', route: 'normal', school: 'namgung', family: 'namgung', gold: 80, books: { changgung: 0 }, slots: ['changgung', 'samjae'], titles: ['남궁세가 방계'],
    desc: '가문 혜택·은자 80·가전 「창궁무애검」. 적통 사촌과 가주 자리를 겨룬다.',
    sel: { short: '남궁방계', tab: '남궁', han: '南', col: '#60b0ff', style: '제왕검', st: [5, 2, 3], show: ['ng_changgung', 'ng_jewang', 'ng_mueo'], blurb: '주천을 3단까지 올려 내리꽂는다. 적통 사촌과 가주 자리를 겨룬다.' },
    intro: '"천마의 목을 가져오는 자에게 가주를 잇게 하겠다."<br>방계의 서자에게 처음으로 기회가 왔다. 적통 사촌 남궁현도 같은 길을 나섰다.' },
  hwasan: { name: '화산 말석 제자', pc: 'hwasan', route: 'normal', school: 'hwasan', sect: 'hwasan', sim: 'jaha', titles: ['화산 말석'],
    desc: '꽃잎 연환과 「매화만개」. 정파의 길 — 최종 상대 천마.',
    sel: { short: '화산제자', tab: '화산', han: '華', col: '#ff80b0', style: '꽃잎 연환', st: [3, 2, 5], show: ['ilseom', 'amhyang', 'mangae'], blurb: '꽃잎으로 몰아치고, 검기를 모아 3단에서 매화만개를 터뜨린다.' },
    intro: '"매화는 추운 날에 피는 법이다."<br>말석 제자에게 하산 허락이 떨어졌다. 천마의 소문이 화산까지 올라왔다.' },
  sorim: { name: '소림 속가제자', pc: 'sorim', route: 'normal', school: 'sorim', sect: 'sorim', sim: 'yeokgeun', titles: ['소림 속가제자'],
    desc: '1단에 머물러 호신을 쌓고 되받는다. 정파의 길 — 최종 상대 천마.',
    sel: { short: '소림제자', tab: '소림', han: '少', col: '#ffb040', style: '금강 되받기', st: [2, 5, 2], show: ['nahan', 'geumgang', 'budong'], blurb: '주천을 1단에 묶고 호신을 쌓아, 쌓은 만큼 되받는다.' },
    intro: '"세상을 보고 오너라. 주먹은 그다음이다."<br>방장의 한마디에 속가제자는 천 계단을 내려왔다.' },
  mudang: { name: '무당 소도사', pc: 'mudang', route: 'normal', school: 'mudang', sect: 'mudang', sim: 'taeguk', titles: ['무당 소도사'],
    desc: '2단에 머물며 받은 힘을 되돌린다. 정파의 길 — 최종 상대 천마.',
    sel: { short: '무당도사', tab: '무당', han: '武', col: '#a0c8e8', style: '태극 균형', st: [3, 4, 4], show: ['md_yangui', 'md_taeguk', 'md_manryu'], blurb: '주천을 2단에 맞춰 두고, 되치기로 받은 힘을 되돌린다.' },
    intro: '"태극은 멈추지 않는다."<br>스승이 등을 떠밀었다. 어린 도사의 첫 하산길이다.' },
  bukhae: { name: '북해빙궁 외궁 제자', pc: 'bukhae', route: 'normal', school: 'bukhae', sect: 'bukhae', sim: 'bingbaek', titles: ['북해빙궁 외궁 제자'],
    desc: '한기를 쌓아 적을 늦추고 얼린다. 새외에서 중원으로 — 최종 상대 천마.',
    sel: { short: '빙궁제자', tab: '북해', han: '氷', col: '#a0e8ff', style: '빙결', st: [3, 4, 5], show: ['bh_hanbing', 'bh_bingsim', 'bh_soebing'], blurb: '한기를 쌓아 적을 늦추고 얼린다. 얼려 두면 한 수 쉬고, 깨면 크게 터진다.' },
    intro: '"북해의 얼음 밑에서 천마의 기운이 올라왔다. 중원으로 가라."<br>궁주의 한마디에 외궁 제자는 처음으로 설원을 떠났다.' },
  dang: { name: '사천당가 외문 독수', pc: 'dang', route: 'normal', school: 'dang', family: 'dang', titles: ['당가 외문'],
    desc: '독은 줄지 않고 호신을 뚫는다. 쌓아서 터뜨린다 — 최종 상대 천마.',
    sel: { short: '당가독수', tab: '당가', han: '毒', col: '#70e060', style: '만독', st: [3, 2, 5], show: ['dg_bihwang', 'dg_doksu', 'dg_eunsin'], blurb: '독은 줄지 않고 호신을 뚫는다. 암기와 독침으로 쌓고, 한 번에 터뜨린다.' },
    intro: '"당가의 독이 못 닿는 곳은 없다. 천마라도."<br>가주가 독경 한 장을 던졌다. 외문 독수에게 처음으로 주어진 기회다.' },
  magyo: { name: '천마신교 말단 교도', pc: 'magyo', route: 'magyo', school: 'magyo', sect: 'magyo', sim: 'mahwa', books: { hyeolyeong: 0 }, slots: ['samjae', 'hyeolyeong'], titles: ['신교 말단'],
    desc: '천산에서 서열전으로 올라가 소교주가 되고 중원을 친다 — 최종 상대 무림맹주.',
    sel: { short: '신교말단', tab: '마교', han: '魔', col: '#ff4050', style: '혈공', st: [4, 1, 4], show: ['mg_hyeolin', 'mg_mabo', 'mg_cheonma'], blurb: '제 피를 태워 몰아친다. 천산에서 거꾸로 중원을 친다 — 상대는 무림맹주.' },
    intro: '천산 신교의 가장 밑바닥. "위로 가고 싶으면 위를 베어라."<br>말단 교도의 피 묻은 서열전이 시작된다.' },
};
export const RANKS = ['신교 말단', '외당 무사', '내당 무사', '혈마당주', '호법', '소교주'];
// 마교 루트: 천산에서 거꾸로 중원을 친다(geo = 지도 지역, 경로도 반대로)
const MAGYO_STAGES = [
  { geo: 4, mul: { mob: 0.78, elite: 0.85 }, name: '천산 · 신교 외당', pool: ['magyodo', 'hyeolmaSa', 'seollang'], elite: 'hobeop', boss: 'm_oedang', duel: ['rk_1'] },
  { geo: 3, mul: { boss: 0.82, elite: 0.9 }, name: '섬서 · 혈교 지부 숙청', pool: ['hyeolgyo', 'gangsi', 'hyeollang'], elite: 'hyeolHobeop', mid: 'mb_gangsiwang', boss: 'hyeolJang', duel: ['rk_2'] },
  { geo: 2, name: '사천 · 당가 정벌', pool: ['dokin', 'amgi', 'dokpyo'], elite: 'dangDok', mid: 'mb_odok', boss: 'dangNo', duel: ['rk_3'] },
  { geo: 1, mul: { boss: 1.15 }, name: '호북 · 사대호법의 난', pool: ['dosa', 'sapa', 'suri'], elite: 'hobeop', boss: 'sadae', duel: ['rk_4'], duo: [['m_oedang', 'mb_heukryong'], ['mb_gwiyeong', 'mb_heukryong'], ['jangang', 'mb_odok']] },
  { geo: 0, name: '하남 · 숭산 무림맹', pool: ['somu', 'dosa', 'geomsu'], elite: ['m_mudang', 'm_hwasan', 'm_emei'], boss: 'maengju', duel: ['m_sorim'], duo: [['m_mudang', 'm_hwasan'], ['m_emei', 'm_cheongseong'], ['m_gonryun', 'm_jongnam']] },
];
// 변절 루트: 정파로 오다 천산에서 마교로 → 마지막 장이 무림맹의 토벌(최종 무림맹주)
export const DEFECT_STAGE = { ...REGIONS[4], geo: 4, name: '천산 · 무림맹의 토벌', pool: ['somu', 'dosa', 'geomsu'], elite: ['m_mudang', 'm_hwasan', 'm_gonryun'], mid: 'm_gongdong', boss: 'maengju', duo: [['m_hwasan', 'm_jongnam'], ['m_gonryun', 'm_emei'], ['m_mudang', 'm_cheongseong']] };
export const ROUTES = {
  normal: REGIONS.map((r, i) => ({ ...r, geo: i })),
  magyo: MAGYO_STAGES.map(s => ({ ...REGIONS[s.geo], ...s, id: s.geo + 1, path: [...REGIONS[s.geo].path].reverse() })),
};

// ───────────── 밸런스 손잡이 ─────────────
// 주인공 성장(main.js가 씀) · 적 능력치 배율 — tools/sim.mjs 로 지역별 피해율을 재며 맞춘다
export const BASE = { maxHp: 95, maxQi: 30, atk: 11, def: 5, spd: 10, crit: 5, eva: 5 };
export const GROW = { maxHp: 9, maxQi: 2, atk: 1.2, def: 0.6, spd: 0.35 };
export const REALM_UP = { maxHp: 30, maxQi: 10, atk: 4, def: 2, spd: 1.5, crit: 3 };
export const SET_FX = {
  sorim: [{ dmgReduce: 0.12 }, { turnShield: 0.08 }], mudang: [{ counter: 0.25 }, { counterHaste: 30 }], hwasan: [{ crit: 15 }, { extraHits: 1 }],
  dang: [{ poisonDmg: 0.5 }, { poisonOnHit: 1 }], gaebang: [{ stunBonus: 0.15 }, { strongDmg: 0.3 }], magyo: [{ lifesteal: 0.1 }, { lowHpAtk: 0.4 }],
};
const _add = (o, k, v) => (o[k] = (o[k] || 0) + v);
export function schoolCountOf(run) {
  const c = {};
  for (const id of [...run.slots, run.heart]) if (id && BOOKS[id].school !== 'none') _add(c, BOOKS[id].school, 1);
  if (run.sect && SECTS[run.sect].set && c[run.sect]) _add(c, run.sect, SECTS[run.sect].set); // 소속 문파: 그 문파 책을 하나라도 끼면 +1
  return c;
}
export function combosOf(run) {
  return Object.entries(COMBOS).filter(([, c]) => c.need.every(id => run.slots.includes(id) && run.books[id] >= 1)).map(([id]) => id);
}
export function heroStatsOf(run) {
  // 카드 전투: 체력은 덱으로 버티므로 레벨·경지로 크게 불지 않는다(적 한 대가 체력의 7~15%가 되게)
  const card = !!run.school, s = { ...BASE, ...(card ? { maxHp: 70 } : {}) }, fx = {};
  for (const k in GROW) s[k] += (card && k === 'maxHp' ? 2 : GROW[k]) * (run.level - 1);
  for (const k in REALM_UP) s[k] += (card && k === 'maxHp' ? 8 : REALM_UP[k]) * run.realm;
  for (const k in run.bonus) _add(s, k, run.bonus[k]);
  for (const k in run.fxBonus || {}) _add(fx, k, run.fxBonus[k]); // 세가 혜택 등
  for (const id of run.bag) { const it = itemInfo(id); for (const k in it.stats) _add(s, k, it.stats[k]); for (const k in it.fx || {}) _add(fx, k, it.fx[k]); }
  if (run.heart) { const p = BOOKS[run.heart].passive, t = run.books[run.heart]; for (const k in p) _add(fx, k, p[k] === 1 ? 1 : p[k] * (1 + 0.3 * t)); }
  const cnt = schoolCountOf(run);
  for (const sc in cnt) { const f = SET_FX[sc]; if (!f) continue; if (cnt[sc] >= 2) for (const k in f[0]) _add(fx, k, f[0][k]); if (cnt[sc] >= 4) for (const k in f[1]) _add(fx, k, f[1][k]); }
  s.maxHp = Math.round(s.maxHp * (1 + (fx.maxHpPct || 0)));
  s.maxQi = Math.round(s.maxQi);
  s.spd = s.spd * (1 + (fx.spdPct || 0));
  return { ...s, fx, cnt };
}
export const TUNE = { mobHp: [1, 1, 1.1, 1.1, 1.15], mobAtk: [1, 1, 1.2, 1.2, 1.25], duelHp: 0.15, duelAtk: 0.06, midHp: [0.8, 1, 1.3, 1.6, 1.8], midAtk: [0.9, 1.05, 1.2, 1.35, 1.45] }; // mid*: 소챕터 두목
export function enemyStats(id, r, mul = {}) { // mul: 루트 단계별 배율 {mob, elite, boss}
  const d = ENEMIES[id], m = d.boss ? (mul.boss ?? 1) : d.elite ? (mul.elite ?? 1) : (mul.mob ?? 1);
  return {
    id, name: d.name, spr: d.spr, img: d.img, faceAt: d.faceAt, title: d.title, quote: d.quote, boss: !!d.boss, elite: !!d.elite, final: !!d.final, duel: !!d.duel,
    maxHp: Math.round(d.hp * SCALE.hp[r] * (d.boss || d.elite ? 1 : TUNE.mobHp[r]) * (d.duel ? 1 + TUNE.duelHp * r : 1) * (d.mid ? TUNE.midHp[r] : 1) * m), atk: d.atk * SCALE.atk[r] * (d.boss || d.elite ? 1 : TUNE.mobAtk[r]) * (d.duel ? 1 + TUNE.duelAtk * r : 1) * (d.mid ? TUNE.midAtk[r] : 1) * m, def: d.def * SCALE.def[r], spd: d.spd + SCALE.spd[r],
    crit: 5 + r * 2, eva: d.spr.kind === 'beast' ? 10 : 4, skills: d.skills.map(s => ({ hits: 1, mult: 0, target: 'one', fx: {}, ...s })), fx: {},
  };
}

export const NODE_TYPES = {
  start:  { glyph: '出', col: '#6a6a7a', name: '출발' },
  battle: { glyph: '刀', col: '#4a5a8a', name: '전투' },
  elite:  { glyph: '凶', col: '#b02828', name: '정예' },
  inn:    { glyph: '宿', col: '#3a8a4a', name: '객잔' },
  shop:   { glyph: '金', col: '#c89020', name: '전장' },
  event:  { glyph: '奇', col: '#7a4aa8', name: '기연' },
  duel:   { glyph: '武', col: '#1a7a78', name: '비무' },
  rank:   { glyph: '位', col: '#9a1828', name: '서열전' },
  mboss:  { glyph: '將', col: '#b04018', name: '두목' },
  boss:   { glyph: '王', col: '#801020', name: '보스' },
};

// ───────────── 기연(이벤트) — js/events.js ─────────────
export { EVENTS } from './events.js';
import { STORY as STORY_MAIN } from './story.js'; // 문파·가문·용봉지회 이야기(진행도별)
import { ROUTE_STORY } from './story_routes.js';  // 세가·마교 출신 전용 이야기
export const STORY = [...ROUTE_STORY, ...STORY_MAIN];

