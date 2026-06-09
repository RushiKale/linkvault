package com.linksaver.tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public ResponseEntity<List<String>> findAll(
            @RequestAttribute("userId") String userId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(tagService.findAll(userId, q));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> create(
            @RequestAttribute("userId") String userId,
            @RequestBody Map<String, String> body) {
        Tag tag = tagService.create(body.get("name"));
        return ResponseEntity.ok(Map.of("id", tag.getId(), "name", tag.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestAttribute("userId") String userId,
            @PathVariable String id) {
        tagService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
