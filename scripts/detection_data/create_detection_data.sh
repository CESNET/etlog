#!/bin/bash

etlog_base="/home/etlog/etlog/"

cp $etlog_base/scripts/detection_data/base.html $etlog_base/public/partials/detection_data.html;
node $etlog_base/scripts/detection_data/detection_data.js >> $etlog_base/public/partials/detection_data.html

echo "detection data generation finished"
echo "data are available at https://etlog.cesnet.cz/#/detection_data"

cp $etlog_base/scripts/detection_data/base.html $etlog_base/public/partials/detection_data_grouped.html;
node $etlog_base/scripts/detection_data/detection_data.js "grouped" >> $etlog_base/public/partials/detection_data_grouped.html

echo "grouped detection data generation finished"
echo "data are available at https://etlog.cesnet.cz/#/detection_data_grouped"
