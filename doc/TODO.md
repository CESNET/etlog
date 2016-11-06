# Reporty

- Sjednotit české a anglické popisky v emailech? (použít cz nebo en?)

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

- Ještě by bylo možné přidat ke každému záznamu informaci o počtech různých problémových záznamů:
```
cut -d "," -f2 ~/logs/transform/err-2016-11-04 | sort | uniq -c
    165  bad viscountry value
  26779  bad visinst value
  24742  invalid mac address
   2212  record is malformed
```

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
  - Pouze data pro daný realm?

# Zálohování DB

- Co zálohovat?
- Jak často?
- Kolik záloh uchovávat?

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

## Detekce

- využít `avg_ratio_current_to_old: { fail: }` ?
- využít `current\_ok\_fail\_ratio` ? Hodnota je relativní vůči hodnotám old\_ok\_fail\_ratio.
- dynamická hodnota pro určení meze existence problému?
- použít více kritérií zároveň?
- počet úspěšných přihlášení musí být > 0? (co když nastane problém v průběhu dne?)
- porovnat fail\_count aktuálního dne s historickými daty? (n-násobné zvětšení signalizuje problém)


**I při použití vhodné detekce bude pravděpodobně každý den reportováno několik oblastí jako problémových,
což pro správce zřejmě bude zbytečná zátež při false-positive**

Potenciálně problémová data:

<pre>
ftvs.cuni.cz
{ current_stats: { fail: [ 0, 8, 1, 0 ], ok: [ 0, 0, 0, 0 ] },
  current_avg_stats: { ok: 0, fail: 2.25 },
  current_day_stats: { ok: [ 0 ], fail: [ 8 ] },
  old_stats: { fail: [ 0, 1, 0, 0 ], ok: [ 0, 0, 0, 0 ] },
  old_avg_stats: { ok: 0, fail: 0.25 },
  avg_ratio_current_to_old: { ok: 0, fail: <b>9</b> },
  old_ok_fail_ratio: [ 0, 1, 0, 0 ],
  current_ok_fail_ratio: [ <b>8</b> ],
  old_fail_sd: 0.4330127018922193,
  current_fail_sd: 3.344772040064913 }

ssinfis.cz
{ current_stats: { fail: [ 3, 266, 2, 1 ], ok: [ 347, 395, 238, 62 ] },
  current_avg_stats: { ok: 260.5, fail: 68 },
  current_day_stats: { ok: [ 395 ], fail: [ 266 ] },
  old_stats: { fail: [ 3, 33, 2, 1 ], ok: [ 347, 285, 238, 62 ] },
  old_avg_stats: { ok: 233, fail: 9.75 },
  avg_ratio_current_to_old: { ok: 1.1180257510729614, fail: <b>6.9743589743589745</b> },
  old_ok_fail_ratio:
  [ 0.008645533141210375,
  0.11578947368421053,
  0.008403361344537815,
  0.016129032258064516 ],
  current_ok_fail_ratio: [ <b>0.6734177215189874</b> ],
  old_fail_sd: 13.442005058770064,
  current_fail_sd: 114.31754021146536 }

slu.cz
{ current_stats: { fail: [ 317, 27, 87, 116 ], ok: [ 964, 251, 454, 700 ] },
  current_avg_stats: { ok: 592.25, fail: 136.75 },
  current_day_stats: { ok: [ 964 ], fail: [ 317 ] },
  old_stats: { fail: [ 12, 87, 116, 27 ], ok: [ 581, 454, 700, 251 ] },
  old_avg_stats: { ok: 496.5, fail: 60.5 },
  avg_ratio_current_to_old: { ok: 1.1928499496475327, fail: <b>2.260330578512397</b> },
  old_ok_fail_ratio:
  [ 0.020654044750430294,
  0.19162995594713655,
  0.1657142857142857,
  0.10756972111553785 ],
  current_ok_fail_ratio: [ <b>0.3288381742738589</b> ],
  old_fail_sd: 42.59401366389413,
  current_fail_sd: 108.90448796996385 }

fpf.slu.cz
{ current_stats: { fail: [ 5, 12, 5, 2 ], ok: [ 63, 45, 107, 27 ] },
  current_avg_stats: { ok: 60.5, fail: 6 },
  current_day_stats: { ok: [ 45 ], fail: [ 12 ] },
  old_stats: { fail: [ 5, 1, 5, 2 ], ok: [ 63, 147, 107, 27 ] },
  old_avg_stats: { ok: 86, fail: 3.25 },
  avg_ratio_current_to_old: { ok: 0.7034883720930233, fail: <b>1.8461538461538463</b> },
  old_ok_fail_ratio:
  [ 0.07936507936507936,
  0.006802721088435374,
  0.04672897196261682,
  0.07407407407407407 ],
  current_ok_fail_ratio: [ <b>0.26666666666666666</b> ],
  old_fail_sd: 1.7853571071357126,
  current_fail_sd: 3.6742346141747673 }

gymzr.cz
{ current_stats: { fail: [ 1, 0, 1, 0 ], ok: [ 9, 18, 3, 0 ] },
  current_avg_stats: { ok: 7.5, fail: 0.5 },
  current_day_stats: { ok: [ 3 ], fail: [ 1 ] },
  old_stats: { fail: [ 0, 1, 0, 0 ], ok: [ 24, 9, 18, 0 ] },
  old_avg_stats: { ok: 12.75, fail: 0.25 },
  avg_ratio_current_to_old: { ok: 0.5882352941176471, fail: <b>2</b> },
  old_ok_fail_ratio: [ 0, 0.1111111111111111, 0, 0 ],
  current_ok_fail_ratio: [ <b>0.3333333333333333</b> ],
  old_fail_sd: 0.4330127018922193,
  current_fail_sd: 0.5 }

asuch.cas.cz
{ current_stats: { fail: [ 16, 0, 3, 2 ], ok: [ 395, 210, 674, 233 ] },
  current_avg_stats: { ok: 378, fail: 5.25 },
  current_day_stats: { ok: [ 395 ], fail: [ 16 ] },
  old_stats: { fail: [ 1, 3, 2, 0 ], ok: [ 379, 674, 233, 210 ] },
  old_avg_stats: { ok: 374, fail: 1.5 },
  avg_ratio_current_to_old: { ok: 1.0106951871657754, fail: <b>3.5</b> },
  old_ok_fail_ratio:
  [ 0.002638522427440633,
  0.004451038575667656,
  0.008583690987124463,
  0 ],
  current_ok_fail_ratio: [ <b>0.04050632911392405</b> ],
  old_fail_sd: 1.118033988749895,
  current_fail_sd: 6.299801584177076 }

pslib.cz
{ current_stats: { fail: [ 15, 141, 10, 0 ], ok: [ 33, 19, 46, 0 ] },
  current_avg_stats: { ok: 24.5, fail: 41.5 },
  current_day_stats: { ok: [ 19 ], fail: [ 141 ] },
  old_stats: { fail: [ 0, 15, 10, 0 ], ok: [ 3, 33, 46, 0 ] },
  old_avg_stats: { ok: 20.5, fail: 6.25 },
  avg_ratio_current_to_old: { ok: 1.1951219512195121, fail: <b>6.64</b> },
  old_ok_fail_ratio: [ 0, 0.45454545454545453, 0.21739130434782608, 0 ],
  current_ok_fail_ratio: [ <b>7.421052631578948</b> ],
  old_fail_sd: 6.49519052838329,
  current_fail_sd: 57.699653378508266 }

htf.cuni.cz
{ current_stats: { fail: [ 0, 1, 6, 5 ], ok: [ 36, 20, 25, 18 ] },
  current_avg_stats: { ok: 24.75, fail: 3 },
  current_day_stats: { ok: [ 25 ], fail: [ 6 ] },
  old_stats: { fail: [ 0, 1, 0, 5 ], ok: [ 36, 20, 24, 18 ] },
  old_avg_stats: { ok: 24.5, fail: 1.5 },
  avg_ratio_current_to_old: { ok: 1.010204081632653, fail: <b>2</b> },
  old_ok_fail_ratio: [ 0, 0.05, 0, 0.2777777777777778 ],
  current_ok_fail_ratio: [ <b>0.24</b> ],
  old_fail_sd: 2.0615528128088303,
  current_fail_sd: 2.5495097567963922 }

img.cas.cz
{ current_stats: { fail: [ 54, 2, 70, 1 ], ok: [ 286, 456, 207, 15 ] },
  current_avg_stats: { ok: 241, fail: 31.75 },
  current_day_stats: { ok: [ 207 ], fail: [ 70 ] },
  old_stats: { fail: [ 3, 2, 54, 1 ], ok: [ 295, 456, 286, 15 ] },
  old_avg_stats: { ok: 263, fail: 15 },
  avg_ratio_current_to_old: { ok: 0.9163498098859315, fail: <b>2.1166666666666667</b> },
  old_ok_fail_ratio:
  [ 0.010169491525423728,
  0.0043859649122807015,
  0.1888111888111888,
  0.06666666666666667 ],
  current_ok_fail_ratio: [ <b>0.33816425120772947</b> ],
  old_fail_sd: 22.52776065213762,
  current_fail_sd: 30.776411421736615 }

jergym.cz
{ current_stats: { fail: [ 19, 257, 26, 11 ], ok: [ 39, 70, 17, 28 ] },
  current_avg_stats: { ok: 38.5, fail: 78.25 },
  current_day_stats: { ok: [ 70 ], fail: [ 257 ] },
  old_stats: { fail: [ 0, 19, 26, 11 ], ok: [ 0, 39, 17, 28 ] },
  old_avg_stats: { ok: 21, fail: 14 },
  avg_ratio_current_to_old: { ok: 1.8333333333333333, fail: <b>5.589285714285714</b> },
  old_ok_fail_ratio:
  [ 0,
  0.48717948717948717,
  1.5294117647058822,
  0.39285714285714285 ],
  current_ok_fail_ratio: [ <b>3.6714285714285713</b> ],
  old_fail_sd: 9.669539802906858,
  current_fail_sd: 103.3377351213002 }

asu.cas.cz
{ current_stats: { fail: [ 2, 2, 84, 2 ], ok: [ 36, 65, 87, 91 ] },
  current_avg_stats: { ok: 69.75, fail: 22.5 },
  current_day_stats: { ok: [ 87 ], fail: [ 84 ] },
  old_stats: { fail: [ 7, 2, 2, 2 ], ok: [ 42, 36, 65, 91 ] },
  old_avg_stats: { ok: 58.5, fail: 3.25 },
  avg_ratio_current_to_old: { ok: 1.1923076923076923, fail: <b>6.923076923076923</b> },
  old_ok_fail_ratio:
  [ 0.16666666666666666,
  0.05555555555555555,
  0.03076923076923077,
  0.02197802197802198 ],
  current_ok_fail_ratio: [ <b>0.9655172413793104</b> ],
  old_fail_sd: 2.165063509461097,
  current_fail_sd: 35.50704155516198 }
</pre>


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
- nějakou logiku, která zapne aplikaci po pádu/restartu serveru.
- ze 404 stranky neni zadny odkaz zpet klikatelny
- systemd -> logování stdout a stderr
  - pouzit syslog a na zaklade velikosti rotovat?
  - informativni hlasky jdou na stdout
  - chyby jdou na stderr
  - updatovat konfiguraci syslogu
- Na webu rozhraní, kde bude možné se dotazovat kdo a kam roamuje? (data z heat mapy)
- syslog - klic musi byt citelny pro vsechny, aby syslog poslouchal/bezel

# TODO list
1. Autentizace
  - použít rozcestník
2. Webové rozhraní
3. sshguard
4. zálohování
5. zálohování DB
6. grafy - statistiky
  - (grafy negenerovat na kliknuti ale nejak v noci)
7. přstupová práva
8. ...
