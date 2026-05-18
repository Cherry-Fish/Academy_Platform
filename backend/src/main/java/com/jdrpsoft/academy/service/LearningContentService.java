package com.jdrpsoft.academy.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jdrpsoft.academy.entity.AssignmentEntity;
import com.jdrpsoft.academy.entity.AssignmentSubmissionEntity;
import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.OfflineClassApplicationEntity;
import com.jdrpsoft.academy.entity.OfflineClassEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.entity.VideoLectureEntity;
import com.jdrpsoft.academy.entity.VideoProgressEntity;
import com.jdrpsoft.academy.repository.AssignmentRepository;
import com.jdrpsoft.academy.repository.AssignmentSubmissionRepository;
import com.jdrpsoft.academy.repository.CourseRepository;
import com.jdrpsoft.academy.repository.OfflineClassApplicationRepository;
import com.jdrpsoft.academy.repository.OfflineClassRepository;
import com.jdrpsoft.academy.repository.UserRepository;
import com.jdrpsoft.academy.repository.VideoLectureRepository;
import com.jdrpsoft.academy.repository.VideoProgressRepository;

@Service
@Transactional
public class LearningContentService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final VideoLectureRepository videoLectureRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final OfflineClassRepository offlineClassRepository;
    private final OfflineClassApplicationRepository applicationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public LearningContentService(
            VideoLectureRepository videoLectureRepository,
            VideoProgressRepository videoProgressRepository,
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository submissionRepository,
            OfflineClassRepository offlineClassRepository,
            OfflineClassApplicationRepository applicationRepository,
            CourseRepository courseRepository,
            UserRepository userRepository
    ) {
        this.videoLectureRepository = videoLectureRepository;
        this.videoProgressRepository = videoProgressRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.offlineClassRepository = offlineClassRepository;
        this.applicationRepository = applicationRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // ── Videos ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVideos() {
        return videoLectureRepository.findAllWithCourse().stream()
                .map(this::toVideoMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getVideoById(String videoId) {
        Long id = parseId(videoId);
        if (id == null) return null;
        return videoLectureRepository.findById(id).map(this::toVideoMap).orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyWatchHistory(String username) {
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return Map.of();

        Map<String, Object> result = new LinkedHashMap<>();
        videoProgressRepository.findByStudent(user).forEach(p -> {
            VideoLectureEntity video = p.getVideoLecture();
            int total = video.getDurationSeconds() != null ? video.getDurationSeconds() : 0;
            int watched = p.getWatchedSeconds() != null ? p.getWatchedSeconds() : 0;
            int percentage = total > 0 ? Math.min(100, (int) Math.round(watched * 100.0 / total)) : 0;
            result.put(String.valueOf(video.getId()), Map.of(
                    "videoId", String.valueOf(video.getId()),
                    "watchedTime", watched,
                    "totalTime", total,
                    "percentage", percentage,
                    "completed", Boolean.TRUE.equals(p.getCompleted()),
                    "updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().format(DT) : ""
            ));
        });
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllWatchHistory() {
        return videoProgressRepository.findAllWithDetails().stream()
                .map(this::toWatchHistoryMap)
                .toList();
    }

    private Map<String, Object> toWatchHistoryMap(VideoProgressEntity p) {
        VideoLectureEntity video = p.getVideoLecture();
        int total = video.getDurationSeconds() != null ? video.getDurationSeconds() : 0;
        int watched = p.getWatchedSeconds() != null ? p.getWatchedSeconds() : 0;
        int percentage = total > 0 ? Math.min(100, (int) Math.round(watched * 100.0 / total)) : 0;
        String updatedAt = p.getUpdatedAt() != null ? p.getUpdatedAt().format(DT) : "";
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("videoId", String.valueOf(video.getId()));
        map.put("videoTitle", video.getTitle());
        map.put("studentName", p.getStudent().getUsername());
        map.put("watchedTime", watched);
        map.put("totalTime", total);
        map.put("percentage", percentage);
        map.put("completed", Boolean.TRUE.equals(p.getCompleted()));
        map.put("updatedAt", updatedAt);
        map.put("lastWatchedAt", updatedAt);
        return map;
    }

    public Map<String, Object> saveWatchProgress(String username, String videoId, int watchedTime, int totalTime) {
        Long id = parseId(videoId);
        if (id == null) return Map.of("message", "video.not.found");

        VideoLectureEntity video = videoLectureRepository.findById(id).orElse(null);
        if (video == null) return Map.of("message", "video.not.found");

        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return Map.of("message", "user.not.found");

        int total = video.getDurationSeconds() != null ? video.getDurationSeconds() : Math.max(totalTime, 1);
        int percentage = Math.min(100, (int) Math.round(Math.max(watchedTime, 0) * 100.0 / total));
        boolean completed = percentage >= 90;

        VideoProgressEntity progress = videoProgressRepository
                .findByStudentAndVideoLecture(user, video)
                .orElseGet(() -> {
                    VideoProgressEntity p = new VideoProgressEntity();
                    p.setStudent(user);
                    p.setVideoLecture(video);
                    return p;
                });
        progress.setWatchedSeconds(Math.max(watchedTime, 0));
        progress.setCompleted(completed);
        videoProgressRepository.save(progress);

        return Map.of(
                "message", "시청 기록이 저장되었습니다.",
                "progress", Map.of(
                        "videoId", videoId,
                        "watchedTime", progress.getWatchedSeconds(),
                        "totalTime", total,
                        "percentage", percentage,
                        "completed", completed
                )
        );
    }

    public Map<String, Object> createVideo(Map<String, Object> payload) {
        CourseEntity course = findOrCreateCourse(str(payload, "courseId"), str(payload, "courseName"));
        VideoLectureEntity video = new VideoLectureEntity();
        video.setCourse(course);
        video.setTitle(str(payload, "title", "새 강의 영상"));
        video.setDescription(str(payload, "description", ""));
        video.setVideoUrl(str(payload, "videoUrl", ""));
        video.setDurationSeconds(parseDurationToSeconds(str(payload, "duration", "0:00")));
        videoLectureRepository.save(video);
        return toVideoMap(video);
    }

    public Map<String, Object> updateVideo(String videoId, Map<String, Object> payload) {
        Long id = parseId(videoId);
        if (id == null) return null;
        VideoLectureEntity video = videoLectureRepository.findById(id).orElse(null);
        if (video == null) return null;

        if (payload.containsKey("courseId") || payload.containsKey("courseName")) {
            CourseEntity course = findOrCreateCourse(str(payload, "courseId"), str(payload, "courseName"));
            video.setCourse(course);
        }
        if (payload.containsKey("title")) video.setTitle(str(payload, "title", video.getTitle()));
        if (payload.containsKey("description")) video.setDescription(str(payload, "description", ""));
        if (payload.containsKey("videoUrl")) video.setVideoUrl(str(payload, "videoUrl", video.getVideoUrl()));
        if (payload.containsKey("duration")) video.setDurationSeconds(parseDurationToSeconds(str(payload, "duration", "0:00")));
        videoLectureRepository.save(video);
        return toVideoMap(video);
    }

    public void deleteVideo(String videoId) {
        Long id = parseId(videoId);
        if (id == null) return;
        videoLectureRepository.deleteById(id);
    }

    // ── Assignments ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAssignments() {
        return assignmentRepository.findAllWithCourse().stream()
                .map(this::toAssignmentMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAssignmentById(String assignmentId) {
        Long id = parseId(assignmentId);
        if (id == null) return null;
        return assignmentRepository.findByIdWithCourse(id).map(this::toAssignmentMap).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMySubmissions(String username) {
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return List.of();
        return submissionRepository.findByStudentWithDetails(user).stream()
                .map(this::toSubmissionMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMySubmission(String username, String assignmentId) {
        Long aid = parseId(assignmentId);
        if (aid == null) return null;
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        AssignmentEntity assignment = assignmentRepository.findById(aid).orElse(null);
        if (user == null || assignment == null) return null;
        return submissionRepository.findByStudentAndAssignment(user, assignment)
                .map(this::toSubmissionMap).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllSubmissions(String assignmentId) {
        if (assignmentId == null || assignmentId.isBlank()) {
            return submissionRepository.findAllWithDetails().stream()
                    .map(this::toSubmissionMap).toList();
        }
        Long aid = parseId(assignmentId);
        if (aid == null) return List.of();
        AssignmentEntity assignment = assignmentRepository.findById(aid).orElse(null);
        if (assignment == null) return List.of();
        return submissionRepository.findByAssignmentWithStudent(assignment).stream()
                .map(this::toSubmissionMap).toList();
    }

    public Map<String, Object> submitAssignment(String username, String mattermostUserId, String assignmentId, String content, String attachmentName, String attachmentData) {
        Long aid = parseId(assignmentId);
        if (aid == null) return Map.of("message", "assignment.not.found");
        AssignmentEntity assignment = assignmentRepository.findById(aid).orElse(null);
        if (assignment == null) return Map.of("message", "assignment.not.found");
        UserEntity user = userRepository.findByUsername(username)
                .or(() -> mattermostUserId != null ? userRepository.findByMattermostUserId(mattermostUserId) : java.util.Optional.empty())
                .orElse(null);
        if (user == null) return Map.of("message", "user.not.found");

        AssignmentSubmissionEntity submission = submissionRepository
                .findByStudentAndAssignment(user, assignment)
                .orElseGet(() -> {
                    AssignmentSubmissionEntity s = new AssignmentSubmissionEntity();
                    s.setStudent(user);
                    s.setAssignment(assignment);
                    return s;
                });
        submission.setContent(content);
        submission.setSubmittedAt(LocalDateTime.now());
        if (attachmentName != null && !attachmentName.isBlank()) {
            submission.setAttachmentName(attachmentName);
            submission.setAttachmentData(attachmentData);
        }
        submissionRepository.save(submission);

        return Map.of("message", "과제가 제출되었습니다.", "submission", toSubmissionMap(submission));
    }

    public Map<String, Object> createAssignment(Map<String, Object> payload) {
        CourseEntity course = findOrCreateCourse(str(payload, "courseId"), str(payload, "courseName"));
        AssignmentEntity assignment = new AssignmentEntity();
        assignment.setCourse(course);
        assignment.setTitle(str(payload, "title", "새 과제"));
        assignment.setDescription(str(payload, "description", ""));
        assignment.setMaxScore(intVal(payload, "maxScore", 100));
        String due = str(payload, "dueDate", "");
        if (!due.isBlank()) {
            try {
                assignment.setDueAt(LocalDateTime.parse(due, DT));
            } catch (Exception e) {
                try {
                    assignment.setDueAt(LocalDateTime.parse(due,
                            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")));
                } catch (Exception ignored) {}
            }
        }
        assignmentRepository.save(assignment);
        return toAssignmentMap(assignment);
    }

    public void deleteAssignment(String assignmentId) {
        Long id = parseId(assignmentId);
        if (id == null) return;
        submissionRepository.deleteByAssignmentId(id);
        assignmentRepository.deleteById(id);
    }

    public Map<String, Object> gradeSubmission(String submissionId, Integer score, String feedback) {
        Long id = parseId(submissionId);
        if (id == null) return Map.of("message", "submission.not.found");
        AssignmentSubmissionEntity submission = submissionRepository.findById(id).orElse(null);
        if (submission == null) return Map.of("message", "submission.not.found");

        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setGradedAt(LocalDateTime.now());
        submissionRepository.save(submission);
        return toSubmissionMap(submission);
    }

    // ── Offline classes ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOfflineClasses(Integer year, Integer month) {
        int y = year != null ? year : LocalDate.now().getYear();
        int m = month != null ? month : LocalDate.now().getMonthValue();
        return offlineClassRepository.findByYearAndMonth(y, m).stream()
                .map(this::toOfflineClassMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyOfflineClassApplications(String username) {
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return List.of();
        return applicationRepository.findByStudentWithDetails(user).stream()
                .map(this::toApplicationMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllOfflineClassApplications() {
        return applicationRepository.findAllWithDetails().stream()
                .map(this::toApplicationMap)
                .toList();
    }

    public Map<String, Object> createOfflineClass(Map<String, Object> payload) {
        CourseEntity course = findOrCreateCourse(str(payload, "courseId"), str(payload, "courseName"));
        OfflineClassEntity oc = new OfflineClassEntity();
        oc.setCourse(course);
        oc.setTitle(str(payload, "title", "오프라인 특강"));
        oc.setDescription(str(payload, "description", ""));
        String classDate = str(payload, "classDate", str(payload, "startDate", ""));
        oc.setClassDate(resolveClassDate(classDate, str(payload, "dayOfWeek", "")));
        oc.setStartTime(LocalTime.parse(str(payload, "startTime", "18:00")));
        oc.setEndTime(LocalTime.parse(str(payload, "endTime", "20:00")));
        oc.setLocation(str(payload, "location", "강의실"));
        oc.setCapacity(intVal(payload, "capacity", 20));
        offlineClassRepository.save(oc);
        return toOfflineClassMap(oc);
    }

    public Map<String, Object> updateOfflineClass(String offlineClassId, Map<String, Object> payload) {
        Long id = parseId(offlineClassId);
        if (id == null) return Map.of("message", "offline.class.not.found");
        OfflineClassEntity oc = offlineClassRepository.findById(id).orElse(null);
        if (oc == null) return Map.of("message", "offline.class.not.found");

        if (payload.containsKey("title")) oc.setTitle(str(payload, "title", oc.getTitle()));
        if (payload.containsKey("description")) oc.setDescription(str(payload, "description", ""));
        String updatedClassDate = str(payload, "classDate", str(payload, "startDate", ""));
        if (!updatedClassDate.isBlank()) {
            try { oc.setClassDate(LocalDate.parse(updatedClassDate)); } catch (Exception ignored) {}
        }
        if (payload.containsKey("startTime")) oc.setStartTime(LocalTime.parse(str(payload, "startTime", oc.getStartTime().toString())));
        if (payload.containsKey("endTime")) oc.setEndTime(LocalTime.parse(str(payload, "endTime", oc.getEndTime().toString())));
        if (payload.containsKey("location")) oc.setLocation(str(payload, "location", oc.getLocation()));
        if (payload.containsKey("capacity")) oc.setCapacity(intVal(payload, "capacity", oc.getCapacity()));
        offlineClassRepository.save(oc);
        return toOfflineClassMap(oc);
    }

    public Map<String, Object> applyOfflineClass(String username, String offlineClassId) {
        Long id = parseId(offlineClassId);
        if (id == null) return Map.of("message", "offline.class.not.found");
        OfflineClassEntity oc = offlineClassRepository.findById(id).orElse(null);
        if (oc == null) return Map.of("message", "offline.class.not.found");
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return Map.of("message", "user.not.found");

        return applicationRepository.findByStudentAndOfflineClass(user, oc)
                .map(existing -> Map.of(
                        "message", "이미 수강 신청한 오프라인 강의입니다.",
                        "enrollment", toApplicationMap(existing)))
                .orElseGet(() -> {
                    long enrolled = applicationRepository.countByOfflineClass(oc);
                    if (enrolled >= oc.getCapacity()) {
                        return Map.of("message", "정원이 가득 차서 수강 신청할 수 없습니다.");
                    }
                    OfflineClassApplicationEntity app = new OfflineClassApplicationEntity();
                    app.setOfflineClass(oc);
                    app.setStudent(user);
                    applicationRepository.save(app);
                    return Map.of("message", "오프라인 강의 수강 신청이 완료되었습니다.", "enrollment", toApplicationMap(app));
                });
    }

    public void deleteOfflineClass(String offlineClassId) {
        Long id = parseId(offlineClassId);
        if (id != null) offlineClassRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toVideoMap(VideoLectureEntity v) {
        String teacherName = v.getCourse().getTeacher() != null ? v.getCourse().getTeacher().getName() : "";
        return Map.of(
                "id", String.valueOf(v.getId()),
                "courseId", v.getCourse().getCode() != null ? v.getCourse().getCode() : "",
                "courseName", v.getCourse().getName(),
                "title", v.getTitle(),
                "description", v.getDescription() != null ? v.getDescription() : "",
                "videoUrl", v.getVideoUrl(),
                "duration", formatDuration(v.getDurationSeconds()),
                "teacherName", teacherName,
                "thumbnail", "",
                "uploadDate", v.getCreatedAt() != null ? v.getCreatedAt().format(DT) : ""
        );
    }

    private Map<String, Object> toAssignmentMap(AssignmentEntity a) {
        String teacherName = a.getCourse().getTeacher() != null ? a.getCourse().getTeacher().getName() : "";
        return Map.of(
                "id", String.valueOf(a.getId()),
                "courseId", a.getCourse().getCode() != null ? a.getCourse().getCode() : "",
                "courseName", a.getCourse().getName(),
                "title", a.getTitle(),
                "description", a.getDescription() != null ? a.getDescription() : "",
                "teacherName", teacherName,
                "dueDate", a.getDueAt() != null ? a.getDueAt().format(DT) : "",
                "maxScore", a.getMaxScore()
        );
    }

    private Map<String, Object> toSubmissionMap(AssignmentSubmissionEntity s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(s.getId()));
        map.put("assignmentId", String.valueOf(s.getAssignment().getId()));
        map.put("studentName", s.getStudent().getName());
        map.put("content", s.getContent() != null ? s.getContent() : "");
        map.put("submittedAt", s.getSubmittedAt() != null ? s.getSubmittedAt().format(DT) : "");
        map.put("score", s.getScore());
        map.put("feedback", s.getFeedback());
        map.put("gradedAt", s.getGradedAt() != null ? s.getGradedAt().format(DT) : null);
        map.put("attachmentName", s.getAttachmentName() != null ? s.getAttachmentName() : "");
        map.put("attachmentData", s.getAttachmentData() != null ? s.getAttachmentData() : "");
        return map;
    }

    private Map<String, Object> toOfflineClassMap(OfflineClassEntity oc) {
        long enrolledCount = applicationRepository.countByOfflineClass(oc);
        String teacherName = oc.getCourse().getTeacher() != null ? oc.getCourse().getTeacher().getName() : "";
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(oc.getId()));
        map.put("templateId", String.valueOf(oc.getId()));
        map.put("courseId", oc.getCourse().getCode() != null ? oc.getCourse().getCode() : "");
        map.put("courseName", oc.getCourse().getName());
        map.put("title", oc.getTitle());
        map.put("description", oc.getDescription() != null ? oc.getDescription() : "");
        map.put("teacherName", teacherName);
        map.put("classDate", oc.getClassDate().toString());
        map.put("dayOfWeek", toDayOfWeekKey(oc.getClassDate().getDayOfWeek()));
        map.put("startTime", oc.getStartTime().toString());
        map.put("endTime", oc.getEndTime().toString());
        map.put("location", oc.getLocation());
        map.put("capacity", oc.getCapacity());
        map.put("enrolledCount", enrolledCount);
        map.put("isOverride", false);
        map.put("createdAt", oc.getCreatedAt() != null ? oc.getCreatedAt().format(DT) : "");
        return map;
    }

    private Map<String, Object> toApplicationMap(OfflineClassApplicationEntity app) {
        OfflineClassEntity oc = app.getOfflineClass();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(app.getId()));
        map.put("offlineClassId", String.valueOf(oc.getId()));
        map.put("username", app.getStudent().getUsername());
        map.put("status", app.getStatus());
        map.put("appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().format(DT) : "");
        map.put("courseId", oc.getCourse().getCode() != null ? oc.getCourse().getCode() : "");
        map.put("courseName", oc.getCourse().getName());
        map.put("title", oc.getTitle());
        map.put("classDate", oc.getClassDate().toString());
        map.put("startTime", oc.getStartTime().toString());
        map.put("endTime", oc.getEndTime().toString());
        map.put("location", oc.getLocation());
        return map;
    }

    private CourseEntity findOrCreateCourse(String code, String name) {
        if (code != null && !code.isBlank()) {
            return courseRepository.findByCode(code).orElseGet(() -> {
                CourseEntity c = new CourseEntity();
                c.setCode(code);
                c.setName(name != null && !name.isBlank() ? name : code);
                c.setCourseType("regular");
                c.setStatus("active");
                return courseRepository.save(c);
            });
        }
        CourseEntity c = new CourseEntity();
        c.setName(name != null && !name.isBlank() ? name : "미분류");
        c.setCourseType("regular");
        c.setStatus("active");
        return courseRepository.save(c);
    }

    private LocalDate resolveClassDate(String classDate, String dayOfWeek) {
        if (!classDate.isBlank()) {
            try { return LocalDate.parse(classDate); } catch (Exception ignored) {}
        }
        if (!dayOfWeek.isBlank()) {
            DayOfWeek target = parseDayOfWeek(dayOfWeek);
            LocalDate today = LocalDate.now();
            LocalDate next = today.getDayOfWeek() == target ? today : today.with(java.time.temporal.TemporalAdjusters.next(target));
            return next;
        }
        return LocalDate.now().plusDays(3);
    }

    private Long parseId(String id) {
        if (id == null || id.isBlank()) return null;
        try { return Long.parseLong(id); } catch (NumberFormatException e) { return null; }
    }

    private String str(Map<String, Object> map, String key, String fallback) {
        Object v = map.get(key);
        String s = v == null ? null : String.valueOf(v).trim();
        return (s == null || s.isBlank()) ? fallback : s;
    }

    private String str(Map<String, Object> map, String key) {
        return str(map, key, "");
    }

    private int intVal(Map<String, Object> map, String key, int fallback) {
        try { return Integer.parseInt(String.valueOf(map.getOrDefault(key, fallback))); }
        catch (NumberFormatException e) { return fallback; }
    }

    private int parseDurationToSeconds(String duration) {
        try {
            String[] parts = duration.split(":");
            if (parts.length == 2) return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
            if (parts.length == 3) return Integer.parseInt(parts[0]) * 3600 + Integer.parseInt(parts[1]) * 60 + Integer.parseInt(parts[2]);
        } catch (Exception ignored) {}
        return 0;
    }

    private String formatDuration(Integer seconds) {
        if (seconds == null || seconds <= 0) return "0:00";
        return String.format("%d:%02d", seconds / 60, seconds % 60);
    }

    private String toDayOfWeekKey(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    private DayOfWeek parseDayOfWeek(String key) {
        return switch (key.toUpperCase()) {
            case "TUE" -> DayOfWeek.TUESDAY;
            case "WED" -> DayOfWeek.WEDNESDAY;
            case "THU" -> DayOfWeek.THURSDAY;
            case "FRI" -> DayOfWeek.FRIDAY;
            case "SAT" -> DayOfWeek.SATURDAY;
            case "SUN" -> DayOfWeek.SUNDAY;
            default -> DayOfWeek.MONDAY;
        };
    }
}
