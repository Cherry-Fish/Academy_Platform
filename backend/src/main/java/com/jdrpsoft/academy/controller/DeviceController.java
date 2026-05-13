package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.service.DeviceRequestService;

@RestController
@RequestMapping("/api/device")
public class DeviceController {
    private final DeviceRequestService deviceRequestService;

    public DeviceController(DeviceRequestService deviceRequestService) {
        this.deviceRequestService = deviceRequestService;
    }

    @PostMapping("/change-request")
    public ResponseEntity<?> requestDeviceChange(
            Principal principal,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Map<String, Object> request = deviceRequestService.createRequest(
                principal.getName(),
                payload == null ? Map.of() : payload
        );
        return ResponseEntity.ok(Map.of(
                "message", "기기 변경 요청이 접수되었습니다.",
                "request", request
        ));
    }
}
