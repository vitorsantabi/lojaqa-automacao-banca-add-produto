# Roteiro da banca - 10 a 12 minutos

**Equipe:** preencher integrantes e dividir as falas.

**00:00-01:00 — Slide 1.** Apresentar o módulo 10. Explicar que o foco é o CRUD de produtos do lojista, não o login.

**01:00-02:10 — Slide 2.** O fluxo importa porque um produto com estoque errado causa vendas que não podem ser atendidas. Excluir um item oficial também impacta o catálogo e dados vinculados.

**02:10-03:00 — Slide 3.** Explicar os seis CTs: UI, API CRUD, bloqueio 403, validação 400 e os dois testes externos.

**03:00-04:00 — Slide 4.** Mostrar Page Object sem `expect`, fixture de autenticação de preparo, `spec.ts` com assertivas e `finally` para limpeza.

**04:00-06:30 — E2E em tela.** Rodar `npx playwright test tests/e2e/lojaqa-modulo-10.spec.ts --headed`. Destacar que o robô cria e atualiza o estoque, que passa de 12 para 27.

**06:30-08:30 — API no terminal.** Rodar `npx playwright test tests/api/lojaqa-api-10.spec.ts`. Explicar POST 201, GET 200, PUT 200, DELETE 200, a trava 403 e o negativo 400. Mostrar os logs JSON.

**08:30-09:50 — CTs externos.** Rodar `npx playwright test tests/e2e/externo-e2e.spec.ts --headed` e `npx playwright test tests/api/externo-api.spec.ts`.

**09:50-11:20 — Slides 5 e 6.** Reforçar que UI e API validam camadas diferentes; que a exclusão é pedagogicamente permitida, mas o soft delete costuma ser preferível para dados de produção. Mostrar URL do GitHub após publicar.

**11:20-12:00 — Perguntas.** Preparar resposta para: por que usar fixture? O que é teardown? O que significa status 403? Por que Page Object não contém asserts? O que muda com soft delete?
