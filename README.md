# Banca de Testes E2E & API - LojaQA - Módulo 10

**Turma:** FAP 2026, Prof. Alison Melo  
**Equipe:** preencher nomes  
**Data:** 17/11/2026

## Objetivo

Demonstrar automação do módulo **Lojista: CRUD de Produtos & Teardown** sem fazer do login o foco da banca. O login é usado somente como preparação do ambiente via API, com fixture de trabalhador (uma autenticação por worker).

## O que o projeto testa

| ID | Cenário | Tipo | Resultado esperado |
|---|---|---|---|
| CT-E2E-10-01 | Cadastrar, editar e excluir clicando nos botões da interface | E2E (API validada) | POST 201; estoque 12 → 27; DELETE 200; produto desaparece |
| CT-API-10-01 | Cadastrar, listar, editar e excluir | API | POST 201, GET 200, PUT 200, DELETE 200 |
| CT-API-10-02 | Bloquear exclusão indevida: produto seed, ou cliente sem permissão quando não houver seed | API negativa | 403 e objeto JSON de erro |
| CT-API-10-03 | Tentar cadastrar sem nome | API negativa | 400 e objeto JSON de erro |
| CT-EXT-E2E-01 | Pesquisar Recife na Wikipédia | E2E externo | Página Recife e título correto |
| CT-EXT-API-01 | Consultar CEP em ViaCEP | API externa | 200, JSON com CEP/localidade/UF |

## Instalação

Requisitos: Node.js 20+; Google Chrome/Chromium instalado pelo Playwright.

```bash
npm install
npx playwright install chromium
```

Copie `.env.example` para `.env` e configure `SELLER_EMAIL` e `SELLER_PASSWORD` com a conta *seller* de teste fornecida pelo professor. O exemplo usa a credencial pública de demonstração do arquivo Postman enviado pelo professor. Troque-a caso a turma utilize outra conta. Nunca publique credenciais privadas. **Nunca publique `.env` ou tokens em seu GitHub.**

## Comandos para a apresentação

**Ao vivo 1 - E2E da LojaQA, com navegador:**

```bash
npx playwright test tests/e2e/lojaqa-modulo-10.spec.ts --headed
```

**Ao vivo 2 - API da LojaQA, com status e JSON no terminal:**

```bash
npx playwright test tests/api/lojaqa-api-10.spec.ts
```

**Ao vivo 3 - desafios externos:**

```bash
npx playwright test tests/e2e/externo-e2e.spec.ts --headed
npx playwright test tests/api/externo-api.spec.ts
```

**Relatório HTML, se necessário:**

```bash
npx playwright show-report
```

## Correção de erro 404 no login (v1.1)

O Playwright resolve caminhos que começam com `/` a partir da **raiz do domínio**, ignorando o `/api` do `baseURL`.
Por isso, a chamada antiga `api.post('/login')` enviava `POST https://api-qa-fap2026.onrender.com/login` (404).

Nesta versão, `baseURL` termina com `/` e as chamadas usam caminhos **sem barra inicial**, por exemplo `api.post('login')`. O endereço final fica `https://api-qa-fap2026.onrender.com/api/login`.

Se já configurou `.env`, confirme:

```env
API_BASE_URL=https://api-qa-fap2026.onrender.com/api
SELLER_EMAIL=lojista@system.com
SELLER_PASSWORD=SellerPass123
```

Rode novamente:

```powershell
npx playwright test tests/api/lojaqa-api-10.spec.ts
npx playwright test tests/e2e/lojaqa-modulo-10.spec.ts --headed
```

O erro 404 por rota incorreta está corrigido, mas isso **não comprova** que o servidor esteja online ou que os testes de negócio passem. Se aparecer 401, confirme as credenciais do lojista; se ocorrer timeout, confira conectividade e disponibilidade da API.

## Correção do CT-API-10-02 e do CT-E2E-10-01 (v1.2)

### Teste de segurança 403

O catálogo da API pode não conter mais os produtos seed nomeados no contrato (`Teclado Mecânico Aurora`, `Mouse Óptico Atlas`, `Headset Nexo`).
A versão anterior falhava em `toBeDefined()` antes de chamar DELETE.

Na nova versão, a automação procura esses nomes na listagem do lojista e no catálogo público. Se algum deles existir, tenta sua exclusão e verifica `403`. **Se nenhum existir**, cria um produto temporário com a conta de lojista, faz autenticação de cliente e tenta excluí-lo com o token sem permissão. Espera `403`, confirma que o produto permanece e faz teardown autenticado como lojista. Esse caminho alternativo **não comprova a trava específica de seed**, mas comprova proteção de autorização para DELETE.

O teste não tenta excluir produtos arbitrários do catálogo.

### Teste E2E

O HTML oficial do painel possui `#newProductButton`, `#productForm`, `#productName`, `#productCategory`, `#productPrice`, `#productStock` e `#productDescription`. O Page Object agora usa esses IDs e aguarda a visibilidade do formulário após o clique. Mensagens adicionais avisam sobre fechamento da aba, desconexão do navegador e erros JS.

O erro `Target page, context or browser has been closed` **não comprova que o seletor esteja errado**; pode acontecer se a janela for fechada manualmente ou se o navegador encerrar inesperadamente. Ao executar com `--headed`, não feche a janela aberta pelo Playwright enquanto estiver preenchendo ou validando o produto. Se voltar a falhar, execute:

```bash
npx playwright test tests/e2e/lojaqa-modulo-10.spec.ts --headed --debug
```

Inspecione também o arquivo `trace.zip` indicado no terminal. Os testes não foram executados contra o servidor real nesta etapa de correção; os resultados em seu console continuam sendo a referência para aprovação da banca.

## Arquitetura

```
lojaqa-automacao-banca/
├── pages/Modulo10Page.ts
├── fixtures/auth.fixture.ts
├── tests/e2e/lojaqa-modulo-10.spec.ts
├── tests/e2e/externo-e2e.spec.ts
├── tests/api/lojaqa-api-10.spec.ts
├── tests/api/externo-api.spec.ts
├── presentation/apresentacao-slides.pdf
├── presentation/apresentacao-slides.pptx
├── presentation/roteiro-fala.md
├── playwright.config.ts
├── package.json
└── README.md
```

## Boas práticas e cuidados

- **POM:** os métodos da classe `Modulo10Page` apenas interagem com a página; as asserções (`expect`) ficam nos arquivos `.spec.ts`.
- **Fixture:** a autenticação via `POST /login` prepara uma sessão seller; não é um caso de teste de login.
- **Limpeza:** os produtos recebem nomes únicos; a automação tenta excluí-los no `finally`, inclusive em casos de falha.
- **Segurança:** o teste 403 tenta um produto seed conhecido e, se não existir, utiliza um produto temporário criado pelo próprio teste para verificar acesso indevido. Não usa produtos de terceiros.
- **Sem pausas arbitrárias:** Playwright aguarda seletores e asserções automaticamente.
- **Separação:** testes de API validam endpoints, status, headers e JSON; testes E2E interagem com o navegador.
- **Nuvem vs. local:** o frontend oficial `painel.js` aponta diretamente para a API em nuvem. Se configurar `API_BASE_URL` para localhost, o teste E2E ainda acessará a nuvem pela interface; não misture ambientes no mesmo cenário.
- **Rate limit:** o login tem limite documentado de 5 tentativas por IP a cada 15 minutos. O projeto roda com 1 worker e autentica uma vez por worker; evite rodar muitos processos simultâneos.
- **Erros externos:** Wikipédia e ViaCEP exigem internet e podem mudar interface, ficar indisponíveis ou ter limitações temporárias.

## Fontes de validação

1. Arquivo enviado `APILOJAQA.YAML`, contrato OpenAPI 3.0.3.
2. Arquivo enviado `LojaQA.postman_collection.json` e ambientes Postman.
3. Repositório oficial do professor: https://github.com/alisonmelo/tioalison-pe-t4-fap26
4. Painel oficial: https://github.com/alisonmelo/tioalison-pe-t4-fap26/blob/main/projetos-base/01-sistema-login/painel.html
5. Código oficial do painel: https://raw.githubusercontent.com/alisonmelo/tioalison-pe-t4-fap26/main/projetos-base/01-sistema-login/painel.js

## Antes da banca

- Instale dependências e navegador.
- Execute os testes individualmente antes da apresentação.
- Garanta que a rede esteja estável; Render pode iniciar lentamente.
- Confira que nenhum produto temporário foi deixado na loja.
- Grave prints reais após obter sucesso, se necessário; não apresente simulações como resultados medidos.
- Atualize os nomes da equipe e o link de seu GitHub nos slides.

**Importante:** esta entrega é uma base de automação construída a partir do contrato e do código frontend público; não foi possível executar os testes contra os serviços online neste ambiente de elaboração. Logo, os resultados são **esperados**, não execuções comprovadas.

## Ajuste v4 — cadastro e exclusão clicando na interface

O teste E2E `tests/e2e/lojaqa-modulo-10.spec.ts` agora **clica de fato** em
**Cadastrar Produto**, **Editar** e **Excluir**, como nas capturas fornecidas.
A API é usada só para verificar o resultado e para limpeza de emergência se houver falha.
A exclusão normal **não** usa `request.delete`: ela acontece ao clicar no botão vermelho
**Excluir** do card do produto criado pelo próprio teste.

O painel indicado nas capturas mostra o botão **Excluir**, mas o código público
anterior em `.../01-sistema-login/painel.html` possui uma versão sem esse botão.
Se o teste informar que o botão não existe, configure no `.env` o endereço da versão
correta em `LOJAQA_PANEL_URL`, aquela que você usou nas capturas.

Para demonstrar em tela:

```powershell
npx playwright test tests/e2e/lojaqa-modulo-10.spec.ts --headed
```
