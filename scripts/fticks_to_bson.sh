#!/bin/bash
#
# Author: Václav Mach
# 
# This script transforms given file in fticks format to json format.
# script arguments:
#   1) log file to process, file name must be in format "fticks-2015-11-30", which represents current date
#   log file is read by logtail, which only reads the part, which hasnt been read by previous previous runs of logtail
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
    (>&2 echo "no log file given")
    exit 1
  fi

  if [[ ! -f "$1" ]]
  then
    (>&2 echo "provided log file $1 does not exist")
    exit 1
  fi

  year=$(echo $1 | cut -d "-" -f 2)
  last_line_log="/home/etlog/logs/transform/last_$(echo $1 | cut -d "-" -f 2-)" # this is where last processed line number is written

  touch $last_line_log  # create it if does not exist

  if [[ ! $year =~ [0-9]{4} ]]
  then
    (>&2 echo "bad log file name. Cannot determine current year from its name.")
    exit 1
  fi

  /usr/sbin/logtail -o $1.offset -f $1 | gawk -v year=$year -v filename=$1 -v last_filename=$last_line_log '
    BEGIN {
      # monitoring mac address which does not have to be stored in database
      # only 4 bytes are defined, the rest is generated
      monit_addr=706f6c69
      monit_regex="^"monit_addr".*$"

      # ============================================================================
      # define month numbers

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

      # ============================================================================
      # define replacement for special characters

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
      #replacement["\\x0a"] = "<10>"    # this doesnt make sense
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
    
      # ============================================================================
      # when processing same file repeatedly from where we left last time, 
      # FNR contains relative line numbers!
      # we need to use absolute

      # read last read line from last_filename
      getline last_line < last_filename

      # if last_line is empty, no reading has been done from the input file
      if(length(last_line) == 0) {
        last_line = 0;  # set last_line to 0
      }

      # number of fields in records - REALM, VISCOUNTRY, VISINST, CSI, PN, RESULT + (inital log part)
      num_fields = 7
    }
    { 
      # ============================================================================
      # ============================================================================
      # replace special characters
      gsub(/\\/, "\\\\", $0);   # backslash
      gsub(/"/, "\\\"", $0);   # quote

      
      # replace non printable characters
      # this is slow but works fine
      /[\000-\037]/
      for (i in replacement)
        gsub(i, replacement[i], $0);
      
      # ============================================================================

      # date and time
      month=$1
      day=$2
      time=$3   # in format "hours:minutes:seconds"
      
      # initial split on "#"
      split($0, fields, "#") 
      
      # ============================================================================
      # initial error detection
      # each record must contain exactly 7 fields - REALM, VISCOUNTRY, VISINST, CSI, PN, RESULT + (inital log part)
      # may contain more or less
      if(length(fields) != num_fields) {
        printf("%s:%d: záznam přeskočen, záznam je deformovaný\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # ============================================================================
      # at this point, correct number of fields is present
      # next split by =
      # first index constains time, server address and opening log information
      split(fields[2], realm, "=")
      split(fields[3], viscountry, "=")
      split(fields[4], visinst, "=")
      split(fields[5], csi, "=")
      split(fields[6], pn, "=")
      split(fields[7], result, "=")

      # split time to hours, minutes, seconds
      split(time, hms, ":");
      
      # ============================================================================

      # mac address adjustment
      gsub(":", "", csi[2])
      gsub("-", "", csi[2])
      gsub("\\.", "", csi[2])
      
      # ============================================================================
      # monitoring address detection

      if(tolower(csi[2]) ~ monit_regex) {
        next
      }

      # ============================================================================
      # ============================================================================
      # error detection

      # check realm value
      # attribute is separated by "=" from its value (2 fields), value must not be empty
      if(length(realm) != 2 || length(realm[2]) == 0) {
        printf("%s:%d: záznam přeskočen, neplatná hodnota atributu realm\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # check viscountry value
      # attribute is separated by "=" from its value (2 fields), value must not be empty
      if(length(viscountry) != 2 || length(viscountry[2]) == 0) {
        printf("%s:%d: záznam přeskočen, neplatná hodnota atributu viscountry\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # check visinst value
      # attribute is separated by "=" from its value (2 fields), value must not be empty
      # visinst must begin with "1"
      if(length(visinst) != 2 || length(visinst[2]) == 0 || visinst[2] ~ /^[^1]/) {
        printf("%s:%d: záznam přeskočen, neplatná hodnota atributu visinst\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # check result value
      # attribute is separated by "=" from its value (2 fields), value must not be empty
      if(length(result) != 2 || length(result[2]) == 0) {
        printf("%s:%d: záznam přeskočen, neplatná hodnota atributu result\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # check username
      # empty value is permitted
      # bad values are reported for statistics
      if(length(pn[2]) == 0) {
        printf("%s:%d: záznam přeskočen, prázdné uživatelské jméno\n", filename, FNR + last_line) > "/dev/stderr"
      }

      # mac address has bad value
      if(length(csi[2]) != 12) {
        printf("%s:%d: záznam přeskočen, neplatná mac adresa\n", filename, FNR + last_line) > "/dev/stderr"
        next
      }

      # TODO - replace utf-8 characters ?

      # ============================================================================
      # output data in BSON

      print "{ timestamp : { \"$date\" : "mktime(year " " months[month] " " day " "hms[1] " " hms[2] " " hms[3])"000 }, realm : \""realm[2]"\", viscountry : \""viscountry[2]"\", visinst : \""substr(visinst[2], 2)"\", csi : \""tolower(csi[2])"\", pn : \""pn[2]"\", result : \""result[2]"\" } "
    }

    END {
      # after processing all records save last processed line number
      printf("%d\n", FNR + last_line) > last_filename
      exit 0;
    }
    '
