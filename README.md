# TaskList

Gerenciador de tarefas com API em Node.js/Express e frontend em React (Vite).

```
TaskList/
├── src/server.js   → API (porta 3000)
└── frontend/       → interface web (porta 5173)
```

## Pré-requisitos

- Node.js 20 ou maior
- pnpm: `npm install -g pnpm`

## 1. Instalar tudo (só na primeira vez)

Na pasta `TaskList`:

```bash
npm run setup
```

## 2. Rodar a API (terminal 1)

```bash
npm start
```

Deve aparecer `Servidor rodando na porta 3000`. Teste em http://localhost:3000/tasks

> Durante o desenvolvimento, `npm run dev` reinicia a API sozinho quando você salva o arquivo.

## 3. Rodar o frontend (terminal 2)

```bash
npm run front
```

Abra http://localhost:5173

## Rotas da API

| Método | Rota                  | Descrição                                                        |
| ------ | --------------------- | ---------------------------------------------------------------- |
| GET    | `/`                   | Verifica se a API está no ar                                     |
| GET    | `/tasks`              | Lista as tarefas                                                 |
| GET    | `/tasks/:id`          | Busca uma tarefa                                                 |
| POST   | `/tasks`              | Cria tarefa — body: `{ "title": "..." }`                         |
| PATCH  | `/tasks/:id`          | Edita a tarefa — body: `{ "title": "...", "done": true/false }` |
| PATCH  | `/tasks/:id/complete` | Marca a tarefa como concluída                                    |
| DELETE | `/tasks/:id`          | Exclui a tarefa                                                  |

O `title` precisa ser um texto não vazio de até 200 caracteres. Os erros sempre voltam
em JSON no formato `{ "error": "mensagem" }`.

As tarefas ficam salvas em `data/tasks.json`, então continuam lá quando a API reinicia.

### Variáveis de ambiente

| Variável    | Padrão            | Descrição                         |
| ----------- | ----------------- | --------------------------------- |
| `PORT`      | `3000`            | Porta da API                      |
| `DATA_FILE` | `data/tasks.json` | Arquivo onde as tarefas são salvas |

## Versão de produção do frontend (opcional)

```bash
cd frontend
pnpm build
node dist/index.js
```

Abra http://localhost:4173 (a API precisa continuar rodando na 3000).

## Testes

```bash
npm test
```

Usa o test runner nativo do Node (`node:test`), sem biblioteca extra. Os testes usam um
arquivo temporário, então não mexem no `data/tasks.json`.

| Tipo        | Arquivo                    | O que testa                                                          |
| ----------- | -------------------------- | -------------------------------------------------------------------- |
| Unitário    | `tests/validacao.test.js`  | A função `validateTitle` isolada (título vazio, só espaços, limite)  |
| Integração  | `tests/api.test.js`        | Sobe a API numa porta livre e testa todas as rotas via HTTP          |

## Docker

```bash
docker build -t tasklist-api .
docker run --rm -p 3000:3000 tasklist-api
```

A API sobe em http://localhost:3000 dentro do container.

## Pipeline de CI (GitHub Actions)

Arquivo: `.github/workflows/tasklist.yml`. Roda a cada push na `main` ou `develop`:

1. **Testes**: instala as dependências e roda `npm test`
2. **Build e publicação**: só se os testes passarem, builda a imagem e publica no Docker Hub
   com as tags `latest` e o hash do commit

Em pull request para a `main` roda só os testes. Também dá pra rodar manualmente pela aba Actions.

Configuração necessária no GitHub (Settings → Secrets and variables → Actions):

| Tipo     | Nome                 | Valor                                  |
| -------- | -------------------- | -------------------------------------- |
| Variable | `DOCKERHUB_USERNAME` | Seu usuário do Docker Hub              |
| Secret   | `DOCKERHUB_TOKEN`    | Token de acesso gerado no Docker Hub   |
