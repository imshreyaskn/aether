package com.example.aether.repository;

import com.example.aether.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {

    // Active = not soft-deleted
    List<Habit> findByActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc();

    List<Habit> findByDeletedAtIsNullOrderByCreatedAtDesc();

    // Includes soft-deleted — needed for historical progress calculation
    List<Habit> findAllByOrderByCreatedAtAsc();

    // Legacy compatibility
    List<Habit> findByActiveTrue();

    Optional<Habit> findById(Long id);
}
