package com.jdrpsoft.academy.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "video_progress")
public class VideoProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_lecture_id", nullable = false)
    private VideoLectureEntity videoLecture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", nullable = false)
    private UserEntity student;

    private Integer watchedSeconds = 0;
    private Boolean completed = false;
    private LocalDateTime updatedAt;

    public VideoProgressEntity() {}

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public VideoLectureEntity getVideoLecture() { return videoLecture; }
    public void setVideoLecture(VideoLectureEntity videoLecture) { this.videoLecture = videoLecture; }
    public UserEntity getStudent() { return student; }
    public void setStudent(UserEntity student) { this.student = student; }
    public Integer getWatchedSeconds() { return watchedSeconds; }
    public void setWatchedSeconds(Integer watchedSeconds) { this.watchedSeconds = watchedSeconds; }
    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
