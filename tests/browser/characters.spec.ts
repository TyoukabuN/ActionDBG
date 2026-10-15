import { expect, test, type Page } from '@playwright/test';

async function openCharacters(page: Page) {
  const now = new Date('2026-10-15T00:00:00Z');
  await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  await page.goto('./');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-model', 'ready');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-enemy-model', 'ready');
  await page.getByTestId('start').click();
  await page.clock.runFor(300);
  await expect(page.getByTestId('character-status')).toBeHidden();
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: `test-results/characters-${name}.png` });
}

test('native characters animate queued attacks, counter contact, pause and restart', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await openCharacters(page);
  const canvas = page.getByTestId('canvas');
  const motionFrames: Record<string, unknown>[] = [];
  async function advanceMotion(milliseconds: number, segment: string) {
    for (let elapsed = 0; elapsed < milliseconds;) {
      const step = Math.min(100, milliseconds - elapsed);
      await page.clock.runFor(step); elapsed += step;
      const name = `characters-motion-${String(motionFrames.length).padStart(2, '0')}`;
      await canvas.screenshot({ path: `test-results/${name}.png` });
      motionFrames.push({ name, segment, elapsed, ...await canvas.evaluate(node => ({ ...node.dataset })) });
    }
  }
  await expect(canvas).toHaveAttribute('data-player-animation', 'Idle');
  await expect(canvas).toHaveAttribute('data-enemy-animation', 'Idle');
  await capture(page, 'idle');
  await page.keyboard.press('1'); await advanceMotion(200, 'quick-preparation');
  await expect(canvas).toHaveAttribute('data-player-animation', '1H_Melee_Attack_Slice_Horizontal');
  const firstPose = await canvas.getAttribute('data-player-animation-time');
  await page.getByTestId('card-heavy').click();
  await expect(canvas).toHaveAttribute('data-player-animation-time', firstPose!);
  await expect(page.getByTestId('ap')).toHaveText('0');
  await capture(page, 'quick-windup');
  await advanceMotion(400, 'quick-contact');
  await expect(page.locator('#enemy-hp')).toHaveText('11 / 12');
  await expect(canvas).toHaveAttribute('data-enemy-animation', 'Hit_A');
  await capture(page, 'quick-contact');
  await advanceMotion(250, 'quick-recovery');
  await expect(canvas).toHaveAttribute('data-player-animation', '1H_Melee_Attack_Chop');
  await advanceMotion(350, 'heavy-preparation'); await capture(page, 'heavy-windup');
  await advanceMotion(200, 'heavy-contact');
  await expect(page.locator('#enemy-hp')).toHaveText('8 / 12');
  await capture(page, 'heavy-contact');
  await advanceMotion(250, 'heavy-recovery');
  await page.clock.runFor(500 + 1450);
  await expect(page.getByTestId('phase')).toHaveAttribute('data-phase', 'counter');
  await expect(canvas).toHaveAttribute('data-letterbox', '1.000');
  await capture(page, 'counter-window');
  await page.keyboard.press('4');
  await expect(page.locator('#enemy-hp')).toHaveText('6 / 12');
  await expect(canvas).toHaveAttribute('data-player-animation', 'Block_Attack');
  await capture(page, 'counter-contact');
  await page.clock.runFor(700);
  await expect(canvas).toHaveAttribute('data-enemy-animation', 'Idle');
  await page.clock.runFor(500);
  await expect(page.getByTestId('phase')).toHaveAttribute('data-phase', 'planning');
  await page.getByTestId('restart').click();
  await page.keyboard.press('2'); await page.clock.runFor(250);
  const pose = await canvas.getAttribute('data-player-animation-time');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(1000);
  await expect(canvas).toHaveAttribute('data-player-animation-time', pose!);
  await page.getByTestId('restart').click();
  await expect(canvas).toHaveAttribute('data-player-animation', 'Idle');
  await expect(canvas).toHaveAttribute('data-player-animation-time', '0.000');
  await expect(page.getByTestId('queue').locator('[data-state]')).toHaveCount(0);
  await test.info().attach('character-motion', { body: JSON.stringify(motionFrames, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('native Guard holds its shield until contact and plays the actual blocked-hit animation', async ({ page }) => {
  await openCharacters(page);
  await page.getByTestId('card-guard').click(); await page.clock.runFor(850);
  await page.getByTestId('submit').click(); await page.clock.runFor(1900);
  await expect(page.getByTestId('phase')).toHaveAttribute('data-phase', 'counter');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-animation', 'Blocking');
  await page.getByTestId('skip').click(); await page.clock.runFor(400);
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-animation', 'Blocking');
  await capture(page, 'guard-before-contact');
  await page.clock.runFor(300);
  await expect(page.locator('#player-hp')).toHaveText('10 / 10');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-spark-particles', '14');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-animation', 'Block_Hit');
  await capture(page, 'guard-contact');
});

test('portrait characters and queued input fit the touch interface', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openCharacters(page);
  await page.getByTestId('card-quick').tap(); await page.clock.runFor(200);
  await page.getByTestId('card-heavy').tap();
  await expect(page.getByTestId('queue').locator('[data-state="pending"]')).toContainText('重斩');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-animation', '1H_Melee_Attack_Slice_Horizontal');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const action = await page.getByTestId('submit').boundingBox();
  expect(action!.y + action!.height).toBeLessThanOrEqual(844);
  await capture(page, 'portrait-queue');
  await page.clock.runFor(1400);
  await expect(page.locator('#enemy-hp')).toHaveText('8 / 12');
  expect(errors).toEqual([]); await context.close();
});

test('a failed model request keeps the procedural fallback and playable card flow', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/assets/characters/kaykit/Knight.glb', route => route.abort());
  const now = new Date('2026-10-15T00:00:00Z');
  await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  await page.goto('./');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-player-model', 'fallback');
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-enemy-model', 'ready');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('character-status')).toContainText('使用简化外观');
  await page.keyboard.press('1'); await page.clock.runFor(850);
  await expect(page.locator('#enemy-hp')).toHaveText('11 / 12');
  await expect(page.getByTestId('ap')).toHaveText('2');
  expect(errors).toEqual([]);
});
