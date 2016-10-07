#!/bin/bash
#
# Author: Václav Mach
# 
# This script runs fticks_to_json.sh and is intended to be run by cron at regular intervals.
# Script takes no arguments.

# ==========================================================================================

# application root
etlog_root="/home/etlog/etlog/"

# database to which logs will be imported to
database="etlog"

# collection to which logs will be imported to
collection="logs"

# etlog log root
etlog_log_root="/home/etlog/logs/"

# last_date location
last_date_loc="$etlog_log_root/last_date"

# current date in format YYYY-MM-DD
date=$(date "+%Y-%m-%d")

# check if date is the same as should be for processing log files
if [[ "$(cat $last_date_loc)" != "$date" ]]
then
  # date differs => processing of last interval of previous day
  date=$(cat $last_date_loc)                     # set variable to correct date
  interval_processed=true                       # last interval is processed
fi

# log file to process
logfile="/home/etlog/logs/fticks/fticks-$date"

# fticks to json conversion error log
errlog="$etlog_log_root/transform/err-$date"

# mongo error log
mongo_errlog="$etlog_log_root/mongo/err-$date"


# convert to json and import to database
$etlog_root/scripts/fticks_to_json.sh $logfile 2>>$errlog | mongoimport -d $database -c $collection --quiet 2>>$mongo_errlog

if [[ $interval_processed ]]
then
  date "+%Y-%m-%d" > $last_date_loc                 # save current date for next processing
fi

# no change otherwise

exit 0
