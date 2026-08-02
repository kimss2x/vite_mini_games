import { expect, test } from '@playwright/test';
import { games } from '../src/games';

test('46개 게임이 lazy import되고 명시적 게임 root 또는 canvas를 렌더한다', async ({ page }) => {
  test.setTimeout(120_000);
  const failures: string[] = [];
  let activeGame = 'menu';

  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`${activeGame}: console ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`${activeGame}: pageerror ${error.name}`));

  for (const game of games) {
    activeGame = game.id;
    await page.goto(`/#${game.id}`);
    try {
      await expect(page.locator('canvas, [data-testid="game-root"]').first()).toBeVisible({ timeout: 8_000 });
    } catch {
      failures.push(`${game.id}: canvas not visible`);
    }
  }

  expect(failures).toEqual([]);
});

for (const width of [320, 360, 390, 768]) {
  test(`Chess canvas가 ${width}px viewport 내부에 있다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#chess');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);

    const reset = page.getByRole('button', { name: 'Reset', exact: true });
    const resetBox = await reset.boundingBox();
    expect(resetBox).not.toBeNull();
    expect(resetBox!.width).toBeGreaterThanOrEqual(44);
    expect(resetBox!.height).toBeGreaterThanOrEqual(44);
  });
}
