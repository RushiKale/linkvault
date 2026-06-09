package com.linksaver.favorite;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{linkId}")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @RequestAttribute("userId") String userId,
            @PathVariable String linkId) {
        return ResponseEntity.ok(favoriteService.toggle(userId, linkId));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> findAll(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(favoriteService.findAll(userId));
    }

    @DeleteMapping("/{linkId}")
    public ResponseEntity<Map<String, Boolean>> remove(
            @RequestAttribute("userId") String userId,
            @PathVariable String linkId) {
        return ResponseEntity.ok(favoriteService.remove(userId, linkId));
    }
}
