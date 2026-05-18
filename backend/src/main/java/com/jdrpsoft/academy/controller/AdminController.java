package com.jdrpsoft.academy.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

import com.jdrpsoft.academy.dto.AdminUserRequest;
import com.jdrpsoft.academy.entity.InvitationCodeEntity;
import com.jdrpsoft.academy.model.UserProfile;
import com.jdrpsoft.academy.service.InvitationService;
import com.jdrpsoft.academy.service.MattermostAuthService;
import com.jdrpsoft.academy.service.UserDirectoryService;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserDirectoryService userDirectoryService;
    private final InvitationService invitationService;
    private final MattermostAuthService mattermostAuthService;

    public AdminController(UserDirectoryService userDirectoryService, InvitationService invitationService, MattermostAuthService mattermostAuthService) {
        this.userDirectoryService = userDirectoryService;
        this.invitationService = invitationService;
        this.mattermostAuthService = mattermostAuthService;
    }

    @GetMapping("/invitations")
    public ResponseEntity<?> listInvitations() {
        return ResponseEntity.ok(invitationService.listCodes());
    }

    @PostMapping("/invitations")
    public ResponseEntity<?> createInvitation(@RequestBody Map<String, Object> body) {
        String role = String.valueOf(body.getOrDefault("role", "student"));
        String academyName = String.valueOf(body.getOrDefault("academyName", "민트학원"));
        String expiresAtStr = body.get("expiresAt") != null ? String.valueOf(body.get("expiresAt")) : null;
        LocalDateTime expiresAt = (expiresAtStr != null && !expiresAtStr.isBlank())
                ? LocalDateTime.parse(expiresAtStr) : null;
        InvitationCodeEntity code = invitationService.generateCode(role, academyName, expiresAt);
        return ResponseEntity.ok(Map.of("code", code.getCode(), "role", code.getRole(), "message", "초대코드가 생성되었습니다."));
    }

    @DeleteMapping("/invitations/{code}")
    public ResponseEntity<?> revokeInvitation(@PathVariable String code) {
        invitationService.revokeCode(code);
        return ResponseEntity.ok(Map.of("message", "초대코드가 취소되었습니다."));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserProfile>> getUsers() {
        return ResponseEntity.ok(userDirectoryService.listRegisteredUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody AdminUserRequest request) {
        try {
            if (request.password() != null && !request.password().isBlank()) {
                mattermostAuthService.createUser(
                        request.username(), request.email(), request.password(), request.name()
                );
            }
            UserProfile created = userDirectoryService.registerUser(request);
            return ResponseEntity.ok(Map.of("message", "사용자가 등록되었습니다.", "user", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, @Valid @RequestBody AdminUserRequest request) {
        UserProfile updated = userDirectoryService.updateUser(username, request);
        return ResponseEntity.ok(Map.of("message", "수정되었습니다.", "user", updated));
    }

    @DeleteMapping("/users/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        userDirectoryService.deleteUser(username);
        return ResponseEntity.ok(Map.of("message", "사용자가 삭제되었습니다."));
    }
}
