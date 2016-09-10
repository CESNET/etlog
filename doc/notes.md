# etlog - eduroam trafic log analysis

## Basic info

   TODO
   basic information what the app does, what is it for ... 




This web application consists of Node.js, Express web application framework and MongoDB.
It uses many auxiliary javascript modules.
All the necesarry modules including their specific version can be found in file **package.json**.


## Server setup

The application is setup on Debian jessie. It is running as user etlog and it's root is in /home/etlog/etlog/.
It is listening for incoming connections on port 8080 for http connections and 
on port 8443 for https connections. Http Connection are automatically redirected to https.
Successful redicretion requires HTTP 1.1 host header.

### Network setup

Automatic port redirection to ports 8080 and 8443 is provided through iptables:
Persistence of rules is ensured by iptables-persistent debian package:
```
apt-get install iptables-persistent
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80  -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8443
iptables-save > /etc/iptables/rules.v4
ip6tables -t nat -A PREROUTING -i eth0 -p tcp -d 2001:718:1:1f:50:56ff:feee:150/64 --dport 80  -j REDIRECT --to-port 8080
ip6tables -t nat -A PREROUTING -i eth0 -p tcp -d 2001:718:1:1f:50:56ff:feee:150/64 --dport 443 -j REDIRECT --to-port 8443
ip6tables-save > /etc/iptables/rules.v6
```

### Syslog setup

Radius data are acquired through syslog. Installation and configuration:

```
apt-get install syslog-ng
cat > /etc/syslog-ng/conf.d/etlog-fticks.conf
source net {
  tcp(
    port(1999)
    tls( ca_dir("/etc/ssl/certs")
    key-file("/home/etlog/etlog/cert/etlog.cesnet.cz.key.pem")
    cert-file("/home/etlog/etlog/cert/etlog.cesnet.cz.crt.pem"))
  );
};

destination fticks { file("/home/etlog/logs/fticks/fticks-$YEAR-$MONTH-$DAY" owner("etlog") group("etlog") perm(0600)); };

log { source(net); destination(fticks); };
^D
service syslog-ng restart

su - etlog
mkdir -p logs/fticks
```

### Packages

These packages are necessary for etlog to run:

openssl
git
tmux
htop
iptables-persistent
curl
tmux
make
syslog-ng
gawk
logtail

Other special packages along with installation are listed below.
  
  
### MongoDB

#### installation

At the time of writing this guide, no official documentation for installation on Debian jessie
is available.

```
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.2 main" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
apt-get install mongodb-org
systemctl enable mongod
service mongod start
```

#### Configuration

Disable THP by following guide from official [docs](https://docs.mongodb.com/manual/tutorial/transparent-huge-pages/).
No further configuration should be needed.

#### Usage

Database can be accessed by command `mongo`. MongoDB is document oriented database. 
Data are divided into databases, same as in the sql dabases. Each database consists of collections,
which is equivalent of sql tables. Collections consist of documents, which use the BSON notation, which is basen on JSON.

Basic commands:
`show databases` lists all databases which are available.
`use my_database` swich current database to my\_database
`show collections` lists collection for current database.
`db.my_collection.find({})` display all documents in my\_collection
`db.my_collection.find({}).limit(5)` display 5 document from my\_collection
`db.my_collection.find({})limit(5).pretty()` display 5 nicely formatted documents


### Node.js

Node.js is server-side JavaScript.
Because the version of Node.js available in Debian jessie is very old (0.10.29~dfsg-2),
installation of newer version is needed. 
At the time of writing this guide current version of Node.js is 6.5.

### installation

```
apt-get install curl
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get install nodejs
```


## Application internals

### Database

Application uses database etlog.
Database is separeted into several collections.

#### Collections

In the tables below the column note is just an explanatory, it is not really present in the database.

##### logs

Collection represents raw radius log records transformed to json format. 
For details on data transformation see scripts/fticks\_to\_json.sh

| field name | data type |               note               |
|------------|-----------|----------------------------------|
| timestamp  |   Date    |      timestamp of authentication |
| realm      |   String  |      domain part of username     |
| viscountry |   String  |      visited country             |
| visinst    |   String  |      visited institution         |
| csi        |   String  |      mac address                 |
| pn         |   String  |      username                    |
| result     |   String  |      result of authentication    |

##### users\_mac

Collection defines binding between user and all mac addresses, which he used for successfull authentication to eduroam.


| field name | data type |               note                  |
|------------|-----------|-------------------------------------|
| username   |   String  |      username                       |
| addrs      |   Array   |      array of user's mac addresses  |


##### privileged\_ips

Collection containing privileged ip addresses, which will bypass
saml authentication. Address authentication is done using module passport-ip.
Addresses must be in special format used by [range\_check](https://www.npmjs.com/package/range_check).

ipv4 addresses format:

```
'::ffff:192.168.1.1/32'
'::ffff:10.0.0.0/8'
```

ipv6 addresses format:

```
'2001:718:2:1::1/128'
'2001:718:2:1::/64'
```

| field name | data type |               note               |
|------------|-----------|----------------------------------|
| ip         |   String  |  string representing ip address  |


###### data insertion/update

After data update, the application must be restarted.
Privileged ip addresses are loaded only on application startup.
Data can be inserted by accesing mongo shell and using commands:

```
use etlog
db.privileged_ips.insert({ip : '::ffff:192.168.1.1/32'})
```


##### invalid\_records

| field name | data type |               note                  |
|------------|-----------|-------------------------------------|
| date       |   String  |         date specification          |
| records    |   Array   |         array of invalid records    |




##### ... 

TODO

TODO

### Application structure

  /home/etlog/etlog         - application root
  |-- app.js                - main application file, constains appliation configuration
  |-- auth.js               - authentication configuration
  |-- bin                   
      `-- www               - script to start the application
  |-- cert                  - certificate related files
  |-- cron                  - cron tasks
      `-- users_to_mac.js   - cron task for mapping users and mac addresses
  |-- db.js                 - database and schema configuration
  |-- cron.js               - cron tasks definiton
  |-- doc                   - documentation
  |-- node\_modules         - application dependency files
  |-- package.json          - definition of application dependencies and properties
  |-- public                - directory for refering public files
  |-- routes                - application routes
  |-- routes.js             - mapping of routes to application
  |-- scripts               - various scripts
      `-- read_err.sh       - TODO
      `-- fticks_to_json.sh - TODO
      `-- cron.sh           - cron script to import live data delivered by syslog
  |-- views                 - templates of displayed pages



### Log files 

TODO

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



