/**
 * Sivun ulkoasuvaihtoehdot. Valinta tehdään joukkueet.json-tiedoston
 * kentässä "teema": "selkea" | "raikas" | "iso".
 *
 * Rakenne ja sisältö ovat kaikissa samat — vain tyylit vaihtuvat.
 */

const PERUSTA = `
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body {
    margin: 0; padding: 0 1rem 4rem;
    background: var(--tausta); color: var(--teksti);
    font-family: var(--fontti);
    font-size: var(--koko); line-height: 1.5; -webkit-text-size-adjust: 100%;
  }
  .kehys { max-width: var(--leveys); margin: 0 auto; }
  header { padding: 2.5rem 0 1.5rem; }
  h1 {
    font-size: var(--otsikko); line-height: 1.15; margin: 0 0 .5rem; letter-spacing: -.015em;
    overflow-wrap: break-word; hyphens: auto;
  }
  .seuraava .peli, .joukkueet { overflow-wrap: break-word; }
  .selite { color: var(--himmea); font-size: .95rem; margin: 0 0 1.25rem; max-width: 32rem; }
  .selite a { color: var(--linkki); text-underline-offset: 3px; }
  .selite strong { color: var(--teksti); }
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
  .ottelu.poissa { opacity: .6; }
  .ottelu.poissa .joukkueet { text-decoration: line-through; text-decoration-thickness: 1px; }
  .poissaMerkki {
    display: inline-block; margin-top: .4rem;
    font-size: .85rem; font-weight: 700; color: var(--himmea);
    border: 1px solid var(--raja); border-radius: 999px; padding: .15rem .7rem;
  }
  .saldo {
    display: flex; flex-wrap: wrap; gap: .4rem .5rem;
    margin: 0 0 1rem; font-size: .9rem;
  }
  .saldo span {
    background: var(--kortti); border: 1px solid var(--raja); border-radius: 999px;
    padding: .2rem .75rem; color: var(--vaalea, var(--teksti));
  }
  .saldo strong { font-variant-numeric: tabular-nums; }
  .tulos {
    margin-top: .4rem; font-size: 1.25rem; font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .tulos .vt {
    font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
    vertical-align: .22em; margin-left: .35rem; color: var(--himmea);
  }
  .tulos.voitto .vt { color: #11703a; }
  .tulos.tappio .vt { color: var(--himmea); }
  .muistiinpano {
    margin-top: .35rem; font-size: .95rem; line-height: 1.45;
    border-left: 3px solid var(--raja); padding-left: .7rem; color: var(--teksti);
  }
  .pallo { display: none; --logoMuste: #0B0B0C; --logoW: #012F53; }
  .pallo svg { width: 100%; height: 100%; display: block; }
  .viikko {
    font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer;
    background: none; border: 1px solid var(--raja); border-radius: var(--pyoristys);
    color: var(--himmea); padding: .35rem .8rem;
  }
  .viikko:hover, .viikko:focus { color: var(--teksti); border-color: var(--himmea); }
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
  .tilaus {
    background: var(--kortti); border: 1px solid var(--raja);
    border-radius: var(--pyoristys); padding: 1.1rem 1.25rem;
  }
  .tilausOtsikko { margin: 0 0 .75rem; font-weight: 800; font-size: 1.05rem; }
  .tilausNapit { display: flex; flex-wrap: wrap; gap: .5rem; }
  .tilausSelite { margin: .8rem 0 0; font-size: .88rem; color: var(--himmea); }
  .tilausSelite a { color: var(--linkki); text-underline-offset: 3px; }
  .osoite { font-variant-numeric: tabular-nums; word-break: break-all; }
  .kalenteri {
    display: inline-block; background: var(--nappiTausta); color: var(--nappiTeksti);
    text-decoration: none; font: inherit; font-weight: 700; font-size: 1rem;
    padding: .75rem 1.25rem; border-radius: var(--pyoristys);
    border: 2px solid var(--nappiTausta); cursor: pointer;
  }
  .kalenteri.toissijainen {
    background: transparent; color: var(--linkki); border-color: var(--raja);
  }
  .kalenteri.toissijainen:hover, .kalenteri.toissijainen:focus { border-color: var(--linkki); }
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
    .saldo span { color: var(--tumma, var(--teksti)); }
    .tulos.voitto .vt { color: #6dce8c; }
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
    .saldo span { color: var(--tumma, var(--teksti)); }
    .tulos.voitto .vt { color: #6dce8c; }
    a.seuraa:hover, a.seuraa:focus { color: #000; }
  }
`,
  },

  /* ------------------------------------------------------------ parketti */
  parketti: {
    nimi: "Parketti",
    css: `
  :root {
    --fontti: "Helvetica Neue", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --koko: 20px; --otsikko: 2.5rem; --leveys: 46rem; --pyoristys: 3px;
    --teksti: #F3EDE2; --himmea: #9C9382; --tausta: #121110;
    --kortti: #1C1A16; --raja: #2E2A22; --linkki: #E8A33D;
    --heroTausta: #1C1A16; --heroTeksti: #F6F1E7;
    --nappiTausta: #E8A33D; --nappiTeksti: #171510;
    --huomioTausta: #241D10; --huomioRaja: #4A3A1B; --huomioTeksti: #E6C98C;
    --lapsi: var(--vaalea);
  }
  .ottelu { --lapsi: var(--tumma); }
  .suodattimet button { color: var(--tumma, var(--teksti)); }
  .pallo {
    display: block; width: auto; height: 2.6rem; margin: 0 0 .9rem;
    --logoMuste: #F3EDE2; --logoW: #5C9BD6;
  }
  .pallo svg { width: auto; height: 100%; display: block; }
  h1 { font-weight: 800; letter-spacing: -.02em; }
  h2 {
    font-size: 1.1rem; text-transform: uppercase; letter-spacing: .18em; font-weight: 800;
    border-bottom: 1px solid var(--raja); padding-bottom: .6rem; color: #E8A33D;
  }
  h3 {
    font-size: .8rem; letter-spacing: .16em; color: var(--himmea);
    border-left: 3px solid #E8A33D; padding-left: .6rem; margin-bottom: .8rem;
  }
  .ottelu {
    border: 1px solid var(--raja); border-left: 4px solid var(--lapsi);
    padding: 1.1rem 1.2rem;
  }
  .kello {
    min-width: 4rem; font-size: 1.3rem; letter-spacing: -.02em;
    color: #E8A33D;
  }
  .lapsi { font-size: .7rem; letter-spacing: .16em; }
  .joukkueet { font-size: 1.15rem; }
  .seuraava {
    position: relative; overflow: hidden;
    background: radial-gradient(130% 150% at 12% -30%, #3A2F1C 0%, #1C1A16 62%);
    border: 1px solid var(--raja); border-top: 3px solid #E8A33D;
  }
  .seuraava::after {
    content: ""; position: absolute; right: -90px; top: -70px;
    width: 280px; height: 280px; border: 2px solid rgba(232,163,61,.22);
    border-radius: 50%; pointer-events: none;
  }
  .seuraava .kohta { color: #E8A33D; opacity: 1; letter-spacing: .2em; }
  .seuraava .peli { font-size: 1.6rem; font-weight: 800; letter-spacing: -.02em; }
  .tilaus { background: var(--kortti); border-color: var(--raja); }
  .kalenteri { font-weight: 800; letter-spacing: .02em; }
  .kalenteri.toissijainen { color: #E8A33D; }
  .suodattimet button { background: transparent; border-color: var(--raja); }
  .saldo span { background: transparent; }
  .tulos.voitto .vt { color: #7BD08A; }
`,
  },

  /* --------------------------------------------------------- tulostaulu */
  tulostaulu: {
    nimi: "Tulostaulu",
    css: `
  :root {
    --fontti: "Helvetica Neue", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --koko: 20px; --otsikko: 2.1rem; --leveys: 46rem; --pyoristys: 0px;
    --teksti: #E8EDF2; --himmea: #8494A4; --tausta: #000000;
    --kortti: #0A0D11; --raja: #1E252D; --linkki: #A8BED4;
    --heroTausta: #0A0D11; --heroTeksti: #FFFFFF;
    --nappiTausta: #D7DEE6; --nappiTeksti: #000000;
    --huomioTausta: #15110A; --huomioRaja: #3E3520; --huomioTeksti: #D8C79A;
  }
  .ottelu { --lapsi: var(--tumma); }
  .suodattimet button { color: var(--tumma, var(--teksti)); }
  .pallo {
    display: block; width: auto; height: 2.6rem; margin: 0 0 .9rem;
    --logoMuste: #E8EDF2; --logoW: #5C9BD6;
  }
  .pallo svg { width: auto; height: 100%; display: block; }
  h1 { font-weight: 700; letter-spacing: -.03em; }
  h2 {
    font-size: .95rem; text-transform: uppercase; letter-spacing: .3em; font-weight: 700;
    color: #D7DEE6; border-bottom: 1px solid var(--raja); padding-bottom: .5rem;
  }
  h3 {
    font-size: .75rem; letter-spacing: .2em; color: #0A0D11; background: var(--himmea);
    display: inline-block; padding: .25rem .7rem; margin-bottom: .7rem;
  }
  .ottelu {
    border: 1px solid var(--raja); border-left: 3px solid var(--lapsi);
    padding: 1rem 1.1rem;
    background: linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px), var(--kortti);
  }
  /* Kellolaatikko ottaa pojan seuravärin: väri merkitsee sivulla vain yhtä asiaa. */
  .kello {
    min-width: 4.6rem; font-size: 1.35rem; font-weight: 700; color: var(--lapsi);
    border: 1px solid var(--lapsi); background: #000; text-align: center;
    padding: .3rem .2rem; line-height: 1.1;
  }
  .lapsi { font-size: .68rem; letter-spacing: .2em; }
  .joukkueet { font-size: 1.05rem; letter-spacing: -.01em; }
  h1, h2, h3, .kello, .tulos, .saldo, .lapsi, .joukkueet,
  .seuraava .kohta, .seuraava .peli, .suodattimet button, .kalenteri, a.seuraa, .lisaa {
    font-family: var(--mono);
  }
  .seuraava {
    border: 1px solid var(--raja); border-top: 3px solid #D7DEE6;
    background:
      linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px),
      radial-gradient(90% 180% at 50% -40%, #16202B 0%, #0A0D11 70%);
  }
  .seuraava .kohta { color: #D7DEE6; opacity: 1; letter-spacing: .32em; }
  .seuraava .peli { font-size: 1.5rem; font-weight: 700; letter-spacing: -.03em; }
  .tilaus { background: var(--kortti); }
  .kalenteri { font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: .85rem; }
  .kalenteri.toissijainen { color: #D7DEE6; }
  .suodattimet button {
    background: transparent; border-color: var(--raja);
    text-transform: uppercase; font-size: .8rem; letter-spacing: .12em;
  }
  .saldo span { background: transparent; }
  .tulos { font-size: 1.5rem; letter-spacing: -.02em; }
  .tulos.voitto .vt { color: #00D264; }
  a.seuraa { text-transform: uppercase; font-size: .8rem; letter-spacing: .1em; }
`,
  },

  /* ---------------------------------------------------------------- lehti */
  lehti: {
    nimi: "Lehti",
    css: `
  :root {
    --fontti: "Helvetica Neue", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --koko: 20px; --otsikko: clamp(1.9rem, 7.5vw, 3rem); --leveys: 44rem; --pyoristys: 0px;
    --teksti: #FFFFFF; --himmea: #9A9AA2; --tausta: #0B0B0C;
    --kortti: #0B0B0C; --raja: #26262B; --linkki: #C9C9D1;
    --heroTausta: #0B0B0C; --heroTeksti: #FFFFFF;
    --nappiTausta: #FFFFFF; --nappiTeksti: #0B0B0C;
    --huomioTausta: #16161A; --huomioRaja: #33333B; --huomioTeksti: #D9D9E0;
  }
  .ottelu { --lapsi: var(--tumma); }
  .suodattimet button { color: var(--tumma, var(--teksti)); }
  .pallo {
    display: block; width: auto; height: 2.9rem; margin: 0 0 1rem;
    --logoMuste: #FBFBFA; --logoW: #5C9BD6;
  }
  .pallo svg { width: auto; height: 100%; display: block; }
  h1 { font-weight: 800; letter-spacing: -.04em; line-height: .98; text-transform: uppercase; }
  h2 {
    font-size: 1.6rem; font-weight: 800; letter-spacing: -.03em; text-transform: uppercase;
    border-bottom: 3px solid #FFFFFF; padding-bottom: .3rem; margin-bottom: 1.2rem;
  }
  h3 {
    font-size: .72rem; letter-spacing: .24em; color: var(--himmea);
    margin: 2rem 0 .4rem; font-weight: 700;
  }
  /* Ei kortteja, vaan lehtimäiset väliviivat. */
  .ottelu {
    background: none; border: none; border-top: 1px solid var(--raja);
    border-radius: 0; padding: 1.1rem 0; margin: 0;
  }
  .ottelu:last-child { border-bottom: 1px solid var(--raja); }
  .kello {
    min-width: 5rem; font-size: 1.05rem; font-weight: 800; color: var(--lapsi);
    letter-spacing: -.01em;
  }
  .lapsi {
    font-size: .66rem; letter-spacing: .2em;
    border-left: 3px solid var(--lapsi); padding-left: .5rem;
  }
  .joukkueet { font-size: 1.4rem; font-weight: 700; letter-spacing: -.025em; line-height: 1.15; }
  .joukkueet .oma { font-weight: 800; }
  .joukkueet .vs { color: var(--lapsi); }
  .seuraava {
    background: none; border-top: 5px solid #FFFFFF; border-bottom: 1px solid var(--raja);
    padding: 1.4rem 0 1.6rem; border-radius: 0;
  }
  .seuraava .kohta { color: #FFFFFF; opacity: 1; letter-spacing: .3em; }
  .seuraava .peli {
    font-size: clamp(1.5rem, 5.5vw, 2.1rem); font-weight: 800; letter-spacing: -.04em;
    line-height: 1.02; text-transform: uppercase;
  }
  .tilaus { background: none; border: 1px solid var(--raja); }
  .kalenteri { text-transform: uppercase; font-size: .8rem; letter-spacing: .1em; font-weight: 800; }
  .kalenteri.toissijainen { color: #FFFFFF; border-color: var(--raja); }
  .suodattimet button {
    background: none; border-color: var(--raja);
    text-transform: uppercase; font-size: .78rem; letter-spacing: .14em;
  }
  .saldo span { background: none; border-color: var(--raja); }
  .tulos { font-size: 1.7rem; letter-spacing: -.03em; }
  .tulos.voitto .vt { color: #39D07A; }
  a.seuraa {
    text-transform: uppercase; font-size: .76rem; letter-spacing: .14em;
    border-radius: 0; border-width: 1px;
  }
  .lisaa { border-style: solid; border-width: 1px; }
`,
  },

  /* -------------------------------------------------------- lehti-vaalea */
  /* Sama rakenne ja typografia kuin Lehdessä, mutta vaalealla pohjalla.
     Lasten värit ovat seurojen logoista, tummina versioina jotta kontrasti
     valkoista vasten riittää (Bruno 5,9:1 · Werner 13,2:1 · Moritz 5,3:1). */
  "lehti-vaalea": {
    nimi: "Lehti vaalea",
    css: `
  :root {
    --fontti: "Helvetica Neue", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --koko: 20px; --otsikko: clamp(1.9rem, 7.5vw, 3rem); --leveys: 44rem; --pyoristys: 0px;
    --teksti: #0B0B0C; --himmea: #5F5F68; --tausta: #FBFBFA;
    --kortti: #FBFBFA; --raja: #DCDCE2; --linkki: #44444C;
    --heroTausta: transparent; --heroTeksti: #0B0B0C;
    --nappiTausta: #0B0B0C; --nappiTeksti: #FFFFFF;
    --huomioTausta: #FFF6E3; --huomioRaja: #E6D4A6; --huomioTeksti: #5E4B16;
  }
  .pallo {
    display: block; width: auto; height: 2.9rem; margin: 0 0 1rem;
    --logoMuste: #0B0B0C; --logoW: #012F53;
  }
  .pallo svg { width: auto; height: 100%; display: block; }
  h1 { font-weight: 800; letter-spacing: -.04em; line-height: .98; text-transform: uppercase; }
  h2 {
    font-size: 1.6rem; font-weight: 800; letter-spacing: -.03em; text-transform: uppercase;
    border-bottom: 3px solid #0B0B0C; padding-bottom: .3rem; margin-bottom: 1.2rem;
  }
  h3 {
    font-size: .72rem; letter-spacing: .24em; color: var(--himmea);
    margin: 2rem 0 .4rem; font-weight: 700;
  }
  /* Ei kortteja, vaan lehtimäiset väliviivat. */
  .ottelu {
    background: none; border: none; border-top: 1px solid var(--raja);
    border-radius: 0; padding: 1.1rem 0; margin: 0;
  }
  .ottelu:last-child { border-bottom: 1px solid var(--raja); }
  .kello {
    min-width: 5rem; font-size: 1.05rem; font-weight: 800; color: var(--lapsi);
    letter-spacing: -.01em;
  }
  /* Nimitarra seuran brändivärillä. Sisävarjo tekee vaalean keltaisen tarran
     reunan näkyväksi myös valkoista pohjaa vasten. */
  .lapsi {
    display: inline-block; font-size: .66rem; letter-spacing: .18em;
    background: var(--pohja); color: var(--pohjaTeksti);
    border-left: none; padding: .3rem .6rem; border-radius: 2px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
    margin-bottom: .45rem;
  }
  .joukkueet { font-size: 1.4rem; font-weight: 700; letter-spacing: -.025em; line-height: 1.15; }
  .joukkueet .oma { font-weight: 800; }
  .joukkueet .vs { color: var(--lapsi); }
  .seuraava {
    background: none; border-top: 5px solid #0B0B0C; border-bottom: 1px solid var(--raja);
    padding: 1.4rem 0 1.6rem; border-radius: 0;
  }
  .seuraava .kohta { color: #0B0B0C; opacity: 1; letter-spacing: .3em; }
  .seuraava .peli {
    font-size: clamp(1.5rem, 5.5vw, 2.1rem); font-weight: 800; letter-spacing: -.04em;
    line-height: 1.02; text-transform: uppercase;
  }
  .tilaus { background: none; border: 1px solid var(--raja); }
  .kalenteri { text-transform: uppercase; font-size: .8rem; letter-spacing: .1em; font-weight: 800; }
  .kalenteri.toissijainen { color: #0B0B0C; border-color: var(--raja); }
  .suodattimet button {
    background: none; border-color: var(--raja);
    text-transform: uppercase; font-size: .78rem; letter-spacing: .14em;
  }
  .saldo span { background: none; border-color: var(--raja); }
  .tulos { font-size: 1.7rem; letter-spacing: -.03em; }
  .tulos.voitto .vt { color: #11703A; }
  a.seuraa {
    text-transform: uppercase; font-size: .76rem; letter-spacing: .14em;
    border-radius: 0; border-width: 1px;
  }
  .lisaa { border-style: solid; border-width: 1px; }
`,
  },
};

function teemaCss(nimi) {
  const teema = TEEMAT[nimi] || TEEMAT.selkea;
  return PERUSTA + teema.css;
}

module.exports = { TEEMAT, teemaCss };
