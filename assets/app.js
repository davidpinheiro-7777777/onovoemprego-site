// Lógica do site. Fala com a API (endereço em config.js; o site está no GitHub Pages).
// No browser fica guardado apenas o token de sessão.

(function () {
  const MAX_CAT = 5;
  const API = (window.ONE_CONFIG && window.ONE_CONFIG.api) || '';
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // ---------- Sessão ----------
  let tokenMemoria = null;
  const sessao = {
    token() { try { return localStorage.getItem('otne_token') || tokenMemoria; } catch (e) { return tokenMemoria; } },
    guardar(t) { tokenMemoria = t; try { localStorage.setItem('otne_token', t); } catch (e) { /* modo privado */ } },
    limpar() { tokenMemoria = null; try { localStorage.removeItem('otne_token'); } catch (e) { /* modo privado */ } }
  };
  let perfil = null;

  async function api(metodo, caminho, corpo) {
    const headers = { 'content-type': 'application/json' };
    const t = sessao.token();
    if (t) headers.authorization = `Bearer ${t}`;
    let r;
    try {
      r = await fetch(`${API}/api${caminho}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
    } catch (e) {
      throw Object.assign(new Error('Sem ligação. Verifica a tua internet e tenta novamente.'), { estado: 0 });
    }
    const dados = await r.json().catch(() => ({}));
    if (r.status === 401 && t) { sessao.limpar(); perfil = null; mostrar('entrar'); }
    if (!r.ok) throw Object.assign(new Error(dados.erro || 'Ocorreu um erro. Tenta novamente.'), { estado: r.status });
    return dados;
  }

  // ---------- Validação (a API valida tudo outra vez) ----------
  const limparTel = t => (t || '').replace(/[\s-]/g, '').replace(/^(\+351|00351)/, '');
  const telValido = t => /^9\d{8}$/.test(limparTel(t));
  const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((e || '').trim());
  const cpValido = cp => /^\d{4}-\d{3}$/.test(cp || '');
  function idade(dataStr) {
    const d = new Date(dataStr); if (isNaN(d)) return -1;
    const h = new Date(); let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a;
  }
  function formatarCP(input) {
    input.addEventListener('input', () => {
      const d = input.value.replace(/\D/g, '').slice(0, 7);
      input.value = d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d;
    });
  }
  function marcar(el, invalido) {
    const alvo = el.closest('.campo') || el.closest('.visto');
    if (alvo) alvo.classList.toggle('invalido', invalido);
  }
  function mostrarErro(el, msg) { el.textContent = msg || ''; el.hidden = !msg; }
  async function aEnviar(form, fn) {
    const b = $('button[type=submit]', form), txt = b.textContent;
    b.disabled = true; b.textContent = 'A enviar…';
    try { await fn(); } finally { b.disabled = false; b.textContent = txt; }
  }

  // ---------- Seletor de categorias (até 5) ----------
  function criarSeletor(raiz, contador) {
    let escolhidas = [];
    raiz.innerHTML = `
      <div class="seletor-escolhidas"></div>
      <input type="search" class="seletor-busca" placeholder="Pesquisar categoria…" aria-label="Pesquisar categoria">
      <ul class="seletor-lista"></ul>`;
    const caixa = $('.seletor-escolhidas', raiz), busca = $('.seletor-busca', raiz), lista = $('.seletor-lista', raiz);
    lista.innerHTML = CATEGORIAS.map(c =>
      `<li data-cat="${c}"><label><input type="checkbox" value="${c}"><span>${c}</span></label></li>`).join('');

    function render() {
      caixa.innerHTML = escolhidas.map(c =>
        `<span class="chip">${c}<button type="button" data-tirar="${c}" aria-label="Remover ${c}">×</button></span>`).join('');
      const cheio = escolhidas.length >= MAX_CAT;
      $$('input', lista).forEach(i => {
        i.checked = escolhidas.includes(i.value);
        i.disabled = cheio && !i.checked;
        i.parentElement.classList.toggle('bloqueado', i.disabled);
      });
      contador.textContent = `${escolhidas.length}/${MAX_CAT}`;
    }
    lista.addEventListener('change', e => {
      const v = e.target.value;
      escolhidas = e.target.checked ? [...escolhidas, v].slice(0, MAX_CAT) : escolhidas.filter(c => c !== v);
      raiz.closest('.campo')?.classList.remove('invalido');
      render();
    });
    caixa.addEventListener('click', e => {
      const v = e.target.dataset.tirar; if (!v) return;
      escolhidas = escolhidas.filter(c => c !== v); render();
    });
    busca.addEventListener('input', () => {
      const q = busca.value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      $$('li', lista).forEach(li => {
        const t = li.dataset.cat.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        li.hidden = q && !t.includes(q);
      });
    });
    render();
    return { get: () => [...escolhidas], set: v => { escolhidas = [...v]; render(); } };
  }

  // ---------- Navegação ----------
  function mostrar(vista, opcoes = {}) {
    const autenticado = !!perfil;
    if ((vista === 'ofertas' || vista === 'perfil' || vista === 'parcerias') && !autenticado) vista = 'inicio';
    if ((vista === 'inicio' || vista === 'entrar') && autenticado) vista = 'ofertas';
    $$('.vista').forEach(v => { v.hidden = v.id !== 'vista-' + vista; });
    $('#inicioInfo').hidden = vista !== 'inicio';
    $('#navSessao').hidden = !autenticado;
    // só aparece a quem a API autoriza a ver as estatísticas (ESTATISTICAS_EMAILS)
    $('#linkEstatisticas').hidden = !(autenticado && perfil?.estatisticas);
    $$('#navSessao a').forEach(a => a.classList.toggle('ativo', a.dataset.nav === vista));
    if (vista === 'ofertas') carregarOfertas();
    if (vista === 'perfil') preencherPerfil();
    if (vista === 'parcerias') carregarParcerias();
    if (vista === 'entrar') opcoes.email ? pedirCodigoMostrado(opcoes.email, opcoes.novo) : reiniciarEntrar();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nav]');
    if (n) { e.preventDefault(); mostrar(n.dataset.nav); }
  });
  // a janela das empresas parceiras está em parceiros.js

  // ---------- Registo ----------
  const fReg = $('#formRegisto');
  const seletorReg = criarSeletor($('[data-seletor]', fReg), $('#contadorCat'));
  fReg.genero.innerHTML += GENEROS.map(g => `<option>${g}</option>`).join('');
  fReg.nascimento.max = new Date().toISOString().slice(0, 10);
  formatarCP(fReg.cp);
  $$('input, select', fReg).forEach(i => i.addEventListener('input', () => marcar(i, false)));

  let registoEmCurso = false;

  // Sem a nossa API, o registo fica só no Escafandro: agradece e explica o que vem a seguir.
  function mostrarObrigado(nome) {
    const ok = document.createElement('div'), h = document.createElement('h2'), p = document.createElement('p');
    ok.className = 'obrigado'; ok.setAttribute('role', 'status'); ok.tabIndex = -1;
    h.textContent = 'Perfil criado';
    p.textContent = `Obrigado, ${nome}. Vais começar a receber ofertas.`;
    ok.append(h, p);
    $('#cartaoRegisto').replaceChildren(ok);
    ok.focus();
  }

  fReg.addEventListener('submit', e => {
    e.preventDefault();
    const f = fReg, erros = [];
    const cats = seletorReg.get();
    const verif = (el, ok, msg) => { marcar(el, !ok); if (!ok) erros.push(msg); };
    verif(f.nome, f.nome.value.trim(), 'Indica o teu nome.');
    verif(f.apelido, f.apelido.value.trim(), 'Indica o teu apelido.');
    verif(f.genero, f.genero.value, 'Escolhe o género.');
    const anos = idade(f.nascimento.value);
    verif(f.nascimento, anos >= 18, anos < 0 ? 'Indica a data de nascimento.' : 'Tens de ter mais de 18 anos.');
    verif(f.telefone, telValido(f.telefone.value), 'Telefone inválido (9XX XXX XXX).');
    verif(f.cp, cpValido(f.cp.value), 'O código postal não é válido (ex.: 1000-001).');
    verif(f.email, emailValido(f.email.value), 'O email não é válido.');
    $('#campoCategorias').classList.toggle('invalido', !cats.length);
    if (!cats.length) erros.push('Escolhe pelo menos uma categoria profissional.');
    verif(f.consentimento, f.consentimento.checked, 'Tens de aceitar o tratamento dos teus dados para te registares.');
    if (erros.length) return mostrarErro($('#erroRegisto'), erros[0]);
    mostrarErro($('#erroRegisto'), '');

    if (registoEmCurso) return; // duplo clique
    registoEmCurso = true;
    // o mesmo id vai no evento Lead do Pixel e no da API de Conversões, para a Meta o contar uma vez
    const eventoLead = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    const marketing = marketingAceite();
    aEnviar(f, async () => {
      try {
        const r = await api('POST', '/registo', {
          nome: f.nome.value, apelido: f.apelido.value, genero: f.genero.value, nascimento: f.nascimento.value,
          telefone: f.telefone.value, cp: f.cp.value, email: f.email.value, categorias: cats,
          consentimento: f.consentimento.checked, parceiros: f.parceiros.checked,
          empresasParceiras: f.parceiros.checked ? oneParceiros.lista(f.parceiros) : [],
          origem: origemVisita(),
          // só com os cookies de marketing aceites é que o registo é comunicado à Meta
          meta: marketing ? { evento: eventoLead, fbp: cookie('_fbp'), fbc: cookie('_fbc') } : null
        });
        if (marketing) fbq('track', 'Lead', {}, { eventID: eventoLead });
        // registo aceite: a lead segue para o Escafandro (keepalive: não se perde ao mudar de vista)
        enviarLead(f, cats);
        fReg.reset(); seletorReg.set([]); oneParceiros.limpar(fReg.parceiros);
        mostrar('entrar', { email: r.email, novo: true });
      } catch (err) {
        // erro nos dados (ex.: email já registado): não envia a lead
        if (err.estado >= 400 && err.estado < 500) return mostrarErro($('#erroRegisto'), err.message);
        // a nossa API não está disponível: a lead fica registada no Escafandro na mesma
        if (await enviarLead(f, cats)) return mostrarObrigado(f.nome.value.trim());
        mostrarErro($('#erroRegisto'), 'Não foi possível enviar. Tenta novamente dentro de instantes.');
      } finally { registoEmCurso = false; }
    });
  });

  // ---------- Entrar (código por email) ----------
  let emailPendente = null;
  function reiniciarEntrar() {
    emailPendente = null;
    $('#formEmail').hidden = false; $('#formCodigo').hidden = true;
    $('#formEmail').reset(); $('#formCodigo').reset();
    $('#tituloEntrar').textContent = 'Bem-vindo de volta!';
    mostrarErro($('#erroEmail'), ''); mostrarErro($('#erroCodigo'), '');
  }
  function pedirCodigoMostrado(email, novo) {
    emailPendente = email;
    $('#tituloEntrar').textContent = novo ? 'Confirma o teu email' : 'Bem-vindo de volta!';
    $('#emailEnviado').textContent = email;
    $('#formEmail').hidden = true; $('#formCodigo').hidden = false;
    $('#formCodigo').reset(); mostrarErro($('#erroCodigo'), '');
    $('#formCodigo').codigo.focus();
  }
  $('#formEmail').addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    if (!emailValido(email)) return mostrarErro($('#erroEmail'), 'O email não é válido.');
    aEnviar(e.target, async () => {
      try { await api('POST', '/codigo', { email }); pedirCodigoMostrado(email, false); }
      catch (err) { mostrarErro($('#erroEmail'), err.message); }
    });
  });
  $('#formCodigo').addEventListener('submit', e => {
    e.preventDefault();
    aEnviar(e.target, async () => {
      try {
        const r = await api('POST', '/entrar', { email: emailPendente, codigo: e.target.codigo.value.trim() });
        sessao.guardar(r.token); perfil = r.perfil;
        // veio de um artigo d'O Próximo Passo: volta para lá
        let voltar = null;
        try { voltar = sessionStorage.getItem('one_voltar'); sessionStorage.removeItem('one_voltar'); } catch (err) { /* modo privado */ }
        if (voltar && voltar.startsWith('/o-proximo-passo/')) { location.href = voltar; return; }
        // veio do email de boas-vindas (link /#perfil): abre o perfil para escolher mais áreas
        mostrar(location.hash === '#perfil' ? 'perfil' : 'ofertas');
      } catch (err) { mostrarErro($('#erroCodigo'), err.message); }
    });
  });
  $('#btnReenviar').addEventListener('click', async e => {
    e.preventDefault();
    try { await api('POST', '/codigo', { email: emailPendente }); mostrarErro($('#erroCodigo'), ''); $('#codigoReenviado').hidden = false; }
    catch (err) { mostrarErro($('#erroCodigo'), err.message); }
  });
  $('#btnOutroEmail').addEventListener('click', e => { e.preventDefault(); reiniciarEntrar(); });
  $('#btnSair').addEventListener('click', async () => {
    try { await api('POST', '/sair'); } catch (e) { /* sai na mesma */ }
    sessao.limpar(); perfil = null; mostrar('inicio');
  });

  // ---------- Ofertas ----------
  let filtroAtivo = 'todas', ofertas = [];
  const ICON = {
    local: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    contrato: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    salario: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 8.5a4 4 0 1 0 0 7M7 11h6M7 13.5h6"/></svg>',
    seta: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>'
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function quando(d) {
    const dias = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
    return dias <= 0 ? 'Hoje' : dias === 1 ? 'Ontem' : `Há ${dias} dias`;
  }
  const iniciais = n => (n || '?').split(/[\s|–-]+/).filter(p => /^[A-Za-zÀ-ÿ0-9]/.test(p)).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';

  // ---------- Parcerias ----------
  async function carregarParcerias() {
    const lista = $('#listaParcerias');
    lista.replaceChildren(); $('#semParcerias').hidden = true; $('#notaParcerias').hidden = true;
    let parcerias = [];
    try { parcerias = (await api('GET', '/parcerias')).parcerias; } catch (err) { /* mostra "Em breve" */ }
    $('#semParcerias').hidden = parcerias.length > 0;
    $('#notaParcerias').hidden = !parcerias.length;
    const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto) e.textContent = texto; return e; };
    const ligar = a => { a.target = '_blank'; a.rel = 'sponsored noopener'; return a; };
    for (const p of parcerias) {
      const artigo = el('article', 'parceria');
      const imagem = ligar(el('a', 'parceria-imagem'));
      imagem.href = API + p.link; imagem.tabIndex = -1; imagem.setAttribute('aria-hidden', 'true');
      const img = el('img'); img.src = p.imagem; img.alt = ''; img.loading = 'lazy';
      imagem.append(img);
      const corpo = el('div', 'parceria-corpo');
      const botao = ligar(el('a', 'btn-parceria', p.botao + ' →'));
      botao.href = API + p.link;
      corpo.append(el('p', 'parceria-categoria', p.categoria), el('h3', null, p.titulo), el('p', 'parceria-texto', p.texto), botao);
      if (p.legal) corpo.append(el('p', 'parceria-legal', p.legal));
      artigo.append(imagem, corpo);
      lista.append(artigo);
    }
  }

  async function carregarOfertas() {
    $('#olaNome').textContent = perfil?.nome || '';
    $('#resumoOfertas').textContent = 'A procurar ofertas para ti…';
    $('#listaOfertas').innerHTML = ''; $('#semOfertas').hidden = true; $('#filtros').hidden = true;
    try {
      const r = await api('GET', '/ofertas');
      ofertas = r.ofertas;
      renderOfertas();
    } catch (err) { $('#resumoOfertas').textContent = err.message; }
  }

  function renderOfertas() {
    const cats = perfil.categorias;
    if (filtroAtivo !== 'todas' && !cats.includes(filtroAtivo)) filtroAtivo = 'todas';
    const visiveis = filtroAtivo === 'todas' ? ofertas : ofertas.filter(o => o.categoria === filtroAtivo);

    $('#resumoOfertas').innerHTML = `<b>${ofertas.length} ${ofertas.length === 1 ? 'oferta' : 'ofertas'}</b> para o teu perfil · <b>${esc(perfil.distrito)}</b>`;
    const conta = c => ofertas.filter(o => o.categoria === c).length;
    $('#filtros').innerHTML = [['todas', 'Todas', ofertas.length], ...cats.map(c => [c, c, conta(c)])]
      .map(([v, t, n]) => `<button type="button" role="tab" class="filtro" data-filtro="${esc(v)}" aria-selected="${v === filtroAtivo}">${esc(t)}<span class="n">${n}</span></button>`)
      .join('');
    $('#filtros').hidden = cats.length < 2 || !ofertas.length;

    $('#listaOfertas').innerHTML = visiveis.map(o => {
      const nova = (Date.now() - new Date(o.data)) < 2 * 864e5;
      const local = o.distrito === 'Remoto' ? 'Remoto / Todo o país' : (o.localidade || o.distrito);
      return `<li class="oferta"><a href="${API}/api/ir/${encodeURIComponent(o.id)}" rel="noopener">
        <span class="oferta-logo" aria-hidden="true">${esc(iniciais(o.empresa || o.titulo))}</span>
        <div class="oferta-corpo">
          <h3>${esc(o.titulo)}${nova ? '<span class="nova">Nova</span>' : ''}</h3>
          ${o.empresa ? `<p class="oferta-empresa">${esc(o.empresa)}</p>` : ''}
          <ul class="oferta-meta">
            <li>${ICON.local}${esc(local)}</li>
            ${o.contrato ? `<li>${ICON.contrato}${esc(o.contrato)}</li>` : ''}
            ${o.salario ? `<li>${ICON.salario}${esc(o.salario)}</li>` : ''}
          </ul>
        </div>
        <div class="oferta-lado">
          <span class="oferta-data">${quando(o.data)}</span>
          <span class="oferta-ver">Ver oferta ${ICON.seta}</span>
          <span class="oferta-fonte">via ${esc(o.fonte)}</span>
        </div>
      </a></li>`;
    }).join('');
    $('#semOfertas').hidden = visiveis.length > 0;
  }
  $('#filtros').addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]'); if (!b) return;
    filtroAtivo = b.dataset.filtro; renderOfertas();
  });

  // ---------- Perfil ----------
  const fPer = $('#formPerfil');
  const seletorPer = criarSeletor($('[data-seletor]', fPer), $('#contadorCatPerfil'));
  formatarCP(fPer.cp);
  function preencherPerfil() {
    ['nome', 'apelido', 'telefone', 'cp', 'email', 'frequencia'].forEach(k => { fPer[k].value = perfil[k] || ''; });
    fPer.alertas.checked = !!perfil.alertas;
    fPer.newsletter.checked = perfil.newsletter !== false;
    seletorPer.set(perfil.categorias);
    mostrarErro($('#erroPerfil'), ''); $('#okPerfil').hidden = true;
  }
  fPer.addEventListener('submit', e => {
    e.preventDefault();
    const cats = seletorPer.get();
    let erro = '';
    if (!fPer.nome.value.trim() || !fPer.apelido.value.trim()) erro = 'Indica o teu nome e apelido.';
    else if (!telValido(fPer.telefone.value)) erro = 'O telefone não é válido.';
    else if (!cpValido(fPer.cp.value)) erro = 'O código postal não é válido (ex.: 1000-001).';
    else if (!cats.length) erro = 'Escolhe pelo menos uma categoria profissional.';
    mostrarErro($('#erroPerfil'), erro); $('#okPerfil').hidden = true;
    if (erro) return;
    aEnviar(fPer, async () => {
      try {
        const r = await api('PUT', '/perfil', {
          nome: fPer.nome.value, apelido: fPer.apelido.value, telefone: fPer.telefone.value, cp: fPer.cp.value,
          categorias: cats, alertas: fPer.alertas.checked, frequencia: fPer.frequencia.value, newsletter: fPer.newsletter.checked
        });
        perfil = r.perfil; $('#okPerfil').hidden = false;
      } catch (err) { mostrarErro($('#erroPerfil'), err.message); }
    });
  });
  $('#btnApagar').addEventListener('click', async () => {
    if (!confirm('Tens a certeza? A tua conta e todos os teus dados vão ser apagados.')) return;
    try { await api('DELETE', '/perfil'); sessao.limpar(); perfil = null; mostrar('inicio'); }
    catch (err) { mostrarErro($('#erroPerfil'), err.message); }
  });

  // ---------- Arranque ----------
  $('#ano').textContent = new Date().getFullYear();
  (async () => {
    if (sessao.token()) {
      try { perfil = (await api('GET', '/perfil')).perfil; } catch (e) { sessao.limpar(); }
    }
    const h = location.hash;
    mostrar(perfil ? (h === '#perfil' ? 'perfil' : 'ofertas') : h === '#entrar' || h === '#perfil' ? 'entrar' : 'inicio');
  })();
})();
