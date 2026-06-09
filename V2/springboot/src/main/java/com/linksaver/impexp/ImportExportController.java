package com.linksaver.impexp;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ImportExportController {

    private final ImportExportService importExportService;

    public ImportExportController(ImportExportService importExportService) {
        this.importExportService = importExportService;
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportData(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(importExportService.exportData(userId));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Integer>> importData(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody ImportExportDto.ImportRequest request) {
        return ResponseEntity.ok(importExportService.importData(userId, request));
    }
}
