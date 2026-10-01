# Poikien pelit -sivu

Tämä projekti kokoaa Brunon, Wernerin ja Moritzin ottelut yhdelle sivulle osoitteeseen
**basket.stude.fi** ja tuottaa niistä yhden kalenterin, jonka kuka tahansa voi tilata
puhelimeensa. Tiedot haetaan Koripalloliiton tulospalvelun julkisista kalenterisyötteistä.
API-avainta ei tarvita.

Kaikki ylläpito tehdään selaimessa GitHubissa. Koodia ei tarvitse kirjoittaa.

## Sisällys

- [Seuratut joukkueet](#seuratut-joukkueet)
- [Arjen ylläpito](#arjen-ylläpito) — tulokset, poissaolot, käsin lisätyt pelit
- [Kalenterin tilaaminen](#kalenterin-tilaaminen)
- [Jakaminen](#jakaminen)
- [Asetukset](#asetukset)
- [Päivitysrytmi](#päivitysrytmi)
- [Jos jokin menee rikki](#jos-jokin-menee-rikki)
- [Tekninen tausta](#tekninen-tausta)
- [Asennus alusta](#asennus-alusta) — vain jos projekti pitää joskus pystyttää uudelleen

---

## Seuratut joukkueet

| Lapsi | Joukkue | Kalenterisyöte |
|---|---|---|
| Bruno | ToPo M1A | `koripallo-api.torneopal.fi/calendar/team/969` |
| Bruno | ToPo U19 | `…/calendar/team/5754904` |
| Werner | HBA M1A | `…/calendar/team/4634877` |
| Moritz | RPC | `…/calendar/team/5756063` |
| Moritz | U15 1D | `…/calendar/team/5000040` |

**Uusi joukkue mukaan:** avaa `joukkueet.json`, klikkaa kynäkuvaketta ja lisää rivi:

```json
{ "lapsi": "Bruno", "nimi": "ToPo U19", "kalenteri": "https://koripallo-api.torneopal.fi/calendar/team/1234567" },
```

Numero on sama kuin joukkueen tulospalvelu-osoitteessa
`tulospalvelu.basket.fi/team/`**`1234567`**`/fixture`. Muista pilkku edellisen rivin perään.

---

## Arjen ylläpito

Kolme tekstitiedostoa, joita muokataan GitHubissa. Ne ovat tarkoituksella tavallista tekstiä
eivätkä yhtä herkkiä kuin `joukkueet.json`: pilkuilla ja sisennyksillä ei ole väliä,
virheellinen rivi ohitetaan eikä ajo kaadu, ja ajon loki kertoo jos jokin rivi jäi
ymmärtämättä. Kaikkia voi muokata myös puhelimella.

### Tulokset ja muistiinpanot — `tulokset.txt`

Tulospalvelun kalenterisyötteissä **ei ole lopputuloksia**. Siksi tulokset kirjataan käsin:

```
2026-10-09 78-71
2026-10-16 54-66 | Tiukka peli. Werner 12 pistettä.
```

Pisteet aina muodossa koti-vieras, samassa järjestyksessä kuin joukkueet näkyvät sivulla.
Sivu päättelee siitä, voittiko vai hävisikö oma joukkue, ja laskee kauden
voitto–tappio-saldon otsikon alle. Muistiinpano pystyviivan jälkeen on vapaaehtoinen.

Jos samana päivänä on useampi peli, tarkenna kellonajalla (`2026-10-09 19:00 78-71`) tai
nimellä (`2026-10-09 78-71 Bruno`).

**Linkki ottelusivulle:** jos rivillä on verkko-osoite, siitä tulee ottelun *Tulos ja
tilastot* -painikkeen kohde. Osoitteen saa kirjoittaa mihin kohtaan riviä tahansa:

```
2026-10-09 78-71 https://tulospalvelu.basket.fi/match/1234567 | Tiukka avaus.
```

Tulospalvelusta haetuilla otteluilla linkki on jo valmiina, joten tätä tarvitaan lähinnä
käsin lisättyihin peleihin. Vaihtoehtoisesti linkin voi antaa `lisapelit.txt`-tiedoston
`linkki:`-rivillä — kumpi tahansa käy, ja `tulokset.txt` voittaa jos molemmat on annettu.

Pelkkä tulos riittää hyvin, ja sen voi lisätä vaikka viikkojen päästä — peli ei katoa
mihinkään, koska se on arkistossa.

### Poissaolot — `poissa.txt`

Peli, jossa poika ei ole kokoonpanossa:

```
2026-10-09 Bruno
2026-11-21 14:00 Moritz
```

Kellonaika tarvitaan vain jos samalla pojalla on sinä päivänä useampi peli. Ilman sitä
merkitään kaikki kyseisen pojan sen päivän pelit.

Merkitty peli näkyy sivulla himmennettynä ja yliviivattuna huomautuksen kanssa, mutta
**kalenteriin sitä ei viedä**. Merkinnän poistaa poistamalla rivin.

### Käsin lisätyt pelit — `lisapelit.txt`

EYBL, maajoukkue, harjoitusottelut ja muut, joita ei ole tulospalvelussa. Tyhjä rivi erottaa
pelit, rivien järjestyksellä ei ole väliä:

```
lapsi: Moritz
joukkue: RPC EYBL
alkaa: 2026-10-24 14:30
koti: Zalgiris Kaunas
vieras: RPC
oma: RPC
sarja: EYBL U15, alkulohko
paikka: Zalgirio arena, Kaunas, Liettua
linkki: https://eybl.eu/
```

Pakollisia ovat vain `lapsi` ja `alkaa`. Kenttä `oma` kertoo kumpi joukkue on pojan oma,
jotta se lihavoidaan. `kesto: 100` säätää yksittäisen pelin keston minuutteina.

### Arkisto — `docs/historia.json`

Tulospalvelun syötteessä on **vain tulevia otteluita**: pelattu peli katoaa syötteestä
kokonaan. Arkisto tallentaa jokaisen kerran nähdyn ottelun pysyvästi, ja ilman sitä pelatut
pelit katoaisivat sivulta jälkiä jättämättä.

Arkistoa ei tarvitse ylläpitää. Se täydentyy itsestään jokaisessa ajossa, ja tuoreempi tieto
korvaa vanhan, joten siirretty ottelu päivittyy oikein. Jos ottelu peruuntuu kokonaan, se jää
arkistoon — merkitse se silloin tiedostoon `poissa.txt` tai poista sitä vastaava kohta
arkistosta käsin.

### Muutokset tulevat voimaan itsestään

Kun painat **Commit changes**, haku käynnistyy automaattisesti ja sivu on ajan tasalla
1–2 minuutissa. *Run workflow* -painiketta tarvitaan vain jos haluat hakea tiedot heti
muuttamatta mitään.

---

## Kalenterin tilaaminen

Sivun ylälaidassa on kolme painiketta. **Tilaaminen ja lataaminen ovat eri asioita**, ja tämä
on ainoa kohta, joka kannattaa selittää isovanhemmille:

| | Mitä tapahtuu |
|---|---|
| **Tilaus** | Kalenteri pysyy yhteydessä sivuun. Siirretyt ottelut ja uudet pelit päivittyvät itsestään. |
| **Lataus** (.ics-tiedosto) | Pelit kopioidaan kalenteriin kertaalleen. Myöhemmät muutokset eivät näy. |

- **Google-kalenteri** avaa Googlen "lisää kalenteri" -näkymän valmiiksi täytettynä. Linkki on
  muotoa `calendar.google.com/calendar/render?cid=webcal://…` — huomaa **webcal**: jos osoite
  annetaan `https`-muodossa, Google avaa vain tavallisen kalenterinäkymän tekemättä tilausta.
- **iPhone tai Mac** avaa Kalenteri-sovelluksen tilausikkunan.
- **Kopioi osoite** on varakeino esimerkiksi Outlookiin. Osoite on
  `https://basket.stude.fi/pelit.ics`.
- **Lapsikohtaiset kalenterit** löytyvät saman laatikon alalaidasta, jos joku haluaa seurata
  vain yhden pojan pelejä.

### Kuinka nopeasti muutokset näkyvät

- **Google-kalenteri** hakee tilatut kalenterit omaan tahtiinsa, tyypillisesti muutaman kerran
  vuorokaudessa. Päivitystiheyttä ei voi säätää.
- **iPhone ja Mac** kysyvät tilauksen yhteydessä päivitysväliä, ja oletus voi olla kerran
  viikossa. Kannattaa valita **kerran tunnissa** tai **kerran päivässä**. Asetuksen voi vaihtaa
  jälkeenpäin: Kalenteri → napsauta kalenterin nimeä hiiren oikealla → *Asetukset* → *Päivitä*.

Ottelusiirto voi siis näkyä kalenterissa vasta seuraavana päivänä. Sivu on aina ajan tasalla
nopeammin, joten epäselvässä tilanteessa se ratkaisee.

Jokaisesta pelistä tulee muistutus kaksi tuntia ennen alkua, ja kalenterimerkinnän sisällä on
suora linkki ottelun sivulle tulospalvelussa.

---

## Jakaminen

Kun osoite liitetään WhatsAppiin tai muuhun palveluun, siitä syntyy esikatselukortti, jossa
näkyy otsikko ja seuraava peli. Jos haluat korttiin myös kuvan, lataa kuva kansioon `docs` ja
lisää `joukkueet.json`-tiedostoon rivi `"jakokuva": "kuva.jpg"`.

Sivun **alalaidassa** on huomaamaton painike **Kopioi viikon pelit viestiksi**, joka kokoaa
seuraavan seitsemän päivän pelit valmiiksi tekstiksi leikepöydälle. Painike näkyy vain jos
pelejä on tulossa, ja se on tarkoitettu sinun omaan käyttöösi.

## Ottelun seuraaminen livenä

Jokaisen ottelun kohdalla on painike, joka vie ottelun omalle sivulle tulospalvelussa.
Tulevissa peleissä siinä lukee *Seuraa peliä livenä* ja pelatuissa *Ottelutilastot*.

---

## Asetukset

Tiedostossa `joukkueet.json`:

| Asetus | Merkitys |
|---|---|
| `otsikko` | Sivun otsikko |
| `teema` | Ulkoasu: `tulostaulu`, `parketti`, `lehti`, `raikas`, `selkea` tai `iso` |
| `sivun_osoite` | Sivun julkinen osoite. Tästä rakennetaan tilauslinkit ja jakokortti |
| `menneet_paivat` | Kuinka monen päivän vanhat ottelut näytetään (oletus 400) |
| `tulevat_paivat` | Kuinka pitkälle tulevaisuuteen katsotaan (oletus 240) |
| `etusivun_tulevat` | Montako tulevaa ottelua näytetään heti, loput painikkeen takana. `0` = kaikki |
| `etusivun_pelatut` | Montako pelattua näytetään heti, loput painikkeen takana. `0` = kaikki |
| `ottelun_kesto_min` | Kuinka pitkän ajan ottelu varaa kalenterista, minuutteina (oletus 120) |
| `poissa_toiminta` | `himmenna` (oletus) tai `piilota` |
| `jakokuva` | Kuvatiedoston nimi kansiossa `docs`, joka näkyy jakokortissa |
| `lapset` | Nimet ja värit, joilla ottelut merkitään |

Värit on poimittu seurojen logoista: Bruno ToPon keltainen, Werner HBA:n laivastonsininen,
Moritz PuHun punainen. Jokaisella on kaksi arvoa, koska sama sävy ei toimi sekä vaalealla
että tummalla pohjalla: `vari` on vaaleita teemoja varten ja `vari_tumma` tummia varten.
Jos joku vaihtaa seuraa, muuta molemmat.

Teemojen oma värimaailma on tarkoituksella neutraali (valkoinen tai harmaa), jotta väri
merkitsee sivulla vain yhtä asiaa: kenen peli on kyseessä. Ainoa poikkeus on otsikon
koripallo, joka on oranssi.

Ulkoasun vaihtoehdot ovat tiedostossa `teemat.js` omina lohkoinaan kommentoituna. Värit ja
koot voi säätää sieltä ilman että sivun rakenteeseen tarvitsee koskea.

Teemat `tulostaulu`, `parketti` ja `lehti` ovat tarkoituksella aina tummia riippumatta
puhelimen tai koneen valoisa/tumma-asetuksesta. Teemat `raikas`, `selkea` ja `iso`
mukautuvat laitteen asetukseen.

---

## Päivitysrytmi

| Milloin | Miksi |
|---|---|
| Joka aamu noin klo 6 | Yön aikana tehdyt ottelusiirrot ja tuore päivänäkymä. |
| Joka ilta noin klo 21 | Päivän pelit siirtyvät pelattuihin ja kalenteri pysyy ajan tasalla. |

Rytmiä säädetään tiedostossa `.github/workflows/paivita.yml` kohdassa `schedule`. Ajat ovat
UTC-aikaa eli Suomen aika miinus kolme tuntia kesällä ja miinus kaksi talvella.

> **Sivu ei odota seuraavaa ajoa.** Sivu on staattinen tiedosto, joka on voitu rakentaa
> tunteja sitten, joten selain siivoaa jo pelatut ottelut pois "Tulevat ottelut" -listasta
> heti sivun avautuessa ja päivittää "Seuraava peli" -noston. Ottelu katoaa listalta, kun sen
> alkamisajasta on kulunut `ottelun_kesto_min` verran aikaa.

> **Muista tämä kesällä:** GitHub sammuttaa ajastetut työnkulut, jos projektiin ei tule
> lainkaan muutoksia 60 päivään. GitHub lähettää asiasta sähköpostin etukäteen, ja työnkulun
> saa takaisin päälle yhdellä klikkauksella **Actions**-välilehdeltä.

---

## Jos jokin menee rikki

Sivu kestää häiriöitä: jos yhden joukkueen syöte ei vastaa, muut ottelut näkyvät normaalisti
ja sivulle tulee huomautus. Jos mikään syöte ei vastaa, sivua ei kirjoiteta uudelleen, vaan
edellinen versio jää voimaan. Arkiston ansiosta pelatut ottelut eivät katoa missään
tilanteessa.

| Oire | Syy | Korjaus |
|---|---|---|
| Ajo punaisena, lokissa `HTTP 403` | Tulospalvelu ei päästä GitHubin palvelimia | Kerro Claudelle, siirrytään varasuunnitelmaan |
| Ajo punaisena, lokissa `HTTP 404` | Joukkueen syöteosoite on väärä | Tarkista numero `joukkueet.json`-tiedostosta |
| Ajo punaisena, lokissa `[rejected]` ja `fetch first` | Ajo käynnistettiin *Re-run jobs* -painikkeella | Käynnistä **Run workflow** -painikkeella |
| Ajo punaisena, lokissa `SyntaxError` | Pilkkuvirhe `joukkueet.json`-tiedostossa | Viimeisen rivin perään ei tule pilkkua |
| Tulos ei näy sivulla | Rivi `tulokset.txt`-tiedostossa ei osunut peliin | Katso ajon loki, tarkista päivämäärä |
| Oma joukkue ei lihavoitu | Syötteessä on vasta yksi ottelu | Korjaantuu itsestään |
| Sivu näyttää vanhalta | Selaimen välimuisti | Kova päivitys **⌘ + ⇧ + R** |

Ajon loki: **Actions** → ylin ajo → **paivita** → *Hae ottelut ja rakenna sivu*.

---

## Tekninen tausta

- `hae.js` lukee kunkin joukkueen julkisen kalenterisyötteen, yhdistää ne arkistoon ja käsin
  ylläpidettyihin tiedostoihin, ja kirjoittaa kansioon `docs` valmiin `index.html`-sivun,
  kalenterit `pelit.ics` ja `pelit-<nimi>.ics`, arkiston `historia.json` sekä koneluettavan
  `ottelut.json`.
- Kellonajat luetaan UTC-aikana ja muunnetaan Suomen aikaan, joten kesä- ja talviaika menevät
  oikein automaattisesti.
- Kumpi joukkue on "meidän", päätellään siitä mikä nimi toistuu syötteen jokaisessa ottelussa.
- Jos kaksi pojista pelaa toisiaan vastaan, kalenteriin tulee yksi tapahtuma, jonka otsikossa
  ovat molemmat nimet. Sivulla ottelu näkyy kahtena korttina, jotta se löytyy kummankin
  suodattimella.
- Skriptillä ei ole ulkoisia riippuvuuksia.
- Syötteitä haetaan vain GitHubin palvelimelta, ei kävijöiden selaimista, joten sivun
  kävijämäärä ei kuormita tulospalvelua lainkaan.
- `node hae.js --probe` tulostaa yhden tapahtuman raakana, jos jokin kenttä näyttää väärältä.

---

## Asennus alusta

Tarvitaan vain jos projekti pitää joskus pystyttää uudelleen.

1. **Projekti:** github.com → **+** → *New repository* → nimi `studebros`, **Public**.
2. **Tiedostot:** *Add file* → *Upload files* → raahaa `hae.js`, `teemat.js`,
   `joukkueet.json`, `lisapelit.txt`, `poissa.txt`, `tulokset.txt`, `OHJEET.md` ja kansio
   `docs`. Ajastustiedosto on tehtävä käsin, koska pisteellä alkavat kansiot ovat piilossa:
   *Add file* → *Create new file* → nimeksi `.github/workflows/paivita.yml` → liitä sisältö.
3. **Ensimmäinen ajo:** **Actions** → *Päivitä ottelut* → **Run workflow**. Tarkista lokista,
   että jokaiselta joukkueelta löytyi otteluita.
4. **Julkaisu:** **Settings** → **Pages** → *Deploy from a branch* → **main**, kansio
   **/docs**.
5. **Oma osoite:** DNS-asetukset ovat Domainhotellissa, eivät Squarespacessa. Lisää
   **vain uusi rivi** — älä koske nimipalvelimiin, ne ohjaavat stude.fi:n Squarespaceen:
   tyyppi `CNAME`, nimi `basket`, arvo `jiistude.github.io`. Sen jälkeen GitHubissa
   **Settings** → **Pages** → *Custom domain* → `basket.stude.fi` → **Save**, ja kun varmenne
   on valmis, rastita **Enforce HTTPS**.
