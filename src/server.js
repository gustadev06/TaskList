const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'tasks.json');
const MAX_TITLE_LENGTH = 200;

app.use(express.json());
app.use(cors());

// As tarefas ficam salvas em um arquivo JSON para não sumirem quando a API reinicia
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { nextId: 1, tasks: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ nextId, tasks }, null, 2));
}

let { nextId, tasks } = loadData();

function validateTitle(title) {
  if (typeof title !== 'string' || !title.trim()) {
    return 'title é obrigatório e deve ser um texto';
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return `title deve ter no máximo ${MAX_TITLE_LENGTH} caracteres`;
  }
  return null;
}

function findTask(req, res) {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    res.status(404).json({ error: 'tarefa não encontrada' });
  }
  return task;
}

app.get('/', (req, res) => {
  res.send('API no ar!');
});

app.post('/tasks', (req, res) => {
  const { title } = req.body ?? {};
  const titleError = validateTitle(title);

  if (titleError) {
    return res.status(400).json({ error: titleError });
  }

  const task = { id: nextId, title: title.trim(), done: false };
  tasks.push(task);
  nextId++;
  saveData();

  res.status(201).json(task);
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;

  res.json(task);
});

app.patch('/tasks/:id', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;

  const { title, done } = req.body ?? {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'envie title e/ou done para atualizar' });
  }

  if (title !== undefined) {
    const titleError = validateTitle(title);
    if (titleError) {
      return res.status(400).json({ error: titleError });
    }
  }

  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done deve ser true ou false' });
  }

  if (title !== undefined) task.title = title.trim();
  if (done !== undefined) task.done = done;
  saveData();

  res.json(task);
});

app.patch('/tasks/:id/complete', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;

  task.done = true;
  saveData();

  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;

  tasks = tasks.filter((t) => t.id !== task.id);
  saveData();

  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'rota não encontrada' });
});

// Garante que qualquer erro volte como JSON, sem expor detalhes do servidor
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }

  console.error(err);
  res.status(500).json({ error: 'erro interno do servidor' });
});

// Só sobe o servidor quando o arquivo é executado direto (node src/server.js).
// Nos testes o arquivo é importado com require() e o servidor não sobe sozinho.
if (require.main === module) {
  // No Express 5, se a porta não puder ser usada o erro chega aqui no callback
  app.listen(PORT, (err) => {
    if (err) {
      if (err.code === 'EADDRINUSE') {
        console.error(`A porta ${PORT} já está em uso. Feche o outro processo ou use outra porta (PORT=3001).`);
      } else {
        console.error('Não foi possível iniciar o servidor:', err);
      }
      process.exit(1);
    }

    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = { app, validateTitle, MAX_TITLE_LENGTH };
