package com.jdrpsoft.academy.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.jdrpsoft.academy.config.AuthRoleProperties;
import com.jdrpsoft.academy.entity.AcademyEntity;
import com.jdrpsoft.academy.entity.AssignmentEntity;
import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.EnrollmentEntity;
import com.jdrpsoft.academy.entity.OfflineClassEntity;
import com.jdrpsoft.academy.entity.ScheduleEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.entity.VideoLectureEntity;
import com.jdrpsoft.academy.repository.AcademyRepository;
import com.jdrpsoft.academy.repository.AssignmentRepository;
import com.jdrpsoft.academy.repository.CourseRepository;
import com.jdrpsoft.academy.repository.EnrollmentRepository;
import com.jdrpsoft.academy.repository.OfflineClassRepository;
import com.jdrpsoft.academy.repository.ScheduleRepository;
import com.jdrpsoft.academy.repository.UserRepository;
import com.jdrpsoft.academy.repository.VideoLectureRepository;

@Component
public class DataSeeder implements ApplicationRunner {

    private final AuthRoleProperties authRoleProperties;
    private final AcademyRepository academyRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ScheduleRepository scheduleRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final VideoLectureRepository videoLectureRepository;
    private final AssignmentRepository assignmentRepository;
    private final OfflineClassRepository offlineClassRepository;

    public DataSeeder(
            AuthRoleProperties authRoleProperties,
            AcademyRepository academyRepository,
            UserRepository userRepository,
            CourseRepository courseRepository,
            ScheduleRepository scheduleRepository,
            EnrollmentRepository enrollmentRepository,
            VideoLectureRepository videoLectureRepository,
            AssignmentRepository assignmentRepository,
            OfflineClassRepository offlineClassRepository
    ) {
        this.authRoleProperties = authRoleProperties;
        this.academyRepository = academyRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.scheduleRepository = scheduleRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.videoLectureRepository = videoLectureRepository;
        this.assignmentRepository = assignmentRepository;
        this.offlineClassRepository = offlineClassRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (authRoleProperties.users() == null || authRoleProperties.users().isEmpty()) {
            return;
        }

        AcademyEntity academy = academyRepository.findByName("민트학원")
                .orElseGet(() -> academyRepository.save(new AcademyEntity("민트학원")));

        // 1단계: 사용자 생성 (email 기준 중복 방지)
        Map<String, UserEntity> userMap = new HashMap<>();
        for (AuthRoleProperties.BootstrapUser config : authRoleProperties.users()) {
            if (config.email() == null || config.username() == null) continue;
            UserEntity user = userRepository.findByEmail(config.email())
                    .orElseGet(() -> {
                        UserEntity u = new UserEntity();
                        u.setAcademy(academy);
                        u.setEmail(config.email());
                        u.setUsername(config.username());
                        u.setName(config.name() != null ? config.name() : config.username());
                        u.setRole(config.role() != null ? config.role() : "student");
                        u.setStatus("active");
                        return userRepository.save(u);
                    });
            userMap.put(config.username(), user);
        }

        // 2단계: 교사 코스 + 스케줄 생성
        for (AuthRoleProperties.BootstrapUser config : authRoleProperties.users()) {
            if (!"teacher".equals(config.role()) || config.courses() == null) continue;
            UserEntity teacher = userMap.get(config.username());
            if (teacher == null) continue;

            for (AuthRoleProperties.BootstrapCourse courseConfig : config.courses()) {
                AcademyEntity finalAcademy = academy;
                CourseEntity course = courseRepository.findByCode(courseConfig.courseId())
                        .orElseGet(() -> {
                            CourseEntity c = new CourseEntity();
                            c.setAcademy(finalAcademy);
                            c.setCode(courseConfig.courseId());
                            c.setName(courseConfig.courseName());
                            c.setCourseType("regular");
                            c.setStatus("active");
                            c.setTeacher(teacher);
                            return courseRepository.save(c);
                        });

                if (config.schedules() != null) {
                    for (AuthRoleProperties.BootstrapSchedule s : config.schedules()) {
                        if (!courseConfig.courseId().equals(s.courseId())) continue;
                        if (scheduleRepository.existsByCourseAndDayOfWeek(course, s.dayOfWeek())) continue;
                        ScheduleEntity schedule = new ScheduleEntity();
                        schedule.setCourse(course);
                        schedule.setClassType(s.classType() != null ? s.classType() : "online");
                        schedule.setDayOfWeek(s.dayOfWeek());
                        schedule.setStartTime(LocalTime.parse(s.startTime()));
                        schedule.setEndTime(LocalTime.parse(s.endTime()));
                        scheduleRepository.save(schedule);
                    }
                }
            }
        }

        // 3단계: 학생 수강 등록
        for (AuthRoleProperties.BootstrapUser config : authRoleProperties.users()) {
            if (!"student".equals(config.role()) || config.courses() == null) continue;
            UserEntity student = userMap.get(config.username());
            if (student == null) continue;
            for (AuthRoleProperties.BootstrapCourse courseConfig : config.courses()) {
                courseRepository.findByCode(courseConfig.courseId()).ifPresent(course -> {
                    if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
                        EnrollmentEntity enrollment = new EnrollmentEntity();
                        enrollment.setStudent(student);
                        enrollment.setCourse(course);
                        enrollment.setEnrollmentStatus("active");
                        enrollmentRepository.save(enrollment);
                    }
                });
            }
        }

        // 4단계: 콘텐츠 초기 데이터 (최초 1회만)
        if (videoLectureRepository.count() == 0) {
            seedVideos();
        }
        if (assignmentRepository.count() == 0) {
            seedAssignments();
        }
        if (offlineClassRepository.count() == 0) {
            seedOfflineClasses();
        }
    }

    private void seedVideos() {
        record SeedVideo(String courseCode, String title, String description, String url, String duration) {}
        List<SeedVideo> seeds = List.of(
                new SeedVideo("course-web", "React 컴포넌트 기초", "컴포넌트와 props 개념을 익히는 입문 강의입니다.",
                        "https://www.youtube.com/watch?v=SqcY0GlETPk", "18:24"),
                new SeedVideo("course-java", "Java 조건문과 반복문", "if문, switch문, for문, while문을 예제로 정리합니다.",
                        "https://www.youtube.com/watch?v=eIrMbAQSU34", "24:10"),
                new SeedVideo("course-db", "SQL SELECT 실습", "조회문과 정렬, 조건 검색을 함께 연습합니다.",
                        "https://www.youtube.com/watch?v=HXV3zeQKqGY", "16:05")
        );
        for (SeedVideo s : seeds) {
            courseRepository.findByCode(s.courseCode()).ifPresent(course -> {
                VideoLectureEntity v = new VideoLectureEntity();
                v.setCourse(course);
                v.setTitle(s.title());
                v.setDescription(s.description());
                v.setVideoUrl(s.url());
                v.setDurationSeconds(parseDuration(s.duration()));
                videoLectureRepository.save(v);
            });
        }
    }

    private void seedAssignments() {
        record SeedAssignment(String courseCode, String title, String description, int daysUntilDue) {}
        List<SeedAssignment> seeds = List.of(
                new SeedAssignment("course-web", "React 로그인 화면 구현",
                        "로그인 폼과 기본 유효성 검사를 직접 구성해보세요.", 5),
                new SeedAssignment("course-java", "반복문 실습 문제",
                        "for문과 while문을 이용해 별 찍기와 합계 계산 문제를 해결하세요.", 3),
                new SeedAssignment("course-db", "SELECT 쿼리 작성",
                        "학생 테이블과 성적 테이블을 이용해 조건 조회 쿼리를 작성하세요.", 6)
        );
        for (SeedAssignment s : seeds) {
            courseRepository.findByCode(s.courseCode()).ifPresent(course -> {
                AssignmentEntity a = new AssignmentEntity();
                a.setCourse(course);
                a.setTitle(s.title());
                a.setDescription(s.description());
                a.setDueAt(LocalDateTime.now().plusDays(s.daysUntilDue()));
                a.setMaxScore(100);
                assignmentRepository.save(a);
            });
        }
    }

    private void seedOfflineClasses() {
        record SeedOffline(String courseCode, String title, String description,
                           java.time.DayOfWeek dayOfWeek, String start, String end, String location, int capacity) {}
        List<SeedOffline> seeds = List.of(
                new SeedOffline("course-web", "프론트엔드 실습반",
                        "React 레이아웃과 상태 관리를 오프라인으로 함께 실습합니다.",
                        java.time.DayOfWeek.TUESDAY, "19:00", "21:00", "학원 301호", 18),
                new SeedOffline("course-java", "Java 문제풀이 클리닉",
                        "조건문과 반복문 문제를 같이 풀며 질문을 받는 오프라인 보강입니다.",
                        java.time.DayOfWeek.THURSDAY, "18:30", "20:00", "학원 202호", 16),
                new SeedOffline("course-db", "SQL 실습 세션",
                        "SELECT와 JOIN을 손으로 직접 써보는 실습 위주 수업입니다.",
                        java.time.DayOfWeek.SATURDAY, "14:00", "15:30", "학원 105호", 20)
        );
        LocalDate today = LocalDate.now();
        for (SeedOffline s : seeds) {
            courseRepository.findByCode(s.courseCode()).ifPresent(course -> {
                // 이번 주 해당 요일 (오늘 포함 또는 다음 해당 요일)
                LocalDate classDate = today.getDayOfWeek() == s.dayOfWeek()
                        ? today
                        : today.with(TemporalAdjusters.next(s.dayOfWeek()));
                OfflineClassEntity oc = new OfflineClassEntity();
                oc.setCourse(course);
                oc.setTitle(s.title());
                oc.setDescription(s.description());
                oc.setClassDate(classDate);
                oc.setStartTime(LocalTime.parse(s.start()));
                oc.setEndTime(LocalTime.parse(s.end()));
                oc.setLocation(s.location());
                oc.setCapacity(s.capacity());
                offlineClassRepository.save(oc);
            });
        }
    }

    private int parseDuration(String duration) {
        try {
            String[] parts = duration.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 0;
        }
    }
}
