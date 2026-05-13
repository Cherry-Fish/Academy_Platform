package com.jdrpsoft.academy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jdrpsoft.academy.entity.DeviceChangeRequestEntity;

public interface DeviceChangeRequestRepository extends JpaRepository<DeviceChangeRequestEntity, Long> {

    List<DeviceChangeRequestEntity> findByStatusOrderByRequestedAtDesc(String status);

    void deleteByUsername(String username);
}
