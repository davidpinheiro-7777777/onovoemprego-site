// Páginas d'O Próximo Passo: a primeira metade do artigo é pública; com sessão iniciada junta a
// segunda metade (vem da API); sem sessão mostra o convite para criar perfil ou entrar, e volta a
// este artigo depois de entrar.

(function () {
  const API = (window.ONE_CONFIG && window.ONE_CONFIG.api) || '';
  const artigo = document.querySelector('[data-slug]');
  const corpo = document.getElementById('artigoCorpo');
  const bloqueio = document.getElementById('artigoBloqueio');
  if (!artigo || !corpo) return;

  let token = null;
  try { token = localStorage.getItem('otne_token'); } catch (e) { /* modo privado */ }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-voltar]')) {
      try { sessionStorage.setItem('one_voltar', location.pathname); } catch (err) { /* modo privado */ }
    }
  });

  if (!token) return; // fica o convite

  const aberto = document.getElementById('artigoAberto');
  bloqueio.hidden = true;
  if (aberto) aberto.classList.add('artigo-continua');
  corpo.innerHTML = '<p class="artigo-a-carregar">A carregar o artigo…</p>';
  fetch(`${API}/api/artigos/${encodeURIComponent(artigo.dataset.slug)}`, { headers: { authorization: `Bearer ${token}` } })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(d => { corpo.innerHTML = d.html; })
    .catch(estado => {
      corpo.innerHTML = '';
      if (estado === 401) { try { localStorage.removeItem('otne_token'); } catch (e) { /* modo privado */ } }
      else corpo.innerHTML = '<p class="artigo-a-carregar">Não foi possível carregar o artigo. Tenta novamente daqui a pouco.</p>';
      bloqueio.hidden = estado !== 401;
      if (aberto && estado === 401) aberto.classList.remove('artigo-continua');
    });
})();
