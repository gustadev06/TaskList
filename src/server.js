const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [];
let nextId = 1;

app.get('/', (req, res) => {
  res.send('API no ar!');
});

app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title é obrigatório' });
  }

  const task = { id: nextId, title, done: false };
  tasks.push(task);
  nextId++;

  res.status(201).json(task);
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.patch('/tasks/:id/complete', (req, res) => {
    const id = Number (req.params.id);
    const task = tasks.find((t)=> t.id === id);

    if (!task) {
        return res.status(404).json({erro: 'tarefa não enconrada'});
    }

    task.done = true;
    res.json(task);
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});