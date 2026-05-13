# Migration Plan

## 재사용

- Mattermost 인증 연동 방식
- JWT 발급 및 인증 흐름
- PostgreSQL 연결 설정
- Nginx 배포 경험

## 부분 재사용

- 팀원 프론트의 학생/강사 화면 흐름
- 출석/과제/영상 관리 UI 아이디어

## 폐기

- 사내 메뉴 기반 구조
- `TB_COMMON_MENU`, `TB_USER_MENU` 중심 설계
- mock API 고정 구조

## 1차 MVP

1. 로그인
2. 출석 체크
3. Mattermost 알림 전송
4. 출석 조회

## 다음 작업

1. DB 스키마 확정
2. 백엔드 API 초안
3. 프론트 라우트 초안
