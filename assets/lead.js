// Envio de cada registo para o Escafandro (sistema de leads da Oxy).
// O c_id é fixo desta campanha e nunca vem do URL; do URL só se lê o adsid.
var LEAD = {
  url: 'https://escafandro.oxy-api.com/api/escafandro/lead',
  c_id: 'c5e65631-fd54-473f-911d-e346936ec0a8'
};
(function () {
  var srcs = [location.search];
  try { if (top !== self) srcs.push(top.location.search); } catch (_) {}
  var ok = /^[A-Za-z0-9_-]{1,128}$/;
  srcs.forEach(function (s) {
    var a = new URLSearchParams(s).get('adsid');
    if (a && ok.test(a)) LEAD.adsid = a;
  });
})();

// Devolve uma promessa que resolve com true (2xx) ou false (erro de rede ou não-2xx).
function enviarLead(f, categorias) {
  var val = function (n) { return (f.elements[n].value || '').trim(); };
  var body = {
    nome: val('nome'),
    apelido: val('apelido'),
    genero: val('genero'),
    nascimento: val('nascimento'),
    telefone: val('telefone').replace(/\s+/g, ''),
    cp: val('cp'),
    email: val('email').toLowerCase(),
    categorias: categorias,
    consentimento: true,
    parceiros: f.elements.parceiros.checked,
    c_id: LEAD.c_id,
    adsid: LEAD.adsid // undefined -> omitido pelo JSON.stringify
  };
  return fetch(LEAD.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    keepalive: true
  }).then(function (r) { return r.ok; }, function () { return false; });
}
