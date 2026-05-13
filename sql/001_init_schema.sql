CREATE TABLE academies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    academy_id BIGINT REFERENCES academies(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    mattermost_user_id VARCHAR(64) UNIQUE,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('student', 'teacher', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'inactive')),
    phone VARCHAR(50),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(50),
    parent_mattermost_channel_id VARCHAR(64),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_academy_id ON users(academy_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    academy_id BIGINT NOT NULL REFERENCES academies(id),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    teacher_user_id BIGINT REFERENCES users(id),
    course_type VARCHAR(20) NOT NULL DEFAULT 'regular'
        CHECK (course_type IN ('regular', 'special', 'bootcamp')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_academy_id ON courses(academy_id);
CREATE INDEX idx_courses_teacher_user_id ON courses(teacher_user_id);

CREATE TABLE enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    course_id BIGINT NOT NULL REFERENCES courses(id),
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (enrollment_status IN ('active', 'completed', 'cancelled')),
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_user_id, course_id)
);

CREATE INDEX idx_enrollments_student_user_id ON enrollments(student_user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    class_type VARCHAR(20) NOT NULL
        CHECK (class_type IN ('online', 'offline')),
    day_of_week VARCHAR(10)
        CHECK (day_of_week IN ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(100),
    meeting_url TEXT,
    starts_on DATE,
    ends_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_course_id ON schedules(course_id);

CREATE TABLE attendance_records (
    id BIGSERIAL PRIMARY KEY,
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    course_id BIGINT REFERENCES courses(id),
    attendance_date DATE NOT NULL,
    schedule_id BIGINT REFERENCES schedules(id),
    check_in_at TIMESTAMP,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('present', 'late', 'absent')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_user_id, attendance_date, course_id)
);

CREATE INDEX idx_attendance_student_user_id ON attendance_records(student_user_id);
CREATE INDEX idx_attendance_course_id ON attendance_records(course_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);

CREATE TABLE video_lectures (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_lectures_course_id ON video_lectures(course_id);

CREATE TABLE video_progress (
    id BIGSERIAL PRIMARY KEY,
    video_lecture_id BIGINT NOT NULL REFERENCES video_lectures(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (video_lecture_id, student_user_id)
);

CREATE INDEX idx_video_progress_student_user_id ON video_progress(student_user_id);

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_at TIMESTAMP,
    max_score INTEGER NOT NULL DEFAULT 100,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_course_id ON assignments(course_id);

CREATE TABLE assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT,
    file_path TEXT,
    submitted_at TIMESTAMP,
    score INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP,
    UNIQUE (assignment_id, student_user_id)
);

CREATE INDEX idx_assignment_submissions_student_user_id ON assignment_submissions(student_user_id);

CREATE TABLE offline_classes (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 20,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offline_classes_course_id ON offline_classes(course_id);
CREATE INDEX idx_offline_classes_class_date ON offline_classes(class_date);

CREATE TABLE offline_class_applications (
    id BIGSERIAL PRIMARY KEY,
    offline_class_id BIGINT NOT NULL REFERENCES offline_classes(id),
    student_user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied', 'approved', 'cancelled')),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (offline_class_id, student_user_id)
);

CREATE INDEX idx_offline_class_applications_student_user_id ON offline_class_applications(student_user_id);

CREATE TABLE device_change_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    request_payload JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by BIGINT REFERENCES users(id)
);

CREATE INDEX idx_device_change_requests_user_id ON device_change_requests(user_id);
CREATE INDEX idx_device_change_requests_status ON device_change_requests(status);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    course_id BIGINT REFERENCES courses(id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sent_to_mattermost BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_course_id ON notifications(course_id);

INSERT INTO academies (name, address, phone)
VALUES ('민트학원', '서울시 예시구 예시로 101', '02-0000-0000');

INSERT INTO users (academy_id, email, name, role, status)
VALUES
    (1, 'student1@example.com', '학생 예시', 'student', 'active'),
    (1, 'teacher@example.com', '기본 강사', 'teacher', 'active'),
    (1, 'admin@example.com', '관리자', 'admin', 'active');

-- 운영 흐름 예시:
-- 1. 학원 등록 시 users.email 을 먼저 넣어둡니다.
-- 2. 사용자가 Mattermost 로그인에 성공하면 Mattermost email 과 users.email 을 비교합니다.
-- 3. 일치하면 mattermost_user_id, username, last_login_at 을 갱신합니다.
-- 4. role, academy_id, enrollments, schedules 를 읽어 프론트 초기 화면을 자동 세팅합니다.
