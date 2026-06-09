package com.linksaver.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamInviteRepository extends JpaRepository<TeamInvite, String> {
    Optional<TeamInvite> findByToken(String token);
}
