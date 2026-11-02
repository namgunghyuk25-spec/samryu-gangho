// pvpnet.js — 비무 온라인: 아티팩트 room 기능으로 동료와 붙는다. 방 = room.join('pvp-번호'), 주제 하나('pvp')에 {t, …}
// 둘이 같은 시드·같은 덱으로 같은 판정을 돌리므로 오가는 것은 '고른 수'뿐. 사건은 사라질 수 있어 받았다는 답(ack)이 올 때까지 다시 보낸다
import { el, win, ui, listMenu, sfx } from './engine.js';
import * as P from './pvp_rules.js';

const TOPIC = 'pvp';
export async function netInit() { // room을 못 쓰는 화면(로컬·보기 권한·공개 링크)이면 null
  try { return window.claude ? (await window.claude.use('room')) && { online } : null; } catch { return null; }
}
const clean = v => (Array.isArray(v) ? v.filter(id => typeof id === 'string' && P.PV[id]).slice(0, P.SLOTS) : typeof v === 'string' && P.PV[v] ? v : null);

function link(rm, me, opPeer) { // 상대 한 명과 수를 주고받는다
  const inbox = new Map(), out = new Map(), waiters = new Map();
  let gone = null;
  const send = (k, v) => rm.emit(TOPIC, { t: 'move', k, v, to: opPeer }).catch(() => {});
  const offMsg = rm.on(TOPIC, msg => {
    if (msg.peer !== opPeer || !msg.data) return;
    const d = msg.data;
    if (d.t === 'move' && typeof d.k === 'string') {
      rm.emit(TOPIC, { t: 'ack', k: d.k, to: opPeer }).catch(() => {});
      if (!inbox.has(d.k)) { inbox.set(d.k, clean(d.v)); waiters.get(d.k)?.res(inbox.get(d.k)); waiters.delete(d.k); }
    } else if (d.t === 'ack') out.delete(d.k);
    else if (d.t === 'bye') leave('상대가 비무를 그만두었다');
  });
  const offPeers = rm.onPeers(c => { if (c.left.some(p => p.peer === opPeer)) leave('상대가 떠났다'); });
  const timer = setInterval(() => { for (const [k, v] of out) send(k, v); }, 1200); // 답이 올 때까지 다시
  function leave(why) { if (gone) return; gone = why; for (const w of waiters.values()) w.rej(new Error(why)); waiters.clear(); }
  return {
    trade(kind, key, mine) {
      const k = kind + ':' + key;
      if (gone) return Promise.reject(new Error(gone));
      out.set(k, mine); send(k, mine);
      if (inbox.has(k)) return Promise.resolve(inbox.get(k));
      return new Promise((res, rej) => waiters.set(k, { res, rej }));
    },
    close(say = true) { if (say) rm.emit(TOPIC, { t: 'bye', to: opPeer }).catch(() => {}); clearInterval(timer); offMsg(); offPeers(); rm.leave().catch(() => {}); },
  };
}

function waitBox(title, text) { // 기다리는 동안 띄우는 창(취소 가능)
  const s = el('div', 'screen dimbg', null, ui), w = win(24, 50, 272, 0, s, 'msg');
  w.style.height = 'auto';
  w.innerHTML = `<div class="mh">${title}</div><div class="mt">${text}</div><div class="mb"></div>`;
  let cancel; const p = new Promise(r => (cancel = r));
  const m = listMenu(w.lastChild, [{ html: '취소' }], { onPick: () => cancel('cancel'), onCancel: () => cancel('cancel') });
  return { cancelled: p, set: t => (w.children[1].innerHTML = t), close: () => { m.close(); s.remove(); } };
}
function codeBox() { // 방 번호 넣기
  return new Promise(res => {
    const s = el('div', 'screen dimbg', null, ui), w = win(40, 60, 240, 0, s, 'msg pvcode');
    w.style.height = 'auto';
    w.innerHTML = `<div class="mh">방 번호</div><div class="mt">동료가 알려 준 네 자리</div><input inputmode="numeric" maxlength="4" autocomplete="off"><div class="pvcb"><span class="pvbtn2">들어가기</span><span class="pvbtn2 dim">취소</span></div>`;
    const inp = w.querySelector('input'), [ok, no] = w.querySelectorAll('.pvbtn2'), done = v => { s.remove(); res(v); };
    ok.onclick = () => { const v = inp.value.replace(/\D/g, ''); if (v.length === 4) done(v); else sfx('buzz'); };
    no.onclick = () => done(null);
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ok.onclick(); if (e.key === 'Escape') done(null); };
    setTimeout(() => inp.focus(), 50);
  });
}

async function online(mode, school, deck, { playMatch, choose, message }) {
  const room = await window.claude.use('room');
  if (!room) return message('이 화면에서는 온라인 비무를 열 수 없다.<br><span class="dim">참여 권한으로 공유된 링크에서 로그인한 채 열어야 한다.</span>');
  let code;
  if (mode === 'host') code = String(1000 + Math.floor(Math.random() * 9000));
  else { // 열린 방 목록(로비에 내건 것) + 번호 넣기
    const open = room.peers().filter(p => !p.isMe && p.presence?.pvp && /^\d{4}$/.test(p.presence.pvp.code));
    const items = open.map(p => ({ html: `방 ${p.presence.pvp.code} <span class="dim">${P.SCHOOL_KO[p.presence.pvp.school] || ''}</span>`, code: p.presence.pvp.code }));
    const i = await choose('방 들어가기', items.length ? '열린 방' : '열린 방이 아직 안 보인다', [...items, { html: '번호로 들어가기', manual: true }, { html: '<span class="dim">◀ 뒤로</span>' }], { cancel: true });
    if (i < 0 || i > items.length) return;
    code = i < items.length ? items[i].code : await codeBox();
    if (!code) return;
  }
  let rm;
  try { rm = await room.join('pvp-' + code); } catch (e) { return message('방에 들어가지 못했다. <span class="dim">(' + (e.code || e.message) + ')</span>'); }
  const myPeer = () => rm.peers().find(p => p.sameTab)?.peer;
  if (mode === 'host') room.presence({ pvp: { code, school } }).catch(() => {}); // 로비에 방을 내건다
  const box = waitBox(mode === 'host' ? '방 만들기' : '방 들어가기', mode === 'host' ? `방 번호 <span class="gold" style="font-size:16px">${code}</span><br>동료에게 알려 주고 기다린다.` : `방 ${code}에 들어가 주인을 기다린다…`);
  // 손님: join(덱)을 보낸다 → 주인: 시드를 정해 start로 답한다
  const start = await new Promise(res => {
    let timer, offMsg, st = null, offAck = () => {};
    const finish = v => { clearInterval(timer); offMsg(); offAck(); res(v); };
    box.cancelled.then(() => finish(null));
    offMsg = rm.on(TOPIC, msg => {
      const d = msg.data; if (!d || msg.isMe) return;
      if (mode === 'host' && d.t === 'join' && P.SCHOOLS.includes(d.school) && (!st || st.to === msg.peer)) { // 먼저 온 손님 하나로 정한다
        if (!st) {
          const gd = Array.isArray(d.deck) && P.validDeck(d.school, d.deck) ? d.deck : P.startDeck(d.school);
          st = { t: 'start', seed: Math.floor(Math.random() * 1e9), schools: [school, d.school], decks: [deck, gd], to: msg.peer };
          timer = setInterval(() => rm.emit(TOPIC, st).catch(() => {}), 1200);
          offAck = rm.on(TOPIC, m2 => { if (m2.peer === st.to && m2.data?.t === 'go') finish({ ...st, op: st.to }); });
        }
        rm.emit(TOPIC, st).catch(() => {});
      }
      if (mode === 'join' && d.t === 'start' && d.to === myPeer() && Array.isArray(d.decks) && Array.isArray(d.schools)) {
        rm.emit(TOPIC, { t: 'go', to: msg.peer }).catch(() => {});
        setTimeout(() => rm.emit(TOPIC, { t: 'go', to: msg.peer }).catch(() => {}), 600); // 한 번 더(사라질 수 있다)
        finish({ ...d, op: msg.peer });
      }
    });
    if (mode === 'join') { const hello = () => rm.emit(TOPIC, { t: 'join', school, deck }).catch(() => {}); hello(); timer = setInterval(hello, 1200); }
  });
  box.close();
  if (mode === 'host') room.presence({ pvp: null }).catch(() => {});
  if (!start) { rm.leave().catch(() => {}); return; }
  const mySide = mode === 'host' ? 0 : 1, op = 1 - mySide;
  const decks = start.decks.map((d, i) => (P.validDeck(start.schools[i], d) ? d : P.startDeck(start.schools[i])));
  const L = link(rm, myPeer(), start.op);
  try {
    await playMatch({ seed: start.seed | 0, decks, schools: start.schools, mySide, names: mySide === 0 ? ['나', `상대(${P.SCHOOL_KO[start.schools[1]]})`] : [`상대(${P.SCHOOL_KO[start.schools[0]]})`, '나'], link: L });
  } finally { L.close(); }
}
