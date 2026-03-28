# login-cad

Aplicação web para **cadastrar, listar, editar e excluir** usuários (nome, CPF opcional e e-mail). A tela de login valida e-mail e senha e redireciona para o cadastro. O **servidor Node (Express)** expõe a API e grava os dados em `data/usuarios.json`.

## Estrutura

```
login-cad/
├── server.js           # Servidor Express + API REST
├── package.json
├── index.html          # Login
├── cadastro.html       # Cadastro e tabela
├── data/
│   └── usuarios.json   # Persistência (gerado/atualizado pelo servidor)
├── css/
│   └── main.css
├── js/
│   └── controller.js   # Cliente: validação, chamadas à API, máscara de CPF
└── README.md
```

## Como executar (Node)

Na pasta do projeto:

```bash
npm install
npm start
```

Abra no navegador: **http://localhost:3000** (use esse endereço para que `/api/usuarios` funcione).

### PowerShell no Windows: “execução de scripts foi desabilitada”

O comando `npm` usa `npm.ps1`; se a política do PowerShell bloquear scripts, use o launcher `.cmd` (não é script):

```powershell
npm.cmd install
npm.cmd start
```

Ou abra o **Prompt de Comando** (`cmd.exe`) e use `npm install` / `npm start` normalmente.

Para liberar scripts só para seu usuário (opcional):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Porta alternativa:

```bash
set PORT=4000
npm start
```

(No PowerShell: `$env:PORT=4000; npm start`.)

### Erro `EADDRINUSE` / “address already in use :::3000”

A porta **3000** já está ocupada (muitas vezes por uma instância antiga do `node server.js`).

**Opção A — usar outra porta:**

```powershell
$env:PORT=3001; npm start
```

Depois abra **http://localhost:3001**.

**Opção B — liberar a porta 3000** (Prompt ou PowerShell):

```text
netstat -ano | findstr :3000
```

Anote o **PID** (última coluna) da linha `LISTENING` e encerre:

```text
taskkill /PID <número_do_PID> /F
```

## API

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/api/usuarios` | Lista `{ users: [{ id, nome, email, cpf }] }` |
| `POST` | `/api/usuarios` | Cria usuário (JSON: `nome`, `email`, `cpf`) |
| `PUT` | `/api/usuarios/:id` | Atualiza |
| `DELETE` | `/api/usuarios/:id` | Remove |

## Funcionalidades

- **Login:** validação client-side; redireciona para `cadastro.html`.
- **Cadastro / edição / exclusão:** via API; validação também no servidor.
- **CPF:** máscara `###.###.###-##` no formulário.
- **Persistência:** arquivo JSON no servidor (não usa mais `sessionStorage` para a lista).

## Tecnologias

HTML, CSS, JavaScript no cliente; **Node.js** e **Express** no servidor.
