package com.jdrpsoft.academy.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.InvitationCodeEntity;

public interface InvitationCodeRepository extends JpaRepository<InvitationCodeEntity, Long> {
    Optional<InvitationCodeEntity> findByCode(String code);
    List<InvitationCodeEntity> findAllByOrderByCreatedAtDesc();
}
