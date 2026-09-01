# Poikien pelit -sivu: käyttöönotto ilman koodausta

Tämä paketti lukee viiden joukkueen julkiset kalenterisyötteet Koripalloliiton
tulospalvelusta ja tekee niistä yhden selkeän sivun sekä yhden yhteisen kalenterin, jonka
isovanhemmat voivat tilata puhelimeensa.

API-avainta ei tarvita. Sinun ei tarvitse kirjoittaa riviäkään koodia — alla olevat vaiheet
tehdään selaimessa klikkailemalla. Varaa ensimmäiseen kertaan noin puoli tuntia.

## Seuratut joukkueet

| Lapsi | Joukkue | Kalenterisyöte |
|---|---|---|
| Bruno | ToPo M1A | `koripallo-api.torneopal.fi/calendar/team/969` |
| Bruno | ToPo U19 | `…/calendar/team/5754904` |
| Werner | HBA M1A | `…/calendar/team/4634877` |
| Moritz | RPC | `…/calendar/team/5756063` |
| Moritz | U15 1D | `…/calendar/team/5000040` |

---

## Vaihe 1: GitHub-tili

1. Mene osoitteeseen **github.com** ja valitse *Sign up*.
2. Luo tili sähköpostillasi. Ilmainen tili riittää.
3. Vahvista sähköpostiosoite.

## Vaihe 2: Luo projekti

1. Klikkaa oikeasta yläkulmasta **+** → *New repository*.
2. **Repository name:** `koris`
3. Valitse **Public**.
   *Miksi julkinen: GitHub Pages -sivut ovat aina julkisia, joten yksityinen projekti ei
   toisi lisäsuojaa mutta maksaisi. Sivulla näkyy vain sama tieto, joka on jo julkisesti
   tulospalvelussa, ja lapsista vain etunimet.*
4. Klikkaa **Create repository**.

## Vaihe 3: Lataa tiedostot

1. Uuden projektin sivulla klikkaa **uploading an existing file**.
2. Raahaa selainikkunaan tiedostot `hae.js`, `joukkueet.json` ja `OHJEET.md` sekä kansiot
   `docs` ja `.github`.
3. Klikkaa alalaidasta **Commit changes**.

> Jos `.github`-kansio ei raahatessa lähde mukaan, tee se käsin: **Add file** →
> *Create new file* → kirjoita nimikenttään `.github/workflows/paivita.yml` (kauttaviivat
> luovat kansiot automaattisesti) → liitä sisältö tiedostosta → *Commit changes*.

## Vaihe 4: Aja haku ja katso toimiiko se

**Tämä on projektin tärkein tarkistus.** Kalenterisyötteet toimivat selaimesta katsottuna,
mutta emme vielä tiedä, päästääkö tulospalvelu GitHubin palvelimet hakemaan niitä. Se
selviää tässä vaiheessa minuutissa.

1. Välilehti **Actions**. Jos GitHub kysyy lupaa työnkulkujen ajamiseen, hyväksy.
2. Valitse vasemmalta *Päivitä ottelut* → **Run workflow** → **Run workflow**.
3. Odota noin minuutti ja päivitä sivu.

**Vihreä merkki:** kaikki toimii, jatka vaiheeseen 5.

**Punainen merkki:** klikkaa ajo auki ja katso lokista, lukeeko siellä `HTTP 403`. Jos
lukee, tulospalvelu ei päästä GitHubin palvelimia hakemaan syötteitä. Se ei ole
maailmanloppu — kerro minulle, niin siirrymme varasuunnitelmaan (haku omalta koneeltasi tai
suorat kalenteritilaukset). Kopioi virheteksti minulle sellaisenaan.

## Vaihe 5: Julkaise sivu

1. **Settings** → vasemmalta **Pages**.
2. *Source:* **Deploy from a branch**.
3. *Branch:* **main**, kansio **/docs**. Klikkaa **Save**.
4. Minuutin päästä sivu löytyy osoitteesta
   `https://KÄYTTÄJÄTUNNUKSESI.github.io/koris/`.

## Vaihe 6: Oma osoite (koris.stude.fi)

**Squarespacessa:**

1. Kirjaudu Squarespaceen → *Settings* → *Domains* → valitse **stude.fi** → **DNS Settings**.
2. Lisää uusi tietue (*Add record*):
   - **Host / Name:** `koris`
   - **Type:** `CNAME`
   - **Data / Value:** `KÄYTTÄJÄTUNNUKSESI.github.io`
3. Tallenna.

**GitHubissa:**

4. **Settings** → **Pages** → *Custom domain* → kirjoita `koris.stude.fi` → **Save**.
5. Odota että GitHub kertoo varmenteen olevan valmis (voi kestää tunnin), ja rastita
   **Enforce HTTPS**.

---

## Kalenterin tilaaminen

Sivun ylälaidassa on painike **Lisää kaikki pelit omaan kalenteriin**, joka osoittaa
tiedostoon `koris.stude.fi/pelit.ics`. Tämä on **yksi** osoite, joka sisältää kaikkien
viiden joukkueen pelit, ja jokaisen tapahtuman otsikossa lukee kenen peli on kyseessä.

- **iPhone:** Asetukset → Kalenteri → Tilit → Lisää tili → Muu → Lisää tilattu kalenteri →
  liitä osoite.
- **Android / Google-kalenteri:** calendar.google.com → vasemmalta *Muut kalenterit* → **+**
  → *Osoitteesta (URL)* → liitä osoite.

Tilattu kalenteri päivittyy itsestään. Jokaisesta pelistä tulee muistutus kaksi tuntia ennen
alkua, ja kalenterimerkinnän sisällä on suora linkki ottelun sivulle tulospalvelussa — eli
muistutuksesta pääsee yhdellä napautuksella seuraamaan peliä livenä.

## Ottelun seuraaminen livenä

Jokaisen ottelun kohdalla on painike, joka vie ottelun omalle sivulle tulospalvelussa.
Tulevissa peleissä siinä lukee *Seuraa peliä livenä* ja pelatuissa *Tulos ja tilastot*.
Tämä korvaa linkkien lähettämisen WhatsApp-ryhmään: isovanhemmille riittää yksi osoite.

---

## Ylläpito arjessa

**Uusi joukkue mukaan:** avaa GitHubissa `joukkueet.json`, klikkaa kynäkuvaketta ja lisää rivi:

```json
{ "lapsi": "Bruno", "nimi": "ToPo U19", "kalenteri": "https://koripallo-api.torneopal.fi/calendar/team/1234567" },
```

Numero on sama kuin joukkueen tulospalvelu-osoitteessa
`tulospalvelu.basket.fi/team/`**`1234567`**`/fixture`. Muista pilkku edellisen rivin perään.
Tallenna *Commit changes*, ja sivu päivittyy seuraavassa ajossa.

**Muut säädöt** samassa tiedostossa:

| Asetus | Merkitys |
|---|---|
| `otsikko` | Sivun otsikko |
| `menneet_paivat` | Kuinka monen päivän vanhat ottelut näytetään (oletus 30) |
| `tulevat_paivat` | Kuinka pitkälle tulevaisuuteen katsotaan (oletus 240) |
| `lapset` | Nimet ja värit, joilla ottelut merkitään |

**Päivitysrytmi:**

| Milloin | Miksi |
|---|---|
| Maanantaiaamuisin | Perusrytmi. Poimii viikon aikana tehdyt ottelusiirrot. |
| Lauantai- ja sunnuntai-iltaisin | Viikonlopun pelit siirtyvät pelattuihin saman illan aikana. |
| Helmi–toukokuu joka päivä | Jatkosarjojen ja pudotuspelien aikataulut varmistuvat lyhyellä varoitusajalla. |

Rytmiä säädetään tiedostossa `.github/workflows/paivita.yml` kohdassa `schedule`. Ajat ovat
UTC-aikaa eli Suomen aika miinus kolme tuntia kesällä ja miinus kaksi talvella. Päivityksen
voi aina käynnistää käsin **Actions** → *Päivitä ottelut* → **Run workflow**.

> **Muista tämä kesällä:** GitHub sammuttaa ajastetut työnkulut, jos projektiin ei tule
> lainkaan muutoksia 60 päivään. Kauden tauolla näin voi käydä. GitHub lähettää asiasta
> sähköpostin etukäteen, ja työnkulun saa takaisin päälle yhdellä klikkauksella
> **Actions**-välilehdeltä. Jos syksyllä huomaat ettei sivu päivity, tarkista tämä ensin.

---

## Mitä sivulla ei näy

Kalenterisyötteissä ei ole otteluiden **lopputuloksia**, joten pelattujen otteluiden kohdalla
sivu ei näytä pistemääriä vaan linkin, josta tulos ja tilastot löytyvät. Tämä on ainoa asia,
joka menetettiin siirryttäessä rajapinnasta kalenterisyötteisiin. Jos lupa rajapintaan
joskus irtoaa, tulokset saadaan mukaan pienellä muutoksella.

---

## Jos jokin menee rikki

Sivu on rakennettu kestämään häiriöitä: jos yhden joukkueen syöte ei vastaa tai
otteluohjelmaa ei ole vielä julkaistu, muut ottelut näkyvät normaalisti ja sivulle tulee
huomautus puuttuvasta joukkueesta. Jos taas mikään syöte ei vastaa, sivua ei kirjoiteta
uudelleen lainkaan — edellinen versio jää voimaan, eivätkä isovanhemmat näe tyhjää sivua.

| Oire | Syy | Korjaus |
|---|---|---|
| Ajo punaisena, lokissa `HTTP 403` | Tulospalvelu ei päästä GitHubin palvelimia | Kerro minulle, siirrytään varasuunnitelmaan |
| Ajo punaisena, lokissa `HTTP 404` | Joukkueen syöteosoite on väärä | Tarkista numero `joukkueet.json`-tiedostosta |
| Yhden joukkueen kohdalla lukee ettei ohjelmaa ole julkaistu | Sarjan ohjelmaa ei ole vielä tehty | Ei toimenpiteitä, ilmestyy itsestään |
| Oma joukkue ei ole lihavoitu | Syötteessä on vasta yksi ottelu, jolloin omaa joukkuetta ei voi päätellä | Korjaantuu itsestään kun otteluita tulee lisää |
| Ottelut väärään aikaan | Aikavyöhykkeen tulkinta | Kerro minulle, tarkistan |

---

## Tekninen tausta lyhyesti

- `hae.js` lukee kunkin joukkueen julkisen kalenterisyötteen, poimii tapahtumista ottelun
  ajan, joukkueet, sarjan, hallin ja ottelun tunnisteen, ja kirjoittaa kansioon `docs/`
  valmiin `index.html`-sivun, yhdistetyn kalenterin `pelit.ics` ja koneluettavan
  `ottelut.json`.
- Kellonajat luetaan UTC-aikana ja muunnetaan Suomen aikaan, joten kesä- ja talviaika
  menevät oikein automaattisesti.
- Kumpi joukkue on "meidän", päätellään siitä mikä nimi toistuu syötteen jokaisessa
  ottelussa. Se lihavoidaan sivulla.
- Skriptillä ei ole ulkoisia riippuvuuksia, joten mikään ei hajoa päivitysten myötä.
- Syötteitä haetaan vain GitHubin palvelimelta, ei kävijöiden selaimista. Sivun kävijämäärä
  ei siis kuormita tulospalvelua lainkaan.
- Tarkistuskomento `node hae.js --probe` tulostaa yhden tapahtuman raakana, jos jokin kenttä
  näyttää väärältä.
