#!/bin/bash
echo "Execute: cd /opt/app/converter"
cd /opt/app/converter

echo "Execute: git pull"
git pull origin main

echo "Execute: npm install"
npm install

echo "Execute: npm build"
npm run build

echo "Execute: stop running process"
ps -ef | grep app/converter | grep -v grep |awk '{print $2}'| xargs kill -9

echo "Execute: npm start"
npm run start > /dev/null 2>&1 &


