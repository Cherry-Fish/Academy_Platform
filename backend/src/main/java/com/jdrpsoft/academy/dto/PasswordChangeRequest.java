package com.jdrpsoft.academy.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequest(
        @NotBlank String username,
        @NotBlank String currentPassword,
        @NotBlank String newPassword
) {
}
