package com.jdrpsoft.academy.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jdrpsoft.academy.dto.AdminUserRequest;
import com.jdrpsoft.academy.entity.AcademyEntity;
import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.EnrollmentEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.model.UserCourse;
import com.jdrpsoft.academy.model.UserProfile;
import com.jdrpsoft.academy.model.UserRole;
import com.jdrpsoft.academy.model.UserSchedule;
import com.jdrpsoft.academy.repository.AcademyRepository;
import com.jdrpsoft.academy.repository.AssignmentSubmissionRepository;
import com.jdrpsoft.academy.repository.AttendanceRecordRepository;
import com.jdrpsoft.academy.repository.CourseRepository;
import com.jdrpsoft.academy.repository.DeviceChangeRequestRepository;
import com.jdrpsoft.academy.repository.EnrollmentRepository;
import com.jdrpsoft.academy.repository.OfflineClassApplicationRepository;
import com.jdrpsoft.academy.repository.ScheduleRepository;
import com.jdrpsoft.academy.repository.UserRepository;
import com.jdrpsoft.academy.repository.VideoProgressRepository;

@Service
@Transactional
public class UserDirectoryService {

    private final AcademyRepository academyRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final OfflineClassApplicationRepository offlineClassApplicationRepository;
    private final DeviceChangeRequestRepository deviceChangeRequestRepository;

    public UserDirectoryService(
            AcademyRepository academyRepository,
            UserRepository userRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            ScheduleRepository scheduleRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            VideoProgressRepository videoProgressRepository,
            AssignmentSubmissionRepository assignmentSubmissionRepository,
            OfflineClassApplicationRepository offlineClassApplicationRepository,
            DeviceChangeRequestRepository deviceChangeRequestRepository
    ) {
        this.academyRepository = academyRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.scheduleRepository = scheduleRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.videoProgressRepository = videoProgressRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.offlineClassApplicationRepository = offlineClassApplicationRepository;
        this.deviceChangeRequestRepository = deviceChangeRequestRepository;
    }

    public UserProfile resolveProfile(String mattermostUserId, String username, String displayName, String email) {
        UserEntity user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(username))
                .orElse(null);

        if (user == null) {
            return unregisteredProfile(mattermostUserId, username, displayName, email);
        }

        user.setMattermostUserId(mattermostUserId);
        user.setUsername(username);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return toProfile(user, true);
    }

    public UserProfile updateProfile(String username, String displayName, String unusedEmail) {
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user != null && displayName != null && !displayName.isBlank()) {
            user.setName(displayName);
            userRepository.save(user);
            return toProfile(user, true);
        }
        return unregisteredProfile("", username, displayName, "");
    }

    @Transactional(readOnly = true)
    public List<UserProfile> listRegisteredUsers() {
        return userRepository.findAll().stream()
                .map(user -> toProfile(user, true))
                .toList();
    }

    public UserProfile registerUser(AdminUserRequest request) {
        AcademyEntity academy = academyRepository.findByName(request.academyName())
                .orElseGet(() -> academyRepository.save(new AcademyEntity(request.academyName())));

        UserEntity user = userRepository.findByEmail(request.email()).orElseGet(() -> {
            UserEntity u = new UserEntity();
            u.setAcademy(academy);
            u.setEmail(request.email());
            u.setUsername(request.username());
            u.setName(request.name());
            u.setRole(request.role());
            u.setStatus("active");
            return userRepository.save(u);
        });

        if (request.courses() != null) {
            for (AdminUserRequest.AdminCourseRequest courseReq : request.courses()) {
                AcademyEntity finalAcademy = academy;
                CourseEntity course = courseRepository.findByCode(courseReq.courseId())
                        .orElseGet(() -> {
                            CourseEntity c = new CourseEntity();
                            c.setAcademy(finalAcademy);
                            c.setCode(courseReq.courseId());
                            c.setName(courseReq.courseName());
                            c.setCourseType("regular");
                            c.setStatus("active");
                            return courseRepository.save(c);
                        });

                if ("teacher".equals(request.role())) {
                    if (course.getTeacher() == null) {
                        course.setTeacher(user);
                        courseRepository.save(course);
                    }
                } else {
                    if (!enrollmentRepository.existsByStudentAndCourse(user, course)) {
                        EnrollmentEntity enrollment = new EnrollmentEntity();
                        enrollment.setStudent(user);
                        enrollment.setCourse(course);
                        enrollment.setEnrollmentStatus("active");
                        enrollmentRepository.save(enrollment);
                    }
                }
            }
        }

        return toProfile(user, true);
    }

    public UserProfile updateUser(String username, AdminUserRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + username));

        user.setName(request.name());
        user.setRole(request.role());
        user.setEmail(request.email());

        if (request.academyName() != null && !request.academyName().isBlank()) {
            AcademyEntity academy = academyRepository.findByName(request.academyName())
                    .orElseGet(() -> academyRepository.save(new AcademyEntity(request.academyName())));
            user.setAcademy(academy);
        }

        enrollmentRepository.deleteByStudent(user);
        courseRepository.findByTeacher(user).forEach(c -> { c.setTeacher(null); courseRepository.save(c); });

        if (request.courses() != null) {
            AcademyEntity academy = user.getAcademy();
            for (AdminUserRequest.AdminCourseRequest courseReq : request.courses()) {
                CourseEntity course = courseRepository.findByCode(courseReq.courseId())
                        .orElseGet(() -> {
                            CourseEntity c = new CourseEntity();
                            c.setAcademy(academy);
                            c.setCode(courseReq.courseId());
                            c.setName(courseReq.courseName());
                            c.setCourseType("regular");
                            c.setStatus("active");
                            return courseRepository.save(c);
                        });

                if ("teacher".equals(request.role())) {
                    if (course.getTeacher() == null) {
                        course.setTeacher(user);
                        courseRepository.save(course);
                    }
                } else {
                    EnrollmentEntity enrollment = new EnrollmentEntity();
                    enrollment.setStudent(user);
                    enrollment.setCourse(course);
                    enrollment.setEnrollmentStatus("active");
                    enrollmentRepository.save(enrollment);
                }
            }
        }

        userRepository.save(user);
        return toProfile(user, true);
    }

    public void deleteUser(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + username));

        offlineClassApplicationRepository.deleteByStudent(user);
        assignmentSubmissionRepository.deleteByStudent(user);
        videoProgressRepository.deleteByStudent(user);
        attendanceRecordRepository.deleteByStudent(user);
        enrollmentRepository.deleteByStudent(user);
        courseRepository.findByTeacher(user).forEach(course -> {
            course.setTeacher(null);
            courseRepository.save(course);
        });
        deviceChangeRequestRepository.deleteByUsername(username);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentsForTeacher(String teacherUsername) {
        UserEntity teacher = userRepository.findByUsername(teacherUsername).orElse(null);
        if (teacher == null) {
            return List.of();
        }

        List<CourseEntity> teacherCourses = courseRepository.findByTeacher(teacher);
        if (teacherCourses.isEmpty()) {
            teacherCourses = courseRepository.findAll();
        }
        if (teacherCourses.isEmpty()) {
            return List.of();
        }

        return teacherCourses.stream()
                .flatMap(course -> enrollmentRepository.findByCourse(course).stream()
                        .filter(e -> "active".equals(e.getEnrollmentStatus()))
                        .map(e -> buildStudentMap(e.getStudent(), course)))
                .distinct()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentsByCourse(String courseCode) {
        CourseEntity course = courseRepository.findByCode(courseCode).orElse(null);
        if (course == null) return List.of();
        return enrollmentRepository.findByCourse(course).stream()
                .filter(e -> "active".equals(e.getEnrollmentStatus()))
                .map(e -> buildStudentMap(e.getStudent(), course))
                .toList();
    }

    private UserProfile toProfile(UserEntity user, boolean registered) {
        String academyName = user.getAcademy() != null ? user.getAcademy().getName() : "";
        UserRole role = UserRole.fromConfig(user.getRole());

        List<CourseEntity> courses;
        if (role == UserRole.TEACHER || role == UserRole.ADMIN) {
            courses = courseRepository.findByTeacher(user);
        } else {
            courses = enrollmentRepository.findByStudentAndEnrollmentStatus(user, "active")
                    .stream().map(EnrollmentEntity::getCourse).toList();
        }

        List<UserCourse> userCourses = courses.stream()
                .map(c -> new UserCourse(c.getCode(), c.getName()))
                .toList();

        List<UserSchedule> userSchedules = courses.stream()
                .flatMap(c -> scheduleRepository.findByCourse(c).stream()
                        .map(s -> new UserSchedule(
                                c.getCode(),
                                c.getName(),
                                s.getDayOfWeek(),
                                s.getStartTime().toString(),
                                s.getEndTime().toString(),
                                s.getClassType()
                        )))
                .toList();

        return new UserProfile(
                user.getMattermostUserId() != null ? user.getMattermostUserId() : "",
                user.getUsername() != null ? user.getUsername() : "",
                user.getName(),
                user.getEmail(),
                role,
                registered,
                academyName,
                userCourses,
                userSchedules
        );
    }

    private Map<String, Object> buildStudentMap(UserEntity student, CourseEntity course) {
        List<UserCourse> courses = enrollmentRepository.findByStudentAndEnrollmentStatus(student, "active")
                .stream().map(e -> new UserCourse(e.getCourse().getCode(), e.getCourse().getName())).toList();

        List<UserSchedule> schedules = enrollmentRepository.findByStudentAndEnrollmentStatus(student, "active")
                .stream()
                .flatMap(e -> scheduleRepository.findByCourse(e.getCourse()).stream()
                        .map(s -> new UserSchedule(
                                e.getCourse().getCode(), e.getCourse().getName(),
                                s.getDayOfWeek(), s.getStartTime().toString(),
                                s.getEndTime().toString(), s.getClassType())))
                .toList();

        return Map.of(
                "username", student.getUsername() != null ? student.getUsername() : "",
                "displayName", student.getName(),
                "email", student.getEmail(),
                "academyName", student.getAcademy() != null ? student.getAcademy().getName() : "",
                "enrolledCourses", courses,
                "schedules", schedules
        );
    }

    private UserProfile unregisteredProfile(String mattermostUserId, String username, String displayName, String email) {
        return new UserProfile(mattermostUserId, username, displayName, email,
                UserRole.STUDENT, false, "", List.of(), List.of());
    }
}
