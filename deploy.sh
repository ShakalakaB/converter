#!/bin/bash
echo "===> Execute: cd /opt/deploy/converter"
cd /opt/deploy/converter

echo "===> Execute: git pull"
git pull origin main

echo "===> Execute: npm install"
npm install

echo "===> Execute: npm build"
npm run build

echo "===> Execute: copy built directory to target directory"
cp -fRT /opt/deploy/converter /opt/app/converter

echo "===> Execute: stop running process"
if ps -ef | grep app/converter | grep node | grep -v grep
then
  ps -ef | grep app/converter | grep node |  grep -v grep |awk '{print $2}'| xargs kill -9;
fi

echo "===> Execute: npm start"
cd /opt/app/converter
npm run start > /dev/null 2>&1 &

echo "===> Execute: check http status with curl"
sleep 2
curl -LI https://converter.aldoraweb.com -o /dev/null -w '%{http_code}\n' -s


