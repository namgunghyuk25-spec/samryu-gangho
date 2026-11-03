// cards.js — 주천(周天) 카드 전투 데이터: 초식 카드 · 덱 · 보물 · 적 의도
// 값이 [a, b, c]면 1·2·3단일 때 값. only: 그 단에서만 낼 수 있음(3단 전용 = 절초, jc: 전용 동작·연출). finisher: 쓰면 주천이 1단으로.
// type: 공(베기) 암(암기·끊기) 수(호신) 허(허초) 운(운기) 심(옛 심법 카드 — 이제 심법은 SIMS로 장착하고, 남은 덱의 것만 그대로 돈다). w: 무게(많이 낼수록 다음 차례가 늦다)
// 낱말: trick 간파(같은 수는 두 번 통하지 않는다) · tal 탈력(다음 차례 내력을 당겨 쓴다) · retain 축기(손에 남을 때마다 기가 쌓인다) · token 꽃잎처럼 만들어진 카드(차례 끝에 흩날림)
// st: 대상에 거는 상태 — bleed 출혈(차례 시작에 n 피해, 1씩 줆) · weak 약화(주는 피해 −25%) · vuln 내상(받는 피해 +50%) · poison 독(차례마다 n 피해, 호신 무시, 줄지 않음) · frost 한기(느려지고 차면 빙결). stT: 단별 값 [1단, 2단, 3단]

export const TYPE = { 공: '#ff6060', 암: '#b8c0d0', 수: '#70b0ff', 허: '#c890ff', 운: '#ffd050', 심: '#50e0b0' };
export const TYPE_NAME = { 공: '공격', 암: '암기', 수: '방어', 허: '허초', 운: '운기', 심: '심법' };
export const ST_NAME = { bleed: ['출혈', '#ff5060'], weak: ['약화', '#a0a0ff'], vuln: ['내상', '#ffa040'], poison: ['독', '#70e060'], frost: ['한기', '#90d8ff'] };

export const CARDS = {
  // ── 삼류: 이름 없는 무사의 막싸움. 여기서 시작해 여러 문파의 초식을 주워 모은다 ──
  sr_samjae: { name: '삼재검', school: 'samryu', type: '공', cost: 1, w: 1, target: 'one', dmg: [4, 8, 5], vfx: 'slash', special: 'samjae', desc: '천지인 세 자세 — 1단 인(人): 피해 4·호신 3 / 2단 지(地): 피해 8 / 3단 천(天): 5×2' },
  sr_makgi:  { name: '흘려막기', short: '흘려막기', school: 'samryu', type: '수', cost: 1, w: 1, target: 'self', dodge: [1, 2, 2], vfx: 'shield', desc: '다음 차례까지 적 공격 한 번의 피해를 절반으로 흘린다(2단부터 두 번)' },
  sr_sum:    { name: '숨고르기', school: 'samryu', type: '운', cost: 0, w: 0.5, target: 'self', tier: 1, vfx: 'wind', desc: '주천 +1' },
  sr_gaessa: { name: '개싸움', school: 'samryu', type: '공', cost: 1, w: 1, target: 'one', dmg: 4, st: { weak: 1 }, vfx: 'strong', desc: '피해 4 · 약화 1' },
  sr_morae:  { name: '모래뿌리기', short: '모래뿌리기', school: 'samryu', type: '암', cost: 0, w: 0.5, target: 'one', interrupt: true, trick: true, vfx: 'dust', desc: '간파 · 공격·경계 끊기' },
  // ── 화산: 꽃잎을 흩뿌려 따따닥 몰아치고, 검기를 모아 3단에서 「매화만개」 ──
  ilseom:   { name: '매화일섬', school: 'hwasan', type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 8, 12], vfx: 'petal', special: 'ilseom', desc: '피해 5/8/12 · 이번 차례 3장째 이후에 내면 두 번 벤다' },
  nakhwa:   { name: '낙화검', school: 'hwasan', type: '공', cost: 1, w: 1, target: 'one', dmg: [3, 4, 6], hits: 2, make: 1, vfx: 'petal', desc: '2연격 3/4/6 · 꽃잎 1장 만들기' },
  amhyang:  { name: '암향표', school: 'hwasan', type: '운', cost: 0, w: 0.5, target: 'self', tier: 1, draw: 1, vfx: 'windP', special: 'amhyang', desc: '주천 +1 · 1장 뽑기. 이미 3단이면 대신 꽃잎 2장' },
  biwol:    { name: '매화비월', school: 'hwasan', type: '공', cost: 1, w: 1, target: 'one', dmg: 4, tier: 1, vfx: 'petal', special: 'biwol', desc: '피해 4 · 주천 +1 · 앞서 공격을 2장 이상 냈으면 내력 +1' },
  bichim:   { name: '비침', school: 'hwasan', type: '암', cost: 1, w: 0.5, target: 'one', dmg: 3, interrupt: true, st: { bleed: 3 }, vfx: 'darts', desc: '피해 3 · 공격·경계 끊기 · 출혈 3' },
  heocho:   { name: '허초', school: 'hwasan', type: '허', cost: 1, w: 0.5, target: 'one', blunt: true, vfx: 'wind', special: 'heocho', desc: '절초 약화 · 다음 공격 카드가 한 번 더 발동' },
  geomjin:  { name: '매화검진', school: 'hwasan', type: '수', cost: 1, w: 1, target: 'self', block: [5, 7, 9], vfx: 'windP', special: 'geomjin', desc: '호신 5/7/9 · 다음 차례 시작에 꽃잎 1/1/2장' },
  mangae:   { name: '매화만개', school: 'hwasan', type: '공', cost: 2, w: 2, target: 'one', only: 3, finisher: true, jc: 'mangae', vfx: 'petal', special: 'mangae', desc: '[3단 전용] 검기 수만큼 6 피해 연타 · 주천 1단으로' },
  isipsa:   { name: '이십사수매화', short: '이십사수', school: 'hwasan', type: '공', cost: 2, w: 1.5, target: 'all', dmg: [3, 4, 6], hits: 2, vfx: 'petal', special: 'isipsa', desc: '전체 2연격 3/4/6 · 손의 꽃잎을 모두 날려 장당 전체 피해 4' },
  jaha:     { name: '자하신공', school: 'hwasan', type: '심', cost: 1, w: 1, target: 'self', power: 'jaha', main: '오를 때 검기+2', vfx: 'gold', desc: '심법 · 주천이 오를 때마다 검기 +2' },
  yeonhwan: { name: '매화연환', school: 'hwasan', type: '공', cost: 1, w: 0.5, target: 'one', dmg: [2, 3, 4], vfx: 'petal', special: 'yeonhwan', desc: '이번 차례 낸 카드 수만큼 2/3/4 연타(최대 8)' },
  nakyeong: { name: '매화낙영', school: 'hwasan', type: '심', cost: 1, w: 1, target: 'self', power: 'nakyeong', main: '꽃잎 피해+3', vfx: 'windP', desc: '심법 · 꽃잎 피해 +3' },
  chilmae:  { name: '칠매검', school: 'hwasan', type: '공', cost: 'X', w: 1, target: 'self', vfx: 'petal', special: 'chilmae', desc: '남은 내력을 모두 써서 내력 1마다 꽃잎 2장' },
  amhyangbu:{ name: '암향부동', short: '암향부동', school: 'hwasan', type: '운', cost: 1, w: 0.5, target: 'self', retain: true, block: 4, cgBlock: 3, vfx: 'windP', special: 'nextEnergy', desc: '축기 · 호신 4(손에 남을 때마다 +3) · 다음 차례 내력 +1' },
  dokgi:    { name: '독기', school: 'samryu', type: '암', cost: 1, w: 0, target: 'self', token: true, exhaust: true, vfx: 'poison', desc: '내면 사라진다 · 내지 않고 차례가 끝나면 체력 −3' },
  petal:    { name: '꽃잎', school: 'hwasan', type: '공', cost: 0, w: 0, target: 'one', dmg: [2, 3, 4], token: true, exhaust: true, vfx: 'petal', special: 'petal', desc: '피해 2/3/4 · 소멸 · 차례가 끝나면 흩날린다' },
  // ── 소림: 1단에 머물러 호신을 쌓고, 쌓은 만큼 되받는다 ──
  nahan:    { name: '나한권', school: 'sorim', type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 7, 8], vfx: 'gold', special: 'nahan', desc: '피해 6/7/8 · 1단이면 호신의 1/3만큼 더(최대 +8)' },
  geumgang: { name: '금강장', school: 'sorim', type: '수', cost: 1, w: 1, target: 'one', dmg: 3, block: [6, 5, 3], vfx: 'gold', desc: '피해 3 · 호신 6/5/3' },
  cheolpo:  { name: '철포삼', school: 'sorim', type: '수', cost: 1, w: 1, target: 'self', block: [8, 6, 4], vfx: 'gold', special: 'cheolpo', desc: '호신 8/6/4 · 이미 호신이 10 이상이면 1장 뽑기' },
  bantan:   { name: '반탄', school: 'sorim', type: '수', cost: 1, w: 0.5, target: 'self', block: [4, 3, 2], counter: 3, vfx: 'gold', desc: '호신 4/3/2 · 반격 3 — 다음 차례까지 맞을 때마다 3 되받기' },
  sajahu:   { name: '사자후', school: 'sorim', type: '허', cost: 1, w: 1, target: 'all', blunt: true, st: { weak: 2 }, trick: true, vfx: 'roar', special: 'sajahu', desc: '간파 · 전체 절초 약화 · 약화 2 · 1단이면 전체 끊기' },
  yeomhwa:  { name: '염화지', school: 'sorim', type: '암', cost: 0, w: 0.5, target: 'one', dmg: 2, interrupt: true, tier: -1, vfx: 'darts', special: 'yeomhwa', desc: '피해 2 · 끊기 · 주천 −1' },
  dalma:    { name: '달마심법', school: 'sorim', type: '운', cost: 0, w: 0.5, target: 'self', tier: -1, energy: 1, vfx: 'gold', desc: '주천 −1 · 내력 +1' },
  budong:   { name: '금강부동', school: 'sorim', type: '수', cost: 2, w: 1.5, target: 'self', only: 1, block: 14, counter: 4, vfx: 'gold', desc: '[1단 전용] 호신 14 · 반격 4' },
  hangma:   { name: '항마권', school: 'sorim', type: '공', cost: 2, w: 1.5, target: 'one', vfx: 'gold', special: 'hangma', desc: '지금 호신 ×1·0.7·0.5배(1·2·3단)만큼 피해 · 호신이 절반으로 준다' },
  yeokgeun: { name: '역근경', school: 'sorim', type: '심', cost: 1, w: 1, target: 'self', power: 'yeokgeun', main: '1단 호신+3', vfx: 'gold', desc: '심법 · 차례 시작에 1단이면 호신 +3' },
  nahanjin: { name: '나한진', school: 'sorim', type: '공', cost: 2, w: 1.5, target: 'all', dmg: [5, 5, 6], vfx: 'roar', special: 'nahan', desc: '전체 피해 5/5/6 · 1단이면 호신의 1/3만큼 더(최대 +8)' },
  bulgoe:   { name: '금강불괴', school: 'sorim', type: '심', cost: 2, w: 1.5, target: 'self', power: 'bulgoe', main: '호신 유지', vfx: 'gold', desc: '심법 · 차례가 와도 호신이 사라지지 않는다' },
  daeryeok: { name: '대력금강장', short: '대력금강', school: 'sorim', type: '공', cost: 2, w: 2, target: 'one', tal: 1, vfx: 'gold', special: 'daeryeok', desc: '탈력1 · 이번 전투에서 호신으로 막아낸 피해를 쏟아낸다(최대 50, 쏟으면 다시 0부터)' },
  chamseon: { name: '참선', school: 'sorim', type: '운', cost: 1, w: 0.5, target: 'self', retain: true, block: 6, cgBlock: 3, vfx: 'gold', special: 'chamseon', desc: '축기 · 호신 6(손에 남을 때마다 +3) · 1단이면 다음 차례 내력 +1' },
  gyeonsu:  { name: '견수', school: 'sorim', type: '수', cost: 0, w: 0.5, target: 'self', block: 3, vfx: 'gold', special: 'gyeonsu', desc: '호신 3 · 이번 차례 앞서 낸 방어 카드마다 호신 +3' },
  // ── 무당: 2단에 머무는 균형. 흘려서 되돌린다 ──
  md_yangui:  { name: '양의검', school: 'mudang', type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 9, 6], vfx: 'taiji', desc: '피해 5/9/6 — 2단에서 가장 날카롭다' },
  md_yuun:    { name: '유운검', school: 'mudang', type: '공', cost: 1, w: 1, target: 'one', dmg: [3, 4, 3], hits: 2, vfx: 'wind', special: 'yuun', desc: '2연격 3/4/3 · 2단이면 호신 4' },
  md_taeguk:  { name: '태극권', school: 'mudang', type: '수', cost: 1, w: 1, target: 'self', block: 6, vfx: 'taiji', special: 'parry', desc: '호신 6 · 되치기: 다음 차례까지 일반 공격 한 번을 절반만 맞고 절반을 되돌린다(절초는 못 되친다)' },
  md_seonhwan:{ name: '선환', school: 'mudang', type: '운', cost: 0, w: 0.5, target: 'self', setTo: 2, draw: 1, vfx: 'taiji', desc: '주천을 2단으로 맞춘다 · 1장 뽑기' },
  md_myeonjang:{ name: '면장', school: 'mudang', type: '수', cost: 1, w: 1, target: 'one', dmg: 3, block: [5, 8, 5], st: { weak: 1 }, vfx: 'wind', desc: '피해 3 · 호신 5/8/5 · 약화 1' },
  md_jwasu:   { name: '좌수호박', short: '좌수호박', school: 'mudang', type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 8, 6], vfx: 'taiji', special: 'jwasu', desc: '피해 6/8/6 · 대상이 흔들림이면 두 배' },
  md_taegeukgeom: { name: '태극검', school: 'mudang', type: '공', cost: 2, w: 1.5, target: 'one', vfx: 'taiji', special: 'returned', desc: '피해 6 + 이번 전투에서 되치기·반격으로 되돌린 피해' },
  md_jeonghwa:{ name: '정화', school: 'mudang', type: '운', cost: 1, w: 0.5, target: 'self', retain: true, vfx: 'heal', special: 'jeonghwa', desc: '축기 · 체력 4 회복(손에 남을 때마다 +3) · 다음 차례 내력 +1' },
  md_eumyang: { name: '음양조화', school: 'mudang', type: '심', cost: 1, w: 1, target: 'self', power: 'eumyang', main: '2단 내력+1', vfx: 'taiji', desc: '심법 · 2단에서 차례를 시작하면 내력 +1 · 호신 3' },
  md_manryu:  { name: '만류귀종', school: 'mudang', type: '공', cost: 2, w: 1.5, target: 'all', only: 2, dmg: 10, vfx: 'taiji', special: 'manryu', desc: '[2단 전용] 전체 피해 10 · 되치기 자세(다음 차례까지)' },
  md_cheonji: { name: '천지교태', school: 'mudang', type: '허', cost: 1, w: 1, target: 'all', blunt: true, interrupt: true, trick: true, vfx: 'taiji', desc: '간파 · 전체 절초 약화 · 전체 끊기' },
  // ── 북해빙궁: 한기를 쌓아 얼린다. 얼려 두면 적이 한 수 쉬고, 깨면 크게 터진다 ──
  bh_hanbing: { name: '한빙장', school: 'bukhae', type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 6, 8], stT: { frost: [1, 1, 2] }, vfx: 'ice', desc: '피해 5/6/8 · 한기 1/1/2' },
  bh_bingbyeok: { name: '빙벽', school: 'bukhae', type: '수', cost: 1, w: 1, target: 'self', block: [6, 7, 8], vfx: 'shield', special: 'icewall', desc: '호신 6/7/8 · 다음 차례까지 나를 때린 적에게 한기 1' },
  bh_seolbo:  { name: '설보', school: 'bukhae', type: '운', cost: 0, w: 0.5, target: 'self', tier: 1, block: 2, vfx: 'wind', desc: '주천 +1 · 호신 2' },
  bh_bingjeong: { name: '빙정침', school: 'bukhae', type: '암', cost: 0, w: 0.5, target: 'one', dmg: 1, trick: true, interrupt: true, st: { frost: 2 }, vfx: 'darts', desc: '간파 · 피해 1 · 끊기 · 한기 2' },
  bh_bingsim: { name: '빙심결', school: 'bukhae', type: '운', cost: 0, w: 0.5, target: 'self', tier: -1, energy: 1, vfx: 'wind', desc: '주천 −1 · 내력 +1' },
  bh_bingmu:  { name: '빙무', school: 'bukhae', type: '허', cost: 1, w: 1, target: 'all', trick: true, st: { frost: 2, weak: 1 }, main: '전체 한기 2', vfx: 'nova', desc: '간파 · 전체 한기 2 · 약화 1' },
  bh_seolhwa: { name: '설화난무', school: 'bukhae', type: '공', cost: 1, w: 1, target: 'one', dmg: [3, 4, 5], hits: 2, st: { frost: 2 }, vfx: 'ice', desc: '2연격 3/4/5 · 한기 2' },
  bh_soebing: { name: '쇄빙권', school: 'bukhae', type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 9, 12], vfx: 'ice', special: 'shatter', desc: '피해 6/9/12 · 빙결한 적이면 2.5배로 깨뜨린다(깨진 적은 쉬지 않고 움직인다)' },
  bh_dongkyeol: { name: '동결진', school: 'bukhae', type: '공', cost: 2, w: 1.5, target: 'all', dmg: [4, 6, 8], stT: { frost: [1, 2, 2] }, vfx: 'ice', desc: '전체 피해 4/6/8 · 전체 한기 1/2/2' },
  bh_hancheon: { name: '한천기', school: 'bukhae', type: '수', cost: 1, w: 1, target: 'self', vfx: 'shield', special: 'hancheon', desc: '호신 4 + 모든 적의 한기 합(최대 +20)' },
  bh_mannyeon: { name: '만년빙', school: 'bukhae', type: '운', cost: 1, w: 0.5, target: 'self', retain: true, block: 4, cgBlock: 3, vfx: 'wind', special: 'mannyeon', desc: '축기 · 호신 4(손에 남을 때마다 +3) · 손에 남을 때마다 모든 적 한기 1' },
  bh_bukmyeong: { name: '북명한풍', school: 'bukhae', type: '허', cost: 1, w: 1.5, target: 'all', exhaust: true, vfx: 'nova', main: '전체 한기 3', special: 'bukmyeong', desc: '전체 한기 3 · 내면 이번 전투에서 사라진다' },
  bh_bingbaek: { name: '빙백신장', school: 'bukhae', type: '공', cost: 2, w: 2, target: 'one', only: 3, finisher: true, jc: 'bingbaek', vfx: 'ice', special: 'bingbaek', desc: '[3단 전용] 피해 18 + 대상 한기×3(한기를 다 쓴다) · 빙결한 적이면 두 배로 깨뜨린다 · 주천 1단으로' },
  // ── 사천당가: 독은 줄지 않고 호신을 뚫는다. 쌓아 두거나, 터뜨리거나 ──
  dg_bihwang: { name: '비황석', school: 'dang', type: '암', cost: 1, w: 1, target: 'one', dmg: [3, 4, 5], stT: { poison: [1, 1, 2] }, vfx: 'darts', desc: '피해 3/4/5 · 독 1/1/2' },
  dg_doksu:   { name: '독수', school: 'dang', type: '공', cost: 1, w: 1, target: 'one', dmg: [3, 5, 7], st: { poison: 2 }, vfx: 'poison', desc: '피해 3/5/7 · 독 2' },
  dg_eunsin:  { name: '암영보', school: 'dang', type: '수', cost: 1, w: 1, target: 'self', block: [5, 6, 7], make: 1, makeId: 'dg_chim', vfx: 'shield', desc: '호신 5/6/7 · 독침 1장 만들기' },
  dg_dokmu:   { name: '독무보', school: 'dang', type: '운', cost: 0, w: 0.5, target: 'all', tier: 1, st: { poison: 1 }, main: '전체 독 1', vfx: 'toxcloud', desc: '주천 +1 · 전체 독 1' },
  dg_sanhwa:  { name: '산화침', school: 'dang', type: '암', cost: 1, w: 0.5, target: 'one', dmg: 2, trick: true, interrupt: true, st: { poison: 2 }, vfx: 'darts', desc: '간파 · 피해 2 · 끊기 · 독 2' },
  dg_chim:    { name: '독침', school: 'dang', type: '암', cost: 0, w: 0, target: 'one', dmg: 1, st: { poison: 1 }, token: true, exhaust: true, vfx: 'darts', desc: '피해 1 · 독 1 · 소멸 · 차례가 끝나면 흩날린다' },
  dg_chimu:   { name: '비침우', school: 'dang', type: '운', cost: 1, w: 0.5, target: 'self', make: 3, makeId: 'dg_chim', main: '독침 3장', vfx: 'poison', desc: '독침 3장 만들기' },
  dg_cheondok: { name: '천독수', school: 'dang', type: '공', cost: 1, w: 1, target: 'one', main: '독 터뜨림', vfx: 'acid', special: 'dokbal', desc: '대상의 독 ×1/1.5/2 만큼 곧바로 피해(독은 남는다)' },
  dg_dokyeon: { name: '독연', school: 'dang', type: '허', cost: 1, w: 1, target: 'all', trick: true, st: { poison: 2, weak: 1 }, main: '전체 독 2', vfx: 'toxcloud', desc: '간파 · 전체 독 2 · 약화 1' },
  dg_hwagol:  { name: '화골산', school: 'dang', type: '허', cost: 1, w: 1, target: 'one', st: { vuln: 2, poison: 2 }, main: '호신 녹임', vfx: 'poison', special: 'hwagol', desc: '대상의 호신을 모두 녹인다 · 내상 2 · 독 2' },
  dg_yeonhwan: { name: '연주표', school: 'dang', type: '암', cost: 0, w: 0.5, target: 'one', dmg: 1, vfx: 'darts', main: '독 암기 수', special: 'dgchain', desc: '피해 1 · 이번 차례 낸 암기 수만큼 독(최대 5)' },
  dg_haedok:  { name: '역독공', school: 'dang', type: '운', cost: 1, w: 0.5, target: 'self', retain: true, vfx: 'heal', special: 'haedok', main: '독 빨아 회복', desc: '축기 · 모든 적의 독 합÷3(최대 12)만큼 회복(손에 남을 때마다 +3)' },
  dg_dokryong: { name: '독룡폭', school: 'dang', type: '공', cost: 2, w: 2, target: 'all', only: 3, finisher: true, jc: 'dokryong', vfx: 'poison', special: 'dokryong', desc: '[3단 전용] 모든 적에게 각자의 독 ×3 피해(독은 남는다) · 주천 1단으로' },
  // ── 남궁: 3단까지 끌어올려 내리꽂는 제왕의 한 수 ──
  ng_changgung: { name: '창궁검', school: 'namgung', type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 8, 13], vfx: 'slashB', desc: '피해 5/8/13' },
  ng_mueo:    { name: '무애보', school: 'namgung', type: '운', cost: 0, w: 0.5, target: 'self', tier: 1, block: 3, vfx: 'wind', desc: '주천 +1 · 호신 3' },
  ng_jewang:  { name: '제왕검', school: 'namgung', type: '공', cost: 2, w: 2, target: 'one', dmg: [8, 14, 24], vfx: 'slashB', desc: '피해 8/14/24' },
  ng_cheongong: { name: '천공검기', short: '천공검기', school: 'namgung', type: '공', cost: 1, w: 1, target: 'all', dmg: [3, 5, 8], vfx: 'slashB', desc: '전체 피해 3/5/8' },
  ng_gyeonggeom: { name: '경검', school: 'namgung', type: '수', cost: 1, w: 1, target: 'self', block: [6, 7, 8], vfx: 'shield', special: 'cool', desc: '호신 6/7/8 · 과열을 식힌다(3단에 더 머물 수 있다)' },
  ng_noeun:   { name: '뇌운검', school: 'namgung', type: '공', cost: 1, w: 1, target: 'one', dmg: [4, 6, 9], vfx: 'slashB', special: 'noeun', desc: '피해 4/6/9 · 3단이면 내상 2' },
  ng_bonggeom: { name: '봉검', school: 'namgung', type: '운', cost: 1, w: 0.5, target: 'self', tier: 1, retain: true, vfx: 'gold', special: 'double', desc: '축기 · 주천 +1 · 다음 공격 카드 피해 두 배(손에 남을 때마다 +0.5배)' },
  ng_daegeom: { name: '대검진', school: 'namgung', type: '심', cost: 1, w: 1, target: 'self', power: 'daegeom', main: '3단 피해+3', vfx: 'slashB', desc: '심법 · 3단에서 내는 공격 카드 피해 +3' },
  ng_gaju:    { name: '가주령', school: 'namgung', type: '운', cost: 1, w: 0.5, target: 'self', energy: 2, draw: 1, tal: 1, vfx: 'gold', desc: '탈력1 · 내력 +2 · 1장 뽑기 — 다음 차례 내력을 당겨 쓴다' },
  ng_cheonha: { name: '천하제일검', short: '천하제일', school: 'namgung', type: '공', cost: 3, w: 2, target: 'one', only: 3, finisher: true, jc: 'cheonha', dmg: 40, vfx: 'slashB', desc: '[3단 전용] 피해 40 · 주천 1단으로' },
  ng_cheolbyeok: { name: '철벽', school: 'namgung', type: '수', cost: 1, w: 1, target: 'self', block: 8, counter: 2, vfx: 'shield', desc: '호신 8 · 반격 2' },
  ng_noejeong: { name: '뇌정검', school: 'namgung', type: '공', cost: 1, w: 1, target: 'one', dmg: [3, 6, 9], vfx: 'slashB', special: 'noejeong', desc: '피해 3/6/9 · 과열 중이면 두 배' },
  ng_nagil:   { name: '낙일검', school: 'namgung', type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 10, 18], finisher: true, vfx: 'slashB', desc: '피해 5/10/18 · 주천 1단으로' },
  ng_yanggeom: { name: '양검', school: 'namgung', type: '운', cost: 0, w: 0.5, target: 'self', retain: true, main: '내력 모음', vfx: 'gold', special: 'yanggeom', desc: '축기 · 손에 남은 차례마다 내력 +1(최대 3). 묵히지 않고 내면 아무 일도 없다' },
  ng_jewanggi: { name: '제왕기', school: 'namgung', type: '허', cost: 1, w: 1, target: 'all', trick: true, st: { weak: 2 }, main: '3단 끊기', vfx: 'roar', special: 'jewanggi', desc: '간파 · 전체 약화 2 · 3단이면 전체 끊기·절초 약화' },
  ng_geomsim: { name: '검심통명', school: 'namgung', type: '운', cost: 1, w: 0.5, target: 'self', tier: 1, draw: 1, vfx: 'wind', special: 'geomsim', desc: '주천 +1 · 1장 뽑기. 이미 3단이면 대신 과열을 식히고 2장 뽑기' },
  ng_mangeom: { name: '만검귀종', school: 'namgung', type: '공', cost: 2, w: 2, target: 'all', only: 3, finisher: true, jc: 'mangeom', vfx: 'slashB', special: 'mangeom', desc: '[3단 전용] 전체 피해 8 · 이번 차례 앞서 낸 공격마다 +6 · 주천 1단으로' },
  // ── 마교: 제 피를 태워 몰아친다. 출혈과 흡혈 ──
  mg_hyeolin: { name: '혈인', school: 'magyo', type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 7, 9], st: { bleed: 2 }, vfx: 'blood', desc: '피해 6/7/9 · 출혈 2' },
  mg_hyeolgeom: { name: '혈검', school: 'magyo', type: '공', cost: 0, w: 0.5, target: 'one', hpCost: 2, dmg: [6, 8, 10], vfx: 'blood', desc: '체력 2를 잃고 피해 6/8/10' },
  mg_heupsu:  { name: '흡수장', school: 'magyo', type: '공', cost: 1, w: 1, target: 'one', dmg: [4, 5, 6], vfx: 'blood', special: 'heupsu', desc: '피해 4/5/6 · 출혈 중인 적이면 준 피해만큼 회복' },
  mg_mabo:    { name: '마보', school: 'magyo', type: '운', cost: 0, w: 0.5, target: 'self', hpCost: 3, tier: 1, energy: 1, vfx: 'blood', desc: '체력 3을 잃고 주천 +1 · 내력 +1' },
  mg_hyeolgap: { name: '혈갑', school: 'magyo', type: '수', cost: 1, w: 1, target: 'self', block: [6, 7, 8], vfx: 'blood', special: 'hyeolgap', desc: '호신 6/7/8 · 체력이 절반 이하면 두 배' },
  mg_cheonma: { name: '천마군림보', short: '천마군림', school: 'magyo', type: '공', cost: 2, w: 1.5, target: 'all', dmg: [5, 7, 10], st: { bleed: 3 }, vfx: 'blood', desc: '전체 피해 5/7/10 · 전체 출혈 3' },
  mg_hyeolhae: { name: '혈해', school: 'magyo', type: '공', cost: 1, w: 1, target: 'one', vfx: 'blood', special: 'hyeolhae', desc: '피해 3 + 대상 출혈 ×2' },
  mg_mahwa:   { name: '마화입신', short: '마화입신', school: 'magyo', type: '심', cost: 1, w: 1, target: 'self', power: 'mahwa', main: '피 2→내력+1', vfx: 'blood', desc: '심법 · 차례 시작에 체력 2를 잃고 내력 +1' },
  mg_heupseong: { name: '흡성대법', school: 'magyo', type: '공', cost: 1, w: 1, target: 'one', dmg: 10, tal: 1, vfx: 'blood', special: 'heupseong', desc: '탈력1 · 피해 10 · 준 피해만큼 체력 회복' },
  mg_cheonmasin: { name: '천마신공', school: 'magyo', type: '공', cost: 2, w: 2, target: 'one', only: 3, finisher: true, jc: 'cheonmasin', vfx: 'blood', special: 'cheonmasin', desc: '[3단 전용] 잃은 체력만큼 피해(최대 60) · 주천 1단으로' },
  mg_hyeolmu: { name: '혈무', school: 'magyo', type: '허', cost: 1, w: 1, target: 'all', blunt: true, st: { weak: 2, bleed: 2 }, trick: true, vfx: 'blood', desc: '간파 · 전체 절초 약화 · 약화 2 · 출혈 2' },
  // ── 합격기: 문파가 다른 두 초식이 덱에 모이면 깨친다(보상에는 나오지 않는다) ──
  cb_taemae:  { name: '태극매화', school: 'combo', combo: true, type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 9, 12], make: 2, vfx: 'taiji', special: 'taemae', desc: '합격기 · 피해 6/9/12 · 되치기 자세(다음 차례까지) · 꽃잎 2장' },
  cb_hyeolu:  { name: '혈우비침', school: 'combo', combo: true, type: '암', cost: 1, w: 0.5, target: 'all', interrupt: true, vfx: 'darts', special: 'hyeolu', desc: '합격기 · 전체 끊기 · 출혈이 없으면 출혈 5, 있으면 출혈 두 배' },
  cb_geumtae: { name: '금강태극', school: 'combo', combo: true, type: '수', cost: 1, w: 1, target: 'self', block: 10, counter: 4, vfx: 'taiji', special: 'parry', desc: '합격기 · 호신 10 · 반격 4 · 되치기 자세(다음 차례까지)' },
  cb_changnak:{ name: '창궁낙화', school: 'combo', combo: true, type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 8, 13], make: 2, vfx: 'slashB', special: 'changnak', desc: '합격기 · 피해 5/8/13 · 꽃잎 2장 · 3단이면 이번 차례 꽃잎 피해 +3' },
  cb_nahyeol: { name: '나한혈권', school: 'combo', combo: true, type: '공', cost: 0, w: 1, target: 'one', hpCost: 3, vfx: 'blood', special: 'nahyeol', desc: '합격기 · 체력 3을 잃고 지금 호신만큼 피해(최대 30)' },
  cb_unbo:    { name: '운룡유보', school: 'combo', combo: true, type: '운', cost: 0, w: 0.5, target: 'self', setTo: 3, draw: 1, vfx: 'wind', special: 'cool', desc: '합격기 · 주천을 3단으로 · 과열을 식힌다 · 1장 뽑기' },
  cb_hyeolpo: { name: '혈포금강', school: 'combo', combo: true, type: '수', cost: 1, w: 1, target: 'self', block: 12, vfx: 'blood', special: 'hyeolpo', desc: '합격기 · 호신 12 · 체력이 절반 이하면 반격 6' },
  cb_tanji:   { name: '탄지신통', school: 'combo', combo: true, type: '암', cost: 0, w: 0.5, target: 'one', dmg: 3, hits: 3, interrupt: true, st: { bleed: 2 }, vfx: 'darts', desc: '합격기 · 3×3 연타 · 끊기 · 출혈 2' },
  cb_jewanghyeol: { name: '제왕혈검', school: 'combo', combo: true, type: '공', cost: 2, w: 1.5, target: 'one', dmg: [10, 16, 26], st: { bleed: 4 }, vfx: 'slashB', desc: '합격기 · 피해 10/16/26 · 출혈 4' },
  cb_cheolgeum: { name: '철벽금강', school: 'combo', combo: true, type: '수', cost: 1, w: 1, target: 'self', block: [10, 12, 14], counter: 3, draw: 1, vfx: 'shield', desc: '합격기 · 호신 10/12/14 · 반격 3 · 1장 뽑기' },
  cb_hando:   { name: '한독', school: 'combo', combo: true, type: '허', cost: 1, w: 1, target: 'all', st: { frost: 2, poison: 2 }, main: '한기·독 2', vfx: 'nova', desc: '합격기 · 전체 한기 2 · 전체 독 2' },
  cb_dongheol: { name: '동혈', school: 'combo', combo: true, type: '공', cost: 1, w: 1, target: 'one', dmg: [6, 8, 10], st: { frost: 2, bleed: 3 }, vfx: 'ice', desc: '합격기 · 피해 6/8/10 · 한기 2 · 출혈 3' },
  cb_dokmae:  { name: '독매', school: 'combo', combo: true, type: '암', cost: 1, w: 0.5, target: 'one', dmg: [3, 4, 5], st: { poison: 3 }, make: 2, vfx: 'petal', desc: '합격기 · 피해 3/4/5 · 독 3 · 꽃잎 2장' },
  cb_bingae:  { name: '창궁빙혼', school: 'combo', combo: true, type: '공', cost: 1, w: 1, target: 'one', dmg: [5, 8, 13], st: { frost: 3 }, vfx: 'ice', desc: '합격기 · 피해 5/8/13 · 한기 3' },
  // ── 덱이 없는 문파의 한 수(당가·개방·아미·곤륜·공동): 희귀 카드로 보상에 섞인다 ──
  oe_manchun:   { name: '만천화우', school: 'dang', type: '암', cost: 2, w: 1.5, target: 'all', dmg: 2, hits: 4, st: { poison: 3 }, tal: 1, vfx: 'darts', desc: '탈력1 · 전체 2×4 연타 · 전체 독 3' },
  oe_tagu:      { name: '타구봉법', school: 'gaebang', type: '공', cost: 1, w: 1, target: 'one', dmg: 6, interrupt: true, st: { weak: 2, vuln: 1 }, vfx: 'staff', desc: '피해 6 · 끊기 · 약화 2 · 내상 1' },
  oe_bokho:     { name: '복호장', school: 'emei', type: '수', cost: 1, w: 1, target: 'self', block: 6, tal: 1, vfx: 'heal', special: 'bokho', desc: '탈력1 · 체력 6 회복 · 호신 6' },
  oe_unryong:   { name: '운룡대팔식', short: '운룡팔식', school: 'gonryun', type: '운', cost: 1, w: 0.5, target: 'self', draw: 1, vfx: 'wind', special: 'unryong', desc: '1장 뽑기 · 다음 카드가 한 번 더 발동' },
  oe_chilsang:  { name: '칠상권', school: 'gongdong', type: '공', cost: 1, w: 1, target: 'one', hpCost: 4, dmg: [16, 18, 22], vfx: 'strong', desc: '체력 4를 잃고 피해 16/18/22' },
};
export const OUTER = ['oe_manchun', 'oe_tagu', 'oe_bokho', 'oe_unryong', 'oe_chilsang']; // 덱 없는 문파 초식

export const DECKS = {
  samryu: { name: '삼류 — 잡학', desc: '막싸움 덱으로 시작해 여러 문파의 초식을 주워 모은다. 한 차례에 문파를 바꿔 이어 낼수록 연환 피해가 더 오른다(잡학).',
    start: ['sr_samjae', 'sr_samjae', 'sr_samjae', 'sr_samjae', 'sr_makgi', 'sr_makgi', 'sr_makgi', 'sr_makgi', 'sr_sum', 'sr_morae'], pool: [] },
  hwasan: { name: '화산 — 꽃잎 연환', sect: '화산', res: '검기', desc: '꽃잎을 만들어 0내력으로 몰아치고, 검기를 모아 3단에서 「매화만개」로 터뜨린다.',
    start: ['ilseom', 'ilseom', 'ilseom', 'nakhwa', 'nakhwa', 'amhyang', 'amhyang', 'bichim', 'geomjin', 'mangae'],
    pool: ['ilseom', 'nakhwa', 'amhyang', 'biwol', 'bichim', 'heocho', 'geomjin', 'mangae', 'isipsa', 'yeonhwan', 'chilmae', 'amhyangbu'] },
  sorim: { name: '소림 — 금강 되받기', sect: '소림', res: '호신', desc: '1단에서 호신을 쌓아 반격과 「항마권」·「대력금강장」으로 되받는다. 1단에 두 차례 머물면 기가 차올라 2단이 되니, 「달마심법」·「염화지」로 내려온다.',
    start: ['nahan', 'nahan', 'nahan', 'geumgang', 'geumgang', 'cheolpo', 'yeomhwa', 'bantan', 'budong', 'dalma'],
    pool: ['nahan', 'geumgang', 'cheolpo', 'bantan', 'sajahu', 'yeomhwa', 'dalma', 'budong', 'hangma', 'nahanjin', 'daeryeok', 'chamseon', 'gyeonsu'] },
  mudang: { name: '무당 — 태극 균형', sect: '무당', desc: '주천을 2단에 맞춰 두고, 되치기로 받은 힘을 되돌린다. 「만류귀종」은 2단에서만.',
    start: ['md_yangui', 'md_yangui', 'md_yangui', 'md_yuun', 'md_yuun', 'md_taeguk', 'md_taeguk', 'md_seonhwan', 'md_myeonjang', 'md_manryu'],
    pool: ['md_yangui', 'md_yuun', 'md_taeguk', 'md_seonhwan', 'md_myeonjang', 'md_jwasu', 'md_taegeukgeom', 'md_jeonghwa', 'md_manryu', 'md_cheonji'] },
  namgung: { name: '남궁 — 제왕검', sect: '남궁', desc: '주천을 3단까지 끌어올려 한 방에 내리꽂는다. 과열을 식히며 버티다 「천하제일검」.',
    start: ['ng_changgung', 'ng_changgung', 'ng_changgung', 'ng_mueo', 'ng_mueo', 'ng_cheongong', 'ng_gyeonggeom', 'ng_gyeonggeom', 'ng_jewang', 'ng_noeun'],
    pool: ['ng_changgung', 'ng_mueo', 'ng_jewang', 'ng_cheongong', 'ng_gyeonggeom', 'ng_noeun', 'ng_bonggeom', 'ng_gaju', 'ng_cheonha', 'ng_cheolbyeok', 'ng_noejeong', 'ng_nagil', 'ng_yanggeom', 'ng_jewanggi', 'ng_geomsim', 'ng_mangeom'] },
  bukhae: { name: '북해빙궁 — 빙결', sect: '북해빙궁', desc: '한기를 쌓아 적을 늦추고 얼린다. 얼리면 한 수 쉬고, 깨면 크게 터진다. 주천을 내릴수록 냉기가 짙어진다.',
    start: ['bh_hanbing', 'bh_hanbing', 'bh_hanbing', 'bh_bingbyeok', 'bh_bingbyeok', 'bh_seolbo', 'bh_seolbo', 'bh_bingjeong', 'bh_bingsim', 'bh_soebing'],
    pool: ['bh_hanbing', 'bh_bingbyeok', 'bh_seolbo', 'bh_bingjeong', 'bh_bingmu', 'bh_bingsim', 'bh_seolhwa', 'bh_soebing', 'bh_dongkyeol', 'bh_hancheon', 'bh_mannyeon', 'bh_bukmyeong', 'bh_bingbaek'] },
  dang: { name: '사천당가 — 만독', sect: '사천당가', desc: '독은 줄지 않고 호신을 뚫는다. 암기와 독침으로 쌓고, 천독수·독룡폭으로 터뜨린다.',
    start: ['dg_bihwang', 'dg_bihwang', 'dg_bihwang', 'dg_doksu', 'dg_doksu', 'dg_eunsin', 'dg_eunsin', 'dg_dokmu', 'dg_dokmu', 'dg_sanhwa'],
    pool: ['dg_bihwang', 'dg_doksu', 'dg_eunsin', 'dg_dokmu', 'dg_sanhwa', 'dg_chimu', 'dg_cheondok', 'dg_dokyeon', 'dg_hwagol', 'dg_yeonhwan', 'dg_haedok', 'oe_manchun', 'dg_dokryong'] },
  magyo: { name: '마교 — 혈공', sect: '마교', desc: '제 체력을 태워 내력과 피해로 바꾼다. 출혈을 쌓고 빨아들이며, 많이 잃을수록 「천마신공」이 세진다.',
    start: ['mg_hyeolin', 'mg_hyeolin', 'mg_hyeolin', 'mg_hyeolgeom', 'mg_hyeolgeom', 'mg_mabo', 'mg_mabo', 'mg_hyeolgap', 'mg_hyeolgap', 'mg_cheonma'],
    pool: ['mg_hyeolin', 'mg_hyeolgeom', 'mg_heupsu', 'mg_mabo', 'mg_hyeolgap', 'mg_cheonma', 'mg_hyeolhae', 'mg_heupseong', 'mg_cheonmasin', 'mg_hyeolmu'] },
};

// 희귀도: 판을 바꾸는 카드는 드물게. 보상은 이미 모은 문파 쪽으로 기운다(삼류의 빌드가 흩어지지 않게)
const RARE = new Set([...OUTER, 'mangae', 'isipsa', 'chilmae', 'budong', 'hangma', 'daeryeok', 'md_taegeukgeom', 'md_manryu', 'ng_cheonha', 'ng_mangeom', 'mg_cheonmasin', 'mg_cheonma', 'bh_bukmyeong', 'bh_bingbaek', 'dg_dokryong']);
const UNCOMMON = new Set(['biwol', 'heocho', 'geomjin', 'yeonhwan', 'amhyangbu', 'sajahu', 'nahanjin', 'chamseon', 'gyeonsu', 'md_jwasu', 'md_jeonghwa', 'md_cheonji', 'ng_jewang', 'ng_noeun', 'ng_bonggeom', 'ng_gaju', 'ng_noejeong', 'ng_nagil', 'ng_jewanggi', 'ng_geomsim', 'bh_bingmu', 'bh_seolhwa', 'bh_soebing', 'bh_dongkyeol', 'bh_hancheon', 'bh_mannyeon', 'dg_chimu', 'dg_cheondok', 'dg_dokyeon', 'dg_hwagol', 'dg_yeonhwan', 'dg_haedok', 'mg_heupsu', 'mg_hyeolgap', 'mg_hyeolhae', 'mg_heupseong', 'mg_hyeolmu']);
export const rarity = id => (RARE.has(id) ? 2 : UNCOMMON.has(id) ? 1 : 0);
export const RARITY_NAME = ['일반', '고급', '희귀'];
export function rollCards(run, n = 3, kind = 'normal', exclude = [], other = false) { // other: 제 문파 밖에서만
  const free = other || !DECKS[run.school] || !DECKS[run.school].pool.length;
  const own = other && DECKS[run.school] ? DECKS[run.school].pool : [];
  const all = free ? [...new Set([...Object.values(DECKS).flatMap(d => d.pool), ...OUTER])].filter(id => !own.includes(id)) : DECKS[run.school].pool;
  const have = {}; for (const id of run.deck) have[CARDS[id].school] = (have[CARDS[id].school] || 0) + 1;
  const rw = kind === 'normal' ? [60, 32, 8] : [30, 45, 25], out = [];
  while (out.length < n) {
    const pool = all.filter(id => !out.includes(id) && !exclude.includes(id));
    if (!pool.length) break;
    const w = pool.map(id => rw[rarity(id)] * (free ? 1 + 0.7 * Math.min(3, have[CARDS[id].school] || 0) : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0;
    while ((r -= w[k]) > 0 && k < pool.length - 1) k++;
    out.push(pool[k]);
  }
  return out;
}

// 심법: 하나만 장착하고 언제든 바꿔 낀다. 제 효과(power) + 같은 문파 카드 시너지(공격 피해 +20% · 호신 +2)
// 얻는 곳: 시작(토납법) · 문파·가문 입문(SECT_SIM) · 심법서(BOOK_SIM) · 상점
export const SIMS = {
  tonap:     { name: '토납법', school: 'samryu', power: 'tonap', desc: '첫 차례에 카드 1장을 더 뽑는다' },
  jaha:      { name: '자하신공', school: 'hwasan', power: 'jaha', desc: '주천이 오를 때마다 검기 +2' },
  nakyeong:  { name: '매화심결', school: 'hwasan', power: 'nakyeong', desc: '꽃잎 피해 +3' },
  yeokgeun:  { name: '역근경', school: 'sorim', power: 'yeokgeun', desc: '1단으로 차례를 시작하면 호신 +3' },
  bulgoe:    { name: '금강불괴', school: 'sorim', power: 'bulgoeH', desc: '차례가 와도 호신이 절반 남는다(금강 염주와 함께면 전부)' },
  taeguk:    { name: '태극심법', school: 'mudang', power: 'eumyang', desc: '2단으로 차례를 시작하면 내력 +1 · 호신 3' },
  changgung: { name: '창궁심결', school: 'namgung', power: 'daegeom', desc: '3단에서 내는 공격 카드 피해 +3' },
  mahwa:     { name: '마화입신', school: 'magyo', power: 'mahwa', desc: '차례 시작에 체력 2를 잃고 내력 +1' },
  mandok:    { name: '만독불침', school: 'dang', power: 'mandok', desc: '출혈을 걸 때마다 1 더 · 차례 시작에 무작위 적 하나에 독 2' },
  bingbaek:  { name: '빙백신공', school: 'bukhae', power: 'bingbaek', desc: '주천이 한 단 내려갈 때마다 모든 적 한기 +1' },
  chwipal:   { name: '취팔선', school: 'gaebang', power: 'chwipal', desc: '체력이 절반 이하면 차례 시작에 흘려막기 1' },
};
export const SIM_SYN = { dmg: 0.2, block: 2 }; // 같은 문파 카드 시너지
export const SECT_SIM = { sorim: 'yeokgeun', hwasan: 'jaha', mudang: 'taeguk', magyo: 'mahwa', gaebang: 'chwipal', namgung: 'changgung', dang: 'mandok', bukhae: 'bingbaek' }; // 문파·가문에 들면 받는다
export const BOOK_SIM = { yeokgeun: 'yeokgeun', taegukSim: 'taeguk', jaha: 'jaha', mandok: 'mandok', chwipal: 'chwipal', cheonmaSin: 'mahwa' }; // 심법서(무공서 heart) → 심법
export const rollSim = run => { const free = Object.keys(SIMS).filter(k => !(run.sims || []).includes(k)); return free.length ? free[Math.floor(Math.random() * free.length)] : null; };

// 합격기 짝: 두 묶음에서 한 장씩 덱에 있으면 깨친다
export const COMBOS = [
  { id: 'cb_taemae', need: [['md_taeguk'], ['ilseom']] },
  { id: 'cb_hyeolu', need: [['bichim'], ['mg_hyeolin']] },
  { id: 'cb_geumtae', need: [['bantan'], ['md_taeguk']] },
  { id: 'cb_changnak', need: [['ng_changgung'], ['nakhwa']] },
  { id: 'cb_nahyeol', need: [['nahan'], ['mg_hyeolgeom']] },
  { id: 'cb_unbo', need: [['md_seonhwan'], ['ng_mueo']] },
  { id: 'cb_hyeolpo', need: [['cheolpo'], ['mg_hyeolgap']] },
  { id: 'cb_tanji', need: [['yeomhwa'], ['bichim']] },
  { id: 'cb_jewanghyeol', need: [['ng_jewang', 'ng_noeun'], ['mg_hyeolin']] },
  { id: 'cb_cheolgeum', need: [['ng_cheolbyeok'], ['geumgang']] },
  { id: 'cb_hando', need: [['bh_hanbing', 'bh_bingmu'], ['dg_doksu', 'dg_bihwang']] },
  { id: 'cb_dongheol', need: [['bh_hanbing'], ['mg_hyeolin']] },
  { id: 'cb_dokmae', need: [['dg_bihwang'], ['nakhwa', 'ilseom']] },
  { id: 'cb_bingae', need: [['ng_changgung'], ['bh_soebing']] },
];
export function checkCombos(run) { // 새로 깨친 합격기를 덱에 넣고 [{id, from: [이름, 이름]}]로 돌려준다
  run.combos ||= []; const out = [];
  for (const cb of COMBOS) {
    if (run.combos.includes(cb.id) || !cb.need.every(g => g.some(id => run.deck.includes(id)))) continue;
    run.combos.push(cb.id); run.deck.push(cb.id);
    out.push({ id: cb.id, from: cb.need.map(g => CARDS[g.find(id => run.deck.includes(id))].name) });
  }
  return out;
}
export function comboMade(id, run) { // 이 카드를 받으면 바로 깨칠 합격기
  return COMBOS.filter(cb => !(run.combos || []).includes(cb.id) && cb.need.some(g => g.includes(id)) && cb.need.every(g => g.includes(id) || g.some(o => run.deck.includes(o)))).map(cb => cb.id);
}
export function comboHint(id, run) { // 이 카드와 합이 맞을 짝(아직 못 깨친 것)
  const names = [];
  for (const cb of COMBOS) {
    if ((run.combos || []).includes(cb.id)) continue;
    const i = cb.need.findIndex(g => g.includes(id));
    if (i >= 0) names.push(CARDS[cb.need[1 - i][0]].name);
  }
  return names.length ? `합격 단서: 「${names.join('」「')}」와(과) 합이 맞을 것 같다` : '';
}

// 보물: 숫자보다 플레이 방식을 바꾼다. tag = 두목 보상 성향(공격·방어·주천·출혈·혈공·꽃잎·운기)
export const RELICS = {
  danjeon:   { name: '단전 옥', tag: '주천', desc: '1단으로 차례를 시작하면 내력 +1' },
  samhwa:    { name: '삼화취정', tag: '주천', desc: '3단에 닿는 순간 카드 2장 뽑기' },
  hori:      { name: '소환단 호리병', tag: '주천', desc: '절초 카드를 써도 주천이 2단까지만 내려간다' },
  cheongsim: { name: '청심 염주', tag: '주천', desc: '주화입마에 걸리지 않는다' },
  heavy:     { name: '천근추', tag: '주천', desc: '차례마다 내력 +1, 대신 손패가 4장' },
  taegeukpae:{ name: '태극패', tag: '주천', desc: '주천 단이 바뀔 때마다 호신 3' },
  maehwa:    { name: '매화 인장', tag: '꽃잎', desc: '검기가 차례마다 줄지 않는다' },
  fan:       { name: '매화 부채', tag: '꽃잎', desc: '차례 시작마다 꽃잎 1장' },
  geumgangR: { name: '금강 염주', tag: '방어', desc: '차례가 와도 호신이 절반 남는다' },
  moktak:    { name: '소림 목탁', tag: '방어', desc: '1단에서 차례의 첫 방어 카드가 한 번 더 발동' },
  gwisik:    { name: '귀식대법 비결', tag: '방어', desc: '전투마다 한 번, 체력이 30% 밑으로 떨어지면 체력 25% 회복 · 적 전체 끊기' },
  drunk:     { name: '취선 호로', tag: '공격', desc: '차례의 첫 공격 카드가 한 번 더 발동' },
  boots:     { name: '비연화', tag: '운기', desc: '카드 무게가 절반 — 많이 내도 다음 차례가 덜 밀린다' },
  scabbard:  { name: '낡은 검집', tag: '운기', desc: '차례가 끝날 때 손의 카드 한 장(무작위)이 남는다' },
  qiflow:    { name: '운기행공도', tag: '운기', desc: '운기 카드를 낼 때마다 1장 뽑기' },
  token:     { name: '무림맹 영패', tag: '운기', desc: '전리품 카드 선택지가 하나 더' },
  poisonbag: { name: '당가 독낭', tag: '독공', desc: '적에게 출혈을 걸 때마다 2 더 · 독을 걸 때마다 1 더' },
  dokheart:  { name: '독심', tag: '독공', desc: '차례 시작마다 독침 1장' },
  odok:      { name: '오독 단지', tag: '독공', desc: '독에 걸린 적이 쓰러지면 그 독의 절반이 다른 적들에게 옮는다' },
  hanok:     { name: '만년한옥', tag: '빙공', desc: '전투 첫 차례에 모든 적 한기 3' },
  icepin:    { name: '빙정 비녀', tag: '빙공', desc: '적을 빙결시킬 때마다 내력 +1' },
  darts:     { name: '소매 비침통', tag: '출혈', desc: '차례 시작마다 무작위 적 하나에 출혈 2' },
  bloodjade: { name: '혈옥', tag: '혈공', desc: '카드로 잃은 체력만큼 다음 공격 카드 피해 +' },
  hyeolpae:  { name: '혈마패', tag: '혈공', desc: '적을 쓰러뜨릴 때마다 체력 4 회복' },
  eumyangju: { name: '음양 구슬', tag: '주천', desc: '2단으로 차례를 시작하면 카드 1장 더' },
  yeokhaeng: { name: '역행 구결', tag: '주천', desc: '주천이 내려갈 때마다 카드 1장 뽑기' },
  hwaro:     { name: '화후 화로', tag: '주천', desc: '3단으로 차례를 시작하면 내력 +1 · 대신 주화입마 피해 두 배' },
  aekku:     { name: '애꾸 탈', tag: '주천', desc: '차례마다 내력 +1 · 대신 적의 다음 수가 보이지 않는다' },
  sutdol:    { name: '숫돌', tag: '공격', desc: '전투의 첫 공격 카드 피해 두 배' },
  soesasul:  { name: '연환 쇠사슬', tag: '공격', desc: '연환 피해 보너스가 두 배' },
  oesu:      { name: '외수 장갑', tag: '공격', desc: '손패의 마지막 한 장이 공격 카드면 피해 두 배' },
  baesu:     { name: '배수진 깃발', tag: '공격', desc: '체력이 절반 이하면 공격 피해 +25%' },
  hosim:     { name: '호심경', tag: '방어', desc: '차례마다 처음 얻는 호신 +4' },
  budongR:   { name: '부동 석판', tag: '방어', desc: '호신 15 이상으로 차례를 마치면 다음 차례 내력 +1' },
  musang:    { name: '무상 부적', tag: '방어', desc: '체력을 잃지 않고 이긴 전투마다 최대 체력 +2' },
  yalbi:     { name: '얇은 비급', tag: '운기', desc: '덱이 15장 이하면 차례마다 카드 1장 더' },
  jabgi:     { name: '잡기장', tag: '운기', desc: '덱이 30장 이상이면 차례마다 내력 +1' },
  seonsu:    { name: '선수 부적', tag: '운기', desc: '전투 첫 차례에 카드 2장 더' },
  chukgi:    { name: '축기 항아리', tag: '운기', desc: '쓰지 못한 내력은 2까지 다음 차례로 넘어간다' },
  gonggwi:   { name: '공수 두루마리', tag: '운기', desc: '차례마다 한 번, 손패를 다 내면 카드 2장 뽑기' },
  geumseo:   { name: '금서', tag: '운기', desc: '전리품 선택지가 하나 줄고, 대신 희귀한 카드가 잘 나온다' },
  hyangnang: { name: '매화 향낭', tag: '꽃잎', desc: '꽃잎 카드를 낼 때마다 호신 2' },
  geomgyeol: { name: '검결 족자', tag: '꽃잎', desc: '차례가 끝날 때 검기 1마다 호신 1' },
  ssangbi:   { name: '쌍비침', tag: '출혈', desc: '차례의 첫 암기 카드가 한 번 더 발동' },
  pilhyeol:  { name: '피 묻은 칼집', tag: '출혈', desc: '출혈이 걸린 적에게 주는 공격 피해 +25%' },
  hyeolmaeng:{ name: '혈맹서', tag: '혈공', desc: '전투 첫 차례에 체력 6을 잃고 내력 +2' },
  pimaeng:   { name: '피의 맹세', tag: '혈공', desc: '받는 회복이 절반 · 대신 공격 피해 +15%' },
  dokju:     { name: '독주잔', tag: '독공', desc: '독에 걸린 적을 공격할 때마다 독 +1' },
  simhan:    { name: '심한침', tag: '빙공', desc: '빙결이 풀려도 한기 3이 남는다' },
  seolsang:  { name: '설상비', tag: '빙공', desc: '차례 시작마다 한기 걸린 적 하나당 호신 2' },
  jupan:     { name: '주판', tag: '재물', desc: '전장 물건값 20% 할인' },
  uiseo:     { name: '의서', tag: '재물', desc: '객잔 휴식 회복 +20%' },
  yeopjeon:  { name: '엽전 점괘', tag: '재물', desc: '카드 전리품을 건너뛰면 은자 +40 (원래 +10)' },
};
export function rollRelics(run, n = 2, tag = null) { // 아직 없는 보물에서 — 성향이 맞는 것부터
  const free = Object.keys(RELICS).filter(k => !(run.relics || []).includes(k)), mix = a => [...a].sort(() => Math.random() - 0.5);
  const out = mix(tag ? free.filter(k => RELICS[k].tag === tag) : free).slice(0, n);
  return out.length < n ? [...out, ...mix(free.filter(k => !out.includes(k))).slice(0, n - out.length)] : out;
}

// 적 의도: atk(공격) guard(경계·대비) drain(경계·산공: 내 주천 −1·다음 내력 −1, 제 주천 +2) ult(절초 — 적 주천이 3단일 때만)
export const FOES = {
  sanjeok:   { hp: 20, intents: [{ k: 'atk', name: '칼질', dmg: 5, w: 3, vfx: 'slash' }, { k: 'atk', name: '난도질', dmg: 3, hits: 2, w: 1, vfx: 'slash' }, { k: 'guard', name: '방어', shield: 5, w: 1 }] },
  nangin:    { hp: 24, intents: [{ k: 'atk', name: '베기', dmg: 6, w: 3, vfx: 'slash' }, { k: 'drain', name: '점혈', w: 1 }, { k: 'ult', name: '발도술', dmg: 14, w: 1, vfx: 'slash' }] },
  deulgae:   { hp: 18, intents: [{ k: 'atk', name: '도끼질', dmg: 5, w: 3, vfx: 'slash' }, { k: 'atk', name: '난도질', dmg: 2, hits: 3, w: 1, vfx: 'slash' }, { k: 'guard', name: '버티기', shield: 4, w: 1 }] },
  sanjeokDu: { hp: 75, intents: [{ k: 'atk', name: '도끼질', dmg: 9, w: 3, vfx: 'slash' }, { k: 'drain', name: '호통', w: 1 }, { k: 'guard', name: '버티기', shield: 10, w: 1 }, { k: 'ult', name: '대부일격', dmg: 24, w: 1, vfx: 'slash' }] },
  heukpung:  { hp: 150, intents: [{ k: 'atk', name: '흑풍참', dmg: 6, hits: 2, w: 3, vfx: 'slash' }, { k: 'guard', name: '흑풍갑', shield: 12, w: 1 }, { k: 'drain', name: '흑풍회오리', w: 1 }, { k: 'ult', name: '파산부', dmg: 30, w: 1, vfx: 'slash' }] },
};
// 보스 기믹: 주천 2단에 이르면 보통 수 대신 제 수를 쓴다(1단 공격 → 2단 기믹 → 3단 절초). 절초가 아니므로 끊기로 막는다
// move 평소 수 · phase 2페이즈에 바뀌는 수 · undying 한 번 되살아나는 체력 비율 · label 머리 위 의도 · say 쓸 때 알려 주는 말
// acts: 최종보스 3막 — guard 호위 네임드(k 체력·공격 배율) · call 부를 때 · name 부활 초식 · rise 되살아날 때 · hp 되찾는 체력 · mul 강해지는 공격 배율 · spd 속도 배율 · tint 색
export const BOSS_KIT = {
  heukpung: { move: { k: 'gale', name: '흑풍회오리', label: '회오리', say: '호신이 날아가고 다음 차례 패 1장 적게' } },
  jangang: { move: { k: 'tide', name: '탁류', label: '탁류', n: 60, say: '내 다음 차례가 뒤로 밀린다' } },
  dangNo: { move: { k: 'venom', name: '산혼독', label: '산혼독', say: '다음 차례 카드를 낼 때마다 체력 −1' } },
  hyeolJang: { move: { k: 'leech', name: '흡성대법', label: '흡성', mul: 1.2, say: '막지 못한 피해의 두 배를 빨아들인다' } },
  cheonmaBoss: { move: { k: 'seal', name: '천마군림', label: '봉인 1', n: 1, style: 'dark', big: true, say: '다음 차례 패 1장이 검게 불탄다' }, phase: { k: 'seal', name: '멸겁마화', label: '봉인 2', n: 2, style: 'dark', big: true, say: '다음 차례 패 2장이 검게 불탄다' }, acts: { guard: 'sadae', k: 0.7, call: '천마가 쓰러졌다… 호법이 앞을 막는다!', name: '천마해체대법', rise: '천마가 피로 타오르며 되살아났다!', hp: 0.8, mul: 1.3, spd: 1.2, tint: [1.3, 0.75, 0.75] } },
  maengju: { move: { k: 'seal', name: '정천검', label: '봉인 1', n: 1, style: 'chain', big: true, say: '다음 차례 패 1장이 묶인다' }, phase: { k: 'seal', name: '만검귀종', label: '봉인 2', n: 2, style: 'chain', big: true, say: '다음 차례 패 2장이 묶인다' }, acts: { guard: 'm_sorim', k: 0.7, call: '맹주가 쓰러졌다… 소림 방장이 앞을 막는다!', name: '정천귀일', rise: '맹주가 금빛을 두르고 되살아났다!', hp: 0.8, mul: 1.3, spd: 1.2, tint: [1.3, 1.15, 0.7] } },
  y_jegal: { move: { k: 'array', name: '팔괘진', label: '팔괘진', n: 2, say: '두 차례 동안 내력 −1 · 허초나 암기를 내면 진이 깨진다' } },
  sadae: { move: { k: 'tierlock', name: '천마압', label: '주천 봉쇄', say: '주천이 1단으로 떨어지고 다음 차례에 오르지 못한다' } },
  mb_gwiyeong: { move: { k: 'shade', name: '귀화', label: '잔상', say: '다음 공격 하나를 피한다' } },
  mb_heukryong: { move: { k: 'seal', name: '용조쇄', label: '쇠사슬', n: 1, style: 'chain', costly: true, say: '다음 차례 가장 비싼 패 1장이 묶인다' } },
  mb_odok: { move: { k: 'curse', name: '사갈독무', label: '독기 2', n: 2, say: '다음 패에 독기 2장 — 내지 않으면 체력 −3씩' } },
  mb_gangsiwang: { undying: 0.3 },
  mb_seolma: { move: { k: 'seal', name: '빙결', label: '빙결 1', n: 1, style: 'ice', say: '다음 차례 패 1장이 얼어붙는다' } },
  m_bukhae: { move: { k: 'seal', name: '빙백봉혈', label: '빙결 2', n: 2, style: 'ice', big: true, say: '다음 차례 패 2장이 얼어붙는다' } },
  // 구파일방 장문인
  m_sorim: { move: { k: 'iron', name: '달마역근', label: '금강 호신', n: 0.22, say: '금강불괴 — 호신이 크게 쌓인다 · 허초나 암기를 내면 깨진다' } },
  m_mudang: { move: { k: 'mirror', name: '면장', label: '되돌림', say: '다음 수까지 내 공격 피해의 절반이 되돌아온다' } },
  m_hwasan: { move: { k: 'bud', name: '암향표', label: '봉오리', t: 2, n: 0.16, say: '두 차례 안에 피해를 몰아 꽃봉오리를 깨지 못하면 만개한다' } },
  m_gaebang: { move: { k: 'summon', name: '타구진', label: '방도 호출', id: 'gaebangdo', say: '방도 둘이 달려온다' } },
  m_emei: { move: { k: 'pray', name: '정심주', label: '회복', n: 0.2, say: '크게 회복하고 약화·내상·출혈을 털어 낸다' } },
  m_cheongseong: { move: { k: 'haste', name: '송학보', label: '연속 행동', say: '곧바로 한 번 더 움직인다' } },
  m_jongnam: { move: { k: 'tierlock', name: '천강압', label: '주천 봉쇄', say: '주천이 1단으로 떨어지고 다음 차례에 오르지 못한다' } },
  m_gonryun: { move: { k: 'cloud', name: '운중보', label: '구름 은신', say: '다음 수까지 단일 공격이 닿지 않는다 — 전체 공격과 출혈만 닿는다' } },
  m_gongdong: { move: { k: 'wound', name: '칠상권', label: '칠상', mul: 1.1, cut: 8, say: '막지 못하면 최대 체력이 깎인다' } },
};
export const FIGHTS = [
  { name: '졸개 무리', ids: ['sanjeok', 'nangin', 'deulgae'], kind: 'normal' },
  { name: '산적 두목', ids: ['sanjeokDu', 'sanjeok'], kind: 'elite' },
  { name: '흑풍채주', ids: ['heukpung'], kind: 'boss' },
];
