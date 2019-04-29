#!/bin/bash
#
# script to update source data for computation of concurrent users data
# this script is intended to be run by cron in regular intervals
#
# ==========================================================================================
function main()
{
  get_data

  if [[ $? -eq 1 ]]
  then
    update_data
  fi
}
# ==========================================================================================
# get institution.json and compare it to localy saved
# return value:
# 0 - files do not differ
# 1 - files differ
# ==========================================================================================
function get_data()
{
  local out
  local tmp
  location='https://ermon.cesnet.cz/general/institution.json'
  
  if [[ ! -e $concurrent_users_dir/institution.json ]]    # institution.json does not exist
  then
    wget $location -O $concurrent_users_dir/institution.json
    return 1
  else
    tmp=$(mktemp)
    wget $location -O $tmp
    out=$(diff -q $concurrent_users_dir/institution.json $tmp)
    rm $tmp

    if [[ "$out" == "" ]]
    then
      return 0    # files do not differ
    else
      return 1    # files differ
    fi
  fi
}
# ==========================================================================================
# update inst.json
# ==========================================================================================
function update_data()
{
  cd $concurrent_users_dir
  wget $location -O $concurrent_users_dir/institution.json # get new data, possible overwrite old
  $concurrent_users_dir/inst.pl             # update source data
  # update database - 14 days ago, hours, minutes and seconds set to 0
  $concurrent_users_dir/update_database.js "$(date -d "14 days ago" "+%Y-%m-%d") 00:00:00" "$(date "+%Y-%m-%d") 00:00:00"
}
# ==========================================================================================
# "working directory"
concurrent_users_dir="/home/etlog/etlog/scripts/concurrent_users"
main &>/dev/null
# ==========================================================================================

