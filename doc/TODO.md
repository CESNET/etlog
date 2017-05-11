# etlog-dev
- konfigurace apache
  - vsechny atributy, ktere maji byt dostupne v aplikaci musi byt nakonfigurovane v apachi
  - remote user pomoci promenne prostredi eppn, ktera je vytvorena z promenne REMOTE\_USER
  - REMOTE\_USER je dostupna jako SSL environment variable (dokumentace https://httpd.apache.org/docs/current/mod/mod_headers.html#header)
  - dokumentace rika:
> The %s format specifier is only available in Apache 2.1 and later; it can be used instead of %e to avoid the overhead of enabling SSLOptions +StdEnvVars. If SSLOptions +StdEnvVars must be enabled anyway for some other reason, %e will be more efficient than %s.
- federace
  - xml data - vyznam
  - xml data pridat do federace?


# etlog (produkce)
- monitoring
  - nechat skript pro konkrolu read only disku
  - zbytek obslehnout z wiki
  - skript pro monitorovani stari dat v db (> 1 hod)
  - notifikace pouze mailem
  - seznam spravcu?

- obecne vyhledavani
  - "opraveny" s regularnim vyrazem
  - k cemu je dotaz pro /@realm.tld/, kdyz je mozne presne specifikovat realm?


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


# TODO list
1. Autentizace
  - použít rozcestník
2. přstupová práva
3. sshguard + FW -> semik

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



