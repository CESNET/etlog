# Detekce problémů funkčnosti služby

- Grafy
1. pocty uspesnych autentizaci
2. pocty neuspesnych autentizaci
3. jejich pomer

pro vsechny grafy po dnech mesic zpet

vysypat na jednu stranku pro vsechny instituce
Pro jednu instituce idealne vedle sebe

staci uplne jednoducha staticka stranka

## Data

Data dostupná pro každou z institucí:

```
{ 'ibt.cas.cz':
{ current_stats: { fail: [ 0, 0, 0, 3 ], ok: [ 242, 198, 312, 277 ] },
  current_avg_stats: { ok: 257.25, fail: 0.75 },
  current_day_stats: { ok: [ 277 ], fail: [ 3 ] },
  old_stats: { fail: [ 0, 4, 0, 0 ], ok: [ 312, 103, 242, 198 ] },
  old_avg_stats: { ok: 213.75, fail: 1 },
  avg_ratio_current_to_old: { ok: 1.2035087719298245, fail: 0.75 },
  old_ok_fail_ratio: [ 0.038834951456310676, 0, 0, 0 ],
  current_ok_fail_ratio: [ 0.010830324909747292 ],
  old_fail_sd: 1.7320508075688772,
  current_fail_sd: 1.299038105676658 } }
```

Jednotlivé položky mají tento význam:

| atribut                       | význam                                                                                                    | poznámka  |
|-------------------------------|-----------------------------------------------------------------------------------------------------------|-----------|
|  current\_stats               | počet úspěšných a neúspěšných přihlášení předchozího dne v týdnu (například pondělí) za poslední měsíc včetně předchozího dne | například data pro: 11.11, 4.11. 28.10. 21.10          |
|  current\_avg\_stats          | průměrná hodnota pro úspěšná a neúspěsná přihlášení proměnné current\_stats                               |           |
|  current\_day\_stats          | počet úspěšných a neúspěšných přihlášení pro předchozí den                                                |           |
|  old\_stats                   | počet úspěšných a neúspěšných přihlášení předchozího dne v týdnu za poslední měsíc kromě předchozího dne  | například data pro: 4.11. 28.10. 21.10 14.10.         |
|  old\_avg\_stats              | průměrná hodnota pro úspěšná a neúspěsná přihlášení proměnné current\_stats                               |           |
|  avg\_ratio\_current\_to\_old | poměr hodnot current\_avg\_stats a old\_avg\_stats                                                        | klíč fail signalizuje n-násobnost nárůstu průměrného počtu neúspěsných přihlášení          |
|  old\_ok\_fail\_ratio         | poměr neúspěsných a úspěšných přihlášení pro promměnou old\_stats                                         |           |
|  current\_ok\_fail\_ratio     | poměr neúspěsných a úspěšných přihlášení pro předchozí den                                                |           |
|  old\_fail\_sd                | směrodatná odchylka neúspěšných přihlášení za poslední měsíc kromě předchozího dne                        |           |
|  current\_fail\_sd            | směrodatná odchylka neúspěšných přihlášení za poslední měsíc včetně předchozího dne                       |           |

- Jaká data má email obsahovat? (ukázka existujícího)

## Detekce

- využít `avg_ratio_current_to_old: { fail: }` ?
- využít `current_ok_fail_ratio` ? Hodnota je relativní vůči hodnotám old\_ok\_fail\_ratio.
- dynamická hodnota pro určení meze existence problému?
- použít více kritérií zároveň?
- počet úspěšných přihlášení musí být > 0? (co když nastane problém v průběhu dne?)
- porovnat fail\_count aktuálního dne s historickými daty? (n-násobné zvětšení signalizuje problém)


**I při použití vhodné detekce bude pravděpodobně každý den reportováno několik oblastí jako problémových,
což pro správce zřejmě bude zbytečná zátež při false-positive**

Potenciálně problémová data (data jsou filtrovana v ramci dnu pomoci mac adres):

<pre>
studenti.mvso.cz
{ current_stats: { fail: [ 5, 0, 4, 0 ], ok: [ 17, 17, 19, 22 ] },
  current_avg_stats: { ok: 18.75, fail: 2.25 },
  current_day_stats: { fail: [ 5 ], ok: [ 17 ] },
  old_stats: { fail: [ 0, 4, 0, 3 ], ok: [ 17, 19, 22, 15 ] },
  old_avg_stats: { ok: 18.25, fail: 1.75 },
  avg_ratio_current_to_old: { ok: 1.0273972602739727, fail: <b>1.2857142857142858</b> },
  old_ok_fail_ratio: [ 0, 0.21052631578947367, 0, 0.2 ],
  current_ok_fail_ratio: [ <b>0.29411764705882354</b> ],
  old_fail_sd: 1.7853571071357126,
  current_fail_sd: 2.277608394786075 }
vscht.cz
{ current_stats: { fail: [ 54, 36, 34, 36 ], ok: [ 336, 338, 319, 333 ] },
  current_avg_stats: { ok: 331.5, fail: 40 },
  current_day_stats: { fail: [ 54 ], ok: [ 336 ] },
  old_stats: { fail: [ 36, 34, 36, 26 ], ok: [ 338, 319, 333, 261 ] },
  old_avg_stats: { ok: 312.75, fail: 33 },
  avg_ratio_current_to_old: { ok: 1.0599520383693046, fail: <b>1.2121212121212122</b> },
  old_ok_fail_ratio: 
   [ 0.10650887573964497,
     0.10658307210031348,
     0.10810810810810811,
     0.09961685823754789 ],
  current_ok_fail_ratio: [ <b>0.16071428571428573</b> ],
  old_fail_sd: 4.123105625617661,
  current_fail_sd: 8.12403840463596 }
ujf.cas.cz
{ current_stats: { fail: [ 1, 0, 1, 2 ], ok: [ 9, 6, 7, 5 ] },
  current_avg_stats: { ok: 6.75, fail: 1 },
  current_day_stats: { fail: [ 1 ], ok: [ 9 ] },
  old_stats: { fail: [ 0, 1, 2, 0 ], ok: [ 6, 7, 5, 6 ] },
  old_avg_stats: { ok: 6, fail: 0.75 },
  avg_ratio_current_to_old: { ok: 1.125, fail: <b>1.3333333333333333</b> },
  old_ok_fail_ratio: [ 0, 0.14285714285714285, 0.4, 0 ],
  current_ok_fail_ratio: [ <b>0.1111111111111111</b> ],
  old_fail_sd: 0.82915619758885,
  current_fail_sd: 0.7071067811865476 }
cs.cas.cz
{ current_stats: { fail: [ 4, 1, 2, 2 ], ok: [ 25, 15, 20, 21 ] },
  current_avg_stats: { ok: 20.25, fail: 2.25 },
  current_day_stats: { fail: [ 4 ], ok: [ 25 ] },
  old_stats: { fail: [ 1, 2, 2, 2 ], ok: [ 15, 20, 21, 22 ] },
  old_avg_stats: { ok: 19.5, fail: 1.75 },
  avg_ratio_current_to_old: { ok: 1.0384615384615385, fail: <b>1.2857142857142858</b> },
  old_ok_fail_ratio: 
   [ 0.06666666666666667,
     0.1,
     0.09523809523809523,
     0.09090909090909091 ],
  current_ok_fail_ratio: [ <b>0.16</b> ],
  old_fail_sd: 0.4330127018922193,
  current_fail_sd: 1.0897247358851685 }
jamu.cz
{ current_stats: { fail: [ 71, 26, 31, 40 ], ok: [ 42, 102, 93, 117 ] },
  current_avg_stats: { ok: 88.5, fail: 42 },
  current_day_stats: { fail: [ 71 ], ok: [ 42 ] },
  old_stats: { fail: [ 26, 31, 40, 31 ], ok: [ 102, 93, 117, 89 ] },
  old_avg_stats: { ok: 100.25, fail: 32 },
  avg_ratio_current_to_old: { ok: 0.8827930174563591, fail: <b>1.3125</b> },
  old_ok_fail_ratio: 
   [ 0.2549019607843137,
     0.3333333333333333,
     0.3418803418803419,
     0.34831460674157305 ],
  current_ok_fail_ratio: [ <b>1.6904761904761905</b> ],
  old_fail_sd: 5.049752469181039,
  current_fail_sd: 17.478558292948534 }
lf1.cuni.cz
{ current_stats: { fail: [ 3, 3, 4, 1 ], ok: [ 67, 64, 62, 71 ] },
  current_avg_stats: { ok: 66, fail: 2.75 },
  current_day_stats: { fail: [ 3 ], ok: [ 67 ] },
  old_stats: { fail: [ 3, 4, 1, 1 ], ok: [ 64, 62, 71, 59 ] },
  old_avg_stats: { ok: 64, fail: 2.25 },
  avg_ratio_current_to_old: { ok: 1.03125, fail: <b>1.2222222222222223</b> },
  old_ok_fail_ratio: 
   [ 0.046875,
     0.06451612903225806,
     0.014084507042253521,
     0.01694915254237288 ],
  current_ok_fail_ratio: [ <b>0.04477611940298507</b> ],
  old_fail_sd: 1.299038105676658,
  current_fail_sd: 1.0897247358851685 }
jinonice.cuni.cz
{ current_stats: { fail: [ 6, 2, 1, 4 ], ok: [ 27, 22, 17, 17 ] },
  current_avg_stats: { ok: 20.75, fail: 3.25 },
  current_day_stats: { fail: [ 6 ], ok: [ 27 ] },
  old_stats: { fail: [ 2, 1, 4, 2 ], ok: [ 22, 17, 17, 21 ] },
  old_avg_stats: { ok: 19.25, fail: 2.25 },
  avg_ratio_current_to_old: { ok: 1.077922077922078, fail: <b>1.4444444444444444</b> },
  old_ok_fail_ratio: 
   [ 0.09090909090909091,
     0.058823529411764705,
     0.23529411764705882,
     0.09523809523809523 ],
  current_ok_fail_ratio: [ <b>0.2222222222222222</b> ],
  old_fail_sd: 1.0897247358851685,
  current_fail_sd: 1.920286436967152 }
vsb.cz
{ current_stats: { fail: [ 170, 115, 90, 92 ], ok: [ 449, 653, 696, 644 ] },
  current_avg_stats: { ok: 610.5, fail: 116.75 },
  current_day_stats: { fail: [ 170 ], ok: [ 449 ] },
  old_stats: { fail: [ 115, 90, 92, 88 ], ok: [ 653, 696, 644, 641 ] },
  old_avg_stats: { ok: 658.5, fail: 96.25 },
  avg_ratio_current_to_old: { ok: 0.9271070615034168, fail: <b>1.212987012987013</b> },
  old_ok_fail_ratio: 
   [ 0.17611026033690658,
     0.12931034482758622,
     0.14285714285714285,
     0.1372854914196568 ],
  current_ok_fail_ratio: [ <b>0.37861915367483295</b> ],
  old_fail_sd: 10.917302780449024,
  current_fail_sd: 32.275183965393595 }
gymlit.cz
{ current_stats: { fail: [ 1, 0, 4, 0 ], ok: [ 8, 11, 54, 6 ] },
  current_avg_stats: { ok: 19.75, fail: 1.25 },
  current_day_stats: { fail: [ 1 ], ok: [ 8 ] },
  old_stats: { fail: [ 0, 4, 0, 0 ], ok: [ 11, 54, 6, 9 ] },
  old_avg_stats: { ok: 20, fail: 1 },
  avg_ratio_current_to_old: { ok: 0.9875, fail: <b>1.25</b> },
  old_ok_fail_ratio: [ 0, 0.07407407407407407, 0, 0 ],
  current_ok_fail_ratio: [ <b>0.125</b> ],
  old_fail_sd: 1.7320508075688772,
  current_fail_sd: 1.6393596310755 }
oalib.cz
{ current_stats: { fail: [ 4, 3, 0, 3 ], ok: [ 52, 45, 36, 43 ] },
  current_avg_stats: { ok: 44, fail: 2.5 },
  current_day_stats: { fail: [ 4 ], ok: [ 52 ] },
  old_stats: { fail: [ 3, 0, 3, 2 ], ok: [ 45, 36, 43, 47 ] },
  old_avg_stats: { ok: 42.75, fail: 2 },
  avg_ratio_current_to_old: { ok: 1.0292397660818713, fail: <b>1.25</b> },
  old_ok_fail_ratio: 
   [ 0.06666666666666667,
     0,
     0.06976744186046512,
     0.0425531914893617 ],
  current_ok_fail_ratio: [ <b>0.07692307692307693</b> ],
  old_fail_sd: 1.224744871391589,
  current_fail_sd: 1.5 }
</pre>


# Grafy

- Heat mapa - možnosti:
  - http://amp.pharm.mssm.edu/clustergrammer/
  - http://bl.ocks.org/oyyd/859fafc8122977a3afd6
  - http://bl.ocks.org/ianyfchang/8119685
  - http://bl.ocks.org/tjdecke/5558084
  - http://tmroyal.github.io/Chart.HeatMap/
  - https://www.trulia.com/vis/tru247/

- ostatní - možnosti:
  - https://d3js.org/ - https://github.com/d3/d3/wiki/Gallery
  - http://bl.ocks.org/d3noob/b3ff6ae1c120eea654b5
  - https://bl.ocks.org/mbostock/3883245

- Ukázky
  - [1](https://etlog.cesnet.cz/#/graph_test_1)
  - [2](https://etlog.cesnet.cz/#/graph_test_2)
  - [3](https://etlog.cesnet.cz/#/graph_test_3)

> neni problem brat data ze souboru

> heat mapa by mela umet vyhledavat dle nazvu
> moznost nejakeho razeni podle vzajmene souvislosti (hodnoty)?

> sloupce pro ostatni grafy
> pokud bude generovani rychle, neni treba data predgenerovavat
> pro roaming -> nejvice poskytovany a nejvice vyuzivany
> prepinatelne pro ruzne hodnoty -> mesic, 3 mesice, rok, 5 let

> pro kterou instituci chce uzivatel grafy videt

> do jednoho grafu uspesne a neuspesne zaroven
> (pripadne uspesne primarne, neuspesne na klikatko)

> graf pro mac count

Pokud by generovani grafu trvalo prilis dlouho, tak generovat svg a pouze ho vkladat do stranky?

potencialni inspirace:

- http://bl.ocks.org/benjchristensen/2657838
- https://run.plnkr.co/EgVCkjg68c59Jdtv/
- http://nvd3.org/examples/multiBar.html
- http://nvd3.org/examples/multiBar.html
- http://bl.ocks.org/mbostock/1283663 
- http://bl.ocks.org/mstanaland/6100713
- https://gist.github.com/benjchristensen/1488375
- http://bl.ocks.org/benjchristensen/1488375
- https://plnkr.co/edit/JUaLXmeCvHh0zUmrKClQ?p=preview
- https://plnkr.co/edit/gMa09b2jO9shxCbXDaFD?p=preview
- http://stackoverflow.com/questions/35980068/d3-js-bar-chart-show-hide-bars-on-legend-click-how-to-filter-correctly
- http://bl.ocks.org/mbostock/3943967 
- https://bl.ocks.org/mbostock/1283663 - pouzit jako sloupcovy graf pro nejaka komplexnejsi data ?
- http://www.chartjs.org/docs/#bar-chart
- http://bl.ocks.org/biovisualize/5372077
- https://bl.ocks.org/mbostock/3885705 - checkbox
- pridat moznost razeni (https://bl.ocks.org/mbostock/3885705)?
- https://codepen.io/Rastikko/pen/GqNbqM

### Obecne k webovemu rozhrani

- Je nekde treba dalsi validace?

> Myslim ze CVS format ma mit nadpisy bunek na prvnim radku a na dalsich radcich pak hodnoty. Takhle jak je to udelano to vyzaduje dalsi zpracovani necim sofistikovanejsim nez je tabulkovy procesor.

> V rozhrani mac count & shared mac je v seznamu pravem sloupci klikatelna mezera. myslim ze jste to zminioval uz posledne ze si s tim nevite rady. je to relativne otravne kdyz by jste rad par tech adres zkopiroval. ted to vpodstate neni mozne.

### Obecne ke grafum

> vyresit x-ovou osu

> zkusit pridat nejakou mrizku -> oddeleni tydnu(mesicu ... ) na ose x


## pocet zarizeni > 2 na jednoho uzivatele (mac count)

[rozhrani](https://etlog.cesnet.cz/#/mac_count)

- nejake pripominky?

> pridejte prosim jeste podminku na vysledek autentizace. doslo mi to pri kontrole tech hotel@ wifi@ ted je to plne failu.

- V db jsou pouze data s uspesnymi autentizacemi - myslim, ze narazite na problem casoveho omezeni.
- kdyz vybereru data za posledni dva dny a vyradim anonymni, uz tam ani jedno nemam.

## sdilene mac adresy (shared mac)

[rozhrani](https://etlog.cesnet.cz/#/shared_mac)

- nejake pripominky?
- jak resit prokliknuti na hledani, kdyz je vybran pouze adresa?
  - tento pripad je stale problemovy

> Nevim v cem vidite problem? Kdyz kliknu na uzivatele tak je preneseno do hledaciho formulare jeho jmeno a mac adresa. Kdyz kliknu na mac tak me to sprdne ze chybi uzivatelske jmeno. Jaky je k tomu duvod? Prazdny formular pro hledani ne, ale kdyz je neco vyplneno tak je to ok ne?

## Obecne vyhledavani

[rozhrani](https://etlog.cesnet.cz/#/search)

- nejake pripominky?

> Bylo by mozne otocit default razeni? tj. zobrazovat na prvni strance nejcerstvejsi informace

- Jaky vyznam ma hledani podle realmu?
- Rozhrani je navrzene tak, ze backend neumoznuje hledat, aniz by bylo zadano uzivatelske jmeno.
- Tudiz realm bude pro vsechny(?) dostupne zaznamy stejny jako domenova cast uzivatelskeho jmena.

> Tak tohle souvisi se shared mac, vyse. Tohle omezeni mi nejak uniklo a prilis mi nedava smysl. Muzete rozvest proc je takove omezeni nutne? Hledani podle realmu by umoznilo vypsat si aktualni autentizace uzivatelu z nejake instituce. Hledani podle MAC adresy mi prijde docela prirozeny pozadavek.

> neslo by v uzivatelskem jmene hledani podle reg vyrazu?

- Hledani uzivatelskeho jmena podle regularniho vyrazu by bylo mozne, ale nejsem si jisty jake by to melo dusledky:
  - Uzivatel sam by mel mit moznost vyhledavat pouze sve zaznamy (presna shoda username, ktere bude napevno vyplneno).
  - Admin by potencialne mohl vyhledavat kohokoliv (vcetne moznosti pouzit reg vyraz).
  - Pravdepodobne by bylo nutne generovat dve rozdilne stranky pro uzivatele/admina nebo jinym zpusobem zajistit, ze uzivatel nebude mit k takove funkcionalite pristup.
  - Jak moc je tato funkcionalita dulezita?

> Me to neprijde tak slozite, po odeslani do backendu se podivate na opravneni uzivatele. pokud neni admin a nesedi uzivatelske jmeno tak hledani zamitnete. V cem vidite problem? Prezijem bez toho, ale prijde mi to nekonzistetni se zbytkem aplikace.

## Rozhrani pro roaming

- [rozhrani](https://etlog.cesnet.cz/#/roaming_most_used)
- [rozhrani](https://etlog.cesnet.cz/#/roaming_most_provided)
- Ponechat?
- Prejmenovat?


- [rozhrani](https://etlog.cesnet.cz/#/roaming_most_used_test)
- [rozhrani] (https://etlog.cesnet.cz/#/roaming_most_provided_test)
- Ponechat?
- Prejmenovat?


## Instituce nejvice cerpajici roaming

> Data jsou obracene -> prejmenovat nejvice vyuzivany a poskytovany
> Kdyz je jednou nastaveno manualne datum, uz nefunguje prepinani pomoci radio buttonu

> Ve smyslu které instituce=REALM (prostřednctvím svých uživatelú) nejvíce využívají eduroamu. Zase grupováno přes MAC/den. Časový interval by bylo pěkné mít volitelný + nějakou předvolbu 1/3/12měs. Úplně nevím co mislíte těmi "povinnými institucemi". Množství polože na ose X by mohla regulovat parametrem, tj. zvolit si že chci nakreslit graf s max 25 institucemi. I tady mi přijde užitečné mít data k dispozici ve formě tabulky. Také by bylo zajímavé vidět grafy pro každý jednotlivý REALM v čase. Viz následující bod.


- Prosim o komentar k rozhranim - jake ponechat, jestli udelat nove (prosim konkretni specifikaci, co a jak ma rozhrani delat), ....


## Instituce nejvice poskytujici roaming

> Instituce=VISINST které nejvíce poskytují konektivitu, loginy grupovány MAC=CSI/den. Opět užitečná tabulka a graf pro X nej více využívaných. Tuhle funkcionalitu dnes nemám. Mám grafy toho jak jsou jednotlivé instituce využívány v čase, to je zde: https://ermon.cesnet.cz/roaming/ tohle je určitě také zajímavé.

- Prosim o komentar k rozhranim - jake ponechat, jestli udelat nove (prosim konkretni specifikaci, co a jak ma rozhrani delat), ....


## aktivita CZ eduroamu

> Nová sekce bez rozlišení VISINST/REALM jen grupováno přes MAC/CSI/den.

- Jak ma vysledny graf vypadat?
- vyuzit napr https://bl.ocks.org/mbostock/3887051 ?

> Ja bych si představoval že vezmete tohle: https://etlog.cesnet.cz/#/roaming_most_provided 

> vyhodíte Počet využití:, Počet poskytnutí:, Poměr:, Jméno instituce:

> bude tam Realm: a Navštívená institiuce, casovy interval + rychla volba mesic/3/rok

> kdyz nevypnite ani realm ani vis inst tak získáme graf jak moc naši lidé roamují v čase

> kdyz vyplnime realm = cesnet.cz tak získáme graf jak moc lidé z CESNETu roamují v čase

> kdyz vyplnime vis.inst = cesnet.cz tak získáme graf jak moc ostatní uživatelé využívají eduroam na CESNETu.

> je potreba vyresit tu osu X aby to bylo prehlednejsi

## neuspesna prihlaseni

[rozhrani](https://etlog.cesnet.cz/#/failed_logins)

- Co ma vlastne graf zobrazovat?
  - pocet neuspesnych prihlaseni pro vsechny dny v zadanem intervalu?
  - pocet neuspesnych prihlaseni pro danou instituci pro vsechny dny v zadanem intervalu?
  - pocet neuspesnych prihlaseni pro daneho uzivatele pro vsechny dny v zadanem intervalu?
  - ... ?
- povinne instituce, pro kterou maji byt data zobrazena?
- povinne uzivate, pro ktereho maji byt data zobrazena?


## Uspesna prihlaseni

- nove [rozhrani](https://github.com/CESNET/etlog#succ_logins) pro uspesna prihlaseni
- udelat k nemu webovou cast?
  - backend je hotovy, frontend je prace na 15 minut


## Element pro vyber datumu

- momentalne nelze omezovat vybirana data v zavislosti na jiz zvolenem minimu/maximu.
- Vyhovuje takto?
- Resit nejak intuitivneji napr vyber jednoho dne?
  - Soucasny stav posktuje data krome vybraneho maxima.



# Ostatní

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
  - Logovani je nastaveno, ale zadne soubory nejsou vytvareny !
    - V zurnalu nejaky vystup sice je, ale do logu se nedostane. Je tudiz problem v tom, ze zurnal se nezapisuje na disk? (`/etc/systemd/journald.conf` - #SystemMaxUse=)
    - pomoci loggeru lze do souboru zapsat bez problemu : `logger -p local0.info test`
    - je treba resit rotovani logu? syslog sam zajisti novy soubor pro kazdy den.
> zkontrolovat, jak budou formatovany zpravy

- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel - semik
- Dokumentace frontendu - co a jak popsat?
- Momentalne neni nijak validovan/omezovan vstup formularu. Pridat nejakou validaci?
- Zmenit popisky v navigaci? (Nevim, zda je dostatecne jasne, co ktera stranka zobrazuje)
- Pridana dokumentace k frontendu - vyhovuje takto? ([zde](https://github.com/CESNET/etlog#frontend))



# TODO list
1. Autentizace
  - použít rozcestník
2. Webové rozhraní
3. sshguard + FW -> semik
6. grafy - statistiky
  - (grafy negenerovat na kliknuti ale nejak v noci)
7. přstupová práva
8. co s radlog.cesnet.cz - tim starym virtualem
  - ponechat nez bude napsany text prace
11. ...

# TODO dobudoucna
