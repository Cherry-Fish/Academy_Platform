package com.jdrpsoft.academy.dto;

public record AttendanceSessionResponse(
        AttendanceSessionDetail session,
        AttendanceScheduleDetail schedule
) {
    public record AttendanceSessionDetail(
            boolean isOpen,
            String openedAt,
            String closeAt
    ) {
    }

    public record AttendanceScheduleDetail(
            String startTime,
            int durationMinutes,
            boolean enabled
    ) {
    }
}
