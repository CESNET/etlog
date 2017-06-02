#!/bin/bash
#
# script for realm admins synchronization
#
# ==========================================================================================
function main()
{
  # all information regarding realm admins retrivied from ldap
  all_info=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz cn manager)
  get_realms
  realms_to_admins
  print_json
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
  local in_realm=false
  local realm

  while read line
  do
    if [[ $line =~ ^$ ]]  # empty line
    then
      in_realm=false
    fi

    if [[ $line =~ ^"cn: ".*$ ]]  # realm
    then
      in_realm=true
      realm=$(echo $line | sed 's/cn: //')
    fi

    if [[ $line =~ ^"manager: ".*$ && in_realm ]]   # realm administrator
    then
      if [[ ${#realms[$realm]} -gt 0 ]] # not first administrator
      then
        realms[$realm]="${realms[$realm]} $(echo $line | sed 's/manager: //; s/uid=//; s/,.*$/@cesnet\.cz/')"
      else  # first administator
        realms[$realm]="$(echo $line | sed 's/manager: //; s/uid=//; s/,.*$/@cesnet\.cz/')"
      fi

      ## debug
      #echo "realm: $realm"
      #echo "manager: $(echo $line | sed 's/manager: //; s/uid=//; s/,.*$//')"
    fi
  done <<< "$all_info"
}
# ==========================================================================================
# global associative arrays
# key is realm
# values are the administators for corresponding realm
declare -gA realms
declare -gA admins
main
# ==========================================================================================
