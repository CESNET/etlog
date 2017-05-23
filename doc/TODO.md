# etlog-dev
- konfigurace apache
  - jak resit periodicke generovani dat -> dotazy ktere dela aplikace sama na sebe -> nebude nastaven remote user
  - dva ruzne vhosty - jeden jako _default_:443, druhy jako localhost:443?
- firewall
  - revize
  - nasledne nasazeni na produkci spolu s autentizaci
  - pridat do dokumentace?
- prava/role
  - v db existuji informace o mapovani uzivatel - pouzivane mac adresy


# etlog (produkce)
- monitoring
  - nechat skript pro konkrolu read only disku
  - zbytek obslehnout z wiki - https://wiki.cesnet.cz/doku.php?id=sd:monitorovani_sluzeb:servery:homeproj.cesnet.cz
  - skript pro monitorovani stari dat v db (> 1 hod)
  - notifikace pouze mailem
  - seznam spravcu?
  - na devu nema smysl nasazovat
  - postup "registrace"

- obecne vyhledavani
  - opravit dotaz s regularnim vyrazem


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


# TODO dobudoucna
- vyuzit http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172 pro grafy?
- lepsi reseni popisku na ose x pro intervaly < mesic?
- mrizka v grafech?
- lokalizace?
- snyk?
- hsts?
- minifikace js?
- optimalizace pro mobilni zarizeni?
- ceske realmy - odebrat omezeni na .cz?
- timeout db spojeni, automaticke znovu obnoveni?
- cachovani vysledku vyhledavani?
- ... ?



