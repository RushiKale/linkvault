package com.linksaver.activity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    public ActivityService(ActivityLogRepository activityLogRepository, ObjectMapper objectMapper) {
        this.activityLogRepository = activityLogRepository;
        this.objectMapper = objectMapper;
    }

    public void log(String userId, String action, String entityType, String entityId, Map<String, Object> metadata) {
        String json = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                json = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException ignored) {}
        }
        activityLogRepository.save(new ActivityLog(userId, action, entityType, entityId, json));
    }

    public List<Map<String, Object>> findAll(String userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(log -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", log.getId());
                    m.put("action", log.getAction());
                    m.put("entityType", log.getEntityType());
                    m.put("entityId", log.getEntityId());
                    m.put("metadata", log.getMetadata());
                    m.put("createdAt", log.getCreatedAt().toString());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
