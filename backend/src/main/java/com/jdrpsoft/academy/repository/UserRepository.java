package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.AcademyEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByMattermostUserId(String mattermostUserId);
    List<UserEntity> findByAcademy(AcademyEntity academy);
}
