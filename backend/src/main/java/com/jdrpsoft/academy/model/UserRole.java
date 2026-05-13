package com.jdrpsoft.academy.model;

import java.util.Locale;

public enum UserRole {
    STUDENT,
    TEACHER,
    ADMIN;

    public String toClientValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static UserRole fromConfig(String value) {
        if (value == null || value.isBlank()) {
            return STUDENT;
        }

        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "admin" -> ADMIN;
            case "teacher" -> TEACHER;
            default -> STUDENT;
        };
    }
}
