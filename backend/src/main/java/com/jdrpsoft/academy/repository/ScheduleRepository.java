package com.jdrpsoft.academy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.CourseEntity;
import com.jdrpsoft.academy.entity.ScheduleEntity;

public interface ScheduleRepository extends JpaRepository<ScheduleEntity, Long> {
    List<ScheduleEntity> findByCourse(CourseEntity course);
    boolean existsByCourseAndDayOfWeek(CourseEntity course, String dayOfWeek);
}
