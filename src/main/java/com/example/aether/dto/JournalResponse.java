package com.example.aether.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalResponse {
    private Long id;
    private LocalDate entryDate;
    private String title;
    private String content;
    private String mood;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
