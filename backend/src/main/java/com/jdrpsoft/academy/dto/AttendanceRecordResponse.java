package com.jdrpsoft.academy.dto;

public record AttendanceRecordResponse(
        Long id,
        String username,
        String studentId,
        String studentName,
        String checkedInAt,
        String timestamp,
        String attendanceDate,
        String status,
        boolean isNewDevice
) {
}
