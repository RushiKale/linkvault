package com.linksaver.favorite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    boolean existsByUserIdAndLinkId(String userId, String linkId);
    Optional<Favorite> findByUserIdAndLinkId(String userId, String linkId);
    void deleteByUserIdAndLinkId(String userId, String linkId);
    List<Favorite> findByUserIdOrderByCreatedAtDesc(String userId);
}
