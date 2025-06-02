#!/bin/bash

echo "1. 月報一覧を取得..."
curl -s "http://localhost:8000/api/reports/?page=1&size=5" | head -200

echo -e "\n\n2. 月報ID 2 の削除を試行..."
curl -X DELETE "http://localhost:8000/api/reports/2" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3456" \
  -i

echo -e "\n\n3. 存在しないID 99999 の削除を試行..."
curl -X DELETE "http://localhost:8000/api/reports/99999" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3456" \
  -i