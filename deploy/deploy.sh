#!/usr/bin/env bash
# 서버에서 직접 실행하는 배포 스크립트
# 사용법: bash deploy.sh

set -euo pipefail

APP_DIR="$HOME/Academy_Platform"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "=== 1. 최신 코드 받기 ==="
cd "$APP_DIR"
git pull

echo "=== 2. 프론트엔드 빌드 ==="
cd "$FRONTEND_DIR"
npm install --silent
npm run build

echo "=== 3. 백엔드 빌드 ==="
cd "$BACKEND_DIR"
./mvnw package -DskipTests -q

echo "=== 4. 백엔드 재시작 ==="
sudo lsof -ti:8081 | xargs sudo kill -9 2>/dev/null || true
sleep 2

export MATTERMOST_ADMIN_TOKEN="${MATTERMOST_ADMIN_TOKEN:-}"
nohup java -Djava.net.preferIPv4Stack=true -jar "$BACKEND_DIR/target/academy-platform-backend-0.0.1-SNAPSHOT.jar" \
  > "$HOME/backend.log" 2>&1 &

sleep 5
STATUS=$(curl -s http://localhost:8081/actuator/health | grep -o '"UP"' || echo "확인 필요")
echo "백엔드 상태: $STATUS"

echo "=== 5. Nginx 재시작 ==="
sudo systemctl restart nginx

echo ""
echo "배포 완료!"
