// story_routes.js — 출신별 이야기. route: 'magyo' 는 마교 루트에서만, 나머지는 정파 루트(when으로 출신 구분)
// regions = 지도 지역(0 하남 … 4 천산). 마교 루트는 천산에서 시작해 거꾸로 간다.
export const ROUTE_STORY = [
  // ── 마교 출신: 단계마다 교의 명령(도착 이야기) ──
  { id: 'mg_oedang', title: '피의 연무장', face: 'b_oedang', regions: [4], route: 'magyo', story: true, arrival: true,
    text: '천산 신교 외당. 말단들이 서로를 짓밟는 연무장 위로 외당주 마도철이 웃는다. "위로 가고 싶으면 위를 베어라."',
    choices: [
      { label: '서열전 명부에 이름을 쓴다', run: a => '외당 서열전 명부에 피로 이름을 썼다. 位 노드에서 서열전이 열린다.<br>' + a.exp(10) },
      { label: '밤마다 혼자 칼을 간다 (체력 -10%)', run: a => (a.hurt(0.1), a.stat('atk', 2), '손바닥이 터지도록 칼을 휘둘렀다. 공력 +2') } ] },
  { id: 'mg_hyeolgyo', title: '숙청령', face: 'b_cheonma', regions: [3], route: 'magyo', story: true, arrival: true,
    text: '교주의 명이 내려왔다. "섬서 혈교 지부가 딴 마음을 품었다. 장로의 목을 가져오라."',
    choices: [
      { label: '숙청의 선봉에 선다', run: a => '혈교 지부의 문을 걷어찼다.<br>' + a.give('magyo') },
      { label: '지부 비고부터 턴다 (체력 -15%)', run: a => (a.hurt(0.15), '비고를 지키던 혈검수를 베고 비급을 챙겼다.<br>' + a.give('book', 2)) } ] },
  { id: 'mg_dang', title: '당가 정벌', face: 'y_dang', regions: [2], route: 'magyo', story: true, arrival: true,
    text: '사천당가가 신교의 길을 막아섰다. 숲 곳곳에 독무가 깔렸다. 독을 다스리지 못하면 여기서 끝이다.',
    choices: [
      { label: '해독단부터 챙긴다', run: a => '독에는 독으로, 그리고 해독단으로.<br>' + a.give('pill', 'haedok', 2) },
      { label: '당가 독인을 먼저 친다', run: a => (a.gold += 30, '선봉의 독인을 베면 당가가 흔들린다. 은자 +30<br>' + a.fight(['dokin', 'dokin'], 'normal')) } ] },
  { id: 'mg_sadae', title: '사대호법의 난', face: 'b_sadae', regions: [1], route: 'magyo', story: true, arrival: true,
    text: '사대호법 수장 혁련무극이 반기를 들었다. "말단 출신 따위가 교주의 눈에 들다니, 교의 수치다!"',
    choices: [
      { label: '정면으로 받아친다', run: a => (a.stat('atk', 3), '"수치인지 아닌지, 검이 말해 주겠지." 공력 +3') },
      { label: '호법들을 회유한다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, a.stat('maxHp', 20), '두 호법이 등을 돌렸다. 최대체력 +20') } ] },
  { id: 'mg_maengju', title: '숭산 결전', face: 'b_maengju', regions: [0], route: 'magyo', story: true, arrival: true,
    text: '신교의 검은 깃발이 숭산을 에워쌌다. 산문 앞에 무림맹주 백리청운이 홀로 섰다. "마도는 여기까지다."',
    choices: [
      { label: '전군에 진격을 명한다', run: a => (a.heal(0.3), '함성이 숭산을 흔든다. 체력 30% 회복') },
      { label: '홀로 산문을 연다', run: a => (a.stat('atk', 2), a.title('홀로 산문을 연 자') + ' · 공력 +2') } ] },
  { id: 'mg_vault', title: '신교 비고', face: 'e_hobeop', regions: [4, 3, 2], route: 'magyo', story: true,
    text: '신교의 비고 앞. 호법 하나가 졸고 있다. 안에는 역대 교주들이 남긴 마공서가 잠들어 있다.',
    choices: [
      { label: '몰래 들어간다', run: a => a.rand() < 0.6 ? '들키지 않고 빠져나왔다.<br>' + a.give('magyo') : (a.hurt(0.2), '들켰다! 호법의 장력을 맞고 도망쳤다. 체력 -20%') },
      { label: '정식으로 열람을 청한다', need: a => a.titles.some(t => ['혈마당주', '호법', '소교주'].includes(t)), run: a => '직위를 보인 호법이 길을 비켰다.<br>' + (a.train() || a.give('magyo')) },
      { label: '돌아간다', run: () => '아직은 때가 아니다.' } ] },
  { id: 'mg_audience', title: '교주 알현', face: 'b_cheonma', regions: [1, 0], route: 'magyo', story: true, when: a => a.titles.includes('소교주'),
    text: '천마가 소교주를 불렀다. "중원의 무림맹주는 본좌도 쉽게 보지 않는다. 가져가라."',
    choices: [
      { label: '천마의 가르침을 받는다', run: a => '천마의 일장이 기혈을 뒤집었다.<br>' + (a.train() || a.stat('atk', 3) || '공력 +3') },
      { label: '신교의 영약을 받는다', run: a => (a.stat('maxHp', 25), '천년혈삼 한 뿌리. 최대체력 +25') } ] },

  // ── 북해빙궁 외궁 제자: 궁주의 명으로 설원을 떠나 천마를 친다 ──
  { id: 'bh_order', title: '설원을 떠나며', face: 'b_bukhae', regions: [0], story: true, mine: true, arrival: [0], when: a => a.origin === 'bukhae',
    text: '중원의 첫 객잔. 궁주 설무향의 서찰에 서리가 앉아 있다. "천마를 베고 돌아오면 내궁의 문을 열어 주마. 얼음은 서두르지 않는다."',
    choices: [
      { label: '서찰을 품에 넣는다', run: a => '서찰이 품 안에서 천천히 녹았다.<br>' + a.exp(10) },
      { label: '궁에서 챙겨 온 영약을 먹는다', run: a => (a.stat('maxHp', 8), '뼛속까지 시린 약기운이 돌았다. 최대체력 +8') } ] },
  { id: 'bh_stranger', title: '새외 오랑캐', face: 'n_sujeok', regions: [1], story: true, when: a => a.origin === 'bukhae',
    text: '장강 나루. 수적들이 은빛 머리를 보고 낄낄댄다. "새외 오랑캐가 여긴 왜 왔나? 그 머리, 뽑아다 팔면 값 좀 나가겠는데."',
    choices: [
      { label: '술잔을 얼려 보인다', run: a => (a.gold += 30, '술잔이 쩍 하고 얼어붙자 수적들이 은자를 내려놓고 물러났다. 은자 +30') },
      { label: '말없이 손을 든다 (전투)', run: a => '"북해에서는 이런 걸 인사라 하지."<br>' + a.fight(['sujeok', 'sujeok', 'sapa'], 'normal') } ] },
  { id: 'bh_trade', title: '얼음과 독', face: 'y_dang', regions: [2], story: true, when: a => a.origin === 'bukhae',
    text: '독봉 당소소가 얼음덩이를 만지작거린다. "얼음은 독을 오래 품지요. 거래할까요? 당가 초식 하나, 북해 빙정 하나."',
    choices: [
      { label: '거래한다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, '"후훗, 재미있게 쓰세요." 은자 -40<br>' + a.give('card', 'dang')) },
      { label: '당소소와 겨룬다 (비무)', run: a => '"차갑네요, 정말."<br>' + a.duel('y_dang') } ] },
  { id: 'bh_gungju', title: '내궁의 문', face: 'b_bukhae', regions: [4], story: true, mine: true, arrival: true, when: a => a.origin === 'bukhae',
    text: '천산 초입의 눈보라 속에 궁주 설무향이 서 있다. "천마 앞에 서기 전에 묻겠다. 네 얼음이 내 얼음을 깰 수 있느냐?"',
    choices: [
      { label: '궁주에게 한 수 청한다 (비무)', run: a => (a.title('내궁의 제자'), '"좋다. 와라."<br>' + a.duel('m_bukhae')) },
      { label: '예를 올리고 비결을 청한다', run: a => '궁주가 손끝으로 이마를 짚었다. 한기가 머릿속까지 맑게 했다.<br>' + a.give('card', 'bukhae') } ] },
  // ── 사천당가 외문 독수: 적통 당소소와 문중의 배신자 ──
  { id: 'dg_oath', title: '독경 한 장', face: 'y_dang', regions: [0], story: true, mine: true, arrival: [0], when: a => a.origin === 'dang',
    text: '낙양 외곽. 품에서 꺼낸 독경 한 장에 가주의 필체가 있다. "천마를 잡으면 내문으로 들인다. 못 하면 돌아오지 마라."',
    choices: [
      { label: '독경을 외우고 태운다', run: a => '불꽃이 푸르게 일었다.<br>' + a.exp(10) },
      { label: '해독단부터 챙긴다', run: a => '독을 쓰는 자가 먼저 챙길 것은 해독단이다.<br>' + a.give('pill', 'haedok', 1) } ] },
  { id: 'dg_rival', title: '독봉 당소소', face: 'y_dang', regions: [1], story: true, when: a => a.origin === 'dang',
    text: '적통 당소소가 나루터 난간에 앉아 독침을 돌린다. "외문이 가문 이름을 달고 다닌다면서요? 실력 좀 봐야겠어요."',
    choices: [
      { label: '독침을 받아 준다 (비무)', run: a => '"후훗, 아프지 않게 놔 드릴게요."<br>' + a.duel('y_dang') },
      { label: '"내문 자리는 천마 앞에서 가리자."', run: a => '"재미없는 사람." 당소소가 독낭 하나를 던져 주고 사라졌다.<br>' + a.give('card', 'dang') } ] },
  { id: 'dg_traitor', title: '문중의 배신자', face: 'b_dangno', regions: [2], story: true, mine: true, arrival: true, when: a => a.origin === 'dang',
    text: '당가 외곽이 독인 천지다. 장로 당노파가 독경을 훔쳐 오독문과 손을 잡았다. 가주의 전갈은 짧다. "치워라."',
    choices: [
      { label: '독인부터 벤다 (전투)', run: a => (a.gold += 30, '당가의 독인은 당가의 독으로 잡는다. 은자 +30<br>' + a.fight(['dokin', 'dokin'], 'normal')) },
      { label: '본가 약방을 털어 간다', run: a => '"외문이 약방을?" 약방 노인이 혀를 차며 한 움큼 쥐여 주었다.<br>' + a.give('pill', 'geumchang', 2) } ] },
  { id: 'dg_letter', title: '가주의 전갈', face: 'y_dang', regions: [3], story: true, when: a => a.origin === 'dang',
    text: '가주의 전서구가 내려앉았다. "당노파의 목을 봤다. 쓸 만하구나." 발목에 작은 독낭이 묶여 있다.',
    choices: [
      { label: '독낭을 연다', run: a => '안에 든 것은 독경의 다음 장이었다.<br>' + a.give('card', 'dang') },
      { label: '가주의 칭찬을 새긴다', run: a => a.title('가주가 아는 이름') + ' · ' + a.exp(20) } ] },

  // ── 남궁세가 방계: 적통 사촌과의 가주 계승전 ──
  { id: 'sg_rival1', title: '가주 계승전', face: 'y_namgung', regions: [1], story: true, when: a => a.origin === 'sega',
    text: '장강 나루에서 사촌 남궁현이 길을 막았다. "가주 자리는 적통인 내 것이다, 방계 놈아."',
    choices: [
      { label: '검을 뽑아 받아 준다 (비무)', run: a => '"방계의 검이 어떤지 보여 주지."<br>' + a.duel('y_namgung') },
      { label: '"천마 앞에서 보자."', run: a => '"흥, 겁쟁이." 남궁현이 코웃음 쳤다.<br>' + a.exp(10) } ] },
  { id: 'sg_letter', title: '본가의 서신', face: 'y_namgung', regions: [2], story: true, when: a => a.origin === 'sega',
    text: '본가에서 서신이 왔다. "남궁의 이름에 먹칠하지 마라." 봉투 속에 은자와 금창약이 들어 있다.',
    choices: [
      { label: '은자를 챙긴다', run: a => (a.gold += 40, '은자 +40. 가주의 필체가 낯설게 엄하다.') },
      { label: '금창약을 챙긴다', run: a => '쓸 날이 올 것이다.<br>' + a.give('pill', 'geumchang', 2) } ] },
  { id: 'sg_rival2', title: '장로들 앞에서', face: 'y_namgung', regions: [3], story: true, when: a => a.origin === 'sega',
    text: '남궁세가 장로들이 섬서까지 따라왔다. 남궁현이 다시 검을 뽑는다. "이번엔 장로들이 증인이다."',
    choices: [
      { label: '장로들 앞에서 겨룬다 (비무)', run: a => (a.title('남궁의 검') , '"좋다. 둘 중 누가 남궁의 검인지 가리자."<br>' + a.duel('y_namgung')) },
      { label: '장로들에게 예를 올린다', run: a => (a.stat('crit', 4), '"예를 아는 아이로구나." 장로가 검결 하나를 일러 주었다. 치명 +4%') } ] },
];
