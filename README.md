# Academy Platform

학원 출결, 알림, 과제, 진도 관리를 위한 새 프로젝트 작업 폴더입니다.

## 목표

- 학생 출석 체크
- Mattermost 알림 연동
- 강사용 과제 관리
- 관리자용 학습 진도 확인

## 폴더 구조

- `backend/`: Spring Boot 백엔드
- `frontend/`: React 프론트엔드
- `docs/`: 요구사항, API, 이식 메모
- `sql/`: PostgreSQL 스키마 초안

## 기존 자산 활용 기준

- `com-jdrpsoft-nexus`: Mattermost 로그인/JWT/배포 참고
- `nexus-frontend`: axios, React 운영 구조 참고
- `mattermost-project`: 화면/기능 아이디어 참고

## 제외 기준

- 메뉴/사내 포털 중심 구조
- `MATT_USERS` 의존 로그인 후처리
- mock API를 그대로 사용하는 구조
