# Ostatní

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
  - Logovani je nastaveno, ale zadne soubory nejsou vytvareny !
    - V zurnalu nejaky vystup sice je, ale do logu se nedostane. Je tudiz problem v tom, ze zurnal se nezapisuje na disk? (`/etc/systemd/journald.conf` - #SystemMaxUse=)
    - pomoci loggeru lze do souboru zapsat bez problemu : `logger -p local0.info test`
    - je treba resit rotovani logu? syslog sam zajisti novy soubor pro kazdy den.

# TODO na pozdeji
- databazi vyrobcu sitovek
  - tooltip pri najeti na adresu
  - udelat jako cronjob - jednou za mesic obnovit db
-  statistiky aktivnich realmu / vyuzivani eduroamu institucemi historicke
  - tabulka -> do radku realmy, do sloupce roky a do bunky pocet uspesnych autentizaci/unikatnich uzivatelu

