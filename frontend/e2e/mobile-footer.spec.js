import { test, expect } from '@playwright/test';

async function readFooterGeometry(page) {
  const footer = page.locator('.panel-footer');
  await expect(footer).toBeVisible();
  const box = await footer.boundingBox();
  if (!box) throw new Error('panel-footer did not produce a layout box');
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollY: window.scrollY,
  }));
  return { box, viewport };
}

function expectPinnedToViewportBottom({ box, viewport }) {
  expect(Math.abs((box.y + box.height) - viewport.height)).toBeLessThanOrEqual(2);
  expect(box.x).toBeLessThanOrEqual(2);
  expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(2);
}

test('mobile review footer stays visible at the real viewport bottom', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const initial = await readFooterGeometry(page);
  await page.screenshot({ path: 'test-results/mobile-footer-initial.png', fullPage: false });
  expectPinnedToViewportBottom(initial);

  await page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  });
  await page.waitForTimeout(150);

  const afterScroll = await readFooterGeometry(page);
  await page.screenshot({ path: 'test-results/mobile-footer-scrolled.png', fullPage: false });
  expectPinnedToViewportBottom(afterScroll);
});
