#!/bin/bash
# =======================================================================================================
# script parameters:
# 1) realm
# 2) warning
# 3) critical threshold
#
# =======================================================================================================
# =======================================================================================================
# main function
# =======================================================================================================
function main()
{
  get_data
  process_data
  check_threshold
}
# =======================================================================================================
# get current revision
# =======================================================================================================
function get_revision()
{
  revision=$(curl "https://$hostname:8443/api/concurrent_rev/" 2>/dev/null) # get revisions array
  revision=$(echo $revision | sed 's/^.*,"//; s/"\].*$//')
}
# =======================================================================================================
# get /api/concurrent_inst data
# =======================================================================================================
function get_data()
{
  local hostname
  local min
  local max

  hostname="etlog.cesnet.cz"
  min=$(date -d "30 days ago" "+%Y-%m-%d")
  max=$(date "+%Y-%m-%d")
  time_diff=300		# minimal time difference in seconds

  get_revision

  # get data for visinst_1
  data=$(curl "https://$hostname:8443/api/concurrent_inst/?revision=$revision&diff_needed_timediff>=$time_diff&timestamp>=$min&timestamp<=$max&visinst_1=$realm" 2>/dev/null)

  # get data for visinst_2
  data=$data$(curl "https://$hostname:8443/api/concurrent_inst/?revision=$revision&diff_needed_timediff>=$time_diff&timestamp>=$min&timestamp<=$max&visinst_2=$realm" 2>/dev/null)

  data=$(echo $data | sed -e 's/},{/\n/g; s/\[{//; s/}\]//g; s/\[{/\n/')   # convert to lines and remove brackets
}
# =======================================================================================================
# process data
# =======================================================================================================
function process_data()
{
  total_count=$(echo "$data" | cut -d '"' -f 3 )
  total_count=$(echo $total_count | sed 's/://g; s/,//g; s/ / + /g' | bc) # get total count
}
# =======================================================================================================
function check_threshold()
{
  if [[ $total_count -ge $critical ]]
  then
    echo "CRITICAL: $total_count users moving too fast for realm $realm | $total_count"
    exit 2
  elif [[ $total_count -ge $warning ]]
  then
    echo "WARNING: $total_count users moving too fast for realm $realm | $total_count"
    exit 1
  else
    echo "OK: $total_count users moving too fast for realm $realm | $total_count"
    exit 0
  fi
}
# =======================================================================================================
realm=$1
warning=$2
critical=$3
# =======================================================================================================
main
# =======================================================================================================