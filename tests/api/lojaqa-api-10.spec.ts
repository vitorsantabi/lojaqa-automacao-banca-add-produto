import { test, expect } from '../../fixtures/auth.fixture';
import type { APIRequestContext } from '@playwright/test';

type Produto = { _id: string; name: string; stock: number; price: number };

async function listarProdutos(request: APIRequestContext, token: string): Promise<Produto[]> {
  const resposta = await request.get('seller/products', {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(resposta.status()).toBe(200);
  return resposta.json();
}

test('CT-API-10-01 - POST, GET, PUT e DELETE com teardown', async ({ request, sellerAuth }) => {
  const headers = { Authorization: `Bearer ${sellerAuth.token}` };
  const nome = `Mouse QA API ${Date.now()}`;
  let produtoId: string | undefined;

  try {
    const criacao = await request.post('seller/products', {
      headers,
      data: { name: nome, category: 'Periféricos', price: 189.9, stock: 20 }
    });
    expect(criacao.status()).toBe(201);
    expect(criacao.headers()['content-type']).toContain('application/json');
    const criado = await criacao.json();
    produtoId = criado.product._id;
    expect(criado.product.name).toBe(nome);
    console.log('POST /seller/products:', criacao.status(), JSON.stringify(criado));

    const lista = await listarProdutos(request, sellerAuth.token);
    expect(lista.some(item => item._id === produtoId)).toBe(true);
    console.log('GET /seller/products: 200; produto encontrado:', produtoId);

    const edicao = await request.put(`seller/products/${produtoId}`, {
      headers,
      data: { stock: 25 }
    });
    expect(edicao.status()).toBe(200);
    const editado = await edicao.json();
    expect(editado.product.stock).toBe(25);
    console.log('PUT /seller/products/{id}:', edicao.status(), JSON.stringify(editado));

    const exclusao = await request.delete(`seller/products/${produtoId}`, { headers });
    expect(exclusao.status()).toBe(200);
    console.log('DELETE /seller/products/{id}:', exclusao.status(), await exclusao.text());

    const listaFinal = await listarProdutos(request, sellerAuth.token);
    expect(listaFinal.some(item => item._id === produtoId)).toBe(false);
    produtoId = undefined;
  } finally {
    if (produtoId) {
      const limpeza = await request.delete(`seller/products/${produtoId}`, { headers });
      console.log('Teardown de segurança:', limpeza.status());
    }
  }
});

test('CT-API-10-02 - impedir exclusão indevida (403)', async ({ request, sellerAuth }) => {
  const headers = { Authorization: `Bearer ${sellerAuth.token}` };
  const catalogo = await request.get('products');
  expect(catalogo.status()).toBe(200);
  const produtosPublicos: Produto[] = await catalogo.json();
  const produtosDaLoja = await listarProdutos(request, sellerAuth.token);
  const protegidos = ['Teclado Mecânico Aurora', 'Mouse Óptico Atlas', 'Headset Nexo'];
  const produtoSeed = [...produtosDaLoja, ...produtosPublicos]
    .find(item => protegidos.includes(item.name));

  if (produtoSeed) {
    const resposta = await request.delete(`seller/products/${produtoSeed._id}`, { headers });
    expect(resposta.status()).toBe(403);
    expect(resposta.headers()['content-type']).toContain('application/json');
    const json = await resposta.json();
    expect(typeof json.error).toBe('string');
    console.log('DELETE produto oficial protegido -> 403 Forbidden:', JSON.stringify(json));
    return;
  }

  console.log('Produtos seed não encontrados. Testando proteção 403 por perfil de cliente.');
  let idTemporario: string | undefined;
  try {
    const criacao = await request.post('seller/products', {
      headers,
      data: {
        name: `Produto QA Permissao ${Date.now()}`,
        category: 'Periféricos',
        price: 19.9,
        stock: 1
      }
    });
    expect(criacao.status()).toBe(201);
    idTemporario = (await criacao.json()).product._id;

    const loginCliente = await request.post('login', {
      data: {
        email: process.env.CLIENT_EMAIL || 'user@system.com',
        password: process.env.CLIENT_PASSWORD || 'UserPassword123'
      }
    });
    expect(loginCliente.status()).toBe(200);
    const cliente = await loginCliente.json();
    expect(cliente.user?.role).toBe('user');
    expect(typeof cliente.token).toBe('string');

    const resposta = await request.delete(`seller/products/${idTemporario}`, {
      headers: { Authorization: `Bearer ${cliente.token}` }
    });
    expect(resposta.status()).toBe(403);
    expect(resposta.headers()['content-type']).toContain('application/json');
    const json = await resposta.json();
    expect(typeof json.error).toBe('string');
    console.log('DELETE por cliente sem permissão -> 403 Forbidden:', JSON.stringify(json));

    const lista = await listarProdutos(request, sellerAuth.token);
    expect(lista.some(item => item._id === idTemporario)).toBe(true);
  } finally {
    if (idTemporario) {
      const limpeza = await request.delete(`seller/products/${idTemporario}`, { headers });
      expect(limpeza.status(), 'A limpeza do produto temporário deve retornar 200').toBe(200);
      console.log('Teardown do teste 403:', limpeza.status());
    }
  }
});

test('CT-API-10-03 - dados obrigatórios inválidos (400)', async ({ request, sellerAuth }) => {
  const resposta = await request.post('seller/products', {
    headers: { Authorization: `Bearer ${sellerAuth.token}` },
    data: { category: 'Periféricos', price: 20, stock: 2 }
  });
  expect(resposta.status()).toBe(400);
  const json = await resposta.json();
  expect(typeof json.error).toBe('string');
  console.log('POST inválido -> 400 Bad Request:', JSON.stringify(json));
});
