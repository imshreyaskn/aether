package com.example.aether.controller;

import com.example.aether.dto.HabitRequest;
import com.example.aether.dto.HabitResponse;
import com.example.aether.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getAllHabits() {
        return ResponseEntity.ok(habitService.getAllHabits());
    }

    @GetMapping("/active")
    public ResponseEntity<List<HabitResponse>> getActiveHabits() {
        return ResponseEntity.ok(habitService.getActiveHabits());
    }

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.createHabit(request));
    }

    /** Edit habit name, description, or color */
    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable Long id,
            @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.updateHabit(id, request));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<HabitResponse> toggleHabitLog(@PathVariable Long id) {
        return ResponseEntity.ok(habitService.toggleHabitLog(id));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<HabitResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(habitService.toggleActive(id));
    }

    /** Soft delete — logs are preserved for historical tracking */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long id) {
        habitService.deleteHabit(id);
        return ResponseEntity.noContent().build();
    }
}
