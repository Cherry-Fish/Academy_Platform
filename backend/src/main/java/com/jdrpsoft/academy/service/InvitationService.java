package com.jdrpsoft.academy.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jdrpsoft.academy.entity.InvitationCodeEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.entity.AcademyEntity;
import com.jdrpsoft.academy.repository.InvitationCodeRepository;
import com.jdrpsoft.academy.repository.UserRepository;
import com.jdrpsoft.academy.repository.AcademyRepository;

@Service
@Transactional
public class InvitationService {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;

    private final InvitationCodeRepository invitationCodeRepository;
    private final UserRepository userRepository;
    private final AcademyRepository academyRepository;

    public InvitationService(
            InvitationCodeRepository invitationCodeRepository,
            UserRepository userRepository,
            AcademyRepository academyRepository
    ) {
        this.invitationCodeRepository = invitationCodeRepository;
        this.userRepository = userRepository;
        this.academyRepository = academyRepository;
    }

    public InvitationCodeEntity generateCode(String role, String academyName, LocalDateTime expiresAt) {
        String code;
        do {
            code = generateRandomCode();
        } while (invitationCodeRepository.findByCode(code).isPresent());

        InvitationCodeEntity entity = new InvitationCodeEntity();
        entity.setCode(code);
        entity.setRole(role);
        entity.setAcademyName(academyName);
        entity.setExpiresAt(expiresAt);
        return invitationCodeRepository.save(entity);
    }

    public UserEntity useCode(String code, String username, String mattermostUserId, String displayName, String email) {
        InvitationCodeEntity invitation = invitationCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대코드입니다."));

        if (!"active".equals(invitation.getStatus())) {
            throw new IllegalStateException("이미 사용된 초대코드입니다.");
        }
        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("만료된 초대코드입니다.");
        }

        AcademyEntity academy = academyRepository.findByName(invitation.getAcademyName())
                .orElseGet(() -> academyRepository.save(new AcademyEntity(invitation.getAcademyName())));

        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByUsername(username).orElse(null));

        if (user == null) {
            user = new UserEntity();
            user.setEmail(email);
            user.setUsername(username);
        }
        user.setMattermostUserId(mattermostUserId);
        user.setName(displayName);
        user.setRole(invitation.getRole());
        user.setAcademy(academy);
        user.setStatus("active");
        userRepository.save(user);

        invitation.setStatus("used");
        invitation.setUsedAt(LocalDateTime.now());
        invitation.setUsedByUsername(username);
        invitationCodeRepository.save(invitation);

        return user;
    }

    public void revokeCode(String code) {
        InvitationCodeEntity invitation = invitationCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다."));
        invitation.setStatus("revoked");
        invitationCodeRepository.save(invitation);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listCodes() {
        return invitationCodeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(inv -> Map.<String, Object>of(
                        "code", inv.getCode(),
                        "role", inv.getRole(),
                        "academyName", inv.getAcademyName(),
                        "status", inv.getStatus(),
                        "createdAt", inv.getCreatedAt().toString(),
                        "expiresAt", inv.getExpiresAt() != null ? inv.getExpiresAt().toString() : "",
                        "usedByUsername", inv.getUsedByUsername() != null ? inv.getUsedByUsername() : ""
                ))
                .toList();
    }

    private String generateRandomCode() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
