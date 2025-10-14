import { test, expect } from '@playwright/test';

test('顧客削除確認アラートを確実にキャッチするテスト', async ({ page }) => {
  await page.goto('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/list.html');

  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('削除');
    await dialog.accept();
  });

  await page
    .getByRole('row', { name: '株式会社*******' })
    .getByRole('link')
    .click();

  const [dialog] = await Promise.all([
    page.waitForEvent('dialog'),
    page.getByRole('button', { name: '削除' }).click()
  ]);

  expect(dialog.message()).toBe('本当に削除しますか？');
  await dialog.accept();

  await expect(page.getByText('株式会社*******')).not.toBeVisible();
});
