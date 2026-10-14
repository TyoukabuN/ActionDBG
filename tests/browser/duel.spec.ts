import { expect, test, type Page } from '@playwright/test';

async function phase(page: Page, name: string, side?: string) {
  await expect(page.getByTestId('phase')).toHaveAttribute('data-phase', name);
  if (side) await expect(page.getByTestId('phase')).toHaveAttribute('data-side', side);
}
async function open(page: Page, queue = false) {
  const now = new Date('2026-10-14T00:00:00Z');
  await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  await page.goto('./');
  if (queue) await page.getByTestId('control-mode').click();
  await page.getByTestId('start').click();
  await phase(page, 'planning', 'player');
}
async function endPlayer(page: Page) {
  await page.getByTestId('submit').click();
  await phase(page, 'turn-end', 'player');
  await page.clock.runFor(500);
  await phase(page, 'telegraph', 'enemy');
}

test('player cards and side AP recovery lead directly to an enemy Counter without Response', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await open(page);
  await expect(page.getByTestId('turn-owner')).toHaveText('玩家回合');
  await page.getByTestId('card-quick').click();
  await phase(page, 'acting', 'player');
  await page.clock.runFor(600);
  await phase(page, 'planning', 'player');
  await expect(page.getByTestId('ap')).toHaveText('2');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-blood-particles', '18');
  await expect(page.getByTestId('card-quick')).toBeDisabled();
  await endPlayer(page);
  await expect(page.getByTestId('ap')).toHaveText('3');
  await expect(page.getByTestId('enemy-ap')).toHaveText('2');
  await expect(page.getByTestId('counter-threat-card')).toBeVisible();
  await expect(page.getByTestId('counter-threat-card')).toContainText('轻攻击');
  await expect(page.getByTestId('card-heavy')).toBeDisabled();
  await page.clock.runFor(1450);
  await phase(page, 'counter', 'enemy');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-letterbox', '1.000');
  await page.keyboard.press('4');
  await phase(page, 'resolve', 'enemy');
  await expect(page.getByTestId('counter-threat-card')).toBeVisible();
  await expect(page.getByTestId('ap')).toHaveText('1');
  await page.clock.runFor(700);
  await phase(page, 'turn-end', 'enemy');
  await expect(page.getByTestId('enemy-ap')).toHaveText('2');
  await page.clock.runFor(500);
  await phase(page, 'planning', 'player');
  await expect(page.getByTestId('ap')).toHaveText('1');
  await expect(page.getByTestId('enemy-ap')).toHaveText('3');
  await expect(page.locator('#enemy-hp')).toHaveText('9 / 12');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
  await expect(page.getByTestId('counter-threat-card')).toBeHidden();
  expect(errors).toEqual([]);
});

test('queue history retains native keyboard behavior, reserved cost and next-hit Guard', async ({ page }) => {
  await open(page, true);
  const summary = page.locator('#history-panel summary'); await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#history-panel')).toHaveAttribute('open', '');
  await phase(page, 'planning');
  await page.getByTestId('card-heavy').click();
  await expect(page.getByTestId('ap')).toHaveText('1');
  await expect(page.locator('#ap-reserved')).toHaveText('预留 2 点');
  await page.getByTestId('card-heavy').click();
  await page.getByTestId('card-guard').click();
  await page.getByTestId('submit').click();
  await page.clock.runFor(600);
  await phase(page, 'turn-end', 'player');
  await expect(page.getByTestId('ap')).toHaveText('2');
  await page.clock.runFor(1800);
  await phase(page, 'counter', 'enemy');
  await page.getByTestId('skip').click();
  await page.clock.runFor(700);
  await phase(page, 'turn-end', 'enemy');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-spark-particles', '14');
  await expect(page.locator('#outcome')).toContainText('未受伤');
  await page.clock.runFor(500);
  await phase(page, 'planning', 'player');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
});

test('Counter cooldown skips the next enemy reaction but still displays its heavy card', async ({ page }) => {
  await open(page); await endPlayer(page); await page.clock.runFor(1450);
  await page.getByTestId('card-counter').click(); await page.clock.runFor(1200);
  await phase(page, 'planning', 'player');
  await expect(page.getByTestId('ap')).toHaveText('1');
  await expect(page.getByTestId('card-heavy')).toBeDisabled();
  await endPlayer(page);
  await page.clock.runFor(1700);
  await phase(page, 'resolve', 'enemy');
  await expect(page.getByTestId('counter-threat-card')).toBeVisible();
  await expect(page.getByTestId('counter-threat-card')).toContainText('重攻击');
  await expect(page.getByTestId('counter-threat-card')).toContainText('4 点伤害');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-letterbox', '0.000');
  await expect(page.getByTestId('card-counter')).toBeDisabled();
  await page.clock.runFor(1100);
  await phase(page, 'planning', 'player');
  await expect(page.locator('#player-hp')).toHaveText('6 / 10');
});

test('focused native buttons, focus pause and five restarts keep one turn state', async ({ page }) => {
  await open(page);
  await page.getByTestId('card-heavy').focus(); await page.keyboard.press('Enter');
  await phase(page, 'acting'); await page.clock.runFor(250);
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-shot', 'heavy-strike');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const pose = await page.getByTestId('canvas').getAttribute('data-camera-position');
  await page.clock.runFor(1000);
  expect(await page.getByTestId('canvas').getAttribute('data-camera-position')).toBe(pose);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.clock.runFor(350);
  await phase(page, 'planning', 'player');
  await expect(page.getByTestId('ap')).toHaveText('1');
  await expect(page.locator('#enemy-hp')).toHaveText('9 / 12');
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('restart').click();
    await phase(page, 'planning', 'player');
    await expect(page.locator('#enemy-hp')).toHaveText('12 / 12');
    await expect(page.getByTestId('ap')).toHaveText('3');
    await expect(page.getByTestId('enemy-ap')).toHaveText('3');
    await expect(page.getByTestId('counter-threat-card')).toBeHidden();
  }
});

test('portrait touch plays its own turn, reacts on enemy turn and preserves spent AP', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page); await page.getByTestId('card-guard').tap(); await page.clock.runFor(600);
  await page.getByTestId('submit').tap(); await page.clock.runFor(1900);
  await phase(page, 'counter', 'enemy');
  await expect(page.getByTestId('counter-threat-card')).toContainText('轻攻击');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const button = await page.getByTestId('submit').boundingBox();
  expect(button!.height).toBeGreaterThanOrEqual(44);
  expect(button!.y + button!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: 'test-results/turns-portrait.png', fullPage: true });
  await page.getByTestId('card-counter').tap(); await page.clock.runFor(1200);
  await phase(page, 'planning', 'player'); await expect(page.getByTestId('ap')).toHaveText('1');
  await page.getByTestId('restart').tap(); await expect(page.getByTestId('ap')).toHaveText('3');
  expect(errors).toEqual([]); await context.close();
});

test('reduced motion keeps a stable camera while player and Counter timers expire', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await page.clock.runFor(5700);
  await phase(page, 'counter', 'enemy');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-shot', 'overview');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-letterbox', '1.000');
  await page.getByTestId('skip').click(); await page.clock.runFor(1200);
  await phase(page, 'planning', 'player');
  await expect(page.locator('#player-hp')).toHaveText('8 / 10');
});

test('turn strategy wins and victory button immediately retries', async ({ page }) => {
  test.setTimeout(180_000);
  await open(page);
  for (let cycle = 1; cycle <= 3; cycle++) {
    await phase(page, 'planning', 'player');
    if (cycle !== 2) { await page.getByTestId('card-heavy').click(); await page.clock.runFor(600); }
    await page.getByTestId('card-quick').click(); await page.clock.runFor(600);
    if (await page.getByTestId('phase').getAttribute('data-phase') === 'planning') await page.getByTestId('submit').click();
    await page.clock.runFor(cycle === 2 ? 2050 : 1650);
    if (cycle !== 2) {
      await phase(page, 'counter', 'enemy'); await page.getByTestId('card-counter').click();
    }
    if (cycle === 3) break;
    await page.clock.runFor(1200);
  }
  await phase(page, 'victory');
  await expect(page.locator('#overlay-title')).toHaveText('对决胜利');
  await page.getByTestId('start').click();
  await phase(page, 'planning', 'player');
});

test('idle turns lose and defeat button immediately retries', async ({ page }) => {
  test.setTimeout(180_000);
  await open(page);
  for (let cycle = 0; cycle < 4; cycle++) {
    await endPlayer(page); await page.clock.runFor(cycle % 2 ? 1950 : 1450);
    await phase(page, 'counter', 'enemy'); await page.getByTestId('skip').click();
    await page.clock.runFor(1200);
  }
  await phase(page, 'defeat');
  await expect(page.locator('#overlay-title')).toHaveText('对决失败');
  await page.getByTestId('start').click();
  await phase(page, 'planning', 'player');
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
});
