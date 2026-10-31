// Página privada de estatísticas: entra com um código enviado por email (só os emails autorizados na API
// o recebem), guarda o token de 30 dias e mostra os números.
(function () {
  var API = window.ONE_CONFIG.api;
  var CHAVE = 'one_estatisticas';
  var $ = function (id) { return document.getElementById(id); };
  var num = function (n) { return Number(n || 0).toLocaleString('pt-PT'); };
  var pct = function (a, b) { return b ? Math.round((a / b) * 100) + '%' : '—'; };

  function token(valor) {
    try {
      if (valor === null) localStorage.removeItem(CHAVE);
      else if (valor) localStorage.setItem(CHAVE, valor);
      return localStorage.getItem(CHAVE);
    } catch (e) { return token.memoria = valor === undefined ? token.memoria : valor; }
  }

  var emailPendente = null;
  function mostrarEntrar(msg) {
    $('painel').hidden = true; $('entrar').hidden = false;
    $('btnSair').hidden = $('btnActualizar').hidden = true;
    $('formEmail').hidden = !!emailPendente; $('formCodigo').hidden = !emailPendente;
    $(emailPendente ? 'erroCodigo' : 'erroEmail').textContent = msg || '';
  }

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function barras(id, lista, rotulo) {
    var ul = $(id); ul.replaceChildren();
    if (!lista.length) { ul.append(el('p', 'vazio', 'Ainda sem dados.')); return; }
    var max = Math.max.apply(null, lista.map(function (x) { return x.n; })) || 1;
    lista.forEach(function (x) {
      var li = el('li'), trilho = el('div', 'trilho'), barra = el('span');
      barra.style.width = (x.n ? Math.max(2, (x.n / max) * 100) : 0) + '%';
      trilho.append(barra);
      li.append(el('span', 'nome', x.nome), el('span', 'valor', rotulo ? rotulo(x) : num(x.n)), trilho);
      li.title = x.nome + ': ' + (rotulo ? rotulo(x) : num(x.n));
      ul.append(li);
    });
  }

  var dica = null;
  function mostrarDica(ev, texto) {
    if (!dica) { dica = el('div', 'dica'); document.body.append(dica); }
    dica.textContent = texto; dica.hidden = false;
    var r = ev.currentTarget.getBoundingClientRect();
    dica.style.left = Math.min(window.innerWidth - dica.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - dica.offsetWidth / 2)) + 'px';
    dica.style.top = (r.top - dica.offsetHeight - 8) + 'px';
  }
  function esconderDica() { if (dica) dica.hidden = true; }

  function diaCurto(d) { var p = d.split('-'); return p[2] + '/' + p[1]; }

  function colunas(lista) {
    var caixa = $('porDia'); caixa.replaceChildren();
    var max = Math.max.apply(null, lista.map(function (d) { return d.confirmados + d.porConfirmar; })) || 1;
    lista.forEach(function (d) {
      var c = el('div', 'coluna'), texto = diaCurto(d.dia) + ': ' + d.confirmados + ' confirmados, ' + d.porConfirmar + ' por confirmar';
      c.tabIndex = 0; c.setAttribute('role', 'listitem'); c.setAttribute('aria-label', texto);
      [[d.confirmados, 'var(--azul-600)'], [d.porConfirmar, 'var(--azul-300)']].forEach(function (s) {
        if (!s[0]) return;
        var b = el('span'); b.style.height = (s[0] / max) * 100 + '%'; b.style.background = s[1];
        c.append(b);
      });
      c.addEventListener('mouseenter', function (e) { mostrarDica(e, texto); });
      c.addEventListener('focus', function (e) { mostrarDica(e, texto); });
      c.addEventListener('mouseleave', esconderDica);
      c.addEventListener('blur', esconderDica);
      caixa.append(c);
    });
    $('porDiaEixo').replaceChildren(el('span', null, diaCurto(lista[0].dia)), el('span', null, diaCurto(lista[lista.length - 1].dia)));
  }

  function mostrar(d) {
    var u = d.utilizadores;
    $('gerado').textContent = 'Actualizado às ' + new Date(d.geradoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    var kpis = [
      [u.confirmados, 'utilizadores confirmados'],
      [u.hoje, 'novos hoje'],
      [u.ultimos7, 'novos nos últimos 7 dias'],
      [u.ultimos30, 'novos nos últimos 30 dias'],
      [u.porConfirmar, 'por confirmar (' + pct(u.confirmados, u.confirmados + u.porConfirmar) + ' confirmam)'],
      [u.comAlertas, 'com alertas ligados (' + pct(u.comAlertas, u.confirmados) + ')'],
      [u.comParceiros, 'aceitaram parceiros (' + pct(u.comParceiros, u.confirmados) + ')'],
      [d.ofertas.cliques, 'cliques em ofertas']
    ];
    $('kpis').replaceChildren.apply($('kpis'), kpis.map(function (k) {
      var div = el('div', 'kpi'); div.append(el('b', null, num(k[0])), el('span', null, k[1])); return div;
    }));
    colunas(d.porDia);
    barras('origens', d.origens);
    barras('distritos', d.distritos);
    barras('categorias', d.categorias);
    barras('idades', d.idades);
    barras('generos', d.generos);
    barras('parcerias', d.parcerias || []);
    $('notaOfertas').textContent = num(d.ofertas.activas) + ' ofertas activas · ' + num(d.ofertas.cliques) + ' cliques.';
    barras('fontes', d.ofertas.porFonte.map(function (f) { return { nome: f.fonte, n: f.total, cliques: f.cliques }; }),
      function (x) { return num(x.n) + ' · ' + num(x.cliques) + ' cliques'; });
    $('entrar').hidden = true; $('painel').hidden = false;
    $('btnSair').hidden = $('btnActualizar').hidden = false;
  }

  // quem já entrou no site com um email autorizado não precisa de pedir código
  function sessaoDoSite() { try { return localStorage.getItem('otne_token'); } catch (e) { return null; } }

  function carregar() {
    var t = token() || sessaoDoSite();
    if (!t) return mostrarEntrar();
    return fetch(API + '/api/estatisticas', { headers: { Authorization: 'Bearer ' + t } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, estado: r.status, j: j }; }); })
      .then(function (r) {
        if (r.estado === 401 || r.estado === 403) {
          // a sessão do site não serve aqui: pede o código, sem mostrar erro
          var eraDoSite = !token();
          token(null);
          return mostrarEntrar(eraDoSite ? '' : r.j.erro);
        }
        if (!r.ok) throw new Error(r.j.erro);
        mostrar(r.j);
      })
      .catch(function () { mostrarEntrar('Não foi possível carregar. Tenta dentro de instantes.'); });
  }

  function enviar(caminho, corpo, form, depois) {
    var botao = form.querySelector('button[type=submit]');
    botao.disabled = true;
    fetch(API + caminho, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) { return r.ok ? depois(r.j) : mostrarEntrar(r.j.erro || 'Não foi possível continuar.'); })
      .catch(function () { mostrarEntrar('Não foi possível continuar. Tenta dentro de instantes.'); })
      .finally(function () { botao.disabled = false; });
  }

  $('formEmail').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = e.target.email.value.trim().toLowerCase();
    enviar('/api/estatisticas/codigo', { email: email }, e.target, function () {
      emailPendente = email;
      $('subEntrar').textContent = 'Se ' + email + ' tiver acesso, enviámos-lhe um código de 6 dígitos.';
      mostrarEntrar();
      $('formCodigo').codigo.focus();
    });
  });
  $('formCodigo').addEventListener('submit', function (e) {
    e.preventDefault();
    enviar('/api/estatisticas/entrar', { email: emailPendente, codigo: e.target.codigo.value.trim() }, e.target, function (j) {
      token(j.token); emailPendente = null; e.target.reset();
      return carregar();
    });
  });
  $('btnOutroEmail').addEventListener('click', function () {
    emailPendente = null; $('formCodigo').reset();
    $('subEntrar').textContent = 'Página privada. Indica o teu email e enviamos-te um código de entrada.';
    mostrarEntrar();
  });
  $('btnSair').addEventListener('click', function () { token(null); emailPendente = null; mostrarEntrar(); });
  $('btnActualizar').addEventListener('click', carregar);

  carregar();
})();
