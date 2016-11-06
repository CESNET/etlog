#!/bin/bash

# This script is intended to be run by cron once a week.
#
# This script sends mail about invalid records.
#
# ==========================================================================================

# ==========================================================================================
# count number of imported documents
# parameters:
# 1) date for which number of imported documents should be counted
# line in file may look like:
# 2016-10-27T00:05:01.904+0200    imported 484 documents
# ==========================================================================================
function count_imported()
{
  local file="$etlog_log_root/mongo/err-$1"         # file with log information about imported records
  local count="$(grep imported "$file" | awk '{ cnt += $3; } END { print cnt; }')"
  echo "$count"
}
# ==========================================================================================
# function
# set recipients for national radius from database
# ==========================================================================================
function set_recipients()
{
  out="$(mongo etlog -quiet -eval 'db.realm_admins.find({ realm : "cz" }, { admins : 1, _id : 0 })')"    # get data from db
  # $out may look like:
  # '{ "admins" : [ "jan.tomasek@cesnet.cz" ] }'
  to=$(echo "$out" | sed 's/.*\[ //; s/\].*$//; s/[",]//g')
}
# ==========================================================================================
# main function
# ==========================================================================================
function main()
{
  # recipient
  set_recipients

  # copy for testing purposes
  cc="vac.mach@sh.cvut.cz"

  # sender
  sender="etlog@etlog.cesnet.cz"

  # mail subject
  subj="týdenní report - invalidní záznamy"
  subj=$(echo "=?utf-8?B?$(echo $subj | base64)?=")   # utf-8 must be encoded

  # etlog log root
  etlog_log_root="/home/etlog/logs"

  # mail text
  text="50 invalidních záznamů za poslední týden: \n"
  text+="==========================================================================================\n\n"
  text+="$(head -50 "$etlog_log_root/invalid_records/invalid-$(date --date="yesterday" "+%Y-%m-%d")")\n\n\n"

  text+="kompletní záznamy za poslední týden jsou dostupné v následujících souborech:\n"

  for i in {7..1}
  do
    day="$(date --date="$i days ago" "+%Y-%m-%d")"                                # determine day
    all_cnt="$(count_imported "$day")"                                            # count number of all imported records
    file="$etlog_log_root/invalid_records/invalid-$day"                           # invalid records file
    invalid_cnt="$(wc -l < "$file")"                                              # count number of invalid records
    percent=$(printf "%2.1f" $(echo "($invalid_cnt / $all_cnt) * 100" | bc -l))   # count percent
    text+="$file - $invalid_cnt záznamů | $percent % z celkového počtu importovaných záznamů\n"
  done

  echo -e "$text" | base64 | mail -a "Content-Type: text/plain; charset=\"utf-8\"" -a "Content-Transfer-Encoding: base64" -s "$subj" -r "$sender" "$to" "$cc"
}
# ==========================================================================================

main
