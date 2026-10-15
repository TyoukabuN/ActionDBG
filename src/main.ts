import { CARDS, Combat, type CardId, type CombatSnapshot } from './combat';
import { Arena } from './scene';
import './style.css';
import { chineseText, CARD_NAMES, CARD_DESCRIPTIONS, SHOT_NAMES } from './chinese';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app mount point');
const app = root;

root.innerHTML = `
  <main class="game-shell">
    <header class="masthead">
      <a class="brand" href="#" aria-label="ActionDBG"><span class="brand-mark">A</span><span>ACTIONDBG</span></a>
      <div class="arena-name"><span class="arena-mark">◆</span> 沉没竞技场</div>
      <div class="header-controls"><button class="icon-button" id="control-mode" data-testid="control-mode" type="button" title="开始前切换操作模式">演出式出牌</button><button class="icon-button" id="restart" data-testid="restart" aria-label="重新开始对决" title="重新开始（R）"><span class="reset-icon">↻</span><span>重新开始</span></button></div>
    </header>

    <section class="arena-layout" aria-label="战斗竞技场">
      <div class="scene-frame">
        <canvas id="canvas" data-testid="canvas" aria-label="三维近战对决"></canvas>
        <div class="asset-status" id="character-status" data-testid="character-status" role="status">角色载入中…</div>
        <div class="scene-shade"></div>
        <div class="scene-topline"><span class="live-dot"></span><span id="turn-owner" data-testid="turn-owner">准备就绪</span><span class="shot-name" id="shot-name">开场镜头</span><span class="round-chip">回合 <b id="round">01</b></span></div>
        <div class="fighters-hud">
          <div class="fighter-card player-card">
            <div class="fighter-id"><span class="fighter-sigil">✦</span><div><b>挑战者</b><small>海岸骑士</small></div></div>
            <div class="hp-line"><span>生命</span><strong id="player-hp">10 / 10</strong></div><div class="hp-track"><i id="player-bar"></i></div>
          </div>
          <div class="intent-card" id="intent-card"><span class="intent-label">敌方意图</span><b id="intent">等待挑战者</b><small id="intent-detail">进入竞技场开始战斗</small></div>
          <div class="fighter-card enemy-card">
            <div class="fighter-id"><span class="enemy-sigil">◆</span><div><b>决斗者</b><small>赤门蛮族</small></div></div>
            <div class="hp-line"><span>生命</span><strong id="enemy-hp">12 / 12</strong></div><div class="hp-track enemy-track"><i id="enemy-bar"></i></div>
          </div>
        </div>
        <aside class="counter-threat-card" id="counter-threat-card" data-testid="counter-threat-card" aria-live="polite" aria-hidden="true">
          <span class="threat-speed-lines" aria-hidden="true"></span>
          <div class="threat-card-heading"><span>敌方出牌</span><b id="threat-card-number">01</b></div>
          <div class="threat-card-art" aria-hidden="true"><i></i><span>斬</span></div>
          <div class="threat-card-copy"><small>即将发动</small><strong id="threat-card-name">轻攻击</strong><span id="threat-card-damage">2 点伤害</span></div>
        </aside>
        <div class="stage-status" id="stage-status">
          <div class="phase-heading"><span class="stage-dot"></span><span id="phase" data-testid="phase">准备就绪</span><span id="phase-copy">等待对决开始</span></div>
          <div class="timer-row"><div class="timer-track"><i id="timer-progress"></i></div><div class="timer-readout"><span id="outcome" class="outcome" aria-live="polite">观察敌人的起手</span><b class="timer" id="timer" data-testid="timer">—</b></div></div>
        </div>
        <div class="overlay" id="overlay" aria-live="polite">
          <div class="overlay-kicker"><span class="ornament">✦</span> 沉没竞技场 <span class="ornament">✦</span></div>
          <h1 id="overlay-title">迎战决斗者</h1>
          <p id="overlay-copy">己方演出期间也可连续出牌，按提交顺序执行。回合结束恢复自己的行动点，敌人出牌时可反击。</p>
          <button class="primary-button" id="start" data-testid="start"><span>进入竞技场</span><b>↗</b></button>
          <div class="key-hint">按 <kbd>回车</kbd> 开始</div>
        </div>
        <div class="pause-banner" id="pause-banner" hidden><b>对决已暂停</b><span>返回此页面继续战斗</span></div>
        <div class="webgl-error" id="webgl-error" hidden role="alert"><b>无法绘制竞技场。</b><span>浏览器可能不支持 WebGL，请尝试启用硬件加速。</span></div>
      </div>
      <div class="combat-strip" aria-label="行动点与出牌序列">
        <div class="ap-cluster"><span class="ap-symbol">✦</span><div class="ap-numbers"><span class="ap-label">玩家行动点</span><div><b id="ap" data-testid="ap">3</b><span class="ap-divider">/</span><span id="ap-max">3</span><span class="ap-available-label">可用</span></div></div><div class="ap-pips" id="ap-pips"></div><span class="reserved-readout" id="ap-reserved">预留 0 点</span><span class="enemy-ap-readout">敌方 <b id="enemy-ap" data-testid="enemy-ap">3</b>/3</span></div>
        <div class="queue-cluster"><div class="queue-title"><span id="sequence-label">下一步应对</span><span class="queue-count" id="queue-count">0</span></div><ol class="queue-list" id="queue" data-testid="queue"><li class="empty-queue">选择下方招式</li></ol></div>
      </div>

      <details class="history-panel" id="history-panel">
        <summary><span class="history-icon">▤</span><span>战斗记录</span><span class="history-summary" id="history-summary">尚无战斗结果</span><span class="history-chevron">⌄</span></summary>
        <div class="history-content"><div><h2>最近结果</h2><ol class="result-list" id="result" data-testid="result"><li class="empty-result">尚未结算招式</li></ol></div><div><h2>战斗日志</h2><div class="combat-log" id="log" aria-live="polite"><p class="log-empty">由你决定如何应对。</p></div></div></div>
      </details>
    </section>

    <footer class="card-desk">
      <div class="desk-label"><div><span class="eyebrow">选择招式</span><small id="desk-hint">点击按钮或按 1–4 立即出牌</small></div><span class="round-number" id="round-rail">01</span></div>
      <div class="cards" id="cards"></div>
      <div class="desk-actions"><button id="skip" data-testid="skip" class="text-button" disabled>跳过 <kbd>空格</kbd></button><button id="submit" data-testid="submit" class="submit-button" disabled><span>执行出牌</span><b>↗</b><kbd>ENTER</kbd></button></div>
    </footer>
    <div class="footer-note"><span>回合结束恢复自己的 AP · 反击消耗影响下回合</span><span id="controls-help"><kbd>1–4</kbd> 出牌 <kbd>回车</kbd> 继续 <kbd>空格</kbd> 跳过 <kbd>R</kbd> 重开</span></div>
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
const labels: Record<string, string> = { ready: '准备就绪', telegraph: '敌方前摇', planning: '选择出牌', acting: '招式演出', counter: '反击时机', resolve: '攻击结算', 'turn-end': '回合结束', victory: '胜利', defeat: '失败' };
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
  button.setAttribute('aria-label', `${index + 1}. ${CARD_NAMES[card.id]}, 消耗 ${card.cost} 点行动点。 ${CARD_DESCRIPTIONS[card.id]}`);
  button.innerHTML = `<span class="card-top"><span class="card-index">${index + 1}</span><span class="card-cost"><b>${card.cost}</b><small>行动点</small></span></span><span class="card-art ${card.id}-art">${cardIcons[card.id]}</span><span class="card-name">${CARD_NAMES[card.id]}</span><span class="card-desc">${CARD_DESCRIPTIONS[card.id]}</span><span class="card-status" id="status-${card.id}">可用</span>`;
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
  $('#overlay-title').textContent = '迎战决斗者';
  $('#start').innerHTML = '<span>进入竞技场</span><b>↗</b>';
  $('#overlay .key-hint').innerHTML = '按 <kbd>回车</kbd> 开始';
  render(combat.snapshot());
}, { signal: inputEvents.signal });
function hideOverlay() { $('#overlay').classList.add('overlay-hidden'); }
function showTerminal(win: boolean) {
  $('#overlay').classList.remove('overlay-hidden');
  $('#overlay-title').textContent = win ? '对决胜利' : '对决失败';
  $('#overlay-copy').textContent = win ? '你把握住了时机，赤门将铭记这场对决。' : '对决结束。观察敌方意图，保留行动点用于格挡，再试一次。';
  const button = $('#start'); button.dataset.testid = 'start'; button.innerHTML = '<span>再次挑战</span><b>↗</b>';
  $('#overlay .key-hint').innerHTML = '按 <kbd>R</kbd> 重新开始';
}
function drawArena(snapshot: CombatSnapshot, realSeconds: number) {
  arena?.render(snapshot, realSeconds);
  const canvas = $('#canvas');
  const playerModel = canvas.dataset.playerModel;
  const enemyModel = canvas.dataset.enemyModel;
  const status = $('#character-status');
  status.hidden = !arena || (playerModel === 'ready' && enemyModel === 'ready');
  status.textContent = playerModel === 'fallback' || enemyModel === 'fallback'
    ? '部分角色载入失败，使用简化外观继续对决。'
    : '角色载入中…可先开始对决';
  const label = SHOT_NAMES[$('#canvas').dataset.shot ?? 'overview'] ?? '战斗镜头';
  if ($('#shot-name').textContent !== label) $('#shot-name').textContent = label;
}
function render(snapshot: CombatSnapshot, realSeconds = 0) {
  keySnapshot = snapshot;
  const qte = snapshot.controlMode === 'qte';
  app.dataset.controlMode = snapshot.controlMode;

  const hudKey = [snapshot.controlMode, snapshot.phase, snapshot.activeSide, snapshot.enemyAp, snapshot.round, snapshot.playerHp, snapshot.enemyHp,
    snapshot.ap, snapshot.remaining.toFixed(1), snapshot.queue.join(','),
    snapshot.committed.join(','), snapshot.pendingActions.join(','), snapshot.activeCard, snapshot.actionResolved, snapshot.playerInputOpen, snapshot.planningRemaining.toFixed(1), snapshot.paused,
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
  $('#phase').textContent = snapshot.phase === 'planning' ? '玩家选牌' : labels[snapshot.phase] ?? snapshot.phase.toUpperCase();
  $('#control-mode').textContent = qte ? '演出式出牌' : '序列出牌';
  $('#control-mode').toggleAttribute('disabled', !['ready', 'victory', 'defeat'].includes(snapshot.phase) || snapshot.paused);
  $('#sequence-label').textContent = snapshot.activeSide === 'enemy' ? '敌方出牌' : qte ? '行动队列' : '你的出牌序列';
  $('#desk-hint').textContent = qte ? (snapshot.phase === 'acting' ? snapshot.playerInputOpen ? '演出中仍可出牌 · 按顺序执行' : '出牌已结束 · 等待队列执行完毕' : '点击或按 1–4 出牌 · 可连续入队') : '选牌时预留行动点';
  $('#controls-help').innerHTML = qte ? '<kbd>1–4</kbd> 出牌 <kbd>回车</kbd> 继续 <kbd>空格</kbd> 跳过 <kbd>R</kbd> 重开' : '<kbd>1–4</kbd> 选牌 <kbd>回车</kbd> 执行 <kbd>空格</kbd> 跳过 <kbd>R</kbd> 重开';
  if (snapshot.phase === 'ready') $('#overlay-copy').textContent = qte ? '己方演出期间也可连续出牌，按提交顺序执行。回合结束恢复自己的行动点，敌人出牌时可反击。' : '在自己的回合选择招式序列。敌人出牌时可选择反击。';
  $('#phase').dataset.phase = snapshot.phase;
  $('#phase').dataset.side = snapshot.activeSide;
  $('#turn-owner').textContent = snapshot.phase === 'ready' ? '准备就绪' : snapshot.activeSide === 'player' ? '玩家回合' : '敌人回合';
  $('#enemy-ap').textContent = String(snapshot.enemyAp);
  $('#phase-copy').textContent = snapshot.paused ? '离开页面，已暂停' : phaseCopy(snapshot);
  const displayRemaining = snapshot.phase === 'acting' ? snapshot.planningRemaining : snapshot.remaining;
  $('#timer').textContent = displayRemaining > 0 ? displayRemaining.toFixed(1) : snapshot.phase === 'ready' || (snapshot.phase === 'planning' && snapshot.playerTurnSeconds === 0) ? '—' : '0.0';
  $('#timer').classList.toggle('timer-urgent', snapshot.phase !== 'acting' && displayRemaining > 0 && displayRemaining < 1.25);
  const windowLength = snapshot.phase === 'planning' || snapshot.phase === 'acting' ? snapshot.playerTurnSeconds : snapshot.phase === 'counter' ? 2 : snapshot.phase === 'telegraph' ? (snapshot.enemyAttack === 'heavy' ? 1.6 : 1.1) : 0;
  const timerProgress = windowLength > 0 ? Math.max(0, Math.min(1, displayRemaining / windowLength)) : 0;
  $('#timer-progress').style.transform = `scaleX(${timerProgress})`;
  $('#stage-status').dataset.phase = snapshot.phase;
  const intentText = snapshot.phase === 'ready' ? '等待挑战者' : snapshot.phase === 'victory' ? '对决胜利' : snapshot.phase === 'defeat' ? '对决失败' : `敌方${snapshot.enemyAttack === 'heavy' ? '重攻击' : '轻攻击'}将至`;
  $('#intent').textContent = intentText;
  $('#intent-detail').textContent = snapshot.phase === 'ready' ? '进入竞技场开始战斗' : snapshot.phase === 'victory' || snapshot.phase === 'defeat' ? '对决已结束' : `${snapshot.enemyDamage} 点伤害 · ${snapshot.enemyAttack === 'heavy' ? '范围大，前摇较慢' : '快速轻击'}`;
  $('#intent-card').classList.toggle('intent-heavy', snapshot.enemyAttack === 'heavy' && snapshot.phase !== 'ready');
  const threatCard = $('#counter-threat-card');
  const counterThreatVisible = snapshot.pendingEnemyCard !== null;
  threatCard.classList.toggle('threat-card-visible', counterThreatVisible);
  threatCard.classList.toggle('threat-card-heavy', snapshot.enemyAttack === 'heavy');
  threatCard.setAttribute('aria-hidden', String(!counterThreatVisible));
  $('#threat-card-number').textContent = snapshot.enemyAttack === 'heavy' ? '02' : '01';
  $('#threat-card-name').textContent = snapshot.pendingEnemyCard?.name ?? (snapshot.enemyAttack === 'heavy' ? '重攻击' : '轻攻击');
  $('#threat-card-damage').textContent = `${snapshot.enemyDamage} 点伤害`;
  const reservedAp = qte ? 0 : snapshot.queue.reduce((sum, id) => sum + (CARDS.find((card) => card.id === id)?.cost ?? 0), 0);
  const availableAp = Math.max(0, snapshot.ap - reservedAp);
  $('#ap').textContent = String(availableAp);
  $('#ap-reserved').textContent = qte ? '出牌时消耗' : `预留 ${reservedAp} 点`;
  $('#ap-reserved').classList.toggle('has-reserved', reservedAp > 0);
  const pips = $('#ap-pips'); pips.replaceChildren();
  for (let i = 0; i < snapshot.maxAp; i++) { const pip = document.createElement('i'); if (i < availableAp) pip.className = 'pip-live'; else if (i < snapshot.ap) pip.className = 'pip-reserved'; pips.append(pip); }
  const queue = $('#queue'); queue.replaceChildren();
  if (qte && snapshot.phase === 'acting' && snapshot.activeCard) {
    const actions = [snapshot.activeCard, ...snapshot.pendingActions];
    actions.forEach((id, index) => {
      const li = document.createElement('li');
      li.dataset.card = id;
      li.dataset.state = index === 0 ? 'active' : 'pending';
      li.classList.toggle('queue-active', index === 0);
      const label = index === 0 ? snapshot.actionResolved ? '收势' : '演出中' : `等待 ${index}`;
      li.innerHTML = `<span class="queue-order">${label}</span><b>${CARD_NAMES[id]}</b>`;
      queue.append(li);
    });
  } else if (qte) {
    const li = document.createElement('li'); li.className = 'qte-response';
    li.textContent = snapshot.paused ? '已暂停 · 返回后继续' : snapshot.phase === 'planning' ? '1 快斩 · 2 重斩 · 3 格挡 · 可连续出牌' : snapshot.phase === 'counter' ? '4 立即反击 · 空格放弃反击' : snapshot.phase === 'telegraph' ? '敌人已出牌，准备反击…' : snapshot.phase === 'turn-end' ? '只恢复当前行动方 AP' : '观看对决';
    queue.append(li);
  } else if (!snapshot.queue.length) queue.innerHTML = '<li class="empty-queue">你的出牌将在此显示</li>';
  else snapshot.queue.forEach((id, i) => { const card = CARDS.find((item) => item.id === id)!; const li = document.createElement('li'); li.innerHTML = `<span class="queue-order">0${i + 1}</span><b>${CARD_NAMES[card.id]}</b><span class="queue-cost">${card.cost} 点</span>`; queue.append(li); });
  $('#queue-count').textContent = qte ? String(snapshot.pendingActions.length) + ' 待执行' : String(snapshot.queue.length);
  const result = $('#result'); result.replaceChildren();
  if (snapshot.phase === 'acting' && snapshot.committed.length) {
    const activeIndex = snapshot.committed.indexOf(snapshot.activeCard!);
    snapshot.committed.forEach((id, index) => { const card = CARDS.find((item) => item.id === id)!; const li = document.createElement('li'); li.innerHTML = `<span class="result-check">${snapshot.activeCard === id ? '↗' : index < activeIndex ? '✓' : '·'}</span><b>${CARD_NAMES[card.id]}</b><span>${snapshot.activeCard === id ? snapshot.actionResolved ? '收势中' : '演出中' : index < activeIndex ? '已结算' : '即将执行'}</span>`; result.append(li); });
  } else {
    const outcomes = snapshot.log.filter((line) => /^(Quick Strike|Heavy Strike|Guard is ready|Counter deals)/.test(line)).slice(-3).reverse();
    if (!outcomes.length) result.innerHTML = '<li class="empty-result">尚未结算招式</li>';
    else outcomes.forEach((line) => { const li = document.createElement('li'); li.innerHTML = `<span class="result-check">✓</span><b>${escapeHtml(chineseText(line.split(/ (?:deals|is ready)/)[0]))}</b><span>${escapeHtml(chineseText(line))}</span>`; result.append(li); });
  }
  const log = $('#log'); log.replaceChildren();
  if (!snapshot.log.length) log.innerHTML = '<p class="log-empty">由你决定如何应对。</p>';
  else {
    const lines = [...snapshot.log].reverse().slice(0, 4);
    if (snapshot.phase === 'resolve' && lines.some((line) => line.includes('damage guarded'))) {
      const prevented = lines.find((line) => line.includes('damage guarded'))!;
      const amount = Number(prevented.match(/(\d+) damage guarded/)?.[1] ?? 0);
      if (amount >= snapshot.enemyDamage) lines.unshift('Guard absorbs the full attack · 0 damage taken.');
    }
    if (snapshot.phase === 'resolve' && lines.some((line) => line.includes('Counter cancels'))) {
      const li = document.createElement('li'); li.innerHTML = '<span class="result-check">✓</span><b>反击</b><span>敌方攻击已取消 · 2 点伤害</span>'; result.prepend(li);
    }
    lines.slice(0, 4).forEach((line, i) => { const p = document.createElement('p'); p.className = i === 0 ? 'log-latest' : ''; p.textContent = chineseText(line); log.append(p); });
  }
  const outcome = recentOutcome(snapshot);
  const outcomeText = outcome || (snapshot.phase === 'acting' ? '按顺序执行已提交的招式' : snapshot.phase === 'planning' ? '选择招式或结束回合' : snapshot.phase === 'telegraph' || snapshot.phase === 'counter' ? '观察敌人的起手' : '');
  if (outcomeText !== lastOutcomeLine) {
    lastOutcomeLine = outcomeText;
    $('#outcome').textContent = outcomeText;
    $('#history-summary').textContent = outcome || '尚无战斗结果';
    $('#outcome').classList.remove('outcome-flash');
    if (outcome) requestAnimationFrame(() => $('#outcome').classList.add('outcome-flash'));
  }
  for (const card of CARDS) {
    const button = $<HTMLButtonElement>(`#card-${card.id}`);
    const rawReason = combat.availability(card.id);
    const reason = rawReason === null ? null : chineseText(rawReason);
    const queued = !qte && snapshot.queue.includes(card.id);
    const pending = qte && snapshot.pendingActions.includes(card.id);
    button.disabled = reason !== null && !queued;
    button.classList.toggle('card-selected', queued || pending);
    button.classList.toggle('card-unavailable', reason !== null && !queued);
    if (qte) button.removeAttribute('aria-pressed');
    else button.setAttribute('aria-pressed', String(queued));
    button.classList.toggle('qte-available', qte && reason === null);
    button.classList.toggle('card-playing', qte && snapshot.activeCard === card.id);
    button.title = qte ? `${CARD_NAMES[card.id]}：按 ${ids.indexOf(card.id) + 1} 或点击立即出牌。${reason ?? CARD_DESCRIPTIONS[card.id]}` : `${CARD_NAMES[card.id]}：点击加入序列。${reason ?? CARD_DESCRIPTIONS[card.id]}`;
    const status = $(`#status-${card.id}`);
    status.textContent = qte ? pending ? '已入队 · 等待执行' : snapshot.activeCard === card.id ? snapshot.actionResolved ? '收势中' : '演出中' : reason ?? `按 ${ids.indexOf(card.id) + 1} · 立即出牌` : queued ? '已加入序列' : reason ?? (card.id === 'counter' ? '反击时机' : '可用');
    status.title = reason ?? '';
  }
  const planning = snapshot.phase === 'counter' || (qte ? snapshot.playerInputOpen : snapshot.phase === 'planning');
  $('#submit').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#submit span').textContent = qte ? (snapshot.phase === 'counter' ? '放弃反击' : '结束回合') : snapshot.queue.length ? '执行出牌' : snapshot.phase === 'counter' ? '放弃反击' : '结束回合';
  $('#skip').toggleAttribute('disabled', !planning || snapshot.paused);
  $('#skip').innerHTML = snapshot.activeSide === 'player' ? '结束出牌 <kbd>空格</kbd>' : '放弃反击 <kbd>空格</kbd>';
  $('#pause-banner').toggleAttribute('hidden', !snapshot.paused);
  $('.scene-frame').classList.toggle('is-paused', snapshot.paused);
  if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') showTerminal(snapshot.phase === 'victory');
  drawArena(snapshot, realSeconds);
}
function phaseCopy(s: CombatSnapshot): string {
  if (s.phase === 'turn-end') return s.activeSide === 'player' ? '玩家 AP 恢复后交给敌人' : '仅敌方 AP 恢复，玩家 AP 不变';
  if (s.phase === 'telegraph') return '观察敌人的前摇';
  if (s.phase === 'planning') return s.controlMode === 'qte' ? '玩家回合 · 按下招式出牌' : '玩家回合 · 选择出牌序列';
  if (s.phase === 'acting') return s.playerInputOpen ? '演出中可继续出牌 · 选牌计时暂停' : '停止接收新牌 · 按顺序执行剩余行动';
  if (s.phase === 'counter') return '慢动作 · 选择反击或依靠格挡';
  if (s.phase === 'resolve') return s.guard ? '格挡抵御攻击' : '正在结算伤害';
  return s.phase === 'ready' ? '等待对决开始' : '对战结束';
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
  if (line.includes('Counter cancels') || line.includes('Incoming attack cancelled')) return '反击成功 · 敌方攻击已取消';
  const guarded = line.match(/(\d+) damage guarded/);
  if (guarded) {
    const nextRound = log.findIndex((entry, index) => index > eventIndex && entry.startsWith('玩家回合 '));
    const resolutionEnd = nextRound < 0 ? log.length : nextRound;
    const damageLine = log.slice(eventIndex + 1, resolutionEnd).find((entry) => /^Enemy attack deals \d+ damage to the player/.test(entry));
    const taken = Number(damageLine?.match(/deals (\d+) damage/)?.[1] ?? 0);
    return taken === 0 ? `格挡抵御 ${guarded[1]} 点 · 未受伤` : `格挡抵御 ${guarded[1]} 点 · 受到 ${taken} 点伤害`;
  }
  if (line.startsWith('Guard is ready')) return '已架起格挡 · 下次受击减伤 2 点';
  const damage = line.match(/(Quick Strike|Heavy Strike|Counter|Enemy attack) deals (\d+) damage to the (enemy|player)/);
  if (damage) {
    if (damage[1] === 'Enemy attack' && eventIndex > 0) {
      const priorGuard = log[eventIndex - 1].match(/(\d+) damage guarded/);
      if (priorGuard) return `格挡抵御 ${priorGuard[1]} 点 · 受到 ${damage[2]} 点伤害`;
    }
    return `${chineseText(damage[1])} · 对${damage[3] === 'enemy' ? '敌人' : '你'}造成 ${damage[2]} 点伤害`;
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
  const canAct = keySnapshot.phase === 'planning' || keySnapshot.phase === 'counter' || (keySnapshot.controlMode === 'qte' && keySnapshot.playerInputOpen);
  if (key === 'enter' && canAct) { continueTurn(); return; }
  if (key === ' ' && canAct) { combat.skip(); render(combat.snapshot()); return; }
  const index = Number(key) - 1;
  if (index >= 0 && index < ids.length && canAct) {
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
