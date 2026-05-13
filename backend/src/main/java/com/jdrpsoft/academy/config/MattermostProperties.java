package com.jdrpsoft.academy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mattermost")
public record MattermostProperties(
        String apiUrl,
        String adminToken
) {
    public String loginUrl() {
        return apiUrl + "/users/login";
    }
}
