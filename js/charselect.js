// charselect.js — 출신 고르기: 문이 열리며 인물이 나오는 오락실풍 선택창. 손가락은 고르기만, 출두는 단추나 결정 키로(카드 보상과 같은 규칙)
import { el, ui, pushKeys, sfx, shake, flashScreen, wait, touchy } from './engine.js';
import { CARDS } from './cards.js';
import { ORIGINS } from './data.js';
import { canvas } from './pixel.js';

// 이 화면의 둥근 것·빛은 모두 칸 단위로 찍는다(매끈한 원·번지는 빛은 도트 화면에서 튄다)
function knob(r = 12) { // 청동 문고리 판: 왼쪽 위가 밝고 오른쪽 아래가 어두운 테
  const c = canvas(r * 2, r * 2), x = c.getContext('2d');
  for (let py = 0; py < r * 2; py++) for (let px = 0; px < r * 2; px++) {
    const dx = px + 0.5 - r, dy = py + 0.5 - r, q = Math.hypot(dx, dy);
    if (q > r) continue;
    x.fillStyle = q > r - 2 ? (dx + dy < -3 ? '#f0c860' : dx + dy > 3 ? '#7a4c14' : '#c89030') : q > r - 3 ? '#0c0603' : '#1c0e06';
    x.fillRect(px, py, 1, 1);
  }
  return c.toDataURL();
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], glows = {};
function glow(col) { // 발밑 빛무리: 망점으로 옅어진다
  if (glows[col]) return glows[col];
  const W = 96, H = 72, c = canvas(W, H), x = c.getContext('2d'); x.fillStyle = col; x.globalAlpha = 0.32;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (1 - Math.hypot((px - W / 2) / (W / 2), (py - H + 14) / (H - 14)) > (BAYER[(py % 4) * 4 + (px % 4)] + 1) / 17 + 0.08) x.fillRect(px, py, 1, 1);
  return (glows[col] = c.toDataURL());
}
let STAMP = null;
function stamp() { // 붉은 도장: 글꼴을 흑백으로 잘라 도트 그대로 키운다
  if (STAMP) return STAMP;
  const c = canvas(16, 16), x = c.getContext('2d');
  x.fillStyle = '#ff3040'; x.font = '12px G11B'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('出', 8, 8);
  const d = x.getImageData(0, 0, 16, 16); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; x.putImageData(d, 0, 0);
  x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16);
  return (STAMP = c.toDataURL());
}

const css = el('style', '', `
.csel { display: flex; flex-direction: column; overflow: hidden; color: #fff; background: repeating-linear-gradient(90deg, #17121e 0 7px, #120e18 7px 14px); }
.cshead { flex: none; height: 19px; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(#4a1412 0 6px, #34100e 6px 12px, #1c0808 12px); border-bottom: 1px solid #d09830; box-shadow: 0 1px 0 #000; }
.cshead b { font: 12px G11B; color: #ffe070; text-shadow: 1px 1px #900010; letter-spacing: 3px; } .cshead span { font: 10px G9; color: #d8b890; }
.csgrid { flex: none; display: grid; grid-template-columns: repeat(8, 38px); grid-auto-rows: 96px; gap: 2px; justify-content: center; padding: 3px 0 2px; }
.cspan { position: relative; overflow: hidden; background: #06040c; box-shadow: 0 0 0 1px #4a3a20; cursor: pointer; }
.cspt { position: absolute; inset: 0; background: center top / 50px 96px no-repeat; image-rendering: pixelated; filter: grayscale(.6) brightness(.55); transition: filter .12s steps(3); }
.cspan.on { box-shadow: 0 0 0 1px #fff0a0, 0 0 0 2px var(--c); z-index: 2; } .cspan.on .cspt { filter: none; animation: csHop .3s steps(3); }
@keyframes csHop { 40% { transform: translateY(-2px); } }
.csnm { position: absolute; left: 0; right: 0; bottom: 0; padding: 1px 0; text-align: center; font: 10px/10px G9; color: #c8c0b0; text-shadow: 1px 1px #000; background: #000a; white-space: nowrap; }
.csnm u { text-decoration: none; display: none; } #root.tall .csnm u { display: inline; } #root.tall .csnm s { display: none; } .csnm s { text-decoration: none; }
.cspan.on .csnm { color: #ffe070; }
.cstag { display: none; position: absolute; left: 1px; top: 1px; padding: 0 2px; font: 10px/11px G9; color: #fff; background: #c01020; box-shadow: 0 0 0 1px #000; animation: blink .6s steps(1) infinite; }
.cspan.on .cstag { display: block; }
.csdoor { position: absolute; top: 0; bottom: 0; width: 50%; z-index: 3; background: repeating-linear-gradient(0deg, #6a3e1c 0 4px, #4c2a12 4px 5px); box-shadow: inset 0 0 0 1px #2a1608; transition: transform .2s steps(5); }
.csdoor.l { left: 0; transform: translateX(-200%); } .csdoor.r { right: 0; transform: translateX(101%); }
.cspan.shut .csdoor { transform: none; }
.csdoor b { position: absolute; left: 100%; top: 50%; z-index: 4; width: 24px; height: 24px; margin: -12px 0 0 -12px; text-align: center; font: 12px/24px G11B; color: var(--c); background: url(${knob()}) 0 0 / 24px 24px no-repeat; image-rendering: pixelated; text-shadow: 1px 1px #000; }
.csstamp { position: absolute; left: 50%; top: 40%; z-index: 2; width: 16px; height: 16px; margin: -8px; background: center / 16px 16px no-repeat; image-rendering: pixelated; opacity: 0; }
.cspan.go .csstamp { animation: csStamp .2s steps(1) forwards; }
@keyframes csStamp { 0% { opacity: 1; transform: scale(5); } 34% { opacity: 1; transform: scale(4); } 67% { opacity: 1; transform: scale(3); } 100% { opacity: 1; transform: scale(2); } }
.csinfo { flex: 1; min-height: 0; display: flex; gap: 4px; padding: 2px 5px 4px; }
.csstage { flex: none; width: 96px; position: relative; overflow: hidden; background: #0c0a14 center bottom / 96px 72px no-repeat; image-rendering: pixelated; box-shadow: inset 0 0 0 1px #4a3a20; }
.csstage canvas { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); image-rendering: pixelated; }
.csbody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.cstop { display: flex; align-items: baseline; gap: 4px; } .cstop b { font: 12px G11B; color: #ffe070; text-shadow: 1px 1px #600; white-space: nowrap; } .cstop i { font: 10px G9; font-style: normal; color: var(--c); white-space: nowrap; }
.csdesc { font: 10px/11px G9; color: #e8e0d0; height: 22px; overflow: hidden; }
.csbars { display: flex; gap: 6px; font: 10px/10px G9; color: #a8a0b8; } .csbars span { display: flex; align-items: center; gap: 2px; }
.csbars em { display: block; width: 25px; height: 5px; background: linear-gradient(90deg, var(--c) calc(var(--n) * 5px), #2a2438 0); box-shadow: 0 0 0 1px #000; }
.csfoot { display: flex; gap: 2px; align-items: flex-end; margin-top: auto; }
.csc { flex: none; width: 54px; height: 34px; position: relative; background: #0a0c24 center / 54px 34px no-repeat; image-rendering: pixelated; box-shadow: 0 0 0 1px #4a4a70; }
.csc span { position: absolute; left: 0; right: 0; bottom: 0; font: 10px/10px G9; text-align: center; color: #fff; text-shadow: 1px 1px #000, -1px 0 #000; background: rgba(0,0,0,.45); white-space: nowrap; overflow: hidden; }
.csbtns { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; align-self: stretch; }
.csgo, .csbk { text-align: center; cursor: pointer; box-shadow: 0 0 0 1px #000; }
.csgo { flex: 1; font: 12px/20px G11B; color: #3a1400; background: linear-gradient(#ffe890 0 40%, #f4c858 40% 75%, #e0a030 75%); border: 1px solid #fff0b0; } .csbk { font: 10px/11px G9; color: #c8c0b0; background: #2a2438; }
#root.tall .screen.csel { top: 0; height: 100%; }
#root.tall .csgrid { flex: 1; min-height: 0; grid-template-columns: repeat(4, 76px); grid-auto-rows: minmax(0, 192px); gap: 4px; align-content: center; padding: 4px 0; }
#root.tall .cspt { background-size: 100px 192px; }
#root.tall .csinfo { flex: none; height: 114px; }
#root.pf .csinfo { height: 220px; flex-direction: column; } #root.pf .csstage { width: auto; height: 112px; background-size: 192px 144px; } #root.pf .csstage canvas { transform: translateX(-50%) scale(1.5); transform-origin: 50% 100%; }
#root.pf .csdesc { height: auto; font-size: 10px; } #root.pf .csgo { line-height: 26px; }
`);
document.head.append(css);

export function charSelect(framesOf) { // framesOf(k) → { idle:[캔버스…], attack:[…] }. 돌려주는 값: 고른 출신 열쇠(null이면 뒤로)
  return new Promise(done => {
    const keys = Object.keys(ORIGINS), s = el('div', 'screen csel', null, ui);
    for (const k of keys) { new Image().src = `assets/pt_${k}.png`; for (const c of ORIGINS[k].sel.show) new Image().src = `assets/c_${c}.png`; }
    s.innerHTML = `<div class="cshead"><b>강호 출두</b><span>누가 나설 것인가</span></div><div class="csgrid">${keys.map(k => { const o = ORIGINS[k].sel;
      return `<div class="cspan shut" style="--c:${o.col}"><div class="cspt" style="background-image:url(assets/pt_${k}.png)"></div><div class="csnm"><s>${o.tab}</s><u>${o.short}</u></div><div class="cstag">出</div><div class="csstamp" style="background-image:url(${stamp()})"></div><div class="csdoor r"></div><div class="csdoor l"><b>${o.han}</b></div></div>`; }).join('')}</div><div class="csinfo"><div class="csstage"><canvas></canvas></div><div class="csbody"></div></div>`;
    const panels = [...s.querySelectorAll('.cspan')], cols = () => (document.querySelector('#root').classList.contains('tall') ? 4 : keys.length);
    const info = s.querySelector('.csinfo'), body = s.querySelector('.csbody'), cv = s.querySelector('canvas'), cx = cv.getContext('2d');
    let cur = 0, live = false, timer = 0, off = () => {};
    const stop = () => clearTimeout(timer);
    const draw = f => { if (!f) return; if (cv.width !== f.width || cv.height !== f.height) { cv.width = f.width; cv.height = f.height; } cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(f, 0, 0); };
    const idle = fr => { let i = 0; const t = () => { draw(fr.idle[i++ % fr.idle.length]); timer = setTimeout(t, 330); }; t(); };
    const strike = fr => { stop(); let i = 0; const t = () => { if (i < fr.attack.length) { draw(fr.attack[i++]); timer = setTimeout(t, 90); } else idle(fr); }; t(); };
    const pick = i => {
      cur = (i + keys.length) % keys.length; const k = keys[cur], O = ORIGINS[k], o = O.sel;
      panels.forEach((p, j) => p.classList.toggle('on', j === cur));
      info.style.setProperty('--c', o.col); info.querySelector('.csstage').style.backgroundImage = `url(${glow(o.col)})`;
      body.innerHTML = `<div class="cstop"><b>${O.name}</b><i>${o.style}</i></div><div class="csdesc">${o.blurb}</div><div class="csbars">${['공격', '수비', '기교'].map((n, j) => `<span>${n}<em style="--n:${o.st[j]}"></em></span>`).join('')}</div><div class="csfoot">${o.show.map(c => `<div class="csc" style="background-image:url(assets/c_${c}.png)"><span>${CARDS[c].short || CARDS[c].name}</span></div>`).join('')}<div class="csbtns"><div class="csgo">출두</div><div class="csbk">◀ 뒤로</div></div></div>`;
      body.querySelector('.csgo').onclick = go; body.querySelector('.csbk').onclick = back;
      strike(framesOf(k));
    };
    const finish = k => { stop(); off(); s.remove(); done(k); };
    const back = () => { if (!live) return; live = false; sfx('cancel'); finish(null); };
    const go = async () => {
      if (!live) return; live = false; sfx('ok');
      panels.forEach((p, j) => { if (j !== cur) setTimeout(() => { p.classList.add('shut'); sfx('card'); }, 45 * (((j - cur + keys.length) % keys.length) - 1)); });
      await wait(300);
      panels[cur].classList.add('go'); sfx('boom'); shake(4, 280); flashScreen(ORIGINS[keys[cur]].sel.col, 200, 0.55); strike(framesOf(keys[cur]));
      await wait(950);
      finish(keys[cur]);
    };
    panels.forEach((p, i) => {
      p.onclick = () => { if (live && i !== cur) { sfx('move'); pick(i); } };
      p.onmouseenter = () => { if (live && !touchy() && i !== cur) { sfx('move'); pick(i); } };
    });
    off = pushKeys(k => {
      if (!live) return true;
      const c = cols(), row = k === 'up' ? -c : k === 'down' ? c : 0;
      if (k === 'left' || k === 'right') { sfx('move'); pick(cur + (k === 'left' ? -1 : 1)); }
      else if (row && c < keys.length) { sfx('move'); pick(cur + row); }
      else if (k === 'ok') go();
      else if (k === 'cancel') back();
      return true;
    });
    pick(0);
    panels.forEach((p, i) => setTimeout(() => { p.classList.remove('shut'); sfx('card'); }, 160 + i * 70));
    setTimeout(() => (live = true), 160 + panels.length * 70);
  });
}
