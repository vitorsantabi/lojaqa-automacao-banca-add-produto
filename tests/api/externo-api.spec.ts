import { test, expect } from '@playwright/test';

test('CT-EXT-API-01 - consultar CEP público no ViaCEP', async ({ request }) => {
  const resposta = await request.get('https://viacep.com.br/ws/01001000/json/');
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()['content-type']).toContain('application/json');

  const json = await resposta.json();
  expect(json.cep).toBe('01001-000');
  expect(json.localidade).toBe('São Paulo');
  expect(json.uf).toBe('SP');
  expect(json.erro).not.toBe(true);
  console.log('ViaCEP status:', resposta.status());
  console.log('ViaCEP response JSON:', JSON.stringify(json, null, 2));
});
