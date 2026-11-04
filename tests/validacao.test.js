// TESTES UNITÁRIOS
// Testam uma função isolada (validateTitle), sem subir servidor e sem HTTP.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Usa um arquivo temporário para não mexer no data/tasks.json de verdade
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklist-unit-'));
process.env.DATA_FILE = path.join(tmpDir, 'tasks.json');

const { validateTitle, MAX_TITLE_LENGTH } = require('../src/server');

describe('validateTitle (unitário)', () => {
  test('aceita um título válido', () => {
    assert.equal(validateTitle('Estudar Docker'), null);
  });

  test('aceita título com exatamente o limite de caracteres', () => {
    assert.equal(validateTitle('a'.repeat(MAX_TITLE_LENGTH)), null);
  });

  test('recusa título vazio', () => {
    assert.match(validateTitle(''), /obrigatório/);
  });

  test('recusa título só com espaços', () => {
    assert.match(validateTitle('   '), /obrigatório/);
  });

  test('recusa título que não é texto', () => {
    assert.match(validateTitle(123), /obrigatório/);
    assert.match(validateTitle(undefined), /obrigatório/);
    assert.match(validateTitle(null), /obrigatório/);
  });

  test('recusa título maior que o limite', () => {
    assert.match(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1)), /no máximo/);
  });
});
