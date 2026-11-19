import { test, expect } from '@playwright/test';

test('CT-EXT-E2E-01 - buscar Recife na Wikipédia', async ({ page }) => {
  await page.goto('https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:P%C3%A1gina_principal');
  const busca = page.locator('input[name="search"]').first();
  await busca.fill('Recife');
  await busca.press('Enter');
  await expect(page).toHaveURL(/\/wiki\/Recife(?:\?.*)?$/);
  await expect(page.locator('#firstHeading')).toHaveText('Recife');
  console.log('E2E externo: busca navegou para a página Recife.');
});
