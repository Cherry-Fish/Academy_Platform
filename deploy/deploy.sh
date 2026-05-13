#!/usr/bin/env bash
# 로컬 Mac에서 실행 — 빌드 결과물을 서버에 올리고 재시작

set -euo pipefail

SSH_HOST="hyunssoo.asuscomm.com"
SSH_PORT="9022"
SSH_USER="ubuntu"
SSH="ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
SCP="scp -P $SSH_PORT"

JAR="$(dirname "$0")/../backend/target/academy-platform-backend-0.0.1-SNAPSHOT.jar"
FRONTEND_BUILD="$(dirname "$0")/../frontend/build"
MIGRATION_SQL="$(dirname "$0")/../backend/src/main/resources/db_migration.sql"

echo "=== 1. 서버 디렉토리 준비 ==="
$SSH "sudo mkdir -p /opt/academy/frontend /etc/academy && sudo chown -R ubuntu:ubuntu /opt/academy /etc/academy"

echo "=== 2. JAR 업로드 ==="
$SCP "$JAR" "$SSH_USER@$SSH_HOST:/opt/academy/app.jar"

echo "=== 3. 프론트엔드 업로드 ==="
rsync -avz --delete -e "ssh -p $SSH_PORT" "$FRONTEND_BUILD/" "$SSH_USER@$SSH_HOST:/opt/academy/frontend/"

echo "=== 4. DB 마이그레이션 스크립트 업로드 ==="
$SCP "$MIGRATION_SQL" "$SSH_USER@$SSH_HOST:/opt/academy/db_migration.sql"

echo "=== 5. 서비스 재시작 ==="
$SSH "sudo systemctl restart academy && sleep 3 && sudo systemctl status academy --no-pager"

echo ""
echo "배포 완료. http://$SSH_HOST:8080 에서 확인하세요."
