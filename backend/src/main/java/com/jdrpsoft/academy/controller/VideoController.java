package com.jdrpsoft.academy.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jdrpsoft.academy.service.LearningContentService;

@RestController
@RequestMapping("/api/videos")
public class VideoController {
    private final LearningContentService learningContentService;

    public VideoController(LearningContentService learningContentService) {
        this.learningContentService = learningContentService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getVideos() {
        return ResponseEntity.ok(learningContentService.getVideos());
    }

    @GetMapping("/{videoId}")
    public ResponseEntity<?> getVideoById(@PathVariable String videoId) {
        Map<String, Object> video = learningContentService.getVideoById(videoId);
        if (video == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(video);
    }

    @GetMapping("/watch-history")
    public ResponseEntity<Map<String, Object>> getMyWatchHistory(Principal principal) {
        return ResponseEntity.ok(learningContentService.getMyWatchHistory(principal.getName()));
    }

    @GetMapping("/watch-history/all")
    public ResponseEntity<List<Map<String, Object>>> getAllWatchHistory() {
        return ResponseEntity.ok(learningContentService.getAllWatchHistory());
    }

    @PostMapping("/{videoId}/progress")
    public ResponseEntity<Map<String, Object>> saveWatchProgress(
            @PathVariable String videoId,
            Principal principal,
            @RequestBody Map<String, Object> payload
    ) {
        int watchedTime = Integer.parseInt(String.valueOf(payload.getOrDefault("watchedTime", 0)));
        int totalTime = Integer.parseInt(String.valueOf(payload.getOrDefault("totalTime", 0)));
        return ResponseEntity.ok(learningContentService.saveWatchProgress(principal.getName(), videoId, watchedTime, totalTime));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createVideo(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(learningContentService.createVideo(payload));
    }

    @DeleteMapping("/{videoId}")
    public ResponseEntity<Void> deleteVideo(@PathVariable String videoId) {
        learningContentService.deleteVideo(videoId);
        return ResponseEntity.noContent().build();
    }
}
