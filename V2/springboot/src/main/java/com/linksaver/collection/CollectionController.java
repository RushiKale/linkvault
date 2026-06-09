package com.linksaver.collection;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping
    public ResponseEntity<List<CollectionDto.CollectionResponse>> findAll(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(collectionService.findAll(userId));
    }

    @PostMapping
    public ResponseEntity<CollectionDto.CollectionResponse> create(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody CollectionDto.CreateRequest request) {
        return ResponseEntity.ok(collectionService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionDto.CollectionResponse> update(
            @RequestAttribute("userId") String userId,
            @PathVariable String id,
            @Valid @RequestBody CollectionDto.UpdateRequest request) {
        return ResponseEntity.ok(collectionService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestAttribute("userId") String userId, @PathVariable String id) {
        collectionService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorder(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody CollectionDto.ReorderRequest request) {
        collectionService.reorder(userId, request.ids);
        return ResponseEntity.ok().build();
    }
}
