#!/usr/bin/env node
/**
 * Hakee lasten joukkueiden ottelut Koripalloliiton tulospalvelun julkisista
 * kalenterisyötteistä ja rakentaa niistä yhden sivun, yhden kalenterin ja
 * koneluettavan JSON-tiedoston kansioon docs/.
 *
 * Käyttö:
 *   node hae.js            normaali ajo
 *   node hae.js --probe    tulostaa yhden tapahtuman raakana tarkistusta varten
 *
 * Ei ulkoisia riippuvuuksia. Vaatii Node 18 tai uudemman.
 */

const fs = require("fs");
const path = require("path");

const JUURI = __dirname;
const ULOS = path.join(JUURI, "docs");
const PROBE = process.argv.includes("--probe");

const { teemaCss } = require("./teemat");
const KONFIG = process.env.KONFIG || "joukkueet.json";
const asetukset = JSON.parse(fs.readFileSync(path.join(JUURI, KONFIG), "utf8"));
const TZ = asetukset.aikavyohyke || "Europe/Helsinki";

/* ---------------------------------------------------------------- apurit */

const pad = (n) => String(n).padStart(2, "0");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Kalenteripäivä (YYYY-MM-DD) Suomen aikaa, annetun hetken perusteella.
function paivaTZ(d) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function kelloTZ(d) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
}

function paivaSiirtymalla(paivia) {
  return paivaTZ(new Date(Date.now() + paivia * 86400000));
}

/* ------------------------------------------------------ kalenterin luku */

// Poistaa iCalendarin rivinjatkeet (rivi alkaa välilyönnillä tai tabilla).
function pura(teksti) {
  return teksti.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function poistaEscapet(arvo) {
  return arvo
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Pilkkoo VEVENT-lohkot ja palauttaa kunkin ominaisuudet objektina.
function lueTapahtumat(ics) {
  const tapahtumat = [];
  const lohkot = pura(ics).split("BEGIN:VEVENT").slice(1);

  for (const lohko of lohkot) {
    const runko = lohko.split("END:VEVENT")[0];
    const tapahtuma = {};
    for (const rivi of runko.split("\n")) {
      const kaksoispiste = rivi.indexOf(":");
      if (kaksoispiste < 1) continue;
      const vasen = rivi.slice(0, kaksoispiste);
      const arvo = rivi.slice(kaksoispiste + 1).trim();
      const [nimi, ...parametrit] = vasen.split(";");
      tapahtuma[nimi.toUpperCase()] = {
        arvo: poistaEscapet(arvo),
        parametrit: Object.fromEntries(
          parametrit.map((p) => {
            const [k, v] = p.split("=");
            return [k.toUpperCase(), (v || "").replace(/"/g, "")];
          })
        ),
      };
    }
    if (tapahtuma.DTSTART) tapahtumat.push(tapahtuma);
  }
  return tapahtumat;
}

// Etsii sen hetken, jolloin annettu seinäkelloaika osuu annetulle vyöhykkeelle.
function seinakelloUTC(v, k, p, t, m, tz) {
  let arvaus = Date.UTC(v, k - 1, p, t, m);
  for (let i = 0; i < 2; i++) {
    const osat = new Intl.DateTimeFormat("sv-SE", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date(arvaus));
    const hae = (tyyppi) => Number(osat.find((o) => o.type === tyyppi).value);
    const toteutunut = Date.UTC(hae("year"), hae("month") - 1, hae("day"), hae("hour"), hae("minute"));
    arvaus += Date.UTC(v, k - 1, p, t, m) - toteutunut;
  }
  return new Date(arvaus);
}

function lueAika(kentta) {
  const arvo = kentta.arvo;
  const osat = arvo.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!osat) return null;
  const [, v, k, p, t = "00", m = "00", , zulu] = osat;
  const luvut = [Number(v), Number(k), Number(p), Number(t), Number(m)];
  if (zulu) return new Date(Date.UTC(luvut[0], luvut[1] - 1, luvut[2], luvut[3], luvut[4]));
  // Ilman Z-merkintää aika on paikallista, joko annetulla tai oletusvyöhykkeellä.
  return seinakelloUTC(...luvut, kentta.parametrit.TZID || TZ);
}

/* -------------------------------------------- käsin lisätyt tiedot */

function lueTiedostoJosOn(nimi) {
  const polku = path.join(JUURI, nimi);
  return fs.existsSync(polku) ? fs.readFileSync(polku, "utf8") : "";
}

// lisapelit.txt: yksi peli kerrallaan "avain: arvo" -riveinä, pelit erotettu
// tyhjällä rivillä. Rivien järjestyksellä ei ole väliä ja # aloittaa kommentin.
function lueLisapelit() {
  const teksti = lueTiedostoJosOn("lisapelit.txt");
  if (!teksti.trim()) return [];

  // Pelit erotetaan tyhjällä rivillä, mutta myös uusi "lapsi:" aloittaa uuden
  // pelin — näin unohtunut tyhjä rivi ei sulauta kahta peliä yhdeksi.
  const lohkot = [];
  let nykyinen = {};
  for (const rivi of teksti.split("\n")) {
    const puhdas = rivi.trim();
    if (!puhdas || puhdas.startsWith("#")) {
      if (!puhdas && Object.keys(nykyinen).length) { lohkot.push(nykyinen); nykyinen = {}; }
      continue;
    }
    const jako = puhdas.indexOf(":");
    if (jako < 1) continue;
    const avain = puhdas.slice(0, jako).trim().toLowerCase();
    if (avain === "lapsi" && nykyinen.lapsi) { lohkot.push(nykyinen); nykyinen = {}; }
    nykyinen[avain] = puhdas.slice(jako + 1).trim();
  }
  if (Object.keys(nykyinen).length) lohkot.push(nykyinen);

  const ottelut = [];
  for (const kentat of lohkot) {
    if (!kentat.lapsi || !kentat.alkaa) {
      if (Object.keys(kentat).length) {
        console.error(`lisapelit.txt: ohitettiin lohko, josta puuttuu lapsi tai alkaa (${JSON.stringify(kentat).slice(0, 80)}…).`);
      }
      continue;
    }

    const aika = kentat.alkaa.match(/^(\d{4})-(\d{2})-(\d{2})[ T]+(\d{1,2})[:.](\d{2})/);
    if (!aika) {
      console.error(`lisapelit.txt: en ymmärrä aikaa "${kentat.alkaa}". Odotettu muoto 2026-10-24 14:30.`);
      continue;
    }
    const alku = seinakelloUTC(+aika[1], +aika[2], +aika[3], +aika[4], +aika[5], TZ);
    const koti = kentat.koti || "";
    const vieras = kentat.vieras || "";

    ottelut.push({
      match_id: "",
      alku: alku.toISOString(),
      paiva: paivaTZ(alku),
      kello: kelloTZ(alku),
      koti, vieras,
      sarja: kentat.sarja || "",
      halli: kentat.paikka || "",
      linkki: kentat.linkki || "",
      lapsi: kentat.lapsi,
      joukkue: kentat.joukkue || "",
      omaKotona: kentat.oma ? kentat.oma === koti : null,
      kesto: Number(kentat.kesto) > 0 ? Number(kentat.kesto) : null,
      kasin: true,
    });
  }
  return ottelut;
}

// poissa.txt: yksi rivi per peli, "PÄIVÄMÄÄRÄ [KELLO] NIMI".
function luePoissa() {
  const teksti = lueTiedostoJosOn("poissa.txt");
  const merkinnat = [];
  for (const rivi of teksti.split("\n")) {
    const puhdas = rivi.trim();
    if (!puhdas || puhdas.startsWith("#")) continue;
    const osat = puhdas.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?\s+(.+?)\s*$/);
    if (!osat) {
      console.error(`poissa.txt: en ymmärrä riviä "${puhdas}".`);
      continue;
    }
    merkinnat.push({
      paiva: osat[1],
      kello: osat[2] ? `${pad(osat[2])}:${osat[3]}` : "",
      lapsi: osat[4],
    });
  }
  return merkinnat;
}

// tulokset.txt: yksi rivi per peli.
//   PÄIVÄMÄÄRÄ [KELLO] KOTI-VIERAS [NIMI] [| muistiinpano]
function lueTulokset() {
  const teksti = lueTiedostoJosOn("tulokset.txt");
  const rivit = [];
  for (const rivi of teksti.split("\n")) {
    let puhdas = rivi.trim();
    if (!puhdas || puhdas.startsWith("#")) continue;

    // Verkko-osoite saa olla rivillä missä kohtaa tahansa: se poimitaan pois
    // ennen muuta jäsentämistä ja liitetään ottelun linkiksi.
    let linkki = "";
    const osoite = puhdas.match(/\bhttps?:\/\/[^\s|]+/);
    if (osoite) {
      linkki = osoite[0].replace(/[.,;]+$/, "");
      puhdas = (puhdas.slice(0, osoite.index) + puhdas.slice(osoite.index + osoite[0].length))
        .replace(/\s+/g, " ").replace(/\|\s*$/, "").trim();
    }

    const osat = puhdas.match(
      /^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?\s+(\d{1,3})\s*[-–—]\s*(\d{1,3})(?:\s+([^\s|]+))?\s*(?:\|\s*(.*))?$/
    );
    if (!osat) {
      console.error(`tulokset.txt: en ymmärrä riviä "${rivi.trim()}".`);
      continue;
    }
    rivit.push({
      paiva: osat[1],
      kello: osat[2] ? `${pad(osat[2])}:${osat[3]}` : "",
      koti: Number(osat[4]),
      vieras: Number(osat[5]),
      lapsi: osat[6] || "",
      muistiinpano: (osat[7] || "").trim(),
      linkki,
    });
  }
  return rivit;
}

/* ------------------------------------------------------------- arkisto */

// Tulospalvelun kalenterisyötteissä on vain tulevia otteluita: pelattu ottelu
// katoaa syötteestä kokonaan. Siksi jokainen kerran nähty ottelu tallennetaan
// tänne, jotta mennyt kausi säilyy.
const ARKISTO = path.join(ULOS, "historia.json");

function otteluTunnus(o) {
  return `${o.match_id || `${o.paiva} ${o.kello} ${o.koti}`}|${o.lapsi}|${o.joukkue}`;
}

function lueArkisto() {
  try {
    const data = JSON.parse(fs.readFileSync(ARKISTO, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function kirjoitaArkisto(arkisto) {
  const jarjestetty = {};
  for (const avain of Object.keys(arkisto).sort((a, b) =>
    (arkisto[a].alku || "").localeCompare(arkisto[b].alku || "")
  )) {
    jarjestetty[avain] = arkisto[avain];
  }
  fs.writeFileSync(ARKISTO, JSON.stringify(jarjestetty, null, 1));
}

/* -------------------------------------------------------- normalisointi */

// SUMMARY on muotoa "Kotijoukkue – Vierasjoukkue, Sarjan nimi".
// Sarja saadaan luotettavammin CATEGORIES-kentästä, joten se leikataan pois.
function jaaJoukkueet(summary, sarja) {
  let teksti = summary;
  if (sarja && teksti.endsWith(`, ${sarja}`)) {
    teksti = teksti.slice(0, -(sarja.length + 2));
  }
  const jako = teksti.split(/\s+[–—-]\s+/);
  if (jako.length >= 2) {
    return { koti: jako[0].trim(), vieras: jako.slice(1).join(" - ").trim() };
  }
  return { koti: teksti.trim(), vieras: "" };
}

function matchId(tapahtuma) {
  const url = tapahtuma.URL?.arvo || tapahtuma.DESCRIPTION?.arvo || "";
  const urlOsuma = url.match(/\/match\/(\d+)/);
  if (urlOsuma) return urlOsuma[1];
  const uidOsuma = (tapahtuma.UID?.arvo || "").match(/^(\d+)/);
  return uidOsuma ? uidOsuma[1] : "";
}

// Syöte ei kerro kumpi joukkue on "meidän", mutta se toistuu joka ottelussa.
function paatteleOmaJoukkue(ottelut) {
  const laskuri = new Map();
  for (const o of ottelut) {
    for (const nimi of [o.koti, o.vieras]) {
      if (nimi) laskuri.set(nimi, (laskuri.get(nimi) || 0) + 1);
    }
  }
  let paras = "";
  let eniten = 0;
  for (const [nimi, määrä] of laskuri) {
    if (määrä > eniten) { paras = nimi; eniten = määrä; }
  }
  // Yhden ottelun perusteella ei voi päätellä mitään.
  return eniten >= 2 ? paras : "";
}

/* ------------------------------------------------------------------ HTML */

const KUUKAUDET = ["tammikuuta","helmikuuta","maaliskuuta","huhtikuuta","toukokuuta","kesäkuuta",
  "heinäkuuta","elokuuta","syyskuuta","lokakuuta","marraskuuta","joulukuuta"];
const VIIKONPAIVAT = ["sunnuntaina","maanantaina","tiistaina","keskiviikkona","torstaina","perjantaina","lauantaina"];

function pitkaPaiva(iso) {
  const [v, k, p] = iso.split("-").map(Number);
  if (!v) return iso;
  const d = new Date(Date.UTC(v, k - 1, p));
  return `${VIIKONPAIVAT[d.getUTCDay()]} ${p}. ${KUUKAUDET[k - 1]}`;
}

function tunnisteeksi(nimi) {
  return String(nimi).toLowerCase()
    .replace(/[äå]/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Palauttaa true jos oma joukkue voitti, false jos hävisi, null jos ei tiedetä.
function voittiko(o) {
  if (o.pisteetKoti === undefined || o.omaKotona === null || o.omaKotona === undefined) return null;
  if (o.pisteetKoti === o.pisteetVieras) return null;
  const kotiVoitti = o.pisteetKoti > o.pisteetVieras;
  return o.omaKotona ? kotiVoitti : !kotiVoitti;
}

function ottelukortti(o, varit) {
  const v = varit[o.lapsi] || { vaalea: "#444", tumma: "#bbb" };

  const kartta = o.halli
    ? `<a class="halli" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.halli)}">${esc(o.halli)}</a>`
    : "";

  const seuraa = o.linkki
    ? `<a class="seuraa" target="_blank" rel="noopener" href="${esc(o.linkki)}">${
        o.mennyt ? "Ottelutilastot" : "Seuraa peliä livenä"
      } <span aria-hidden="true">&rarr;</span></a>`
    : "";

  const kotiLuokka = o.omaKotona === true ? ' class="oma"' : "";
  const vierasLuokka = o.omaKotona === false ? ' class="oma"' : "";

  return `
      <article class="ottelu${o.poissa ? " poissa" : ""}" data-lapsi="${esc(o.lapsi)}" data-alku="${esc(o.alku)}" data-kesto="${o.kesto || ""}" data-paivateksti="${esc(pitkaPaiva(o.paiva))}" data-tuleva="${o.mennyt ? "0" : "1"}"${o.poissa ? ' data-poissa="1"' : ""} style="--vaalea:${v.vaalea};--tumma:${v.tumma}">
        <div class="kello">${esc(o.kello)}</div>
        <div class="tiedot">
          <div class="lapsi">${esc(o.lapsi)}${o.joukkue ? ` &middot; ${esc(o.joukkue)}` : ""}</div>
          <div class="joukkueet"><span${kotiLuokka}>${esc(o.koti)}</span> <span class="vs">&ndash;</span> <span${vierasLuokka}>${esc(o.vieras)}</span></div>
          ${o.sarja ? `<div class="sarja">${esc(o.sarja)}</div>` : ""}
          ${(() => {
            if (o.pisteetKoti === undefined) return "";
            const voitto = voittiko(o);
            const luokka = voitto === true ? " voitto" : voitto === false ? " tappio" : "";
            const merkki = voitto === true ? "Voitto" : voitto === false ? "Tappio" : "";
            return `<div class="tulos${luokka}">${o.pisteetKoti} &ndash; ${o.pisteetVieras}${merkki ? ` <span class="vt">${merkki}</span>` : ""}</div>`;
          })()}
          ${o.muistiinpano ? `<div class="muistiinpano">${esc(o.muistiinpano)}</div>` : ""}
          ${o.poissa ? `<div class="poissaMerkki">${esc(o.lapsi)} ei ole mukana tässä pelissä</div>` : ""}
          ${kartta}
          ${seuraa}
        </div>
      </article>`;
}

function rakennaHtml({ tulevat, menneet, puuttuvat, paivitetty }) {
  const varit = Object.fromEntries(
    asetukset.lapset.map((l) => [l.nimi, { vaalea: l.vari, tumma: l.vari_tumma || l.vari }])
  );

  const ryhmittele = (lista) => {
    const ryhmat = new Map();
    for (const o of lista) {
      if (!ryhmat.has(o.paiva)) ryhmat.set(o.paiva, []);
      ryhmat.get(o.paiva).push(o);
    }
    return [...ryhmat.entries()].map(([pvm, ottelut]) => `
      <section class="paiva">
        <h3>${esc(pitkaPaiva(pvm))}</h3>
        ${ottelut.map((o) => ottelukortti(o, varit)).join("")}
      </section>`).join("");
  };

  // Kausisaldo lasketaan käsin kirjatuista tuloksista.
  const saldot = asetukset.lapset.map((l) => {
    let voitot = 0, tappiot = 0;
    for (const o of menneet) {
      if (o.lapsi !== l.nimi || o.poissa) continue;
      const v = voittiko(o);
      if (v === true) voitot++;
      else if (v === false) tappiot++;
    }
    return { nimi: l.nimi, vari: l.vari, vari_tumma: l.vari_tumma || l.vari, voitot, tappiot };
  }).filter((s) => s.voitot + s.tappiot > 0);

  const saldoHtml = saldot.length
    ? `<p class="saldo">${saldot.map((s) =>
        `<span style="--vaalea:${s.vari};--tumma:${s.vari_tumma}">${esc(s.nimi)} <strong>${s.voitot}&ndash;${s.tappiot}</strong></span>`
      ).join("")}</p>`
    : "";

  // Kalenterin tilauslinkit. Tilaus päivittyy itsestään, ladattu tiedosto ei,
  // joten tilaaminen on selvästi ensisijainen vaihtoehto.
  const osoite = (asetukset.sivun_osoite || "").replace(/\/+$/, "");
  const icsHttps = osoite ? `${osoite}/pelit.ics` : "";
  const icsWebcal = icsHttps.replace(/^https?:/, "webcal:");
  const tilausHtml = icsHttps
    ? `<div class="tilaus">
      <p class="tilausOtsikko">Tilaa pelit omaan kalenteriin</p>
      <div class="tilausNapit">
        <a class="kalenteri" target="_blank" rel="noopener" href="https://calendar.google.com/calendar/render?cid=${esc(icsWebcal)}">Google-kalenteri</a>
        <a class="kalenteri toissijainen" href="${esc(icsWebcal)}">iPhone tai Mac</a>
        <button type="button" class="kalenteri toissijainen" id="kopioi" data-osoite="${esc(icsHttps)}">Kopioi osoite</button>
      </div>
      <p class="tilausSelite">Tilattu kalenteri päivittyy itsestään, myös silloin kun otteluaikoja siirretään. Osoite on <span class="osoite">${esc(icsHttps)}</span>.</p>
      <p class="tilausSelite">Vain yhden pojan pelit:${asetukset.lapset.map((l) =>
        ` <a href="${esc(icsWebcal.replace("pelit.ics", `pelit-${tunnisteeksi(l.nimi)}.ics`))}">${esc(l.nimi)}</a>`
      ).join(" &middot;")}</p>
    </div>`
    : `<a class="kalenteri" href="pelit.ics">Lataa pelit kalenteriin</a>`;

  // Etusivulla näytetään vain seuraavat ottelut, loput painikkeen takana.
  const montaTulevaa = asetukset.etusivun_tulevat ?? 10;
  const lahella = montaTulevaa > 0 ? tulevat.slice(0, montaTulevaa) : tulevat;
  const loput = montaTulevaa > 0 ? tulevat.slice(montaTulevaa) : [];

  // Pelatuista näytetään heti vain tuoreimmat, loput painikkeen takana.
  const montaPelattua = asetukset.etusivun_pelatut ?? 10;
  const viimeisimmat = montaPelattua > 0 ? menneet.slice(0, montaPelattua) : menneet;
  const vanhemmat = montaPelattua > 0 ? menneet.slice(montaPelattua) : [];

  // Nosto sivun ylälaitaan: se peli, joka on ajallisesti seuraavana.
  // Selain päivittää tämän vielä uudelleen, jotta tieto on oikein silloinkin
  // kun sivu on rakennettu edellisenä päivänä.
  const seuraava = tulevat.find((o) => !o.poissa);
  const seuraavaHtml = `<section class="seuraava" id="seuraavaPeli"${seuraava ? "" : " hidden"}>
      <div class="kohta">Seuraava peli</div>
      <div class="peli">${seuraava ? `${esc(seuraava.koti)} &ndash; ${esc(seuraava.vieras)}` : ""}</div>
      <div class="milloin">${seuraava ? `${esc(pitkaPaiva(seuraava.paiva))} klo ${esc(seuraava.kello.replace(":", "."))} &middot; ${esc(seuraava.lapsi)}` : ""}</div>
      <div class="missa">${seuraava && seuraava.halli ? esc(seuraava.halli) : ""}</div>
    </section>`;

  const huomio = puuttuvat.length
    ? `<p class="huomio">Otteluohjelmaa ei ole vielä julkaistu: ${puuttuvat.map(esc).join(", ")}. Pelit ilmestyvät tähän automaattisesti heti kun ne julkaistaan.</p>`
    : "";

  // Kuvaus, joka näkyy kun osoite liitetään WhatsAppiin tai muuhun palveluun.
  const jakoKuvaus = seuraava
    ? `Seuraava peli: ${seuraava.koti} – ${seuraava.vieras}, ${pitkaPaiva(seuraava.paiva)} klo ${seuraava.kello.replace(":", ".")}.`
    : "Brunon, Wernerin ja Moritzin ottelut, tulokset ja kalenteri yhdessä paikassa.";

  return `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(asetukset.otsikko)}</title>
<meta name="description" content="${esc(jakoKuvaus)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(asetukset.otsikko)}">
<meta property="og:title" content="${esc(asetukset.otsikko)}">
<meta property="og:description" content="${esc(jakoKuvaus)}">
<meta property="og:locale" content="fi_FI">
${osoite ? `<meta property="og:url" content="${esc(osoite)}/">` : ""}
${asetukset.jakokuva && osoite ? `<meta property="og:image" content="${esc(osoite)}/${esc(asetukset.jakokuva)}">
<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
<style>
${teemaCss(asetukset.teema)}
</style>
</head>
<body>
<div class="kehys">
  <header>
    <h1><span class="pallo" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="24" cy="24" r="21"/><path d="M24 3v42M3 24h42"/><path d="M9.5 8.5C16 16 16 32 9.5 39.5M38.5 8.5C32 16 32 32 38.5 39.5"/></svg></span>${esc(asetukset.otsikko)}</h1>
    ${saldoHtml}
    <p class="selite">Tiedot päivittyvät automaattisesti Koripalloliiton tulospalvelusta. Jokaisen ottelun kohdalta pääset seuraamaan tulosta ja tilastoja livenä, vaikket pääsisi paikalle.</p>
    ${tilausHtml}
  </header>

  ${seuraavaHtml}


  <div class="suodattimet" id="suodattimet">
    <button type="button" data-lapsi="kaikki" aria-pressed="true">Kaikki</button>
    ${asetukset.lapset.map((l) => `<button type="button" data-lapsi="${esc(l.nimi)}" aria-pressed="false" style="--vaalea:${l.vari};--tumma:${l.vari_tumma || l.vari}">${esc(l.nimi)}</button>`).join("\n    ")}
  </div>

  ${huomio}

  <h2>Tulevat ottelut</h2>
  ${tulevat.length ? ryhmittele(lahella) : `<p class="tyhja">Tulevia otteluita ei ole tällä hetkellä tiedossa.</p>`}
  ${loput.length ? `<button type="button" class="lisaa" id="naytaKaikki">Näytä koko kausi (${loput.length} ottelua lisää)</button>
  <div id="loput" hidden>${ryhmittele(loput)}</div>` : ""}

  <h2>Pelatut ottelut</h2>
  ${menneet.length ? ryhmittele(viimeisimmat) : `<p class="tyhja">Pelattuja otteluita ei vielä ole.</p>`}
  ${vanhemmat.length ? `<button type="button" class="lisaa" id="naytaVanhat">Näytä aiemmat (${vanhemmat.length} ottelua)</button>
  <div id="vanhat" hidden>${ryhmittele(vanhemmat)}</div>` : ""}

  <footer>
    <p><button type="button" class="viikko" id="kopioiViikko" hidden>Kopioi viikon pelit viestiksi</button></p>
    <p>Päivitetty ${esc(paivitetty)}. Lähde: <a href="https://tulospalvelu.basket.fi/" target="_blank" rel="noopener">Koripalloliiton tulospalvelu</a>.</p>
  </footer>
</div>

<script>
  // Sivu on staattinen tiedosto, joka on voitu rakentaa tunteja sitten. Siksi
  // selain siivoaa jo pelatut ottelut pois "Tulevat ottelut" -listasta heti
  // sivun avautuessa ja päivittää seuraavan pelin noston sen mukaisesti.
  var OLETUSKESTO = ${Number(asetukset.ottelun_kesto_min) > 0 ? Number(asetukset.ottelun_kesto_min) : 120};
  var VIIKKO_OTSIKKO = ${JSON.stringify(`${asetukset.otsikko} — seuraavat 7 päivää`)};
  var SIVUN_OSOITE = ${JSON.stringify(osoite || "")};

  (function siivoaMenneet() {
    var nyt = Date.now();
    var kortit = document.querySelectorAll('.ottelu[data-tuleva="1"]');
    var seuraava = null;

    kortit.forEach(function (kortti) {
      var alku = Date.parse(kortti.dataset.alku);
      if (isNaN(alku)) return;
      var kesto = (Number(kortti.dataset.kesto) > 0 ? Number(kortti.dataset.kesto) : OLETUSKESTO) * 60000;
      if (alku + kesto < nyt) {
        kortti.dataset.ohi = '1';
        kortti.hidden = true;
      } else if (!seuraava && !kortti.dataset.poissa) {
        seuraava = kortti;
      }
    });

    var nosto = document.getElementById('seuraavaPeli');
    if (nosto) {
      if (seuraava) {
        var halli = seuraava.querySelector('.halli');
        nosto.querySelector('.peli').textContent = seuraava.querySelector('.joukkueet').textContent.trim();
        nosto.querySelector('.milloin').textContent =
          seuraava.dataset.paivateksti + ' klo ' +
          seuraava.querySelector('.kello').textContent.trim().replace(':', '.') + ' \\u00b7 ' +
          seuraava.dataset.lapsi;
        nosto.querySelector('.missa').textContent = halli ? halli.textContent.trim() : '';
        nosto.hidden = false;
      } else {
        nosto.hidden = true;
      }
    }

    paivitaPaivat();
  })();

  // Piilottaa päiväotsikon, jos sen alla ei ole yhtään näkyvää ottelua.
  function paivitaPaivat() {
    document.querySelectorAll('.paiva').forEach(function (osio) {
      var nakyvia = 0;
      osio.querySelectorAll('.ottelu').forEach(function (k) {
        if (!k.hidden && k.style.display !== 'none') nakyvia++;
      });
      osio.hidden = nakyvia === 0;
    });
  }

  // Yhteinen leikepöytäapuri, jossa on varasuunnitelma vanhoille selaimille.
  function kopioiTeksti(teksti, nappi, valmisSana) {
    var alkuperainen = nappi.textContent;
    var onnistui = function () {
      nappi.textContent = valmisSana;
      setTimeout(function () { nappi.textContent = alkuperainen; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teksti).then(onnistui, function () { window.prompt('Kopioi teksti:', teksti); });
    } else {
      window.prompt('Kopioi teksti:', teksti);
    }
  }

  var kopioi = document.getElementById('kopioi');
  if (kopioi) {
    kopioi.addEventListener('click', function () {
      kopioiTeksti(kopioi.dataset.osoite, kopioi, 'Kopioitu');
    });
  }

  // Kokoaa seuraavan seitsemän päivän pelit valmiiksi viestiksi, jonka voi
  // liittää esimerkiksi WhatsApp-ryhmään.
  (function viikonPelit() {
    var nappi = document.getElementById('kopioiViikko');
    if (!nappi) return;
    var raja = Date.now() + 7 * 86400000;
    var rivit = [];

    document.querySelectorAll('.ottelu[data-tuleva="1"]').forEach(function (k) {
      if (k.dataset.ohi || k.dataset.poissa) return;
      var alku = Date.parse(k.dataset.alku);
      if (isNaN(alku) || alku > raja) return;
      var pvm = new Date(alku).toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
      var halli = k.querySelector('.halli');
      var kello = k.querySelector('.kello').textContent.trim().replace(':', '.');
      rivit.push(pvm + ' klo ' + kello + ' \\u00b7 ' + k.dataset.lapsi + '\\n' +
        k.querySelector('.joukkueet').textContent.trim() +
        (halli ? '\\n' + halli.textContent.trim() : ''));
    });

    if (!rivit.length) return;
    nappi.hidden = false;
    nappi.addEventListener('click', function () {
      var teksti = VIIKKO_OTSIKKO + '\\n\\n' + rivit.join('\\n\\n') + (SIVUN_OSOITE ? '\\n\\n' + SIVUN_OSOITE : '');
      kopioiTeksti(teksti, nappi, 'Kopioitu viestiksi');
    });
  })();

  [['naytaKaikki', 'loput'], ['naytaVanhat', 'vanhat']].forEach(function (pari) {
    var nappi = document.getElementById(pari[0]);
    var osio = document.getElementById(pari[1]);
    if (!nappi || !osio) return;
    nappi.addEventListener('click', function () {
      osio.hidden = false;
      nappi.hidden = true;
    });
  });

  var napit = document.querySelectorAll('#suodattimet button');
  napit.forEach(function (nappi) {
    nappi.addEventListener('click', function () {
      var valinta = nappi.dataset.lapsi;
      napit.forEach(function (n) { n.setAttribute('aria-pressed', String(n === nappi)); });
      document.querySelectorAll('.ottelu').forEach(function (kortti) {
        if (kortti.dataset.ohi) return; // jo pelattu, pysyy piilossa
        kortti.style.display = (valinta === 'kaikki' || kortti.dataset.lapsi === valinta) ? '' : 'none';
      });
      paivitaPaivat();
    });
  });
</script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------- ICS */

function utcLeima(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function taita(rivi) {
  const osat = [];
  let jaljella = rivi;
  while (Buffer.byteLength(jaljella, "utf8") > 74) {
    let leikkaus = 74;
    while (Buffer.byteLength(jaljella.slice(0, leikkaus), "utf8") > 74) leikkaus--;
    osat.push(jaljella.slice(0, leikkaus));
    jaljella = " " + jaljella.slice(leikkaus);
  }
  osat.push(jaljella);
  return osat.join("\r\n");
}

// "Bruno" / "Bruno ja Werner" / "Bruno, Werner ja Moritz"
function luettele(nimet) {
  if (nimet.length <= 1) return nimet[0] || "";
  return `${nimet.slice(0, -1).join(", ")} ja ${nimet[nimet.length - 1]}`;
}

function icsTeksti(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function rakennaIcs(ottelut, nimi) {
  const nyt = utcLeima(new Date());
  const rivit = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//stude.fi//koripallo//FI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsTeksti(nimi || asetukset.otsikko)}`,
    "X-WR-TIMEZONE:Europe/Helsinki",
  ];

  // Sama ottelu esiintyy kahdesti, jos kaksi lapsista pelaa toisiaan vastaan.
  // Kalenteriin siitä tehdään yksi tapahtuma, jonka otsikossa on molemmat nimet.
  const ryhmat = new Map();
  for (const o of ottelut) {
    const avain = o.match_id || `${o.paiva}-${o.kello}-${o.koti}-${o.vieras}`;
    if (!ryhmat.has(avain)) {
      ryhmat.set(avain, { ...o, avain, lapset: [o.lapsi] });
    } else {
      const ryhma = ryhmat.get(avain);
      if (!ryhma.lapset.includes(o.lapsi)) ryhma.lapset.push(o.lapsi);
    }
  }

  for (const o of ryhmat.values()) {
    const alku = new Date(o.alku);
    // Ottelulle varataan kalenterista oletuksena kaksi tuntia.
    const kesto = o.kesto || (Number(asetukset.ottelun_kesto_min) > 0 ? Number(asetukset.ottelun_kesto_min) : 120);
    const loppu = new Date(alku.getTime() + kesto * 60000);
    rivit.push(
      "BEGIN:VEVENT",
      `UID:${o.avain}-stude@stude.fi`,
      `DTSTAMP:${nyt}`,
      `DTSTART:${utcLeima(alku)}`,
      `DTEND:${utcLeima(loppu)}`,
      taita(`SUMMARY:${icsTeksti(`${luettele(o.lapset)}: ${o.koti} – ${o.vieras}`)}`),
      taita(`LOCATION:${icsTeksti(o.halli)}`),
      taita(`DESCRIPTION:${icsTeksti(
        [o.sarja, o.linkki ? `Ottelu tulospalvelussa: ${o.linkki}` : ""].filter(Boolean).join("\n")
      )}`),
      ...(o.linkki ? [taita(`URL;VALUE=URI:${o.linkki}`)] : []),
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Peli alkaa kahden tunnin kuluttua",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  rivit.push("END:VCALENDAR");
  return rivit.join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------------ ajo */

async function haeSyote(osoite) {
  // Paikallinen tiedosto sallitaan testausta varten.
  if (!/^https?:/i.test(osoite)) return fs.readFileSync(path.join(JUURI, osoite), "utf8");
  const vastaus = await fetch(osoite, {
    headers: { Accept: "text/calendar", "User-Agent": "stude-koris/2.0 (perheen oma otteluaikataulu)" },
  });
  if (!vastaus.ok) throw new Error(`HTTP ${vastaus.status} ${vastaus.statusText}`);
  return vastaus.text();
}

async function haeJoukkue(joukkue) {
  const teksti = await haeSyote(joukkue.kalenteri);
  const tapahtumat = lueTapahtumat(teksti);

  if (PROBE && tapahtumat.length) {
    console.log(`--- ${joukkue.nimi}: ensimmäinen tapahtuma ---`);
    console.log(JSON.stringify(tapahtumat[0], null, 2));
  }

  const ottelut = [];
  for (const t of tapahtumat) {
    const alku = lueAika(t.DTSTART);
    if (!alku) continue;
    const sarja = t.CATEGORIES?.arvo || "";
    const { koti, vieras } = jaaJoukkueet(t.SUMMARY?.arvo || "", sarja);
    const id = matchId(t);
    ottelut.push({
      match_id: id,
      alku: alku.toISOString(),
      paiva: paivaTZ(alku),
      kello: kelloTZ(alku),
      koti, vieras, sarja,
      halli: t.LOCATION?.arvo || "",
      linkki: id ? `https://tulospalvelu.basket.fi/match/${id}` : (t.URL?.arvo || ""),
      lapsi: joukkue.lapsi,
      joukkue: joukkue.nimi,
      omaKotona: null,
    });
  }

  // Merkitään oma joukkue lihavoitavaksi, kun se voidaan päätellä luotettavasti.
  const oma = paatteleOmaJoukkue(ottelut);
  if (oma) for (const o of ottelut) o.omaKotona = o.koti === oma;

  return ottelut;
}

async function main() {
  fs.mkdirSync(ULOS, { recursive: true });

  let kaikki = [];
  const puuttuvat = [];
  let virheita = 0;

  for (const j of asetukset.joukkueet) {
    try {
      const ottelut = await haeJoukkue(j);
      if (!ottelut.length) puuttuvat.push(`${j.lapsi} / ${j.nimi}`);
      kaikki.push(...ottelut);
      console.log(`${j.lapsi} / ${j.nimi}: ${ottelut.length} ottelua.`);
    } catch (virhe) {
      // Yhden joukkueen ongelma ei saa kaataa koko sivua.
      virheita++;
      puuttuvat.push(`${j.lapsi} / ${j.nimi}`);
      console.error(`${j.lapsi} / ${j.nimi}: haku epäonnistui (${virhe.message}).`);
    }
  }

  if (PROBE) return;

  // Jos kaikki haut epäonnistuivat, jätetään edellinen sivu voimaan.
  if (virheita === asetukset.joukkueet.length) {
    console.error("Yksikään syöte ei vastannut. Sivua ei kirjoitettu uudelleen.");
    process.exit(1);
  }

  // Syötteistä saadut ottelut arkistoon, ja arkisto takaisin listaksi. Näin
  // pelatut ottelut säilyvät vaikka ne katoavat tulospalvelun syötteestä.
  const arkisto = lueArkisto();
  const ennen = Object.keys(arkisto).length;
  for (const o of kaikki) arkisto[otteluTunnus(o)] = o;
  kirjoitaArkisto(arkisto);
  const uusia = Object.keys(arkisto).length - ennen;
  console.log(`Arkistossa ${Object.keys(arkisto).length} ottelua (${uusia} uutta).`);
  kaikki = Object.values(arkisto);

  // Käsin lisätyt ottelut (EYBL, maajoukkue, turnaukset) mukaan samaan listaan.
  // Niitä ei arkistoida, koska ne ovat jo pysyvästi tiedostossa lisapelit.txt.
  const lisatyt = lueLisapelit();
  if (lisatyt.length) console.log(`Käsin lisättyjä otteluita: ${lisatyt.length}.`);
  kaikki.push(...lisatyt);

  const nahdyt = new Set();
  kaikki = kaikki.filter((o) => {
    const tunnus = otteluTunnus(o);
    if (nahdyt.has(tunnus)) return false;
    nahdyt.add(tunnus);
    return true;
  });

  // Käsin kirjatut lopputulokset ja muistiinpanot.
  const tulokset = lueTulokset();
  for (const t of tulokset) {
    const osumat = kaikki.filter(
      (o) => o.paiva === t.paiva && (!t.kello || t.kello === o.kello) && (!t.lapsi || t.lapsi === o.lapsi)
    );
    if (!osumat.length) {
      console.error(`tulokset.txt: riville "${t.paiva} ${t.koti}-${t.vieras}" ei löytynyt ottelua.`);
      continue;
    }
    for (const o of osumat) {
      o.pisteetKoti = t.koti;
      o.pisteetVieras = t.vieras;
      o.muistiinpano = t.muistiinpano;
      if (t.linkki) o.linkki = t.linkki;
    }
  }
  if (tulokset.length) console.log(`Kirjattuja tuloksia: ${tulokset.length}.`);

  // Merkinnät peleistä, joissa poika ei ole kokoonpanossa.
  const poissa = luePoissa();
  let merkittyja = 0;
  for (const o of kaikki) {
    const osuma = poissa.some(
      (p) => p.paiva === o.paiva && p.lapsi === o.lapsi && (!p.kello || p.kello === o.kello)
    );
    if (osuma) { o.poissa = true; merkittyja++; }
  }
  for (const p of poissa) {
    if (!kaikki.some((o) => o.paiva === p.paiva && o.lapsi === p.lapsi && (!p.kello || p.kello === o.kello))) {
      console.error(`poissa.txt: riville "${p.paiva} ${p.kello} ${p.lapsi}" ei löytynyt ottelua.`);
    }
  }
  if (merkittyja) console.log(`Merkitty poissaolevaksi: ${merkittyja} ottelua.`);

  const alkaen = paivaSiirtymalla(-Math.abs(asetukset.menneet_paivat ?? 30));
  const asti = paivaSiirtymalla(Math.abs(asetukset.tulevat_paivat ?? 240));

  kaikki = kaikki.filter((o) => o.paiva >= alkaen && o.paiva <= asti);
  // Ottelu siirtyy pelattuihin vasta kun sen arvioitu kesto on kulunut umpeen,
  // ei vasta vuorokauden vaihtuessa.
  const oletuskesto = Number(asetukset.ottelun_kesto_min) > 0 ? Number(asetukset.ottelun_kesto_min) : 120;
  const nytMs = Date.now();
  for (const o of kaikki) {
    o.mennyt = new Date(o.alku).getTime() + (o.kesto || oletuskesto) * 60000 < nytMs;
  }

  const jarjesta = (a, b) => a.alku.localeCompare(b.alku);
  // Poissaolevaksi merkityt näytetään oletuksena himmennettyinä, mutta ne voi
  // myös piilottaa kokonaan asetuksella poissa_toiminta: "piilota".
  const sivulle = asetukset.poissa_toiminta === "piilota" ? kaikki.filter((o) => !o.poissa) : kaikki;
  const tulevat = sivulle.filter((o) => !o.mennyt).sort(jarjesta);
  const menneet = sivulle.filter((o) => o.mennyt).sort(jarjesta).reverse();
  // Kalenteriin ei koskaan viedä pelejä, joissa poika ei ole mukana.
  const kalenteriin = kaikki.filter((o) => !o.poissa).sort(jarjesta);

  const paivitetty = new Intl.DateTimeFormat("fi-FI", {
    timeZone: TZ, dateStyle: "long", timeStyle: "short",
  }).format(new Date());

  fs.writeFileSync(path.join(ULOS, "index.html"), rakennaHtml({ tulevat, menneet, puuttuvat, paivitetty }));
  fs.writeFileSync(path.join(ULOS, "pelit.ics"), rakennaIcs(kalenteriin));

  // Lapsikohtaiset kalenterit, jotta voi tilata vain yhden pojan pelit.
  for (const l of asetukset.lapset) {
    const omat = kalenteriin.filter((o) => o.lapsi === l.nimi);
    fs.writeFileSync(
      path.join(ULOS, `pelit-${tunnisteeksi(l.nimi)}.ics`),
      rakennaIcs(omat, `${l.nimi}: koripallo`)
    );
  }
  fs.writeFileSync(path.join(ULOS, "ottelut.json"), JSON.stringify({ paivitetty, tulevat, menneet }, null, 2));
  fs.writeFileSync(path.join(ULOS, ".nojekyll"), "");

  console.log(`Valmis: ${tulevat.length} tulevaa, ${menneet.length} pelattua ottelua.`);
  if (puuttuvat.length) console.log(`Ei otteluita: ${puuttuvat.join(", ")}`);
}

main().catch((virhe) => {
  console.error(virhe);
  process.exit(1);
});
