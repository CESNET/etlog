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
- optimalizace pro mobilni zarizeni?
- ceske realmy - odebrat omezeni na .cz?
- ... ?



