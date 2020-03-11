#!/bin/bash
#
# script for realm admins synchronization
# this script is intended to be run by cron in regular intervals
#
# ==========================================================================================
function main()
{
  local last
  local curr

  if [[ -e $etlog_log_root/ldap/sync_disabled ]]    # synchronization disabled by app
  then
    exit 0
  fi

  last=$(date -d "5 minutes ago" "+%Y-%m-%d")  # %Y-%m-%d 5 minutes ago
  curr=$(date "+%Y-%m-%d")                     # %Y-%m-%d now

  if [[ $last != $curr ]]   # update once every day
  then
      force_update
  else
    check_state
    if [[ $? -eq 0 ]]
    then
      force_update
    fi
  fi
}
# ==========================================================================================
# force update
# ==========================================================================================
function force_update()
{
  get_realms
  realms_to_admins
  realm_admin_logins=$(print_json)
  realm_admins=$(realm_admins_json)
  update_db
  delete_expired
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
      mongo etlog -quiet -eval "db.realm_admin_logins.update($(echo "$line" | sed 's/\],.*}$/]}/'), $line, { upsert : true })"
    done <<< "$realm_admin_logins"
  fi

  # update realm_admins
  while read line
  do
    mongo etlog -quiet -eval "db.realm_admins.update($(echo "$line" | sed 's/, notify.*}$/ }/'), $line, { upsert : true })"
  done <<< "$realm_admins"
}
# ==========================================================================================
# delete expired admins
# ==========================================================================================
function delete_expired()
{
  local out

  # search for all realm admins
  # iterate all lines one by one
  # if line does not exist in $realm_admins, delete it
  out=$(mongo etlog -quiet -eval 'DBQuery.shellBatchSize = 5000;
  db.realm_admins.find({ "realm" : { $ne : "cz" } })')  # exception for realm "cz"

  # update realm_admins
  while read line
  do
    line=$(echo $line | sed 's/^.*, "admin" :/admin:/; s/, "notify_enabled".*$//; s/"realm" :/realm:/')   # transform for matching

    if [[ "$(echo "$realm_admins" | grep "$line")" == "" ]] # admin does not exist in $realm_admins
    then
      mongo etlog -quiet -eval "db.realm_admins.remove({$line})"    # delete
    fi
  done <<< "$out"
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
  last_res=$(cat $etlog_log_root/ldap/last_results)     # result count

  # first verify there is some content in the database
  check_db
  if [[ $? -eq 0 ]]
  then
    return $retval  # database empty, request database update
  fi

  if [[ "$last_max" == "" || "$last_res" == "" ]]    # empty
  then
    if [[ "$last_max" == "" ]]  # last max empty
    then
      last_max=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no modifyTimeStamp | grep modifyTimeStamp: | cut -d " " -f2 | sort | tail -1 | sed 's/Z//')

    else    # last res empty
      last_res=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no modifyTimeStamp | tail -1 | cut -d " " -f 3)
    fi

    echo $last_max > $etlog_log_root/ldap/last_timestamp
    echo $last_res > $etlog_log_root/ldap/last_results
    return 1
  else      # last timestamp and last res not empty

    max=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no modifyTimeStamp |  grep modifyTimeStamp: | cut -d " " -f2 | sort | tail -1 | sed 's/Z//')
    res=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no modifyTimeStamp | tail -1 | cut -d " " -f 3)
    if [[ $last_max -le $max ]]
    then
      retval=1  # not necessary to update
    elif [[  $res -ne $last_res ]]      # result count not equal last result count
    then
      retval=1  # not necessary to update
    else    # greater
      retval=0  # request update
    fi
  fi

  echo $max > $etlog_log_root/ldap/last_timestamp
  echo $res > $etlog_log_root/ldap/last_results
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
  local tmp

  for key in ${!realms[@]}
  do
    for admin in ${realms[$key]}
    do
      # check if current processed admin key exists in array uids
      # =============================================================
      if [[ -n ${uids[$admin]} ]]    # uid
      then
        tmp=$admin
        admin=""

        for id in ${uids[$tmp]}  # iterate all identities available for uid
        do
          if [[ $id =~ ^.*"@einfra.cesnet.cz"$ ]]
          then
            admin="$id"
          fi
        done

        # take $admin's first mail
        mail=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=People,o=eduroam,o=apps,dc=cesnet,dc=cz -s base -o ldif-wrap=no eduPersonPrincipalNames=$tmp mail | grep "mail: " | head -1 | cut -d " " -f 2)
      else
        # take $admin's first mail
        mail=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=People,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no eduPersonPrincipalNames=${admin} mail | grep "mail: " | head -1 | cut -d " " -f 2)
      fi

      # set mail to global array
      # =============================================================

      if [[ $mail == "" ]]
      then
        continue  # all valid admins must have mail set
      else
        admin_mails["$admin"]=$mail
      fi

      # map realms to admins
      # =============================================================
      if [[ ${#admins[$admin]} -gt 0 ]] # not empty
      then
        admins["$admin"]="${admins["$admin"]} $key"
      else                              # empty
        admins["$admin"]="$key"
      fi
    done
  done

  #merge_common
}
# ==========================================================================================
# merge by common admin_login_id values
# new way using eduPersonUniqueId and old way may have
# common intersection when both used on one realm
# ==========================================================================================
function merge_common()
{
  local realms
  local present

  for admin in "${!admins[@]}"
  do
    for id in $admin
    do
      # $id matches @einfra.cesnet.cz && $admin contains more identities && $id exists in admins array
      if [[ $id =~ ^.*@einfra.cesnet.cz && $(echo $admin | wc -w) -gt 1 && -n ${admins[$id]} ]]
      then
        realms=${admins[$admin]}    # original realms

        # iterate all realms on duplicit identity
        for realm in ${admins[$id]}
        do
          present=false

          # iterate all original realms
          for orig in $realms
          do
            if [[ $orig == $realm ]]
            then
              present=true
              break
            fi
          done

          if [[ $present == true ]]
          then
            continue
          else
            realms="$realms $realm" # add realm
          fi

        done

        admins[$admin]="$realms"    # update realm list

        # unset original @einfra.cesnet.cz key
        unset admins[$id]
      fi

    done
  done
}
# ==========================================================================================
# output stored information as json
# ==========================================================================================
function realm_admins_json()
{
  for admin in "${!admins[@]}"
  do
    for realm in ${admins[$admin]}
    do
      # set original value from database if exists
      notify="$(mongo etlog -quiet -eval "db.realm_admins.find({ admin: \"${admin_mails[$admin]}\", realm: \"$realm\" }, { _id: 0, notify_enabled : 1 })" | cut -d " " -f 4)"

      if [[ $notify == "" ]]
      then
        notify=$notify_default    # set default value when empty
      fi

      echo "{ admin: \"${admin_mails[$admin]}\", realm: \"$realm\", notify_enabled: $notify }"
    done
  done
}
# ==========================================================================================
# output stored information as json
# ==========================================================================================
function print_json()
{
  local tmp

  for admin in "${!admins[@]}"
  do
    echo -n "{ admin_login_ids: [ "
    for id in $admin
    do
      echo -n "\"$id\", "
    done

    echo -n "], administered_realms: ["
    
    for realm in ${admins[$admin]}
    do
      echo -n "\"$realm\", "
    done
    
    echo "], \"admin_notify_address\": \"${admin_mails["$admin"]}\" }"
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
  all_info=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b ou=Realms,o=eduroam,o=apps,dc=cesnet,dc=cz -o ldif-wrap=no cn manager)
  local in_object=false
  local realm_list
  local uid
  local sb
  local identities
  local manager

  while read line
  do

    if [[ $line =~ ^$ ]]  # empty line
    then
      in_object=false
      realm_list=""

    elif [[ $line =~ ^"cn: ".*$ ]]  # realm
    then
      in_object=true

      if [[ ${#realm_list} -eq 0 ]]
      then
        realm_list=$(echo $line | sed 's/cn: //')   # first realm
      else
        realm_list="$realm_list $(echo $line | sed 's/cn: //')"  # add next realm
      fi

    elif [[ $line =~ ^"manager: ".*$ && in_object ]]   # realm administrator
    then
        sb=$(echo $line | sed 's/manager: //') # get search base
        uid=$(echo $line | sed 's/manager: //; s/uid=//; s/,.*$//') # get uid

        # use whole line as search base
        identities=""              # clear for next admin
        identities=$(ldapsearch -H ldaps://ldap.cesnet.cz -x -y $etlog_root/config/ldap_secret -D 'uid=etlog,ou=special users,dc=cesnet,dc=cz' -b $sb -s base -o ldif-wrap=no eduPersonPrincipalNames | grep "eduPersonPrincipalNames: " | grep "einfra.cesnet.cz" | cut -d " " -f 2 | tr "\n" " ")
        uids[$uid]=$identities     # save mapping of uid to user identities
        manager=$uid               # save uid as reference in array instead of values

      for realm in $realm_list            # iterate all realms from current object
      do
        if [[ ${#realms[$realm]} -gt 0 ]] # not first administrator
        then
          realms[$realm]="${realms[$realm]} $identities"
        else  # first administator
          realms[$realm]="$identities"
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
# key is uid
# values are the available eduPersonPrincipalName values
declare -gA uids
# key is uid or username
# value is notification mail
declare -gA admin_mails
# etlog log root
etlog_log_root="/home/etlog/logs"
# etlog root
etlog_root="/home/etlog/etlog/"
# notify default state
notify_default=true
main &>/dev/null
# ==========================================================================================
