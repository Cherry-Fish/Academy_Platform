package com.jdrpsoft.academy.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jdrpsoft.academy.dto.AttendanceRecordResponse;
import com.jdrpsoft.academy.entity.AttendanceRecordEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.repository.AttendanceRecordRepository;
import com.jdrpsoft.academy.repository.UserRepository;

@Service
@Transactional
public class AttendanceService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final UserRepository userRepository;

    public AttendanceService(
            AttendanceRecordRepository attendanceRecordRepository,
            UserRepository userRepository
    ) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.userRepository = userRepository;
    }

    public AttendanceRecordResponse checkIn(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 사용자입니다: " + username));

        LocalDate today = LocalDate.now();
        return attendanceRecordRepository
                .findByStudentAndAttendanceDateAndCourseIdIsNull(user, today)
                .map(this::toResponse)
                .orElseGet(() -> {
                    AttendanceRecordEntity record = new AttendanceRecordEntity();
                    record.setStudent(user);
                    record.setAttendanceDate(today);
                    record.setCheckInAt(LocalDateTime.now());
                    record.setStatus("present");
                    return toResponse(attendanceRecordRepository.save(record));
                });
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getTodayAttendance() {
        return attendanceRecordRepository.findTodayRecords(LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getMonthlyAttendance(String username, int year, int month) {
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return List.of();
        }

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth().isAfter(LocalDate.now())
                ? LocalDate.now()
                : yearMonth.atEndOfMonth();

        return attendanceRecordRepository
                .findByStudentAndAttendanceDateBetweenAndCourseIdIsNullOrderByAttendanceDateAsc(user, start, end)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AttendanceRecordResponse toResponse(AttendanceRecordEntity record) {
        String checkedInAt = record.getCheckInAt() != null
                ? record.getCheckInAt().format(FORMATTER)
                : record.getAttendanceDate().atStartOfDay().format(FORMATTER);
        String isoTimestamp = record.getCheckInAt() != null
                ? record.getCheckInAt().toString()
                : record.getAttendanceDate().atStartOfDay().toString();
        String status = record.getStatus();
        String studentUsername = record.getStudent().getUsername();
        String studentName = record.getStudent().getName();

        return new AttendanceRecordResponse(
                record.getId(),
                studentUsername,
                studentUsername,
                studentName,
                checkedInAt,
                isoTimestamp,
                record.getAttendanceDate().toString(),
                status,
                false
        );
    }
}
