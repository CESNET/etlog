#!/bin/bash

cp scripts/detection_data/base.html public/partials/detection_data.html; 
node scripts/detection_data/detection_data.js >> public/partials/detection_data.html

echo "detection data generation finished"
echo "data are available at https://etlog.cesnet.cz/#/detection_data"
