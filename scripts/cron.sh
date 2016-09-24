#!/bin/bash
#
# Author: Václav Mach
# 
# This script runs fticks_to_json.sh and is intended to be run by cron at regular intervals.
# Script takes no arguments.

# ==========================================================================================

# current date in format YYYY-MM-DD
date=$(date "+%Y-%m-%d")

# application root
etlog_root="/home/etlog/etlog/"

# database to which logs will be imported to
database="etlog"

# collection to which logs will be imported to
collection="logs"

# etlog log root
etlog_log_root="/home/etlog/logs/"

# log file to process
logfile="/home/etlog/logs/fticks/fticks-$date"

# fticks to json conversion error log
errlog="$etlog_log_root/transform/err-$date"

# mongo error log
mongo_errlog="$etlog_log_root/mongo/err-$date"

# last_log location
last_log_loc="$etlog_log_root/last_log"

# last processed log file
# to ensure all data for every dat is processed
if [[ "$(cat $last_log_loc)" != "$logfile" ]]
then
  last_log="$(cat $last_log_loc)"               # first processing of the day must process last data part of the last day
  interval_processed=true                       # last interval is processed
else
  last_log=$logfile
fi

# convert to json and import to database
$etlog_root/scripts/fticks_to_json.sh $last_log 2>>$errlog | mongoimport -d $database -c $collection --quiet 2>>$mongo_errlog

if [[ $interval_processed ]]
then
  echo $logfile > $last_log_loc                 # save current day filename for next processing
fi

# no change otherwise

exit 0
