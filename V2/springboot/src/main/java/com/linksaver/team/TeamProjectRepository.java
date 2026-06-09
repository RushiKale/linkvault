package com.linksaver.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamProjectRepository extends JpaRepository<TeamProject, String> {
    Optional<TeamProject> findByTeamId(String teamId);
    List<TeamProject> findByTeamIdIn(List<String> teamIds);
}
