package com.linksaver.team;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String slug;

    @Column(name = "master_admin_id", nullable = false, length = 36)
    private String masterAdminId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Organization() {}

    public Organization(String name, String slug, String masterAdminId) {
        this.name = name;
        this.slug = slug;
        this.masterAdminId = masterAdminId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getMasterAdminId() { return masterAdminId; }
    public void setMasterAdminId(String masterAdminId) { this.masterAdminId = masterAdminId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
