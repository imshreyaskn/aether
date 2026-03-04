package com.example.aether.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalRequest {
    private String entryDate; // yyyy-MM-dd format
    private String title;
    private String content;
    private String mood;
}
