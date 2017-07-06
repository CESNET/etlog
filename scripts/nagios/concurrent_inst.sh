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
  data=$(curl "https://$hostname:8443/api/concurrent_inst/?revision=$revision&time_needed_timediff>=$time_diff&timestamp>=$min&timestamp<=$max&visinst_1=$realm" 2>/dev/null)

  # get data for visinst_2
  data=$data$(curl "https://$hostname:8443/api/concurrent_inst/?revision=$revision&time_needed_timediff>=$time_diff&timestamp>=$min&timestamp<=$max&visinst_2=$realm" 2>/dev/null)

  data=$(echo $data | sed -e 's/},{/\n/g; s/\[{//; s/}\]//g; s/\[{/\n/')   # convert to lines and remove brackets
}
# =======================================================================================================
# process data
# =======================================================================================================
function process_data()
{
  while read line
  do
    echo "line: $line"
  done <<< "$data"
}
# =======================================================================================================
realm=$1
warning=$2
threshold=$3
# =======================================================================================================
main
