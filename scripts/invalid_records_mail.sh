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
  out="$(mongo etlog -quiet -eval 'db.realm_admins.find({ realm : "cz" }, { admin : 1, _id : 0 })')"    # get data from db
  # $out may look like:
  # '{ "admin" : "jan.tomasek@cesnet.cz" }'
  to=$(echo "$out" | cut -d ' ' -f 4 | sed 's/"//g')
}
# ==========================================================================================
# email template function
# function output is used as mail input
# variables used:
# $sample_size = number of records, which will be shown as sample for past week
# $sample      = sample of $sample_size invalid records from past week
# $files       = array of files containing invalid records from past week
# $count       = array containing count of invalid records for each day of past week
# $percent     = array containing ratio of invalid records to all records for each day expressed in percent
# $stats       = specific information about types of invalid records from past week
# $all_percent = ratio of all invalid records to all imported records of past week expressed in percent
# ==========================================================================================
function template()
{
  cat << EOF
$sample_size invalidních záznamů za poslední týden:
==========================================================================================

$sample

==========================================================================================

Kompletní záznamy za poslední týden jsou dostupné v následujících souborech:
${files[0]} - ${count[0]} záznamů | ${percent[0]} % z celkového počtu importovaných záznamů
${files[1]} - ${count[1]} záznamů | ${percent[1]} % z celkového počtu importovaných záznamů
${files[2]} - ${count[2]} záznamů | ${percent[2]} % z celkového počtu importovaných záznamů
${files[3]} - ${count[3]} záznamů | ${percent[3]} % z celkového počtu importovaných záznamů
${files[4]} - ${count[4]} záznamů | ${percent[4]} % z celkového počtu importovaných záznamů
${files[5]} - ${count[5]} záznamů | ${percent[5]} % z celkového počtu importovaných záznamů
${files[6]} - ${count[6]} záznamů | ${percent[6]} % z celkového počtu importovaných záznamů

==========================================================================================

Invalidní záznamy za poslední týden obsahovaly následující typy problémových záznamů:
$stats

Poslední týden představovaly invalidní záznamy $all_percent % z celkového počtu importovaných záznamů.
EOF
}
# ==========================================================================================
# set up mail related variables
# ==========================================================================================
function setup_mail()
{
  # recipient
  set_recipients

  # utf-8 mail subject must be encoded
  subj=$(echo "=?utf-8?B?$(echo $subj | base64)?=")
}
# ==========================================================================================
# get stats
# ==========================================================================================
function get_stats()
{
  stats=$(cut -d "," -f2 ${err_files[@]} | sort | uniq -c)  # get stats
  stats=$(echo "$stats" | awk '
  BEGIN {
    max_len = 0
    line = ""
  }
  {
    # initial substitution
    gsub("neplatná hodnota", "neplatné hodnoty", $0);
    gsub("neplatná mac adresa", "neplatné mac adresy", $0);
    gsub("prázdné uživatelské jméno", "prázdná uživatelská jména", $0);
    gsub("záznam je deformovaný", "deformované záznamy", $0);

    # reverse line order
    for(i = 2; i <= NF; i++) {
      if(length(line) == 0)
        line = $i
      else
        line = line" "$i
    }

    line = line": "

    # determine max line length
    if(length(line) > max_len)
      max_len = length(line)

    count[FNR]=$1   # assing count
    out[FNR] = line # assign to output
    line = ""       # clear variable for next processing
  }
  END {
    for(i in out) {
      line = out[i]

      # add indentation
      while(length(line) < max_len)
        line = line" "

      printf("%s%d\n",  line, count[i])     # print result
    }
  }
  ')
}
# ==========================================================================================
# set up template contents
# ==========================================================================================
function setup_template()
{
  # sample of $sample_size invalid lines
  sample="$(cat "$etlog_log_root/invalid_records/invalid-$(date --date="yesterday" "+%Y-%m-%d")" | sed "s/.*: //" | sort -u | head -$sample_size)"

  # arrays for mail template
  declare -ga files
  declare -a  err_files
  declare -ga count
  declare -ga percent

  # index for arrays
  idx=0

  for i in {7..1}
  do
    day="$(date --date="$i days ago" "+%Y-%m-%d")"                                        # determine day
    cnt="$(count_imported "$day")"                                                        # count number of all imported records
    all_cnt=$((all_cnt + cnt))                                                            # count number of all imported records for past week
    files[$idx]="$etlog_log_root/invalid_records/invalid-$day"                            # invalid records file
    err_files[$idx]="$etlog_log_root/transform/err-$day"                                  # transform error file for - stats
    count[$idx]="$(wc -l < "${files[$idx]}")"                                             # count number of invalid records
    all_invalid_cnt=$((all_invalid_cnt + ${count[$idx]}))                                 # count number of all invalid records for past week
    percent[$idx]=$(printf "%2.1f" $(echo "(${count[$idx]} / $cnt) * 100" | bc -l))       # count percent
    ((idx++))
  done

  get_stats
  all_percent=$(printf "%2.1f" $(echo "($all_invalid_cnt / $all_cnt) * 100" | bc -l))     # count percent for all records of past week
}
# ==========================================================================================
# send mail
# ==========================================================================================
function send_mail()
{
  template | base64 | mail -a "Content-Type: text/plain; charset=\"utf-8\"" -a "Content-Transfer-Encoding: base64" -s "$subj" -r "$sender" "$to" "$cc"
}
# ==========================================================================================
# read configuration
# ==========================================================================================
function read_config()
{
  # configuration file location
  local config_location="/home/etlog/etlog/config/invalid_records_mail"

  if [[ ! -e $config_location ]]
  then
    echo "config file '$config_location' does not exist!"
    exit 1;
  fi

  if [[ ! -r $config_location ]]
  then
    echo "config file '$config_location' is not readable!"
    exit 1;
  fi

  source $config_location
}
# ==========================================================================================
# main function
# ==========================================================================================
function main()
{
  read_config
  setup_mail
  setup_template
  send_mail
}
# ==========================================================================================
main
