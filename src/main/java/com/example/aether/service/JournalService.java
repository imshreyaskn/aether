package com.example.aether.service;

import com.example.aether.dto.JournalRequest;
import com.example.aether.dto.JournalResponse;
import com.example.aether.entity.Journal;
import com.example.aether.repository.JournalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalRepository journalRepository;

    public List<JournalResponse> getAllJournals() {
        return journalRepository.findAllByOrderByEntryDateDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public JournalResponse getJournalByDate(LocalDate date) {
        Journal journal = journalRepository.findByEntryDate(date)
                .orElse(null);
        return journal != null ? toResponse(journal) : null;
    }

    public JournalResponse getTodayJournal() {
        return getJournalByDate(LocalDate.now());
    }

    @Transactional
    public JournalResponse saveJournal(JournalRequest request) {
        LocalDate entryDate = request.getEntryDate() != null
                ? LocalDate.parse(request.getEntryDate())
                : LocalDate.now();

        Optional<Journal> existing = journalRepository.findByEntryDate(entryDate);

        Journal journal;
        if (existing.isPresent()) {
            // Update existing entry
            journal = existing.get();
            journal.setTitle(request.getTitle());
            journal.setContent(request.getContent());
            journal.setMood(request.getMood());
        } else {
            // Create new entry
            journal = Journal.builder()
                    .entryDate(entryDate)
                    .title(request.getTitle())
                    .content(request.getContent())
                    .mood(request.getMood())
                    .build();
        }

        journal = journalRepository.save(journal);
        return toResponse(journal);
    }

    @Transactional
    public void deleteJournal(Long id) {
        journalRepository.deleteById(id);
    }

    private JournalResponse toResponse(Journal journal) {
        return JournalResponse.builder()
                .id(journal.getId())
                .entryDate(journal.getEntryDate())
                .title(journal.getTitle())
                .content(journal.getContent())
                .mood(journal.getMood())
                .createdAt(journal.getCreatedAt())
                .updatedAt(journal.getUpdatedAt())
                .build();
    }
}
