package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.dto.AttendanceRecordResponse;
import com.jdrpsoft.academy.service.AttendanceService;
import com.jdrpsoft.academy.service.DeviceRequestService;
import com.jdrpsoft.academy.service.UserDirectoryService;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {
    private final AttendanceService attendanceService;
    private final DeviceRequestService deviceRequestService;
    private final UserDirectoryService userDirectoryService;

    public TeacherController(
            AttendanceService attendanceService,
            DeviceRequestService deviceRequestService,
            UserDirectoryService userDirectoryService
    ) {
        this.attendanceService = attendanceService;
        this.deviceRequestService = deviceRequestService;
        this.userDirectoryService = userDirectoryService;
    }

    @GetMapping("/pending-requests")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests() {
        return ResponseEntity.ok(deviceRequestService.getPendingRequests());
    }

    @PostMapping("/approve/{requestId}")
    public ResponseEntity<?> approveRequest(@PathVariable String requestId) {
        return ResponseEntity.ok(Map.of(
                "message", "승인되었습니다.",
                "request", deviceRequestService.approveRequest(requestId)
        ));
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectRequest(@PathVariable String requestId) {
        return ResponseEntity.ok(Map.of(
                "message", "거절되었습니다.",
                "request", deviceRequestService.rejectRequest(requestId)
        ));
    }

    @GetMapping("/attendance-records")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendanceRecords() {
        return ResponseEntity.ok(attendanceService.getTodayAttendance());
    }

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getStudents(Principal principal) {
        return ResponseEntity.ok(userDirectoryService.getStudentsForTeacher(principal.getName()));
    }
}
