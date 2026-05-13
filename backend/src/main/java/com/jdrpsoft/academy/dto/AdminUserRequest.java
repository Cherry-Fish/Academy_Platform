package com.jdrpsoft.academy.dto;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminUserRequest(
        @NotBlank String username,
        @NotBlank String role,
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank String academyName,
        String password,
        List<AdminCourseRequest> courses
) {
    public record AdminCourseRequest(
            @NotBlank String courseId,
            @NotBlank String courseName
    ) {
    }
}
