// Pixel da Meta e origem da visita.
// O Pixel arranca sempre revogado e só envia dados depois de o visitante aceitar os cookies de
// marketing no aviso do Consent Studio. O evento Lead do registo é disparado em app.js, com o
// mesmo eventID que a API envia pela API de Conversões (a Meta conta-o uma vez só).
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('consent', 'revoke');
fbq('init', '1967977523602772');
fbq('track', 'PageView');

function marketingAceite() {
  try { return window.consentStudio.api.consentState.hasMarketing() === true; } catch (e) { return false; }
}

(function () {
  var dado = false;
  function sincronizar() {
    var sim = marketingAceite();
    if (sim === dado) return;
    dado = sim;
    fbq('consent', sim ? 'grant' : 'revoke');
  }
  ['consent-studio__init', 'consent-studio__updated', 'consent-studio__updated__granted__marketing',
    'consent-studio__updated__denied__marketing', 'load'].forEach(function (ev) {
    addEventListener(ev, function () { sincronizar(); setTimeout(sincronizar, 500); });
  });
  // o Consent Studio pode ler o consentimento guardado depois do load: confirma durante uns segundos
  var n = 0, t = setInterval(function () { sincronizar(); if (++n >= 10) clearInterval(t); }, 1000);

  // origem da visita (utm_*, fbclid, adsid): guardada na primeira página da sessão e enviada com o registo
  var CHAVES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'adsid'];
  var q = new URLSearchParams(location.search), o = {};
  CHAVES.forEach(function (k) {
    var v = q.get(k);
    if (v && /^[\w.~:+|{}\- ]{1,150}$/.test(v)) o[k] = v;
  });
  try {
    if (Object.keys(o).length && !sessionStorage.getItem('one_origem')) {
      sessionStorage.setItem('one_origem', JSON.stringify(o));
    }
  } catch (e) { /* modo privado */ }
})();

function origemVisita() {
  try { return JSON.parse(sessionStorage.getItem('one_origem')) || null; } catch (e) { return null; }
}

function cookie(nome) {
  var m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
