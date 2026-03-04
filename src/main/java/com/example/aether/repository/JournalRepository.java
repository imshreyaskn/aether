package com.example.aether.repository;

import com.example.aether.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {

    Optional<Journal> findByEntryDate(LocalDate entryDate);

    List<Journal> findAllByOrderByEntryDateDesc();

    List<Journal> findByEntryDateBetweenOrderByEntryDateDesc(LocalDate start, LocalDate end);
}
