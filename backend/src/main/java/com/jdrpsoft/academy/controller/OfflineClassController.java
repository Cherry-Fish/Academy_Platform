package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.service.LearningContentService;

@RestController
@RequestMapping("/api/offline-classes")
public class OfflineClassController {
    private final LearningContentService learningContentService;

    public OfflineClassController(LearningContentService learningContentService) {
        this.learningContentService = learningContentService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getOfflineClasses(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return ResponseEntity.ok(learningContentService.getOfflineClasses(year, month));
    }

    @GetMapping("/applications/me")
    public ResponseEntity<List<Map<String, Object>>> getMyApplications(Principal principal) {
        return ResponseEntity.ok(learningContentService.getMyOfflineClassApplications(principal.getName()));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Map<String, Object>>> getAllApplications() {
        return ResponseEntity.ok(learningContentService.getAllOfflineClassApplications());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOfflineClass(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(learningContentService.createOfflineClass(payload));
    }

    @PutMapping("/{offlineClassId}")
    public ResponseEntity<Map<String, Object>> updateOfflineClass(
            @PathVariable String offlineClassId,
            @RequestBody Map<String, Object> payload
    ) {
        return ResponseEntity.ok(learningContentService.updateOfflineClass(offlineClassId, payload));
    }

    @PostMapping("/{offlineClassId}/apply")
    public ResponseEntity<Map<String, Object>> applyOfflineClass(
            @PathVariable String offlineClassId,
            Principal principal
    ) {
        return ResponseEntity.ok(learningContentService.applyOfflineClass(principal.getName(), offlineClassId));
    }

    @DeleteMapping("/{offlineClassId}")
    public ResponseEntity<Void> deleteOfflineClass(@PathVariable String offlineClassId) {
        learningContentService.deleteOfflineClass(offlineClassId);
        return ResponseEntity.noContent().build();
    }
}
