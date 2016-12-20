# TODO

- obrazky do textu?
> vsechny ruzne verze grafu
> muzu vyuzit i mapu dostupnou na eduroam.cz
> pridat jeste obrazek hierarchie, s tim, ze tam bude muj system, aby bylo zrejme, kde v hierarchii je
- verze ?
> muze byt


# Detekce problémů funkčnosti služby

> Podle me je to nepouzitelne. Bude treba popsat co jste zkusil a napsat ze to nevede k smysluplnym vysledkum. Nicmene mam pochybnosti o tom ze ty grafy jsou OK. Krajne podivne je eduroam.muni.cz - nedovedu najit kde jste pro 23.11. vzal ze meli jen 140 uspesnych prihlaseni.


# Detekce uzivatelu v ruznych lokalitach soucasne

- pridat do repozitare zdrojovy json pro vypocet?
- dokumentace transformace xml dat?
- vystup transformace TODO
> zdokumentovat
- upravit popisky tabulky?
- implicitne razeno dle uzivatelskeho jmena


> tabulku predelat:
> pridat sloupec pro datum
> cas prvni autentizace a cas druhe autentizace
> popisky upravit na cas 1. autentizace a cas 2. autentizace
  > pouze instituce 1 a instituce 2
> pridat mac adresu, ktera se poji k zaznamu => potencialne zmenit cele db schema
> upravit cas do aktualni casove zony
> pridat tlacitko na prehozeni obsahu poli navstivena instituce 1 a navstivena instituce 2
> pridat vzdalenost do vysledne tabulky
> cas i vzdalenost zaokrouhlit na cele jednotky
> cas vypsat nejake inteligentne -> hodiny/minuty/sekundy .. 
> revize detekcnich dat -> bude upravena struktura vstupniho jsonu


# autentizace

bude zavreno na FW.
> Pokud bude chtit videt vedouci, tak bude moznost.

# Ostatní

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
  - Logovani je nastaveno, ale zadne soubory nejsou vytvareny !
    - V zurnalu nejaky vystup sice je, ale do logu se nedostane. Je tudiz problem v tom, ze zurnal se nezapisuje na disk? (`/etc/systemd/journald.conf` - #SystemMaxUse=)
    - pomoci loggeru lze do souboru zapsat bez problemu : `logger -p local0.info test`
    - je treba resit rotovani logu? syslog sam zajisti novy soubor pro kazdy den.
> zkontrolovat, jak budou formatovany zpravy

> potencialne vyzkouset jiny process manager, ktery nebude mit problem zapisovat do souboru a bude spravne formatovat zpravy

- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel - semik
> nema cenu v praci popisovat

> popsat, ze je pouzity systemd
- Pridana dokumentace k frontendu - vyhovuje takto? ([zde](https://github.com/CESNET/etlog#frontend))
- pdf DP do repozitare, jakmile bude odevzdano? jako dodatecna forma dokumentace?
> ano, muzu i zdrojaky

# text prace


- rozsirit mac count tim zpusobem, ze by se pro vsechny adresy konkretniho uzivatele udelal casovy graf
  kdy uzivatel adresy pouzival a pokud by se nektere intervaly prekryvaly, 
  mohlo by to indikovat sdileni identity -> muselo by se napriklad pouzivat nekolik zarizeni soucasne => uzivatel muze mit nekolik zarizeni soucasne
  - Pokud se uzivatel nijak neprekryva, neni treba ho nejak dale zkoumat, zrejme pouziva randomizaci mac adres

- do prace uvest, ze se poradilo odhalit nejake vyznamne sdilene identity

> soucasne zarizeni nema smysl resit - nema smysl protoze realny vysledek je k nicemu
> -> poznamka k uzivatelum k ruznych lokalitach soucasne

> zminit, ze puvodni data obsahovala bordel


# TODO list
1. Autentizace
  - použít rozcestník
2. přstupová práva
3. sshguard + FW -> semik
8. co s radlog.cesnet.cz - tim starym virtualem
  - ponechat nez bude napsany text prace
11. ...

# TODO dobudoucna
- vyvojovy server?
- vyuzit http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172 pro grafy?
- lepsi reseni popisku na ose x pro intervaly < mesic?
- mrizka v grafech?
- lokalizace?
- snyk?
- hsts?
- minifikace js?
- ... ?



