# Detekce uzivatelu v ruznych lokalitach soucasne

nova verze nasazena na [devu](https://etlog-dev.cesnet.cz/#/concurrent_users)

pripominky ?

v mailu

# copy paste primo z webu

nova verze nasazena [zde](https://etlog-dev.cesnet.cz/#/mac_count) a [zde](https://etlog-dev.cesnet.cz/#/shared_mac)

pripominky ?

Ok. Dekuji.

# download dat

reseni [issue](https://github.com/CESNET/etlog/issues/1) nasazeno na [devu](https://etlog-dev.cesnet.cz/#/shared_mac)

pripominky?

Ok. Dekuji.

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



