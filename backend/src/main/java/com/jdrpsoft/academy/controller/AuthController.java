package com.jdrpsoft.academy.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.dto.LoginRequest;
import com.jdrpsoft.academy.dto.LoginResponse;
import com.jdrpsoft.academy.dto.PasswordChangeRequest;
import com.jdrpsoft.academy.dto.ProfileUpdateRequest;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.service.InvitationService;
import com.jdrpsoft.academy.service.JwtService;
import com.jdrpsoft.academy.service.MattermostAuthService;
import com.jdrpsoft.academy.service.UserDirectoryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final MattermostAuthService mattermostAuthService;
    private final JwtService jwtService;
    private final UserDirectoryService userDirectoryService;
    private final InvitationService invitationService;
    private final ObjectMapper objectMapper;

    public AuthController(
            MattermostAuthService mattermostAuthService,
            JwtService jwtService,
            UserDirectoryService userDirectoryService,
            InvitationService invitationService,
            ObjectMapper objectMapper
    ) {
        this.mattermostAuthService = mattermostAuthService;
        this.jwtService = jwtService;
        this.userDirectoryService = userDirectoryService;
        this.invitationService = invitationService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        ResponseEntity<String> mattermostResponse = mattermostAuthService.login(request.username(), request.password());

        if (!mattermostResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(mattermostResponse.getStatusCode()).body(
                    Map.of("message", mattermostResponse.getBody())
            );
        }

        String mattermostToken = mattermostResponse.getHeaders().getFirst("Token");
        if (mattermostToken == null || mattermostToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "mattermost.token.missing"));
        }

        try {
            Map<String, Object> userInfo = objectMapper.readValue(
                    mattermostResponse.getBody(),
                    new TypeReference<LinkedHashMap<String, Object>>() {
                    }
            );

            String mattermostUserId = String.valueOf(userInfo.getOrDefault("id", ""));
            String username = String.valueOf(userInfo.getOrDefault("username", request.username()));
            String firstName = String.valueOf(userInfo.getOrDefault("first_name", ""));
            String lastName = String.valueOf(userInfo.getOrDefault("last_name", ""));
            String displayName = (lastName + firstName).trim();
            if (displayName.isBlank()) {
                displayName = String.valueOf(userInfo.getOrDefault("nickname", username));
            }
            String email = String.valueOf(userInfo.getOrDefault("email", ""));

            var userProfile = userDirectoryService.resolveProfile(
                    mattermostUserId,
                    username,
                    displayName,
                    email
            );

            if (!userProfile.registered()) {
                return ResponseEntity.status(403).body(Map.of(
                        "message", "academy.user.not.registered"
                ));
            }

            String userType = userProfile.role().toClientValue();
            String jwtToken = jwtService.createToken(username, mattermostUserId, userType);

            return ResponseEntity.ok(new LoginResponse(
                    "로그인 성공",
                    username,
                    userProfile.displayName(),
                    userProfile.email(),
                    userType,
                    userProfile.academyName(),
                    userProfile.courses(),
                    userProfile.schedules(),
                    mattermostUserId,
                    userProfile.registered(),
                    jwtToken,
                    mattermostToken
            ));
        } catch (Exception exception) {
            return ResponseEntity.status(500).body(Map.of("message", "mattermost.response.parse.failed"));
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        ResponseEntity<String> response = mattermostAuthService.changePassword(
                request.username(),
                request.currentPassword(),
                request.newPassword()
        );

        if (response.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        }

        return ResponseEntity.status(response.getStatusCode()).body(
                Map.of("message", response.getBody())
        );
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinWithInvitation(@RequestBody Map<String, Object> body) {
        String username = String.valueOf(body.get("username"));
        String password = String.valueOf(body.get("password"));
        String invitationCode = String.valueOf(body.get("invitationCode"));

        ResponseEntity<String> mattermostResponse = mattermostAuthService.login(username, password);
        if (!mattermostResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(mattermostResponse.getStatusCode())
                    .body(Map.of("message", mattermostResponse.getBody()));
        }

        String mattermostToken = mattermostResponse.getHeaders().getFirst("Token");
        if (mattermostToken == null || mattermostToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "mattermost.token.missing"));
        }

        try {
            Map<String, Object> userInfo = objectMapper.readValue(
                    mattermostResponse.getBody(),
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.LinkedHashMap<String, Object>>() {});

            String mattermostUserId = String.valueOf(userInfo.getOrDefault("id", ""));
            String firstName = String.valueOf(userInfo.getOrDefault("first_name", ""));
            String lastName = String.valueOf(userInfo.getOrDefault("last_name", ""));
            String displayName = (lastName + firstName).trim();
            if (displayName.isBlank()) displayName = String.valueOf(userInfo.getOrDefault("nickname", username));
            String email = String.valueOf(userInfo.getOrDefault("email", ""));

            UserEntity user = invitationService.useCode(invitationCode, username, mattermostUserId, displayName, email);

            String jwtToken = jwtService.createToken(username, mattermostUserId, user.getRole());
            var profile = userDirectoryService.resolveProfile(mattermostUserId, username, displayName, email);

            return ResponseEntity.ok(new LoginResponse(
                    "가입이 완료되었습니다.",
                    username, profile.displayName(), profile.email(),
                    profile.role().toClientValue(), profile.academyName(),
                    profile.courses(), profile.schedules(),
                    mattermostUserId, true, jwtToken, mattermostToken
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "join.failed"));
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        var profile = userDirectoryService.updateProfile(
                request.username(),
                request.displayName(),
                ""
        );

        return ResponseEntity.ok(Map.of(
                "message", "프로필이 저장되었습니다.",
                "username", profile.username(),
                "displayName", profile.displayName(),
                "email", profile.email(),
                "userType", profile.role().toClientValue()
        ));
    }
}
