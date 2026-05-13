package com.jdrpsoft.academy.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "offline_class_applications")
public class OfflineClassApplicationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offline_class_id", nullable = false)
    private OfflineClassEntity offlineClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", nullable = false)
    private UserEntity student;

    @Column(nullable = false)
    private String status = "applied";

    private LocalDateTime appliedAt;

    public OfflineClassApplicationEntity() {}

    @PrePersist
    void prePersist() {
        if (appliedAt == null) appliedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public OfflineClassEntity getOfflineClass() { return offlineClass; }
    public void setOfflineClass(OfflineClassEntity offlineClass) { this.offlineClass = offlineClass; }
    public UserEntity getStudent() { return student; }
    public void setStudent(UserEntity student) { this.student = student; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
}
