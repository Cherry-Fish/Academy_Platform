package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jdrpsoft.academy.entity.AssignmentEntity;

public interface AssignmentRepository extends JpaRepository<AssignmentEntity, Long> {

    @Query("SELECT a FROM AssignmentEntity a JOIN FETCH a.course ORDER BY a.dueAt ASC NULLS LAST")
    List<AssignmentEntity> findAllWithCourse();

    @Query("SELECT a FROM AssignmentEntity a JOIN FETCH a.course WHERE a.id = :id")
    Optional<AssignmentEntity> findByIdWithCourse(@Param("id") Long id);
}
