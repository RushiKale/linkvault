package com.linksaver.collection;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "collections", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "team_id", "name"}, name = "uk_collections_user_team_name")
})
public class Collection {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 7)
    private String color = "#6366f1";

    @Column(name = "`order`")
    private int order = 0;

    @Column(nullable = false)
    private boolean locked = false;

    @Column(name = "team_id", length = 36)
    private String teamId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (color == null) color = "#6366f1";
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Collection() {}

    public Collection(String userId, String name, String color, int order, boolean locked) {
        this.userId = userId;
        this.name = name;
        this.color = color;
        this.order = order;
        this.locked = locked;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
