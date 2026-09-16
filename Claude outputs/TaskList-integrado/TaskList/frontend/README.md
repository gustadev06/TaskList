# Front-end

Interface web do TaskList (React + Vite).

Consome a API em `http://localhost:3000` (pasta raiz do projeto):
- POST /tasks — cria tarefa (body: { "title": "..." })
- GET /tasks — lista tarefas
- PATCH /tasks/:id/complete — marca tarefa como concluída

Se a API estiver em outro endereço, altere em **Configurações → URL da API** dentro do app.

Como rodar: veja o `README.md` na raiz do projeto.
