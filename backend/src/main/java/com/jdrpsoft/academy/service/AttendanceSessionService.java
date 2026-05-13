package com.jdrpsoft.academy.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import com.jdrpsoft.academy.dto.AttendanceScheduleRequest;
import com.jdrpsoft.academy.dto.AttendanceSessionResponse;

@Service
public class AttendanceSessionService {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private volatile AttendanceSessionState sessionState = new AttendanceSessionState(false, null, null);
    private volatile AttendanceScheduleState scheduleState = new AttendanceScheduleState("", 10, false);

    public AttendanceSessionResponse getCurrentState() {
        AttendanceSessionState currentSession = sessionState;
        if (currentSession.isOpen() && currentSession.closeAt() != null && currentSession.closeAt().isBefore(LocalDateTime.now())) {
            sessionState = new AttendanceSessionState(false, currentSession.openedAt(), currentSession.closeAt());
            currentSession = sessionState;
        }

        return new AttendanceSessionResponse(
                new AttendanceSessionResponse.AttendanceSessionDetail(
                        currentSession.isOpen(),
                        format(currentSession.openedAt()),
                        format(currentSession.closeAt())
                ),
                new AttendanceSessionResponse.AttendanceScheduleDetail(
                        scheduleState.startTime(),
                        scheduleState.durationMinutes(),
                        scheduleState.enabled()
                )
        );
    }

    public AttendanceSessionResponse saveSchedule(AttendanceScheduleRequest request) {
        scheduleState = new AttendanceScheduleState(
                request.startTime() == null ? "" : request.startTime(),
                request.durationMinutes(),
                Boolean.TRUE.equals(request.enabled())
        );
        return getCurrentState();
    }

    public AttendanceSessionResponse openSession(int durationMinutes) {
        LocalDateTime openedAt = LocalDateTime.now();
        sessionState = new AttendanceSessionState(true, openedAt, openedAt.plusMinutes(durationMinutes));
        return getCurrentState();
    }

    public AttendanceSessionResponse closeSession() {
        AttendanceSessionState current = sessionState;
        sessionState = new AttendanceSessionState(false, current.openedAt(), LocalDateTime.now());
        return getCurrentState();
    }

    private String format(LocalDateTime value) {
        return value == null ? null : value.format(FORMATTER);
    }

    private record AttendanceSessionState(
            boolean isOpen,
            LocalDateTime openedAt,
            LocalDateTime closeAt
    ) {
    }

    private record AttendanceScheduleState(
            String startTime,
            int durationMinutes,
            boolean enabled
    ) {
    }
}
