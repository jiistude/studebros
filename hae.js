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

function ottelukortti(o, varit) {
  const v = varit[o.lapsi] || { vaalea: "#444", tumma: "#bbb" };

  const kartta = o.halli
    ? `<a class="halli" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.halli)}">${esc(o.halli)}</a>`
    : "";

  const seuraa = o.linkki
    ? `<a class="seuraa" target="_blank" rel="noopener" href="${esc(o.linkki)}">${
        o.mennyt ? "Tulos ja tilastot" : "Seuraa peliä livenä"
      } <span aria-hidden="true">&rarr;</span></a>`
    : "";

  const kotiLuokka = o.omaKotona === true ? ' class="oma"' : "";
  const vierasLuokka = o.omaKotona === false ? ' class="oma"' : "";

  return `
      <article class="ottelu" style="--vaalea:${v.vaalea};--tumma:${v.tumma}">
        <div class="kello">${esc(o.kello)}</div>
        <div class="tiedot">
          <div class="lapsi">${esc(o.lapsi)}${o.joukkue ? ` &middot; ${esc(o.joukkue)}` : ""}</div>
          <div class="joukkueet"><span${kotiLuokka}>${esc(o.koti)}</span> <span class="vs">&ndash;</span> <span${vierasLuokka}>${esc(o.vieras)}</span></div>
          ${o.sarja ? `<div class="sarja">${esc(o.sarja)}</div>` : ""}
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

  const huomio = puuttuvat.length
    ? `<p class="huomio">Otteluohjelmaa ei ole vielä julkaistu: ${puuttuvat.map(esc).join(", ")}. Pelit ilmestyvät tähän automaattisesti heti kun ne julkaistaan.</p>`
    : "";

  return `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(asetukset.otsikko)}</title>
<meta name="description" content="Otteluaikataulut yhdellä sivulla.">
<style>
  :root {
    --teksti: #14161a; --himmea: #5b6470; --tausta: #f6f7f9;
    --kortti: #ffffff; --raja: #e2e6eb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0 1rem 4rem;
    background: var(--tausta); color: var(--teksti);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 20px; line-height: 1.5; -webkit-text-size-adjust: 100%;
  }
  .kehys { max-width: 44rem; margin: 0 auto; }
  header { padding: 2.5rem 0 1.5rem; }
  h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 .5rem; }
  .selite { color: var(--himmea); font-size: 1rem; margin: 0 0 1rem; }
  h2 {
    font-size: 1.5rem; margin: 2.5rem 0 .5rem;
    padding-bottom: .4rem; border-bottom: 3px solid var(--raja);
  }
  h3 {
    font-size: 1.05rem; text-transform: uppercase; letter-spacing: .04em;
    color: var(--himmea); margin: 1.75rem 0 .6rem; font-weight: 600;
  }
  .ottelu {
    --lapsi: var(--vaalea);
    display: flex; gap: 1rem; align-items: flex-start;
    background: var(--kortti); border: 1px solid var(--raja);
    border-left: 8px solid var(--lapsi);
    border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: .6rem;
  }
  .kello {
    font-variant-numeric: tabular-nums; font-weight: 700;
    min-width: 3.8rem; flex-shrink: 0; font-size: 1.15rem; padding-top: .1rem;
  }
  .lapsi {
    font-size: .8rem; text-transform: uppercase; letter-spacing: .06em;
    font-weight: 700; color: var(--lapsi); margin-bottom: .1rem;
  }
  .joukkueet { font-size: 1.1rem; line-height: 1.35; }
  .joukkueet .oma { font-weight: 700; }
  .joukkueet .vs { color: var(--himmea); }
  .sarja { color: var(--himmea); font-size: .9rem; margin-top: .15rem; }
  a.halli {
    display: block; margin-top: .35rem; font-size: .95rem;
    color: #1a56c4; text-decoration: underline; text-underline-offset: 3px;
  }
  a.seuraa {
    display: inline-block; margin-top: .6rem;
    font-size: 1rem; font-weight: 600; text-decoration: none;
    color: var(--lapsi); border: 2px solid currentColor; border-radius: 999px;
    padding: .4rem 1rem; line-height: 1.2;
  }
  a.seuraa:hover, a.seuraa:focus { background: var(--lapsi); color: #fff; }
  .suodattimet { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.25rem 0 .5rem; }
  .suodattimet button {
    font: inherit; font-size: 1rem; font-weight: 600; cursor: pointer;
    border: 2px solid var(--raja); background: var(--kortti);
    color: var(--vaalea, var(--teksti));
    border-radius: 999px; padding: .45rem 1.1rem;
  }
  .suodattimet button[aria-pressed="true"] { border-color: currentColor; }
  .huomio, .tyhja {
    background: #fff8e1; border: 1px solid #f0dfa8; border-radius: 10px;
    padding: .9rem 1.1rem; font-size: .95rem; color: #6b5a20;
  }
  .tyhja { background: var(--kortti); border-color: var(--raja); color: var(--himmea); }
  footer {
    margin-top: 3rem; padding-top: 1.25rem; border-top: 1px solid var(--raja);
    font-size: .9rem; color: var(--himmea);
  }
  footer a { color: #1a56c4; }
  .kalenteri {
    display: inline-block; background: #14161a; color: #fff;
    text-decoration: none; font-weight: 600; font-size: 1rem;
    padding: .7rem 1.2rem; border-radius: 10px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --teksti: #f0f2f5; --himmea: #9aa4b2; --tausta: #121417;
      --kortti: #1c1f24; --raja: #2c3138;
    }
    .ottelu { --lapsi: var(--tumma); }
    .suodattimet button { color: var(--tumma, var(--teksti)); }
    a.halli, footer a { color: #7fb0ff; }
    a.seuraa:hover, a.seuraa:focus { color: #14161a; }
    .huomio { background: #2a2415; border-color: #4a3f20; color: #e8d9a8; }
    .kalenteri { background: #f0f2f5; color: #14161a; }
  }
  @media (max-width: 480px) {
    body { font-size: 19px; }
    h1 { font-size: 1.6rem; }
    .ottelu { gap: .75rem; padding: .9rem; }
  }
</style>
</head>
<body>
<div class="kehys">
  <header>
    <h1>${esc(asetukset.otsikko)}</h1>
    <p class="selite">Tiedot päivittyvät automaattisesti Koripalloliiton tulospalvelusta. Jokaisen ottelun kohdalta pääset seuraamaan tulosta ja tilastoja livenä, vaikket pääsisi paikalle.</p>
    <a class="kalenteri" href="pelit.ics">Lisää kaikki pelit omaan kalenteriin</a>
  </header>

  <div class="suodattimet" id="suodattimet">
    <button type="button" data-lapsi="kaikki" aria-pressed="true">Kaikki</button>
    ${asetukset.lapset.map((l) => `<button type="button" data-lapsi="${esc(l.nimi)}" aria-pressed="false" style="--vaalea:${l.vari};--tumma:${l.vari_tumma || l.vari}">${esc(l.nimi)}</button>`).join("\n    ")}
  </div>

  ${huomio}

  <h2>Tulevat ottelut</h2>
  ${tulevat.length ? ryhmittele(tulevat) : `<p class="tyhja">Tulevia otteluita ei ole tällä hetkellä tiedossa.</p>`}

  <h2>Pelatut ottelut</h2>
  ${menneet.length ? ryhmittele(menneet) : `<p class="tyhja">Pelattuja otteluita ei vielä ole.</p>`}

  <footer>
    <p>Päivitetty ${esc(paivitetty)}. Lähde: <a href="https://tulospalvelu.basket.fi/" target="_blank" rel="noopener">Koripalloliiton tulospalvelu</a>.</p>
  </footer>
</div>

<script>
  var napit = document.querySelectorAll('#suodattimet button');
  napit.forEach(function (nappi) {
    nappi.addEventListener('click', function () {
      var valinta = nappi.dataset.lapsi;
      napit.forEach(function (n) { n.setAttribute('aria-pressed', String(n === nappi)); });
      document.querySelectorAll('.ottelu').forEach(function (kortti) {
        var lapsi = kortti.querySelector('.lapsi').textContent.split('·')[0].trim();
        kortti.style.display = (valinta === 'kaikki' || lapsi === valinta) ? '' : 'none';
      });
      document.querySelectorAll('.paiva').forEach(function (osio) {
        var nakyvia = osio.querySelectorAll('.ottelu:not([style*="display: none"])').length;
        osio.style.display = nakyvia ? '' : 'none';
      });
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

function icsTeksti(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function rakennaIcs(ottelut) {
  const nyt = utcLeima(new Date());
  const rivit = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//stude.fi//koripallo//FI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsTeksti(asetukset.otsikko)}`,
    "X-WR-TIMEZONE:Europe/Helsinki",
  ];

  for (const o of ottelut) {
    const alku = new Date(o.alku);
    const loppu = new Date(alku.getTime() + 2 * 3600000);
    rivit.push(
      "BEGIN:VEVENT",
      `UID:${o.match_id || `${o.paiva}-${o.kello}`}-stude@stude.fi`,
      `DTSTAMP:${nyt}`,
      `DTSTART:${utcLeima(alku)}`,
      `DTEND:${utcLeima(loppu)}`,
      taita(`SUMMARY:${icsTeksti(`${o.lapsi}: ${o.koti} – ${o.vieras}`)}`),
      taita(`LOCATION:${icsTeksti(o.halli)}`),
      taita(`DESCRIPTION:${icsTeksti(
        [o.sarja, o.linkki ? `Tulos ja tilastot: ${o.linkki}` : ""].filter(Boolean).join("\n")
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

  const nahdyt = new Set();
  kaikki = kaikki.filter((o) => {
    const tunnus = `${o.match_id}|${o.lapsi}|${o.joukkue}`;
    if (nahdyt.has(tunnus)) return false;
    nahdyt.add(tunnus);
    return true;
  });

  const alkaen = paivaSiirtymalla(-Math.abs(asetukset.menneet_paivat ?? 30));
  const asti = paivaSiirtymalla(Math.abs(asetukset.tulevat_paivat ?? 240));
  const tanaan = paivaSiirtymalla(0);

  kaikki = kaikki.filter((o) => o.paiva >= alkaen && o.paiva <= asti);
  for (const o of kaikki) o.mennyt = o.paiva < tanaan;

  const jarjesta = (a, b) => a.alku.localeCompare(b.alku);
  const tulevat = kaikki.filter((o) => !o.mennyt).sort(jarjesta);
  const menneet = kaikki.filter((o) => o.mennyt).sort(jarjesta).reverse();

  const paivitetty = new Intl.DateTimeFormat("fi-FI", {
    timeZone: TZ, dateStyle: "long", timeStyle: "short",
  }).format(new Date());

  fs.writeFileSync(path.join(ULOS, "index.html"), rakennaHtml({ tulevat, menneet, puuttuvat, paivitetty }));
  fs.writeFileSync(path.join(ULOS, "pelit.ics"), rakennaIcs(tulevat.concat(menneet)));
  fs.writeFileSync(path.join(ULOS, "ottelut.json"), JSON.stringify({ paivitetty, tulevat, menneet }, null, 2));
  fs.writeFileSync(path.join(ULOS, ".nojekyll"), "");

  console.log(`Valmis: ${tulevat.length} tulevaa, ${menneet.length} pelattua ottelua.`);
  if (puuttuvat.length) console.log(`Ei otteluita: ${puuttuvat.join(", ")}`);
}

main().catch((virhe) => {
  console.error(virhe);
  process.exit(1);
});
