/**
 * Sivun ulkoasuvaihtoehdot. Valinta tehdään joukkueet.json-tiedoston
 * kentässä "teema": "selkea" | "raikas" | "iso".
 *
 * Rakenne ja sisältö ovat kaikissa samat — vain tyylit vaihtuvat.
 */

const PERUSTA = `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0 1rem 4rem;
    background: var(--tausta); color: var(--teksti);
    font-family: var(--fontti);
    font-size: var(--koko); line-height: 1.5; -webkit-text-size-adjust: 100%;
  }
  .kehys { max-width: var(--leveys); margin: 0 auto; }
  header { padding: 2.5rem 0 1.5rem; }
  h1 { font-size: var(--otsikko); line-height: 1.15; margin: 0 0 .5rem; letter-spacing: -.015em; }
  .selite { color: var(--himmea); font-size: .95rem; margin: 0 0 1.25rem; max-width: 32rem; }
  h2 {
    font-size: 1.5rem; margin: 2.5rem 0 .5rem;
    padding-bottom: .4rem; border-bottom: 3px solid var(--raja);
  }
  h3 {
    font-size: 1rem; text-transform: uppercase; letter-spacing: .05em;
    color: var(--himmea); margin: 1.75rem 0 .6rem; font-weight: 700;
  }
  .ottelu {
    --lapsi: var(--vaalea);
    display: flex; gap: 1rem; align-items: flex-start;
    background: var(--kortti); border: 1px solid var(--raja);
    border-radius: var(--pyoristys); padding: 1rem 1.1rem; margin-bottom: .6rem;
  }
  .kello {
    font-variant-numeric: tabular-nums; font-weight: 700;
    flex-shrink: 0; padding-top: .1rem;
  }
  .lapsi {
    font-size: .75rem; text-transform: uppercase; letter-spacing: .07em;
    font-weight: 800; color: var(--lapsi); margin-bottom: .15rem;
  }
  .joukkueet { font-size: 1.1rem; line-height: 1.35; }
  .joukkueet .oma { font-weight: 700; }
  .joukkueet .vs { color: var(--himmea); }
  .sarja { color: var(--himmea); font-size: .9rem; margin-top: .15rem; }
  a.halli {
    display: block; margin-top: .4rem; font-size: .95rem;
    color: var(--linkki); text-decoration: underline; text-underline-offset: 3px;
  }
  a.seuraa {
    display: inline-block; margin-top: .7rem;
    font-size: .95rem; font-weight: 700; text-decoration: none;
    color: var(--lapsi); border: 2px solid currentColor; border-radius: 999px;
    padding: .4rem 1rem; line-height: 1.2;
  }
  a.seuraa:hover, a.seuraa:focus { background: var(--lapsi); color: #fff; }
  .suodattimet { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.25rem 0 .5rem; }
  .suodattimet button {
    font: inherit; font-size: .95rem; font-weight: 700; cursor: pointer;
    border: 2px solid var(--raja); background: var(--kortti);
    color: var(--vaalea, var(--teksti));
    border-radius: 999px; padding: .45rem 1.1rem;
  }
  .suodattimet button[aria-pressed="true"] { border-color: currentColor; }
  .huomio, .tyhja {
    background: var(--huomioTausta); border: 1px solid var(--huomioRaja);
    border-radius: var(--pyoristys); padding: .9rem 1.1rem; font-size: .95rem;
    color: var(--huomioTeksti);
  }
  .tyhja { background: var(--kortti); border-color: var(--raja); color: var(--himmea); }
  .seuraava {
    background: var(--heroTausta); color: var(--heroTeksti);
    border-radius: var(--pyoristys); padding: 1.4rem 1.5rem; margin: 1.5rem 0 .5rem;
  }
  .seuraava .kohta {
    font-size: .75rem; text-transform: uppercase; letter-spacing: .1em;
    font-weight: 800; opacity: .8; margin-bottom: .4rem;
  }
  .seuraava .peli { font-size: 1.4rem; font-weight: 700; line-height: 1.25; }
  .seuraava .milloin { margin-top: .35rem; font-size: 1.05rem; opacity: .92; }
  .seuraava .missa { margin-top: .1rem; font-size: .95rem; opacity: .8; }
  .lisaa {
    display: block; width: 100%; margin: 1.25rem 0 .5rem;
    font: inherit; font-size: 1rem; font-weight: 700; cursor: pointer;
    background: var(--kortti); color: var(--linkki);
    border: 2px dashed var(--raja); border-radius: var(--pyoristys);
    padding: .9rem 1rem;
  }
  .lisaa:hover, .lisaa:focus { border-style: solid; border-color: var(--linkki); }
  .kalenteri {
    display: inline-block; background: var(--nappiTausta); color: var(--nappiTeksti);
    text-decoration: none; font-weight: 700; font-size: 1rem;
    padding: .75rem 1.25rem; border-radius: var(--pyoristys);
  }
  footer {
    margin-top: 3rem; padding-top: 1.25rem; border-top: 1px solid var(--raja);
    font-size: .9rem; color: var(--himmea);
  }
  footer a { color: var(--linkki); }
  @media (max-width: 480px) {
    .ottelu { gap: .75rem; padding: .9rem; }
    .seuraava { padding: 1.15rem 1.2rem; }
    .seuraava .peli { font-size: 1.2rem; }
  }
`;

const TEEMAT = {
  /* --------------------------------------------------------------- selkeä */
  selkea: {
    nimi: "Selkeä",
    css: `
  :root {
    --fontti: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    --koko: 20px; --otsikko: 2rem; --leveys: 44rem; --pyoristys: 12px;
    --teksti: #14161a; --himmea: #5b6470; --tausta: #f6f7f9;
    --kortti: #ffffff; --raja: #e2e6eb; --linkki: #1a56c4;
    --heroTausta: #14161a; --heroTeksti: #ffffff;
    --nappiTausta: #14161a; --nappiTeksti: #ffffff;
    --huomioTausta: #fff8e1; --huomioRaja: #f0dfa8; --huomioTeksti: #6b5a20;
  }
  .ottelu { border-left: 8px solid var(--lapsi); }
  .kello { min-width: 3.8rem; font-size: 1.15rem; }
  @media (prefers-color-scheme: dark) {
    :root {
      --teksti: #f0f2f5; --himmea: #9aa4b2; --tausta: #121417;
      --kortti: #1c1f24; --raja: #2c3138; --linkki: #7fb0ff;
      --heroTausta: #1c1f24; --heroTeksti: #f0f2f5;
      --nappiTausta: #f0f2f5; --nappiTeksti: #14161a;
      --huomioTausta: #2a2415; --huomioRaja: #4a3f20; --huomioTeksti: #e8d9a8;
    }
    .ottelu { --lapsi: var(--tumma); }
    .suodattimet button { color: var(--tumma, var(--teksti)); }
    a.seuraa:hover, a.seuraa:focus { color: #14161a; }
  }
`,
  },

  /* --------------------------------------------------------------- raikas */
  raikas: {
    nimi: "Raikas",
    css: `
  :root {
    --fontti: "Avenir Next", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --koko: 20px; --otsikko: 2.4rem; --leveys: 46rem; --pyoristys: 18px;
    --teksti: #0f2136; --himmea: #5f7288; --tausta: #eef4f9;
    --kortti: #ffffff; --raja: #dce7f0; --linkki: #0b6bb5;
    --korostus: #0b6bb5;
    --heroTausta: linear-gradient(135deg, #0b6bb5 0%, #16a3a3 100%); --heroTeksti: #ffffff;
    --nappiTausta: #0b6bb5; --nappiTeksti: #ffffff;
    --huomioTausta: #fff6dd; --huomioRaja: #f2e0ab; --huomioTeksti: #6b5620;
  }
  body { background: var(--tausta); }
  h1 { font-weight: 800; }
  h2 {
    border-bottom: none; padding-bottom: 0; font-weight: 800;
    display: flex; align-items: center; gap: .75rem;
  }
  h2::after { content: ""; flex: 1; height: 3px; background: var(--raja); border-radius: 2px; }
  h3 {
    display: inline-block; background: var(--kortti); border: 1px solid var(--raja);
    border-radius: 999px; padding: .3rem .9rem; color: var(--korostus);
    font-size: .82rem; letter-spacing: .06em;
  }
  .ottelu {
    border: none; box-shadow: 0 2px 10px rgba(15, 33, 54, .07);
    padding: 1.1rem 1.25rem;
  }
  .kello {
    min-width: 0; font-size: 1rem; background: var(--tausta); color: var(--korostus);
    border-radius: 10px; padding: .45rem .6rem; text-align: center; line-height: 1.1;
  }
  .lapsi {
    display: inline-block; background: color-mix(in srgb, var(--lapsi) 12%, transparent);
    border-radius: 999px; padding: .18rem .6rem; margin-bottom: .35rem;
  }
  .joukkueet { font-size: 1.15rem; }
  .suodattimet button { border-color: transparent; box-shadow: 0 1px 4px rgba(15,33,54,.08); }
  .suodattimet button[aria-pressed="true"] { border-color: currentColor; }
  a.seuraa { border-width: 2px; }
  .seuraava { box-shadow: 0 8px 24px rgba(11, 107, 181, .22); }
  @media (prefers-color-scheme: dark) {
    :root {
      --teksti: #eaf1f8; --himmea: #93a7bb; --tausta: #0d1722;
      --kortti: #16232f; --raja: #24384a; --linkki: #6cb8f0; --korostus: #6cb8f0;
      --heroTausta: linear-gradient(135deg, #0b4f85 0%, #10756f 100%);
      --nappiTausta: #6cb8f0; --nappiTeksti: #0d1722;
      --huomioTausta: #2b2617; --huomioRaja: #4b4122; --huomioTeksti: #ecdcae;
    }
    .ottelu { --lapsi: var(--tumma); box-shadow: none; border: 1px solid var(--raja); }
    .kello { background: #0d1722; }
    .suodattimet button { color: var(--tumma, var(--teksti)); box-shadow: none; border-color: var(--raja); }
    a.seuraa:hover, a.seuraa:focus { color: #0d1722; }
  }
`,
  },

  /* ------------------------------------------------------------------ iso */
  iso: {
    nimi: "Iso",
    css: `
  :root {
    --fontti: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    --koko: 23px; --otsikko: 2.2rem; --leveys: 40rem; --pyoristys: 10px;
    --teksti: #000000; --himmea: #3d4650; --tausta: #ffffff;
    --kortti: #ffffff; --raja: #b9c0c8; --linkki: #0b4bb0;
    --heroTausta: #0b3d91; --heroTeksti: #ffffff;
    --nappiTausta: #0b3d91; --nappiTeksti: #ffffff;
    --huomioTausta: #fff4cc; --huomioRaja: #d9b84a; --huomioTeksti: #4a3c00;
  }
  h1 { font-weight: 800; }
  h2 { font-size: 1.7rem; border-bottom-width: 4px; border-bottom-color: var(--teksti); }
  h3 { font-size: 1.15rem; color: var(--teksti); text-transform: none; letter-spacing: 0; }
  .ottelu {
    display: block; border: 2px solid var(--raja);
    border-left: 12px solid var(--lapsi); padding: 1.1rem 1.2rem;
  }
  .kello {
    font-size: 1.9rem; line-height: 1.1; margin-bottom: .35rem; padding-top: 0;
  }
  .lapsi { font-size: .95rem; letter-spacing: .04em; }
  .joukkueet { font-size: 1.25rem; line-height: 1.4; }
  .sarja { font-size: 1rem; }
  a.halli { font-size: 1.05rem; }
  a.seuraa { font-size: 1.05rem; padding: .6rem 1.2rem; margin-top: .8rem; }
  .suodattimet button { font-size: 1.05rem; padding: .55rem 1.3rem; border-color: var(--raja); }
  .seuraava .peli { font-size: 1.6rem; }
  @media (prefers-color-scheme: dark) {
    :root {
      --teksti: #ffffff; --himmea: #c2cad3; --tausta: #000000;
      --kortti: #101418; --raja: #4a545f; --linkki: #8ec1ff;
      --heroTausta: #10306e; --nappiTausta: #ffffff; --nappiTeksti: #000000;
      --huomioTausta: #33290a; --huomioRaja: #6b5a1e; --huomioTeksti: #ffe9a8;
    }
    .ottelu { --lapsi: var(--tumma); }
    .suodattimet button { color: var(--tumma, var(--teksti)); }
    a.seuraa:hover, a.seuraa:focus { color: #000; }
  }
`,
  },
};

function teemaCss(nimi) {
  const teema = TEEMAT[nimi] || TEEMAT.selkea;
  return PERUSTA + teema.css;
}

module.exports = { TEEMAT, teemaCss };
