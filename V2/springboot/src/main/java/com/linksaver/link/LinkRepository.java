package com.linksaver.link;

import com.linksaver.favorite.Favorite;
import com.linksaver.tag.Tag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LinkRepository extends JpaRepository<Link, String>, JpaSpecificationExecutor<Link> {

    List<Link> findByUserId(String userId);

    List<Link> findByCollectionId(String collectionId);

    Optional<Link> findByIdAndUserId(String id, String userId);

    long countByCollectionId(String collectionId);

    long countByUserId(String userId);

    long countByTeamProjectId(String teamProjectId);

    void deleteByTeamProjectId(String teamProjectId);

    @Query("SELECT l FROM Link l WHERE l.collectionId IN :collectionIds")
    List<Link> findByCollectionIds(@Param("collectionIds") List<String> collectionIds);

    static Specification<Link> withUserId(String userId) {
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    static Specification<Link> withSearch(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) return null;
            String pattern = "%" + q.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("url")), pattern),
                cb.like(cb.lower(root.get("description")), pattern),
                cb.like(cb.lower(root.get("notes")), pattern)
            );
        };
    }

    static Specification<Link> withTag(String tagName) {
        return (root, query, cb) -> {
            if (tagName == null || tagName.isBlank()) return null;
            query.distinct(true);
            Join<Link, Tag> tags = root.join("tags");
            return cb.equal(tags.get("name"), tagName);
        };
    }

    static Specification<Link> withCollection(String collectionId) {
        return (root, query, cb) -> {
            if (collectionId == null) return null;
            return cb.equal(root.get("collectionId"), collectionId);
        };
    }

    static Specification<Link> withProject(String teamProjectId) {
        return (root, query, cb) -> {
            if (teamProjectId == null) return null;
            return cb.equal(root.get("teamProjectId"), teamProjectId);
        };
    }

    static Specification<Link> withProjectIn(List<String> teamProjectIds) {
        return (root, query, cb) -> {
            if (teamProjectIds == null || teamProjectIds.isEmpty()) return null;
            return root.get("teamProjectId").in(teamProjectIds);
        };
    }

    static Specification<Link> withCollectionIn(List<String> collectionIds) {
        return (root, query, cb) -> {
            if (collectionIds == null || collectionIds.isEmpty()) return null;
            return root.get("collectionId").in(collectionIds);
        };
    }

    static Specification<Link> withFavorites(String userId, Boolean favoritesOnly) {
        return (root, query, cb) -> {
            if (favoritesOnly == null || !favoritesOnly) return null;
            Subquery<String> subquery = query.subquery(String.class);
            Root<Favorite> fav = subquery.from(Favorite.class);
            subquery.select(fav.get("linkId"));
            subquery.where(cb.equal(fav.get("userId"), userId));
            return root.get("id").in(subquery);
        };
    }

    static Specification<Link> inCollectionNames(String userId, List<String> names) {
        return (root, query, cb) -> {
            if (names == null || names.isEmpty()) return null;
            Subquery<String> subquery = query.subquery(String.class);
            jakarta.persistence.criteria.Root<com.linksaver.collection.Collection> col =
                subquery.from(com.linksaver.collection.Collection.class);
            subquery.select(col.get("id"));
            subquery.where(
                cb.and(
                    cb.equal(col.get("userId"), userId),
                    col.get("name").in(names)
                )
            );
            return root.get("collectionId").in(subquery);
        };
    }
}
