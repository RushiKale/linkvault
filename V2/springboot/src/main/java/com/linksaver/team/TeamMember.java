package com.linksaver.team;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"team_id", "user_id"})
})
public class TeamMember {

    public enum TeamRole {
        MASTER_ADMIN, ADMIN, MEMBER, PENDING
    }

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "team_id", nullable = false, length = 36)
    private String teamId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TeamRole role = TeamRole.PENDING;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public TeamMember() {}

    public TeamMember(String teamId, String userId, TeamRole role) {
        this.teamId = teamId;
        this.userId = userId;
        this.role = role;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public TeamRole getRole() { return role; }
    public void setRole(TeamRole role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
