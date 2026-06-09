package com.linksaver.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(String userId);
}
