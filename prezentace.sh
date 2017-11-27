#!/bin/bash
# ==========================================================================

# $1: input fticks file
# $2: output csv/json file for d3 graphs

# ==========================================================================
function get_best()
{
  data=$(for i in "${!roaming_most_used_ok[@]}"
  do
    echo "$i,${roaming_most_used_ok[$i]},${roaming_most_used_fail[$i]}"
  done | sort -r -g -k 2,3 -t ',' | head)

  echo -e "inst_name,ok,fail\n${data}" > ${1}_most_used

  data=$(for i in "${!roaming_most_provided_ok[@]}"
  do
    echo "$i,${roaming_most_provided_ok[$i]},${roaming_most_provided_fail[$i]}"
  done | sort -r -g -k 2,3 -t ',' | head)
  
  echo -e "inst_name,ok,fail\n${data}" > ${1}_most_provided
}
# ==========================================================================
function graph_data()
{
  # get data
  realm=$(echo $1 | cut -d '#' -f2 | cut -d '=' -f 2)
  visinst=$(echo $1 | cut -d '#' -f4 | cut -d '=' -f 2 | sed 's/^1//g')
  result=$(echo $1 | cut -d '#' -f7 | cut -d '=' -f 2)

  # only .cz
  if [[ ! $realm =~ .*\.cz ]]
  then
    return
  fi

  # only .cz
  if [[ ! $visinst =~ .*\.cz ]]
  then
    return
  fi

  # increase count for realm or visinst
  if [[ $result == "OK" ]]
  then
    if [[ ${roaming_most_used_fail["$realm"]} == "" ]]  # create empty value for FAIL
    then
      roaming_most_used_fail["$realm"]=0
    fi

    if [[ ${roaming_most_provided_fail["$visinst"]} == "" ]]  # create empty value for FAIL
    then
      roaming_most_provided_fail["$visinst"]=0
    fi

    ((roaming_most_used_ok["$realm"]++))
    ((roaming_most_provided_ok["$visinst"]++))
  else
    if [[ ${roaming_most_used_ok["$realm"]} == "" ]] # create empty value for OK
    then
      roaming_most_used_ok["$realm"]=0
    fi

    if [[ ${roaming_most_provided_ok["$visinst"]} == "" ]] # create empty value for OK
    then
      roaming_most_provided_ok["$visinst"]=0
    fi

    ((roaming_most_used_fail["$realm"]++))
    ((roaming_most_provided_fail["$visinst"]++))
  fi

  get_best $2
}
# ==========================================================================
function nice_fticks()
{
  COLS=`tput cols`

  tail -f $1 | while read line
  do
    BG='\o033[0m\o033[34m'

    if echo $line |grep FAIL$ 2>&1 >/dev/null
    then
    BG='\o033[0m\o033[31m'
    fi

    echo $line | sed -e 's/195.113.187.41 fticks.[0-9]*.//' |\
    cut -b 1-$COLS |\
    sed -e 's/^/_BG_/' \
    -e 's/REALM=\([^#]*\)/REALM=\o033[1m\1_BG_/' \
    -e 's/VISCOUNTRY=\([^#]*\)/VISCOUNTRY=\o033[1m\1_BG_/' \
    -e 's/VISINST=\([^#]*\)/VISINST=\o033[1m\1_BG_/' \
    -e 's/CSI=\([^#]*\)/CSI=\o033[1m\1_BG_/' \
    -e 's/PN=\([^#]*\)/PN=\o033[1m\1_BG_/' \
    -e 's/RESULT=\(.*\)/RESULT=\o033[1m\1/' \
    -e "s/_BG_/$BG/g"

    # prepare graph data
    graph_data "$line" $2

    if [[ $(echo "$(date +%s) > $ref_date + 300" | bc) -eq 1 ]]     # 5 minutes
    then
      clear_data
    fi
  done
}
# ==========================================================================
clear_data()
{
  unset roaming_most_provided_fail
  unset roaming_most_provided_ok
  unset roaming_most_used_fail
  unset roaming_most_used_ok

  # GLOBAL !!!
  declare -gA roaming_most_used_ok
  declare -gA roaming_most_provided_ok
  declare -gA roaming_most_used_fail
  declare -gA roaming_most_provided_fail
  ref_date=$(date +%s)
}
# ==========================================================================
function main()
{
  ref_date=$(date +%s)
  nice_fticks $1 $2
}
# ==========================================================================
declare -A roaming_most_used_ok
declare -A roaming_most_provided_ok
declare -A roaming_most_used_fail
declare -A roaming_most_provided_fail
# ==========================================================================
main $@
# ==========================================================================
