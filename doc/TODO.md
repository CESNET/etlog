# Detekce problémů funkčnosti služby

## Data

[data](https://etlog.cesnet.cz/#/detection_data)

- Jakym zpusobem tedy kontrolu stavu sluzby resit?
- Koho notifikovat?
- Jak by mela notifikace vypadat?

# mapa roamingu

[rozhrani](https://etlog.cesnet.cz/#/heat_map)

- umoznuje razeni podle radku i sloupcu
- pripominky?



# Detekce uzivatelu v ruzynch lokalitach soucasne

- xml s geoografickymi informacemi
kazda instituce muze mit mnoho bodu - nevime, ze ktereho bodu autentizace vysla
- TODO


# Obecne vyhledavani

[rozhrani](https://etlog.cesnet.cz/#/search)

> neslo by v uzivatelskem jmene hledani podle reg vyrazu?

Hledani uzivatelskeho jmena podle regularniho vyrazu je nyni mozne.
Implicitne se provadi vyhledavani na presnou shodu.
Hledani pomoci regularniho vyrazu je mozne pomoci javascriptove regex syntaxe.
Napriklad pro vsechny uviatele, kteri maji ve jmenu cesnet je vstup  "/^.*@cesnet.cz/".

Stale neni dokoncena autentizace a to podle me v souvislosti s timto rozhranim predstavuje velky problem.

# organizace nejvíce poskytující konektivitu, organizace nejvíce využívající roaming

> pridat pocet unikatnich za cele obdobi 
> -> udelat dotazem na heat mapu
> udelat jako http://bl.ocks.org/mbostock/3886208
> db.heat_map.find({ timestamp : { $gte : d, $lt : d2}, realm : "upol.cz"} )
> do grafu i do tabulky
> jak pro poskytovane tak pro vyuzivane


# autentizace

Pokud zatim nenastal zadny pokrok s debugem autentizace, tak aplikaci nechat v soucasnem stavu a
pouze omezit pristupnost pomoci IP adres v iptables?

Takove reseni neni idealni, ale data alespon nebudou pristupna komukoliv.


# aktivita CZ eduroamu

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
- Pridana dokumentace k frontendu - vyhovuje takto? ([zde](https://github.com/CESNET/etlog#frontend))


# TODO list
1. Autentizace
  - použít rozcestník
2. přstupová práva
3. sshguard + FW -> semik
8. co s radlog.cesnet.cz - tim starym virtualem
  - ponechat nez bude napsany text prace
10. snyk?
11. ...

# TODO dobudoucna
- vyvojovy server?
- vyuzit http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172 pro grafy?
- lepsi reseni popisku na ose x pro intervaly < mesic?
- mrizka v grafech?
- lokalizace?
- ... ?



