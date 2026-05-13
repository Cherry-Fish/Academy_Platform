package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface CourseRepository extends JpaRepository<CourseEntity, Long> {
    Optional<CourseEntity> findByCode(String code);
    List<CourseEntity> findByTeacher(UserEntity teacher);
}
