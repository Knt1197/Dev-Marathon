import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/add.html');
  await page.getByRole('textbox', { name: '会社名:' }).click();
  await page.getByRole('textbox', { name: '会社名:' }).fill('株式会社プレイライト');
  await page.getByRole('textbox', { name: '業種:' }).click();
  await page.getByRole('textbox', { name: '業種:' }).fill('テスト');
  await page.getByRole('textbox', { name: '連絡先:' }).click();
  await page.getByRole('textbox', { name: '会社名:' }).click();
  await page.getByRole('textbox', { name: '連絡先:' }).click();
  await page.getByRole('textbox', { name: '連絡先:' }).fill('123-4567-8902');
  await page.getByRole('textbox', { name: '所在地:' }).click();
  await page.getByRole('textbox', { name: '所在地:' }).fill('test');
  await page.getByRole('button', { name: '確認画面へ' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: '確定' }).click();
  await page.getByRole('cell', { name: '株式会社プレイライト' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: '株式会社プレイライト' }).click();
  const download = await downloadPromise;
});