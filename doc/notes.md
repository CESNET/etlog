## Radlog

   TODO
	

## Basic info

this web application consists of javascript framework express and mongodb.
It uses many auxiliary javascript modules.
All the necesarry modules including their specific version can be found in file **package.json**.

======================================================================================
uvodni info k mongodb:

  apt-get install mongodb
  pristup k databazovemu stroji pomoci prikazu "mongo" (tzv mongo shell)
  data jsou clenena do jednotlivych databazi - stejne jako v sql svete (show databases)
  data v jedne databazi jsou clenena do kolekci - obdoba sql tabulek


======================================================================================
transformace dat:

  string "timestamp" na datovy typ Date:
  importovana data transformujeme az v databazi
  pro spravny cas v datovem typu je treba nastavit systemovy cas na UTC! 
  (v opacnem pripade jsou transformovana data posunuta o offset odpovidajici casovemu pasmu)
  > use fticks
  > db.logy.find({}).forEach(function(el){ el.timestamp = new Date(el.timestamp + " 2014"); db.logy.save(el); });
  trvani pro jeden mesic dat zhruba 4 hodiny, 28 minut


======================================================================================
pro propojeni weboveho rohzrani a databaze pouzijeme javascript na serveru - nodejs

instalace nodejs:
  curl -sL https://deb.nodesource.com/setup_4.x | bash -
  apt-get install -y nodejs
  node -v (test spravne probehnute instalace)

dale je treba instalovat balickovaci system - npm:
  cd
  wget https://npmjs.org/install.sh
  chmod +x install.sh
  ./install.sh
  nmp -v (test spravne probehnute instalace)


======================================================================================
podle nalezenych informaci se aktualne tento typ aplikaci (web + mongodb)
nejcasteji realizuje pomoci nekolika modulu samotneho nodejs (vse psano v javascriptu)

konkretni architektura reseni je zhruba nasledujici:
(v obecnem pripade se muze jednat pouze o jine moduly, pripadne muzou byt doplneny ruzne koncepty - proxy, loadbalancing, ..)
  - webovy server je realizovan pomoci modulu express, ten zaroven resi routing mezi zdroji (url)
  - komunikace smerem od klienta (browseru) probiha pomoci REST api
  - interakci s databazi resi modul mongoose, umoznuje definovani "schematu" konkretni kolekce, tim nabizi logiku vyssi urovne pro konkretni operace


vice viz schema (/root/doc/schema)  TODO


======================================================================================
pro vytvoreni vlastni kostry webove aplikace je dale nutne:
  npm install -g express-generator
  npm install -g express

nasledne vytvoreni kostry aplikace provedeme pomoci:
  express testovaci_aplikace


======================================================================================
koren webove aplikace je ve /var/www , testovaci aplikace je v /var/www/radlog

instalaci vseach potrebnych modulu aplikaci provedene pomoci:
  cd /var/www/radlog && npm install

aplikaci spustime pomoci:
  - DEBUG=nodetest2:* ./bin/www
  - cd /var/www/radlog && npm start


======================================================================================
struktura aplikace:

  /var/www/radlog 
  |-- app.js            - hlavni soubor cele aplikace
  |-- bin               
      `-- www           - skript pro spusteni aplikace
  |-- db.js             - definice databazoveho spojeni
  |-- node_modules      - adresar pro moduly nodejs
  |-- npm-debug.log     - debug log aplikace
  |-- package.json      - zavislosti aplikace
  |-- public            - adresar pro odkazovani verejnych referenci na webu
  |-- routes            - adresar obsahujici definice smerovani pozadavku na konkretni entity
  |-- views             - adresar obsahujici sablony zobrazovanych stranek v sablonovacim systemu jade


======================================================================================

TODO:

plneni databaze realnymi daty:

  pro plneni databaze pouzijeme transformacni skript a mongoimport
  transformacni skript je umisten v /root/scripts/fticks_to_json_new.sh
  skript je dosdatecne komentovan a melo by byt zrejme, jak pracuje
  pomoci cronu budeme databazi plnit kazdych 5 minut


TODO:
  instalovat samotny passport !!!!
  instalovat doplnek passport-saml
  pridat do zavislosti
  dodat do aplikace autentizaci


