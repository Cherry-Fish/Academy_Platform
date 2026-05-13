#!/usr/bin/env bash
# 서버에서 최초 1회 실행 (Termius에 붙여넣기)
# ubuntu@hyunssoo.asuscomm.com 에서 실행

set -euo pipefail

echo "=== Java 21 설치 확인 ==="
if ! java -version 2>&1 | grep -q "21"; then
  sudo apt-get update -qq
  sudo apt-get install -y openjdk-21-jre-headless
fi
java -version

echo "=== Nginx 설치 확인 ==="
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
fi

echo "=== PostgreSQL academy 계정/DB 생성 ==="
# EDB PostgreSQL이 이미 실행 중이라 가정 (포트 5432)
sudo -u postgres psql -c "CREATE USER academy WITH PASSWORD 'academy_prod_2026';" 2>/dev/null || echo "academy 사용자 이미 존재"
sudo -u postgres psql -c "CREATE DATABASE academy OWNER academy;" 2>/dev/null || echo "academy DB 이미 존재"

echo "=== DB 스키마 적용 ==="
if [ -f /opt/academy/db_migration.sql ]; then
  PGPASSWORD=academy_prod_2026 psql -h localhost -U academy -d academy -f /opt/academy/db_migration.sql 2>&1 | grep -v "already exists" || true
fi

echo "=== 환경변수 파일 생성 ==="
sudo tee /etc/academy/env > /dev/null <<'EOF'
DB_URL=jdbc:postgresql://localhost:5432/academy
DB_USERNAME=academy
DB_PASSWORD=academy_prod_2026
JWT_SECRET=academy-prod-secret-change-this-to-random-64-chars-2026
CORS_ALLOWED_ORIGINS=http://hyunssoo.asuscomm.com:8080
EOF
sudo chmod 600 /etc/academy/env

echo "=== systemd 서비스 등록 ==="
sudo tee /etc/systemd/system/academy.service > /dev/null <<'EOF'
[Unit]
Description=Academy Platform Backend
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/opt/academy
EnvironmentFile=/etc/academy/env
ExecStart=/usr/bin/java -jar /opt/academy/app.jar --server.port=8081
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable academy

echo "=== Nginx 설정 ==="
sudo tee /etc/nginx/sites-available/academy > /dev/null <<'EOF'
server {
    listen 8080;
    server_name hyunssoo.asuscomm.com;

    root /opt/academy/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /actuator/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/academy /etc/nginx/sites-enabled/academy
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== 초기 설정 완료 ==="
echo "이제 로컬에서 deploy.sh 를 실행하여 파일을 업로드하세요."
