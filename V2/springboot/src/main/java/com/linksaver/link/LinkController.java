package com.linksaver.link;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LinkController {

    private final LinkService linkService;

    public LinkController(LinkService linkService) {
        this.linkService = linkService;
    }

    @GetMapping("/links")
    public ResponseEntity<LinkDto.PaginatedResponse> findAll(
            @RequestAttribute("userId") String userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(name = "collectionId", required = false) String collectionId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(required = false) Boolean favorites,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(
                linkService.findAll(userId, q, tag, collectionId, favorites, scope, sort, order, page, limit, projectId));
    }

    @GetMapping("/search")
    public ResponseEntity<LinkDto.PaginatedResponse> search(
            @RequestAttribute("userId") String userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(name = "collectionId", required = false) String collectionId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(
                linkService.findAll(userId, q, tag, collectionId, null, null, sort, order, page, limit, projectId));
    }

    @PostMapping("/links")
    public ResponseEntity<LinkDto.LinkResponse> create(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody LinkDto.CreateRequest request) {
        return ResponseEntity.ok(linkService.create(userId, request));
    }

    @GetMapping("/links/{id}")
    public ResponseEntity<LinkDto.LinkResponse> findOne(
            @RequestAttribute("userId") String userId,
            @PathVariable String id) {
        return ResponseEntity.ok(linkService.findById(userId, id));
    }

    @PutMapping("/links/{id}")
    public ResponseEntity<LinkDto.LinkResponse> update(
            @RequestAttribute("userId") String userId,
            @PathVariable String id,
            @Valid @RequestBody LinkDto.UpdateRequest request) {
        return ResponseEntity.ok(linkService.update(userId, id, request));
    }

    @DeleteMapping("/links/{id}")
    public ResponseEntity<Void> delete(
            @RequestAttribute("userId") String userId,
            @PathVariable String id) {
        linkService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/links/bulk/move")
    public ResponseEntity<Void> bulkMove(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody LinkDto.BulkMoveRequest request) {
        linkService.bulkMove(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/links/bulk/delete")
    public ResponseEntity<Void> bulkDelete(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody LinkDto.BulkDeleteRequest request) {
        linkService.bulkDelete(userId, request);
        return ResponseEntity.ok().build();
    }
}
