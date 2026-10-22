// Escolha das empresas parceiras (2.º visto do formulário e do perfil).
//
// A lista de setores e empresas vem do Escafandro, a mesma que o painel da Magnetik Alchemy usa.
// O OK confirma a escolha e fecha a janela; o × (ou Esc, ou clicar fora) fecha sem alterar.
// Ao reabrir, as empresas confirmadas continuam marcadas.
//
// Comportamento do visto, igual ao da Magnetik:
//   - escolher pelo menos uma empresa e carregar em OK marca o visto; nenhuma empresa desmarca-o;
//   - marcar o visto sem ter escolhido empresas escolhe todas; desmarcá-lo limpa a escolha.

(function () {
  const URL_ARVORE = 'https://escafandro.oxy-api.com/api/escafandro/term/9c24f7db-17d3-4332-aa0c-f57e4b78e2de';

  // Políticas de privacidade das empresas (cópia da lista do painel da Magnetik Alchemy).
  const POLITICAS = {
    "Acústica Médica – Hidden Hearing (Portugal) Unipessoal, LDA": "https://www.acusticamedica.pt/politica-de-privacidade",
    "Alain Afflelou Portugal, Sociedade Unipessoal, LDA": "https://www.afflelou.pt/politica-de-privacidade-contacto",
    "Amplifon Portugal S.A (Minisom)": "https://www.minisom.pt/politica-de-privacidade",
    "Armatis LC Atlantic SA": "https://www.armatis.com/pt/politique-de-confidentialite",
    "Armatis LC Portugal, LDA": "https://www.armatis.com/pt/politique-de-confidentialite",
    "Armatis LC Portugal, LDA em nome de Endesa Energia, SA – Sucursal em Portugal": "https://www.endesa.pt/politica-privacidade-cookies",
    "Armatis LC Portugal, LDA em nome de Endesa X Servicios SL – Sucursal em Portugal": "https://www.endesax.com/pt/pt/Politica-de-privacidade",
    "Armatis LC Portugal, LDA em nome de Iberdrola Clientes Portugal Unipessoal LDA": "https://www.iberdrola.pt/politica-privacidade",
    "Armatis LC Portugal, LDA em nome de Wizink Bank, SAU – Sucursal em Portugal": "https://www.wizink.pt/public/informacao-legal/protecao-de-dados",
    "Armatis LC Portugal, Lda. em nome de Deco Proteste Editores, LDA": "https://www.deco.proteste.pt/info/institucional/politica-de-privacidade",
    "Audika - Soluções Auditivas, Unipessoal Lda.": "https://www.audika.pt/politica-de-privacidade",
    "Auditiv - Empathy Voices LDA": "https://auditiv.pt/politicadeprivacidade/",
    "Bankinter Consumer Finance, EFC, SA – Sucursal em Portugal": "https://www.bankinterconsumerfinance.pt/stf/plataformas/bkcf/politica_de_protecao_dados_bkcf_web_052019.pdf",
    "CFP Data Campo": "https://datacampo.eu",
    "CIF Clube Internacional de Férias SA": "https://www.cif.pt",
    "Chubb European Group SE – Sucursal em Portugal": "https://www.chubb.com/pt-pt/footer/privacy-policy.html",
    "Cofina Media SA": "http://www.cofina.pt/site-services/privacy.aspx",
    "Connecta Avanzia 2 – Telemarketing LDA": "https://www.connecta.pt/politica-de-privacidade/",
    "Connecta Avanzia Call Center LDA": "https://www.connecta.pt/politica-de-privacidade/",
    "Connecta Avanzia Contact Solutions, LDA em nome de Endesa Energia, SA – Sucursal em Portugal": "https://www.endesa.pt/politica-privacidade-cookies",
    "Connecta Avanzia Contact Solutions, LDA em nome de Endesa X Servicios SL – Sucursal em Portugal": "https://www.endesax.com/pt/pt/Politica-de-privacidade",
    "Connecta Avanzia Contact Solutions, LDA em nome de Medicare MED&CR": "https://www.medicare.pt/politica-de-privacidade",
    "Connecta Avanzia Contact Solutions, LDA em nome de Wizink Bank, SAU – Sucursal em Portugal": "https://www.wizink.pt/public/informacao-legal/protecao-de-dados",
    "Connecta Avanzia Contact Solutions. LDA": "https://www.connecta.pt/politica-de-privacidade/",
    "Connecta Avanzia Mediação de Seguros LDA": "https://www.connecta.pt/politica-de-privacidade/",
    "Consulmark 2 – Estudos de Mercado e Trabalho de Campo LDA": "https://consulmark.pt/?p=203",
    "Deco Proteste Editores, LDA": "https://www.deco.proteste.pt/info/institucional/politica-de-privacidade",
    "Dentaldente, LDA": "https://dentaldente.com/PT/privacyinfo",
    "E.Leclerc": "https://www.e-leclerc.pt/politica-privacidade",
    "EDP Comercial Comercialização Energia SA": "https://www.edp.pt/politica-de-privacidade/",
    "Ediclube – Edição e Promoção do Livro, SA": "http://www.ediclube.com/protecaodados",
    "Endesa Energia, S.A. – Sucursal em Portugal, Quinta da Fonte, Edifício D. Manuel I, Piso 3, 2770-210 Paço de Arcos": "https://www.endesa.pt/politica-privacidade-cookies",
    "Endesa X Servicios S.L - Sucursal em Portugal, Quinta da Fonte, Edifício D. Manuel I, Piso 3, 2770-210 Paço de Arcos": "https://www.endesax.com/pt/pt/Politica-de-privacidade",
    "Ergoland, LDA (Ergovisão)": "https://www.ergovisao.pt/politica-privacidade",
    "Fitness Hut, SA": "https://www.fitnesshut.pt/politica-privacidade/",
    "Generali Seguros, SA": "https://keepwells.pt/politica-de-privacidade/",
    "Gold Energy – Comercializadora de Energia, SA": "https://goldenergy.pt/politica-de-privacidade",
    "H&W – Mediadora de Seguros, SA": "https://keepwells.pt/politica-de-tratamento/",
    "HCAS - Healthcare Assistance SA": "https://planosdesaude.pt/politica-de-privacidade",
    "ICG – Intermediários de Crédito e Gestão de Produtos Financeiros LDA": "https://intermediariosdecredito.pt/privacy-policy.html",
    "Iberdrola Clientes Portugal Unipessoal LDA": "https://www.iberdrola.pt/politica-privacidade",
    "Konecta Group": "https://www.grupokonecta.com/pt/politica-privacidad",
    "Konectanet II Mediadora de Seguros LDA": "https://www.grupokonecta.com/pt/politica-privacidad",
    "Lusosmile – Oralwest LDA": "https://lusosmile.pt/privacidade",
    "Luzboa – Comercialização de Energia, LDA": "https://luzboa.pt/contactos/",
    "Malo Clinic SA": "https://www.maloclinics.com/politica-de-privacidade",
    "Manpowergroup Portugal SGPS, SA": "https://www.manpowergroup.pt/politica-de-privacidade",
    "Medicapilar Transplantes Capilares Avançados LDA": "https://www.medicapilar.pt/politica-privacidade/",
    "Medicare MED&CR – Serviços de Gestão de Cartões de Saúde Unipessoal LDA": "https://www.medicare.pt/politica-de-privacidade",
    "Melicol, Unipessoal LDA": "https://maissaude.melicol.pt/",
    "Metlife": "https://www.metlife.pt/politica-privacidade/",
    "My Seguros SA": "https://myseguros.pt/assets/privacidade.php",
    "NOS": "https://www.nos.pt/pt/institucional/sustentabilidade/gestao-etica-e-responsavel/seguranca-e-privacidade/politica-privacidade-nos",
    "NOWO Communications, SA": "https://www.nowo.pt/politica-de-privacidade/",
    "Necomplus Portugal – Assistência e Equipamentos Informáticos, Unipessoal, LDA": "https://necomplus.com/pt-pt/politica-de-privacidade/",
    "Netsonda – Consultadoria, Sondagens e Estudos de Mercado SA": "https://www.netsonda.pt/anetsonda/contactos/",
    "O Meu Doutor – Rap – Reabilitação Auditiva Portugal, LDA": "https://omeudoutor.pt/politica-de-privacidade/",
    "Ouvidix – Sentido Astuto, LDA": "https://ouvidix.pt/politica-de-privacidade",
    "Pluricall – Contact Center Services, SA": "https://pluricall.pt/politica-de-privacidade/",
    "PrimeSmile – Ilustre Paralelo LDA": "https://www.primesmile.pt/politica-de-privacidade/",
    "Prosegur": "https://www.prosegur.pt/politicas-privacidade",
    "Remax International – Sociedade de Mediação imobiliária": "https://www.remax.pt/institucional/politicaprivacidade",
    "Rádio Popular – Electrodomésticos, SA": "https://www.radiopopular.pt/pagina/politica-de-privacidade/",
    "SAS Polygone": "https://www.polygone.fr/mentions-legales/",
    "Salesland Portugal Unipessoal LDA": "https://salesland.net/pt/politica-de-privacidade",
    "Saúde Médica (SAUMED LDA)": "https://saudemedica.pt/protecao-de-dados/",
    "Securitas Direct Portugal, Unipessoal, LDA": "https://www.securitasdirect.pt/politica-de-privacidade",
    "Securitas – Serviços e Tecnologia de Segurança, SA": "https://www.securitas.pt/stand-alone/politica-global-de-protecao-de-dados-pessoais/",
    "Servilusa Agências Funerárias SA": "https://www.servilusa.pt/pt/termos-e-condicoes-de-utilizacao",
    "Smile Up, SA": "https://smileup.pt/politica-de-privacidade/",
    "Teleperformance Portugal SA": "https://teleperformance.com/en-us/footer/data-privacy-policy/",
    "Transcom": "https://www.transcom.com/pt/insights/data-protection-notice-cookie-policy-2/",
    "Transcom em nome de Endesa Energia, SA – Sucursal em Portugal": "https://www.endesa.pt/politica-privacidade-cookies",
    "Transcom em nome de Endesa X Servicios SL – Sucursal em Portugal": "https://www.endesax.com/pt/pt/Politica-de-privacidade",
    "Transcom em nome de Wizink Bank, SAU – Sucursal em Portugal": "https://www.wizink.pt/public/informacao-legal/protecao-de-dados",
    "Trust in News, Unipessoal, LDA": "https://loja.trustinnews.pt/politica-de-privacidade/",
    "UNICEF Portugal | Comité Português para a UNICEF (Instituição de Utilidade Pública)": "https://www.unicef.pt/global-pages/politicas-de-privacidade/termos-e-condi\u00e7\u00f5es-inscri\u00e7\u00f5es-plus-donativos/",
    "Unióticas – Ergoland LDA": "https://www.unioticas.pt/documentos/politica-privacidade.pdf",
    "Ventask Contact Center Lisboa, Unipessoal LDA": "https://www.ventask.pt/politica-de-privacidade-ventask/",
    "Wall Street Institute Portugal – Centro de Inglês SA": "https://www.wsenglish.pt/pt/privacy-policy/?back=/pt/",
    "Wizink Bank, SAU – Sucursal em Portugal": "https://www.wizink.pt/public/informacao-legal/protecao-de-dados",
    "Worten": "https://www.worten.pt/politica-de-privacidade",
    "Yourvoice – Contact Solutions, LTD": "https://yourvoice.com.pt/en/privacy-policy/"
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let setores = null;        // [{ id, nome, empresas: [{ id, nome }] }]
  let aCarregar = null;
  const confirmadas = new Map(); // visto (input) -> Set de ids confirmados
  let emEdicao = new Set();
  let vistoAtual = null;

  function carregar() {
    if (setores) return Promise.resolve(setores);
    aCarregar ??= fetch(URL_ARVORE)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        setores = (d.terms?.parents || []).map(s => ({
          id: s.id, nome: s.name,
          empresas: (s.parents || []).map(e => ({ id: e.id, nome: e.name }))
        }));
        return setores;
      })
      .catch(e => { aCarregar = null; throw e; });
    return aCarregar;
  }
  const todosIds = () => setores.flatMap(s => s.empresas.map(e => e.id));
  const conjunto = visto => { if (!confirmadas.has(visto)) confirmadas.set(visto, new Set()); return confirmadas.get(visto); };

  // ---------- Janela ----------
  const modal = () => $('#modalParceiros');
  const arvore = () => $('#arvoreParceiros');

  function desenhar() {
    const total = todosIds().length;
    arvore().innerHTML = `
      <label class="parc-linha parc-todos"><input type="checkbox" data-todos> <span>Todos</span></label>
      ${setores.map(s => `
        <div class="parc-setor" data-setor="${s.id}">
          <div class="parc-linha">
            <button type="button" class="parc-expandir" aria-expanded="false" aria-controls="parcEmp${s.id}" aria-label="Ver empresas de ${esc(s.nome)}"></button>
            <label><input type="checkbox" data-setor-chk="${s.id}"> <span>${esc(s.nome)}</span></label>
            <span class="parc-contagem" data-contagem="${s.id}"></span>
          </div>
          <ul class="parc-empresas" id="parcEmp${s.id}" hidden>
            ${s.empresas.map(e => `<li class="parc-linha">
              <label><input type="checkbox" data-empresa="${e.id}"> <span>${esc(e.nome)}</span></label>
              ${POLITICAS[e.nome] ? `<a href="${esc(POLITICAS[e.nome])}" target="_blank" rel="noopener" class="parc-politica">Política de privacidade</a>` : ''}
            </li>`).join('')}
          </ul>
        </div>`).join('')}`;
    atualizar();
    arvore().dataset.total = total;
  }

  function atualizar() {
    for (const s of setores) {
      const n = s.empresas.filter(e => emEdicao.has(e.id)).length;
      const chk = $(`[data-setor-chk="${s.id}"]`, arvore());
      chk.checked = n === s.empresas.length && n > 0;
      chk.indeterminate = n > 0 && n < s.empresas.length;
      $(`[data-contagem="${s.id}"]`, arvore()).textContent = `${n}/${s.empresas.length}`;
      for (const e of s.empresas) $(`[data-empresa="${e.id}"]`, arvore()).checked = emEdicao.has(e.id);
    }
    const total = todosIds().length;
    const todos = $('[data-todos]', arvore());
    todos.checked = emEdicao.size === total && total > 0;
    todos.indeterminate = emEdicao.size > 0 && emEdicao.size < total;
  }

  async function abrir(visto) {
    vistoAtual = visto;
    modal().hidden = false;
    arvore().innerHTML = '<p class="parc-estado">A carregar as empresas…</p>';
    try { await carregar(); }
    catch (e) { arvore().innerHTML = '<p class="parc-estado">Não foi possível carregar a lista de empresas. Tenta novamente.</p>'; return; }
    emEdicao = new Set(conjunto(visto));
    desenhar();
    $('#btnParceirosOk').focus();
  }

  function fechar() { modal().hidden = true; vistoAtual = null; }

  function confirmar() {
    if (!vistoAtual) return fechar();
    const c = conjunto(vistoAtual);
    c.clear(); emEdicao.forEach(id => c.add(id));
    vistoAtual.checked = c.size > 0;
    fechar();
  }

  document.addEventListener('change', e => {
    const t = e.target;
    if (modal()?.contains(t) && setores) {
      if (t.matches('[data-todos]')) emEdicao = t.checked ? new Set(todosIds()) : new Set();
      else if (t.matches('[data-setor-chk]')) {
        const s = setores.find(x => x.id === Number(t.dataset.setorChk));
        s.empresas.forEach(x => (t.checked ? emEdicao.add(x.id) : emEdicao.delete(x.id)));
      } else if (t.matches('[data-empresa]')) {
        const id = Number(t.dataset.empresa);
        t.checked ? emEdicao.add(id) : emEdicao.delete(id);
      }
      atualizar();
      return;
    }
    // o próprio visto: marcar sem escolha = todas as empresas; desmarcar = nenhuma
    if (t.matches('input[name="parceiros"]')) {
      const c = conjunto(t);
      if (!t.checked) c.clear();
      else if (!c.size) carregar().then(() => { if (t.checked && !c.size) todosIds().forEach(id => c.add(id)); }).catch(() => {});
    }
  });

  document.addEventListener('click', e => {
    const abrirLink = e.target.closest('[data-abrir-parceiros]');
    if (abrirLink) {
      e.preventDefault();
      const visto = abrirLink.closest('.visto')?.querySelector('input[name="parceiros"]');
      if (visto) abrir(visto);
      return;
    }
    const exp = e.target.closest('.parc-expandir');
    if (exp) {
      const lista = document.getElementById(exp.getAttribute('aria-controls'));
      const aberto = exp.getAttribute('aria-expanded') === 'true';
      exp.setAttribute('aria-expanded', String(!aberto));
      lista.hidden = aberto;
      return;
    }
    if (e.target.closest('#btnParceirosOk')) return confirmar();
    if (e.target.closest('[data-fechar-modal]') || e.target.id === 'modalParceiros') fechar();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal().hidden) fechar(); });

  // Usado pelo app.js para enviar e repor a escolha
  window.oneParceiros = {
    lista: visto => [...conjunto(visto)],
    definir(visto, ids) {
      const c = conjunto(visto); c.clear();
      if (Array.isArray(ids) && ids.length) ids.forEach(id => c.add(Number(id)));
      else if (visto.checked) carregar().then(() => { if (visto.checked && !c.size) todosIds().forEach(id => c.add(id)); }).catch(() => {});
    },
    limpar: visto => conjunto(visto).clear()
  };
})();
