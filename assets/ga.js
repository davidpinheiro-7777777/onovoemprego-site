/* Google Analytics 4: só carrega depois de o visitante aceitar cookies de estatística no Consent Studio.
 * O ID de medição vem do atributo data-id da tag <script>. Antes do consentimento não se carrega
 * nada da Google nem se grava nenhum cookie; os eventos ficam em espera e seguem se o consentimento chegar.
 * Uso nas páginas: window.ga4.evento("nome", { parametro: "valor" }). */
(function () {
  "use strict";
  var script = document.currentScript;
  var id = script && script.dataset ? script.dataset.id : null;
  var carregado = false;
  var pendentes = [];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function temEstatistica() {
    try { return window.consentStudio.api.consentState.hasAnalytics() === true; } catch (e) { return false; }
  }

  function carregar() {
    if (carregado || !id || !temEstatistica()) return;
    carregado = true;
    window.gtag = gtag;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", id);
    while (pendentes.length) gtag.apply(null, pendentes.shift());
  }

  // O Consent Studio comunica as escolhas pelo Google Consent Mode (dataLayer): cada "consent" volta a verificar.
  var original = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    var r = original.apply(null, arguments);
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (a && a[0] === "consent") { setTimeout(carregar, 0); break; }
    }
    return r;
  };

  // Avisos do próprio Consent Studio (continuam a chegar depois de o gtag.js tomar conta do dataLayer).
  ["consent-studio__init", "consent-studio__updated", "load"].forEach(function (ev) {
    window.addEventListener(ev, function () { carregar(); setTimeout(carregar, 500); });
  });

  window.ga4 = {
    evento: function (nome, parametros) {
      if (!id) return;
      var args = ["event", nome, parametros || {}];
      if (carregado) gtag.apply(null, args);
      else pendentes.push(args);
    },
  };

  carregar();
})();
