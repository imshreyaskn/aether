package com.example.aether.controller;

import com.example.aether.dto.JournalRequest;
import com.example.aether.dto.JournalResponse;
import com.example.aether.service.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<List<JournalResponse>> getAllJournals() {
        return ResponseEntity.ok(journalService.getAllJournals());
    }

    @GetMapping("/today")
    public ResponseEntity<JournalResponse> getTodayJournal() {
        JournalResponse journal = journalService.getTodayJournal();
        if (journal == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(journal);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<JournalResponse> getJournalByDate(@PathVariable String date) {
        JournalResponse journal = journalService.getJournalByDate(LocalDate.parse(date));
        if (journal == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(journal);
    }

    @PostMapping
    public ResponseEntity<JournalResponse> saveJournal(@RequestBody JournalRequest request) {
        return ResponseEntity.ok(journalService.saveJournal(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJournal(@PathVariable Long id) {
        journalService.deleteJournal(id);
        return ResponseEntity.noContent().build();
    }
}
