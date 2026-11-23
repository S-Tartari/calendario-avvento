(function () {
  "use strict";

  const ANNO = 2026;
  const ULTIMO_GIORNO = 24;
  const MS_GIORNO = 24 * 60 * 60 * 1000;

  const el = {
    biglietto: document.getElementById("biglietto"),
    data: document.getElementById("biglietto-data"),
    titolo: document.getElementById("biglietto-titolo"),
    testo: document.getElementById("biglietto-testo"),
    griglia: document.getElementById("griglia"),
    avviso: document.getElementById("avviso"),
  };

  let sbloccatoCorrente = null;

  /*
   * Data di oggi.
   * Solo in locale (file aperto dal computer o localhost) puoi simulare
   * un altro giorno per provare la pagina: index.html?data=2026-12-05
   * Online il parametro viene ignorato, quindi non si può "barare".
   */
  function dataCorrente() {
    const inLocale =
      location.protocol === "file:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    const simulata = new URLSearchParams(location.search).get("data");

    if (inLocale && simulata && /^\d{4}-\d{2}-\d{2}$/.test(simulata)) {
      const [a, m, g] = simulata.split("-").map(Number);
      return new Date(a, m - 1, g);
    }
    return new Date();
  }

  // Ultima casella apribile: 0 = nessuna, 24 = tutte
  function ultimoGiornoSbloccato(data) {
    const anno = data.getFullYear();
    if (anno > ANNO) return ULTIMO_GIORNO;
    if (anno < ANNO || data.getMonth() < 11) return 0;
    return Math.min(data.getDate(), ULTIMO_GIORNO);
  }

  // Numero della casella di oggi, oppure null se oggi non è tra l'1 e il 24 dicembre
  function giornoDiOggi(data) {
    const valido =
      data.getFullYear() === ANNO &&
      data.getMonth() === 11 &&
      data.getDate() <= ULTIMO_GIORNO;
    return valido ? data.getDate() : null;
  }

  // "il 5 dicembre", ma "l'8 dicembre" e "l'11 dicembre"
  function ilGiorno(giorno) {
    return (giorno === 8 || giorno === 11 ? "l'" : "il ") + giorno + " dicembre";
  }

  function giorniAlPrimoDicembre(data) {
    const oggi = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const primo = new Date(ANNO, 11, 1);
    return Math.round((primo - oggi) / MS_GIORNO);
  }

  function riempiBiglietto(dataTesto, titolo, testo, spostaFocus) {
    el.data.textContent = dataTesto;
    el.titolo.textContent = titolo;
    el.testo.textContent = testo;

    // Riavvia l'animazione di apertura
    el.biglietto.classList.remove("rivela");
    void el.biglietto.offsetWidth;
    el.biglietto.classList.add("rivela");

    if (spostaFocus) {
      el.titolo.focus({ preventScroll: true });
      el.biglietto.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function mostraGiorno(giorno, oggi, spostaFocus) {
    const voce = TESTI[giorno] || {};
    const etichetta = giorno + " dicembre" + (giorno === oggi ? " · oggi" : "");
    riempiBiglietto(
      etichetta,
      voce.titolo || "Giorno " + giorno,
      voce.testo || "Il biglietto di oggi è ancora in arrivo…",
      spostaFocus
    );

    el.griglia.querySelectorAll(".casella").forEach(function (casella) {
      if (Number(casella.dataset.giorno) === giorno) {
        casella.setAttribute("aria-current", "true");
      } else {
        casella.removeAttribute("aria-current");
      }
    });
  }

  function mostraAttesa(data) {
    const n = giorniAlPrimoDicembre(data);
    riempiBiglietto(
      "Pazienza…",
      n === 1 ? "Manca 1 giorno" : "Mancano " + n + " giorni",
      "Il 1° dicembre si aprirà la prima casella.\nOgni giorno un piccolo pensiero, fino alla vigilia di Natale.",
      false
    );
  }

  function creaCasella(giorno, sbloccato, oggi) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "casella";
    btn.dataset.giorno = String(giorno);

    const numero = document.createElement("span");
    numero.textContent = String(giorno);
    btn.append(numero);

    const extra = document.createElement("span");
    extra.className = "casella-extra";
    extra.setAttribute("aria-hidden", "true");

    if (giorno > sbloccato) {
      btn.classList.add("chiusa");
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("aria-label", "Giorno " + giorno + ", si apre " + ilGiorno(giorno));
      extra.classList.add("lucchetto");
      extra.textContent = "🔒";
    } else if (giorno === oggi) {
      btn.classList.add("oggi");
      btn.setAttribute("aria-label", "Giorno " + giorno + ", oggi. Apri il biglietto");
      extra.textContent = "oggi";
    } else {
      btn.classList.add("aperta");
      btn.setAttribute("aria-label", "Giorno " + giorno + ". Riapri il biglietto");
    }

    btn.append(extra); // sempre presente, anche vuoto, per tenere i numeri allineati
    li.append(btn);
    return li;
  }

  function disegna() {
    const ora = dataCorrente();
    const sbloccato = ultimoGiornoSbloccato(ora);
    const oggi = giornoDiOggi(ora);
    sbloccatoCorrente = sbloccato;

    const caselle = [];
    for (let g = 1; g <= ULTIMO_GIORNO; g++) {
      caselle.push(creaCasella(g, sbloccato, oggi));
    }
    el.griglia.replaceChildren.apply(el.griglia, caselle);
    el.avviso.textContent = "";

    if (sbloccato === 0) {
      mostraAttesa(ora);
    } else {
      mostraGiorno(sbloccato, oggi, false);
    }
  }

  el.griglia.addEventListener("click", function (evento) {
    const casella = evento.target.closest(".casella");
    if (!casella) return;
    const giorno = Number(casella.dataset.giorno);

    if (casella.classList.contains("chiusa")) {
      el.avviso.textContent = "Non ancora! La casella " + giorno + " si apre " + ilGiorno(giorno) + ".";
      casella.classList.remove("scuoti");
      void casella.offsetWidth;
      casella.classList.add("scuoti");
      return;
    }

    el.avviso.textContent = "";
    mostraGiorno(giorno, giornoDiOggi(dataCorrente()), true);
  });

  // Se la pagina resta aperta, a mezzanotte si aggiorna da sola
  function programmaMezzanotte() {
    const ora = new Date();
    const domani = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate() + 1, 0, 0, 5);
    setTimeout(function () {
      disegna();
      programmaMezzanotte();
    }, domani - ora);
  }

  // Quando lei torna sulla scheda (es. il giorno dopo), aggiorna solo se è cambiato il giorno
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && ultimoGiornoSbloccato(dataCorrente()) !== sbloccatoCorrente) {
      disegna();
    }
  });

  function creaNeve() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const contenitore = document.querySelector(".neve");
    for (let i = 0; i < 40; i++) {
      const fiocco = document.createElement("span");
      const misura = 3 + Math.random() * 5;
      fiocco.className = "fiocco";
      fiocco.style.left = Math.random() * 100 + "%";
      fiocco.style.width = misura + "px";
      fiocco.style.height = misura + "px";
      fiocco.style.opacity = String(0.3 + Math.random() * 0.6);
      fiocco.style.animationDuration = 8 + Math.random() * 10 + "s";
      fiocco.style.animationDelay = -Math.random() * 18 + "s";
      contenitore.append(fiocco);
    }
  }

  creaNeve();
  disegna();
  programmaMezzanotte();
})();
