// Controla a navegação, os formulários e as listas do sistema no navegador.
import './style.css';
import { api, login, type Usuario } from './api';

interface Time {
  id_time: number;
  nome_time: string;
  departamento: string;
  responsavel_nome: string | null;
  total_membros: number;
  total_os: number;
}

interface TimeDetalhado extends Time {
  email_time: string | null;
  responsavel_id: number | null;
  membros: Usuario[];
}

interface Ordem {
  os_id: number;
  os_titulo: string;
  os_descricao: string;
  time_nome: string;
  responsavel_nome: string | null;
  data_limite: string;
  prioridade: string;
  os_status: string;
  id_criador: number;
  id_time_responsavel: number;
  id_usuario_responsavel: number | null;
  id_lider_time: number | null;
}

interface Anexo {
  id_anexo: number;
  nome: string;
  conteudo?: string;
}

const cargos: Record<string, string> = {
  superusuario: 'Superusuário',
  gestor: 'Gestor',
  comercial: 'Comercial',
  suporte: 'Suporte',
  producao: 'Produção',
  software: 'Software',
  implantacao: 'Implantação',
  monitoramento: 'Monitoramento',
};

const vistas = ['usuarios', 'times', 'os', 'lista-usuarios', 'lista-times', 'lista-os'];
const porId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const loginForm = porId<HTMLFormElement>('login');
const feedback = porId('feedback');
const formUsuarios = porId<HTMLFormElement>('form-usuarios');
const formTimes = porId<HTMLFormElement>('form-times');
const formOS = porId<HTMLFormElement>('form-os');
const formFiltrosOS = porId<HTMLFormElement>('filtros-os');
let filtrosOS = new URLSearchParams();
const responsavel = porId<HTMLSelectElement>('responsavel');
const membro = porId<HTMLSelectElement>('membro');
const timeOS = porId<HTMLSelectElement>('time-os');
const responsavelOS = porId<HTMLSelectElement>('responsavel-os');
let pessoasOS: Usuario[] = [];
const membros = new Set<number>();
let disponiveis: Usuario[] = [];
let usuario: Usuario | null = null;
let versaoVista = 0;
let sessao = 0;

function opcoes(select: HTMLSelectElement, placeholder: string, itens: [number | string, string][]) {
  const anterior = select.value;
  select.replaceChildren(new Option(placeholder, ''), ...itens.map(([id, nome]) => new Option(nome, String(id))));
  if (itens.some(([id]) => String(id) === anterior)) select.value = anterior;
}

const cargosCadastro = ['gestor', 'comercial', 'producao', 'software'];
opcoes(formUsuarios.elements.namedItem('cargo') as HTMLSelectElement, 'Selecione um cargo',
  cargosCadastro.map((cargo) => [cargo, cargos[cargo]]));
opcoes(
  formTimes.elements.namedItem('departamento') as HTMLSelectElement,
  'Selecione uma equipe',
  [['Produção', 'Produção'], ['Software', 'Software']],
);

function mensagem(texto: string, erro = false) {
  feedback.textContent = texto;
  feedback.hidden = !texto;
  feedback.classList.toggle('erro', erro);
}

// Mostra o responsável e permite remover os demais membros selecionados.
function mostrarMembros() {
  const idResponsavel = Number(responsavel.value);
  const lista = porId('membros');
  lista.replaceChildren();
  opcoes(membro, 'Selecione um usuário para adicionar', disponiveis
    .filter((u) => u.id_usuario !== idResponsavel && !membros.has(u.id_usuario))
    .map((u) => [u.id_usuario, u.nome]));
  for (const pessoa of disponiveis) {
    if (pessoa.id_usuario === idResponsavel) {
      const lider = document.createElement('span');
      lider.textContent = pessoa.nome + ' (responsável)';
      lista.append(lider);
    } else if (membros.has(pessoa.id_usuario)) {
      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'secundario';
      remover.textContent = pessoa.nome + ' ×';
      remover.setAttribute('aria-label', 'Remover ' + pessoa.nome);
      remover.onclick = () => {
        membros.delete(pessoa.id_usuario);
        mostrarMembros();
        membro.focus();
      };
      lista.append(remover);
    }
  }
  if (!lista.childNodes.length) lista.textContent = 'Nenhuma pessoa vinculada.';
}

responsavel.onchange = mostrarMembros;
membro.onchange = () => {
  if (membro.value) membros.add(Number(membro.value));
  mostrarMembros();
};

// Monta as tabelas das listas com cabeçalhos e ações.
function tabela(colunas: string[], linhas: (string | HTMLElement)[][]) {
  const destino = porId('registros');
  destino.textContent = 'Nenhum registro encontrado.';
  if (!linhas.length) return;
  const tabela = document.createElement('table');
  const cabecalho = tabela.createTHead().insertRow();
  for (const coluna of colunas) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = coluna;
    cabecalho.append(th);
  }
  const corpo = tabela.createTBody();
  for (const valores of linhas) {
    const linha = corpo.insertRow();
    for (const valor of valores) linha.insertCell().append(valor);
  }
  destino.replaceChildren(tabela);
}

// Carrega os registros da tela atual quando a lista é aberta.
async function listar(tipo: string, atual: () => boolean) {
  const rota = tipo.replace('lista-', '');
  const configuracao = {
    usuarios: ['Usuários', 'Novo usuário'],
    times: ['Times', 'Novo time'],
    os: ['Ordens de serviço', 'Nova OS'],
  }[rota]!;
  porId('titulo-lista').textContent = configuracao[0];
  const novo = porId<HTMLAnchorElement>('novo-registro');
  novo.href = '#' + rota;
  novo.textContent = configuracao[1];
  novo.hidden = rota === 'os' && !podeEncaminhar();
  formFiltrosOS.hidden = rota !== 'os';
  const registros = porId('registros');
  registros.textContent = 'Carregando…';
  try {
    if (rota === 'usuarios') {
      const [usuarios, times] = await Promise.all([api<Usuario[]>('/usuarios'), api<Time[]>('/times')]);
      const nomes = new Map(times.map((t) => [t.id_time, t.nome_time]));
      if (atual()) tabela(['Nome', 'Email', 'Cargo', 'Time', 'Ações'], usuarios.map((u) => [
        u.nome, u.email, cargos[u.cargo] ?? u.cargo, nomes.get(u.time_id ?? 0) ?? 'Sem time',
        acoesRegistro('/usuarios/' + u.id_usuario, u.nome, () => editarUsuario(u.id_usuario, times), true,
          () => consultarUsuario(u.id_usuario, nomes)),
      ]));
    } else if (rota === 'times') {
      const times = await api<Time[]>('/times');
      if (atual()) tabela(['Time', 'Equipe', 'Responsável', 'Membros', 'Total de OS', 'Ações'], times.map((t) => [
        t.nome_time, t.departamento, t.responsavel_nome ?? '—', String(t.total_membros), String(t.total_os),
        acoesRegistro('/times/' + t.id_time, t.nome_time, () => editarTime(t.id_time), true, () => consultarTime(t.id_time)),
      ]));
    } else {
      const [ordens, times] = await Promise.all([api<Ordem[]>('/os?' + filtrosOS), api<Time[]>('/times')]);
      if (!atual()) return;
      opcoes(porId('filtro-time'), 'Todos', times.map((t) => [t.id_time, t.nome_time]));
      tabela(['Título', 'Time', 'Pessoa responsável', 'Prazo', 'Prioridade', 'Status', 'Anexos', 'Ações'], ordens.map((o) => [
        detalhesOS(o), o.time_nome, o.responsavel_nome ?? '—', o.data_limite.split('-').reverse().join('/'),
        selo(({ media: 'média', critica: 'crítica' } as Record<string, string>)[o.prioridade] ?? o.prioridade, 'prioridade', o.prioridade),
        selo(o.os_status === 'concluida' ? 'concluída' : o.os_status, 'status', o.os_status), botaoAnexos(o.os_id),
        acoesRegistro('/os/' + o.os_id, o.os_titulo, podeEditarOS(o) ? () => editarOrdem(o.os_id) : undefined, podeGerirOrdem(o)),
      ]));
    }
  } catch (err) {
    if (atual()) registros.textContent = '';
    throw err;
  }
}

// Só envia os filtros preenchidos. Limpar volta à consulta de todas as OS permitidas.
formFiltrosOS.onsubmit = (event) => {
  event.preventDefault();
  const dados = new FormData(formFiltrosOS);
  const inicio = String(dados.get('inicio') ?? '');
  const fim = String(dados.get('fim') ?? '');
  if (inicio && fim && inicio > fim) {
    mensagem('O prazo inicial não pode ser posterior ao final.', true);
    return;
  }
  filtrosOS = new URLSearchParams();
  for (const [campo, valor] of dados) {
    if (typeof valor === 'string' && valor) filtrosOS.set(campo, valor);
  }
  void abrirVista();
};

formFiltrosOS.onreset = () => {
  filtrosOS = new URLSearchParams();
  if (usuario) void abrirVista();
};

function selo(texto: string, tipo: 'status' | 'prioridade', valor: string) {
  const el = document.createElement('span');
  el.className = 'selo';
  el.dataset.tipo = tipo;
  el.dataset.valor = valor;
  el.textContent = texto;
  return el;
}

function detalhesOS(ordem: Ordem) {
  const detalhes = document.createElement('details');
  const titulo = document.createElement('summary');
  titulo.textContent = ordem.os_titulo;
  const descricao = document.createElement('p');
  descricao.textContent = ordem.os_descricao;
  detalhes.append(titulo, descricao);
  return detalhes;
}

// Carrega os anexos sob demanda e transforma o conteúdo recebido em arquivo para download.
function botaoAnexos(id: number) {
  const destino = document.createElement('div');
  const botao = document.createElement('button');
  botao.className = 'secundario';
  botao.textContent = 'Ver anexos';
  destino.append(botao);
  botao.onclick = async () => {
    botao.disabled = true;
    try {
      const anexos = await api<Anexo[]>('/os/' + id + '/anexos');
      destino.replaceChildren();
      if (!anexos.length) destino.textContent = 'Sem anexos';
      for (const anexo of anexos) {
        const baixar = document.createElement('button');
        baixar.className = 'secundario';
        baixar.textContent = anexo.nome;
        baixar.onclick = async () => {
          baixar.disabled = true;
          try {
            const arquivo = await api<Anexo>('/os/' + id + '/anexos/' + anexo.id_anexo);
            const bytes = Uint8Array.from(atob(arquivo.conteudo!), (letra) => letra.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes]));
            const link = document.createElement('a');
            link.href = url;
            link.download = arquivo.nome;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (err) {
            mensagem((err as Error).message, true);
          } finally {
            baixar.disabled = false;
          }
        };
        destino.append(baixar);
      }
    } catch (err) {
      mensagem((err as Error).message, true);
    } finally {
      botao.disabled = false;
    }
  };
  return destino;
}

function podeGerenciar() {
  return usuario?.cargo === 'superusuario' || usuario?.cargo === 'gestor';
}

function podeEncaminhar() {
  return podeGerenciar() || usuario?.cargo === 'comercial';
}

function mostrarPessoasOS() {
  const obrigatorio = usuario?.cargo === 'comercial';
  responsavelOS.required = obrigatorio;
  porId('responsavel-os-obrigatorio').hidden = !obrigatorio;
  opcoes(responsavelOS, obrigatorio ? 'Selecione uma pessoa do Comercial' : 'Apenas o time', pessoasOS
    .map((pessoa) => [pessoa.id_usuario, pessoa.nome]));
}

// Usa o endereço da página e o cargo para escolher a tela e carregar seus dados.
async function abrirVista(limparMensagem = true) {
  if (!usuario) return;
  const versao = ++versaoVista;
  const atual = () => versao === versaoVista;
  const destino = location.hash.slice(1);
  const permitido = podeGerenciar() || destino === 'lista-os' || (destino === 'os' && podeEncaminhar());
  const vistaPadrao = podeGerenciar() ? 'usuarios' : podeEncaminhar() ? 'os' : 'lista-os';
  const vista = permitido && vistas.includes(destino) ? destino : vistaPadrao;
  const painel = vista.startsWith('lista-') ? 'lista' : vista;
  if (limparMensagem) mensagem('');
  for (const id of ['usuarios', 'times', 'os', 'lista']) porId(id).hidden = id !== painel;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('nav a')) {
    if (link.hash === '#' + vista.replace(/^lista-(?=usuarios|times)/, '')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  try {
    if (painel === 'lista') {
      await listar(vista, atual);
    } else if (vista === 'times') {
      const usuarios = await api<Usuario[]>('/usuarios?sem_time=true');
      if (!atual()) return;
      disponiveis = usuarios;
      for (const id of membros) if (!usuarios.some((u) => u.id_usuario === id)) membros.delete(id);
      opcoes(responsavel, 'Selecione um usuário', usuarios.map((u) => [u.id_usuario, u.nome]));
      mostrarMembros();
      if (!usuarios.length && limparMensagem) mensagem('Cadastre um usuário sem time para poder criar um time.');
    } else if (vista === 'os') {
      const [times, pessoas] = await Promise.all([api<Time[]>('/times'), api<Usuario[]>('/usuarios')]);
      if (!atual()) return;
      pessoasOS = pessoas.filter((p) => p.cargo === 'comercial');
      opcoes(timeOS, 'Selecione um time', times.map((t) => [t.id_time, t.nome_time]));
      mostrarPessoasOS();
      if (!times.length) mensagem('É preciso cadastrar um time antes de abrir uma OS.', true);
    } else {
      const times = await api<Time[]>('/times');
      if (!atual()) return;
      opcoes(porId('time-usuario'), 'Sem time', times.map((t) => [t.id_time, t.nome_time]));
    }
  } catch (err) {
    if (atual()) mensagem((err as Error).message, true);
  }
}

// Alterna entre o login e a área autenticada, conforme a sessão do usuário.
function iniciarSessao(conta: Usuario) {
  usuario = conta;
  porId('entrada').hidden = true;
  porId('app').hidden = false;
  document.querySelectorAll<HTMLElement>('[data-gestao]').forEach((link) => { link.hidden = !podeGerenciar(); });
  porId<HTMLElement>('app').querySelector<HTMLElement>('[data-encaminhamento]')!.hidden = !podeEncaminhar();
  void abrirVista();
}

function sair() {
  if (editor.open) editor.close();
  if (confirmacaoExclusao.open) confirmacaoExclusao.close('cancelar');
  ++sessao;
  ++versaoVista;
  usuario = null;
  formFiltrosOS.reset();
  opcoes(porId('filtro-time'), 'Todos', []);
  porId('app').hidden = true;
  porId('entrada').hidden = false;
  history.replaceState(null, '', location.pathname + location.search);
  for (const form of [formUsuarios, formTimes, formOS]) form.reset();
  opcoes(porId('time-usuario'), 'Sem time', []);
  opcoes(porId('time-os'), 'Selecione um time', []);
  pessoasOS = [];
  mostrarPessoasOS();
  opcoes(responsavel, 'Selecione um usuário', []);
  opcoes(membro, 'Selecione um usuário para adicionar', []);
  porId('registros').replaceChildren();
  porId('membros').replaceChildren();
  disponiveis = [];
  membros.clear();
  loginForm.reset();
  porId('msg').textContent = '';
}

const botaoSair = porId<HTMLButtonElement>('sair');
botaoSair.onclick = async () => {
  botaoSair.disabled = true;
  try {
    await api<void>('/auth/logout', { method: 'POST' });
    sair();
  } catch (err) {
    mensagem((err as Error).message, true);
  } finally {
    botaoSair.disabled = false;
  }
};
window.addEventListener('hashchange', () => void abrirVista());
window.addEventListener('sessao-expirada', () => {
  if (!usuario) return;
  sair();
  porId('msg').textContent = 'Sua sessão expirou. Entre novamente.';
});

// Centraliza o envio dos formulários, a exibição de erros e o bloqueio de envios repetidos.
function aoEnviar(form: HTMLFormElement, enviar: (dados: FormData) => Promise<void>, login = false) {
  form.onsubmit = async (event) => {
    event.preventDefault();
    const botao = form.querySelector<HTMLButtonElement>('button:not([type="button"])')!;
    const ativa = sessao;
    botao.disabled = true;
    try {
      await enviar(new FormData(form));
    } catch (err) {
      if (ativa !== sessao) return;
      if (login) porId('msg').textContent = (err as Error).message;
      else mensagem((err as Error).message, true);
    } finally {
      botao.disabled = false;
    }
  };
}

aoEnviar(loginForm, async (dados) => {
  const resultado = await login(String(dados.get('email')), String(dados.get('senha')));
  loginForm.reset();
  porId('msg').textContent = '';
  iniciarSessao(resultado.usuario);
}, true);

const senha = porId<HTMLInputElement>('nova-senha');
const alternarSenha = porId<HTMLButtonElement>('mostrar-senha');
alternarSenha.onclick = () => {
  senha.type = senha.type === 'password' ? 'text' : 'password';
  alternarSenha.textContent = senha.type === 'password' ? 'Mostrar' : 'Ocultar';
};
formUsuarios.addEventListener('reset', () => {
  senha.type = 'password';
  alternarSenha.textContent = 'Mostrar';
});

function postar<T>(rota: string, corpo: object) {
  return api<T>(rota, { method: 'POST', body: JSON.stringify(corpo) });
}

// Cadastros enviados à API. O ID do time é opcional para novos usuários.
aoEnviar(formUsuarios, async (dados) => {
  const ativa = sessao;
  await postar('/usuarios', {
    ...Object.fromEntries(dados),
    nome: String(dados.get('nome')).trim(),
    time_id: Number(dados.get('time_id')) || null,
  });
  if (ativa !== sessao) return;
  formUsuarios.reset();
  mensagem('Usuário cadastrado com sucesso.');
});

// O responsável também é incluído na lista de membros do novo time.
aoEnviar(formTimes, async (dados) => {
  const ativa = sessao;
  const idResponsavel = Number(dados.get('responsavel_id'));
  await postar('/times', {
    ...Object.fromEntries(dados),
    nome_time: String(dados.get('nome_time')).trim(),
    responsavel_id: idResponsavel,
    usuario_ids: [...new Set([idResponsavel, ...membros])],
  });
  if (ativa !== sessao) return;
  formTimes.reset();
  membros.clear();
  mensagem('Time cadastrado com sucesso.');
  if (!porId('times').hidden) await abrirVista(false);
});

// Converte o arquivo selecionado para o formato aceito pela API.
function lerAnexo(arquivo: File): Promise<{ nome: string; conteudo: string }> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler ' + arquivo.name));
    leitor.onload = () => resolve({ nome: arquivo.name, conteudo: String(leitor.result).split(',')[1] });
    leitor.readAsDataURL(arquivo);
  });
}

aoEnviar(formOS, async (dados) => {
  const ativa = sessao;
  const anexos = dados.getAll('anexos').filter((arquivo): arquivo is File => arquivo instanceof File && !!arquivo.name);
  if (anexos.length > 10 || anexos.reduce((total, arquivo) => total + arquivo.size, 0) > 2 * 1024 * 1024) {
    throw new Error('Envie até 10 anexos com no máximo 2 MB no total.');
  }
  const arquivosLidos = await Promise.all(anexos.map(lerAnexo));
  if (ativa !== sessao) return;
  const ordem = await postar<Ordem>('/os', {
    os_titulo: String(dados.get('os_titulo')).trim(),
    os_descricao: String(dados.get('os_descricao')).trim(),
    data_limite: String(dados.get('data_limite')),
    prioridade: String(dados.get('prioridade')),
    id_time_responsavel: Number(dados.get('id_time_responsavel')),
    id_usuario_responsavel: Number(dados.get('id_usuario_responsavel')) || undefined,
    anexos: arquivosLidos,
  });
  if (ativa !== sessao) return;
  formOS.reset();
  mostrarPessoasOS();
  mensagem('Ordem de serviço nº ' + ordem.os_id + ' cadastrada com sucesso.');
});

const botaoEntrar = loginForm.querySelector('button')!;
botaoEntrar.disabled = true;
api<Usuario>('/auth/me').then(iniciarSessao).catch((err: Error & { status?: number }) => {
  if (err.status !== 401) porId('msg').textContent = err.message;
}).finally(() => { botaoEntrar.disabled = false; });

// Perfis de teste: preenchem o formulário e entram com um clique.
// Para esconder o bloco (ex.: em produção), defina VITE_PERFIS_DEMO=false no frontend/.env
if (import.meta.env.VITE_PERFIS_DEMO === 'false') document.getElementById('perfis')?.remove();
document.querySelectorAll<HTMLButtonElement>('#perfis [data-email]').forEach((perfil) => {
  perfil.onclick = () => {
    (loginForm.elements.namedItem('email') as HTMLInputElement).value = perfil.dataset.email ?? '';
    (loginForm.elements.namedItem('senha') as HTMLInputElement).value = perfil.dataset.senha ?? '';
    loginForm.requestSubmit();
  };
});
// Janelas usadas para consultar, editar e confirmar exclusões.
const editor = porId<HTMLDialogElement>('editor');
const confirmacaoExclusao = porId<HTMLDialogElement>('confirmar-exclusao');
const editorForm = porId<HTMLFormElement>('editor-form');
const editorCampos = porId('editor-campos');
const editorErro = porId('editor-erro');
const editorSalvar = porId<HTMLButtonElement>('editor-salvar');
const editorFechar = porId<HTMLButtonElement>('editor-fechar');

editorFechar.onclick = () => editor.close();
editor.oncancel = (event) => {
  if (editorSalvar.disabled && !editorSalvar.hidden) event.preventDefault();
};

function acao(texto: string, executar: () => Promise<void>) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'secundario';
  botao.textContent = texto;
  botao.onclick = async () => {
    botao.disabled = true;
    try {
      await executar();
    } catch (err) {
      mensagem((err as Error).message, true);
    } finally {
      botao.disabled = false;
      if (document.activeElement === document.body) botao.focus();
    }
  };
  return botao;
}

// Aguarda a escolha do usuário antes de permitir a exclusão.
function confirmarExclusao(rota: string, nome: string) {
  const titulo = rota.startsWith('/usuarios/') ? 'Excluir usuário'
    : rota.startsWith('/times/') ? 'Excluir time' : 'Excluir ordem de serviço';
  porId('exclusao-titulo').textContent = titulo;
  porId('exclusao-registro').textContent = nome;
  confirmacaoExclusao.returnValue = 'cancelar';
  return new Promise<boolean>((resolve) => {
    confirmacaoExclusao.addEventListener('close', () => {
      resolve(confirmacaoExclusao.returnValue === 'excluir');
    }, { once: true });
    confirmacaoExclusao.showModal();
  });
}

function acoesRegistro(rota: string, nome: string, editar: (() => Promise<void>) | undefined, excluir: boolean, consultar?: () => Promise<void>) {
  const acoes = document.createElement('div');
  if (consultar) acoes.append(acao('Ver detalhes', consultar));
  if (editar) acoes.append(acao('Editar', editar));
  if (excluir) acoes.append(acao('Excluir', async () => {
    if (!(await confirmarExclusao(rota, nome))) return;
    await api<void>(rota, { method: 'DELETE' });
    await abrirVista(false);
    mensagem('Registro excluído.');
  }));
  return acoes;
}

function abrirEditor(titulo: string, campos: HTMLElement[], salvar?: (dados: FormData) => Promise<unknown>) {
  if (!usuario || editor.open) return;
  porId('editor-titulo').textContent = titulo;
  editorCampos.replaceChildren(...campos);
  editorErro.textContent = '';
  editorSalvar.hidden = !salvar;
  editorForm.onsubmit = async (event) => {
    event.preventDefault();
    if (!salvar) return;
    editorSalvar.disabled = editorFechar.disabled = true;
    try {
      await salvar(new FormData(editorForm));
      editor.close();
      await abrirVista(false);
      mensagem('Alterações salvas.');
    } catch (err) {
      editorErro.textContent = (err as Error).message;
    } finally {
      editorSalvar.disabled = editorFechar.disabled = false;
    }
  };
  editor.showModal();
}

function campo(rotulo: string, controle: HTMLElement) {
  const label = document.createElement('label');
  label.append(rotulo, controle);
  return label;
}

function entrada(nome: string, valor: string, tipo = 'text', minimo = 1, maximo = 150) {
  const input = document.createElement('input');
  Object.assign(input, { name: nome, type: tipo, value: valor, minLength: minimo, maxLength: maximo, required: tipo !== 'password' });
  if (tipo === 'password') input.autocomplete = 'new-password';
  return input;
}

function seletor(nome: string, valor: number | string | null, itens: [number | string, string][], placeholder: string, obrigatorio = false) {
  const select = document.createElement('select');
  select.name = nome;
  select.required = obrigatorio;
  opcoes(select, placeholder, itens);
  select.value = String(valor ?? '');
  return select;
}

function atualizar(rota: string, dados: object) {
  return api(rota, { method: 'PATCH', body: JSON.stringify(dados) });
}

async function consultarUsuario(id: number, nomesTimes: Map<number, string>) {
  const conta = await api<Usuario>('/usuarios/' + id);
  const detalhes = [
    'Email ' + conta.email,
    'Cargo ' + (cargos[conta.cargo] ?? conta.cargo),
    'Time ' + (nomesTimes.get(conta.time_id ?? 0) ?? 'Sem time'),
  ].map((texto) => {
    const item = document.createElement('p');
    item.textContent = texto;
    return item;
  });
  abrirEditor(conta.nome, detalhes);
}

// Carrega o usuário e permite alterar a senha deixando a senha atual fora do formulário.
async function editarUsuario(id: number, times: Time[]) {
  const rota = '/usuarios/' + id;
  const conta = await api<Usuario>(rota);
  const listaCargos = [...new Set([...cargosCadastro, conta.cargo])];
  abrirEditor('Editar usuário', [
    campo('Nome', entrada('nome', conta.nome, 'text', 2, 100)),
    campo('Email', entrada('email', conta.email, 'email')),
    campo('Nova senha (opcional)', entrada('senha', '', 'password', 6, 72)),
    campo('Cargo', seletor('cargo', conta.cargo, listaCargos.map((cargo) => [cargo, cargos[cargo] ?? cargo]), 'Selecione', true)),
    campo('Time', seletor('time_id', conta.time_id, times.map((t) => [t.id_time, t.nome_time]), 'Sem time')),
  ], (dados) => atualizar(rota, {
    ...Object.fromEntries(dados),
    senha: dados.get('senha') || undefined,
    time_id: Number(dados.get('time_id')) || null,
  }));
}

async function consultarTime(id: number) {
  const time = await api<TimeDetalhado>('/times/' + id);
  const informacoes = document.createElement('div');
  informacoes.className = 'linha';
  const equipe = document.createElement('p');
  equipe.textContent = 'Equipe ' + time.departamento + (time.email_time ? ' • ' + time.email_time : '');
  const lista = document.createElement('ul');
  for (const pessoa of time.membros) {
    const item = document.createElement('li');
    item.textContent = pessoa.nome + (pessoa.id_usuario === time.responsavel_id ? ' (responsável)' : '');
    lista.append(item);
  }
  informacoes.append(equipe, lista);
  abrirEditor(time.nome_time, [informacoes]);
}

// Mantém a lista de candidatos a responsável sincronizada com os membros selecionados.
async function editarTime(id: number) {
  const rota = '/times/' + id;
  const [time, pessoas] = await Promise.all([api<TimeDetalhado>(rota), api<Usuario[]>('/usuarios')]);
  const elegiveis = pessoas.filter((p) => p.time_id === null || p.time_id === id);
  const selecionados = new Set(time.membros.map((p) => p.id_usuario));
  const lider = seletor('responsavel_id', null, [], 'Selecione um membro', true);
  const membros = document.createElement('fieldset');
  membros.className = 'linha';
  const legenda = document.createElement('legend');
  legenda.textContent = 'Pessoas vinculadas';
  membros.append(legenda);
  function atualizarLider() {
    opcoes(lider, 'Selecione um membro', elegiveis.filter((p) => selecionados.has(p.id_usuario))
      .map((p) => [p.id_usuario, p.nome]));
  }
  for (const pessoa of elegiveis) {
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = selecionados.has(pessoa.id_usuario);
    check.onchange = () => {
      if (check.checked) selecionados.add(pessoa.id_usuario);
      else selecionados.delete(pessoa.id_usuario);
      atualizarLider();
    };
    const label = document.createElement('label');
    label.append(check, pessoa.nome);
    membros.append(label);
  }
  atualizarLider();
  lider.value = String(time.responsavel_id ?? '');
  const email = entrada('email_time', time.email_time ?? '', 'email');
  email.required = false;
  abrirEditor('Editar time', [
    campo('Nome do time', entrada('nome_time', time.nome_time, 'text', 2, 100)),
    campo('Equipe relacionada', entrada('departamento', time.departamento, 'text', 2, 100)),
    campo('Email (opcional)', email), campo('Pessoa responsável', lider), membros,
  ], (dados) => atualizar(rota, {
    ...Object.fromEntries(dados),
    email_time: dados.get('email_time') || null,
    responsavel_id: Number(dados.get('responsavel_id')),
    usuario_ids: [...selecionados],
  }));
}

function podeGerirOrdem(os: Ordem) {
  return podeGerenciar() || (usuario?.cargo === 'comercial' && os.id_criador === usuario.id_usuario);
}

function podeEditarOS(os: Ordem) {
  return podeGerirOrdem(os) || usuario?.time_id === os.id_time_responsavel;
}

// Exibe os campos de edição da OS conforme o acesso de quem está logado.
async function editarOrdem(id: number) {
  const rota = '/os/' + id;
  const os = await api<Ordem>(rota);
  if (!podeEditarOS(os)) throw new Error('Você não pode editar esta OS.');
  const podeMudarDestino = podeGerirOrdem(os);
  const descricao = document.createElement('textarea');
  Object.assign(descricao, { name: 'os_descricao', value: os.os_descricao, required: true });
  const prioridades: [string, string][] = [['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta'], ['critica', 'Crítica']];
  const status: [string, string][] = [
    ['aberta', 'Aberta'], ['em andamento', 'Em andamento'], ['concluida', 'Concluída'],
    ['teste', 'Teste'], ['bloqueado', 'Bloqueado'], ['review', 'Review'],
  ];
  const podeConcluir = podeGerenciar() || usuario?.id_usuario === os.id_lider_time;
  const statusOS = seletor('os_status', os.os_status,
    status.filter(([valor]) => podeConcluir || valor !== 'concluida' || valor === os.os_status), 'Selecione', true);
  statusOS.disabled = !podeConcluir && os.os_status === 'concluida';
  const campos = [
    campo('Título', entrada('os_titulo', os.os_titulo, 'text', 3, 150)),
    campo('Prazo desejado', entrada('data_limite', os.data_limite, 'date')),
    campo('Prioridade', seletor('prioridade', os.prioridade, prioridades, 'Selecione', true)),
    campo('Status', statusOS),
    campo('Descrição', descricao),
  ];
  if (podeMudarDestino) {
    const [times, pessoas] = await Promise.all([api<Time[]>('/times'), api<Usuario[]>('/usuarios')]);
    const responsaveis: [number, string][] = pessoas.filter((p) => p.cargo === 'comercial').map((p) => [p.id_usuario, p.nome]);
    const pessoa = seletor('id_usuario_responsavel', os.id_usuario_responsavel, responsaveis, 'Apenas o time');
    if (os.id_usuario_responsavel !== null && !pessoa.value) {
      pessoa.add(new Option(os.responsavel_nome + ' (atribuição anterior)', String(os.id_usuario_responsavel)));
      pessoa.value = String(os.id_usuario_responsavel);
    }
    campos.push(
      campo('Time responsável', seletor('id_time_responsavel', os.id_time_responsavel, times.map((t) => [t.id_time, t.nome_time]), 'Selecione', true)),
      campo('Pessoa responsável', pessoa),
    );
  }
  abrirEditor('Editar ordem de serviço', campos, (dados) => {
    const alteracoes: Record<string, unknown> = Object.fromEntries(dados);
    if (podeMudarDestino) {
      alteracoes.id_time_responsavel = Number(dados.get('id_time_responsavel'));
      const idPessoa = Number(dados.get('id_usuario_responsavel')) || null;
      alteracoes.id_usuario_responsavel = idPessoa === os.id_usuario_responsavel ? undefined : idPessoa;
    }
    return atualizar(rota, alteracoes);
  });
}
