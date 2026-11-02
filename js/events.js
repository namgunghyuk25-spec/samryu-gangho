// events.js — 삼류강호 기연(이벤트)
// choice.run(api) → 결과 문자열. regions: 등장 지역 인덱스(생략 시 전 지역)
// text: 문자열 또는 a => 문자열(판마다 다른 상황). 변형 기연은 V()로 감싸 text가 고른 값(s.v 등)을 choices가 같이 읽는다
// api: region geo realm level gold rand hurt heal stat give(book/school/magyo/pill/card/relic/sim — sim은 무공서 모드에서 '') learnSim(id, 한 줄) pill usePill removeCard has hasSchool train exp fight duel
const V = f => f({ v: 0, k: 'sorim', g: 30 });
const pickIdx = (a, n) => Math.floor(a.rand() * n);
const SCHOOL = { sorim: '소림', mudang: '무당', hwasan: '화산', dang: '사천당가', gaebang: '개방', emei: '아미', cheongseong: '청성', jongnam: '종남', gonryun: '곤륜', gongdong: '공동', namgung: '남궁세가' };
const SK = Object.keys(SCHOOL);
const MASTER_SK = ['sorim', 'gaebang', 'mudang', 'emei', 'cheongseong', 'hwasan', 'jongnam', 'gonryun', 'gongdong']; // m_<key> 장문인이 있는 문파
const MOBS = [['sanjeok', 'nangin', 'deulgae'], ['sujeok', 'sapa', 'suri'], ['dokin', 'amgi', 'dokpyo'], ['hyeolgyo', 'gangsi', 'hyeollang'], ['magyodo', 'hyeolmaSa', 'seollang']];

export const EVENTS = [
  { title: '무너진 동굴', text: '절벽 아래 동굴 안쪽에서 낡은 함이 보인다. 천장이 위태롭다.', choices: [
    { label: '함을 연다', run: a => a.rand() < 0.65 ? a.give('book', 1) : (a.hurt(0.25), '돌무더기가 무너졌다! 체력 -25%') },
    { label: '그냥 지나간다', run: () => '위험한 일은 피하는 것도 무공이다.' } ] },
  { title: '부상당한 노인', text: '길가에 피투성이 노인이 쓰러져 있다. "젊은이… 약이 있는가…"', choices: [
    { label: '금창약을 건넨다', need: a => a.pill('geumchang'), run: a => (a.usePill('geumchang'), '"은혜는 갚아야지." 노인이 품에서 비급을 꺼냈다. ' + (a.give('sim') || a.give('book', 2))) },
    { label: '은자 20냥을 준다', need: a => a.gold >= 20, run: a => (a.gold -= 20, a.stat('maxHp', 12), '노인이 혈도를 짚어 주었다. 최대체력 +12') },
    { label: '외면한다', run: () => '등 뒤로 기침 소리가 멀어졌다.' } ] },
  { title: '폭포 수련', text: '거센 폭포가 바위를 때린다. 저 아래서 버티면 몸이 단련될 것 같다.', choices: [
    { label: '폭포 아래 앉는다 (체력 -20%)', run: a => (a.hurt(0.2), a.rand() < 0.5 ? (a.stat('maxHp', 8), '물살에 뼈마디가 단단해졌다. 체력 -20%, 최대체력 +8') : '갈라지는 물줄기 사이로 초식이 보였다. 체력 -20% ' + a.give('card')) },
    { label: '세수만 한다', run: a => (a.heal(0.15), '시원하다. 체력 15% 회복') } ] },
  { title: '사파 고수의 거래', text: '복면인이 검은 책을 내민다. "마공이지. 대가는… 네 피 조금."', choices: [
    { label: '받는다 (최대체력 -10)', run: a => (a.stat('maxHp', -10), a.give('magyo')) },
    { label: '거절한다', run: () => '"겁쟁이 녀석." 복면인이 사라졌다.' } ] },
  { title: '객주 도박판', text: '주사위 소리가 요란하다. "한 판에 은자 15냥! 이기면 두 배!"', choices: [
    { label: '한 판 건다', need: a => a.gold >= 15, run: a => a.rand() < 0.5 ? (a.gold += 15, '이겼다! 은자 +15') : (a.gold -= 15, '졌다… 은자 -15') },
    { label: '구경만 한다', run: () => '노름은 패가망신이다.' } ] },
  { title: '영약 발견', text: '바위틈에 기이한 버섯이 빛나고 있다.', choices: [
    { label: '먹는다', run: a => a.rand() < 0.6 ? (a.stat('maxHp', 6), a.heal(1), '기혈이 차오른다! 최대체력 +6, 완전 회복') : (a.hurt(0.2), '독버섯이었다… 체력 -20%') },
    { label: '챙겨둔다', run: a => a.give('part') } ] },
  { title: '산적 통행세', text: '"여긴 우리 길이다. 은자 25냥 내놓든가 목을 내놓든가."', choices: [
    { label: '낸다', need: a => a.gold >= 25, run: a => (a.gold -= 25, '아깝지만 길을 지났다.') },
    { label: '싸운다', run: a => a.fight() } ] },
  { title: '은거 기인', text: '정자에 앉은 노인이 바둑돌을 놓으며 묻는다. "자네 무공, 한 수 봐줄까?"', choices: [
    { label: '가르침을 청한다', run: a => a.train() || '"아직 배울 게 없군." 노인이 웃었다.' },
    { label: '대국을 둔다', run: a => (a.gold += 20, '이겼다. 노인이 은자 20냥을 던져 주었다.') } ] },

  // ───────── 지역 기연 ─────────
  { title: '표국의 의뢰', regions: [0], text: '낙양 표국의 표두가 다급히 붙잡는다. "흑풍채 소굴을 지나야 하오. 호위 좀 서 주시오!"', choices: [
    { label: '호위를 맡는다 (정예 전투)', run: a => (a.gold += 20, '선금 은자 +20. 산적 두목이 수레를 막아섰다! ' + a.fight(['sanjeokDu', 'sanjeok'], 'elite')) },
    { label: '표물을 슬쩍한다', run: a => a.rand() < 0.5 ? '아무도 못 봤다. ' + a.give('part') : (a.gold -= 20, a.hurt(0.1), '표사들에게 몰매를 맞았다. 은자 -20, 체력 -10%') },
    { label: '샛길만 알려 준다', run: a => (a.gold += 10, '"고맙소, 협객." 표두가 은자를 쥐여 주었다. 은자 +10') } ] },
  { title: '장강 검문', regions: [1], text: '나룻배가 수채 쾌선에 가로막혔다. "통행세다! 배에 탄 놈들, 은자 몽땅 내놔라!"', choices: [
    { label: '맞서 싸운다 (정예 전투)', run: a => '수채 부채주가 뱃전으로 뛰어올랐다! ' + a.fight(['subu', 'sujeok'], 'elite') },
    { label: '벽력탄을 던진다', need: a => a.pill('byeokryeok'), run: a => (a.usePill('byeokryeok'), a.gold += 35, '쾅! 쾌선이 뒤집혔다. 건져 올린 은자 +35') },
    { label: '강물로 뛰어든다 (체력 -15%)', run: a => (a.hurt(0.15), '물살을 헤치고 강기슭에 닿았다. 체력 -15%') } ] },
  { title: '당가 독초밭', regions: [2], text: '보랏빛 독초밭 한가운데 천년삼 잎이 보인다. 팻말엔 당가 표식과 "들어오는 자, 죽는다."', choices: [
    { label: '약초를 캔다 (중독 위험)', run: a => a.pill('haedok') ? (a.usePill('haedok'), '해독단으로 독기를 버텼다. 해독단 -1 ' + a.give('part', 'D')) : (a.hurt(0.2), '독기가 스몄다. 체력 -20% ' + a.give('part', 'D')) },
    { label: '독기를 흡수한다 (당문)', need: a => a.hasSchool('dang'), run: a => '독기를 단전에 갈무리하자 독수(毒手)의 결이 잡혔다. ' + a.give('card', 'dang') },
    { label: '돌아선다', run: () => '당가 밭에 손대는 건 목숨이 둘인 자의 일이다.' } ] },
  { title: '혈교의 제단', regions: [3], text: '핏빛 제단에 포로들이 묶여 있다. 제단 위엔 혈옥 비급 한 권, 혈교도들은 의식에 취해 있다.', choices: [
    { label: '포로를 구한다 (정예 전투)', run: a => (a.stat('maxHp', 10), '협의가 기혈을 끓게 한다. 최대체력 +10. 호법이 덮친다! ' + a.fight(['hyeolHobeop', 'hyeolgyo'], 'elite')) },
    { label: '비급만 낚아챈다 (위험)', run: a => a.rand() < 0.5 ? (a.hurt(0.15), '혈진을 뚫고 비급을 낚아챘다. 체력 -15% ' + a.give('magyo')) : (a.hurt(0.3), '혈진에 걸려 피를 쏟았다. 체력 -30%') },
    { label: '숨어서 지나친다', run: () => '비명이 등 뒤에서 오래도록 이어졌다.' } ] },
  { title: '천산 설동', regions: [4], text: '눈보라를 피해 든 동굴 깊은 곳. 얼음 속에 가부좌한 고수의 유해가 비급을 품고 있다.', choices: [
    { label: '얼음을 깬다 (빙장수 전투)', run: a => '얼음을 깨 비급을 꺼냈다. ' + (a.give('sim') || a.give('book')) + ' 굉음에 빙궁의 무인들이 몰려온다! ' + a.fight(['seollang', 'seollang', 'seollang'], 'normal') },
    { label: '곁에서 운기한다 (체력 -15%)', run: a => (a.hurt(0.15), '뼈를 에는 한기 속에 잡념이 얼어 떨어졌다. 체력 -15% ' + (a.removeCard() || (a.stat('maxHp', 6), '최대체력 +6'))) },
    { label: '삼배하고 떠난다', run: a => (a.heal(0.1), '선배 고수께 예를 올리니 마음이 맑다. 체력 10% 회복') } ] },
  { title: '마교 변절자', regions: [3, 4], text: '피투성이 마교도가 무릎을 꿇는다. "추격대가 오고 있소. 숨겨 주면 마공 구결을 드리리다."', choices: [
    { label: '숨겨 준다 (추격대 전투)', run: a => '구결을 받았다. ' + a.give('magyo') + ' 추격대가 들이닥쳤다! ' + a.fight(a.geo === 4 ? ['magyodo', 'hyeolmaSa', 'magyodo'] : ['hyeolgyo', 'hyeolgyo', 'hyeollang'], 'normal') },
    { label: '추격대에 넘긴다', run: a => (a.gold += 30, '추격대가 은자를 던져 주었다. 뒷맛이 쓰다. 은자 +30') },
    { label: '못 본 척 지나간다', run: () => '등 뒤에서 짧은 비명이 들렸다.' } ] },

  // 하남 — 흑풍채 · 숭산
  V(s => ({ title: '투항한 졸개', regions: [0], text: a => (s.v = pickIdx(a, 3), '흑풍채 졸개가 무릎을 꿇는다. "목숨만 살려 주시면 두목의 은닉처를 알려 드립지요." ' + ['눈빛만은 맑다.', '말끝마다 눈알을 굴린다.', '다리를 절며 연신 굽실댄다.'][s.v]), choices: [
    { label: '은닉처로 따라간다', run: a => s.v === 1 ? (a.gold += 15, '골짜기에 들어서자 휘파람 소리! 매복이다. 졸개가 흘린 전낭 은자 +15<br>' + a.fight(['sanjeok', 'nangin', 'deulgae'], 'normal')) : (a.gold += 40, '바위 밑 항아리에서 은자가 쏟아졌다. 은자 +40 ' + a.give('pill', 'geumchang')) },
    { label: '관아에 넘긴다', run: a => (a.gold += 20, '포졸이 졸개를 끌고 갔다. 포상 은자 +20') },
    { label: '놓아준다', run: a => s.v === 1 ? '졸개는 뒤도 안 돌아보고 달아났다.' : '졸개가 넙죽 절하고 약봉지 하나를 내려놓았다. ' + a.give('pill', 'geumchang') } ] })),
  V(s => ({ title: '숭산 탑림', regions: [0], text: a => (s.v = pickIdx(a, 2), ['소림사 탑림, 늙은 승려가 낙엽을 쓸며 중얼거린다. "쓸어도 쓸어도 번뇌로다."', '소림사 탑림, 젊은 무승이 탑 앞에서 백팔배를 올린다. 경전각 문이 반쯤 열려 있다.'][s.v]), choices: [
    { label: '백팔배를 올린다 (체력 -15%)', run: a => (a.hurt(0.15), '무릎이 깨지도록 절을 올렸다. 체력 -15% ' + (a.removeCard() || (a.stat('maxHp', 5), '마음이 단단해졌다. 최대체력 +5'))) },
    { label: '경전을 필사한다 (은자 25)', need: a => a.gold >= 25, run: a => (a.gold -= 25, (s.v ? '무승이 지필묵값을 받고 눈감아 주었다.' : '"시주는 받아 두지." 노승이 경전을 펼쳐 주었다.') + ' 은자 -25 ' + a.give('card', 'sorim')) },
    { label: '합장하고 떠난다', run: a => (a.heal(0.1), '탑림의 바람이 서늘하다. 체력 10% 회복') } ] })),
  V(s => ({ title: '버려진 산채', regions: [0], text: a => (s.v = pickIdx(a, 3), '내분으로 무너진 흑풍채 산채. ' + ['텅 빈 두목 방에 철궤 하나만 덩그러니 남았다.', '잔당 둘이 두목의 철궤를 두고 칼부림 직전이다.', '불길이 번진다. 연기 너머 두목 방에 철궤가 보인다.'][s.v]), choices: [
    { label: '철궤를 차지한다 (위험)', run: a => {
      const loot = a.rand() < 0.5 ? a.give('relic') : (a.gold += 40, '은자 +40');
      if (s.v === 1) return '철궤를 걷어차 열었다. ' + loot + '<br>잔당들이 칼끝을 돌렸다! ' + a.fight(['sanjeok', 'deulgae'], 'normal');
      a.hurt(s.v === 2 ? 0.25 : 0.1);
      return (s.v === 2 ? '불길을 뚫고 철궤를 끌어냈다. 체력 -25% ' : '자물쇠에서 독침이 튀었다. 체력 -10% ') + loot; } },
    { label: '흩어진 은자만 줍는다', run: a => (a.gold += 15, '바닥에 흘린 은자를 주워 담았다. 은자 +15') },
    { label: '돌아선다', run: () => '도적의 재물은 피 냄새가 난다.' } ] })),

  // 장강 — 수채 · 무당 · 남궁
  V(s => ({ title: '침몰한 관선', regions: [1], text: a => (s.v = pickIdx(a, 2), ['갈수기라 강물이 줄었다. 물결 사이로 가라앉은 관선의 돛대가 드러났다.', '어부가 그물에 걸린 금박 상자 조각을 들어 보인다. "저 여울 밑에 관선이 가라앉았소. 수적 놈들도 노리는 중이오."'][s.v]), choices: [
    { label: '잠수한다 (체력 -15%)', run: a => { a.hurt(0.15); const loot = a.rand() < 0.35 ? '선실 깊은 곳에서 함 하나를 건졌다. ' + a.give('relic') : (a.gold += 30, '녹슨 은괴를 건졌다. 은자 +30'); return '찬 물살을 헤집었다. 체력 -15%<br>' + loot + (s.v ? '<br>물 밖에 수적들이 기다리고 있었다! ' + a.fight(['sujeok', 'sujeok', 'sapa'], 'normal') : ''); } },
    { label: '뱃사람들에게 위치를 판다', run: a => (a.gold += 20, '뱃사람들이 앞다퉈 은자를 내밀었다. 은자 +20') },
    { label: '지나친다', run: () => '강은 삼킨 것을 쉽게 내놓지 않는다.' } ] })),
  { title: '무당산 운무', regions: [1], text: '운무 낀 무당산 자락, 늙은 도사가 홀로 태극권을 펼친다. 움직임이 물처럼 느리다.', choices: [
    { label: '곁에서 따라 한다 (체력 -10%)', run: a => (a.hurt(0.1), '느린 것이 더 힘들다. 체력 -10% ' + a.give('card', 'mudang')) },
    { label: '도관에 시주한다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, a.heal(0.2), '"비우는 것도 공부지." 은자 -30, 체력 20% 회복<br>' + (a.removeCard() || (a.stat('maxHp', 5), '덜어낼 것이 없구먼. 최대체력 +5'))) },
    { label: '구경만 한다', run: a => (a.heal(0.1), '보기만 해도 숨이 고르다. 체력 10% 회복') } ] },
  V(s => ({ title: '남궁세가의 의뢰', regions: [1], text: a => (s.v = pickIdx(a, 2), '창궁검을 수놓은 무사가 다가온다. "남궁세가요. ' + ['세가 화물선을 턴 수채 부채주를 쫓고 있소.', '세가 영역에 숨어든 사파 무리를 쫓고 있소.'][s.v] + ' 손을 보태 주겠소?"'), choices: [
    { label: '의뢰를 받는다 (전투)', run: a => (a.gold += 25, '선금 은자 +25. ' + (s.v ? '사파 무리가 칼을 뽑았다! ' + a.fight(['sapa', 'sapa', 'suri'], 'normal') : '수채 부채주가 막아선다! ' + a.fight(['subu', 'sujeok'], 'elite'))) },
    { label: '검법 한 수를 청한다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, '"세가 밖으로는 반 수만이오." 은자 -40 ' + a.give('card', 'namgung')) },
    { label: '사양한다', run: () => '"아쉽구려." 무사가 포권하고 물러났다.' } ] })),

  // 사천 — 당가 · 아미 · 독
  V(s => ({ title: '당가 외문 상인', regions: [2], text: a => (s.v = pickIdx(a, 3), '당가 표식을 단 상인이 보따리를 푼다. "외문 물건이오. 오늘은 ' + ['벽력탄', '해독단', '대력환'][s.v] + ' 두 알에 은자 20냥!"'), choices: [
    { label: '산다 (은자 20)', need: a => a.gold >= 20, run: a => (a.gold -= 20, '은자 -20 ' + a.give('pill', ['byeokryeok', 'haedok', 'daeryeok'][s.v], 2)) },
    { label: '독침을 받아 본다 (체력 -15%)', run: a => (a.hurt(0.15), '"이걸 버티다니!" 상인이 혀를 내두르며 당가 수법 하나를 귀띔했다. 체력 -15% ' + a.give('card', 'dang')) },
    { label: '지나친다', run: () => '당가 물건은 값보다 뒤탈이 무섭다.' } ] })),
  { title: '아미산 비구니', regions: [2], text: '아미산 길목, 젊은 비구니가 독상 입은 나무꾼을 돌보고 있다. "해독할 약초가 모자라요…"', choices: [
    { label: '독초 골짜기를 뒤진다 (체력 -15%)', run: a => (a.hurt(0.15), a.stat('maxHp', 8), '"아미타불, 은혜는 잊지 않을게요." 비구니가 막힌 혈맥을 틔워 주었다. 체력 -15%, 최대체력 +8') },
    { label: '해독단을 내준다 (해독단 -1)', need: a => a.pill('haedok'), run: a => (a.usePill('haedok'), '"아미의 수법이에요. 사람 살리는 데 쓰세요." ' + a.give('card', 'emei')) },
    { label: '갈 길을 간다', run: () => '등 뒤로 염불 소리가 이어졌다.' } ] },
  { title: '오독곡 어귀', regions: [2], text: '독안개 자욱한 골짜기, 당가 독검수들이 길목을 지킨다. 골짜기를 지나면 길이 반나절 짧다.', choices: [
    { label: '정면으로 뚫는다 (정예 전투)', run: a => '"지나가려면 칼로 말해라!" ' + a.fight(['dangDok', 'dokpyo'], 'elite') },
    { label: '해독단을 삼키고 안개를 지난다 (해독단 -1)', need: a => a.pill('haedok'), run: a => (a.usePill('haedok'), a.gold += 30, '안개 속에 쓰러진 상인의 전낭을 주웠다. 은자 +30') },
    { label: '산길로 돌아간다 (체력 -10%)', run: a => (a.hurt(0.1), '험한 산길에 발이 부르텄다. 체력 -10%') } ] },

  // 섬서 — 혈교 · 화산 · 종남
  V(s => ({ title: '혈지(血池)', regions: [3], text: a => (s.v = pickIdx(a, 2), '혈교 지부 뒤뜰, 검붉은 못이 끓는다. 피를 바치면 군더더기 무공이 녹아내린다는 사술이다. ' + ['의식이 막 끝나 아무도 없다.', '혈검수 둘이 못가에서 졸고 있다.'][s.v]), choices: [
    { label: '피를 바친다 (최대체력 -8)', run: a => { a.stat('maxHp', -8); const r = [a.removeCard(), a.removeCard()].filter(Boolean).join('<br>'); return '살갗이 타들어 간다. 최대체력 -8<br>' + (r || '녹일 것이 없었다. 피만 버렸다.') + (s.v ? '<br>혈검수들이 눈을 떴다! ' + a.fight(['gangsi', 'gangsi'], 'normal') : ''); } },
    { label: '못을 흙으로 메운다', run: a => s.v ? '삽질 소리에 혈검수들이 깨어났다! ' + a.fight(['gangsi', 'gangsi'], 'normal') : (a.heal(0.15), '사술의 자리를 묻었다. 마음이 개운하다. 체력 15% 회복') },
    { label: '지나친다', run: () => '피비린내가 옷에 배었다.' } ] })),
  { title: '화산 매화림', regions: [3], text: '화산 기슭 매화림에 꽃잎이 눈처럼 진다. 바위 하나엔 종남파 고수의 검흔이 깊게 패어 있다.', choices: [
    { label: '지는 꽃잎을 벤다 (체력 -10%)', run: a => (a.hurt(0.1), '한 호흡에 꽃잎 스물넷을 베었다. 체력 -10% ' + a.give('card', 'hwasan')) },
    { label: '검흔을 탁본한다 (은자 15)', need: a => a.gold >= 15, run: a => (a.gold -= 15, '먹과 종이를 구해 검흔을 떴다. 은자 -15 ' + a.give('card', 'jongnam')) },
    { label: '꽃 아래서 쉰다', run: a => (a.heal(0.2), '매화 향에 기혈이 풀린다. 체력 20% 회복') } ] },
  V(s => ({ title: '혈교 금고', regions: [3], text: a => (s.v = pickIdx(a, 2), '혈교 지부 지하, 핏빛 쇠문 너머가 금고다. ' + ['혈교 호법이 직접 문을 지키고 있다.', '금고지기는 술에 곯아떨어졌고, 쌍도객 몇이 노름판을 벌였다.'][s.v]), choices: [
    { label: '금고를 턴다 (전투)', run: a => '쇠문을 부수고 금고 깊숙이 손을 넣었다. ' + a.give('relic') + '<br>' + (s.v ? '쌍도객들이 노름판을 엎고 덤빈다! ' + a.fight(['hyeollang', 'hyeollang', 'hyeolgyo'], 'normal') : '호법이 혈장을 뻗어 온다! ' + a.fight(['hyeolHobeop', 'hyeolgyo'], 'elite')) },
    { label: '바깥 궤짝만 챙긴다 (체력 -10%)', run: a => (a.hurt(0.1), a.gold += 35, '궤짝을 안고 뛰다 벽에 부딪혔다. 체력 -10%, 은자 +35') },
    { label: '물러난다', run: () => '혈교의 재물에 손대면 피로 갚는다.' } ] })),

  // 천산 — 마교 · 눈
  V(s => ({ title: '천산설련', regions: [4], text: a => (s.v = pickIdx(a, 3), ['깎아지른 빙벽 끝에 천산설련 한 송이가 피었다. 발 디딜 곳이 위태롭다.', '천산설련 곁에 빙궁의 빙장수 둘이 진을 치고 지킨다.', '누군가 설련을 캐 가고 뿌리만 남았다. 그래도 영기가 서려 있다.'][s.v]), choices: [
    { label: '설련을 취한다 (위험)', run: a => s.v === 1 ? (a.stat('maxHp', 12), '빙장수들 눈앞에서 설련을 삼켰다. 최대체력 +12<br>' + a.fight(['seollang', 'seollang'], 'normal'))
      : s.v === 2 ? (a.stat('maxHp', 5), a.heal(0.2), '뿌리를 씹었다. 최대체력 +5, 체력 20% 회복')
      : a.rand() < 0.6 ? (a.stat('maxHp', 15), a.heal(1), '빙벽을 기어올라 설련을 땄다! 최대체력 +15, 완전 회복') : (a.hurt(0.25), '발밑 얼음이 부서졌다! 체력 -25%') },
    { label: '눈을 녹여 마신다', run: a => (a.heal(0.15), '설수가 오장을 씻는다. 체력 15% 회복') } ] })),
  V(s => ({ title: '신교 검문', regions: [4], text: a => (s.v = pickIdx(a, 3), '눈 덮인 고갯마루, 신교 외당의 검문이다. ' + ['"통행세 은자 30냥. 내면 구결 한 장은 덤이다."', '"신교에 공물 30냥을 바쳐라. 바치는 자는 신교의 무공을 엿볼 자격이 있다."', '"30냥이다. 싫으면 눈 속에 묻혀라."'][s.v]), choices: [
    { label: '은자를 바친다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, s.v === 2 ? '은자를 받더니 길을 터 주었다. 덤은 없다. 은자 -30' : '은자 -30. 마교도가 구결 한 장을 던져 주었다. ' + a.give('card', 'magyo')) },
    { label: '검문을 뚫는다 (정예 전투)', run: a => '"감히!" 외당 호법이 장력을 끌어올린다! ' + a.fight(['hobeop', 'magyodo'], 'elite') },
    { label: '눈길로 돌아간다 (체력 -20%)', run: a => (a.hurt(0.2), '허리까지 빠지는 눈을 헤쳤다. 체력 -20%') } ] })),
  V(s => ({ title: '눈 속의 행렬', regions: [4], text: a => (s.v = pickIdx(a, 2), ['눈사태에 서역 상단이 통째로 묻혔다. 낙타 방울 소리 하나 없다.', '눈사태에 신교 보급대가 묻혔다. 눈 위로 마교 깃발이 비죽 솟아 있다.'][s.v]), choices: [
    { label: '눈을 파헤친다 (체력 -20%)', run: a => { a.hurt(0.2); const loot = a.rand() < 0.4 ? a.give('relic') : (a.gold += 35, '은자 +35'); return '얼어붙은 손으로 짐을 뒤졌다. 체력 -20%<br>' + loot + (s.v ? '<br>보급대를 찾던 마교도들과 마주쳤다! ' + a.fight(['magyodo', 'magyodo'], 'normal') : ''); } },
    { label: '생존자를 구한다 (체력 -10%)', run: a => (a.hurt(0.1), s.v ? (a.gold += 25, '살아남은 마교도가 은자를 내밀며 목숨을 빌었다. 체력 -10%, 은자 +25') : '상인을 업고 산을 내려왔다. 상인이 약상자를 열었다. 체력 -10% ' + a.give('pill', 'geumchang') + ' ' + a.give('pill', 'sohwan')) },
    { label: '지나친다', run: () => '눈은 곧 모든 것을 다시 덮을 것이다.' } ] })),

  // ───────── 공용 기연 ─────────
  { title: '무림맹 밀사', text: '객잔 구석의 사내가 영패를 슬쩍 내보인다. "무림맹이오. 마교 첩자를 쫓는데 손을 빌려주시오."', choices: [
    { label: '첩자를 쫓는다', run: a => a.rand() < 0.5 ? (a.gold += 30, '골목 끝에서 첩자를 잡았다. 무림맹 포상 은자 +30') : '매복이다! 첩자 패거리가 에워싼다! ' + a.fight() },
    { label: '첩자에게 귀띔한다', run: a => (a.gold += 40, a.hurt(0.2), '첩자가 은자를 건네더니 입막음 칼을 찔렀다! 은자 +40, 체력 -20%') },
    { label: '엮이지 않는다', run: () => '사내는 실망한 기색으로 인파 속에 섞여 사라졌다.' } ] },
  { title: '비무 요청', text: '죽립 쓴 검객이 길을 막는다. "삼류라지? 한 수 겨뤄 보세. 판돈은 은자 20냥."', choices: [
    { label: '비무에 응한다 (판돈 20)', need: a => a.gold >= 20, run: a => a.rand() < 0.4 + 0.1 * a.realm ? (a.gold += 20, '한 끗 차로 이겼다! 은자 +20 ' + (a.train() || a.exp(10 + 10 * a.region))) : (a.gold -= 20, a.hurt(0.15), '검끝이 목젖에 닿았다. 은자 -20, 체력 -15%') },
    { label: '목검으로 겨룬다 (체력 -10%)', run: a => (a.hurt(0.1), '흠씬 얻어맞았지만 배운 게 있다. 체력 -10% ' + a.exp(10 + 8 * a.region)) },
    { label: '사양한다', run: () => '"삼류다운 판단이군." 검객이 웃으며 비켜섰다.' } ] },
  { title: '낡은 사당', text: '허물어진 산신당에 향 연기가 아직 감돈다. 제단 아래 공양함이 묵직해 보인다.', choices: [
    { label: '공양함을 턴다', run: a => { a.gold += 25; if (a.rand() < 0.4) { a.hurt(0.2); return '은자 +25. 그 순간 대들보가 무너졌다! 체력 -20%'; } return '은자 +25. 산신께서 주무시는 모양이다.'; } },
    { label: '향을 올린다 (은자 10)', need: a => a.gold >= 10, run: a => (a.gold -= 10, a.rand() < 0.5 ? (a.stat('maxHp', 6), '산신의 가호인가, 기혈이 든든해졌다. 은자 -10, 최대체력 +6') : '향 연기에 군더더기가 씻겨 나갔다. 은자 -10 ' + (a.removeCard() || (a.heal(0.3), '체력 30% 회복'))) },
    { label: '하룻밤 묵어 간다', run: a => (a.heal(0.2), '쥐 소리를 자장가 삼아 푹 잤다. 체력 20% 회복') } ] },
  { title: '주막 술내기', text: '누더기 노인이 술독을 두드린다. "나보다 많이 마시면 밥벌이 무공을 하나 주지. 지면 술값은 자네 몫!"', choices: [
    { label: '술내기를 받는다 (술값 25)', need: a => a.gold >= 25, run: a => a.rand() < (a.hasSchool('gaebang') ? 0.7 : 0.4) ? '"허허, 술배 하나는 대협일세!" ' + a.give('school', 'gaebang') : (a.gold -= 25, '먼저 탁자에 코를 박았다. 술값 은자 -25') },
    { label: '한 사발만 얻어 마신다', run: a => (a.heal(0.15), '"공짜 술은 딱 한 사발이네!" 체력 15% 회복') } ] },
  { title: '떠돌이 약장수', text: '수레를 끄는 약장수가 목청을 돋운다. "만병통치 금단이오! 오늘만 은자 30냥!"', choices: [
    { label: '금단을 산다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, a.rand() < 0.5 ? (a.stat('maxHp', 15), '진짜 영단이었다! 은자 -30, 최대체력 +15') : '밀가루 반죽이었다… 은자 -30') },
    { label: '상비약만 산다 (은자 15)', need: a => a.gold >= 15, run: a => (a.gold -= 15, '"보는 눈이 있으시군!" 은자 -15 ' + a.give('pill', 'geumchang') + ' ' + a.give('pill', 'haedok')) },
    { label: '지나친다', run: () => '"후회할 거요!" 약장수의 외침이 등을 따라왔다.' } ] },
  { title: '꿈속의 검선', text: '모닥불 곁에 잠든 밤, 백발 검선이 꿈에 나타나 검을 겨눈다. "깨어날 텐가, 배울 텐가?"', choices: [
    { label: '배움을 청한다 (체력 -20%)', run: a => (a.hurt(0.2), '꿈속에서 천 번을 베였다. 체력 -20% ' + (a.train() || a.give('card'))) },
    { label: '매화검을 펼친다 (화산)', need: a => a.hasSchool('hwasan'), run: a => '"매화가 제법 피었구나." 검선이 웃으며 한 초식을 더 보여 주었다. ' + a.give('card', 'hwasan') },
    { label: '잠에서 깬다', run: a => (a.heal(0.15), '개운하게 눈을 떴다. 체력 15% 회복') } ] },
  { title: '폐문파 서고', text: '멸문한 문파의 서고. 불탄 서가 사이로 온전한 서책이 보이지만, 발밑 마루가 삐걱댄다.', choices: [
    { label: '안쪽 서가를 뒤진다 (위험)', run: a => a.rand() < 0.55 ? '잿더미 속에서 비급을 찾았다! ' + a.give('book', 2) : (a.hurt(0.25), '마루가 꺼져 지하로 굴러떨어졌다! 체력 -25%') },
    { label: '바깥 서가만 살핀다', run: a => a.rand() < 0.5 ? '쓸 만한 무공서가 있다. ' + a.give('book', 1) : '찢긴 구결뿐이지만 읽을 만했다. ' + a.exp(10 + 8 * a.region) } ] },
  { title: '탁발승', text: '늙은 탁발승이 목탁을 두드리며 바리때를 내민다. "시주하시면 부처님의 복이 함께하리다."', choices: [
    { label: '은자 15냥을 시주한다', need: a => a.gold >= 15, run: a => (a.gold -= 15, a.hasSchool('sorim') ? (a.stat('maxHp', 20), '"같은 뿌리로구나." 역근의 묘리를 짚어 주었다. 최대체력 +20') : (a.heal(0.15), '"아미타불." 스님이 상처를 쓸어 주고 약 한 봉을 쥐여 주었다. 은자 -15, 체력 15% 회복 ' + a.give('pill', 'geumchang'))) },
    { label: '합장만 한다', run: () => '"그 마음도 시주라오." 스님이 마주 합장했다.' } ] },

  V(s => ({ title: '객잔 이야기꾼', text: a => { s.k = SK[pickIdx(a, SK.length)]; return `객잔 이야기꾼이 부채를 탁 접는다. "오늘은 ${SCHOOL[s.k]}의 숨은 고수 이야기올시다!" 술 한 동이면 비전 한 대목까지 풀겠다는 눈치다.`; }, choices: [
    { label: '술을 산다 (은자 25)', need: a => a.gold >= 25, run: a => (a.gold -= 25, `거나해진 이야기꾼이 ${SCHOOL[s.k]}의 구결을 흘렸다. 은자 -25 ` + a.give('card', s.k)) },
    { label: '듣기만 한다', run: a => '허풍 반 진실 반이다. ' + a.exp(8 + 6 * a.region) } ] })),
  V(s => ({ title: '노고수의 일침', text: a => (s.v = pickIdx(a, 2), ['개울가에서 낚싯대를 드리운 노인이 힐끗 본다. "초식이 너무 많아. 잡것이 섞이면 칼이 무뎌지지."', '장작을 패던 노인이 도끼를 내려놓는다. "자네 손속엔 군더더기가 많군. 덜어 줄까?"'][s.v]), choices: [
    { label: '가르침을 받는다 (체력 -15%)', run: a => (a.hurt(0.15), (s.v ? '도낏자루로' : '낚싯대로') + ' 사정없이 두들겨 맞았다. 체력 -15% ' + (a.removeCard() || (a.stat('maxHp', 5), '"덜 게 없구먼." 최대체력 +5'))) },
    { label: '오히려 한 수 청한다 (은자 25)', need: a => a.gold >= 25, run: a => (a.gold -= 25, '"욕심은." 노인이 혀를 차며 한 수 일러 주었다. 은자 -25 ' + (a.train() || a.give('card'))) },
    { label: '흘려듣는다', run: () => '노인은 다시 제 일로 돌아갔다.' } ] })),
  { title: '흑시 경매', text: '자정의 폐창고, 복면 쓴 자들이 모인 흑시다. 오늘의 마지막 물건은 출처 모를 보물 한 점.', choices: [
    { label: '보물을 낙찰받는다 (은자 70)', need: a => a.gold >= 70, run: a => (a.gold -= 70, '망치 소리와 함께 보물이 넘어왔다. 은자 -70<br>' + a.give('relic')) },
    { label: '약재 꾸러미를 산다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '은자 -30 ' + a.give('pill', 'geumchang') + ' ' + a.give('pill', 'daeryeok')) },
    { label: '구경만 한다', run: () => '흑시에 오래 머무는 건 목숨 아까운 줄 모르는 자다.' } ] },
  V(s => ({ title: '떠돌이 의원', text: a => (s.v = pickIdx(a, 2), '침통을 멘 의원이 장터에 자리를 폈다. ' + ['줄 선 사람마다 "신의(神醫)"라 입을 모은다.', '"신의다", "돌팔이다" 소문이 반반이다.'][s.v]), choices: [
    { label: '침을 맞는다 (은자 20)', need: a => a.gold >= 20, run: a => (a.gold -= 20, a.heal(0.4), '굳은 혈이 풀렸다. 은자 -20, 체력 40% 회복') },
    { label: '혈맥을 넓힌다 (은자 40)', need: a => a.gold >= 40, run: a => { a.gold -= 40; if (s.v && a.rand() < 0.5) { a.hurt(0.15); return '침이 엉뚱한 혈에 꽂혔다! 은자 -40, 체력 -15%'; } a.stat('maxHp', 10); return '막힌 혈맥이 뚫렸다. 은자 -40, 최대체력 +10'; } },
    { label: '지나친다', run: () => '병은 날 때 고치면 된다.' } ] })),
  V(s => ({ title: '한밤의 습격', text: a => (s.v = pickIdx(a, 3), '객사에서 잠든 밤, 창호지에 칼빛이 비친다. ' + ['복면 자객이다.', '낮에 시비 붙었던 왈패가 패거리를 끌고 왔다.', '현상금 사냥꾼이 사람을 잘못 보고 덤빈다.'][s.v]), choices: [
    { label: '맞선다 (전투)', run: a => { const p = MOBS[Math.max(0, Math.min(4, (a.geo ?? a.region) | 0))]; return '이불을 걷어차고 칼을 잡았다! ' + (s.v === 1 ? a.fight([p[0], p[1], p[0]], 'normal') : a.fight()); } },
    { label: '은자를 던져 준다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, ['자객이 은자를 챙기더니 사라졌다.', '왈패들이 은자를 줍느라 정신이 없다.', '사냥꾼이 머쓱하게 은자를 받고 물러났다.'][s.v] + ' 은자 -30') },
    { label: '창밖으로 뛰어내린다 (체력 -10%)', run: a => (a.hurt(0.1), '지붕을 타고 달아났다. 체력 -10%') } ] })),
  { title: '고수의 유골', text: '바위 그늘에 백골이 가부좌하고 있다. 무릎 위의 혈서. "내 보물을 가져가되, 원수 놈을 베어 다오."', choices: [
    { label: '유언을 받든다 (정예 전투)', run: a => '백골 품에서 보물을 거두었다. ' + a.give('relic') + '<br>"그건 우리 물건이다!" 원수의 패거리가 나타났다! ' + a.fight() },
    { label: '고이 묻어 준다', run: a => (a.heal(0.15), '돌무덤을 쌓아 주었다. 마음이 가볍다. 체력 15% 회복 ' + a.exp(8 + 6 * a.region)) },
    { label: '전낭만 챙긴다', run: a => (a.gold += 25, '죽은 자에게 은자는 필요 없다. 은자 +25') } ] },
  { title: '폐관 수련', text: '인적 끊긴 석굴. 며칠 틀어박혀 무공을 갈고닦기 좋은 곳이다. 대신 몸이 축날 것이다.', choices: [
    { label: '폐관한다 (체력 -30%)', run: a => (a.hurt(0.3), '사흘 밤낮 초식을 허물고 다시 세웠다. 체력 -30%<br>' + (a.removeCard() || '버릴 초식은 없었다.') + '<br>' + (a.train() || a.give('card'))) },
    { label: '하룻밤 운기만 한다', run: a => (a.heal(0.25), '기혈을 고르며 하룻밤을 보냈다. 체력 25% 회복') } ] },
  V(s => ({ title: '명문 제자의 시비', text: a => { s.k = MASTER_SK[pickIdx(a, MASTER_SK.length)]; return `${SCHOOL[s.k]} 제자들이 길을 막고 시비를 건다. "삼류 따위가 감히!" 뒤편 가마에서 문주의 헛기침 소리가 들린다.`; }, choices: [
    { label: '문주에게 비무를 청한다 (장문인 비무)', run: a => `가마의 발이 걷혔다. "버릇은 내가 고쳐 주지." ${SCHOOL[s.k]} 장문인이 걸어 나온다. ` + a.duel('m_' + s.k) },
    { label: '사과하고 은자를 낸다 (은자 15)', need: a => a.gold >= 15, run: a => (a.gold -= 15, '"흥, 눈치는 있군." 은자 -15') },
    { label: '어깨로 밀치고 지나간다 (체력 -10%)', run: a => (a.hurt(0.1), '등 뒤에서 날아든 장풍을 맞았지만 길은 뚫었다. 체력 -10%') } ] })),
  { title: '소매치기', text: '장터 인파 속, 꾀죄죄한 아이가 부딪히더니 쏜살같이 달아난다. 허리춤이 가볍다!', choices: [
    { label: '쫓아간다', run: a => a.rand() < 0.6 ? '골목 끝에서 덜미를 잡았다. 전낭을 되찾았다.' : (a.gold -= 20, '골목이 미로 같다. 놓쳤다… 은자 -20') },
    { label: '놓아준다 (은자 20)', run: a => (a.gold -= 20, '며칠 뒤, 개방 거지가 찾아와 고개를 숙였다. "애가 철이 없어서. 대신 이거라도." 은자 -20 ' + a.give('card', 'gaebang')) } ] },
  V(s => ({ title: '현상 방문', text: a => { s.v = pickIdx(a, 3); s.g = 30 + 10 * a.region + 5 * s.v; return `관아 담벼락에 방이 붙었다. "${['인두겁 쓴 살수', '관은을 턴 대도', '파문당한 배교자'][s.v]}를 잡겠다고 나서는 협객에게 착수금 은자 ${s.g}냥."`; }, choices: [
    { label: '현상범을 쫓는다 (정예 전투)', run: a => (a.gold += s.g, `착수금 은자 +${s.g}. 은신처를 덮쳤다! ` + a.fight()) },
    { label: '방을 뜯어 정보상에 판다', run: a => (a.gold += 10, '정보상이 방을 받아 들고 은자를 던졌다. 은자 +10') },
    { label: '지나친다', run: () => '남의 목에 걸린 은자는 남의 몫이다.' } ] })),
  { title: '떠돌이 무관 사범', text: '간판도 없는 무관. 외팔 사범이 목검을 던져 준다. "쓸모없는 초식은 버리고 새로 배워. 수업료는 선불이다."', choices: [
    { label: '초식을 바꾼다 (은자 35)', need: a => a.gold >= 35, run: a => { a.gold -= 35; return '은자 -35<br>' + (a.removeCard() || '버릴 초식은 없었다.') + '<br>' + a.give('card'); } },
    { label: '버리기만 한다 (은자 25)', need: a => a.gold >= 25, run: a => { const r = a.removeCard(); if (!r) return '"버릴 초식도 없는 놈이." 사범이 손사래를 쳤다.'; a.gold -= 25; return '은자 -25<br>' + r; } },
    { label: '목검을 돌려준다', run: () => '"겁먹긴." 사범이 코웃음을 쳤다.' } ] },

  // ───────── 추가 기연 (뒤에만 붙인다 — seenEvents가 인덱스라 저장된 판이 꼬이지 않게) ─────────
  // 하남 — 낙양 · 숭산
  { title: '귀영도의 칼값', regions: [0], face: 'mb_gwiyeong', text: '주막 구석, 삿갓 쓴 조천이 칼을 닦는다. "내 그림자를 베면 칼의 이치를 주지. 못 베면 목을 두고 가라."', choices: [
    { label: '목숨을 건다 (두목급 전투)', run: a => '"좋은 눈빛이다." 칼날이 그림자처럼 사라졌다! ' + a.fight(['mb_gwiyeong'], 'elite') },
    { label: '목검으로 청한다 (비무)', run: a => '"목검이라… 손속은 두지." ' + a.duel('mb_gwiyeong') },
    { label: '잔을 비우고 일어선다', run: () => '"겁쟁이는 오래 살지." 칼 닦는 소리가 등 뒤로 이어졌다.' } ] },
  { title: '낙양 전당포', regions: [0], text: '낙양 전당포 주인이 주판을 튕긴다. "물건이든 피든 다 받소. 기한 넘긴 보물도 하나 있고."', choices: [
    { label: '기한 넘긴 보물을 산다 (은자 60)', need: a => a.gold >= 60, run: a => (a.gold -= 60, '먼지 쌓인 함이 넘어왔다. 은자 -60<br>' + a.give('relic')) },
    { label: '피를 판다 (최대체력 -8)', run: a => (a.stat('maxHp', -8), a.gold += 45, '혈삼 장수가 피 한 사발을 뽑아 갔다. 최대체력 -8, 은자 +45') },
    { label: '구경만 한다', run: () => '"다음엔 뭐든 들고 오시오." 주판 소리가 따라왔다.' } ] },
  { title: '개방 분타', regions: [0, 1], text: '다리 밑 개방 분타, 거지들이 빈 바가지를 두드린다. "국밥 한 그릇씩 돌리면 타구봉 한 수 보여 주지!"', choices: [
    { label: '국밥을 돌린다 (은자 25)', need: a => a.gold >= 25, run: a => (a.gold -= 25, '국밥을 들이켠 거지들이 봉을 휘둘렀다. 은자 -25 ' + a.give('card', 'gaebang')) },
    { label: '개방 암호로 인사한다 (개방)', need: a => a.hasSchool('gaebang'), run: a => (a.gold += 20, '"동지였구먼!" 분타주가 소식값을 나눠 주었다. 은자 +20 ' + a.give('pill', 'geumchang')) },
    { label: '동전만 던져 준다', run: a => (a.heal(0.1), '"복 받을 거요!" 거지들 넉살에 웃음이 났다. 체력 10% 회복') } ] },
  { title: '속가 무관', regions: [0], text: '소림 속가제자의 무관. 관주가 목인장을 가리킨다. "백팔 수를 받아 내면 나한권 한 수를 일러 드리지."', choices: [
    { label: '목인장을 친다 (체력 -20%)', run: a => (a.hurt(0.2), '팔뚝이 퉁퉁 부었지만 백팔 수를 다 받았다. 체력 -20% ' + a.give('card', 'sorim')) },
    { label: '소림 수법으로 친다 (소림)', need: a => a.hasSchool('sorim'), run: a => (a.stat('maxHp', 6), '"같은 뿌리로군!" 관주가 역근의 묘리를 짚어 주었다. 최대체력 +6 ' + a.give('card', 'sorim')) },
    { label: '사범 대행을 맡는다', run: a => (a.gold += 15, '하루 종일 아이들 마보를 잡아 주었다. 은자 +15') } ] },

  // 장강 — 흑룡방 · 무당 · 제갈
  { title: '흑룡방 투전판', regions: [1], face: 'mb_heukryong', text: '흑룡방 누선 위 투전판. 마흑룡이 주사위를 굴린다. "은자 30냥 걸고 한 판! 이기면 보물고에서 하나 골라 가라."', choices: [
    { label: '한 판 건다 (은자 30)', need: a => a.gold >= 30, run: a => { a.gold -= 30; return a.rand() < 0.4 ? '육육! 마흑룡이 이를 갈며 보물고를 열었다. 은자 -30<br>' + a.give('relic') : '"장강 물은 늘 흑룡방 쪽으로 흐르지." 은자 -30'; } },
    { label: '판을 엎는다 (전투)', run: a => (a.gold += 20, '투전판을 걷어차 흩어진 은자를 쓸어 담았다. 은자 +20<br>졸개들이 몰려든다! ' + a.fight(['sapa', 'suri', 'sujeok'], 'normal')) },
    { label: '배에서 내린다', run: () => '"다음엔 배짱을 챙겨 오게!" 웃음소리가 강을 건너왔다.' } ] },
  { title: '무당 검지', regions: [1], text: '무당산 검지(劍池). 늙은 도사가 연못을 가리킨다. "헛된 초식 하나를 물에 던지게. 태극의 결로 바꿔 주지."', choices: [
    { label: '초식을 던진다 (카드 교체)', run: a => { const r = a.removeCard(); return r ? r + '<br>물결이 잦아들자 새 결이 손에 남았다. ' + a.give('card', 'mudang') : (a.heal(0.1), '"버릴 것이 없구먼." 도사가 차 한 잔을 내주었다. 체력 10% 회복'); } },
    { label: '태극을 잇는다 (무당)', need: a => a.hasSchool('mudang'), run: a => (a.heal(0.3), '"이미 태극을 아는구나." 체력 30% 회복 ' + a.give('card', 'mudang')) },
    { label: '합장하고 떠난다', run: a => (a.heal(0.1), '연못에 비친 운무가 마음을 씻는다. 체력 10% 회복') } ] },
  { title: '수채 포로선', regions: [1], text: '수채 쾌선이 양민들을 줄줄이 묶어 끌고 간다. "몸값 못 내면 노예선이다!" 수적은 셋뿐이다.', choices: [
    { label: '배에 뛰어든다 (전투)', run: a => (a.stat('maxHp', 5), '"협객이다!" 양민들의 함성에 기혈이 끓는다. 최대체력 +5<br>' + a.fight(['sujeok', 'sujeok', 'suri'], 'normal')) },
    { label: '몸값을 대신 낸다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, a.stat('maxHp', 5), '풀려난 늙은 표사가 비전 한 수로 은혜를 갚았다. 은자 -40, 최대체력 +5 ' + a.give('card')) },
    { label: '못 본 척한다', run: () => '울음소리가 물안개 속으로 멀어졌다.' } ] },
  { title: '비단 주머니', regions: [1], face: 'y_jegal', text: '제갈운이 비단 주머니 둘을 내민다. "가벼운 쪽엔 은자, 무거운 쪽엔 보물… 아니면 독침이지요."', choices: [
    { label: '가벼운 주머니', run: a => (a.gold += 30, '"무난하시군." 은자 +30') },
    { label: '무거운 주머니 (위험)', run: a => a.rand() < 0.5 ? '"배짱이 좋으시군." ' + a.give('relic') : (a.hurt(0.2), '주머니를 열자 독침이 튀었다! 체력 -20%') },
    { label: '주머니를 돌려준다', run: a => '"욕심이 없으니 셈이 맑구려." 제갈운이 진법 한 수를 일러 주었다. ' + a.give('card') } ] },

  // 사천 — 오독문 · 당가 · 아미
  { title: '오독문의 독잔', regions: [2], face: 'mb_odok', text: '오독문주 남소요가 독잔을 내민다. "다 마시고도 서 있으면 보물 하나 주지. 쓰러지면 거름이 되고."', choices: [
    { label: '독잔을 비운다 (최대체력 -8)', run: a => (a.stat('maxHp', -8), '오장이 뒤틀렸지만 끝내 서 있었다. 최대체력 -8<br>"재밌는 놈이네." ' + a.give('relic')) },
    { label: '해독단을 숨겨 삼킨다 (해독단 -1)', need: a => a.pill('haedok'), run: a => (a.usePill('haedok'), '"꼼수는 당가 솜씨네?" 남소요가 깔깔대며 독수 한 수를 흘렸다. 해독단 -1 ' + a.give('card', 'dang')) },
    { label: '정중히 사양한다', run: () => '"재미없긴." 남소요가 독잔을 땅에 쏟았다. 흙이 지글지글 끓었다.' } ] },
  { title: '촉도 잔도', regions: [2], text: '천 길 낭떠러지에 매단 잔도(棧道). 맞은편에서 독검수 둘이 판자를 끊으려 한다!', choices: [
    { label: '잔도를 달린다 (위험)', run: a => a.rand() < 0.55 ? (a.gold += 35, '끊기기 직전에 건넜다! 놀란 독검수들이 전낭을 버리고 달아났다. 은자 +35') : (a.hurt(0.25), '판자와 함께 떨어지다 벼랑 소나무에 걸렸다. 체력 -25%') },
    { label: '잔도 위에서 맞선다 (전투)', run: a => '흔들리는 판자 위에서 칼이 엇갈린다! ' + a.fight(['dokpyo', 'dokpyo'], 'normal') },
    { label: '벽력탄을 던진다 (벽력탄 -1)', need: a => a.pill('byeokryeok'), run: a => (a.usePill('byeokryeok'), a.gold += 30, '쾅! 독검수들이 날아갔다. 흘린 은자를 주웠다. 벽력탄 -1, 은자 +30') } ] },
  { title: '당가 암기방', regions: [2], text: '당가 외문 대장간. 대장장이가 불을 지핀다. "쓰던 초식을 녹여 암기로 벼려 드리지. 당가 핏줄이면 공짜고."', choices: [
    { label: '초식을 녹인다 (카드 제거)', run: a => { const r = a.removeCard(); return r ? r + '<br>쇳물 속에서 시커먼 탄환이 나왔다. ' + a.give('pill', 'byeokryeok') : '"녹일 것도 없구먼." 대장장이가 코웃음을 쳤다.'; } },
    { label: '벽력탄을 산다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '은자 -30 ' + a.give('pill', 'byeokryeok', 2)) },
    { label: '당문 수법을 보인다 (당문)', need: a => a.hasSchool('dang'), run: a => '"당가 사람이었군!" 대장장이가 아껴 둔 물건을 꺼냈다. ' + a.give('relic') } ] },
  { title: '아미 금정', regions: [2], text: '아미산 금정(金頂), 운해 위로 해가 솟는다. 운이 좋으면 불광(佛光)이 비친다는 시각이다.', choices: [
    { label: '불광을 기다린다 (체력 -10%)', run: a => (a.hurt(0.1), a.rand() < 0.5 ? (a.stat('maxHp', 12), '운해 위에 무지개 고리가 떴다! 체력 -10%, 최대체력 +12') : '찬 바람에 떨기만 했다. 그래도 마음은 맑다. 체력 -10% ' + a.exp(10 + 8 * a.region)) },
    { label: '비구니께 시주한다 (은자 25)', need: a => a.gold >= 25, run: a => (a.gold -= 25, '"아미타불, 몸을 지키는 법이에요." 은자 -25 ' + a.give('card', 'emei')) },
    { label: '해돋이만 보고 내려간다', run: a => (a.heal(0.15), '붉은 해가 가슴을 데운다. 체력 15% 회복') } ] },

  // 섬서 — 장안 · 혈교 · 고묘
  { title: '강시 행렬', regions: [3], face: 'b_gwigeom', text: '딸랑, 딸랑. 귀검의 방울에 끌려 강시 행렬이 밤길을 간다. 맨 끝 관에 금빛 부적이 붙어 있다.', choices: [
    { label: '관을 연다 (위험)', run: a => { const loot = '관 속 시신이 쥔 보물을 빼냈다. ' + a.give('relic'); return a.rand() < 0.4 ? loot + '<br>방울 소리는 끊기지 않았다.' : loot + '<br>방울이 멎었다. 강시들이 일제히 돌아본다! ' + a.fight(['gangsi', 'gangsi', 'hyeolgyo'], 'normal'); } },
    { label: '부적만 떼어 판다', run: a => (a.gold += 25, '도사들이 앞다퉈 부적값을 불렀다. 은자 +25') },
    { label: '숨죽여 보낸다', run: () => '방울 소리가 산 너머로 사라질 때까지 숨도 쉬지 않았다.' } ] },
  { title: '서역 혈삼', regions: [3, 4], text: a => (a.geo === 4 ? '천산 길목의 서역 대상(隊商).' : '장안 서시(西市), 낙타 행렬이 짐을 푼다.') + ' 상인이 붉은 뿌리를 흔든다. "천축 혈삼이오! 한 뿌리 은자 50냥."', choices: [
    { label: '혈삼을 산다 (은자 50)', need: a => a.gold >= 50, run: a => (a.gold -= 50, a.stat('maxHp', 15), a.heal(0.2), '혈삼을 통째로 씹었다. 은자 -50, 최대체력 +15, 체력 20% 회복') },
    { label: '서역 도법을 산다 (은자 35)', need: a => a.gold >= 35, run: a => (a.gold -= 35, '"곡도(曲刀)는 이렇게 휘두르오." 은자 -35 ' + a.give('card')) },
    { label: '구경만 한다', run: () => '낙타 냄새만 실컷 맡았다.' } ] },
  { title: '수상한 서찰', regions: [3], text: '화산 제자 차림의 사내가 서찰을 내민다. "화산 장문인께 전해 주시오. 사례는 두둑이." 피비린내가 난다.', choices: [
    { label: '서찰을 전한다', run: a => (a.gold += 30, '사례 은자 +30. 며칠 뒤, 화산 산문에 피가 뿌려졌다는 소문을 들었다.') },
    { label: '서찰을 뜯는다 (전투)', run: a => (a.gold += 15, '혈교의 밀서다! 사내가 떨군 전낭 은자 +15<br>사내가 패거리를 불렀다! ' + a.fight(['hyeolgyo', 'hyeollang'], 'normal')) },
    { label: '매화검결로 떠본다 (화산)', need: a => a.hasSchool('hwasan'), run: a => '사내가 답구(答句)를 잇지 못했다. 정체가 탄로 난 혈교 첩자가 비급을 바치고 목숨을 빌었다. ' + a.give('card', 'magyo') } ] },
  { title: '진(秦)의 고묘', regions: [3], text: '도굴꾼이 뚫어 놓은 진나라 장수의 고묘. 묘실 깊은 곳에서 서늘한 기운이 흘러나온다.', choices: [
    { label: '묘실 깊이 들어간다 (위험)', run: a => { const r = a.rand(); if (r < 0.2) return '석관 속 옥간(玉簡)에 심법 구결이 새겨져 있다! ' + (a.give('sim') || a.give('card')); if (r < 0.6) return (a.gold += 40, '부장품 금붙이를 챙겼다. 은자 +40'); a.hurt(0.2); return '묘지기 강시가 관 뚜껑을 밀치고 나왔다! 체력 -20%<br>' + a.fight(['gangsi', 'gangsi'], 'normal'); } },
    { label: '도굴꾼을 쫓아낸다 (전투)', run: a => (a.gold += 20, '도굴꾼들의 전낭을 빼앗았다. 은자 +20<br>"혈교 일을 방해하다니!" 놈들이 칼을 뽑았다. ' + a.fight(['hyeolgyo', 'hyeollang', 'hyeollang'], 'normal')) },
    { label: '입구를 막아 준다', run: a => (a.heal(0.1), '돌을 굴려 입구를 막았다. 장수의 혼이 고개를 숙이는 듯하다. 체력 10% 회복 ' + a.exp(8 + 6 * a.region)) } ] },

  // 천산 — 설마녀 · 공동 · 천지
  { title: '설마녀의 시험', regions: [4], face: 'mb_seolma', text: '눈보라 속에 빙설화가 서 있다. "빙백장 세 번을 맨몸으로 받으면 천산의 보물을 주지. 얼어 죽어도 원망 마라."', choices: [
    { label: '세 번 받는다 (체력 -30%)', run: a => (a.hurt(0.3), '피가 얼어붙었지만 무릎은 꿇지 않았다. 체력 -30%<br>"…쓸 만하군." ' + a.give('relic')) },
    { label: '설마녀와 겨룬다 (비무)', run: a => '"맨몸이 싫다면 검으로 오너라." ' + a.duel('mb_seolma') },
    { label: '고개를 숙인다', run: () => '"겁쟁이에게 줄 꽃은 없다." 눈보라가 등을 떠밀었다.' } ] },
  { title: '공동 팔씨름', regions: [4], text: '설원 주막, 공동 제자들이 팔씨름판을 벌였다. "이기면 은자 35냥, 지면 손목이 남아나질 않지!"', choices: [
    { label: '팔씨름 한 판 (체력 -10%)', run: a => { a.hurt(0.1); return a.rand() < (a.hasSchool('gongdong') ? 0.75 : 0.45) ? (a.gold += 35, '탁자가 쪼개지며 이겼다! 체력 -10%, 은자 +35') : (a.hurt(0.1), '손목이 꺾였다. 체력 -20%'); } },
    { label: '칠상권을 청한다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '"주먹은 제 몸부터 때리는 법!" 은자 -30 ' + a.give('card', 'gongdong')) },
    { label: '술만 마신다', run: a => (a.heal(0.15), '독한 고량주에 언 몸이 녹는다. 체력 15% 회복') } ] },
  { title: '천산 천지', regions: [4], text: '만년설에 둘러싸인 얼음 호수 천지(天池). 물속 깊은 곳에서 무언가 은은하게 빛난다.', choices: [
    { label: '물속을 뒤진다 (체력 -20%)', run: a => (a.hurt(0.2), a.rand() < 0.5 ? (a.stat('maxHp', 12), '천년 빙정(氷晶)을 건져 삼켰다. 체력 -20%, 최대체력 +12') : '빛나던 건 얼음 조각이었다. 체력 -20%<br>' + (a.removeCard() || (a.stat('maxHp', 5), '언 몸이 단단해졌다. 최대체력 +5'))) },
    { label: '호숫가에서 운기한다', run: a => (a.heal(0.3), '맑은 한기가 기혈을 고른다. 체력 30% 회복') },
    { label: '천지 물을 길어 간다', run: a => '천지 물로 단약을 빚었다. ' + a.give('pill', 'sohwan', 2) } ] },

  // 공용
  { title: '떠돌이 대장장이', text: '수레를 끄는 외눈 대장장이가 모루를 내린다. "무딘 초식 둘을 녹여 한 자루로 벼려 주지. 값은 은자 30."', choices: [
    { label: '두 초식을 벼린다 (은자 30)', need: a => a.gold >= 30, run: a => { const r = [a.removeCard(), a.removeCard()].filter(Boolean); if (!r.length) return '"녹일 쇠가 없구먼." 대장장이가 모루를 도로 실었다.'; a.gold -= 30; return '은자 -30<br>' + r.join('<br>') + '<br>불꽃 속에서 새 초식이 나왔다. ' + a.give('card'); } },
    { label: '칼날만 세운다 (은자 10)', need: a => a.gold >= 10, run: a => (a.gold -= 10, '서슬 퍼런 칼날이 손에 감긴다. 은자 -10 ' + a.give('pill', 'daeryeok')) },
    { label: '지나친다', run: () => '모루 소리가 멀어졌다.' } ] },
  { title: '반쯤 탄 심법서', text: '노점 구석에 반쯤 탄 심법서 한 권. 주인이 손가락 여덟 개를 편다. "은자 80냥. 진짜 심법이오, 장담하지."', choices: [
    { label: '산다 (은자 80)', need: a => a.gold >= 80, run: a => (a.gold -= 80, '탄 자리를 빼고도 구결이 이어진다. 은자 -80<br>' + (a.give('sim') || a.give('card'))) },
    { label: '몰래 베껴 쓴다 (체력 -15%)', run: a => (a.hurt(0.15), a.rand() < 0.2 ? '밤새 외운 구결이 몸속에서 돌기 시작했다! 체력 -15%<br>' + (a.give('sim') || a.give('card')) : '들켜서 몰매를 맞았다. 외운 건 반 줄뿐. 체력 -15% ' + a.exp(8 + 6 * a.region)) },
    { label: '지나친다', run: () => '"후회할 거요!" 주인이 책을 품에 숨겼다.' } ] },
];
