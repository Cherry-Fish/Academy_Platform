package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jdrpsoft.academy.entity.AssignmentEntity;
import com.jdrpsoft.academy.entity.AssignmentSubmissionEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmissionEntity, Long> {

    @Query("SELECT s FROM AssignmentSubmissionEntity s JOIN FETCH s.assignment JOIN FETCH s.student " +
           "WHERE s.student = :student ORDER BY s.submittedAt DESC")
    List<AssignmentSubmissionEntity> findByStudentWithDetails(@Param("student") UserEntity student);

    Optional<AssignmentSubmissionEntity> findByStudentAndAssignment(UserEntity student, AssignmentEntity assignment);

    @Query("SELECT s FROM AssignmentSubmissionEntity s JOIN FETCH s.student " +
           "WHERE s.assignment = :assignment ORDER BY s.submittedAt DESC")
    List<AssignmentSubmissionEntity> findByAssignmentWithStudent(@Param("assignment") AssignmentEntity assignment);

    @Query("SELECT s FROM AssignmentSubmissionEntity s JOIN FETCH s.assignment JOIN FETCH s.student " +
           "ORDER BY s.submittedAt DESC")
    List<AssignmentSubmissionEntity> findAllWithDetails();

    void deleteByStudent(UserEntity student);
    void deleteByAssignment(AssignmentEntity assignment);
}
