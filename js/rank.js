// rank.js — 강호 명부: 출사·혈로·아수라 판은 시작할 때 서버 토큰을 받고, 끝나면 이름과 전투 목록을 보낸다. 서버(ranking/Code.gs)가 같은 공식으로 점수를 다시 계산한다
export const RANKING_URL = 'https://script.google.com/macros/s/AKfycbzGMrREd59pBl2wJWUFCwfGY0XGs5wxYvnR6Y4sheqAlTxwiVk7WDaK6zs6Sshwyssk/exec'; // 비어 있으면 명부를 숨긴다
export const hasRank = !!RANKING_URL && !window.claude; // 아티팩트 화면은 외부 서버에 닿지 못한다
export const RANKED = [1, 2, 3]; // 출사(보통)·혈로(어려움)·아수라
export const POINT = { normal: 20, elite: 120, mboss: 250, boss: 500, duel: 300 };
export const VER = 53;

export async function api(body, query = '') {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 20000); // Apps Script는 오래 쉬면 깨어나는 데 몇 초 걸린다
  try {
    const res = body
      ? await fetch(RANKING_URL, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal })
      : await fetch(RANKING_URL + (RANKING_URL.includes('?') ? '&' : '?') + (query ? query + '&' : '') + 't=' + Date.now(), { signal: ctl.signal });
    return await res.json();
  } finally { clearTimeout(tm); }
}
export function rankStart(run) { // 토큰이 없으면 받아 둔다(실패하면 다음 칸에서 다시)
  if (!hasRank || !RANKED.includes(run.diff) || run.lbt) return;
  api(null, 'action=start').then(j => { if (j.ok) run.lbt ||= j.token; }).catch(() => { });
}
export function tally(fights) {
  const c = { turns: 0, normal: 0, elite: 0, mboss: 0, boss: 0, duel: 0 };
  for (const f of fights) { c.turns += f[2] || 0; if (f[4] === 'win' && f[0] in POINT) c[f[0]]++; }
  return c;
}
export function scoreParts(r) {
  let fight = 0;
  for (const k in POINT) fight += (r[k] || 0) * POINT[k];
  return { region: r.region * 1000, fight, clear: r.win ? 3000 : 0, hp: r.win ? Math.round(r.hp / r.maxHp * 1000) : 0, speed: r.win ? Math.max(0, 2000 - r.turns * 4) : 0 };
}
export const scoreOf = r => Object.values(scoreParts(r)).reduce((a, b) => a + b, 0);
export function runRecord(run, win, maxHp, place) { // 서버로 보낼 한 판
  const fights = (run.tele?.fights || []).map(f => [f.kind, f.region, f.turns, f.foes[0], f.result]);
  return { diff: run.diff, origin: run.origin, win, region: run.region, place, level: run.level, realm: run.realm, hp: Math.max(0, Math.min(run.hp, maxHp)), maxHp, deck: run.deck, relics: run.relics, sim: run.sim, combos: run.combos || [], fights, ver: VER };
}
