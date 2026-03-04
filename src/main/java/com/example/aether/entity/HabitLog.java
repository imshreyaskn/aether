package com.example.aether.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "habit_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "habit_id", "log_date" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Builder.Default
    @Column(name = "completed", nullable = false)
    private Boolean completed = true;

    // Firebase UID for direct filtering
    @Column(name = "user_id")
    private String userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.completed == null)
            this.completed = true;
    }
}
