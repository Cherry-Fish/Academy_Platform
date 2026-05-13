package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jdrpsoft.academy.entity.OfflineClassApplicationEntity;
import com.jdrpsoft.academy.entity.OfflineClassEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface OfflineClassApplicationRepository extends JpaRepository<OfflineClassApplicationEntity, Long> {

    @Query("SELECT a FROM OfflineClassApplicationEntity a JOIN FETCH a.offlineClass JOIN FETCH a.student " +
           "WHERE a.student = :student ORDER BY a.appliedAt DESC")
    List<OfflineClassApplicationEntity> findByStudentWithDetails(@Param("student") UserEntity student);

    Optional<OfflineClassApplicationEntity> findByStudentAndOfflineClass(UserEntity student, OfflineClassEntity offlineClass);

    long countByOfflineClass(OfflineClassEntity offlineClass);

    @Query("SELECT a FROM OfflineClassApplicationEntity a JOIN FETCH a.offlineClass JOIN FETCH a.student " +
           "ORDER BY a.appliedAt DESC")
    List<OfflineClassApplicationEntity> findAllWithDetails();

    void deleteByStudent(UserEntity student);
}
