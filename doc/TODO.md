# Reporty

- Sjednotit české a anglické popisky v emailech?

## Neúspěsná přihlášení

Celkovým počtem je míněno:
  1. počet neúspěšných přihlášení za poslední měsíc, i uživatelé, kteří se úspěsně přihlásili?
  2. počet neúspěšných přihlášení za poslední měsíc, pouze uživatelé, kteří se za poslední měsíc nepřihlásili ani jednou úspěšně?
  3. počet neúspěšných přihlášení za poslední měsíc, i uživatelé, kteří se úspěsně přihlásili, omezení na realm?
  4. počet neúspěšných přihlášení za poslední měsíc, pouze uživatelé, kteří se za poslední měsíc nepřihlásili ani jednou úspěšně, omezení na realm?
  5. ... ?

Aktuálně je použito 1.

Je nový formát emailu s poměrem celkového počtu autentizací OK?

## Invalidní záznamy

Je nový formát emailu s procentuálním poměrem ke všem importovaným záznamům OK?

### Unikátnost

Řešit/neřešit?

Jak filtrovat?
- pomocí dvojice pn,csi v rámci jednoho souboru?
- pomocí dvojice pn,csi v rámci všech souborů?
- pomocí ingorování monitoring prefixu pro csi?
- ...?

### Dostupnost

Řešit/neřešit?

- Dostupnost pouze v souborech nebo nějakým způsobem skrze aplikaci?
- Dostupnost pro správce všech zapojených institucí?

# Zálohování

- Co zálohovat?
- Jak často?
- Kolik záloh uchovávat?

# Detekce problémů funkčnosti služby

TODO

# Import dat

## Filtrování

- povolit import záznamů s prázdnými jmény?
- nějakou další logiku, která bude analyzovat/zobrazovat prázdné mac adresy a jména? (prázdné mac adresy tvoří zhruba 5 %, prázdná username zhruba 20 %)

# Archivace

- Archivace jednou za týden.
- Archivována data stará 14 dní až týden.
- Žádná data nejsou mazána.

- Vyhovuje to takto?

# Ostatní

- specifikovat licenci v repozitáři?

# TODO list
1. Autentizace
2. Webové rozhraní
3. ...
