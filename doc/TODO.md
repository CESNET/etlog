# system pro ZP

- zajistit prirazeni oponentury

# Detekce problémů funkčnosti služby

## Data

[data](https://etlog.cesnet.cz/#/detection_data)

- Jakym zpusobem tedy kontrolu stavu sluzby resit?
- Koho notifikovat?
- Jak by mela notifikace vypadat?

> Podle me je to nepouzitelne. Bude treba popsat co jste zkusil a napsat ze to nevede k smysluplnym vysledkum. Nicmene mam pochybnosti o tom ze ty grafy jsou OK. Krajne podivne je eduroam.muni.cz - nedovedu najit kde jste pro 23.11. vzal ze meli jen 140 uspesnych prihlaseni.

```
# bzgrep VISINST=1eduroam.muni.cz fticks-full.2016_11_23.log.bz2  |grep FAIL$  | sed "s/.*CSI=//" | sed "s/#.*//" | grep -vi ^70-6F | sort -u | wc -l
506
# bzgrep VISINST=1eduroam.muni.cz fticks-full.2016_11_23.log.bz2  |grep OK$  | sed "s/.*CSI=//" | sed "s/#.*//" | grep -vi ^70-6F | sort -u | wc -l
2050
```

Prikazi mi davaji stejny vystup, nicmene podrobnejsi analyza ukazala, ze standartni nastroje na toto nestaci:
```
# bzgrep VISINST=1eduroam.muni.cz fticks-full.2016_11_23.log.bz2  | grep FAIL$  | sed "s/.*CSI=//" | sed "s/#.*//" | grep -vi ^70-6F | sort -u | tail
```

- Nove rozhrani pro grafy, data pregenerovana
- Dotaz na data vyse pomoci:
```
 curl 'https://etlog.cesnet.cz/api/visinst_logins/?timestamp=2016-11-23&realm=eduroam.muni.cz'
```

obdobni prikaz na radce dava stejne vysledek
```
zcat ~/logs/fticks/fticks-2016-11-23.gz | grep VISINST=1eduroam.muni.cz | grep OK$  | sed "s/.*CSI=//" | sed "s/#.*//" | grep -vi ^70-6F |  tr "[[:upper:]]" "[[:lower:]]" | sed 's/\.//g; s/-//g; s/://g'  | sort -u | wc -l

```

- jednou tydne generovat data
- dve verze - grupovana a negrupovana
- dve ruzne stranky pro grupovana a negrupovana data
- zpristupnit z menu, primo do menu



# mapa roamingu

[rozhrani](https://etlog.cesnet.cz/#/heat_map)

- umoznuje razeni podle radku i sloupcu
- pripominky?

> budu potrebovat to trideni vysvetlit

> neni mi jasne co je v radku co je v sloupci, nejak to popsat?

> chtelo by to profiltrovat vstupni data, je tam spousta instituci/realmu ktrey nevykazuji zadnou rozumnou aktivitu treba realm doma-semik.cz s tim sem si hral jen chvilicku. Neslo by to nejak omezit na ty kteri jsou aktivni? S volitelnou hodnotu aktivnosti?

> pridat filtrovani dat pomoci poctu - jedno pole pro pocet pouziti i pocet poskytnuti
> zmenit barevnou paletu - pouzit interpolateRdYlGn a otocit spektrum
> upravit popisky sloupce - jsou mirne posunute
> pridat tooltip na radky a sloupce -> realm, visinst

# Detekce uzivatelu v ruznych lokalitach soucasne

- xml s geoografickymi informacemi
kazda instituce muze mit mnoho bodu - nevime, ze ktereho bodu autentizace vysla
- TODO

> pokud by bylo mozne zpracovat dynamicky, tak by to bylo ok, ale pokud
by interaktivni zpracovani trvalo dlouho, tak generovat nejak staticky
> je treba implicitne vyhodit anonymous uzivatele

> soucasne zarizeni nema smysl resit - nema smysl protoze realny vysledek je k nicemu

> do repozitare : xml ne, perl ano, vypocet


# Obecne vyhledavani

[rozhrani](https://etlog.cesnet.cz/#/search)

> neslo by v uzivatelskem jmene hledani podle reg vyrazu?

Hledani uzivatelskeho jmena podle regularniho vyrazu je nyni mozne.
Implicitne se provadi vyhledavani na presnou shodu.
Hledani pomoci regularniho vyrazu je mozne pomoci javascriptove regex syntaxe.
Napriklad pro vsechny uviatele, kteri maji ve jmenu cesnet je vstup  "/^.*@cesnet.cz/".

Stale neni dokoncena autentizace a to podle me v souvislosti s timto rozhranim predstavuje velky problem.

> normalizace vstupu mac adresy, takhle to nenajde ani kdyz je vstup vsemi velkymi

# organizace nejvíce poskytující konektivitu, organizace nejvíce využívající roaming

- pridan pocet unikatnich uzivatelu za cele obdobi
  - pridano do grafu i tabulky

- pripominky?

> pekne, jen proc najednou jina barva? prosil bych navrat k nejake eduroam modre

> csv format by mel odpovidat zobrazeny tabulce, ted jsou cisla prvni

- csv nerespektuje poradi tabulky ve vsech pohledech - ma brat zretel na poradi sloupcu v tabulce vsude?

> predelat vsude, tak aby stahovana data odpovidala poradi v tabulce

# autentizace

Pokud zatim nenastal zadny pokrok s debugem autentizace, tak aplikaci nechat v soucasnem stavu a
pouze omezit pristupnost pomoci IP adres v iptables?

Takove reseni neni idealni, ale data alespon nebudou pristupna komukoliv.


# Ostatní

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
  - Logovani je nastaveno, ale zadne soubory nejsou vytvareny !
    - V zurnalu nejaky vystup sice je, ale do logu se nedostane. Je tudiz problem v tom, ze zurnal se nezapisuje na disk? (`/etc/systemd/journald.conf` - #SystemMaxUse=)
    - pomoci loggeru lze do souboru zapsat bez problemu : `logger -p local0.info test`
    - je treba resit rotovani logu? syslog sam zajisti novy soubor pro kazdy den.
> zkontrolovat, jak budou formatovany zpravy

> potencialne vyzkouset jiny process manager, ktery nebude mit problem zapisovat do souboru a bude spravne formatovat zpravy

- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel - semik
- Pridana dokumentace k frontendu - vyhovuje takto? ([zde](https://github.com/CESNET/etlog#frontend))
- pdf DP do repozitare, jakmile bude odevzdano? jako dodatecna forma dokumentace?
> ano

# text prace


- rozsirit mac count tim zpusobem, ze by se pro vsechny adresy konkretniho uzivatele udelal casovy graf
  kdy uzivatel adresy pouzival a pokud by se nektere intervaly prekryvaly, 
  mohlo by to indikovat sdileni identity -> muselo by se napriklad pouzivat nekolik zarizeni soucasne => uzivatel muze mit nekolik zarizeni soucasne
  - Pokud se uzivatel nijak neprekryva, neni treba ho nejak dale zkoumat, zrejme pouziva randomizaci mac adres

- do prace uvest, ze se poradilo odhalit nejake vyznamne sdilene identity


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
- ... ?



