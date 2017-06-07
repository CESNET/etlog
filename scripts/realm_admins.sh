#!/bin/bash
#
# script for realm admins synchronization
# this script is intended to be run by cron in regular intervals
#
# ==========================================================================================
function main()
{
  check_state
  if [[ $? -eq 0 ]]
  then
   get_realms
   realms_to_admins
   realm_admin_logins=$(print_json)
   update_db
  fi
}
# ==========================================================================================
# update database contents
# ==========================================================================================
function update_db()
{
  check_db
  if [[ $? -eq 0 ]]     # check if database is empty
  then                  # insert new data
    while read line
    do
      mongo etlog -quiet -eval "db.realm_admin_logins.insert($line)"
    done <<< "$realm_admin_logins"
  else                  # update old data
    while read line
    do
      mongo etlog -quiet -eval "db.realm_admin_logins.update($(echo "$line" | sed 's/,.*}$/ }/'), $line)"
    done <<< "$realm_admin_logins"
  fi
}
# ==========================================================================================
# check database state, check highest available timestamp
# return value:
# 0 - database update required
# 1 - database update not required
# ==========================================================================================
function check_state()
{
  retval=0
  last_max=$(cat $etlog_log_root/ldap/last_timestamp)

  # first verify there is some content in the database
  check_db
  if [[ $? -eq 0 ]]
  then
    return $retval  # database empty, request database update
  fi

  if [[ "$last_max" == "" ]]    # empty
  then
    last_max=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz modifyTimeStamp |  grep modifyTimeStamp: | cut -d " " -f2 | sort | tail -1 | sed 's/Z//')
  else      # last timestamp not empty

    max=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz modifyTimeStamp |  grep modifyTimeStamp: | cut -d " " -f2 | sort | tail -1 | sed 's/Z//')
    if [[ $last_max -le $max ]]
    then
      retval=1  # not necessary to update
    else    # greater
      retval=0  # request update
    fi
  fi

  echo $last_max > $etlog_log_root/ldap/last_timestamp
  return $retval
}
# ==========================================================================================
# check if there are realm admins in the database
# return value:
# 0 - collection realm_admin_logins contains no data
# 1 - collection realm_admin_logins contains some data
# ==========================================================================================
function check_db()
{
  out="$(mongo etlog -quiet -eval 'db.realm_admin_logins.count({})')"    # get data from db

  if [[ $out -eq 0 ]]
  then
    return 0
  else
    return 1
  fi
}
 # ==========================================================================================
# convert structure one realm multiple admins to
# admin multiple realms
# ==========================================================================================
function realms_to_admins()
{
  for key in ${!realms[@]}
  do
    for admin in ${realms[$key]}
    do
      if [[ ${#admins[$admin]} -gt 0 ]] # not empty
      then
        admins[$admin]="${admins[$admin]} $key"
      else                              # empty
        admins[$admin]="$key"
      fi
    done
  done
}
# ==========================================================================================
# output stored information as json
# ==========================================================================================
function print_json()
{
  for admin in ${!admins[@]}
  do
    echo -n "{ admin: \"$admin\", administered_realms: ["
    
    for realm in ${admins[$admin]}
    do
      echo -n "\"$realm\", "
    done
    
    echo "] }"
  done
}
# ==========================================================================================
# read input information line by line
# if in realm, add all managers to current realm
# realms are divided by empty line 
# ==========================================================================================
function get_realms()
{
  # all information regarding realm admins retrivied from ldap
  all_info=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz cn manager)
  local in_object=false
  local realm_list

  while read line
  do

    if [[ $line =~ ^$ ]]  # empty line
    then
      in_object=false
      realm_list=""
    fi

    if [[ $line =~ ^"cn: ".*$ ]]  # realm
    then
      in_object=true

      if [[ ${#realm_list} -eq 0 ]]
      then
        realm_list=$(echo $line | sed 's/cn: //')   # first realm
      else
        realm_list="$realm_list $(echo $line | sed 's/cn: //')"  # add next realm
      fi
    fi

    if [[ $line =~ ^"manager: ".*$ && in_object ]]   # realm administrator
    then

      for realm in $realm_list            # iterate all realms from current object
      do

        if [[ ${#realms[$realm]} -gt 0 ]] # not first administrator
        then
          realms[$realm]="${realms[$realm]} $(echo $line | sed 's/manager: //; s/uid=//; s/,.*$/@cesnet\.cz/')"
        else  # first administator
          realms[$realm]="$(echo $line | sed 's/manager: //; s/uid=//; s/,.*$/@cesnet\.cz/')"
        fi

      done
    fi
  done <<< "$all_info"
}
# ==========================================================================================
# global associative arrays
# key is realm
# values are the administators for corresponding realm
declare -gA realms
# key is admin
# values are the realms for corresponding admin
declare -gA admins
# etlog log root
etlog_log_root="/home/etlog/logs"
main
# ==========================================================================================
