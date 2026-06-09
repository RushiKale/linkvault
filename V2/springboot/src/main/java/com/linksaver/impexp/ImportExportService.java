package com.linksaver.impexp;

import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.link.Link;
import com.linksaver.link.LinkRepository;
import com.linksaver.tag.Tag;
import com.linksaver.tag.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ImportExportService {

    private final LinkRepository linkRepository;
    private final CollectionRepository collectionRepository;
    private final TagRepository tagRepository;

    public ImportExportService(LinkRepository linkRepository,
                                CollectionRepository collectionRepository,
                                TagRepository tagRepository) {
        this.linkRepository = linkRepository;
        this.collectionRepository = collectionRepository;
        this.tagRepository = tagRepository;
    }

    public Map<String, Object> exportData(String userId) {
        List<Collection> userCollections = collectionRepository.findByUserIdOrderByOrderAsc(userId);
        Set<String> privateNames = userCollections.stream()
                .filter(Collection::isLocked)
                .map(Collection::getName)
                .collect(Collectors.toSet());

        List<Link> links = linkRepository.findByUserId(userId);
        List<Map<String, Object>> exportedLinks = links.stream()
                .filter(link -> {
                    Collection col = collectionRepository.findById(link.getCollectionId()).orElse(null);
                    return col == null || !privateNames.contains(col.getName());
                })
                .map(link -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("url", link.getUrl());
                    item.put("title", link.getTitle());
                    item.put("description", link.getDescription());
                    item.put("notes", link.getNotes());

                    Collection col = collectionRepository.findById(link.getCollectionId()).orElse(null);
                    item.put("collection", col != null ? col.getName() : "Learning");

                    item.put("tags", link.getTags().stream().map(Tag::getName).collect(Collectors.toList()));
                    item.put("createdAt", link.getCreatedAt() != null ? link.getCreatedAt().toString() : null);
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("version", "1.0");
        result.put("exportedAt", LocalDateTime.now().toString());
        result.put("links", exportedLinks);
        return result;
    }

    @Transactional
    public Map<String, Integer> importData(String userId, ImportExportDto.ImportRequest request) {
        Map<String, Integer> results = new HashMap<>();
        results.put("imported", 0);
        results.put("skipped", 0);
        results.put("errors", 0);

        if (request.links == null) return results;

        for (ImportExportDto.ImportLink item : request.links) {
            try {
                if (item.url == null || item.url.isBlank()) {
                    results.put("errors", results.get("errors") + 1);
                    continue;
                }

                boolean exists = linkRepository.findByUserId(userId).stream()
                        .anyMatch(l -> l.getUrl().equals(item.url));
                if (exists) {
                    results.put("skipped", results.get("skipped") + 1);
                    continue;
                }

                String collectionId;
                if (item.collection != null && !item.collection.isBlank()) {
                    Collection collection = collectionRepository.findByUserIdAndName(userId, item.collection)
                            .orElseGet(() -> collectionRepository.save(
                                    new Collection(userId, item.collection, "#6366f1",
                                            collectionRepository.findByUserIdOrderByOrderAsc(userId).size(), false)));
                    collectionId = collection.getId();
                } else {
                    Collection defaultCol = collectionRepository.findByUserIdAndName(userId, "Learning")
                            .orElseThrow(() -> new RuntimeException("Default collection not found"));
                    collectionId = defaultCol.getId();
                }

                Link link = new Link();
                link.setUserId(userId);
                link.setCollectionId(collectionId);
                link.setUrl(item.url);
                link.setTitle(item.title != null ? item.title : item.url);
                link.setDescription(item.description);
                link.setNotes(item.notes);

                if (item.createdAt != null) {
                    try {
                        link.setCreatedAt(LocalDateTime.parse(item.createdAt, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    } catch (Exception ignored) {}
                }

                if (item.tags != null && !item.tags.isEmpty()) {
                    Set<Tag> tags = new HashSet<>();
                    for (String name : item.tags) {
                        Tag tag = tagRepository.findByName(name.toLowerCase())
                                .orElseGet(() -> tagRepository.save(new Tag(name.toLowerCase())));
                        tags.add(tag);
                    }
                    link.setTags(tags);
                }

                linkRepository.save(link);
                results.put("imported", results.get("imported") + 1);
            } catch (Exception e) {
                results.put("errors", results.get("errors") + 1);
            }
        }

        return results;
    }
}
