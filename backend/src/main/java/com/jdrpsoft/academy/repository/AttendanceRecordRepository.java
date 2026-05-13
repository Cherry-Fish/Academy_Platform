package com.jdrpsoft.academy.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jdrpsoft.academy.entity.AttendanceRecordEntity;
import com.jdrpsoft.academy.entity.UserEntity;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecordEntity, Long> {

    Optional<AttendanceRecordEntity> findByStudentAndAttendanceDateAndCourseIdIsNull(
            UserEntity student, LocalDate attendanceDate);

    @Query("SELECT a FROM AttendanceRecordEntity a JOIN FETCH a.student " +
           "WHERE a.attendanceDate = :date AND a.courseId IS NULL " +
           "ORDER BY a.checkInAt ASC")
    List<AttendanceRecordEntity> findTodayRecords(@Param("date") LocalDate date);

    List<AttendanceRecordEntity> findByStudentAndAttendanceDateBetweenAndCourseIdIsNullOrderByAttendanceDateAsc(
            UserEntity student, LocalDate start, LocalDate end);

    void deleteByStudent(UserEntity student);
}
