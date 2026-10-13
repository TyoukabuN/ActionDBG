import { expect, test, type Page } from '@playwright/test';

async function phase(page: Page, value: string) {
  await expect(page.getByTestId('phase')).toHaveAttribute('data-phase', value);
}

test('history disclosure preserves keyboard control and queued costs show AP reservation', async ({ page }) => {
  const clockStart = new Date('2026-10-13T00:00:00Z');
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(clockStart);
  await page.goto('./');
  await page.getByTestId('control-mode').click();
  const history = page.locator('#history-panel');
  await expect(history).not.toHaveAttribute('open', '');
  const summary = history.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(history).toHaveAttribute('open', '');
  await phase(page, 'ready');
  await page.keyboard.press('Enter');
  await expect(history).not.toHaveAttribute('open', '');
  await phase(page, 'ready');
  await page.getByTestId('start').focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(1200);
  await phase(page, 'planning');
  await page.keyboard.press('2');
  await expect(page.getByTestId('ap')).toHaveText('1');
  await expect(page.locator('#ap-reserved')).toHaveText('2 reserved');
  await page.keyboard.press('2');
  await expect(page.getByTestId('ap')).toHaveText('3');
  await expect(page.locator('#ap-reserved')).toHaveText('0 reserved');
  await page.keyboard.press('3');
  await page.keyboard.press('Enter');
  await page.clock.runFor(600);
  await phase(page, 'counter');
  await page.keyboard.press('Space');
  await page.clock.runFor(700);
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-spark-particles', '14');
  await expect(page.locator('#round')).toHaveText('02');
  await expect(page.locator('#outcome')).toContainText('0 damage taken');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
});

test('real keyboard cards share AP with Counter and cancel the incoming hit', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('./');
  await page.getByTestId('control-mode').click();
  await page.getByTestId('start').click();
  await phase(page, 'planning');
  await page.keyboard.press('1');
  await expect(page.getByTestId('queue')).toContainText('Quick Strike');
  await page.keyboard.press('Enter');
  await phase(page, 'counter');
  await expect(page.getByTestId('ap')).toHaveText('2');
  await page.keyboard.press('4');
  await page.keyboard.press('Enter');
  await expect(page.locator('#enemy-hp')).toHaveText('9 / 12');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
  await expect(page.locator('#log')).toContainText(/cancel/i);
  await expect(page.locator('#round')).toHaveText('02');
  await expect(page.getByTestId('card-counter')).toContainText(/cooldown/i);
  await expect(page.locator('#webgl-error')).toBeHidden();
  expect(errors).toEqual([]);
});

test('expiry submits ordered mouse queue, cooldown blocks next round, and five restarts reset', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('control-mode').click();
  await page.getByTestId('start').click();
  await phase(page, 'planning');
  await page.getByTestId('card-heavy').click();
  await page.getByTestId('card-quick').click();
  await expect(page.getByTestId('card-guard')).toBeDisabled();
  await expect(page.getByTestId('queue')).toContainText('Heavy Strike');
  await expect(page.locator('#round')).toHaveText('02');
  await expect(page.locator('#enemy-hp')).toHaveText('8 / 12');
  await expect(page.locator('#player-hp')).toHaveText('8 / 10');
  await phase(page, 'planning');
  await expect(page.getByTestId('card-heavy')).toBeDisabled();
  await expect(page.getByTestId('card-heavy')).toContainText(/cooldown/i);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('r');
    await phase(page, 'telegraph');
    await expect(page.locator('#player-hp')).toHaveText('10 / 10');
    await expect(page.locator('#enemy-hp')).toHaveText('12 / 12');
    await expect(page.locator('#round')).toHaveText('01');
    await expect(page.getByTestId('ap')).toHaveText('3');
  }
});

test('blur freezes countdown and input; canvas and HUD fit a smaller desktop', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('control-mode').click();
  await page.getByTestId('start').click();
  await phase(page, 'planning');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const before = await page.getByTestId('timer').textContent();
  await page.waitForTimeout(600);
  expect(await page.getByTestId('timer').textContent()).toBe(before);
  await page.keyboard.press('1');
  await expect(page.getByTestId('queue')).not.toContainText('Quick Strike');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#pause-banner')).toBeHidden();
  // Exercise the visibility event adapter without exposing gameplay test hooks.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenTime = await page.getByTestId('timer').textContent();
  await page.waitForTimeout(400);
  expect(await page.getByTestId('timer').textContent()).toBe(hiddenTime);
  await page.evaluate(() => {
    delete (document as unknown as Record<string, unknown>).hidden;
    delete (document as unknown as Record<string, unknown>).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#pause-banner')).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  const canvas = page.getByTestId('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(400);
  expect(box!.height).toBeGreaterThan(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  // Canvas-only captures must change while the slow-motion window is active.
  await page.keyboard.press('r');
  await phase(page, 'planning');
  const first = await canvas.screenshot();
  await page.waitForTimeout(300);
  const second = await canvas.screenshot();
  expect(first.equals(second)).toBe(false);
  await page.screenshot({ path: 'test-results/duel-active.png', fullPage: true });
});

test('attack-first strategy wins; idle play loses and can immediately retry', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('control-mode').click();
  await page.getByTestId('start').click();
  for (let round = 1; round <= 5; round++) {
    await phase(page, 'planning');
    if (round % 2 === 1) await page.getByTestId('card-heavy').click();
    else await page.getByTestId('card-guard').click();
    await page.getByTestId('card-quick').click();
    await page.getByTestId('submit').click();
    if (round === 5) break;
    await expect(page.locator('#round')).toHaveText(String(round + 1).padStart(2, '0'));
  }
  await phase(page, 'victory');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 12');
  await expect(page.getByTestId('card-quick')).toBeDisabled();
  await page.getByTestId('start').click();
  await phase(page, 'telegraph');
  for (let round = 1; round <= 4; round++) {
    await phase(page, 'planning');
    await page.getByTestId('skip').click();
    await phase(page, 'counter');
    await page.getByTestId('skip').click();
    if (round < 4) await expect(page.locator('#round')).toHaveText(String(round + 1).padStart(2, '0'));
  }
  await phase(page, 'defeat');
  await expect(page.locator('#player-hp')).toHaveText('0 / 10');
  await page.getByTestId('start').click();
  await phase(page, 'telegraph');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
});

// QTE cases use the public buttons/keys and a browser clock, never a state hook.
async function openQte(page: Page) {
  const now = new Date('2026-10-13T00:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.goto('./');
  await expect(page.getByTestId('control-mode')).toHaveText('Cinematic QTE');
  await page.getByTestId('start').click();
  await page.clock.runFor(1300);
  await phase(page, 'planning');
}

test('QTE buttons play directly, resume time, and keyboard counter changes the camera', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await openQte(page);
  const canvas = page.getByTestId('canvas');
  await expect(canvas).toHaveAttribute('data-shot', 'decision');
  const decisionCamera = await canvas.getAttribute('data-camera-position');
  const time = Number(await page.getByTestId('timer').textContent());
  await expect(page.getByTestId('control-mode')).toBeDisabled();
  await page.getByTestId('card-quick').click();
  await phase(page, 'acting');
  await expect(page.getByTestId('ap')).toHaveText('2');
  await page.clock.runFor(250);
  await expect(canvas).toHaveAttribute('data-shot', 'quick-strike');
  expect(await canvas.getAttribute('data-camera-position')).not.toBe(decisionCamera);
  await page.clock.runFor(350);
  await phase(page, 'planning');
  expect(Number(await page.getByTestId('timer').textContent())).toBeGreaterThanOrEqual(time - .2);
  await expect(page.getByTestId('card-quick')).toBeDisabled();
  await expect(page.locator('#enemy-hp')).toHaveText('11 / 12');
  await expect(canvas).toHaveAttribute('data-blood-particles', '18');
  await page.getByTestId('submit').click();
  await phase(page, 'counter');
  const enemyCard = page.getByTestId('counter-threat-card');
  await expect(enemyCard).toBeVisible();
  await expect(enemyCard).toContainText('Light Attack');
  await expect(enemyCard).toContainText('2 DAMAGE');
  await expect(enemyCard).toHaveAttribute('aria-hidden', 'false');
  await page.clock.runFor(400);
  await expect(canvas).toHaveAttribute('data-shot', 'counter-window');
  expect(Number(await canvas.getAttribute('data-letterbox'))).toBeGreaterThan(.95);
  await expect(canvas).toHaveAttribute('data-render-order', 'scene,letterbox,actors,effects');
  await page.keyboard.press('4');
  await phase(page, 'resolve');
  await expect(enemyCard).toBeHidden();
  await expect(page.locator('#enemy-hp')).toHaveText('9 / 12');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
  await page.clock.runFor(220);
  await expect(canvas).toHaveAttribute('data-shot', 'parry');
  await page.clock.runFor(500);
  await expect(page.locator('#round')).toHaveText('02');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('r');
    await expect(page.locator('#round')).toHaveText('01');
    await expect(page.getByTestId('ap')).toHaveText('3');
    await expect(page.locator('#player-hp')).toHaveText('10 / 10');
    await expect(page.locator('#enemy-hp')).toHaveText('12 / 12');
  }
  expect(errors).toEqual([]);
});

test('QTE native keyboard buttons and heavy/guard shots respect pause and expiry', async ({ page }) => {
  test.setTimeout(120_000);
  await openQte(page);
  const canvas = page.getByTestId('canvas');
  await page.getByTestId('card-heavy').focus();
  await page.keyboard.press('Enter');
  await phase(page, 'acting');
  await page.clock.runFor(250);
  await expect(canvas).toHaveAttribute('data-shot', 'heavy-strike');
  await page.clock.runFor(350);
  await phase(page, 'planning');
  await page.keyboard.press('3');
  await phase(page, 'acting');
  await page.clock.runFor(220);
  await expect(canvas).toHaveAttribute('data-shot', 'guard');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const before = await canvas.getAttribute('data-camera-position');
  const timer = await page.getByTestId('timer').textContent();
  await page.clock.runFor(1500);
  expect(await canvas.getAttribute('data-camera-position')).toBe(before);
  expect(await page.getByTestId('timer').textContent()).toBe(timer);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.clock.runFor(1100);
  await expect(page.locator('#round')).toHaveText('02');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
  await page.clock.runFor(1800);
  await phase(page, 'planning');
  await page.clock.runFor(4100);
  await phase(page, 'counter');
  await expect(page.getByTestId('counter-threat-card')).toContainText('Heavy Attack');
  await expect(page.getByTestId('counter-threat-card')).toContainText('4 DAMAGE');
  await page.clock.runFor(2700);
  await expect(page.locator('#round')).toHaveText('03');
  await expect(page.locator('#player-hp')).toHaveText('6 / 10');
});

test('reduced motion keeps a stable QTE overview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openQte(page);
  const canvas = page.getByTestId('canvas');
  const position = await canvas.getAttribute('data-camera-position');
  await page.keyboard.press('1');
  await page.clock.runFor(250);
  await phase(page, 'acting');
  await expect(canvas).toHaveAttribute('data-shot', 'overview');
  expect(await canvas.getAttribute('data-camera-position')).toBe(position);
});
