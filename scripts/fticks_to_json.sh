#!/bin/bash
#
# Author: Václav Mach
# 
# This script transforms given file in fticks format to json format.
# script arguments:
#   1) log file to process, file name must be in format "fticks-2015-11-30", which represents current date
# errors processing log file are written to stderr
#
# =================================================================
#
# example input:
# May  7 00:00:00 195.113.187.41 fticks[11723]: F-TICKS/eduroam/1.0#REALM=cuni.cz#VISCOUNTRY=CZ#VISINST=UNKNOWN#CSI=f8-1e-df-e5-0b-82#PN=koktam@cuni.cz#RESULT=OK
#
# example output:
# { timestamp : { "$date" : 1430956800000 }, realm : "cuni.cz", viscountry : "CZ", visinst : "UNKNOWN", csi : "f81edfe50b82", pn : "koktam@cuni.cz", result : "OK" }
#
# =================================================================
#
#
#
#

  if [[ $# -ne 1 ]]
  then
    echo "no log file given"
    exit 1
  fi

  if [[ ! -f "$1" ]]
  then
    echo "provided log file $1 does not exist"
    exit 1
  fi
     
  year=$(echo $1 | cut -d "-" -f 2)

  if [[ ! $year =~ [0-9]{4} ]]
  then
    echo "bad log file name. Cannot determine current year from its name."
    exit 1
  fi

  gawk -v year=$year '
    BEGIN {
      months["Jan"] = 1
      months["Feb"] = 2
      months["Mar"] = 3
      months["Apr"] = 4
      months["May"] = 5
      months["Jun"] = 6
      months["Jul"] = 7
      months["Aug"] = 8
      months["Sep"] = 9
      months["Oct"] = 10
      months["Nov"] = 11
      months["Dec"] = 12

      replacement["\\x00"] = "<0>"
      replacement["\\x01"] = "<1>"
      replacement["\\x02"] = "<2>"
      replacement["\\x03"] = "<3>"
      replacement["\\x04"] = "<4>"
      replacement["\\x05"] = "<5>"
      replacement["\\x06"] = "<6>"
      replacement["\\x07"] = "<7>"
      replacement["\\x08"] = "<8>"
      replacement["\\x09"] = "<9>"
      replacement["\\x0a"] = "<10>"
      replacement["\\x0b"] = "<11>"
      replacement["\\x0c"] = "<12>"
      replacement["\\x0d"] = "<13>"
      replacement["\\x0e"] = "<14>"
      replacement["\\x0f"] = "<15>"
      replacement["\\x10"] = "<16>"
      replacement["\\x11"] = "<17>"
      replacement["\\x12"] = "<18>"
      replacement["\\x13"] = "<19>"
      replacement["\\x14"] = "<20>"
      replacement["\\x15"] = "<21>"
      replacement["\\x16"] = "<22>"
      replacement["\\x17"] = "<23>"
      replacement["\\x18"] = "<24>"
      replacement["\\x19"] = "<25>"
      replacement["\\x1a"] = "<26>"
      replacement["\\x1b"] = "<27>"
      replacement["\\x1c"] = "<28>"
      replacement["\\x1d"] = "<29>"
      replacement["\\x1e"] = "<30>"
      replacement["\\x1f"] = "<31>"
    }
    { 
      # ============================================================================
      # ============================================================================
      
      # replace non printable characters
      # this is slow but works fine
      /[\000-\037]/
      for (i in replacement)
        gsub(i, replacement[i], $0);
      
      # ============================================================================

      # datum a cas
      month=$1
      day=$2
      time=$3   # ve formatu "hodiny:minuty:sekundy"
      
      # uvodni rozdeleni pomoci #
      split($0, fields, "#") 
      
      # dalsi rozdeleni podle =
      # na prvnim indexu je cas, adresa serveru a uvodni informace logu
      split(fields[2], realm, "=")
      split(fields[3], viscountry, "=")
      split(fields[4], visinst, "=")
      split(fields[5], csi, "=")
      split(fields[6], pn, "=")
      split(fields[7], result, "=")

      # rozdeleni casu na hodiny, minuty, sekundy
      split(time, hms, ":");
      
      # ============================================================================

      # uprava mac adresy
      gsub(":", "", csi[2])
      gsub("-", "", csi[2])
      gsub("\\.", "", csi[2])
      
      # ============================================================================
      # TODO - vylepsit err handling

      if(length(csi[2]) != 12 && length(csi[2]) != 0) {
        printf("%s:%d: skipped, invalid mac address\n", FILENAME, FNR) > "/dev/stderr"
        next
      }

      # zrejme doslo k nejakemu problemu s parsovanim celeho zaznamu
      if(realm[2] == "" || result[2] == "") {
        printf("%s:%d: skipped, general error in parsing current record\n", FILENAME, FNR) > "/dev/stderr"
        next
      }

      # ============================================================================
      

      print "{ timestamp : { \"$date\" : "mktime(year " " months[month] " " day " "hms[1] " " hms[2] " " hms[3])"000 }, realm : \""realm[2]"\", viscountry : \""viscountry[2]"\", visinst : \""visinst[2]"\", csi : \""tolower(csi[2])"\", pn : \""pn[2]"\", result : \""result[2]"\" } "
    }' $1
