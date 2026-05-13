package com.jdrpsoft.academy.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdrpsoft.academy.entity.DeviceChangeRequestEntity;
import com.jdrpsoft.academy.entity.UserEntity;
import com.jdrpsoft.academy.repository.DeviceChangeRequestRepository;
import com.jdrpsoft.academy.repository.UserRepository;

@Service
public class DeviceRequestService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final DeviceChangeRequestRepository repository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public DeviceRequestService(
            DeviceChangeRequestRepository repository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> createRequest(String username, Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        Map<String, Object> deviceInfo = payload.get("deviceInfo") instanceof Map<?, ?> raw
                ? (Map<String, Object>) raw
                : Map.of();

        DeviceChangeRequestEntity entity = new DeviceChangeRequestEntity();
        entity.setUsername(username);
        entity.setStatus("pending");
        entity.setDeviceInfo(toJson(deviceInfo));
        return toMap(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingRequests() {
        return repository.findByStatusOrderByRequestedAtDesc("pending")
                .stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> approveRequest(String requestId) {
        return updateStatus(requestId, "approved");
    }

    @Transactional
    public Map<String, Object> rejectRequest(String requestId) {
        return updateStatus(requestId, "rejected");
    }

    private Map<String, Object> updateStatus(String requestId, String nextStatus) {
        long id;
        try {
            id = Long.parseLong(requestId);
        } catch (NumberFormatException e) {
            return Map.of("message", "request.not.found", "requestId", requestId);
        }
        return repository.findById(id).map(entity -> {
            entity.setStatus(nextStatus);
            entity.setProcessedAt(LocalDateTime.now());
            return toMap(repository.save(entity));
        }).orElseGet(() -> Map.of("message", "request.not.found", "requestId", requestId));
    }

    private Map<String, Object> toMap(DeviceChangeRequestEntity entity) {
        UserEntity user = userRepository.findByUsername(entity.getUsername()).orElse(null);
        String name = user != null ? user.getName() : entity.getUsername();
        String email = user != null ? user.getEmail() : "";
        String requestTime = entity.getRequestedAt() != null ? entity.getRequestedAt().format(FORMATTER) : null;

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(entity.getId()));
        map.put("username", entity.getUsername());
        map.put("studentId", entity.getUsername());
        map.put("studentName", name);
        map.put("email", email);
        map.put("status", entity.getStatus());
        map.put("requestTime", requestTime);
        map.put("requestedAt", requestTime);
        map.put("processedAt", entity.getProcessedAt() != null ? entity.getProcessedAt().format(FORMATTER) : null);
        map.put("currentDeviceInfo", fromJson(entity.getDeviceInfo()));
        map.put("deviceInfo", fromJson(entity.getDeviceInfo()));
        return map;
    }

    private String toJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
