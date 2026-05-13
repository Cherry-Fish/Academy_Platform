package com.jdrpsoft.academy.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
        @NotBlank String username,
        @NotBlank String displayName
) {
}
