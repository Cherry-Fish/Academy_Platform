package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.dto.AttendanceRecordResponse;
import com.jdrpsoft.academy.dto.AttendanceScheduleRequest;
import com.jdrpsoft.academy.dto.AttendanceSessionResponse;
import com.jdrpsoft.academy.dto.OpenAttendanceSessionRequest;
import com.jdrpsoft.academy.service.AttendanceService;
import com.jdrpsoft.academy.service.AttendanceSessionService;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final AttendanceSessionService attendanceSessionService;

    public AttendanceController(
            AttendanceService attendanceService,
            AttendanceSessionService attendanceSessionService
    ) {
        this.attendanceService = attendanceService;
        this.attendanceSessionService = attendanceSessionService;
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(Principal principal) {
        AttendanceRecordResponse record = attendanceService.checkIn(principal.getName());
        return ResponseEntity.ok(Map.of(
                "message", "출석 체크가 완료되었습니다.",
                "record", record
        ));
    }

    @GetMapping("/today")
    public ResponseEntity<List<AttendanceRecordResponse>> getTodayAttendance() {
        return ResponseEntity.ok(attendanceService.getTodayAttendance());
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendanceHistory(
            Principal principal,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        java.time.LocalDate now = java.time.LocalDate.now();
        int y = year != null ? year : now.getYear();
        int m = month != null ? month : now.getMonthValue();
        return ResponseEntity.ok(attendanceService.getMonthlyAttendance(principal.getName(), y, m));
    }

    @GetMapping("/session")
    public ResponseEntity<AttendanceSessionResponse> getCurrentSession() {
        return ResponseEntity.ok(attendanceSessionService.getCurrentState());
    }

    @PostMapping("/session/schedule")
    public ResponseEntity<AttendanceSessionResponse> saveSchedule(@Valid @RequestBody AttendanceScheduleRequest request) {
        return ResponseEntity.ok(attendanceSessionService.saveSchedule(request));
    }

    @PostMapping("/session/open")
    public ResponseEntity<AttendanceSessionResponse> openSession(@Valid @RequestBody OpenAttendanceSessionRequest request) {
        return ResponseEntity.ok(attendanceSessionService.openSession(request.durationMinutes()));
    }

    @DeleteMapping("/session")
    public ResponseEntity<AttendanceSessionResponse> closeSession() {
        return ResponseEntity.ok(attendanceSessionService.closeSession());
    }
}
