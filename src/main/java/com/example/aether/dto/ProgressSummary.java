package com.example.aether.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressSummary {

    private int totalActiveHabits;
    private List<DailySummary> dailySummaries;
    private double overallCompletionRate;
    private int currentStreak;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailySummary {
        private LocalDate date;
        private String dayLabel;
        /**
         * How many habits were active on THIS specific day
         * (respects createdAt and deletedAt — not always the current active count).
         */
        private int totalHabits;
        private int completedHabits;
        /**
         * 0-100 completion rate. -1.0 means no habits existed on this day (skip in
         * chart).
         */
        private double completionRate;
        private Map<String, Boolean> habitStatus;
    }
}
