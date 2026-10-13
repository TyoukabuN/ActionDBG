import { CARDS, Combat, type CardId, type CombatSnapshot } from './combat';
import { Arena } from './scene';
import './style.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app mount point');
const app = root;

root.innerHTML = `
  <main class="game-shell">
    <header class="masthead">
      <a class="brand" href="#" aria-label="ActionDBG"><span class="brand-mark">A</span><span>ACTIONDBG</span></a>
      <div class="arena-name"><span class="arena-mark">◆</span> THE SUNKEN ARENA</div>
      <div class="header-controls"><button class="icon-button" id="control-mode" data-testid="control-mode" type="button" title="Switch control mode before starting">Cinematic QTE</button><button class="icon-button" id="restart" data-testid="restart" aria-label="Restart duel" title="Restart duel (R)"><span class="reset-icon">↻</span><span>RESTART</span></button></div>
    </header>

    <section class="arena-layout" aria-label="Combat arena">
      <div class="scene-frame">
        <canvas id="canvas" data-testid="canvas" aria-label="Three-dimensional sword duel"></canvas>
        <div class="scene-shade"></div>
        <div class="scene-topline"><span class="live-dot"></span><span>THE DUEL</span><span class="shot-name" id="shot-name">ESTABLISHING</span><span class="round-chip">ROUND <b id="round">01</b></span></div>
        <div class="fighters-hud">
          <div class="fighter-card player-card">
            <div class="fighter-id"><span class="fighter-sigil">✦</span><div><b>CHALLENGER</b><small>Warden of the Coast</small></div></div>
            <div class="hp-line"><span>HP</span><strong id="player-hp">10 / 10</strong></div><div class="hp-track"><i id="player-bar"></i></div>
          </div>
          <div class="intent-card" id="intent-card"><span class="intent-label">ENEMY INTENT</span><b id="intent">Awaiting challenger</b><small id="intent-detail">Enter the arena to begin</small></div>
          <div class="fighter-card enemy-card">
            <div class="fighter-id"><span class="enemy-sigil">◆</span><div><b>THE DUELIST</b><small>Veteran of the Red Gate</small></div></div>
            <div class="hp-line"><span>HP</span><strong id="enemy-hp">12 / 12</strong></div><div class="hp-track enemy-track"><i id="enemy-bar"></i></div>
          </div>
        </div>
        <div class="stage-status" id="stage-status">
          <div class="phase-heading"><span class="stage-dot"></span><span id="phase" data-testid="phase">READY</span><span id="phase-copy">A duel awaits</span></div>
          <div class="timer-row"><div class="timer-track"><i id="timer-progress"></i></div><div class="timer-readout"><span id="outcome" class="outcome" aria-live="polite">Read the opening move</span><b class="timer" id="timer" data-testid="timer">—</b></div></div>
        </div>
        <div class="overlay" id="overlay" aria-live="polite">
          <div class="overlay-kicker"><span class="ornament">✦</span> THE SUNKEN ARENA <span class="ornament">✦</span></div>
          <h1 id="overlay-title">Face the duelist</h1>
          <p id="overlay-copy">Watch the wind-up. Press a technique to act immediately. Keep two action points ready to counter.</p>
          <button class="primary-button" id="start" data-testid="start"><span>Enter the arena</span><b>↗</b></button>
          <div class="key-hint">PRESS <kbd>ENTER</kbd> TO BEGIN</div>
        </div>
        <div class="pause-banner" id="pause-banner" hidden><b>DUEL PAUSED</b><span>Return to this tab to continue</span></div>
        <div class="webgl-error" id="webgl-error" hidden role="alert"><b>The arena could not be drawn.</b><span>Your browser may not support WebGL. Try enabling hardware acceleration.</span></div>
      </div>
      <div class="combat-strip" aria-label="Action point budget and queue">
        <div class="ap-cluster"><span class="ap-symbol">✦</span><div class="ap-numbers"><span class="ap-label">ACTION POINTS</span><div><b id="ap" data-testid="ap">3</b><span class="ap-divider">/</span><span id="ap-max">3</span><span class="ap-available-label">AVAILABLE</span></div></div><div class="ap-pips" id="ap-pips"></div><span class="reserved-readout" id="ap-reserved">0 reserved</span></div>
        <div class="queue-cluster"><div class="queue-title"><span id="sequence-label">NEXT RESPONSE</span><span class="queue-count" id="queue-count">0</span></div><ol class="queue-list" id="queue" data-testid="queue"><li class="empty-queue">Select a technique below</li></ol></div>
      </div>

      <details class="history-panel" id="history-panel">
        <summary><span class="history-icon">▤</span><span>DUEL HISTORY</span><span class="history-summary" id="history-summary">No actions resolved</span><span class="history-chevron">⌄</span></summary>
        <div class="history-content"><div><h2>Last outcomes</h2><ol class="result-list" id="result" data-testid="result"><li class="empty-result">No actions resolved yet</li></ol></div><div><h2>Combat log</h2><div class="combat-log" id="log" aria-live="polite"><p class="log-empty">The first move is yours.</p></div></div></div>
      </details>
    </section>

    <footer class="card-desk">
      <div class="desk-label"><div><span class="eyebrow">CHOOSE YOUR TECHNIQUE</span><small id="desk-hint">Press a button or 1–4 to play immediately</small></div><span class="round-number" id="round-rail">01</span></div>
      <div class="cards" id="cards"></div>
      <div class="desk-actions"><button id="skip" data-testid="skip" class="text-button" disabled>Skip <kbd>SPACE</kbd></button><button id="submit" data-testid="submit" class="submit-button" disabled><span>Commit actions</span><b>↗</b><kbd>ENTER</kbd></button></div>
    </footer>
    <div class="footer-note"><span>Read the wind-up · Keep 2 AP for Counter</span><span id="controls-help"><kbd>1–4</kbd> play <kbd>ENTER</kbd> continue <kbd>SPACE</kbd> pass <kbd>R</kbd> restart</span></div>
  </main>`;

const $ = <T extends HTMLElement>(selector: string) => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element ${selector}`);
  return element;
};
let combat = new Combat('qte');
const inputEvents = new AbortController();
let arena: Arena | null = null;
let observer: ResizeObserver | null = null;
let raf = 0;
let lastTime: number | null = null;
let accumulator = 0;
let disposed = false;
let keySnapshot: CombatSnapshot = combat.snapshot();
let lastHudKey = '';
let lastOutcomeLine = '';
const heldKeys = new Set<string>();
const STEP = 1 / 60;
const MAX_STEPS = 6;
const labels: Record<string, string> = { ready: 'READY', telegraph: 'TELEGRAPH', planning: 'PLAN YOUR TURN', acting: 'ACTIONS IN MOTION', counter: 'COUNTER WINDOW', resolve: 'STRIKE RESOLVED', victory: 'VICTORY', defeat: 'DEFEAT' };
const ids: CardId[] = ['quick', 'heavy', 'guard', 'counter'];
const cardIcons: Record<CardId, string> = {
  quick: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 36 34 13m-5 1 5-1-1 5M9 29l10 10m-5-14 10 10M30 10l8 8"/><path d="m8 40 4-1-3-3z"/></svg>',
  heavy: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m11 36 23-23m-5 1 5-1-1 5M8 29l11 11m-5-14 10 10M30 10l8 8M37 35 15 13m5 0-5-1 1 5"/></svg>',
  guard: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 7 14 6v10c0 9-5.5 15-14 19-8.5-4-14-10-14-19V13z"/><path d="m17 24 5 5 10-11"/></svg>',
  counter: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18a15 15 0 1 1-1 12M12 18v-8m0 8h8m5 1v11l8 5"/><path d="m34 12 4 4-4 4"/></svg>',
};

const cardHost = $('#cards');
for (const card of CARDS) {
  const index = ids.indexOf(card.id);
  const button = document.createElement('button');
  button.className = `card card-${card.id}`;
  button.id = `card-${card.id}`;
  button.dataset.testid = `card-${card.id}`;
  button.type = 'button';
  button.setAttribute('aria-label', `${index + 1}. ${card.name}, costs ${card.cost} action ${card.cost === 1 ? 'point' : 'points'}. ${card.description}`);
  button.innerHTML = `<span class="card-top"><span class="card-index">${index + 1}</span><span class="card-cost"><b>${card.cost}</b><small>AP</small></span></span><span class="card-art ${card.id}-art">${cardIcons[card.id]}</span><span class="card-name">${card.name}</span><span class="card-desc">${card.description}</span><span class="card-status" id="status-${card.id}">Available</span>`;
  button.addEventListener('click', () => activateCard(card.id), { signal: inputEvents.signal });
  cardHost.append(button);
}

function activateCard(id: CardId) {
  if (combat.snapshot().controlMode === 'qte') combat.playCard(id);
  else combat.toggleCard(id);
  render(combat.snapshot());
}
const start = () => { combat.start(); lastTime = null; accumulator = 0; heldKeys.clear(); hideOverlay(); $('#start').blur(); render(combat.snapshot()); };
$('#start').addEventListener('click', start, { signal: inputEvents.signal });
$('#restart').addEventListener('click', () => { combat.restart(); hideOverlay(); render(combat.snapshot()); }, { signal: inputEvents.signal });
function continueTurn() {
  if (combat.snapshot().controlMode === 'qte') combat.skip();
  else combat.submit();
  render(combat.snapshot());
}
$('#submit').addEventListener('click', continueTurn, { signal: inputEvents.signal });
$('#skip').addEventListener('click', () => { combat.skip(); render(combat.snapshot()); }, { signal: inputEvents.signal });
$('#control-mode').addEventListener('click', () => {
  const snapshot = combat.snapshot();
  if (!['ready', 'victory', 'defeat'].includes(snapshot.phase) || snapshot.paused) return;
  combat = new Combat(snapshot.controlMode === 'qte' ? 'queue' : 'qte');
  lastTime = null; accumulator = 0; heldKeys.clear(); lastHudKey = ''; lastOutcomeLine = '\u0000';
  $('#overlay').classList.remove('overlay-hidden');
  $('#overlay-title').textContent = 'Face the duelist';
  $('#start').innerHTML = '<span>Enter the arena</span><b>↗</b>';
  $('#overlay .key-hint').innerHTML = 'PRESS <kbd>ENTER</kbd> TO BEGIN';
  render(combat.snapshot());
}, { signal: inputEvents.signal });
function hideOverlay() { $('#overlay').classList.add('overlay-hidden'); }
function showTerminal(win: boolean) {
  $('#overlay').classList.remove('overlay-hidden');
  $('#overlay-title').textContent = win ? 'Duel won' : 'Duel lost';
  $('#overlay-copy').textContent = win ? 'Your timing was true. The Red Gate will remember this duel.' : 'The duel is over. Study the intent, keep a point for your guard, and try again.';
  const button = $('#start'); button.dataset.testid = 'start'; button.innerHTML = '<span>Fight again</span><b>↗</b>';
  $('#overlay .key-hint').innerHTML = 'PRESS <kbd>R</kbd> TO BEGIN AGAIN';
}
function drawArena(snapshot: CombatSnapshot, realSeconds: number) {
  arena?.render(snapshot, realSeconds);
  const label = ($('#canvas').dataset.shot ?? 'overview').replaceAll('-', ' ').toUpperCase();
  if ($('#shot-name').textContent !== label) $('#shot-name').textContent = label;
}
function render(snapshot: CombatSnapshot, realSeconds = 0) {
  keySnapshot = snapshot;
  const qte = snapshot.controlMode === 'qte';
  app.dataset.controlMode = snapshot.controlMode;

  const hudKey = [snapshot.controlMode, snapshot.phase, snapshot.round, snapshot.playerHp, snapshot.enemyHp,
    snapshot.ap, snapshot.remaining.toFixed(1), snapshot.queue.join(','),
    snapshot.committed.join(','), snapshot.activeCard, snapshot.paused,
    snapshot.log.join('|')].join(';');
  if (hudKey === lastHudKey) { drawArena(snapshot, realSeconds); return; }
  lastHudKey = hudKey;
  const playerMax = 10, enemyMax = 12;
  $('#player-hp').textContent = `${snapshot.playerHp} / ${playerMax}`;
  $('#enemy-hp').textContent = `${snapshot.enemyHp} / ${enemyMax}`;
  $('#player-bar').style.width = `${Math.max(0, snapshot.playerHp / playerMax * 100)}%`;
  $('#enemy-bar').style.width = `${Math.max(0, snapshot.enemyHp / enemyMax * 100)}%`;
  $('#ap').textContent = String(snapshot.ap); $('#ap-max').textContent = String(snapshot.maxAp);
  $('#round').textContent = String(snapshot.round).padStart(2, '0'); $('#round-rail').textContent = String(snapshot.round).padStart(2, '0');
  $('#phase').textContent = qte && snapshot.phase === 'planning' ? 'CHOOSE YOUR RESPONSE' : labels[snapshot.phase] ?? snapshot.phase.toUpperCase();
  $('#control-mode').textContent = qte ? 'Cinematic QTE' : 'Queue planning';
  $('#control-mode').toggleAttribute('disabled', !['ready', 'victory', 'defeat'].includes(snapshot.phase) || snapshot.paused);
  $('#sequence-label').textContent = qte ? 'NEXT RESPONSE' : 'YOUR SEQUENCE';
  $('#desk-hint').textContent = qte ? 'Press a button or 1–4 to play immediately' : 'Costs are reserved as you queue';
  $('#controls-help').innerHTML = qte ? '<kbd>1–4</kbd> play <kbd>ENTER</kbd> continue <kbd>SPACE</kbd> pass <kbd>R</kbd> restart' : '<kbd>1–4</kbd> select <kbd>ENTER</kbd> commit <kbd>SPACE</kbd> skip <kbd>R</kbd> restart';
  if (snapshot.phase === 'ready') $('#overlay-copy').textContent = qte ? 'Watch the wind-up. Press a technique to act immediately. Keep two action points ready to counter.' : 'Read the wind-up. Queue your techniques, then commit the sequence.';
  $('#phase').dataset.phase = snapshot.phase;
  $('#phase-copy').textContent = snapshot.paused ? 'Paused while away' : phaseCopy(snapshot);
  $('#timer').textContent = snapshot.remaining > 0 ? snapshot.remaining.toFixed(1) : snapshot.phase === 'ready' ? '—' : '0.0';
  $('#timer').classList.toggle('timer-urgent', snapshot.remaining > 0 && snapshot.remaining < 1.25);
  const windowLength = snapshot.phase === 'planning' ? 4 : snapshot.phase === 'counter' ? 2 : snapshot.phase === 'telegraph' ? (snapshot.enemyAttack === 'heavy' ? 1.6 : 1.1) : 0;
  const timerProgress = windowLength > 0 ? Math.max(0, Math.min(1, snapshot.remaining / windowLength)) : 0;
  $('#timer-progress').style.transform = `scaleX(${timerProgress})`;
  $('#stage-status').dataset.phase = snapshot.phase;
  const intentText = snapshot.phase === 'ready' ? 'Awaiting challenger' : snapshot.phase === 'victory' ? 'Duel won' : snapshot.phase === 'defeat' ? 'Duel lost' : `Incoming ${snapshot.enemyAttack} attack`;
  $('#intent').textContent = intentText;
  $('#intent-detail').textContent = snapshot.phase === 'ready' ? 'Enter the arena to begin' : snapshot.phase === 'victory' || snapshot.phase === 'defeat' ? 'The duel has ended' : `${snapshot.enemyDamage} damage · ${snapshot.enemyAttack === 'heavy' ? 'wide, slow wind-up' : 'fast, light strike'}`;
  $('#intent-card').classList.toggle('intent-heavy', snapshot.enemyAttack === 'heavy' && snapshot.phase !== 'ready');
  const reservedAp = snapshot.queue.reduce((sum, id) => sum + (CARDS.find((card) => card.id === id)?.cost ?? 0), 0);
  const availableAp = Math.max(0, snapshot.ap - reservedAp);
  $('#ap').textContent = String(availableAp);
  $('#ap-reserved').textContent = qte ? 'Spent on play' : `${reservedAp} reserved`;
  $('#ap-reserved').classList.toggle('has-reserved', reservedAp > 0);
  const pips = $('#ap-pips'); pips.replaceChildren();
  for (let i = 0; i < snapshot.maxAp; i++) { const pip = document.createElement('i'); if (i < availableAp) pip.className = 'pip-live'; else if (i < snapshot.ap) pip.className = 'pip-reserved'; pips.append(pip); }
  const queue = $('#queue'); queue.replaceChildren();
  if (qte) {
    const li = document.createElement('li'); li.className = 'qte-response';
    li.textContent = snapshot.paused ? 'Paused · return to continue' : snapshot.phase === 'planning' ? '1 Strike · 2 Heavy · 3 Guard · Enter to continue' : snapshot.phase === 'counter' ? '4 Counter now · Space to pass' : snapshot.phase === 'acting' ? `${CARDS.find((card) => card.id === snapshot.activeCard)?.name ?? 'Technique'} in motion` : snapshot.phase === 'telegraph' ? 'Watch the wind-up…' : 'Watch the duel';
    queue.append(li);
  } else if (!snapshot.queue.length) queue.innerHTML = '<li class="empty-queue">Your move will appear here</li>';
  else snapshot.queue.forEach((id, i) => { const card = CARDS.find((item) => item.id === id)!; const li = document.createElement('li'); li.innerHTML = `<span class="queue-order">0${i + 1}</span><b>${card.name}</b><span class="queue-cost">${card.cost} AP</span>`; queue.append(li); });
  $('#queue-count').textContent = qte ? 'QTE' : String(snapshot.queue.length);
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
  const outcome = recentOutcome(snapshot);
  if (outcome !== lastOutcomeLine) {
    lastOutcomeLine = outcome;
    $('#outcome').textContent = outcome || (snapshot.phase === 'ready' ? 'Read the opening move' : '');
    $('#history-summary').textContent = outcome || 'No actions resolved';
    $('#outcome').classList.remove('outcome-flash');
    if (outcome) requestAnimationFrame(() => $('#outcome').classList.add('outcome-flash'));
  }
  for (const card of CARDS) {
    const button = $<HTMLButtonElement>(`#card-${card.id}`);
    const reason = combat.availability(card.id);
    const queued = snapshot.queue.includes(card.id);
    button.disabled = reason !== null && !queued;
    button.classList.toggle('card-selected', queued);
    button.classList.toggle('card-unavailable', reason !== null && !queued);
    if (qte) button.removeAttribute('aria-pressed');
    else button.setAttribute('aria-pressed', String(queued));
    button.classList.toggle('qte-available', qte && reason === null);
    button.classList.toggle('card-playing', qte && snapshot.activeCard === card.id);
    button.title = qte ? `${card.name}: press ${ids.indexOf(card.id) + 1} or click to play now. ${reason ?? card.description}` : `${card.name}: select to queue. ${reason ?? card.description}`;
    const status = $(`#status-${card.id}`);
    status.textContent = qte ? reason ?? `PRESS ${ids.indexOf(card.id) + 1} · PLAY NOW` : queued ? 'IN YOUR QUEUE' : reason ?? (card.id === 'counter' ? 'Counter window' : 'Available');
    status.title = reason ?? '';
  }
  const planning = snapshot.phase === 'planning' || snapshot.phase === 'counter';
  $('#submit').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#submit span').textContent = qte ? (snapshot.phase === 'counter' ? 'Pass counter' : 'Continue duel') : snapshot.queue.length ? 'Commit actions' : snapshot.phase === 'counter' ? 'Pass the counter' : 'Continue';
  $('#skip').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#pause-banner').toggleAttribute('hidden', !snapshot.paused);
  if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') showTerminal(snapshot.phase === 'victory');
  drawArena(snapshot, realSeconds);
}
function phaseCopy(s: CombatSnapshot): string {
  if (s.phase === 'telegraph') return 'Read the enemy’s wind-up';
  if (s.phase === 'planning') return s.controlMode === 'qte' ? 'Slow time · press a technique now' : 'Slow time · build your sequence';
  if (s.phase === 'acting') return s.activeCard ? `${CARDS.find((c) => c.id === s.activeCard)?.name ?? 'Action'} in motion` : 'Your actions resolve';
  if (s.phase === 'counter') return 'Slow time · counter or hold guard';
  if (s.phase === 'resolve') return s.guard ? 'Guard absorbs the strike' : 'Damage is being resolved';
  return s.phase === 'ready' ? 'A duel awaits' : 'Encounter complete';
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!)); }
function recentOutcome(snapshot: CombatSnapshot): string {
  const log = snapshot.log;
  const eventPattern = /deals \d+ damage|damage guarded|Counter cancels the incoming attack|Incoming attack cancelled|Guard is ready/;
  let eventIndex = -1;
  for (let index = log.length - 1; index >= 0; index--) {
    if (eventPattern.test(log[index])) { eventIndex = index; break; }
  }
  if (eventIndex < 0) return '';
  const line = log[eventIndex];
  if (line.includes('Counter cancels') || line.includes('Incoming attack cancelled')) return 'Counter landed · incoming strike cancelled';
  const guarded = line.match(/(\d+) damage guarded/);
  if (guarded) {
    const nextRound = log.findIndex((entry, index) => index > eventIndex && entry.startsWith('Round '));
    const resolutionEnd = nextRound < 0 ? log.length : nextRound;
    const damageLine = log.slice(eventIndex + 1, resolutionEnd).find((entry) => /^Enemy attack deals \d+ damage to the player/.test(entry));
    const taken = Number(damageLine?.match(/deals (\d+) damage/)?.[1] ?? 0);
    return taken === 0 ? `Guard blocked ${guarded[1]} · 0 damage taken` : `Guard blocked ${guarded[1]} · ${taken} damage taken`;
  }
  if (line.startsWith('Guard is ready')) return 'Guard raised · next hit reduced by 2';
  const damage = line.match(/(Quick Strike|Heavy Strike|Counter|Enemy attack) deals (\d+) damage to the (enemy|player)/);
  if (damage) {
    if (damage[1] === 'Enemy attack' && eventIndex > 0) {
      const priorGuard = log[eventIndex - 1].match(/(\d+) damage guarded/);
      if (priorGuard) return `Guard blocked ${priorGuard[1]} · ${damage[2]} damage taken`;
    }
    return `${damage[1]} · ${damage[2]} damage to ${damage[3] === 'enemy' ? 'duelist' : 'you'}`;
  }
  return '';
}

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
  render(combat.snapshot(), elapsed);
}
function editable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.closest('summary') !== null || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}
function onKeyDown(event: KeyboardEvent) {
  if (editable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if ((key === 'enter' || key === ' ') && event.target instanceof HTMLButtonElement) {
    // Preserve native keyboard activation for the focused HTML control.
    return;
  }
  if (heldKeys.has(key) || event.repeat) return;
  heldKeys.add(key);
  if (['1', '2', '3', '4', 'enter', ' ', 'r'].includes(key)) event.preventDefault();
  if (key === 'r') { combat.restart(); hideOverlay(); render(combat.snapshot()); return; }
  if (key === 'enter' && keySnapshot.phase === 'ready') { start(); return; }
  if (key === 'enter' && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) { continueTurn(); return; }
  if (key === ' ' && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) { combat.skip(); render(combat.snapshot()); return; }
  const index = Number(key) - 1;
  if (index >= 0 && index < ids.length && (keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter')) {
    const button = $<HTMLButtonElement>(`#card-${ids[index]}`);
    if (!button.disabled) activateCard(ids[index]);
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
