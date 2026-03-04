package com.example.aether.controller;

import com.example.aether.dto.ProgressSummary;
import com.example.aether.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/summary")
    public ResponseEntity<ProgressSummary> getProgressSummary(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(progressService.getProgressSummary(days));
    }
}
