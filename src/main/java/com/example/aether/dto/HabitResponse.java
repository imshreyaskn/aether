package com.example.aether.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private Boolean active;
    private Boolean completedToday;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
}
