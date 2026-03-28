'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JSON_LIMIT = process.env.JSON_BODY_LIMIT || '100kb';

const DATA_FILE = process.env.DATA_FILE
  ? path.isAbsolute(process.env.DATA_FILE)
    ? process.env.DATA_FILE
    : path.join(__dirname, process.env.DATA_FILE)
  : path.join(__dirname, 'data', 'usuarios.json');
const DATA_DIR = path.dirname(DATA_FILE);

app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.static(__dirname));

function emailValidoBasico(valor) {
  if (!valor || typeof valor !== 'string') return false;
  const t = valor.trim();
 
  if (!t.includes('@')) return false;
  const [local, ...rest] = t.split('@');
  const domain = rest.join('@');
 
  if (!local || !domain) return false;
  return domain.includes('.');
}

function cpfSoDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function cpfValidoOuVazio(valor) {
  const d = cpfSoDigitos(valor);
 
  if (d.length === 0) return true;
 
  return d.length === 11;
}

function validarUsuarioBody(body) {
  const nome = body && typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = body && typeof body.email === 'string' ? body.email.trim() : '';
  const cpf = body && typeof body.cpf === 'string' ? body.cpf.trim() : '';
 
  if (!nome) return { error: 'Preencha o nome.' };
  if (!email) return { error: 'Preencha o e-mail.' };
 
  if (!emailValidoBasico(email)) {
    return { error: 'Informe um e-mail válido (deve conter "@" e "." no domínio).' };
  }
 
  if (!cpfValidoOuVazio(cpf)) {
    return { error: 'CPF deve ter 11 dígitos ou ficar em branco.' };
  }
 
  return { nome, email, cpf };
}

async function readUsers() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
 
    return Array.isArray(data.users) ? data.users : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
 
    throw e;
  }
}

async function writeUsers(users) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await readUsers();
 
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao ler dados.' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const v = validarUsuarioBody(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
 
  try {
    const users = await readUsers();
    const user = { id: novoId(), nome: v.nome, email: v.email, cpf: v.cpf };
    users.push(user);
    await writeUsers(users);
 
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar.' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const v = validarUsuarioBody(req.body);
 
  if (v.error) return res.status(400).json({ error: v.error });
  const { id } = req.params;
 
  try {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado.' });
    users[idx] = { id, nome: v.nome, email: v.email, cpf: v.cpf };
    await writeUsers(users);
 
    res.json(users[idx]);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
 
  try {
    const users = await readUsers();
    const next = users.filter((u) => u.id !== id);
 
    if (next.length === users.length) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
 
    await writeUsers(next);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir.' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
  console.log('Abra index.html pelo navegador nesse endereço.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error(`Erro: a porta ${PORT} já está em uso (servidor Node antigo ou outro programa).`);
    console.error('');
    console.error('Opções:');
    console.error(`  • Subir em outra porta (PowerShell):  $env:PORT=3001; npm start`);
    console.error(`  • Ver qual processo usa a porta ${PORT}:`);
    console.error(`      netstat -ano | findstr :${PORT}`);
    console.error('    Depois encerre (substitua PID pelo número da última coluna):');
    console.error('      taskkill /PID <PID> /F');
    console.error('');
    process.exit(1);
  }
 
  throw err;
});
