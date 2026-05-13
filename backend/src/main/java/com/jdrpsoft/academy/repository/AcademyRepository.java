package com.jdrpsoft.academy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.AcademyEntity;

public interface AcademyRepository extends JpaRepository<AcademyEntity, Long> {
    Optional<AcademyEntity> findByName(String name);
}
