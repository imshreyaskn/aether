package com.example.aether.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitRequest {
    private String name;
    private String description;
    private String color;
}
