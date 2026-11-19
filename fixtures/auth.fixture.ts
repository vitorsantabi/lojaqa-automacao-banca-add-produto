import { test as base, expect, request as playwrightRequest, type Page } from '@playwright/test';

type SellerAuth = {
  token: string;
  user: { name: string; email: string; role: string };
};

type TestFixtures = { sellerPage: Page };
type WorkerFixtures = { sellerAuth: SellerAuth };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  sellerAuth: [async ({}, use) => {
    const apiBaseUrl = `${(process.env.API_BASE_URL || 'https://api-qa-fap2026.onrender.com/api').replace(/\/+$/, '')}/`;
    const api = await playwrightRequest.newContext({ baseURL: apiBaseUrl });

    const response = await api.post('login', {
      data: {
        email: process.env.SELLER_EMAIL || 'lojista@system.com',
        password: process.env.SELLER_PASSWORD || 'SellerPass123'
      }
    });

    if (response.status() !== 200) {
      const responseBody = await response.text();
      await api.dispose();
      throw new Error(`Autenticação de preparação falhou (${response.status()}): ${responseBody}`);
    }

    const body = await response.json();
    if (!body.token || body.user?.role !== 'seller') {
      await api.dispose();
      throw new Error('O login não retornou token e usuário com perfil seller.');
    }

    await use({ token: body.token, user: body.user });
    await api.dispose();
  }, { scope: 'worker' }],

  sellerPage: async ({ page, sellerAuth, browser }, use) => {
    let duranteTeste = true;
    page.on('close', () => {
      if (duranteTeste) console.error('[E2E] A aba do painel foi fechada durante o teste. Não feche o navegador aberto pelo Playwright.');
    });
    page.on('crash', () => {
      if (duranteTeste) console.error('[E2E] A aba do painel travou (crash). Consulte o trace.zip.');
    });
    browser.on('disconnected', () => {
      if (duranteTeste) console.error('[E2E] O navegador foi desconectado/fechado. Consulte o trace.zip.');
    });
    page.on('pageerror', error => console.error(`[E2E] Erro JavaScript no painel: ${error.message}`));
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
    }, sellerAuth);

    const panelUrl = process.env.LOJAQA_PANEL_URL ||
      'https://alisonmelo.github.io/tioalison-pe-t4-fap26/projetos-base/01-sistema-login/painel.html';

    const respostaPainel = await page.goto(panelUrl);
    if (!respostaPainel?.ok()) {
      throw new Error(`Falha ao carregar o painel: status ${respostaPainel?.status() ?? 'sem resposta'} em ${panelUrl}`);
    }
    console.log(`[E2E] Painel carregado: ${page.url()}`);
    await expect(page.locator('#panelTitle')).toHaveText('Painel do Lojista');
    await use(page);
    duranteTeste = false;
  }
});

export { expect } from '@playwright/test';
