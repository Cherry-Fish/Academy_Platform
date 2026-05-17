package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.service.LearningContentService;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
    private final LearningContentService learningContentService;

    public AssignmentController(LearningContentService learningContentService) {
        this.learningContentService = learningContentService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAssignments() {
        return ResponseEntity.ok(learningContentService.getAssignments());
    }

    @GetMapping("/{assignmentId}")
    public ResponseEntity<?> getAssignmentById(@PathVariable String assignmentId) {
        Map<String, Object> assignment = learningContentService.getAssignmentById(assignmentId);
        if (assignment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/submissions/me")
    public ResponseEntity<List<Map<String, Object>>> getMySubmissions(Principal principal) {
        return ResponseEntity.ok(learningContentService.getMySubmissions(principal.getName()));
    }

    @GetMapping("/{assignmentId}/submission/me")
    public ResponseEntity<?> getMySubmission(
            @PathVariable String assignmentId,
            Principal principal
    ) {
        Map<String, Object> submission = learningContentService.getMySubmission(principal.getName(), assignmentId);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<Map<String, Object>>> getAllSubmissions(@RequestParam(required = false) String assignmentId) {
        return ResponseEntity.ok(learningContentService.getAllSubmissions(assignmentId));
    }

    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<Map<String, Object>> submitAssignment(
            @PathVariable String assignmentId,
            Authentication authentication,
            @RequestBody Map<String, Object> payload
    ) {
        String username = authentication.getName();
        String mattermostUserId = authentication.getDetails() instanceof String s ? s : null;
        return ResponseEntity.ok(learningContentService.submitAssignment(
                username,
                mattermostUserId,
                assignmentId,
                String.valueOf(payload.getOrDefault("content", ""))
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAssignment(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(learningContentService.createAssignment(payload));
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String assignmentId) {
        learningContentService.deleteAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<Map<String, Object>> gradeSubmission(
            @PathVariable String submissionId,
            @RequestBody Map<String, Object> payload
    ) {
        Integer score = payload.get("score") == null ? null : Integer.parseInt(String.valueOf(payload.get("score")));
        String feedback = String.valueOf(payload.getOrDefault("feedback", ""));
        return ResponseEntity.ok(learningContentService.gradeSubmission(submissionId, score, feedback));
    }
}
