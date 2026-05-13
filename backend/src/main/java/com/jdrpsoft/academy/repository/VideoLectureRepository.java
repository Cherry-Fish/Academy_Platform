package com.jdrpsoft.academy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.jdrpsoft.academy.entity.VideoLectureEntity;

public interface VideoLectureRepository extends JpaRepository<VideoLectureEntity, Long> {

    @Query("SELECT v FROM VideoLectureEntity v JOIN FETCH v.course ORDER BY v.createdAt DESC")
    List<VideoLectureEntity> findAllWithCourse();
}
