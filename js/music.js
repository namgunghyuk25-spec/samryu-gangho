// music.js — 배경음악: WebAudio 합성 + 간보(簡譜) 표기 + lookahead 스케줄러 (오디오 시계만 → clock.scale 무관)
import { audioCtx, limiter, muted } from './engine.js';

// ───────── 표기 ─────────
// 음: [~][#b]1~7[',]  1=key 기준 장음계 도수, '=옥타브↑ ,=↓, ~=온음 아래서 밀어올림 · 0=쉼 · -=늘임 · |=마디(칸 수 검사)
// 타악: k태고 t당고 s박판 w/v목어(고/저) c바라 g소라 o대라 · 대문자=강세 · (kc)=동시 · .=쉼
// [ … ]N = N번 반복 · 전부 4/4, 성부별 d=한 박 칸 수(기본 곡의 d), o=옥타브 이동
const MAJ = [0, 2, 4, 5, 7, 9, 11];
function parse(s, drum, bar) {
  for (let p; p !== s;) { p = s; s = s.replace(/\[([^[\]]*)\](\d+)/g, (_, a, k) => (a + ' ').repeat(k)); }
  const RX = drum ? /\([ktswvcgo]+\)|[ktswvcgo.]|\|/gi : /~?[#b]?[0-7][',]*|-|\|/g;
  const bad = s.replace(RX, '').replace(/\s/g, '');
  if (bad) throw Error(`모르는 기호 "${bad.slice(0, 16)}"`);
  const ev = []; let n = 0, mark = 0, last = null;
  for (const t of s.match(RX) || []) {
    if (t === '|') { if (n - mark !== bar) throw Error(`${n}칸째 마디가 ${n - mark}/${bar}칸`); mark = n; continue; }
    if (t === '-') { if (last) last.l++; }
    else if (t === '.' || t.includes('0')) last = null;
    else if (drum) ev.push({ s: n, h: t.replace(/[()]/g, '') });
    else {
      const [, sl, acc, deg, oct] = t.match(/(~?)([#b]?)(\d)(.*)/);
      ev.push(last = { s: n, l: 1, sl: !!sl, p: MAJ[deg - 1] + (acc === '#') - (acc === 'b') + [...oct].reduce((a, c) => a + (c === ',' ? -12 : 12), 0) });
    }
    n++;
  }
  if (!n || n !== mark) throw Error('마지막 마디가 | 로 닫히지 않음');
  return { ev, n };
}
function compile(T, name) {
  const spb = 60 / T.bpm, evs = []; let beats = 0;
  for (const k in T.v) {
    const V = T.v[k], d = V.d || T.d, drum = V.i === 'drum';
    let r; try { r = parse(V.n, drum, 4 * d); } catch (e) { throw Error(`music ${name}.${k}: ${e.message}`); }
    if (beats && r.n / d !== beats) throw Error(`music ${name}.${k}: ${r.n / d}박 ≠ ${beats}박`);
    beats = r.n / d;
    for (const e of r.ev) evs.push({ V, t: e.s / d * spb, dur: (e.l || 1) / d * spb, h: e.h, sl: e.sl,
      f: drum ? 0 : 440 * 2 ** ((T.key + 12 * (V.o || 0) + e.p - 69) / 12) });
  }
  return { evs: evs.sort((a, b) => a.t - b.t), len: beats * spb, loop: !T.once, echo: Math.min(0.9, spb * 0.75) };
}

// ───────── 악기 ─────────
let ctx, nb, mix, master, duckG, cur = null, players = [], vol = 0.35, lastG = -1;
const LA = 0.2; // 미리 예약하는 초
const G = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
const O = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; };
const F = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
function tone(t, type, f0, f1, dur, v, dst) { // 음높이 떨어지는/오르는 타격음
  const o = O(type, f0), g = G(0);
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
  o.connect(g).connect(dst); o.start(t); o.stop(t + dur);
}
function hiss(t, dur, v, type, f, q, dst) {
  const s = ctx.createBufferSource(), g = G(0);
  s.buffer = nb; s.loop = true;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
  s.connect(F(type, f, q)).connect(g).connect(dst); s.start(t, Math.random() * 1.5); s.stop(t + dur);
}
const KIT = {
  k: (t, v, d) => { tone(t, 'sine', 130, 42, 0.6, v, d); hiss(t, 0.08, v * 0.5, 'lowpass', 800, 1, d); },          // 태고
  t: (t, v, d) => { tone(t, 'sine', 260, 120, 0.28, v * 0.7, d); hiss(t, 0.05, v * 0.3, 'bandpass', 1500, 1, d); },   // 당고
  s: (t, v, d) => { hiss(t, 0.08, v * 0.5, 'bandpass', 2300, 0.8, d); tone(t, 'triangle', 340, 200, 0.06, v * 0.25, d); }, // 박판
  w: (t, v, d) => tone(t, 'sine', 1250, 1100, 0.07, v * 0.4, d),  // 목어 고
  v: (t, v, d) => tone(t, 'sine', 820, 760, 0.08, v * 0.4, d),    // 목어 저
  c: (t, v, d) => hiss(t, 0.3, v * 0.2, 'highpass', 6500, 0.7, d), // 바라
  g: (t, v, d) => { tone(t, 'triangle', 760, 900, 0.8, v * 0.2, d); tone(t, 'sine', 1140, 1330, 0.5, v * 0.08, d); }, // 소라(경극식, 음이 오름)
  o: (t, v, d) => { tone(t, 'sine', 170, 115, 2.2, v * 0.4, d); tone(t, 'triangle', 415, 330, 1.6, v * 0.1, d); hiss(t, 1.4, v * 0.12, 'bandpass', 900, 0.6, d); }, // 대라
};
function zheng(t, e, b) { // 고쟁: 빠른 어택, 지수 감쇠, 닫히는 필터, 작은 옥타브 겹침
  const { f, V } = e, tau = Math.min(0.18 + 60 / f, 0.25 + e.dur * 2), end = t + tau * 6, lp = F('lowpass', 0), g = G(0); // 저음일수록 길게, 빠른 반복음은 짧게(재탄현 시 앞 소리 멎음)
  lp.frequency.setValueAtTime(Math.min(Math.max(f * 10, 1800), 9000), t); lp.frequency.exponentialRampToValueAtTime(f * 2, t + tau * 2);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(V.v, t + 0.004); g.gain.setTargetAtTime(0, t + 0.004, tau);
  for (const [type, m, v] of [['sawtooth', 1, 1], ['triangle', 2, 0.25]]) {
    const o = O(type, f * m), og = G(v);
    if (e.sl) { o.detune.setValueAtTime(-200, t); o.detune.linearRampToValueAtTime(0, t + 0.09); }
    o.connect(og).connect(lp); o.start(t); o.stop(end);
  }
  lp.connect(g); g.connect(b.out); g.connect(b.wet);
  hiss(t, 0.02, V.v * 0.3, 'highpass', 3000, 0.7, b.out); // 가조(손톱) 소리
}
const WIND = { dizi: ['triangle', 4, 0.006, 0.25, 0.25], erhu: ['sawtooth', 2.5, 0.012, 0.12, 0] }; // 파형, 저역배수, 비브라토, 지연, 숨
function wind(t, e, b) { // 적(笛)/이호: 지연 비브라토 + 숨소리
  const { f, dur, V } = e, [type, lpm, vib, vd, br] = WIND[V.i], end = t + dur;
  const o = O(type, f), lp = F('lowpass', f * lpm), g = G(0), lfo = O('sine', 5.2), lg = G(0);
  lfo.connect(lg).connect(o.frequency);
  lg.gain.setValueAtTime(0, t + vd); lg.gain.linearRampToValueAtTime(f * vib, t + vd + 0.35);
  if (e.sl) { o.detune.setValueAtTime(-200, t); o.detune.linearRampToValueAtTime(0, t + 0.12); }
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(V.v, t + 0.05);
  g.gain.setValueAtTime(V.v, Math.max(t + 0.05, end - 0.03)); g.gain.linearRampToValueAtTime(0, end + 0.07);
  o.connect(lp).connect(g); g.connect(b.out); g.connect(b.wet);
  o.start(t); lfo.start(t); o.stop(end + 0.1); lfo.stop(end + 0.1);
  if (br) hiss(t, Math.min(dur, 0.3), V.v * br, 'bandpass', f * 2, 1.2, b.out);
}
function bass(t, e, b) { // 저음 발현(대완 느낌)
  const { f, dur, V } = e, end = t + dur, o = O('sawtooth', f), s = O('sine', f), lp = F('lowpass', f * 3, 2), g = G(0);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(V.v, t + 0.006);
  g.gain.setTargetAtTime(0, t + 0.006, Math.min(dur * 0.5, 1.2) + 0.05); g.gain.setTargetAtTime(0, end, 0.03);
  o.connect(lp).connect(g); s.connect(g); g.connect(b.out);
  for (const x of [o, s]) { x.start(t); x.stop(end + 0.2); }
}
function drone(t, e, b) { // 지속음: 디튠 톱니 + 5도 + 옥타브, 천천히 일렁이는 필터
  const { f, dur, V } = e, end = t + dur, lp = F('lowpass', f * 3, 3), g = G(0), lfo = O('sine', 0.13), lg = G(f * 1.5);
  lfo.connect(lg).connect(lp.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(V.v, t + 0.5);
  g.gain.setValueAtTime(V.v, Math.max(t + 0.5, end)); g.gain.linearRampToValueAtTime(0, end + 0.6);
  lp.connect(g).connect(b.out);
  for (const [m, dt] of [[1, -8], [1, 8], [1.5, 0], [2, 4]]) { const o = O('sawtooth', f * m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(end + 0.7); }
  lfo.start(t); lfo.stop(end + 0.7);
}
const drum = (t, e, b) => { for (const c of e.h) KIT[c.toLowerCase()](t, e.V.v * (c < 'a' ? 1.5 : 1), b.out); };
const INST = { zheng, dizi: wind, erhu: wind, bass, drone, drum };

// ───────── 곡 ─────────
const R8 = '[0000 0000 0000 0000|]8 '; // d4 기준 8마디 쉼
const ZA = ` 6-6- 1'-2'- 3'--2' 3'-5'-| 6'-5'3' 2'-3'- 1'-6- ----| 1'-61' 2'-1'- 6-5- 6-1'-| ~2'--- 3'-2'1' 2'--- 5-6-|
  6-6- 1'-2'- 3'--2' 3'-5'-| ~6'-5'3' 2'-3'- 5'-6'- ----| 1'-2'3' 5'-3'- 2'-1'- 6-1'-| 2'-2'- 2'-3'- 5'3'2'1' 2'-3'-| `; // 전투 주선율
const battle = { bpm: 150, key: 60, d: 4, v: { // a단조 5음(羽調): Am Am F G ×2 | F G Em Am F G Em Em
  lead: { i: 'zheng', v: 0.16, n: ZA + R8 },
  run: { i: 'zheng', v: 0.09, n: R8 + ` 6,123 561'2' 3'2'1'6 5321| 5,6,12 3561' 2'1'65 3216,| 3561' 2'3'5'3' 2'1'65 3532| 6,123 561'2' 3'5'6'5' 3'2'1'6|
    6,123 561'2' 3'2'1'6 5321| 5,6,12 3561' 2'1'65 3216,| 3561' 2'3'5'3' 2'1'65 3532| 3561' 2'3'5'6' 5'3'2'1' 6532| ` },
  dizi: { i: 'dizi', v: 0.13, d: 2, n: `[00 00 00 00|]8 1'- -2' 3'- 5'-| 5'- -6' 5'3' 2'-| 3'- -- -- 2'3'| 6- -- -- --|
    1'- -2' 3'- 5'-| 6'- -5' 3'- 5'-| 3'- -- 2'1' 2'-| 3'- -- -- --| ` },
  bass: { i: 'bass', v: 0.1, o: -2, d: 2, n: `[[66 6'6 66 6'6|]2 44 4'4 44 4'4| 55 5'5 55 5'5|]2
    44 4'4 44 4'4| 55 5'5 55 5'5| 33 3'3 33 3'3| 66 6'6 66 6'6| 44 4'4 44 4'4| 55 5'5 55 5'5| [33 3'3 33 3'3|]2 ` },
  drum: { i: 'drum', v: 0.3, n: '[[(Kc).wk s.wk K.wk swkk|K.wk s.wk K.wk swkk|]3 (Kc).wk s.wk K.wk swkk|K.wk s.wk K.k. TtTt|]2' },
} };
const BB = ` 3'- -- 5'- 6'-| b7'- -6' 5'- 4'-| 3'- 5'- 6'- 3'-| 2'- -1' b7- 2'-| 1'- -- 3'- 5'-| 6'- 5'- 3'- 2'-| 3'- -- 2'- 1'-| 6- -- 00 00| `; // 두목 후반

const TRACKS = {
  title: { bpm: 70, key: 62, d: 4, v: { // b단조 5음: Bm Bm A A Em Em F#m F#m | D A Bm F#m Em A Bm Bm
    zheng: { i: 'zheng', v: 0.12, o: -1, n: ` [6,361' 3'1'63 6,361' 3'1'63|]2 [5,256 2'652 5,256 2'652|]2
      [2,6,23 6326, 2,6,23 6326,|]2 [3,135 6531 3,135 6531|]2
      1561' 2'1'65 1561' 2'3'5'3'| 5,256 2'652 5,256 2'652| 6,361' 3'1'63 6,361' 3'1'63| 3,135 6531 3,135 6531|
      2,6,23 6326, 2,6,23 6326,| 5,256 2'652 5,256 2'652| [6,361' 3'1'63 6,361' 3'1'63|]2 ` },
    dizi: { i: 'dizi', v: 0.13, n: ` 0000 0000 0000 0000| 0000 0000 0000 3-5-| 6--- --5- 3--- ----| 2--- ---- --00 1-2-|
      3--- -5-6 1'--- ----| 2'--- --1'- 6--- ----| 5--- 6-3- 2--- --1-| ~3--- ---- --00 5-6-|
      1'--- --2'- 3'--- 5'---| 3'--- ---- 2'--- 1'---| 6--- --1'- 2'--- ----| ~3'--- ---- ---- 0000|
      2'--- 3'-2'- 1'--- ----| 6--- --5- 3--- 2-3-| 6--- ---- ---- ----| ---- ---- 0000 0000| ` },
    bass: { i: 'bass', v: 0.09, o: -2, d: 1, n: '6---|6---|5---|5---|2---|2---|3---|3---|1---|5---|6---|3---|2---|5---|6---|6---|' },
    drum: { i: 'drum', v: 0.28, d: 2, n: '[k... ....|.... ..k.|]4 (kg)... ....|.... ..k.|[k... ....|.... ..k.|]2 k... ....|.... t.t.|' },
  } },
  map: { bpm: 96, key: 67, d: 2, v: { // G장조 5음(宮調): G D Em Bm C G Am D | C D Bm Em Am D G G
    dizi: { i: 'dizi', v: 0.12, n: ` 35 61' 5- 32| 12 35 2- --| 35 61' 2'1' 65| 3- 56 3- --| 61' 65 35 6-| 53 21 2- 35| 6- 53 23 21| 2- -- 03 56|
      1'- 2'3' 2'1' 6-| 56 1'2' 2'- --| 3'- 2'1' 61' 2'-| 1'- 65 6- --| 56 1'6 53 23| 5- 32 12 35| 3- 53 2- 32| 1- -- -- 00| ` },
    zheng: { i: 'zheng', v: 0.1, o: -1, n: ` 1,5, 13 53 15,| 5,2 56 2'6 52| 6,3 61' 3'1' 63| 3,6, 35 65 36,| 4,1 45 65 41| 1,5, 13 53 15,| 2,6, 23 63 26,| 5,2 56 2'6 52|
      4,1 45 65 41| 5,2 56 2'6 52| 3,6, 35 65 36,| 6,3 61' 3'1' 63| 2,6, 23 63 26,| 5,2 56 2'6 52| [1,5, 13 53 15,|]2 ` },
    bass: { i: 'bass', v: 0.08, o: -2, d: 1, n: ` 1-5,-| 5,-2-| 6,-3-| 3-6,-| 4,-1-| 1-5,-| 2-6,-| 5,-2-|
      4,-1-| 5,-2-| 3-6,-| 6,-3-| 2-6,-| 5,-2-| 1-5,-| 1-5,-| ` },
    drum: { i: 'drum', v: 0.22, n: '[[k. w. .v w.|]7 k. w. .v ww|]2' },
  } },
  battle,
  elite: { ...battle, key: 57, v: { ...battle.v, // 단3도 아래(f#단조) + 낮은 이호 겹침 + 무거운 북
    erhu: { i: 'erhu', v: 0.08, o: -1, n: ZA + R8 },
    drum: { i: 'drum', v: 0.36, n: '[[(Ko).kK s.kk K.kK skKk|[K.kK s.kk K.kK skKk|]2 K.kK s.kk TtTt TTKK|]2]2' },
  } },
  boss: { bpm: 140, key: 55, d: 4, v: { // e단조 + 프리지안 F: Em F Em F C D Em Em ×2
    zheng: { i: 'zheng', v: 0.13, o: -1, n: '[[6,6,36,]4|[b7,b7,4b7,]4|[6,6,36,]4|[b7,b7,4b7,]4|[4,4,14,]4|[5,5,25,]4|[[6,6,36,]4|]2]2' },
    bass: { i: 'bass', v: 0.1, o: -2, d: 1, n: '[6---|b7---|6---|b7---|4---|5---|6---|6---|]2' },
    erhu: { i: 'erhu', v: 0.1, d: 2, n: ` 6- -- 3'- 2'1'| 2'- -1' b7- 6-| 6- 6- 3'- 5'-| 4'- -3' 2'- 1'-| 3'- -- 2'3' 5'-| 6'- -- 5'- 3'-| 2'- 3'- 6- --| -- -- 06 1'2'|` + BB },
    dizi: { i: 'dizi', v: 0.07, o: 1, d: 2, n: '[00 00 00 00|]8 ' + BB },
    drum: { i: 'drum', v: 0.4, n: '[(Ko)..k ..K. K..k K.kk|[K..k ..K. K..k K.kk|]2 K..k ..K. TtTt TTKK|[K..k ..K. K..k K.kk|]3 K..k ..K. TtTt TTKK|]2' },
    perc: { i: 'drum', v: 0.18, d: 2, n: '[.w .w .w .v|]16' },
  } },
  final: { bpm: 160, key: 50, d: 4, v: { // 천마: D 지속음 위 1 b2 4 5 b6 (都節), D Eb D | D Bb A
    drone: { i: 'drone', v: 0.05, o: -1, d: 1, n: '1---|----|----|----|b2---|----|1---|----|1---|----|----|----|b6---|----|5---|----|' },
    pulse: { i: 'bass', v: 0.09, o: -1, n: `[111'1 111'1 111'1 1'11'1|]4 [b2b2b2'b2 b2b2b2'b2 b2b2b2'b2 b2'b2b2'b2|]2 [111'1 111'1 111'1 1'11'1|]6
      [b6,b6,b6b6, b6,b6,b6b6, b6,b6,b6b6, b6b6,b6b6,|]2 [5,5,55, 5,5,55, 5,5,55, 55,55,|]2` },
    erhu: { i: 'erhu', v: 0.1, o: 1, d: 2, n: ` 1- b21 5,- --| 1- b21 b6,- 5,-| 4- -5 b6- 5-| 4- b2- 1- --| b2- -- b3- b2-| 1- b2- 4- --| 5- -b6 5- 4-| b2- -- 1- --|
      1'- -- b7- 1'-| b2'- 1'- b7- 5-| b6- 5- 4- b2-| 1- -- -- 5-| b6- -- 1'- b7-| b6- 5- 4- 5-| #4- 5- b6- 5-| b2- -- 1- --| ` },
    zheng: { i: 'zheng', v: 0.09, o: 1, n: R8 + "[1b245 b61'b2'4' 5'4'b2'1' b654b2|]6 [5'5'5'5' 5'5'5'5' #4'#4'#4'#4' 5'5'5'5'|]2" },
    drum: { i: 'drum', v: 0.4, n: '[(Ko).kk s.kk K.kk sKkk|[K.kk s.kk K.kk sKkk|]2 K.kk s.kk TTtt TTTT|[K.kk s.kk K.kk sKkk|]3 K.kk s.kk TTtt TTTT|]2' },
    perc: { i: 'drum', v: 0.15, d: 1, n: '[Cccc|]16' },
  } },
  duel: { bpm: 112, key: 60, d: 4, v: { // 장문인 비무(a단조): 고쟁 분산화음 위 이호, 뒤에 적이 받는다. Am F G Em Am F Dm E ×2. 대라가 울리는 무거운 걸음
    zheng: { i: 'zheng', v: 0.1, n: "[[6,136 1'361]2|[4,146 1'641]2|[5,257 2'752]2|[3,735 7,537]2|[6,136 1'361]2|[4,146 1'641]2|[2,462 4'642]2|[3,#5,73 #5,73#5,]2|]2" },
    bass: { i: 'bass', v: 0.11, o: -2, d: 1, n: '[6---|4---|5---|3---|6---|4---|2---|3---|]2' },
    erhu: { i: 'erhu', v: 0.11, d: 2, n: "3'- 6'- 5'- 3'-| 4'- -5' 6'- 1''-| 7'- 5'- 3'- 5'-| 3'- -- -- 2'3'| 6'- 7'- 1''- 7'-| 6'- 4'- 1'- 4'-| 2'- 4'- 6'- 5'-| #5'- -- 3'- --| 3'- -- -- -- | 4'- -- -- --| 5'- -- -- --| 3'- -- -- --| 6'- -- 5'- --| 4'- -- 1'- --| 2'- -- 4'- --| 3'- -- -- --|" },
    dizi: { i: 'dizi', v: 0.08, o: 1, d: 2, n: "[00 00 00 00|]8 3'- 6'- 5'- 3'-| 4'- -5' 6'- 1''-| 7'- 5'- 3'- 5'-| 3'- -- -- 2'3'| 6'- 7'- 1''- 7'-| 6'- 4'- 1'- 4'-| 2'- 4'- 6'- 5'-| #5'- -- 3'- --|" },
    drum: { i: 'drum', v: 0.42, n: '[(Ko)... ..k. K... ..k.|K... ..k. K... ..k.|K... ..k. K... ..k.|K.k. K.k. T.t. TTtt|]4' },
    perc: { i: 'drum', v: 0.16, d: 2, n: '[.w .w .v .w|]16' },
  } },
  mboss: { bpm: 128, key: 58, d: 4, v: { // 소두목전(g단조): 낮은 고쟁 리프로 밀어붙인다. Gm Gm Eb F Gm Gm Eb D ×2
    zheng: { i: 'zheng', v: 0.12, n: "[[6,06,3 6,06,b7,]2|[6,06,3 6,06,b7,]2|[4,04,1 4,04,5,]2|[5,05,2 5,05,6,]2|[6,06,3 6,06,b7,]2|[6,06,3 6,06,b7,]2|[4,04,1 4,04,5,]2|[3,03,#5, 3,03,7,]2|]2" },
    bass: { i: 'bass', v: 0.11, o: -2, d: 1, n: '[6---|6---|4---|5---|6---|6---|4---|3---|]2' },
    erhu: { i: 'erhu', v: 0.11, d: 2, n: "[6- 6- 1'- 3'-| 2'- 1'- 6- --| 4'- 3'- 1'- 4-| 5- 6- 1'- 2'-| 3'- 3'- 5'- 6'-| 5'- 3'- 2'- --| 1'- 4'- 3'- 1'-| 3'- -- #5- --|]2" },
    dizi: { i: 'dizi', v: 0.07, o: 1, d: 2, n: "[00 00 00 00|]8 6- 6- 1'- 3'-| 2'- 1'- 6- --| 4'- 3'- 1'- 4-| 5- 6- 1'- 2'-| 3'- 3'- 5'- 6'-| 5'- 3'- 2'- --| 1'- 4'- 3'- 1'-| 3'- -- #5- --|" },
    drum: { i: 'drum', v: 0.4, n: '[(Kc).k. s.k. K.k. s.kk|[K.k. s.k. K.k. s.kk|]2 K.k. s.k. TtTt TTTT|]4' },
    perc: { i: 'drum', v: 0.14, d: 1, n: '[Cccc|]16' },
  } },
  victory: { once: true, bpm: 120, key: 60, d: 4, v: { // C장조 상행 팡파르 (4초)
    dizi: { i: 'dizi', v: 0.13, n: "5-6- 1'-2'- 3'-5'- 3'-2'-| ~3'--- 5'-6'- 1''--- 0000|" },
    zheng: { i: 'zheng', v: 0.15, n: "1,5,13 5-1'- 4,146 1'-6-| 1,5,13 51'3'5' 1''--- 0000|" },
    bass: { i: 'bass', v: 0.1, o: -2, d: 1, n: '1-4-|1---|' },
    drum: { i: 'drum', v: 0.28, n: '(kc)... .... k.k. (Kg)...|(Kc)... .... .... ....|' },
  } },
  defeat: { once: true, bpm: 90, key: 60, d: 2, v: { // a단조 하강 (5.3초)
    erhu: { i: 'erhu', v: 0.1, n: "3'2' 1'6 ~5- 3-| ~2- 16, -- --|" },
    zheng: { i: 'zheng', v: 0.13, o: -1, n: "6,3 6- 4,1 4-| 2,6, 2- 6,,- --|" },
    bass: { i: 'bass', v: 0.1, o: -2, d: 1, n: '6-4-|2-6,-|' },
    drum: { i: 'drum', v: 0.28, n: 'k. .. k. ..|o. .. .. ..|' },
  } },
};
TRACKS.final2 = { ...TRACKS.final, bpm: 176, v: { ...TRACKS.final.v, // 천마 2페이즈: 더 빠르고, 이호에 높은 적을 겹치고, 북이 빽빽해진다
  high: { i: 'dizi', v: 0.07, o: 2, d: 2, n: TRACKS.final.v.erhu.n },
  drum: { i: 'drum', v: 0.46, n: '[(Ko)kkk sKkk Kkkk sKkk|[Kkkk sKkk Kkkk sKkk|]2 Kkkk sKkk TTtt TTTT|[Kkkk sKkk Kkkk sKkk|]3 Kkkk sKkk TTtt TTTT|]2' },
  perc: { i: 'drum', v: 0.17, d: 2, n: '[CcCc CcCc|]16' },
} };
const TR = {};
for (const k in TRACKS) TR[k] = compile(TRACKS[k], k);

// ───────── 재생 ─────────
function init() {
  if (ctx) return;
  ctx = audioCtx();
  nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  mix = ctx.createDynamicsCompressor(); // 클리핑 방지용 완만한 압축
  mix.threshold.value = -6; mix.knee.value = 6; mix.ratio.value = 4; mix.attack.value = 0.005; mix.release.value = 0.25;
  master = G(0); duckG = G(1); mix.connect(duckG).connect(master).connect(limiter());
  setInterval(tick, 25);
  for (const k of ['keydown', 'pointerdown']) addEventListener(k, () => ctx.state === 'suspended' && ctx.resume(), true); // 자동재생 차단 해제
}
function bus(echo) { // 곡마다 페이드용 게인 + 피드백 딜레이 '전각 울림' 센드
  const out = G(0), wet = G(0.25), dl = ctx.createDelay(1), fb = G(0.35), lp = F('lowpass', 2600);
  dl.delayTime.value = echo;
  wet.connect(dl).connect(lp).connect(fb).connect(dl); lp.connect(out); out.connect(mix);
  return { out, wet, nodes: [out, wet, dl, lp, fb] };
}
function fade(p, sec) {
  const n = ctx.currentTime, g = p.bus.out.gain;
  g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(0, n + sec);
  p.kill = Math.min(p.kill || Infinity, n + sec);
}
function tick() {
  const now = ctx.currentTime, g = muted ? 0 : vol;
  if (g !== lastG) master.gain.setTargetAtTime(lastG = g, now, 0.05);
  players = players.filter(p => {
    if (now > p.kill) { p.bus.nodes.forEach(x => x.disconnect()); return false; }
    const { evs, len, loop } = p.T, end = Math.min(now + LA, p.kill || Infinity);
    while (!p.done) {
      const e = evs[p.i], t = p.t0 + e.t;
      if (t > end) break;
      if (t >= now) INST[e.V.i](t, e, p.bus); // 백그라운드 탭에서 밀린 음은 건너뜀
      if (++p.i < evs.length) continue;
      if (loop) { p.i = 0; p.t0 += len; } else { p.done = true; p.kill ??= p.t0 + len + 3; }
    }
    return true;
  });
}
export const music = {
  play(name) {
    const T = TR[name];
    if (!T || (cur && cur.name === name && !cur.done)) return;
    init();
    if (cur) fade(cur, 0.6);
    const b = bus(T.echo), n = ctx.currentTime;
    b.out.gain.setValueAtTime(0, n); b.out.gain.linearRampToValueAtTime(1, n + (T.loop ? 0.6 : 0.03));
    players.push(cur = { name, T, bus: b, t0: n + 0.08, i: 0 });
  },
  stop(fadeSec = 0.6) { if (cur) fade(cur, Math.max(fadeSec, 0.01)); cur = null; },
  setVolume(v) { vol = Math.min(1, Math.max(0, +v || 0)); },
  duck(k, ms) { if (!duckG) return; const n = ctx.currentTime, g = duckG.gain; g.cancelScheduledValues(n); g.setTargetAtTime(k, n, 0.012); g.setTargetAtTime(1, n + ms / 1000, 0.14); }, // 큰 타격·컷신 때 음악을 잠깐 낮춘다
};
