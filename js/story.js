// story.js — 삼류강호 이야기 기연: 문파입문 · 가문입문 · 용봉지회 · 무림맹
// arrival: 지역 진입 즉시 후보 중 무작위 1개 / 그 외: 奇 노드 우선 등장. 모두 런당 1회
// arrival: [지역…] = 그 지역 진입 후보이면서, 안 뽑히면 奇 노드에도 나온다
// 같은 얼굴(face)의 arrival 변형은 구체적인 것 → 일반적인 것 순으로 둔다(얼굴마다 앞의 것이 후보)
export const STORY = [
  // ───────── 0. 하남 ─────────
  { id: 'sorim_gate', title: '소림 산문', face: 'b_sorim', regions: [0], story: true, arrival: [0], when: a => !a.sect,
    text: '숭산 소림사 산문 앞, 현오대사가 걸음을 멈춘다. "아미타불… 근골이 범상치 않구려. 속가제자 시험을 보겠소?"', choices: [
    { label: '천 계단 물지게 (체력 -25%)', run: a => (a.hurt(0.25), '물 한 방울 흘리지 않고 천 계단을 올랐다. 체력 -25% ' + a.joinSect('sorim')) },
    { label: '방장께 한 수 청한다 (비무)', need: a => a.fresh('m_sorim'), run: a => '"허허, 배짱 하나는 나한이로구려. 노납이 받아 보리다." ' + a.learnSim('yeokgeun', '손을 섞기 전, 대사가 숨 고르는 법 한 줄을 일러 주었다.') + ' ' + a.duel('m_sorim') },
    { label: '정중히 사양한다', run: a => '"인연이 닿으면 다시 만나리다." 대사가 합장했다. ' + a.learnSim('yeokgeun', '떠나며 역근경 구결 한 줄을 일러 주었다.') } ] },
  { id: 'gaebang_join', title: '거지 방주', face: 'b_gaebang', regions: [0, 1], story: true, arrival: [0], when: a => !a.sect,
    text: '다리 밑 누더기 노인이 술병을 흔든다. "끄윽, 자네 거지 꼴이 썩 어울리는구먼! 개방에 들지 않겠나?"', choices: [
    { label: '방주 술값을 낸다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '"거지한테 술 사는 놈은 처음일세!" 은자 -30 ' + a.joinSect('gaebang')) },
    { label: '사흘 밤낮 구걸한다 (체력 -20%)', run: a => (a.hurt(0.2), '쉰밥에 개떼까지 견뎠다. 체력 -20% "합격일세!" ' + a.joinSect('gaebang')) },
    { label: '못 들은 척 지나간다', run: a => '"거지 무시하면 거지 된다네!" 등 뒤로 웃음이 쏟아졌다. ' + a.learnSim('chwipal', '비틀대는 그 걸음새가 이상하게 눈에 박혔다.') } ] },
  { id: 'namgung_guest', title: '남궁세가', face: 'y_namgung', regions: [0], story: true, arrival: [0], when: a => !a.family,
    text: '남궁세가 정문, 소가주 남궁현이 팔짱을 낀다. "삼류가 식객이 되겠다고? 밥값은 하는지 증명해 봐라."', choices: [
    { label: '예물을 바친다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '"예는 아는군. 이름값은 앞으로 해라." 은자 -30 ' + a.joinFamily('namgung')) }, // 첫 도착 이벤트: 시작 은자(30)로 낼 수 있게
    { label: '토벌을 자청한다 (정예 전투)', run: a => '가주가 식객첩을 내준다. "첫 일감이다. 산적 두목을 베어라." ' + a.joinFamily('namgung') + ' ' + a.fight(['sanjeokDu', 'sanjeok'], 'elite') },
    { label: '소가주에게 도전한다 (비무)', run: a => '"좋다. 남궁의 검이 왜 창궁인지 보여 주마!" ' + a.learnSim('changgung', '검을 뽑는 소가주의 숨결에서 창궁의 결이 읽혔다.') + ' ' + a.duel('y_namgung') } ] },

  // ───────── 1. 호북 ─────────
  { id: 'mudang_fate', title: '사문의 인연', face: 'b_mudang', regions: [1], story: true, arrival: true, when: a => !a.sect && a.countSchool('mudang') >= 2,
    text: '무당산 해검지. 청허진인이 그대의 보법을 보더니 눈을 크게 뜬다. "태극의 이치가 몸에 배었구나. 인연이로다!"', choices: [
    { label: '진인께 절을 올린다', run: a => '"먼 길을 돌아 사문에 왔구나." ' + a.joinSect('mudang') + ' ' + (a.train() || a.exp(20)) },
    { label: '홀로 길을 간다', run: a => '"태극은 어디에나 있느니라. 언제든 오너라." ' + a.exp(15) } ] },
  { id: 'mudang_invite', title: '무당의 청첩', face: 'b_mudang', regions: [1], story: true, arrival: true, when: a => !a.sect,
    text: '해검지 앞, 도사들이 공손히 읍한다. "이류에 오르신 소협의 소문이 자자하오. 장문인께서 입문을 청하시오."', choices: [
    { label: '태극권 삼백 번 (체력 -20%)', run: a => (a.hurt(0.2), '해 질 녘까지 원을 그리고 또 그렸다. 체력 -20% ' + a.joinSect('mudang')) },
    { label: '장문인과 논검한다 (비무)', need: a => a.fresh('m_mudang'), run: a => '"말보다 검이 빠르겠지. 빈도가 상대하마." ' + a.duel('m_mudang') },
    { label: '정중히 사양한다', run: () => '"무량수불. 도는 억지로 닦는 게 아니지요." 도사들이 물러났다.' } ] },
  { id: 'mudang_visit', title: '무당 논검', face: 'b_mudang', regions: [1], story: true, arrival: true, when: a => !!a.sect,
    text: '해검지에서 청허진인이 손짓한다. "타 문의 제자로구나. 빈도와 차 한잔하며 검을 논해 보겠나?"', choices: [
    { label: '검리를 논한다', run: a => '"강함은 부드러움 속에 숨어 있느니라." ' + (a.train() || a.exp(20)) },
    { label: '진인과 겨룬다 (비무)', need: a => a.fresh('m_mudang'), run: a => '"허허, 젊은 혈기로구나. 받아 주마." ' + a.duel('m_mudang') },
    { label: '차만 마시고 간다', run: a => (a.heal(0.2), '운무 속 차 한 잔에 기혈이 맑아진다. 체력 20% 회복') } ] },
  { id: 'jegal_guest', title: '제갈세가', face: 'y_jegal', regions: [1], story: true, when: a => !a.family,
    text: '제갈세가 정원에 팔괘진이 펼쳐져 있다. 신산 제갈운이 부채를 접는다. "이 진을 뚫으면 식객으로 모시지요."', choices: [
    { label: '진 속으로 뛰어든다 (체력 -20%)', run: a => (a.hurt(0.2), '생문을 찾아 진을 빠져나왔다. 체력 -20% ' + a.joinFamily('jegal')) },
    { label: '예물로 길을 연다 (은자 35)', need: a => a.gold >= 35, run: a => (a.gold -= 35, '"셈이 빠르신 분이군요." 은자 -35 ' + a.joinFamily('jegal')) },
    { label: '진 대신 제갈운을 친다 (비무)', run: a => '"진법 대신 검이라… 그것도 한 수요." ' + a.duel('y_jegal') } ] },
  { id: 'yongbong', title: '용봉지회', face: 'y_maehwa', regions: [1, 2], story: true, when: a => a.realm <= 2,
    text: '후기지수들의 잔치, 용봉지회가 열렸다! 남궁·화산·제갈·당가의 기재들이 연무대 위에서 그대를 내려다본다.', choices: [
    { label: '출전한다 (비무 3연전)', run: a => '"이름 없는 자가 출전한다!" 장내가 술렁인다. ' + a.tournament() },
    { label: '객석에서 관전한다', run: a => '천재들의 초식을 하나하나 눈에 새겼다. ' + a.exp(15 + 10 * a.region) },
    { label: '발길을 돌린다', run: () => '"명성은 검을 따라오는 법." 함성이 등 뒤로 멀어졌다.' } ] },

  // ───────── 2. 사천 ─────────
  { id: 'cheongseong_star', title: '청성의 환대', face: 'b_cheongseong', regions: [2], story: true, arrival: true, when: a => !a.sect && a.titles.includes('용봉지회 우승'),
    text: '청성산 입구에 도사들이 도열했다. 송학자가 몸소 마중 나와 포권한다. "용봉의 패자를 이제야 모시는구려."', choices: [
    { label: '청성에 몸을 맡긴다', run: a => '"청성의 바람이 그대 등을 밀어 주리라." ' + a.joinSect('cheongseong') + ' ' + (a.train() || a.exp(25)) },
    { label: '환대만 받고 떠난다', run: a => (a.heal(0.3), '산채 요리에 영천수까지 대접받았다. 체력 30% 회복') } ] },
  { id: 'cheongseong_invite', title: '송풍림', face: 'b_cheongseong', regions: [2], story: true, arrival: true, when: a => !a.sect,
    text: '송풍림에 바람이 인다. 송학자가 솔가지 위에서 내려다본다. "일류의 기세라… 이 숲을 지나면 청성의 문을 열겠다."', choices: [
    { label: '검풍 속을 걷는다 (체력 -25%)', run: a => (a.hurt(0.25), '수백 줄기 검풍을 뚫고 숲을 나섰다. 체력 -25% ' + a.joinSect('cheongseong')) },
    { label: '장문인께 도전한다 (비무)', need: a => a.fresh('m_cheongseong'), run: a => '"하하! 바람을 베어 보겠다는 건가." ' + a.duel('m_cheongseong') },
    { label: '숲을 돌아간다', run: () => '"바람은 기다려 주지 않는다." 송학자가 솔바람 속에 사라졌다.' } ] },
  { id: 'cheongseong_visit', title: '청성 논검', face: 'b_cheongseong', regions: [2], story: true, arrival: true, when: a => !!a.sect,
    text: '청성산 중턱, 송학자가 차를 달인다. "타 문의 고수라도 손님은 손님이지. 검 이야기나 나눠 보세."', choices: [
    { label: '검리를 논한다', run: a => '"검은 바람처럼, 머물지 말 것." ' + (a.train() || a.exp(25)) },
    { label: '송학자와 겨룬다 (비무)', need: a => a.fresh('m_cheongseong'), run: a => '"좋지! 청성의 바람 맛을 보여 주마." ' + a.duel('m_cheongseong') } ] },
  { id: 'emei_help', title: '아미의 비구니', face: 'b_emei', regions: [2], story: true, when: a => !a.sect,
    text: '독인 무리가 비구니들을 에워쌌다. 정혜사태가 검을 뽑으며 외친다. "시주, 손을 보태 주겠소?"', choices: [
    { label: '아미 객경으로 싸운다 (전투)', run: a => '"이 싸움이 끝나면 그대는 아미의 객경이오!" ' + a.joinSect('emei') + ' ' + a.fight(['dokin', 'dokin', 'amgi'], 'normal') },
    { label: '사례만 받고 돕는다 (전투)', run: a => (a.gold += 30, '"공덕을 쌓으시는구려." 은자 +30 ' + a.fight(['dokin', 'dokin', 'amgi'], 'normal')) },
    { label: '못 본 척 지나간다', run: () => '등 뒤로 사태의 일갈과 검명이 길게 울렸다.' } ] },
  { id: 'dang_invite', title: '당가의 초대', face: 'y_dang', regions: [2], story: true, when: a => !a.family && a.realm >= 2,
    text: '독봉 당소소가 초청장을 흔든다. "가주께서 일류고수를 객경으로 모시래요. 단, 당가 차는 한 잔 드셔야죠?"', choices: [
    { label: '독차를 비운다 (중독 위험)', run: a => a.pill('haedok')
      ? (a.usePill('haedok'), '해독단으로 독기를 눌러 삼켰다. 해독단 -1 ' + a.joinFamily('dang'))
      : (a.hurt(0.2), '오장이 타는 듯했지만 버텨 냈다. 체력 -20% ' + a.joinFamily('dang')) },
    { label: '당소소와 겨룬다 (비무)', run: a => '"후훗, 차보다 독침이 좋으시다?" ' + a.duel('y_dang') },
    { label: '찻잔을 내려놓는다', run: () => '"겁쟁이는 당가 문턱도 못 넘어요." 당소소가 혀를 찼다.' } ] },

  // ───────── 3. 섬서 ─────────
  { id: 'hwasan_bloom', title: '매화의 인연', face: 'b_hwasan', regions: [3], story: true, arrival: true, when: a => !a.sect && a.countSchool('hwasan') >= 2,
    text: '연화봉에 매화가 흩날린다. 운학이 그대의 검로를 보더니 숨을 삼킨다. "그 매화검… 대체 어디서 배웠느냐?"', choices: [
    { label: '사문에 절을 올린다', run: a => '"잃어버린 매화가 돌아왔구나!" ' + a.joinSect('hwasan') + ' ' + (a.train() || a.exp(30)) },
    { label: '"강호가 스승이오."', run: a => (a.stat('crit', 3), '"허허, 강호가 스승이라." 운학이 검결 하나를 일러 주었다. 치명 +3') } ] },
  { id: 'hwasan_elder', title: '장로의 예', face: 'b_hwasan', regions: [3], story: true, arrival: true, when: a => !a.sect,
    text: '화산 장로들이 산문에 도열했다. 운학이 포권한다. "절정고수께 제자 자리는 결례지요. 객경장로로 모시겠소."', choices: [
    { label: '매화림 연무 (체력 -15%)', run: a => (a.hurt(0.15), '검무가 끝나자 장로들이 탄성을 질렀다. 체력 -15% ' + a.joinSect('hwasan') + ' ' + a.title('화산 객경장로')) },
    { label: '운학과 검을 나눈다 (비무)', need: a => a.fresh('m_hwasan'), run: a => '"좋소! 매화가 피는지 지는지 봅시다." ' + a.duel('m_hwasan') },
    { label: '정중히 사양한다', run: () => '"화산의 문은 늘 열려 있소." 운학이 아쉬운 듯 웃었다.' } ] },
  { id: 'hwasan_visit', title: '화산 논검', face: 'b_hwasan', regions: [3], story: true, arrival: true, when: a => !!a.sect,
    text: '연화봉 정상, 운학이 매화 아래서 검을 닦는다. "타 문의 절정고수라. 매화 피는 것이나 보고 가시겠소?"', choices: [
    { label: '매화검리를 청한다', run: a => '"매화는 추위를 견뎌야 피는 법." ' + (a.train() || a.exp(30)) },
    { label: '운학과 겨룬다 (비무)', need: a => a.fresh('m_hwasan'), run: a => '"검을 뽑으시오. 매화가 지기 전에." ' + a.duel('m_hwasan') },
    { label: '매화주를 얻어 마신다', run: a => (a.heal(0.25), '향기로운 매화주에 기혈이 풀린다. 체력 25% 회복') } ] },
  { id: 'jongnam_trial', title: '종남의 시험', face: 'b_jongnam', regions: [3], story: true, when: a => !a.sect,
    text: '천강석 앞에서 목진이 팔짱을 낀다. "화산만 검을 쓰는 줄 아는가? 이 돌을 들면 종남이 그대를 받겠다."', choices: [
    { label: '천강석을 든다 (체력 -25%)', run: a => (a.hurt(0.25), '핏줄이 터질 듯했지만 돌을 머리 위로 들었다. 체력 -25% ' + a.joinSect('jongnam')) },
    { label: '목진과 겨룬다 (비무)', need: a => a.fresh('m_jongnam'), run: a => '"돌 대신 검이라? 그것도 좋지!" ' + a.duel('m_jongnam') },
    { label: '돌만 보고 떠난다', run: () => '"돌덩이 하나에 겁먹다니." 목진이 코웃음을 쳤다.' } ] },
  { id: 'hwangbo_invite', title: '황보의 혼담', face: 'b_gaebang', regions: [3], story: true, when: a => !a.family && a.realm >= 2,
    text: '비단옷 차림의 황보삼이 나타났다. "실은 내가 황보세가 망나니 숙부일세. 우리 조카딸 사위가 되어 주게!"', choices: [
    { label: '사위가 된다 (예단 은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '혼례상에 국수가 산처럼 쌓였다. 은자 -30 ' + a.joinFamily('hwangbo') + ' ' + a.title('황보가의 사위')) },
    { label: '의형제를 맺는다 (체력 -15%)', run: a => (a.hurt(0.15), '사흘 밤낮 술독을 비우고 형님 아우가 되었다. 체력 -15% ' + a.joinFamily('hwangbo') + ' ' + a.title('황보삼의 의제')) },
    { label: '줄행랑친다', run: () => '"이보게! 조카딸 얼굴은 보고 가야지!" 외침이 멀어졌다.' } ] },
  { id: 'murim_summon', title: '무림맹 초청', face: 'b_sorim', regions: [3, 4], story: true, when: a => a.realm >= 3 && a.sect !== 'magyo',
    text: '현오대사가 무림맹 영패를 들고 찾아왔다. "산문 앞의 그 삼류가 절정에 이르렀구려. 맹이 시주를 부르오."', choices: [
    { label: '영패를 받는다', run: a => (a.gold += 50, '"천하가 시주를 지켜볼 것이오." 은자 +50 ' + a.title('무림맹 신성')) },
    { label: '그날의 비무를 청한다 (비무)', need: a => a.fresh('m_sorim'), run: a => '"허허, 노납도 이날을 기다렸소이다." ' + a.duel('m_sorim') },
    { label: '이름은 필요 없소', run: a => '"그 마음이 곧 협이로다." 대사가 합장했다. ' + a.exp(30) } ] },

  // ───────── 4. 천산 ─────────
  { id: 'magyo_kin', title: '혈맥의 부름', face: 'e_hobeop', regions: [4], story: true, arrival: true, when: a => a.sect !== 'magyo' && a.countSchool('magyo') >= 2,
    text: '설원에 붉은 깃발이 솟는다. 호법이 그대의 기운을 읽더니 무릎을 꿇는다. "마공이 흐르는군. 교주께서 기다리신다."', choices: [
    { label: '신교의 호법이 된다', run: a => '"오늘부터 그대는 신교의 호법이다!" ' + a.joinSect('magyo') + ' ' + a.title('천마신교 호법') },
    { label: '마공은 도구일 뿐 (정예 전투)', run: a => '"교주의 은혜를 걷어차다니!" 호법이 창을 겨눈다. ' + a.fight(['hobeop'], 'elite') } ] },
  { id: 'magyo_defect', title: '배신의 권유', face: 'e_hobeop', regions: [4], story: true, arrival: true, when: a => !!a.sect && a.sect !== 'magyo',
    text: '호법이 설원을 가로막고 웃는다. "정파의 개로 무엇을 얻었나? 신교에 오면 천하의 절반이 네 것이다."', choices: [
    { label: '사문을 버리고 투신한다', run: a => '"현명하군. 피는 피를 부르는 법." ' + a.joinSect('magyo') },
    { label: '사문을 지킨다 (정예 전투)', run: a => '"그렇다면 정파의 개답게 죽어라!" ' + a.fight(['hobeop', 'magyodo'], 'elite') } ] },
  { id: 'magyo_invite', title: '신교의 초대', face: 'e_hobeop', regions: [4], story: true, arrival: true, when: a => !a.sect,
    text: '붉은 깃발 아래 호법이 창을 세운다. "문파 없는 떠돌이라. 교주께서 초절정의 그릇을 찾으신다. 따르겠나?"', choices: [
    { label: '피의 맹세를 한다 (체력 -15%)', run: a => (a.hurt(0.15), '손바닥을 그어 맹세의 피를 바쳤다. 체력 -15% ' + a.joinSect('magyo')) },
    { label: '거절한다 (정예 전투)', run: a => '"그렇다면 설원에 묻혀라!" ' + a.fight(['hobeop'], 'elite') } ] },
  { id: 'gonryun_hermit', title: '설봉의 은자', face: 'b_gonryun', regions: [4], story: true, when: a => !a.sect,
    text: '만년설 봉우리, 백의 노인이 구름을 밟고 선다. "곤륜의 백결이다. 여기까지 올라온 자는 십 년 만이로군."', choices: [
    { label: '빙폭 아래 좌선 (체력 -20%)', run: a => (a.hurt(0.2), '얼음 폭포 아래서 사흘을 버텼다. 체력 -20% ' + a.joinSect('gonryun')) },
    { label: '구름 위의 검을 청한다 (비무)', need: a => a.fresh('m_gonryun'), run: a => '"구름을 벨 수 있다면 베어 보아라." ' + a.duel('m_gonryun') },
    { label: '절하고 물러난다', run: a => (a.heal(0.2), '"구름은 또 만나는 법." 맑은 기운이 몸을 감싼다. 체력 20% 회복') } ] },
  { id: 'gongdong_fist', title: '칠상권 일곱 대', face: 'b_gongdong', regions: [4], story: true,
    text: '설원의 주막, 거구의 노인이 주먹을 우두둑 꺾는다. "공동의 마도원이다. 칠상권 일곱 대, 받아 낼 텐가?"', choices: [
    { label: '일곱 대를 맞는다 (체력 -30%)', run: a => (a.hurt(0.3), '일곱 번째 주먹에도 쓰러지지 않았다. 체력 -30% '
      + (a.sect ? (a.stat('atk', 3), '"근성 하나는 천하제일!" 공력 +3') : '"오늘부터 공동의 제자다!" ' + a.joinSect('gongdong'))) },
    { label: '마도원과 겨룬다 (비무)', need: a => a.fresh('m_gongdong'), run: a => '"하하! 주먹엔 주먹이지!" ' + a.duel('m_gongdong') },
    { label: '술을 한잔 산다 (은자 20)', need: a => a.gold >= 20, run: a => (a.gold -= 20, a.stat('maxHp', 15), '"주먹보다 술이 낫지!" 비전 보약주를 나눠 주었다. 은자 -20, 최대체력 +15') } ] },

  // ───────── 이어지는 기연: 앞의 선택(칭호)이 뒤 이야기를 연다 ─────────
  // 진소: 하남에서 구한 아이가 당가 암기수가 되어 돌아온다
  { id: 'jinso_save', title: '끌려가는 아이', face: 'e_sanjeokdu', regions: [0], story: true,
    text: '흑풍채 산적 두목이 우는 소년을 끌고 간다. "빚쟁이 자식이다. 끼어들면 너도 같이 팔아 주마!"', choices: [
    { label: '소년을 구한다 (정예 전투)', run: a => '"아저씨 뒤에 숨어!" ' + a.title('진소의 은인') + ' ' + a.fight(['sanjeokDu', 'sanjeok'], 'elite') },
    { label: '빚을 대신 갚는다 (은자 30)', need: a => a.gold >= 30, run: a => (a.gold -= 30, '두목이 은자를 세더니 소년을 놓아주었다. 은자 -30<br>"진소예요. 이 은혜 꼭 갚을게요!" ' + a.title('진소의 은인')) },
    { label: '외면한다', run: () => '"살려 줘요!" 비명이 오래 귓가에 남았다.' } ] },
  { id: 'jinso_repay', title: '진소의 보은', face: 'n_amgi', regions: [2, 3], story: true, when: a => a.titles.includes('진소의 은인'),
    text: '당가 암기수 차림의 청년이 넙죽 절한다. "하남에서 목숨을 건진 진소예요! 당가 외문에서 암기를 배웠어요."', choices: [
    { label: '암기 수법을 배운다', run: a => '"제일 아끼는 수법이에요." ' + a.give('card', 'dang') },
    { label: '당가 비상약을 받는다', run: a => '"약방에서 정식으로 받은 거예요!" ' + a.give('pill', 'byeokryeok', 2) + ' ' + a.give('pill', 'haedok', 2) },
    { label: '"잘 컸구나."', run: a => (a.stat('maxHp', 8), '어깨를 두드려 주었다. 가슴이 뜨겁다. 최대체력 +8') } ] },

  // 밀서: 무림맹에 전하면 맹주가 답례, 흑룡방에 팔면 입막음 자객
  { id: 'milseo_find', title: '떠내려온 밀서', face: 'mb_heukryong', regions: [1], story: true,
    text: '갈대밭에 걸린 무림맹 밀사의 시신, 품에 봉인된 밀서. 배 위의 마흑룡이 웃는다. "그 서찰, 은자 50에 사지."', choices: [
    { label: '무림맹에 전한다', run: a => (a.gold += 20, '맹의 연락소가 밀서를 받고 포상을 내렸다. 은자 +20 ' + a.title('밀서를 전한 협객')) },
    { label: '흑룡방에 판다', run: a => (a.gold += 50, '"거래 즐거웠네." 마흑룡이 은자 주머니를 던졌다. 은자 +50 ' + a.title('흑룡방의 거래처')) },
    { label: '시신과 함께 묻는다', run: a => '죽은 자의 짐은 죽은 자에게. 흙을 덮었다. ' + a.exp(10 + 6 * a.region) } ] },
  { id: 'milseo_maeng', title: '맹주의 답례', face: 'b_maengju', regions: [2, 3, 4], story: true, when: a => a.titles.includes('밀서를 전한 협객') && a.sect !== 'magyo',
    text: '객잔 구석에 무림맹주 백리청운이 홀로 앉아 있다. "장강의 밀서를 전한 협객이 자네로군. 맹이 빚을 졌네."', choices: [
    { label: '맹의 보고에서 고른다', run: a => '"맹의 보고에서 나온 물건일세." ' + a.give('relic') },
    { label: '검 한 수를 청한다', run: a => (a.stat('maxHp', 6), '"검은 사람을 살리는 데 쓰게." 최대체력 +6 ' + a.give('card')) },
    { label: '"강호의 일일 뿐입니다."', run: a => (a.gold += 40, a.heal(0.2), '"그 마음이 맹의 보배일세." 맹주가 노자를 쥐여 주었다. 은자 +40, 체력 20% 회복') } ] },
  { id: 'milseo_hit', title: '입막음', face: 'n_suri', regions: [2, 3], story: true, when: a => a.titles.includes('흑룡방의 거래처'),
    text: '수리검이 기둥에 꽂힌다. 흑룡방 자객들이다. "밀서를 판 입은 언젠가 또 열리지. 영영 닫아 주마!"', choices: [
    { label: '맞선다 (전투)', run: a => '"거래처를 이렇게 대하나!" ' + a.fight(['suri', 'suri', 'sapa'], 'normal') },
    { label: '입막음 값을 낸다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, '"말귀는 알아듣는군." 자객들이 은자를 챙겨 사라졌다. 은자 -40') },
    { label: '창밖으로 달아난다 (체력 -15%)', run: a => (a.hurt(0.15), '수리검 두 자루를 등에 꽂은 채 지붕을 넘었다. 체력 -15%') } ] },

  // 아로: 낙양·장강에서 댄 밑천이 비단길 끝에서 돌아온다
  { id: 'aro_invest', title: '서역 상인 아로', regions: [0, 1], story: true,
    text: '낙타를 끄는 서역 상인 아로가 손을 비빈다. "서역 길 밑천이 모자라오. 보태 주시면 돌아와 몇 곱절로 갚으리다!"', choices: [
    { label: '크게 보탠다 (은자 50)', need: a => a.gold >= 50, run: a => (a.gold -= 50, '"사막의 별에 맹세하오!" 아로가 차용증을 써 주었다. 은자 -50 ' + a.title('아로 상단의 물주')) },
    { label: '조금 보탠다 (은자 20)', need: a => a.gold >= 20, run: a => (a.gold -= 20, '"작은 물도 모이면 강이 되지요!" 은자 -20 ' + a.title('아로 상단의 길벗')) },
    { label: '사기꾼 취급한다', run: () => '"두고 보시오!" 아로가 낙타 엉덩이를 걷어찼다.' } ] },
  { id: 'aro_return', title: '아로의 귀환', regions: [3, 4], story: true, when: a => a.titles.includes('아로 상단의 물주') || a.titles.includes('아로 상단의 길벗'),
    text: '모래 먼지 속에 낙타 방울이 울린다. 서역에서 돌아온 아로다. "나리! 장사가 어찌 됐는지 직접 보시구려."', choices: [
    { label: '장부를 펼친다', run: a => {
      const big = a.titles.includes('아로 상단의 물주'), r = a.rand();
      if (r < 0.6) return big ? (a.gold += 100, '대박이다! 비단과 향료가 금값에 팔렸다. 은자 +100<br>' + a.give('relic')) : (a.gold += 50, '"몇 곱절이라 했지요?" 은자 +50');
      const g = r < 0.85 ? (big ? 60 : 25) : (big ? 25 : 10);
      a.gold += g; return (r < 0.85 ? '본전에 이문이 조금 붙었다.' : '모래폭풍에 짐 절반을 잃었다고 한다.') + ` 은자 +${g}`; } },
    { label: '이문 대신 서역 무공을 청한다', run: a => '"서역 도객에게 배운 수요." ' + a.give('card') + (a.titles.includes('아로 상단의 물주') ? ' ' + a.give('card') : '') } ] },

  // 연소하: 혈교 감옥에서 구하면 보은, 버리면 천산까지 쫓아온다
  { id: 'maehwa_jail', title: '혈교 감옥', face: 'y_maehwa', regions: [3], story: true,
    text: '혈교 지부 감옥, 화산의 매화검협 연소하가 쇠사슬에 묶여 있다. "열쇠는 저 옥졸이 차고 있어요. 부탁이에요!"', choices: [
    { label: '옥졸을 벤다 (전투)', run: a => '"뒤는 제가 맡을게요!" ' + a.title('연소하의 은인') + ' ' + a.fight(['hyeolgyo', 'gangsi'], 'normal') },
    { label: '쇠사슬을 끊는다 (체력 -20%)', run: a => (a.hurt(0.2), '맨손으로 사슬을 비틀어 끊었다. 체력 -20%<br>"이 빚, 화산의 이름으로 갚을게요." ' + a.title('연소하의 은인')) },
    { label: '혼자 빠져나간다', run: a => '"…기억해 두겠어요." 차가운 목소리가 등을 찔렀다. ' + a.title('연소하를 외면한 자') } ] },
  { id: 'maehwa_repay', title: '매화의 보은', face: 'y_maehwa', regions: [3, 4], story: true, when: a => a.titles.includes('연소하의 은인'),
    text: '매화 향이 번지더니 연소하가 나타났다. "감옥에서 진 빚, 갚으러 왔어요. 화산은 은혜를 잊지 않아요."', choices: [
    { label: '매화검을 배운다', run: a => '"매화는 추위를 견뎌야 피어요." ' + a.give('card', 'hwasan') },
    { label: '함께 추격대를 친다 (전투)', run: a => (a.heal(0.3), '연소하가 금창약을 발라 주었다. 체력 30% 회복<br>"등은 제가 맡을게요!" ' + a.fight(a.geo === 4 ? ['magyodo', 'hyeolmaSa', 'magyodo'] : ['gangsi', 'hyeollang', 'hyeolgyo'], 'normal')) },
    { label: '매화주를 나눈다', run: a => (a.stat('maxHp', 10), '향기로운 매화주가 기혈을 북돋는다. 최대체력 +10') } ] },
  { id: 'maehwa_grudge', title: '매화의 원한', face: 'y_maehwa', regions: [4], story: true, when: a => a.titles.includes('연소하를 외면한 자'),
    text: '눈보라 속에 매화검이 번뜩인다. 연소하다. "감옥에서 등을 돌린 그 삼류군요. 오늘은 못 도망가요."', choices: [
    { label: '비무를 받는다 (비무)', run: a => '"검으로 사과하시죠!" ' + a.duel('y_maehwa') },
    { label: '사죄하고 배상한다 (은자 40)', need: a => a.gold >= 40, run: a => (a.gold -= 40, '"…사람은 바뀌기도 하죠." 연소하가 검을 거두었다. 은자 -40') },
    { label: '또 달아난다 (체력 -20%)', run: a => (a.hurt(0.2), '등에 매화 모양 검흔이 새겨졌다. 체력 -20%') } ] },
];
