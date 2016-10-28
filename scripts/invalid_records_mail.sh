#!/bin/bash

# This script is intended to be run by cron once a week.
#
# This script sends mail about invalid records.
#

# ==========================================================================================

# recipient
to="j.tomasek@cesnet.cz"

# sender
sender="etlog@etlog.cesnet.cz"

# mail subject
subj="týdenní report - invalidní záznamy"
subj=$(echo "=?utf-8?B?$(echo $subj | base64)?=")   # utf-8 must be encoded

# etlog log root
etlog_log_root="/home/etlog/logs"

# mail text
text="50 invalidních záznamů za poslední týden: \n"
text+="==========================================================================================\n\n"
text+="$(head -50 "$etlog_log_root/invalid_records/invalid-$(date --date="yesterday" "+%Y-%m-%d")")\n\n\n"

text+="kompletní záznamy za poslední týden jsou dostupné v následujících souborech:\n"

for i in {7..1}
do
  text+="$etlog_log_root/invalid_records/invalid-$(date --date="$i days ago" "+%Y-%m-%d")\n"
done

echo -e "$text" | base64 | mail -a "Content-Type: text/plain; charset=\"utf-8\"" -a "Content-Transfer-Encoding: base64" -s "$subj" -r "$sender" "$to"

