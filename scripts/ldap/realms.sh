#!/bin/bash
#
# script for realms synchronization
# this script is intended to be run by cron in regular intervals
#
# ==========================================================================================
function main()
{
  realm_list=$(get_realm_list)
  update_db
}
# ==========================================================================================
# update database contents
# ==========================================================================================
function update_db()
{
  # update realms
  delete_realms
  while read line
  do
    mongo etlog -quiet -eval "db.realms.insert($line)"
  done <<< "$realm_list"
}
# ==========================================================================================
# delete all records from realms collections
# ==========================================================================================
function delete_realms()
{
  mongo etlog -quiet -eval "db.realms.remove({})"
}
# ==========================================================================================
# get all known czech realms
# ==========================================================================================
function get_realm_list()
{
  local realm_list
  realm_list=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz cn | grep "cn: " | cut -d " " -f2 | tr "\n" " ")

  for realm in $realm_list
  do
    echo "{ \"realm\" : \"$realm\" }"
  done
}
# ==========================================================================================
# etlog root
etlog_root="/home/etlog/etlog/"
main
