#!/bin/bash
#
# Author: Václav Mach
# 
# This script runs fticks_to_json.sh and is intended to be run by cron at regular intervals.
# Script takes one optional argument:
#   specific date in format "%Y-%m-%d"
#   This adds possibility to process older data


if [[ -n "$1" && "$1" =~ [0-9]{4}-[0-9]{2}-[0-9]{2} ]]  # first argument exists and has correct format
then
  date=$1
else
  # current date in format YYYY-MM-DD
  date=$(date "+%Y-%m-%d")
fi

# application root
etlog_root="/home/etlog/etlog/"

# database to which logs will be imported to
database="etlog"

# collection to which logs will be imported to
collection="logs"

# log file to process
logfile="/home/etlog/logs/fticks/fticks-$date"

# etlog log root
etlog_log_root="/home/etlog/logs/"

# fticks to json conversion error log
errlog="$etlog_log_root/transform/err-$date.log"

# mongo error log
mongo_errlog="$etlog_log_root/mongo/err-$date.log"

# convert to json and import to database
$etlog_root/scripts/fticks_to_json.sh $logfile 2>>$errlog | mongoimport -d $database -c $collection --quiet 2>>$mongo_errlog

exit 0
