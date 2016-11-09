# Reporty

## Templaty

### Neúspěsná přihlášení

[github](https://github.com/CESNET/etlog/blob/master/request.js#L78)

- Javascript nema heredoc, tudiz je problematicke napsat telo jako souvislou cast textu
- předmět emailu je nastaven [github](https://github.com/CESNET/etlog/blob/master/mail.js#L53)
- limit počtu výsledků je nastaven [github](https://github.com/CESNET/etlog/blob/master/cron.js#L15)
- Vyhovuje takto?

### Invalidní záznamy

[github](https://github.com/CESNET/etlog/blob/master/scripts/invalid_records_mail.sh#L43)

- Prazdna uzivatelska jmena nebudou pro data v tomto tydnu (7 - 13.11.) kompletni (nasazeno az v ut vecer)
- Vyhovuje takto?


# Zálohování DB

- Co zálohovat?
> zalohovat celou db
> udelat skript, ktery bude zalohovat na stejne misto
> `/etc/duply/system/pre` - spusti pred zalohovanim
- Jak často?
> neni treba resit
- Kolik záloh uchovávat?
> neni treba resit

# Detekce problémů funkčnosti služby

## Data

Data dostupná pro každou z institucí:

```
{ 'ibt.cas.cz':
{ current_stats: { fail: [ 0, 0, 0, 3 ], ok: [ 242, 198, 312, 277 ] },
  current_avg_stats: { ok: 257.25, fail: 0.75 },
  current_day_stats: { ok: [ 277 ], fail: [ 3 ] },
  old_stats: { fail: [ 0, 4, 0, 0 ], ok: [ 312, 103, 242, 198 ] },
  old_avg_stats: { ok: 213.75, fail: 1 },
  avg_ratio_current_to_old: { ok: 1.2035087719298245, fail: 0.75 },
  old_ok_fail_ratio: [ 0.038834951456310676, 0, 0, 0 ],
  current_ok_fail_ratio: [ 0.010830324909747292 ],
  old_fail_sd: 1.7320508075688772,
  current_fail_sd: 1.299038105676658 } }
```

Jednotlivé položky mají tento význam:

| atribut                       | význam                                                                                                    | poznámka  |
|-------------------------------|-----------------------------------------------------------------------------------------------------------|-----------|
|  current\_stats               | počet úspěšných a neúspěšných přihlášení předchozího dne v týdnu (například pondělí) za poslední měsíc včetně předchozího dne |           |
|  current\_avg\_stats          | průměrná hodnota pro úspěšná a neúspěsná přihlášení proměnné current\_stats                               |           |
|  current\_day\_stats          | počet úspěšných a neúspěšných přihlášení pro předchozí den                                                |           |
|  old\_stats                   | počet úspěšných a neúspěšných přihlášení předchozího dne v týdnu za poslední měsíc kromě předchozího dne  |           |
|  old\_avg\_stats              | průměrná hodnota pro úspěšná a neúspěsná přihlášení proměnné current\_stats                               |           |
|  avg\_ratio\_current\_to\_old | poměr hodnot current\_avg\_stats a old\_avg\_stats                                                        | klíč fail signalizuje n-násobnost nárůstu průměrného počtu neúspěsných přihlášení          |
|  old\_ok\_fail\_ratio         | poměr neúspěsných a úspěšných přihlášení pro promměnou old\_stats                                         |           |
|  current\_ok\_fail\_ratio     | poměr neúspěsných a úspěšných přihlášení pro předchozí den                                                |           |
|  old\_fail\_sd                | směrodatná odchylka neúspěšných přihlášení za poslední měsíc kromě předchozího dne                        |           |
|  current\_fail\_sd            | směrodatná odchylka neúspěšných přihlášení za poslední měsíc včetně předchozího dne                       |           |

- Jaká data má email obsahovat? (ukázka existujícího)

## Detekce

- využít `avg_ratio_current_to_old: { fail: }` ?
- využít `current_ok_fail_ratio` ? Hodnota je relativní vůči hodnotám old\_ok\_fail\_ratio.
- dynamická hodnota pro určení meze existence problému?
- použít více kritérií zároveň?
- počet úspěšných přihlášení musí být > 0? (co když nastane problém v průběhu dne?)
- porovnat fail\_count aktuálního dne s historickými daty? (n-násobné zvětšení signalizuje problém)


**I při použití vhodné detekce bude pravděpodobně každý den reportováno několik oblastí jako problémových,
což pro správce zřejmě bude zbytečná zátež při false-positive**

Potenciálně problémová data (data jsou filtrovana v ramci dnu pomoci mac adres):

<pre>
studenti.mvso.cz
{ current_stats: { fail: [ 5, 0, 4, 0 ], ok: [ 17, 17, 19, 22 ] },
  current_avg_stats: { ok: 18.75, fail: 2.25 },
  current_day_stats: { fail: [ 5 ], ok: [ 17 ] },
  old_stats: { fail: [ 0, 4, 0, 3 ], ok: [ 17, 19, 22, 15 ] },
  old_avg_stats: { ok: 18.25, fail: 1.75 },
  avg_ratio_current_to_old: { ok: 1.0273972602739727, fail: <b>1.2857142857142858</b> },
  old_ok_fail_ratio: [ 0, 0.21052631578947367, 0, 0.2 ],
  current_ok_fail_ratio: [ <b>0.29411764705882354</b> ],
  old_fail_sd: 1.7853571071357126,
  current_fail_sd: 2.277608394786075 }
vscht.cz
{ current_stats: { fail: [ 54, 36, 34, 36 ], ok: [ 336, 338, 319, 333 ] },
  current_avg_stats: { ok: 331.5, fail: 40 },
  current_day_stats: { fail: [ 54 ], ok: [ 336 ] },
  old_stats: { fail: [ 36, 34, 36, 26 ], ok: [ 338, 319, 333, 261 ] },
  old_avg_stats: { ok: 312.75, fail: 33 },
  avg_ratio_current_to_old: { ok: 1.0599520383693046, fail: <b>1.2121212121212122</b> },
  old_ok_fail_ratio: 
   [ 0.10650887573964497,
     0.10658307210031348,
     0.10810810810810811,
     0.09961685823754789 ],
  current_ok_fail_ratio: [ <b>0.16071428571428573</b> ],
  old_fail_sd: 4.123105625617661,
  current_fail_sd: 8.12403840463596 }
ujf.cas.cz
{ current_stats: { fail: [ 1, 0, 1, 2 ], ok: [ 9, 6, 7, 5 ] },
  current_avg_stats: { ok: 6.75, fail: 1 },
  current_day_stats: { fail: [ 1 ], ok: [ 9 ] },
  old_stats: { fail: [ 0, 1, 2, 0 ], ok: [ 6, 7, 5, 6 ] },
  old_avg_stats: { ok: 6, fail: 0.75 },
  avg_ratio_current_to_old: { ok: 1.125, fail: <b>1.3333333333333333</b> },
  old_ok_fail_ratio: [ 0, 0.14285714285714285, 0.4, 0 ],
  current_ok_fail_ratio: [ <b>0.1111111111111111</b> ],
  old_fail_sd: 0.82915619758885,
  current_fail_sd: 0.7071067811865476 }
cs.cas.cz
{ current_stats: { fail: [ 4, 1, 2, 2 ], ok: [ 25, 15, 20, 21 ] },
  current_avg_stats: { ok: 20.25, fail: 2.25 },
  current_day_stats: { fail: [ 4 ], ok: [ 25 ] },
  old_stats: { fail: [ 1, 2, 2, 2 ], ok: [ 15, 20, 21, 22 ] },
  old_avg_stats: { ok: 19.5, fail: 1.75 },
  avg_ratio_current_to_old: { ok: 1.0384615384615385, fail: <b>1.2857142857142858</b> },
  old_ok_fail_ratio: 
   [ 0.06666666666666667,
     0.1,
     0.09523809523809523,
     0.09090909090909091 ],
  current_ok_fail_ratio: [ <b>0.16</b> ],
  old_fail_sd: 0.4330127018922193,
  current_fail_sd: 1.0897247358851685 }
jamu.cz
{ current_stats: { fail: [ 71, 26, 31, 40 ], ok: [ 42, 102, 93, 117 ] },
  current_avg_stats: { ok: 88.5, fail: 42 },
  current_day_stats: { fail: [ 71 ], ok: [ 42 ] },
  old_stats: { fail: [ 26, 31, 40, 31 ], ok: [ 102, 93, 117, 89 ] },
  old_avg_stats: { ok: 100.25, fail: 32 },
  avg_ratio_current_to_old: { ok: 0.8827930174563591, fail: <b>1.3125</b> },
  old_ok_fail_ratio: 
   [ 0.2549019607843137,
     0.3333333333333333,
     0.3418803418803419,
     0.34831460674157305 ],
  current_ok_fail_ratio: [ <b>1.6904761904761905</b> ],
  old_fail_sd: 5.049752469181039,
  current_fail_sd: 17.478558292948534 }
lf1.cuni.cz
{ current_stats: { fail: [ 3, 3, 4, 1 ], ok: [ 67, 64, 62, 71 ] },
  current_avg_stats: { ok: 66, fail: 2.75 },
  current_day_stats: { fail: [ 3 ], ok: [ 67 ] },
  old_stats: { fail: [ 3, 4, 1, 1 ], ok: [ 64, 62, 71, 59 ] },
  old_avg_stats: { ok: 64, fail: 2.25 },
  avg_ratio_current_to_old: { ok: 1.03125, fail: <b>1.2222222222222223</b> },
  old_ok_fail_ratio: 
   [ 0.046875,
     0.06451612903225806,
     0.014084507042253521,
     0.01694915254237288 ],
  current_ok_fail_ratio: [ <b>0.04477611940298507</b> ],
  old_fail_sd: 1.299038105676658,
  current_fail_sd: 1.0897247358851685 }
jinonice.cuni.cz
{ current_stats: { fail: [ 6, 2, 1, 4 ], ok: [ 27, 22, 17, 17 ] },
  current_avg_stats: { ok: 20.75, fail: 3.25 },
  current_day_stats: { fail: [ 6 ], ok: [ 27 ] },
  old_stats: { fail: [ 2, 1, 4, 2 ], ok: [ 22, 17, 17, 21 ] },
  old_avg_stats: { ok: 19.25, fail: 2.25 },
  avg_ratio_current_to_old: { ok: 1.077922077922078, fail: <b>1.4444444444444444</b> },
  old_ok_fail_ratio: 
   [ 0.09090909090909091,
     0.058823529411764705,
     0.23529411764705882,
     0.09523809523809523 ],
  current_ok_fail_ratio: [ <b>0.2222222222222222</b> ],
  old_fail_sd: 1.0897247358851685,
  current_fail_sd: 1.920286436967152 }
vsb.cz
{ current_stats: { fail: [ 170, 115, 90, 92 ], ok: [ 449, 653, 696, 644 ] },
  current_avg_stats: { ok: 610.5, fail: 116.75 },
  current_day_stats: { fail: [ 170 ], ok: [ 449 ] },
  old_stats: { fail: [ 115, 90, 92, 88 ], ok: [ 653, 696, 644, 641 ] },
  old_avg_stats: { ok: 658.5, fail: 96.25 },
  avg_ratio_current_to_old: { ok: 0.9271070615034168, fail: <b>1.212987012987013</b> },
  old_ok_fail_ratio: 
   [ 0.17611026033690658,
     0.12931034482758622,
     0.14285714285714285,
     0.1372854914196568 ],
  current_ok_fail_ratio: [ <b>0.37861915367483295</b> ],
  old_fail_sd: 10.917302780449024,
  current_fail_sd: 32.275183965393595 }
gymlit.cz
{ current_stats: { fail: [ 1, 0, 4, 0 ], ok: [ 8, 11, 54, 6 ] },
  current_avg_stats: { ok: 19.75, fail: 1.25 },
  current_day_stats: { fail: [ 1 ], ok: [ 8 ] },
  old_stats: { fail: [ 0, 4, 0, 0 ], ok: [ 11, 54, 6, 9 ] },
  old_avg_stats: { ok: 20, fail: 1 },
  avg_ratio_current_to_old: { ok: 0.9875, fail: <b>1.25</b> },
  old_ok_fail_ratio: [ 0, 0.07407407407407407, 0, 0 ],
  current_ok_fail_ratio: [ <b>0.125</b> ],
  old_fail_sd: 1.7320508075688772,
  current_fail_sd: 1.6393596310755 }
oalib.cz
{ current_stats: { fail: [ 4, 3, 0, 3 ], ok: [ 52, 45, 36, 43 ] },
  current_avg_stats: { ok: 44, fail: 2.5 },
  current_day_stats: { fail: [ 4 ], ok: [ 52 ] },
  old_stats: { fail: [ 3, 0, 3, 2 ], ok: [ 45, 36, 43, 47 ] },
  old_avg_stats: { ok: 42.75, fail: 2 },
  avg_ratio_current_to_old: { ok: 1.0292397660818713, fail: <b>1.25</b> },
  old_ok_fail_ratio: 
   [ 0.06666666666666667,
     0,
     0.06976744186046512,
     0.0425531914893617 ],
  current_ok_fail_ratio: [ <b>0.07692307692307693</b> ],
  old_fail_sd: 1.224744871391589,
  current_fail_sd: 1.5 }
</pre>

> kazde failnute zarizeni zapocitat pouze jednou - jak ok tak fail

## Dostupnost

- Má být při detekci problému konkrétní instituce notifikován její správce? (kolekce realm\_admins)

> zatim neresit

# Import dat

## Filtrování

- zakázat import záznamů s prázdnými jmény?
> nezakazovat

- nějakou další logiku, která bude analyzovat/zobrazovat prázdné mac adresy a jména? (prázdné mac adresy tvoří zhruba 5 %, prázdná username zhruba 20 %)
> do importovace pridat logiku, ktera vypise zaznam z kazdym prazdnym jmenem
> jen pro nova data
> pridat do reportu s invalidnimi daty

# Archivace

- Archivace jednou za týden.
- Archivována data stará 14 dní až týden.
- Žádná data nejsou mazána.

- Vyhovuje to takto?

> ok

# Grafy

- Heat mapa - možnosti:
  - http://amp.pharm.mssm.edu/clustergrammer/
  - http://bl.ocks.org/oyyd/859fafc8122977a3afd6
  - http://bl.ocks.org/ianyfchang/8119685
  - http://bl.ocks.org/tjdecke/5558084
  - http://tmroyal.github.io/Chart.HeatMap/
  - https://www.trulia.com/vis/tru247/

- ostatní - možnosti:
  - https://d3js.org/ - https://github.com/d3/d3/wiki/Gallery
  - http://bl.ocks.org/d3noob/b3ff6ae1c120eea654b5
  - https://bl.ocks.org/mbostock/3883245

- Ukázky
  - [1](https://etlog.cesnet.cz/#/graph_test_1)
  - [2](https://etlog.cesnet.cz/#/graph_test_2)
  - [3](https://etlog.cesnet.cz/#/graph_test_3)

> neni problem brat data ze souboru

> heat mapa by mela umet vyhledavat dle nazvu
> moznost nejakeho razeni podle vzajmene souvislosti (hodnoty)?

> sloupce pro ostatni grafy
> pokud bude generovani rychle, neni treba data predgenerovavat
> pro roaming -> nejvice poskytovany a nejvice vyuzivany
> prepinatelne pro ruzne hodnoty -> mesic, 3 mesice, rok, 5 let

> pro kterou instituci chce uzivatel grafy videt

> do jednoho grafu uspesne a neuspesne zaroven
> (pripadne uspesne primarne, neuspesne na klikatko)

> graf pro mac count

# Ostatní

- specifikovat licenci v repozitáři?

> pridat
> poslat vsechna ruzna prohlaseni dostupna v diplomce

- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
> systemd
> zkontrolovat, jak budou formatovany zpravy
> definovat facilitu v samotnem konfigru sluzby a dodat konfiguraci syslogu
> vysledne logy cpat nekam do homu

- ze 404 stranky neni zadny odkaz zpet klikatelny
- systemd -> logování stdout a stderr
  - pouzit syslog a na zaklade velikosti rotovat?
> rotovani pomoci logrotatu

  - informativni hlasky jdou na stdout
  - chyby jdou na stderr
  - updatovat konfiguraci syslogu
- Na webu rozhraní, kde bude možné se dotazovat kdo a kam roamuje? (data z heat mapy)
> nebude potreba
- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel - semik
- přidat robots.txt?
> pridat, sem nechodit
- Dokumentace zálohování - OK?
> pridat info o cronu
> pridat info o zalohovani db


- Pri prochazeni dat k detekci funkcnosti sluzby jsem narazil na zvlastni realm `ldap.cuni.cz`.

# TODO list
1. Autentizace
  - použít rozcestník
2. Webové rozhraní
3. sshguard + FW -> semik
4. zálohování
  - nastaveno; konfigurace /etc/duply/system - podstatny predevsim exclude file
  - co je /home/etlog/backup ?
5. zálohování DB
6. grafy - statistiky
  - (grafy negenerovat na kliknuti ale nejak v noci)
7. přstupová práva
8. co s radlog.cesnet.cz - tim starym virtualem
9. ...
