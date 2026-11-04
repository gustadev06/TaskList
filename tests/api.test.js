// TESTES DE INTEGRAÇÃO
// Sobem a API de verdade numa porta livre e fazem requisições HTTP nas rotas,
// testando Express + rotas + validação + gravação no arquivo JSON juntos.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Usa um arquivo temporário para não mexer no data/tasks.json de verdade
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklist-api-'));
const DATA_FILE = path.join(tmpDir, 'tasks.json');
process.env.DATA_FILE = DATA_FILE;

const { app } = require('../src/server');

let server;
let baseUrl;

// Função de apoio: faz a requisição e já devolve status + corpo
async function api(method, rota, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(baseUrl + rota, options);
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // resposta não é JSON (ex.: "API no ar!")
  }
  return { status: res.status, data };
}

before(async () => {
  // Porta 0 = o sistema escolhe uma porta livre
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('API de tarefas (integração)', () => {
  let tarefaId;

  test('GET / responde que a API está no ar', async () => {
    const res = await api('GET', '/');
    assert.equal(res.status, 200);
    assert.equal(res.data, 'API no ar!');
  });

  test('GET /tasks começa com a lista vazia', async () => {
    const res = await api('GET', '/tasks');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, []);
  });

  test('POST /tasks cria uma tarefa', async () => {
    const res = await api('POST', '/tasks', { title: '  Estudar Docker  ' });
    assert.equal(res.status, 201);
    assert.equal(res.data.title, 'Estudar Docker'); // tira os espaços das pontas
    assert.equal(res.data.done, false);
    assert.equal(typeof res.data.id, 'number');
    tarefaId = res.data.id;
  });

  test('a tarefa criada fica salva no arquivo JSON', () => {
    const salvo = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    assert.equal(salvo.tasks.length, 1);
    assert.equal(salvo.tasks[0].title, 'Estudar Docker');
  });

  test('POST /tasks sem título retorna 400', async () => {
    const res = await api('POST', '/tasks', {});
    assert.equal(res.status, 400);
    assert.ok(res.data.error);
  });

  test('POST /tasks com título muito grande retorna 400', async () => {
    const res = await api('POST', '/tasks', { title: 'a'.repeat(201) });
    assert.equal(res.status, 400);
  });

  test('POST /tasks com JSON inválido retorna 400', async () => {
    const res = await api('POST', '/tasks', '{ isso não é json');
    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'JSON inválido no corpo da requisição');
  });

  test('GET /tasks/:id busca a tarefa', async () => {
    const res = await api('GET', `/tasks/${tarefaId}`);
    assert.equal(res.status, 200);
    assert.equal(res.data.id, tarefaId);
  });

  test('GET /tasks/:id inexistente retorna 404', async () => {
    const res = await api('GET', '/tasks/9999');
    assert.equal(res.status, 404);
    assert.equal(res.data.error, 'tarefa não encontrada');
  });

  test('PATCH /tasks/:id edita o título', async () => {
    const res = await api('PATCH', `/tasks/${tarefaId}`, { title: 'Estudar Docker e CI' });
    assert.equal(res.status, 200);
    assert.equal(res.data.title, 'Estudar Docker e CI');
  });

  test('PATCH /tasks/:id sem campos retorna 400', async () => {
    const res = await api('PATCH', `/tasks/${tarefaId}`, {});
    assert.equal(res.status, 400);
  });

  test('PATCH /tasks/:id com done inválido retorna 400', async () => {
    const res = await api('PATCH', `/tasks/${tarefaId}`, { done: 'sim' });
    assert.equal(res.status, 400);
  });

  test('PATCH /tasks/:id/complete marca como concluída', async () => {
    const res = await api('PATCH', `/tasks/${tarefaId}/complete`);
    assert.equal(res.status, 200);
    assert.equal(res.data.done, true);
  });

  test('DELETE /tasks/:id exclui a tarefa', async () => {
    const res = await api('DELETE', `/tasks/${tarefaId}`);
    assert.equal(res.status, 204);

    const busca = await api('GET', `/tasks/${tarefaId}`);
    assert.equal(busca.status, 404);
  });

  test('rota inexistente retorna 404 em JSON', async () => {
    const res = await api('GET', '/rota-que-nao-existe');
    assert.equal(res.status, 404);
    assert.equal(res.data.error, 'rota não encontrada');
  });
});
