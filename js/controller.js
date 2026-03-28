let usuarios = [];
let indiceEmEdicao = null;

const validarEmailBasico = (valor) => {
  if (!valor || typeof valor !== 'string') return false;
  const texto = valor.trim();

  if (texto.indexOf('@') === -1) return false;
  const parteLocal = texto.split('@')[0];
  const dominio = texto.split('@').slice(1).join('@');

  if (!parteLocal || !dominio) return false;
  return dominio.indexOf('.') !== -1;
};

const acessar = () => {
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');

  const email = campoEmail ? campoEmail.value.trim() : '';
  const senha = campoSenha ? campoSenha.value : '';

  if (!email) {
    alert('Preencha o e-mail.');
    return;
  }

  if (!senha) {
    alert('Preencha a senha.');
    return;
  }

  if (!validarEmailBasico(email)) {
    alert('Informe um e-mail válido.');
    return;
  }

  window.location.href = 'cadastro.html';
};

const obterMensagemErroApi = (resposta, corpo) => {
  if (corpo && corpo.error) return corpo.error;
  return resposta.statusText || 'Erro na requisição.';
};

const escapeHtml = (s) => {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
};

const carregarDadosArmazenados = () => {
  return fetch('/api/usuarios')
    .then((resposta) =>
      resposta.json().then((corpo) => {
        if (!resposta.ok) throw new Error(obterMensagemErroApi(resposta, corpo));
        return corpo;
      })
    )
    .then((dados) => {
      usuarios = Array.isArray(dados.users) ? dados.users : [];
    })
    .catch(() => {
      usuarios = [];
      alert(
        'Não foi possível carregar os usuários. Inicie o servidor na pasta do projeto com: npm start'
      );
    });
};

const extrairCpfNumerico = (valor) => {
  return (valor || '').replace(/\D/g, '');
};

const validarCpfOuVazio = (valor) => {
  const cpf = extrairCpfNumerico(valor);
  if (cpf.length === 0) return true;
  return cpf.length === 11;
};

const aplicarMascaraCpf = (evento) => {
  const input = evento.target;
  const cpf = extrairCpfNumerico(input.value).slice(0, 11);

  let resultado = '';
  for (let i = 0; i < cpf.length; i++) {
    if (i === 3 || i === 6) resultado += '.';
    if (i === 9) resultado += '-';
    resultado += cpf[i];
  }

  input.value = resultado;
};

const limparFormulario = () => {
  const nomeEl = document.getElementById('nome');
  const emailEl = document.getElementById('emailCad');
  const cpfEl = document.getElementById('cpf');
  if (nomeEl) nomeEl.value = '';
  if (emailEl) emailEl.value = '';
  if (cpfEl) cpfEl.value = '';
};

const atualizarUiEdicao = () => {
  const btn = document.getElementById('btnCancelarEdicao');
  if (btn) btn.hidden = indiceEmEdicao === null;
};

const cancelarEdicao = () => {
  indiceEmEdicao = null;
  limparFormulario();
  atualizarUiEdicao();
};

const salvarUser = () => {
  const nomeEl = document.getElementById('nome');
  const emailEl = document.getElementById('emailCad');
  const cpfEl = document.getElementById('cpf');
  const nome = nomeEl ? nomeEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim() : '';
  const cpf = cpfEl ? cpfEl.value.trim() : '';

  if (!nome || !email) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  if (!validarEmailBasico(email)) {
    alert('E-mail inválido.');
    return;
  }

  if (!validarCpfOuVazio(cpf)) {
    alert('CPF inválido.');
    return;
  }

  const dados = JSON.stringify({ nome, email, cpf });

  if (indiceEmEdicao !== null) {
    const usuario = usuarios[indiceEmEdicao];
    if (!usuario || !usuario.id) {
      alert('Registro inválido. Recarregue a página.');
      return;
    }
    fetch(`/api/usuarios/${encodeURIComponent(usuario.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: dados,
    })
      .then((r) =>
        r.json().then((corpo) => {
          if (!r.ok) throw new Error(obterMensagemErroApi(r, corpo));
          return corpo;
        })
      )
      .then((atualizado) => {
        usuarios[indiceEmEdicao] = atualizado;
        indiceEmEdicao = null;
        atualizarUiEdicao();
        limparFormulario();
        criaLista();
      })
      .catch((e) => {
        alert(e.message || 'Erro ao salvar.');
      });
  } else {
    fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: dados,
    })
      .then((r) =>
        r.json().then((corpo) => {
          if (!r.ok) throw new Error(obterMensagemErroApi(r, corpo));
          return corpo;
        })
      )
      .then((novo) => {
        usuarios.push(novo);
        limparFormulario();
        criaLista();
      })
      .catch((e) => {
        alert(e.message || 'Erro ao salvar.');
      });
  }
};

const editar = (indice) => {
  if (indice < 0 || indice >= usuarios.length) return;
  indiceEmEdicao = indice;
  const usuario = usuarios[indice];
  const nomeEl = document.getElementById('nome');
  const emailEl = document.getElementById('emailCad');
  const cpfEl = document.getElementById('cpf');
  if (nomeEl) nomeEl.value = usuario.nome || '';
  if (emailEl) emailEl.value = usuario.email || '';
  if (cpfEl) cpfEl.value = usuario.cpf || '';
  atualizarUiEdicao();
  if (nomeEl) nomeEl.focus();
};

const excluir = (indice) => {
  if (indice < 0 || indice >= usuarios.length) return;
  if (!confirm('Deseja realmente excluir este usuário?')) return;
  const usuario = usuarios[indice];
  if (!usuario || !usuario.id) {
    alert('Registro inválido. Recarregue a página.');
    return;
  }
  fetch(`/api/usuarios/${encodeURIComponent(usuario.id)}`, { method: 'DELETE' })
    .then((r) => {
      if (r.status === 204) return;
      return r.json().then((corpo) => {
        throw new Error(obterMensagemErroApi(r, corpo));
      });
    })
    .then(() => {
      usuarios.splice(indice, 1);
      if (indiceEmEdicao === indice) {
        indiceEmEdicao = null;
        cancelarEdicao();
      } else if (indiceEmEdicao !== null && indiceEmEdicao > indice) {
        indiceEmEdicao--;
      }
      criaLista();
    })
    .catch((e) => {
      alert(e.message || 'Erro ao excluir.');
    });
};

const criaLista = () => {
  const corpo = document.getElementById('corpoTabela');
  const msgVazia = document.getElementById('msgVazia');
  if (!corpo) return;

  corpo.innerHTML = '';
  const vazio = usuarios.length === 0;
  if (msgVazia) msgVazia.hidden = !vazio;

  for (let i = 0; i < usuarios.length; i++) {
    const u = usuarios[i];
    const tr = document.createElement('tr');
    const cCpf = u.cpf != null ? u.cpf : '';
    tr.innerHTML =
      '<td>' + escapeHtml(u.nome) + '</td>' +
      '<td>' + escapeHtml(cCpf) + '</td>' +
      '<td>' + escapeHtml(u.email) + '</td>' +
      '<td class="table__actions">' +
      '<button type="button" class="btn btn--sm btn--ghost" data-acao="editar" data-i="' + i + '">Editar</button> ' +
      '<button type="button" class="btn btn--sm btn--danger" data-acao="excluir" data-i="' + i + '">Excluir</button>' +
      '</td>';
    corpo.appendChild(tr);
  }

  corpo.onclick = (ev) => {
    const btn = ev.target.closest('button[data-acao]');
    if (!btn) return;
    const acao = btn.getAttribute('data-acao');
    const idx = parseInt(btn.getAttribute('data-i'), 10);
    if (Number.isNaN(idx)) return;
    if (acao === 'editar') editar(idx);
    if (acao === 'excluir') excluir(idx);
  };
};
