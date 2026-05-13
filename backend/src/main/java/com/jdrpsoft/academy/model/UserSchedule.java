package com.jdrpsoft.academy.model;

public record UserSchedule(
        String courseId,
        String courseName,
        String dayOfWeek,
        String startTime,
        String endTime,
        String classType
) {
}
