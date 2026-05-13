package com.jdrpsoft.academy.model;

import java.util.List;

public record UserProfile(
        String mattermostUserId,
        String username,
        String displayName,
        String email,
        UserRole role,
        boolean registered,
        String academyName,
        List<UserCourse> courses,
        List<UserSchedule> schedules
) {
}
