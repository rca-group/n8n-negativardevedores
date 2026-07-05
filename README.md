# n8n-nodes-negativardevedores

Este é um community node para o [n8n](https://n8n.io). Ele permite integrar seus workflows n8n com a **API de Negativação da RedeCredAuto** ([negativardevedores.com.br](https://api.negativardevedores.com.br)), automatizando a inclusão, consulta, listagem e exclusão de dívidas negativadas.

> ⚠️ **É necessário ter um contrato ativo com a RedeCredAuto para utilizar este node.** O token de autenticação Bearer (produção e homologação) é fornecido pela RedeCredAuto após a contratação. Sem contrato, os endpoints não retornam dados.

[Instalação](#instalação)
[Operações](#operações)
[Credenciais](#credenciais)
[Ambientes](#ambientes)
[Compatibilidade](#compatibilidade)
[Uso](#uso)
[Recursos](#recursos)

## Instalação

Siga o [guia de instalação](https://docs.n8n.io/integrations/community-nodes/installation/) de community nodes da documentação do n8n.

**Via interface do n8n (self-hosted):**

1. Vá em **Settings > Community Nodes**.
2. Clique em **Install**.
3. Informe `n8n-nodes-negativardevedores` em **npm package name**.
4. Aceite os riscos de usar código de terceiros e clique em **Install**.

**Via npm (manual):**

```bash
npm install n8n-nodes-negativardevedores
```

## Operações

O node expõe dois recursos:

### Negativação

| Operação      | Método HTTP | Endpoint      | Descrição |
| ------------- | ----------- | ------------- | --------- |
| **Inclusão**  | `POST`      | `/inclusao`   | Envia uma solicitação de inclusão de dívida (devedor, dívida, endereço, dados bancários e webhook). |
| **Consulta**  | `GET`       | `/consulta`   | Consulta os detalhes de uma operação pelo número de protocolo. |
| **Listagem**  | `GET`       | `/listagem`   | Lista operações filtrando por documento, contrato, protocolo/operação ou intervalo de datas. |
| **Exclusão**  | `DELETE`    | `/exclusao`   | Registra a exclusão de uma inclusão já processada (por `id`). |

### Autenticação

| Operação          | Método HTTP | Endpoint      | Descrição |
| ----------------- | ----------- | ------------- | --------- |
| **Testar Token**  | `GET`       | `/auth-test`  | Valida o token Bearer e retorna o código do cliente associado. |

### Trigger (Webhook)

O pacote também inclui o node **RedeCredAuto Trigger**, que expõe uma URL de webhook para **receber** as notificações de mudança de status enviadas pela API.

1. Adicione o node **RedeCredAuto Trigger** ao workflow.
2. Copie a **Production URL** exibida no node.
3. Use essa URL no campo `webhook_url` da operação **Inclusão** (ou informe-a no cadastro junto à RedeCredAuto).
4. A cada atualização de status, a API faz um `POST` na URL e o workflow é disparado com o corpo recebido.

Opções do Trigger:

- **Filtrar por Situação** — dispara o workflow apenas para as situações selecionadas (`pendente`, `processando`, `processado`, `inconsistencia`, `erro`, `desconhecido`). Vazio = todas.
- **Token de Verificação** — se preenchido, o node só aceita requisições que enviem o mesmo valor no header `X-Webhook-Token` (ou na query `token`); caso contrário responde `401`.

## Credenciais

Para usar o node é preciso configurar a credencial **RedeCredAuto API**:

1. **Pré-requisito:** possuir contrato com a RedeCredAuto e ter recebido o token Bearer.
2. No n8n, crie uma credencial do tipo **RedeCredAuto API**.
3. Preencha:
   - **Ambiente** — `Produção` ou `Homologação (UAT)`.
   - **Token** — o token Bearer fornecido pela RedeCredAuto para o ambiente escolhido.
4. Clique em **Test** para validar (chama `/auth-test`; retorna `Token válido` e o código do cliente).

A autenticação é feita via header `Authorization: Bearer <token>`.

## Ambientes

A credencial define o prefixo da URL automaticamente:

| Ambiente            | URL base |
| ------------------- | -------- |
| Produção            | `https://api.negativardevedores.com.br/prod` |
| Homologação (UAT)   | `https://api.negativardevedores.com.br/uat` |

No ambiente de **homologação**, use combinações fixas de contrato/documento para simular os retornos:

| Retorno                         | Documento     | Contrato           |
| ------------------------------- | ------------- | ------------------ |
| Inclusão registrada (201)       | `11111111111` | `0000000000123456` |
| Registro em processamento (409) | `33333333333` | `0000000000161718` |
| Inconsistência (422)            | `22222222222` | `0000000000789101` |
| Erro interno (500)              | qualquer outra combinação | — |

Para a operação de **Exclusão** em homologação, use `id = 1001` para obter o retorno de sucesso.

## Compatibilidade

- Requer n8n com `n8nNodesApiVersion: 1`.
- Testado com n8n `>= 1.x`.
- Node.js `>= 18.10`.

## Uso

### Exemplo — Inclusão de dívida

1. Adicione o node **RedeCredAuto**.
2. Recurso: **Negativação** · Operação: **Inclusão**.
3. Preencha os campos obrigatórios: Data de Vencimento, Data de Término, Valor, Contrato, Natureza, Nome e Documento do devedor.
4. (Opcional) Expanda **Endereço**, **Dados Bancários** e **Campos Adicionais** (email, celular, área informante, webhook URL).
5. Execute. A resposta inclui `status`, `mensagem` e `id_protocolo`.

> **Natureza "DC" (Desconto de Cheques):** os **Dados Bancários** passam a ser obrigatórios. O node valida isso e retorna erro antes de chamar a API.

### Exemplo — Consulta por protocolo

- Recurso **Negativação** · Operação **Consulta** · informe o **Protocolo**.
- Retorna a operação, situação (`pendente`, `processado`, `inconsistencia`, `processando`, `desconhecido`), inconsistências e logs.

### Códigos de status retornados pela API

| Código | Significado |
| ------ | ----------- |
| 200 / 201 | Sucesso |
| 400 | Requisição inválida (ex.: nenhum filtro na listagem) |
| 401 | Token não fornecido ou inválido |
| 404 | Registro não encontrado |
| 409 | Já existe registro em processamento |
| 422 | Inconsistência ao negativar o cliente |
| 500 | Erro ao processar |

Use a opção **Continue On Fail** do node para tratar respostas de erro dentro do próprio workflow.

## Recursos

- [Documentação de community nodes do n8n](https://docs.n8n.io/integrations/#community-nodes)
- [API RedeCredAuto](https://api.negativardevedores.com.br)
- Suporte: `suporte@redecredauto.com.br`

## Licença

[MIT](LICENSE.md)
