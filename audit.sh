#!/bin/bash

# ===========================================================================
# check app dependencies for vulnerabilities
# ===========================================================================
# params:
# 1) root of web application
# 2) application name
# ===========================================================================

app_path="$1"
app="$2"

# ===========================================================================

cd $app_path
out=$(npm audit)

if [[ "$(echo $out | grep 'found 0 vulnerabilities')" == "" ]]
then
  echo "$out" | mail -a 'Content-Type: text/plain; charset=utf-8' -s "npm audit report for $app" root
fi
