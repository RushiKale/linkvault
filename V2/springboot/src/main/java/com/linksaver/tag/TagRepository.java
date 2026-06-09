package com.linksaver.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, String> {
    Optional<Tag> findByName(String name);

    @Query("SELECT t FROM Tag t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY t.name")
    List<Tag> findByNameContainingIgnoreCase(@Param("q") String q);

    List<Tag> findAllByOrderByNameAsc();
}
