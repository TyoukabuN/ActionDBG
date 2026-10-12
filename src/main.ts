import { CARDS, Combat, type CardId, type CombatSnapshot } from './combat';
import { Arena } from './scene';
import './style.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app mount point');

root.innerHTML = `
  <main class="game-shell">
    <header class="masthead">
      <a class="brand" href="#" aria-label="ActionDBG home"><span class="brand-mark">A</span><span>ACTION<span class="brand-light">DBG</span></span></a>
      <div class="mast-meta"><span class="eyebrow">COMBAT STUDY / 01</span><span class="meta-divider"></span><span class="eyebrow">THE SUNKEN ARENA</span></div>
      <button class="icon-button" id="restart" data-testid="restart" aria-label="Restart duel" title="Restart duel (R)">↻ <span>RESET</span></button>
    </header>

    <section class="arena-layout" aria-label="Combat arena">
      <div class="scene-frame">
        <canvas id="canvas" data-testid="canvas" aria-label="Three-dimensional sword duel"></canvas>
        <div class="scene-shade"></div>
        <div class="scene-topline"><span class="live-dot"></span><span>LIVE ENCOUNTER</span><span class="round-chip">ROUND <b id="round">01</b></span></div>
        <div class="fighters-hud">
          <div class="fighter-card player-card">
            <div class="fighter-id"><span class="fighter-sigil">✦</span><div><b>THE CHALLENGER</b><small>Warden of the Coast</small></div></div>
            <div class="hp-line"><span>VITALITY</span><strong id="player-hp">10 / 10</strong></div><div class="hp-track"><i id="player-bar"></i></div>
          </div>
          <div class="intent-card" id="intent-card"><span class="intent-label">ENEMY INTENT</span><b id="intent">Awaiting challenger</b><small id="intent-detail">Enter the arena to begin</small></div>
          <div class="fighter-card enemy-card">
            <div class="fighter-id"><span class="enemy-sigil">◆</span><div><b>THE DUELIST</b><small>Veteran of the Red Gate</small></div></div>
            <div class="hp-line"><span>VITALITY</span><strong id="enemy-hp">12 / 12</strong></div><div class="hp-track enemy-track"><i id="enemy-bar"></i></div>
          </div>
        </div>
        <div class="stage-status" id="stage-status"><span class="stage-dot"></span><span id="phase" data-testid="phase">READY</span><span class="stage-sep">·</span><span id="phase-copy">A duel awaits</span><span class="timer" id="timer" data-testid="timer">—</span></div>
        <div class="overlay" id="overlay" aria-live="polite">
          <div class="overlay-kicker"><span class="ornament">✦</span> A TEST OF TIMING <span class="ornament">✦</span></div>
          <h1 id="overlay-title">Steel meets<br><em>stillness.</em></h1>
          <p id="overlay-copy">Read the enemy's opening. Spend your breath wisely. Strike before the arena falls silent.</p>
          <button class="primary-button" id="start" data-testid="start"><span>Enter the arena</span><b>↗</b></button>
          <div class="key-hint">PRESS <kbd>ENTER</kbd> TO BEGIN</div>
        </div>
        <div class="pause-banner" id="pause-banner" hidden><b>DUEL PAUSED</b><span>Return to this tab to continue</span></div>
        <div class="webgl-error" id="webgl-error" hidden role="alert"><b>The arena could not be drawn.</b><span>Your browser may not support WebGL. Try enabling hardware acceleration.</span></div>
      </div>
      <aside class="side-rail">
        <div class="rail-heading"><span class="eyebrow">YOUR EDGE</span><span class="round-number" id="round-rail">01</span></div>
        <div class="resource-block"><div class="resource-title"><span>Action points</span><span class="resource-caption">THIS ROUND</span></div><div class="ap-display"><b id="ap" data-testid="ap">3</b><span> / <i id="ap-max">3</i></span><div class="ap-pips" id="ap-pips"></div></div><p>Unspent points carry into the counter window.</p></div>
        <div class="rail-rule"></div>
        <div class="queue-heading"><div><span class="eyebrow">ACTION QUEUE</span><small>Choose your sequence</small></div><span class="queue-count" id="queue-count">0</span></div>
        <ol class="queue-list" id="queue" data-testid="queue"><li class="empty-queue">Your move will appear here</li></ol>
        <div class="rail-rule"></div>
        <div class="result-heading"><span class="eyebrow">COMMITTED</span><span class="result-mark">✓</span></div>
        <ol class="result-list" id="result" data-testid="result"><li class="empty-result">No actions resolved yet</li></ol>
        <div class="rail-rule log-rule"></div>
        <div class="log-heading"><span class="eyebrow">DUEL NOTES</span><span>RECENT</span></div>
        <div class="combat-log" id="log" aria-live="polite"><p class="log-empty">The first move is yours.</p></div>
      </aside>
    </section>

    <footer class="card-desk">
      <div class="desk-label"><span class="eyebrow">YOUR TECHNIQUES</span><small>Tap to queue · choose an order</small></div>
      <div class="cards" id="cards"></div>
      <div class="desk-actions"><button id="skip" data-testid="skip" class="text-button" disabled>Skip <kbd>SPACE</kbd></button><button id="submit" data-testid="submit" class="submit-button" disabled><span>Commit actions</span><b>↗</b><kbd>ENTER</kbd></button></div>
    </footer>
        <div class="footer-note"><span>Prototype 01</span><span>Read the wind-up. Keep 2 AP ready for a counter.</span><span>Keyboard: <kbd>1–4</kbd> select · <kbd>ENTER</kbd> commit · <kbd>SPACE</kbd> skip · <kbd>R</kbd> reset</span></div>
  </main>`;

const $ = <T extends HTMLElement>(selector: string) => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element ${selector}`);
  return element;
};
const combat = new Combat();
const inputEvents = new AbortController();
let arena: Arena | null = null;
let observer: ResizeObserver | null = null;
let raf = 0;
let lastTime: number | null = null;
let accumulator = 0;
let disposed = false;
let keySnapshot: CombatSnapshot = combat.snapshot();
let lastHudKey = '';
const heldKeys = new Set<string>();
const STEP = 1 / 60;
const MAX_STEPS = 6;
const labels: Record<string, string> = { ready: 'READY', telegraph: 'TELEGRAPH', planning: 'PLAN YOUR TURN', acting: 'ACTIONS IN MOTION', counter: 'COUNTER WINDOW', resolve: 'STRIKE RESOLVED', victory: 'VICTORY', defeat: 'DEFEAT' };
const ids: CardId[] = ['quick', 'heavy', 'guard', 'counter'];

const cardHost = $('#cards');
for (const card of CARDS) {
  const index = ids.indexOf(card.id);
  const button = document.createElement('button');
  button.className = `card card-${card.id}`;
  button.id = `card-${card.id}`;
  button.dataset.testid = `card-${card.id}`;
  button.type = 'button';
  button.setAttribute('aria-label', `${index + 1}. ${card.name}, costs ${card.cost} action ${card.cost === 1 ? 'point' : 'points'}. ${card.description}`);
  button.innerHTML = `<span class="card-top"><span class="card-index">0${index + 1}</span><span class="card-cost"><b>${card.cost}</b><small>AP</small></span></span><span class="card-art ${card.id}-art"><span class="art-orbit"></span><span class="art-glyph">${card.id === 'quick' ? '↗' : card.id === 'heavy' ? '⚔' : card.id === 'guard' ? '⬡' : '⤴'}</span></span><span class="card-name">${card.name}</span><span class="card-desc">${card.description}</span><span class="card-status" id="status-${card.id}">Available</span>`;
  button.addEventListener('click', () => { combat.toggleCard(card.id); render(combat.snapshot()); }, { signal: inputEvents.signal });
  cardHost.append(button);
}

const start = () => { combat.start(); hideOverlay(); render(combat.snapshot()); };
$('#start').addEventListener('click', start, { signal: inputEvents.signal });
$('#restart').addEventListener('click', () => { combat.restart(); hideOverlay(); render(combat.snapshot()); }, { signal: inputEvents.signal });
$('#submit').addEventListener('click', () => { combat.submit(); render(combat.snapshot()); }, { signal: inputEvents.signal });
$('#skip').addEventListener('click', () => { combat.skip(); render(combat.snapshot()); }, { signal: inputEvents.signal });
function hideOverlay() { $('#overlay').classList.add('overlay-hidden'); }
function showTerminal(win: boolean) {
  $('#overlay').classList.remove('overlay-hidden');
  $('#overlay-title').innerHTML = win ? 'A worthy<br><em>victory.</em>' : 'The arena<br><em>claims you.</em>';
  $('#overlay-copy').textContent = win ? 'Your timing was true. The Red Gate will remember this duel.' : 'The duel is over. Study the intent, keep a point for your guard, and try again.';
  const button = $('#start'); button.dataset.testid = 'start'; button.innerHTML = '<span>Fight again</span><b>↗</b>';
  $('#overlay .key-hint').innerHTML = 'PRESS <kbd>R</kbd> TO BEGIN AGAIN';
}
function render(snapshot: CombatSnapshot) {
  keySnapshot = snapshot;
  const hudKey = [snapshot.phase, snapshot.round, snapshot.playerHp, snapshot.enemyHp,
    snapshot.ap, snapshot.remaining.toFixed(1), snapshot.queue.join(','),
    snapshot.committed.join(','), snapshot.activeCard, snapshot.paused,
    snapshot.log.join('|')].join(';');
  if (hudKey === lastHudKey) { arena?.render(snapshot); return; }
  lastHudKey = hudKey;
  const playerMax = 10, enemyMax = 12;
  $('#player-hp').textContent = `${snapshot.playerHp} / ${playerMax}`;
  $('#enemy-hp').textContent = `${snapshot.enemyHp} / ${enemyMax}`;
  $('#player-bar').style.width = `${Math.max(0, snapshot.playerHp / playerMax * 100)}%`;
  $('#enemy-bar').style.width = `${Math.max(0, snapshot.enemyHp / enemyMax * 100)}%`;
  $('#ap').textContent = String(snapshot.ap); $('#ap-max').textContent = String(snapshot.maxAp);
  $('#round').textContent = String(snapshot.round).padStart(2, '0'); $('#round-rail').textContent = String(snapshot.round).padStart(2, '0');
  $('#phase').textContent = labels[snapshot.phase] ?? snapshot.phase.toUpperCase();
  $('#phase').dataset.phase = snapshot.phase;
  $('#phase-copy').textContent = snapshot.paused ? 'Paused while away' : phaseCopy(snapshot);
  $('#timer').textContent = snapshot.remaining > 0 ? snapshot.remaining.toFixed(1) : snapshot.phase === 'ready' ? '—' : '0.0';
  $('#timer').classList.toggle('timer-urgent', snapshot.remaining > 0 && snapshot.remaining < 1.25);
  const intentText = snapshot.phase === 'ready' ? 'Awaiting challenger' : snapshot.phase === 'victory' ? 'Duel won' : snapshot.phase === 'defeat' ? 'Duel lost' : `Incoming ${snapshot.enemyAttack} attack`;
  $('#intent').textContent = intentText;
  $('#intent-detail').textContent = snapshot.phase === 'ready' ? 'Enter the arena to begin' : snapshot.phase === 'victory' || snapshot.phase === 'defeat' ? 'The duel has ended' : `${snapshot.enemyDamage} damage · ${snapshot.enemyAttack === 'heavy' ? 'wide, slow wind-up' : 'fast, light strike'}`;
  $('#intent-card').classList.toggle('intent-heavy', snapshot.enemyAttack === 'heavy' && snapshot.phase !== 'ready');
  const pips = $('#ap-pips'); pips.replaceChildren();
  for (let i = 0; i < snapshot.maxAp; i++) { const pip = document.createElement('i'); if (i < snapshot.ap) pip.className = 'pip-live'; pips.append(pip); }
  const queue = $('#queue'); queue.replaceChildren();
  if (!snapshot.queue.length) queue.innerHTML = '<li class="empty-queue">Your move will appear here</li>';
  else snapshot.queue.forEach((id, i) => { const card = CARDS.find((item) => item.id === id)!; const li = document.createElement('li'); li.innerHTML = `<span class="queue-order">0${i + 1}</span><b>${card.name}</b><span class="queue-cost">${card.cost} AP</span>`; queue.append(li); });
  $('#queue-count').textContent = String(snapshot.queue.length);
  const result = $('#result'); result.replaceChildren();
  if (snapshot.phase === 'acting' && snapshot.committed.length) {
    const activeIndex = snapshot.committed.indexOf(snapshot.activeCard!);
    snapshot.committed.forEach((id, index) => { const card = CARDS.find((item) => item.id === id)!; const li = document.createElement('li'); li.innerHTML = `<span class="result-check">${snapshot.activeCard === id ? '↗' : index < activeIndex ? '✓' : '·'}</span><b>${card.name}</b><span>${snapshot.activeCard === id ? 'IN MOTION' : index < activeIndex ? 'RESOLVED' : 'UP NEXT'}</span>`; result.append(li); });
  } else {
    const outcomes = snapshot.log.filter((line) => /^(Quick Strike|Heavy Strike|Guard is ready|Counter deals)/.test(line)).slice(-3).reverse();
    if (!outcomes.length) result.innerHTML = '<li class="empty-result">No actions resolved yet</li>';
    else outcomes.forEach((line) => { const li = document.createElement('li'); li.innerHTML = `<span class="result-check">✓</span><b>${escapeHtml(line.split(/ (?:deals|is ready)/)[0])}</b><span>${escapeHtml(line.replace(/^.*? (?:deals |is ready to )/, ''))}</span>`; result.append(li); });
  }
  const log = $('#log'); log.replaceChildren();
  if (!snapshot.log.length) log.innerHTML = '<p class="log-empty">The first move is yours.</p>';
  else {
    const lines = [...snapshot.log].reverse().slice(0, 4);
    if (snapshot.phase === 'resolve' && lines.some((line) => line.includes('damage guarded'))) {
      const prevented = lines.find((line) => line.includes('damage guarded'))!;
      const amount = Number(prevented.match(/(\d+) damage guarded/)?.[1] ?? 0);
      if (amount >= snapshot.enemyDamage) lines.unshift('Guard absorbs the full attack · 0 damage taken.');
    }
    if (snapshot.phase === 'resolve' && lines.some((line) => line.includes('Counter cancels'))) {
      const li = document.createElement('li'); li.innerHTML = '<span class="result-check">✓</span><b>Counter</b><span>ATTACK CANCELLED · 2 DAMAGE</span>'; result.prepend(li);
    }
    lines.slice(0, 4).forEach((line, i) => { const p = document.createElement('p'); p.className = i === 0 ? 'log-latest' : ''; p.textContent = line; log.append(p); });
  }
  for (const card of CARDS) {
    const button = $<HTMLButtonElement>(`#card-${card.id}`);
    const reason = combat.availability(card.id);
    const queued = snapshot.queue.includes(card.id);
    button.disabled = reason !== null && !queued;
    button.classList.toggle('card-selected', queued);
    button.classList.toggle('card-unavailable', reason !== null && !queued);
    button.setAttribute('aria-pressed', String(queued));
    const status = $(`#status-${card.id}`);
    status.textContent = queued ? 'IN YOUR QUEUE' : reason ?? (card.id === 'counter' ? 'Counter window' : 'Available');
    status.title = reason ?? '';
  }
  const planning = snapshot.phase === 'planning' || snapshot.phase === 'counter';
  $('#submit').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#submit span').textContent = snapshot.queue.length ? 'Commit actions' : snapshot.phase === 'counter' ? 'Pass the counter' : 'Continue';
  $('#skip').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#pause-banner').toggleAttribute('hidden', !snapshot.paused);
  if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') showTerminal(snapshot.phase === 'victory');
  arena?.render(snapshot);
}
function phaseCopy(s: CombatSnapshot): string {
  if (s.phase === 'telegraph') return 'Read the enemy’s wind-up';
  if (s.phase === 'planning') return 'Slow time · build your sequence';
  if (s.phase === 'acting') return s.activeCard ? `${CARDS.find((c) => c.id === s.activeCard)?.name ?? 'Action'} in motion` : 'Your actions resolve';
  if (s.phase === 'counter') return 'Slow time · counter or hold guard';
  if (s.phase === 'resolve') return s.guard ? 'Guard absorbs the strike' : 'Damage is being resolved';
  return s.phase === 'ready' ? 'A duel awaits' : 'Encounter complete';
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!)); }

const canvas = $('#canvas') as HTMLCanvasElement;
try {
  arena = new Arena(canvas);
  observer = new ResizeObserver(() => arena?.resize());
  observer.observe(canvas.parentElement ?? canvas);
  window.addEventListener('resize', resize);
} catch (error) {
  console.error('WebGL arena initialization failed', error);
  $('#webgl-error').toggleAttribute('hidden', false);
  canvas.hidden = true;
}
function resize() { arena?.resize(); }
function frame(now: number) {
  if (disposed) return;
  raf = requestAnimationFrame(frame);
  if (lastTime === null) { lastTime = now; return; }
  const elapsed = Math.min(0.1, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
  accumulator = Math.min(accumulator + elapsed, STEP * MAX_STEPS);
  let count = 0;
  while (accumulator >= STEP && count < MAX_STEPS) { combat.tick(STEP); accumulator -= STEP; count++; }
  render(combat.snapshot());
}
function editable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}
function onKeyDown(event: KeyboardEvent) {
  if (editable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if ((key === 'enter' || key === ' ') && event.target instanceof HTMLButtonElement
    && (keySnapshot.phase === 'victory' || keySnapshot.phase === 'defeat')) {
    // Preserve native keyboard activation for the focused HTML control.
    return;
  }
  if (heldKeys.has(key) || event.repeat) return;
  heldKeys.add(key);
  if (['1', '2', '3', '4', 'enter', ' ', 'r'].includes(key)) event.preventDefault();
  if (key === 'r') { combat.restart(); hideOverlay(); render(combat.snapshot()); return; }
  if (key === 'enter' && keySnapshot.phase === 'ready') { start(); return; }
  if (key === 'enter' && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) { combat.submit(); render(combat.snapshot()); return; }
  if (key === ' ' && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) { combat.skip(); render(combat.snapshot()); return; }
  const index = Number(key) - 1;
  if (index >= 0 && index < ids.length && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) {
    const button = $<HTMLButtonElement>(`#card-${ids[index]}`);
    if (!button.disabled) { combat.toggleCard(ids[index]); render(combat.snapshot()); }
  }
}
function onKeyUp(event: KeyboardEvent) { heldKeys.delete(event.key.toLowerCase()); }
function onBlur() { heldKeys.clear(); combat.setPaused(true); lastTime = null; accumulator = 0; render(combat.snapshot()); }
function onFocus() { if (document.visibilityState === 'visible' && document.hasFocus()) { combat.setPaused(false); lastTime = null; accumulator = 0; render(combat.snapshot()); } }
function onVisibility() { if (document.hidden) onBlur(); else onFocus(); }
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', onBlur);
window.addEventListener('focus', onFocus);
document.addEventListener('visibilitychange', onVisibility);
render(combat.snapshot());
raf = requestAnimationFrame(frame);

function teardown() {
  if (disposed) return;
  disposed = true; cancelAnimationFrame(raf); observer?.disconnect();
  window.removeEventListener('resize', resize);
  window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus);
  document.removeEventListener('visibilitychange', onVisibility);
  inputEvents.abort(); arena?.dispose(); heldKeys.clear();
}
if (import.meta.hot) import.meta.hot.dispose(teardown);
