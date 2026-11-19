import { test, expect } from '../../fixtures/auth.fixture';
import { Modulo10Page } from '../../pages/Modulo10Page';

type ProdutoDaApi = { _id: string; name: string; stock: number };

test('CT-E2E-10-01 - cadastrar, editar e excluir usando os botões da interface', async ({ sellerPage, sellerAuth, request }) => {
  test.setTimeout(90_000);

  const painel = new Modulo10Page(sellerPage);
  const nome = `Produto QA Banca M10 ${Date.now()}`;
  const headers = { Authorization: `Bearer ${sellerAuth.token}` };
  let produtoId: string | undefined;
  let excluido = false;

  const conferirEstoqueNaApi = async (esperado: number) => {
    const resposta = await request.get('seller/products', { headers });
    expect(resposta.status()).toBe(200);
    const produtos: ProdutoDaApi[] = await resposta.json();
    const produto = produtos.find(item => item._id === produtoId);
    expect(produto, 'Produto precisa existir no catálogo do lojista').toBeDefined();
    expect(produto!.stock).toBe(esperado);
  };

  try {
    await test.step('1. Clicar em CADASTRAR PRODUTO e conferir o cadastro', async () => {
      await painel.novoProduto();
      await painel.preencherProduto({
        nome,
        categoria: 'Periféricos',
        preco: '149.90',
        estoque: '12',
        descricao: 'Produto temporário da banca de automação'
      });

      const respostaPost = sellerPage.waitForResponse(resposta =>
        resposta.url().includes('/api/seller/products') &&
        resposta.request().method() === 'POST'
      );
      await painel.salvarProduto(); // Clica em "Cadastrar Produto" na tela enviada
      const respostaCriacao = await respostaPost;
      expect(respostaCriacao.status()).toBe(201);
      const dadosCriacao: { product: ProdutoDaApi } = await respostaCriacao.json();
      produtoId = dadosCriacao.product._id;
      expect(dadosCriacao.product.name).toBe(nome);

      await expect(painel.cardDoProduto(nome)).toBeVisible();
      await conferirEstoqueNaApi(12);
      console.log(`[E2E] CADASTRO OK | POST 201 | ${nome} | ${produtoId}`);
    });

    await test.step('2. Clicar em EDITAR, alterar o estoque e salvar', async () => {
      await painel.editarProduto(nome);
      const respostaPut = sellerPage.waitForResponse(resposta =>
        resposta.url().includes(`/api/seller/products/${produtoId}`) &&
        resposta.request().method() === 'PUT'
      );
      await painel.alterarEstoque('27');
      const respostaEdicao = await respostaPut;
      expect(respostaEdicao.status()).toBe(200);
      await conferirEstoqueNaApi(27);
      await expect(painel.cardDoProduto(nome)).toBeVisible();
      console.log(`[E2E] EDIÇÃO OK | PUT 200 | estoque de 12 para 27`);
    });

    await test.step('3. Clicar em EXCLUIR no card do produto e confirmar', async () => {
      const respostaDelete = sellerPage.waitForResponse(resposta =>
        resposta.url().includes(`/api/seller/products/${produtoId}`) &&
        resposta.request().method() === 'DELETE'
      );
      await painel.excluirProdutoPelaTela(nome); // Clique real no botão vermelho "Excluir"
      const respostaExclusao = await respostaDelete;
      expect(respostaExclusao.status()).toBe(200);
      excluido = true;
      console.log(`[E2E] EXCLUSÃO OK | clique na UI | DELETE 200 | ${produtoId}`);

      await expect(painel.cardDoProduto(nome)).toHaveCount(0);
      const listaFinal = await request.get('seller/products', { headers });
      expect(listaFinal.status()).toBe(200);
      const produtos: ProdutoDaApi[] = await listaFinal.json();
      expect(produtos.some(item => item._id === produtoId)).toBe(false);
      console.log('[E2E] CONFERÊNCIA OK | produto excluído da tela e da API');
    });
  } finally {
    // Segurança: somente se o fluxo principal falhar, limpar o produto gerado
    // nesta execução. Nunca apagar um produto oficial ou de outra equipe.
    if (!excluido) {
      try {
        if (!produtoId) {
          const resposta = await request.get('seller/products', { headers });
          if (resposta.ok()) {
            const produtos: ProdutoDaApi[] = await resposta.json();
            produtoId = produtos.find(item => item.name === nome)?._id;
          }
        }
        if (produtoId) {
          const limpeza = await request.delete(`seller/products/${produtoId}`, { headers });
          console.log(`[E2E] Limpeza de segurança | DELETE ${limpeza.status()} | ${produtoId}`);
        }
      } catch (erro) {
        console.error('[E2E] Falha na limpeza de segurança:', erro);
      }
    }
  }
});
