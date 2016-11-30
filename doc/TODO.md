# Detekce problémů funkčnosti služby

## Data

[data](https://etlog.cesnet.cz/#/detection_data)

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




### Detekce uzivatelu v ruzynch lokalitach soucasne

- xml s geoografickymi informacemi
kazda instituce muze mit mnoho bodu - nevime, ze ktereho bodu autentizace vysla
- TODO


## Obecne vyhledavani

[rozhrani](https://etlog.cesnet.cz/#/search)

> alespon nejake pole musi byt vyplneno pro moznost vyhledavani



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


## organizace nejvíce poskytující konektivitu, organizace nejvíce využívající roaming

> pridat pocet unikatnich za cele obdobi 
> -> udelat dotazem na heat mapu
> udelat jako http://bl.ocks.org/mbostock/3886208
> db.heat_map.find({ timestamp : { $gte : d, $lt : d2}, realm : "upol.cz"} )
> do grafu i do tabulky
> jak pro poskytovane tak pro vyuzivane


## aktivita CZ eduroamu

[rozhrani](https://etlog.cesnet.cz/#/roaming_activity)

- nejake pripominky?

# Ostatní

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
  - Logovani je nastaveno, ale zadne soubory nejsou vytvareny !
    - V zurnalu nejaky vystup sice je, ale do logu se nedostane. Je tudiz problem v tom, ze zurnal se nezapisuje na disk? (`/etc/systemd/journald.conf` - #SystemMaxUse=)
    - pomoci loggeru lze do souboru zapsat bez problemu : `logger -p local0.info test`
    - je treba resit rotovani logu? syslog sam zajisti novy soubor pro kazdy den.
> zkontrolovat, jak budou formatovany zpravy

- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel - semik
- Dokumentace frontendu - co a jak popsat?
- Pridana dokumentace k frontendu - vyhovuje takto? ([zde](https://github.com/CESNET/etlog#frontend))



# TODO list
1. Autentizace
  - použít rozcestník
3. sshguard + FW -> semik
7. přstupová práva
8. co s radlog.cesnet.cz - tim starym virtualem
  - ponechat nez bude napsany text prace
11. ...

# TODO dobudoucna
- vyvojovy server?
- vyuzit http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172 pro grafy?
- lepsi reseni popisku na ose x pro intervaly < mesic?
- mrizka v grafech?
- ... ?



