// tele.js — 플레이 기록: 판마다 runs/<id> 문서 하나(요약 + 전투·선택 목록). 아티팩트 db가 없으면(로컬 개발 등) 조용히 꺼진다
let dbp = null, queue = Promise.resolve();
const db = () => (dbp ||= window.claude && window.claude.use ? window.claude.use('db').catch(() => null) : Promise.resolve(null));
const CAP = 150; // 판 하나에 담는 전투·선택 수(문서 크기 한도)
const push = (a, x) => { a.push(x); if (a.length > CAP) a.shift(); };

export function teleStart(run) {
  run.tele = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), started: new Date().toISOString(), status: 'playing', fights: [], picks: [] };
}
export function teleFight(run, f) { if (run.tele) push(run.tele.fights, { ...f, at: Date.now() }); }
export function telePick(run, type, what) { if (run.tele) push(run.tele.picks, { type, what: String(what).replace(/<[^>]+>/g, '').slice(0, 120), region: run.region, at: Date.now() }); }
export function teleSave(run, maxHp, status) { // 문서 하나에 한 번에 하나씩 쓴다
  const t = run.tele; if (!t) return;
  if (status) t.status = status;
  const body = JSON.parse(JSON.stringify({ v: 1, started: t.started, updated: new Date().toISOString(), status: t.status, origin: run.origin, diff: run.diff || 0, school: run.school, route: run.route,
    region: run.region, level: run.level, realm: run.realm, hp: run.hp, maxHp, gold: run.gold, deck: run.deck, relics: run.relics, sim: run.sim, sims: run.sims, combos: run.combos || [], fights: t.fights, picks: t.picks }));
  queue = queue.then(async () => { const d = await db(); if (d) await d.doc('runs/' + t.id).set(body); }).catch(() => {});
}
