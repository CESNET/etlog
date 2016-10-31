#!/bin/bash
#
# 
# This script runs is intended to be run by cron once a week.
# Script takes no arguments.

# ==========================================================================================

# etlog log root
etlog_log_root="/home/etlog/logs"

# process data from 14 days ago to past week
for i in {14..8}
do
  date="$(date --date="$i days ago" "+%Y-%m-%d")"

  logfile="$etlog_log_root/fticks/fticks-$date"                     # log file to process
  errlog="$etlog_log_root/transform/err-$date"                      # fticks to bson conversion error log
  invalid_records="$etlog_log_root/invalid_records/invalid-$date"   # invalid records file
 
  # use gzip for archivation 
  gzip $logfile
  gzip $errlog
  gzip $invalid_records
done

