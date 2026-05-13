package com.jdrpsoft.academy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jdrpsoft.academy.entity.OfflineClassEntity;

public interface OfflineClassRepository extends JpaRepository<OfflineClassEntity, Long> {

    @Query("SELECT o FROM OfflineClassEntity o JOIN FETCH o.course " +
           "WHERE EXTRACT(YEAR FROM o.classDate) = :year " +
           "AND EXTRACT(MONTH FROM o.classDate) = :month " +
           "ORDER BY o.classDate ASC, o.startTime ASC")
    List<OfflineClassEntity> findByYearAndMonth(@Param("year") int year, @Param("month") int month);
}
