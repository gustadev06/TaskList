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

| Método | Rota                  | Descrição                                   |
| ------ | --------------------- | ------------------------------------------- |
| GET    | `/`                   | Verifica se a API está no ar                |
| GET    | `/tasks`              | Lista as tarefas                            |
| POST   | `/tasks`              | Cria tarefa — body: `{ "title": "..." }`    |
| PATCH  | `/tasks/:id/complete` | Marca a tarefa como concluída               |

As tarefas ficam só na memória: quando a API é reiniciada, a lista volta a ficar vazia.

## Versão de produção do frontend (opcional)

```bash
cd frontend
pnpm build
node dist/index.js
```

Abra http://localhost:4173 (a API precisa continuar rodando na 3000).
