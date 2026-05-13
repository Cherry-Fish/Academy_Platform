package com.jdrpsoft.academy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.entity.VideoLectureEntity;
import com.jdrpsoft.academy.entity.VideoProgressEntity;

public interface VideoProgressRepository extends JpaRepository<VideoProgressEntity, Long> {

    List<VideoProgressEntity> findByStudent(UserEntity student);

    Optional<VideoProgressEntity> findByStudentAndVideoLecture(UserEntity student, VideoLectureEntity videoLecture);

    void deleteByStudent(UserEntity student);

    @Query("SELECT p FROM VideoProgressEntity p JOIN FETCH p.videoLecture JOIN FETCH p.student")
    List<VideoProgressEntity> findAllWithDetails();
}
