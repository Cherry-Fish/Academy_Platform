package com.jdrpsoft.academy.service;

import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.jdrpsoft.academy.config.MattermostProperties;

@Service
public class MattermostAuthService {
    private final MattermostProperties mattermostProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MattermostAuthService(MattermostProperties mattermostProperties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.mattermostProperties = mattermostProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<String> login(String username, String password) {
        Map<String, String> loginRequest = Map.of(
                "login_id", username,
                "password", password
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(loginRequest, headers);

        try {
            return restTemplate.exchange(
                    mattermostProperties.loginUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );
        } catch (HttpClientErrorException.Unauthorized exception) {
            return ResponseEntity.status(401).body("invalid.login.credentials");
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body("mattermost.http.error");
        } catch (Exception exception) {
            return ResponseEntity.status(500).body("mattermost.connection.failed");
        }
    }

    public ResponseEntity<String> changePassword(String username, String currentPassword, String newPassword) {
        ResponseEntity<String> loginResponse = login(username, currentPassword);

        if (!loginResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(loginResponse.getStatusCode()).body("current.password.invalid");
        }

        String mattermostToken = loginResponse.getHeaders().getFirst("Token");
        if (mattermostToken == null || mattermostToken.isBlank()) {
            return ResponseEntity.status(401).body("mattermost.token.missing");
        }

        String mattermostUserId = extractUserId(loginResponse.getBody());
        if (mattermostUserId == null || mattermostUserId.isBlank()) {
            return ResponseEntity.status(400).body("mattermost.user.id.missing");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(mattermostToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(
                Map.of(
                        "current_password", currentPassword,
                        "new_password", newPassword
                ),
                headers
        );

        try {
            return restTemplate.exchange(
                    mattermostProperties.apiUrl() + "/users/" + mattermostUserId + "/password",
                    HttpMethod.PUT,
                    entity,
                    String.class
            );
        } catch (HttpClientErrorException.Unauthorized exception) {
            return ResponseEntity.status(401).body("current.password.invalid");
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(extractMattermostMessage(exception));
        } catch (Exception exception) {
            return ResponseEntity.status(500).body("password.change.connection.failed");
        }
    }

    private String extractMattermostMessage(HttpStatusCodeException exception) {
        String body = exception.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return "password.change.failed";
        }

        try {
            Map<String, Object> response = objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {
            });
            Object message = response.get("message");
            if (message != null && !String.valueOf(message).isBlank()) {
                return String.valueOf(message);
            }
        } catch (Exception ignored) {
            // Fallback to raw body below.
        }

        return body;
    }

    public String createUser(String username, String email, String password, String name) {
        String adminToken = mattermostProperties.adminToken();
        if (adminToken == null || adminToken.isBlank()) {
            throw new IllegalStateException("mattermost.admin.token.not.configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, String> body = Map.of(
                "username", username,
                "email", email,
                "password", password,
                "first_name", name
        );

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    mattermostProperties.apiUrl() + "/users",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );
            return extractUserId(response.getBody());
        } catch (HttpClientErrorException e) {
            String msg = extractMattermostMessage(e);
            throw new IllegalArgumentException("mattermost.create.user.failed: " + msg);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("mattermost.connection.failed");
        }
    }

    private String extractUserId(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }

        try {
            Map<String, Object> response = objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {
            });
            Object id = response.get("id");
            return id == null ? null : String.valueOf(id);
        } catch (Exception ignored) {
            return null;
        }
    }
}
