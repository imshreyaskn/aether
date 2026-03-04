package com.example.aether.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "habits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String color;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    // Firebase UID — optional until auth is wired up
    @Column(name = "user_id")
    private String userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Soft-delete: null means active, non-null means deleted at that timestamp
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "habit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HabitLog> logs;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.active == null)
            this.active = true;
    }

    /** Convenience: is this habit visible (not soft-deleted)? */
    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
