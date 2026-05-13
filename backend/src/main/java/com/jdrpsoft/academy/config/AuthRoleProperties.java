package com.jdrpsoft.academy.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "academy.auth")
public record AuthRoleProperties(
        List<BootstrapUser> users
) {
    public record BootstrapUser(
            String username,
            String role,
            String name,
            String email,
            String academyName,
            List<BootstrapCourse> courses,
            List<BootstrapSchedule> schedules
    ) {
    }

    public record BootstrapCourse(
            String courseId,
            String courseName
    ) {
    }

    public record BootstrapSchedule(
            String courseId,
            String courseName,
            String dayOfWeek,
            String startTime,
            String endTime,
            String classType
    ) {
    }
}
