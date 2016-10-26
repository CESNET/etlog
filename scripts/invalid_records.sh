#!/bin/bash
#
# This script is intended to be run by cron once a day.
#
# This script reads line numbers of invalid records from a log file generated by cron.sh and 
# outputs these records to another file for later analysis.
#

# ==========================================================================================
# yesterday's date
date=$(date -d "yesterday" "+%Y-%m-%d")

# etlog log root
etlog_log_root="/home/etlog/logs"

# fticks to bson conversion error log
errlog="$etlog_log_root/transform/err-$date"

# log file to process
logfile="$etlog_log_root/fticks/fticks-$date"

# output log file
output="$etlog_log_root/invalid_records/invalid-$date"

# temp number file
temp="/tmp/numbers"

# ==========================================================================================
numbers=$(cut -d ":" -f2 < $errlog) # get numbers

echo "$numbers" > $temp               # temporary file for awk

awk -v temp="$temp" '
  BEGIN {
    split(arr, numbers, " ")    # split arr by " " into numbers
    getline number < temp       # read first line number from temp number file
  }
  # ============================================================================
  { 
    if(NR == number) {          # line number matches invalid line number
      getline number < temp     # read next line number
      print $0                  # print invalid record
    }
    else {
      next                      # continue on no match
    }
  }' $logfile >> $output

# ==========================================================================================