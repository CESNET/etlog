#!/bin/bash
#
# Author: Václav Mach
# 
# This script reads error log file produced by fticks_to_json.sh and prints the problematic records from the original fticks log file.
# Script takes error log file produced by fticks_to_json.sh as argument.


  if [[ $# -ne 1 ]]
  then
    echo "no error log file given"
    exit 1
  fi

  if [[ ! -f "$1" ]]
  then
    echo "provided log file $1 does not exist"
    exit 1
  fi

  if [[ ! $1 =~ ^.*fticks_err-[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]
  then
    echo "bad error log file name"
    exit 1
  fi


  while read line
  do
    num=$(echo $line | cut -d":" -f2)
    date=$(echo $line | cut -d "-" -f2- | cut -d ":" -f1)
    sed -n $num,${num}p /var/log/fticks-$date
  done < $1



