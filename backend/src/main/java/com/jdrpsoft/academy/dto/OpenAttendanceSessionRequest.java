package com.jdrpsoft.academy.dto;

import jakarta.validation.constraints.Min;

public record OpenAttendanceSessionRequest(
        @Min(1) int durationMinutes
) {
}
