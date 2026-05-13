package com.jdrpsoft.academy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.EnrollmentEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface EnrollmentRepository extends JpaRepository<EnrollmentEntity, Long> {
    List<EnrollmentEntity> findByStudentAndEnrollmentStatus(UserEntity student, String enrollmentStatus);
    List<EnrollmentEntity> findByCourse(CourseEntity course);
    boolean existsByStudentAndCourse(UserEntity student, CourseEntity course);
    void deleteByStudent(UserEntity student);
}
