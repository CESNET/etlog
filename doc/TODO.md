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



# mapa roamingu

[rozhrani](https://etlog.cesnet.cz/#/heat_map)

- umoznuje razeni podle radku i sloupcu
- pripominky?

> budu potrebovat to trideni vysvetlit

> neni mi jasne co je v radku co je v sloupci, nejak to popsat?

> chtelo by to profiltrovat vstupni data, je tam spousta instituci/realmu ktrey nevykazuji zadnou rozumnou aktivitu treba realm doma-semik.cz s tim sem si hral jen chvilicku. Neslo by to nejak omezit na ty kteri jsou aktivni? S volitelnou hodnotu aktivnosti?

# Detekce uzivatelu v ruznych lokalitach soucasne

- xml s geoografickymi informacemi
kazda instituce muze mit mnoho bodu - nevime, ze ktereho bodu autentizace vysla
- TODO


# Obecne sloupcove grafy

- pridany linky pro hodnoty na ose y
- mirna uprava vzhledu osy x
- vyhovuje takto?

> k jake zmene doslo na ose x nedovedu poznat. Linky jsou dobre, jen jak jsou tluste sloupecky, tak se nedaji sledovat a tak u nizsich hodnot nejsou moc pouzitelne. Nevim jak to vyresit lip, castecna pruhlednost sloupcu? Asi to nechte jak je.


# Obecne vyhledavani

[rozhrani](https://etlog.cesnet.cz/#/search)

> neslo by v uzivatelskem jmene hledani podle reg vyrazu?

Hledani uzivatelskeho jmena podle regularniho vyrazu je nyni mozne.
Implicitne se provadi vyhledavani na presnou shodu.
Hledani pomoci regularniho vyrazu je mozne pomoci javascriptove regex syntaxe.
Napriklad pro vsechny uviatele, kteri maji ve jmenu cesnet je vstup  "/^.*@cesnet.cz/".

Stale neni dokoncena autentizace a to podle me v souvislosti s timto rozhranim predstavuje velky problem.

# organizace nejvíce poskytující konektivitu, organizace nejvíce využívající roaming

- pridan pocet unikatnich uzivatelu za cele obdobi
  - pridano do grafu i tabulky

- pripominky?

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



