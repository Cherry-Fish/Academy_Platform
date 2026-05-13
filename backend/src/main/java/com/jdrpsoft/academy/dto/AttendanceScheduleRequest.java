package com.jdrpsoft.academy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AttendanceScheduleRequest(
        String startTime,
        @Min(1) int durationMinutes,
        @NotNull Boolean enabled
) {
}
