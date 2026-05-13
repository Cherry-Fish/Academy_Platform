package com.jdrpsoft.academy.dto;

import java.util.List;

import com.jdrpsoft.academy.model.UserCourse;
import com.jdrpsoft.academy.model.UserSchedule;

public record LoginResponse(
        String message,
        String username,
        String displayName,
        String email,
        String userType,
        String academyName,
        List<UserCourse> courses,
        List<UserSchedule> schedules,
        String mattermostUserId,
        boolean registered,
        String token,
        String mattermostToken
) {
}
