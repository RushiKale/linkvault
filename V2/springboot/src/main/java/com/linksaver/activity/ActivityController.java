package com.linksaver.activity;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> findAll(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(activityService.findAll(userId));
    }
}
