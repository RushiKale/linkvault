package com.linksaver.tag;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public List<String> findAll(String userId, String q) {
        List<Tag> tags;
        if (q != null && !q.isBlank()) {
            tags = tagRepository.findByNameContainingIgnoreCase(q);
        } else {
            tags = tagRepository.findAllByOrderByNameAsc();
        }

        return tags.stream()
                .map(Tag::getName)
                .limit(50)
                .collect(Collectors.toList());
    }

    @Transactional
    public Tag create(String name) {
        return tagRepository.findByName(name)
                .orElseGet(() -> tagRepository.save(new Tag(name)));
    }

    @Transactional
    public void delete(String id) {
        tagRepository.deleteById(id);
    }
}
