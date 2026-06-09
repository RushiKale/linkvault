package com.linksaver.collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, String> {
    List<Collection> findByUserIdOrderByOrderAsc(String userId);
    Optional<Collection> findByUserIdAndName(String userId, String name);
    List<Collection> findByUserIdAndTeamIdOrderByOrderAsc(String userId, String teamId);
    Optional<Collection> findByUserIdAndTeamIdAndName(String userId, String teamId, String name);
    List<Collection> findByTeamIdOrderByOrderAsc(String teamId);
    List<Collection> findByTeamIdIn(List<String> teamIds);
    List<Collection> findByNameAndTeamIdIsNull(String name);
    boolean existsByTeamIdAndName(String teamId, String name);
}
