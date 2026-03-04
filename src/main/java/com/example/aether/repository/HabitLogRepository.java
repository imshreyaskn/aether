package com.example.aether.repository;

import com.example.aether.entity.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

        List<HabitLog> findByLogDate(LocalDate logDate);

        Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate logDate);

        /**
         * Fetch all logs in a date range — includes logs for soft-deleted habits
         * (important for historical accuracy in insights).
         */
        @Query("SELECT hl FROM HabitLog hl WHERE hl.userId = :userId AND hl.logDate BETWEEN :startDate AND :endDate")
        List<HabitLog> findLogsBetweenDatesByUserId(
                        @Param("userId") String userId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("SELECT COUNT(hl) FROM HabitLog hl WHERE hl.logDate = :date AND hl.completed = true")
        long countCompletedByDate(@Param("date") LocalDate date);

        @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.id = :habitId AND hl.logDate BETWEEN :startDate AND :endDate")
        List<HabitLog> findByHabitIdAndDateRange(
                        @Param("habitId") Long habitId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);
}
