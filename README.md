# 👤 Sistema de Gerenciamento de Usuários

Aplicação web para **cadastrar, listar, editar e excluir** usuários. Inclui tela de login e painel de gerenciamento com validação client-side e server-side. O **servidor Node.js (Express)** expõe uma API REST e persiste os dados em JSON.

## 📁 Estrutura do Projeto

```
user-management-system/
├── server.js              # Servidor Express + API REST
├── package.json           # Dependências e scripts
├── .env                   # Variáveis de ambiente (porta, arquivo de dados)
├── .env.example           # Template de configuração
├── .gitignore             # Arquivos ignorados pelo Git
│
├── index.html             # Página de login
├── cadastro.html          # Painel de gerenciamento (CRUD)
│
├── css/
│   └── main.css           # Estilos da aplicação (tema escuro)
│
├── js/
│   └── controller.js      # Lógica client-side (validação, API, máscara de CPF)
│
├── data/
│   └── usuarios.json      # Arquivo de persistência (gerado automaticamente)
│
└── README.md              # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** 18+
- **npm** (incluído no Node.js)

### Instalação e Inicialização

Na pasta do projeto:

```bash
npm install
npm start
```

Abra no navegador: **http://localhost:3000**

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

## 📡 API REST

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|----------|
| `GET` | `/api/usuarios` | Lista todos os usuários |
| `GET` | `/api/usuarios/:id` | Obtém um usuário específico |
| `POST` | `/api/usuarios` | Cria um novo usuário |
| `PUT` | `/api/usuarios/:id` | Atualiza um usuário |
| `DELETE` | `/api/usuarios/:id` | Remove um usuário |

### Payloads

**POST/PUT - Criar ou Atualizar Usuário:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "123.456.789-00"
}
```

**GET - Resposta (Lista):**
```json
{
  "users": [
    {
      "id": "1712268000000-abc1234",
      "nome": "João Silva",
      "email": "joao@email.com",
      "cpf": "12345678900"
    }
  ]
}
```

## ✨ Funcionalidades

- **🔐 Login**: Validação de e-mail e senha no cliente; redireciona para o painel de gerenciamento
- **➕ Cadastro**: Formulário validado com campos de nome, e-mail e CPF (opcional)
- **✏️ Edição**: Atualizar dados de usuários já cadastrados via API
- **🗑️ Exclusão**: Remover usuários da base de dados com confirmação
- **📋 Listagem**: Tabela dinâmica de todos os usuários cadastrados
- **🔒 Validação Dupla**: Client-side (user experience) e server-side (segurança)
- **📝 Máscara de CPF**: Formatação automática `###.###.###-##` no formulário
- **💾 Persistência**: Dados salvos permanentemente em arquivo JSON no servidor
- **🎨 Interface Moderna**: Design responsivo com tema escuro

## 🛠️ Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos responsivos com tema escuro (variáveis CSS)
- **JavaScript Vanilla** - Lógica client-side sem dependências

### Backend
- **Node.js** - Runtime JavaScript server-side
- **Express.js** - Framework web minimalista
- **dotenv** - Gerenciamento de variáveis de ambiente
- **fs/promises** - Operações assíncronas de arquivo

## 🔍 Validação

### E-mail
- Obrigatório
- Deve conter `@` e domínio com ponto (ex: `user@domain.com`)

### CPF
- Opcional
- Se preenchido: deve ter exatamente 11 dígitos
- Aceita com ou sem formatação (será normalizado no servidor)

### Nome
- Obrigatório
- Mínimo 1 caractere

## 📂 Persistência

Os dados são armazenados em `data/usuarios.json` com a seguinte estrutura:

```json
{
  "users": [
    {
      "id": "timestamp-random",
      "nome": "João Silva",
      "email": "joao@email.com",
      "cpf": "12345678900"
    }
  ]
}
```

- Arquivo é criado automaticamente se não existir
- Cada usuário recebe um ID único baseado em timestamp + string aleatória
- CPF é normalizado para apenas dígitos no servidor

## 🔐 Segurança

- ✅ Validação de entrada (client e server)
- ✅ Escape de HTML para prevenir XSS
- ✅ Uso de `fs/promises` para operações seguras de arquivo
- ⚠️ **Nota:** Este é um projeto educacional. Para produção, implemente:
  - Autenticação real (JWT/OAuth)
  - Banco de dados relacional (PostgreSQL, MongoDB)
  - Rate limiting
  - HTTPS
  - Criptografia de senhas
