-- DB 초기 스키마 (ddl-auto: none 환경에서 수동 실행)
-- PostgreSQL 기준

CREATE TABLE IF NOT EXISTS invitation_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    academy_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    used_by_username VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS academies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    academy_id BIGINT REFERENCES academies(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    mattermost_user_id VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    academy_id BIGINT NOT NULL REFERENCES academies(id),
    teacher_user_id BIGINT REFERENCES users(id),
    created_by BIGINT REFERENCES users(id),
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    course_type VARCHAR(50) DEFAULT 'regular',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    class_type VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(255),
    starts_on DATE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    course_id BIGINT NOT NULL REFERENCES courses(id),
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    course_id BIGINT,
    attendance_date DATE NOT NULL,
    check_in_at TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_lectures (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    created_by BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_progress (
    id BIGSERIAL PRIMARY KEY,
    video_lecture_id BIGINT NOT NULL REFERENCES video_lectures(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    watched_seconds INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    created_by BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_at TIMESTAMP,
    max_score INT DEFAULT 100,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT,
    file_path TEXT,
    score INT,
    feedback TEXT,
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offline_classes (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    created_by BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    capacity INT DEFAULT 20,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offline_class_applications (
    id BIGSERIAL PRIMARY KEY,
    offline_class_id BIGINT NOT NULL REFERENCES offline_classes(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_change_requests (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    device_info TEXT,
    requested_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP
);
