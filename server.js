'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs/promises'); // Usando fs/promises para operações assíncronas de arquivo

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JSON_LIMIT = process.env.JSON_BODY_LIMIT || '100kb';

// Define o caminho do arquivo de dados. Prioriza a variável de ambiente DATA_FILE,
// caso contrário, usa 'data/usuarios.json' na raiz do projeto.
const DATA_FILE = process.env.DATA_FILE
  ? path.isAbsolute(process.env.DATA_FILE)
    ? process.env.DATA_FILE
    : path.join(__dirname, process.env.DATA_FILE)
  : path.join(__dirname, 'data', 'usuarios.json');
const DATA_DIR = path.dirname(DATA_FILE); // Diretório onde o arquivo de dados será salvo

// Middleware para parsear JSON no corpo das requisições.
// O Express já possui seu próprio parser de JSON, substituindo o body-parser para JSON.
app.use(express.json({ limit: JSON_LIMIT }));
// Middleware para servir arquivos estáticos.
// Assumimos que seus arquivos HTML, CSS e JS estão na pasta 'public'.
// Se estiverem na raiz do projeto, use `app.use(express.static(__dirname));`
app.use(express.static(path.join(__dirname, 'public')));

// --- Funções de Validação e Persistência (adaptadas do seu controller.js e do server.js anterior) ---

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

  // Uma validação mais robusta de CPF exigiria um algoritmo específico,
  // mas para este exemplo, verificamos apenas o comprimento.
  return d.length === 11;
}

function validarUsuarioBody(body) {
  const nome = body && typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = body && typeof body.email === 'string' ? body.email.trim() : '';
  const cpf = body && typeof body.cpf === 'string' ? cpfSoDigitos(body.cpf.trim()) : ''; // Garante que o CPF seja apenas dígitos

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
    if (e.code === 'ENOENT') {
      // Se o arquivo não existe, retorna um array vazio
      return [];
    }
    throw e;
  }
}

async function writeUsers(users) {
  await fs.mkdir(DATA_DIR, { recursive: true }); // Garante que o diretório exista
  await fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Rotas da API RESTful ---

// GET /api/usuarios: Retorna todos os usuários
app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await readUsers();
    res.json({ users });
  } catch (e) {
    console.error('Erro ao ler usuários:', e);
    res.status(500).json({ error: 'Erro ao ler dados.' });
  }
});

// GET /api/usuarios/:id: Retorna um usuário específico por ID
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (e) {
    console.error('Erro ao buscar usuário:', e);
    res.status(500).json({ error: 'Erro ao ler dados.' });
  }
});

// POST /api/usuarios: Cria um novo usuário
app.post('/api/usuarios', async (req, res) => {
  const v = validarUsuarioBody(req.body);
  if (v.error) {
    return res.status(400).json({ error: v.error });
  }

  try {
    const users = await readUsers();
    const newUser = { id: novoId(), nome: v.nome, email: v.email, cpf: v.cpf };
    users.push(newUser);
    await writeUsers(users);

    res.status(201).json(newUser); // Retorna o usuário criado com status 201 Created
  } catch (e) {
    console.error('Erro ao criar usuário:', e);
    res.status(500).json({ error: 'Erro ao salvar.' });
  }
});

// PUT /api/usuarios/:id: Atualiza um usuário existente
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const v = validarUsuarioBody(req.body);

  if (v.error) {
    return res.status(400).json({ error: v.error });
  }

  try {
    let users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex !== -1) {
      users[userIndex] = { id, nome: v.nome, email: v.email, cpf: v.cpf };
      await writeUsers(users);
      res.json(users[userIndex]); // Retorna o usuário atualizado
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (e) {
    console.error('Erro ao atualizar usuário:', e);
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
});

// DELETE /api/usuarios/:id: Exclui um usuário
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let users = await readUsers();
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);

    if (users.length < initialLength) {
      await writeUsers(users);
      res.status(204).send(); // Retorna 204 No Content para exclusão bem-sucedida
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (e) {
    console.error('Erro ao excluir usuário:', e);
    res.status(500).json({ error: 'Erro ao excluir.' });
  }
});

// Rota para a página inicial (login)
// Esta rota serve o arquivo 'index.html' da pasta 'public' quando a raiz é acessada.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Abra http://localhost:${PORT} pelo navegador.`);
});

// Tratamento de erro para porta já em uso
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