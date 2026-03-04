package com.example.aether.service;

import com.example.aether.dto.ProgressSummary;
import com.example.aether.entity.Habit;
import com.example.aether.entity.HabitLog;
import com.example.aether.repository.HabitLogRepository;
import com.example.aether.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    /**
     * Time-aware progress summary.
     *
     * For each day D in the window:
     * - "active on D" = habit was created on or before D AND (not deleted OR
     * deleted after D)
     * - completion rate = completed / active-on-D * 100
     * - Days with ZERO active habits are excluded from the overall average
     * (prevents new habits from punishing your historical average)
     *
     * Option A was chosen: non-applicable days are excluded from average.
     */
    public ProgressSummary getProgressSummary(int days) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1);

        String userId = com.example.aether.util.SecurityUtils.getCurrentUserId();

        // Fetch ALL habits (incl. soft-deleted) for historical accuracy
        List<Habit> allHabits = habitRepository.findByUserIdOrderByCreatedAtAsc(userId);

        // Current active count (for the summary header)
        long currentActive = allHabits.stream()
                .filter(h -> h.getDeletedAt() == null && Boolean.TRUE.equals(h.getActive()))
                .count();

        if (allHabits.isEmpty()) {
            return emptyProgress((int) currentActive);
        }

        // Fetch all logs in the range (includes logs for deleted habits)
        List<HabitLog> allLogs = habitLogRepository.findLogsBetweenDatesByUserId(userId, startDate, today);
        Map<LocalDate, List<HabitLog>> logsByDate = allLogs.stream()
                .collect(Collectors.groupingBy(HabitLog::getLogDate));

        List<ProgressSummary.DailySummary> dailySummaries = new ArrayList<>();
        double totalCompletion = 0;
        int daysWithHabits = 0; // only count days where at least 1 habit existed

        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);

            // Determine which habits were "active" on this specific date
            List<Habit> habitsOnDay = habitsActiveOnDate(allHabits, date);
            int totalOnDay = habitsOnDay.size();

            if (totalOnDay == 0) {
                // No habits existed yet on this day — skip from average
                dailySummaries.add(ProgressSummary.DailySummary.builder()
                        .date(date)
                        .dayLabel(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                        .totalHabits(0)
                        .completedHabits(0)
                        .completionRate(-1.0) // sentinel: no habits existed
                        .habitStatus(Collections.emptyMap())
                        .build());
                continue;
            }

            // Which habits were completed on this date (by id)
            List<HabitLog> dayLogs = logsByDate.getOrDefault(date, Collections.emptyList());
            Set<Long> completedIds = dayLogs.stream()
                    .filter(HabitLog::getCompleted)
                    .map(log -> log.getHabit().getId())
                    .collect(Collectors.toSet());

            // Only count completions for habits that were active on that day
            Set<Long> activeIds = habitsOnDay.stream().map(Habit::getId).collect(Collectors.toSet());
            long completed = completedIds.stream().filter(activeIds::contains).count();

            double rate = (double) completed / totalOnDay * 100.0;
            totalCompletion += rate;
            daysWithHabits++;

            Map<String, Boolean> habitStatus = new LinkedHashMap<>();
            for (Habit h : habitsOnDay) {
                habitStatus.put(h.getName(), completedIds.contains(h.getId()));
            }

            dailySummaries.add(ProgressSummary.DailySummary.builder()
                    .date(date)
                    .dayLabel(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .totalHabits(totalOnDay)
                    .completedHabits((int) completed)
                    .completionRate(round2(rate))
                    .habitStatus(habitStatus)
                    .build());
        }

        // Streak: consecutive days from today backwards with 100% (skip days with no
        // habits)
        int streak = 0;
        for (int i = dailySummaries.size() - 1; i >= 0; i--) {
            double rate = dailySummaries.get(i).getCompletionRate();
            if (rate < 0)
                continue; // day had no habits — don't break streak
            if (rate >= 100.0)
                streak++;
            else
                break;
        }

        double overallRate = daysWithHabits > 0 ? totalCompletion / daysWithHabits : 0.0;

        return ProgressSummary.builder()
                .totalActiveHabits((int) currentActive)
                .dailySummaries(dailySummaries)
                .overallCompletionRate(round2(overallRate))
                .currentStreak(streak)
                .build();
    }

    /**
     * Returns habits that were active on the given date:
     * - createdAt date <= targetDate
     * - deletedAt is null OR deletedAt date >= targetDate
     */
    private List<Habit> habitsActiveOnDate(List<Habit> allHabits, LocalDate targetDate) {
        return allHabits.stream()
                .filter(h -> {
                    LocalDate created = h.getCreatedAt().toLocalDate();
                    if (created.isAfter(targetDate))
                        return false; // not created yet
                    if (h.getDeletedAt() == null)
                        return true; // still active
                    LocalDate deleted = h.getDeletedAt().toLocalDate();
                    return !deleted.isBefore(targetDate); // deleted on or after targetDate
                })
                .collect(Collectors.toList());
    }

    private ProgressSummary emptyProgress(int activeCount) {
        return ProgressSummary.builder()
                .totalActiveHabits(activeCount)
                .dailySummaries(Collections.emptyList())
                .overallCompletionRate(0.0)
                .currentStreak(0)
                .build();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
