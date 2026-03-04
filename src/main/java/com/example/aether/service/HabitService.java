package com.example.aether.service;

import com.example.aether.dto.HabitRequest;
import com.example.aether.dto.HabitResponse;
import com.example.aether.entity.Habit;
import com.example.aether.entity.HabitLog;
import com.example.aether.repository.HabitLogRepository;
import com.example.aether.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    /** All habits that are NOT soft-deleted — for the daily checklist. */
    public List<HabitResponse> getAllHabits() {
        LocalDate today = LocalDate.now();
        return habitRepository.findByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream().map(h -> toResponse(h, today)).collect(Collectors.toList());
    }

    /** Only active (active=true AND not soft-deleted) habits. */
    public List<HabitResponse> getActiveHabits() {
        LocalDate today = LocalDate.now();
        return habitRepository.findByActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc()
                .stream().map(h -> toResponse(h, today)).collect(Collectors.toList());
    }

    @Transactional
    public HabitResponse createHabit(HabitRequest request) {
        Habit habit = Habit.builder()
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor() != null ? request.getColor() : "#8B5CF6")
                .active(true)
                .build();
        habit = habitRepository.save(habit);
        return toResponse(habit, LocalDate.now());
    }

    @Transactional
    public HabitResponse updateHabit(Long habitId, HabitRequest request) {
        Habit habit = getActiveHabitById(habitId);
        if (request.getName() != null && !request.getName().isBlank()) {
            habit.setName(request.getName());
        }
        if (request.getDescription() != null) {
            habit.setDescription(request.getDescription());
        }
        if (request.getColor() != null && !request.getColor().isBlank()) {
            habit.setColor(request.getColor());
        }
        habit = habitRepository.save(habit);
        return toResponse(habit, LocalDate.now());
    }

    @Transactional
    public HabitResponse toggleHabitLog(Long habitId) {
        LocalDate today = LocalDate.now();
        Habit habit = getActiveHabitById(habitId);
        var existingLog = habitLogRepository.findByHabitIdAndLogDate(habitId, today);
        if (existingLog.isPresent()) {
            habitLogRepository.delete(existingLog.get());
        } else {
            HabitLog log = HabitLog.builder()
                    .habit(habit)
                    .logDate(today)
                    .completed(true)
                    .build();
            habitLogRepository.save(log);
        }
        return toResponse(habit, today);
    }

    /**
     * Soft delete — marks deletedAt timestamp, log history is preserved.
     * Hard delete is intentionally removed.
     */
    @Transactional
    public void deleteHabit(Long habitId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found: " + habitId));
        habit.setDeletedAt(LocalDateTime.now());
        habitRepository.save(habit);
    }

    @Transactional
    public HabitResponse toggleActive(Long habitId) {
        Habit habit = getActiveHabitById(habitId);
        habit.setActive(!habit.getActive());
        habit = habitRepository.save(habit);
        return toResponse(habit, LocalDate.now());
    }

    // ── Helpers ──────────────────────────────────────────────

    private Habit getActiveHabitById(Long id) {
        return habitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Habit not found: " + id));
    }

    private HabitResponse toResponse(Habit habit, LocalDate date) {
        boolean completedToday = habitLogRepository
                .findByHabitIdAndLogDate(habit.getId(), date)
                .isPresent();
        return HabitResponse.builder()
                .id(habit.getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .color(habit.getColor())
                .active(habit.getActive())
                .completedToday(completedToday)
                .createdAt(habit.getCreatedAt())
                .deletedAt(habit.getDeletedAt())
                .build();
    }
}
