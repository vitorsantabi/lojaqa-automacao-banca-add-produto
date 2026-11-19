import type { Dialog, Locator, Page } from '@playwright/test';

export type DadosProduto = {
  nome: string;
  categoria: string;
  preco: string;
  estoque: string;
  descricao?: string;
};

export class Modulo10Page {
  constructor(private readonly page: Page) {}

  private campo(id: string, rotulo: RegExp, placeholder: RegExp): Locator {
    return this.page.locator(`#${id}:visible`)
      .or(this.page.getByLabel(rotulo))
      .or(this.page.getByPlaceholder(placeholder))
      .first();
  }

  private nomeInput(): Locator {
    return this.campo('productName', /Nome do Produto/i, /Nome do produto/i);
  }

  async novoProduto(): Promise<void> {
    if (!(await this.nomeInput().isVisible())) {
      const abrir = this.page.locator('#newProductButton:visible')
        .or(this.page.getByRole('button', { name: /Novo produto|Cadastrar Novo Produto|Adicionar produto|Cadastrar produto/i }))
        .first();
      await abrir.click();
    }
    await this.nomeInput().waitFor({ state: 'visible' });
  }

  async preencherProduto(produto: DadosProduto): Promise<void> {
    await this.nomeInput().fill(produto.nome);
    await this.campo('productCategory', /^Categoria/i, /Categoria/i).fill(produto.categoria);
    await this.campo('productPrice', /Preço de Venda|Preço/i, /Preço/i).fill(produto.preco);
    await this.campo('productStock', /Quantidade em Estoque|Estoque/i, /Estoque/i).fill(produto.estoque);
    await this.campo('productDescription', /Descrição do Produto|Descrição/i, /Descrição/i)
      .fill(produto.descricao ?? '');
  }

  async salvarProduto(): Promise<void> {
    const salvar = this.page.getByRole('button', {
      name: /^(Cadastrar Produto|Salvar produto|Salvar alterações|Atualizar produto|Atualizar Produto)$/i
    }).filter({ visible: true }).last();
    await salvar.click();
  }

  /**
   * Localiza o card do produto a partir de seu nome único. A estrutura
   * visual da LojaQA pode ser <article>, .data-row ou outro contêiner.
   */
  cardDoProduto(nome: string): Locator {
    const texto = this.page.getByText(nome, { exact: true });
    return texto.locator('xpath=ancestor::*[.//button[contains(normalize-space(.), "Editar")]][1]');
  }

  async editarProduto(nome: string): Promise<void> {
    await this.cardDoProduto(nome).getByRole('button', { name: /Editar/i }).click();
    await this.nomeInput().waitFor({ state: 'visible' });
  }

  async alterarEstoque(quantidade: string): Promise<void> {
    await this.campo('productStock', /Quantidade em Estoque|Estoque/i, /Estoque/i).fill(quantidade);
    await this.salvarProduto();
  }

  async excluirProdutoPelaTela(nome: string): Promise<void> {
    const card = this.cardDoProduto(nome);
    const excluir = card.getByRole('button', { name: /Excluir/i });

    if (!(await excluir.isVisible())) {
      throw new Error(
        'O card do produto não apresenta o botão "Excluir". ' +
        'Confira se LOJAQA_PANEL_URL aponta para o mesmo painel das capturas de tela.'
      );
    }

    // Algumas versões da LojaQA usam window.confirm; outras usam modal HTML.
    const aceitarDialogo = async (dialogo: Dialog) => {
      if (dialogo.type() === 'confirm') await dialogo.accept();
      else await dialogo.dismiss();
    };
    this.page.on('dialog', aceitarDialogo);
    try {
      await excluir.click();

      // Se houver modal de confirmação HTML, clique no botão dele.
      // O seletor é limitado à caixa de diálogo para não clicar em outro card.
      const modal = this.page.getByRole('dialog');
      const confirmarNoModal = modal.getByRole('button', {
        name: /^(Sim,? excluir|Confirmar exclusão|Confirmar|Excluir produto|Excluir definitivamente|Excluir)$/i
      }).filter({ visible: true });
      if (await modal.isVisible().catch(() => false)) {
        await confirmarNoModal.click();
      } else {
        const confirmarSolto = this.page.getByRole('button', {
          name: /^(Sim,? excluir|Confirmar exclusão|Excluir definitivamente)$/i
        }).filter({ visible: true });
        if (await confirmarSolto.count()) await confirmarSolto.first().click();
      }
    } finally {
      this.page.off('dialog', aceitarDialogo);
    }
  }
}
