import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/list.html');
  await page.getByRole('link', { name: '株式会社テストプレイライト' }).click();
  await page.getByRole('link', { name: '一覧へ戻る' }).click();
  await page.getByRole('row', { name: '株式会社******* 000-1111-2222' }).getByRole('link').click();
  await page.getByRole('link', { name: '編集' }).click();
  await page.getByRole('textbox', { name: '業種:' }).click();
  await page.getByRole('textbox', { name: '業種:' }).fill('ICT');
  await page.getByRole('button', { name: '確認画面へ' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'この内容で更新' }).click();
});