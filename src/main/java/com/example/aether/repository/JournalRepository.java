package com.example.aether.repository;

import com.example.aether.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {

    Optional<Journal> findByUserIdAndEntryDate(String userId, LocalDate entryDate);

    List<Journal> findByUserIdOrderByEntryDateDesc(String userId);

    List<Journal> findByUserIdAndEntryDateBetweenOrderByEntryDateDesc(String userId, LocalDate start, LocalDate end);
}
