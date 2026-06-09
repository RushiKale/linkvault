package com.linksaver.team;

import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.link.Link;
import com.linksaver.link.LinkRepository;
import com.linksaver.user.User;
import com.linksaver.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final CollectionRepository collectionRepository;
    private final TeamProjectRepository teamProjectRepository;
    private final LinkRepository linkRepository;
    private final UserRepository userRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    public TeamService(OrganizationRepository organizationRepository, TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository, TeamInviteRepository teamInviteRepository,
                       CollectionRepository collectionRepository,
                       TeamProjectRepository teamProjectRepository,
                       LinkRepository linkRepository,
                       UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamInviteRepository = teamInviteRepository;
        this.collectionRepository = collectionRepository;
        this.teamProjectRepository = teamProjectRepository;
        this.linkRepository = linkRepository;
        this.userRepository = userRepository;
    }

    // --- Organizations ---

    public List<TeamDto.OrgResponse> listOrgs(String userId) {
        List<String> orgIds = teamMemberRepository.findByUserId(userId).stream()
                .map(TeamMember::getTeamId)
                .map(teamId -> teamRepository.findById(teamId).map(Team::getOrgId).orElse(null))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        return organizationRepository.findAllById(orgIds).stream()
                .map(TeamDto.OrgResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamDto.OrgResponse createOrg(String userId, String name, String slug) {
        Organization org = new Organization(name, slug, userId);
        org = organizationRepository.save(org);
        return TeamDto.OrgResponse.from(org);
    }

    // --- Teams ---

    public List<TeamDto.TeamResponse> listTeams(String userId) {
        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
        Map<String, String> roleMap = memberships.stream()
                .collect(Collectors.toMap(TeamMember::getTeamId, m -> m.getRole().name()));

        List<Team> teams = teamRepository.findAllById(roleMap.keySet());

        Map<String, String> projectIds = teamProjectRepository.findAll().stream()
                .filter(p -> roleMap.containsKey(p.getTeamId()))
                .collect(Collectors.toMap(TeamProject::getTeamId, TeamProject::getId));

        return teams.stream().map(team -> {
            int count = teamMemberRepository.findByTeamId(team.getId()).size();
            return TeamDto.TeamResponse.from(team, roleMap.getOrDefault(team.getId(), "NONE"), count,
                    projectIds.get(team.getId()));
        }).collect(Collectors.toList());
    }

    public TeamDto.TeamResponse getTeam(String userId, String teamId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        int count = teamMemberRepository.findByTeamId(teamId).size();
        String projectId = teamProjectRepository.findByTeamId(teamId)
                .map(TeamProject::getId).orElse(null);
        return TeamDto.TeamResponse.from(team, member.getRole().name(), count, projectId);
    }

    @Transactional
    public TeamDto.TeamResponse createTeam(String userId, String orgId, String name, String slug, String description) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        if (!org.getMasterAdminId().equals(userId)) {
            throw new IllegalArgumentException("Only MASTER_ADMIN can create teams");
        }

        Team team = new Team(orgId, name, slug, description);
        team = teamRepository.save(team);

        // Create MASTER_ADMIN membership
        teamMemberRepository.save(new TeamMember(team.getId(), userId, TeamMember.TeamRole.MASTER_ADMIN));

        // Create default team collections for the creator
        createDefaultCollections(userId, team.getId(), team.getName());

        // Auto-create team project with same name as team
        TeamProject project = new TeamProject(team.getId(), name, team.getSlug() + " project", userId);
        project = teamProjectRepository.save(project);

        return TeamDto.TeamResponse.from(team, "MASTER_ADMIN", 1, project.getId());
    }

    @Transactional
    public TeamDto.TeamResponse renameTeam(String userId, String teamId, String newName) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can rename team");
        }
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        team.setName(newName);
        team = teamRepository.save(team);
        int count = teamMemberRepository.findByTeamId(teamId).size();
        String projectId = teamProjectRepository.findByTeamId(teamId)
                .map(TeamProject::getId).orElse(null);
        return TeamDto.TeamResponse.from(team, actor.getRole().name(), count, projectId);
    }

    // --- Members ---

    public List<TeamDto.MemberResponse> listMembers(String userId, String teamId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        return teamMemberRepository.findByTeamId(teamId).stream()
                .map(m -> {
                    User u = userRepository.findById(m.getUserId()).orElse(null);
                    return TeamDto.MemberResponse.from(m,
                        u != null ? u.getFirstName() : null,
                        u != null ? u.getLastName() : null);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamDto.MemberResponse updateMemberRole(String userId, String teamId, String targetUserId, String newRole) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));

        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can manage members");
        }

        TeamMember target = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        target.setRole(TeamMember.TeamRole.valueOf(newRole));
        target = teamMemberRepository.save(target);
        User u = userRepository.findById(targetUserId).orElse(null);
        return TeamDto.MemberResponse.from(target,
            u != null ? u.getFirstName() : null,
            u != null ? u.getLastName() : null);
    }

    @Transactional
    public void removeMember(String userId, String teamId, String targetUserId) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));

        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can remove members");
        }

        teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .ifPresent(teamMemberRepository::delete);
    }

    // --- Invites ---

    @Transactional
    public TeamDto.InviteResponse createInvite(String userId, String teamId) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));

        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can invite members");
        }

        byte[] tokenBytes = new byte[32];
        RANDOM.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        TeamInvite invite = new TeamInvite(teamId, token, LocalDateTime.now().plusDays(7));
        invite = teamInviteRepository.save(invite);
        return TeamDto.InviteResponse.from(invite);
    }

    @Transactional
    public Map<String, Object> joinTeam(String userId, String token) {
        TeamInvite invite = teamInviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite token"));

        if (invite.isUsed()) {
            throw new IllegalArgumentException("Invite already used");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invite has expired");
        }

        invite.setUsed(true);
        teamInviteRepository.save(invite);

        if (teamMemberRepository.existsByTeamIdAndUserId(invite.getTeamId(), userId)) {
            throw new IllegalArgumentException("Already a team member");
        }

        Team team = teamRepository.findById(invite.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        TeamMember member = new TeamMember(invite.getTeamId(), userId, TeamMember.TeamRole.PENDING);
        member = teamMemberRepository.save(member);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teamId", team.getId());
        result.put("teamName", team.getName());
        result.put("role", member.getRole().name());
        return result;
    }

    // --- Team Project ---

    public TeamDto.ProjectResponse getProject(String userId, String teamId) {
        teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        TeamProject project = teamProjectRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return TeamDto.ProjectResponse.from(project);
    }

    @Transactional
    public TeamDto.ProjectResponse renameProject(String userId, String teamId, String newName) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can rename project");
        }
        TeamProject project = teamProjectRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        project.setName(newName);
        project = teamProjectRepository.save(project);
        return TeamDto.ProjectResponse.from(project);
    }

    @Transactional
    public void deleteProject(String userId, String teamId, boolean force) {
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        if (actor.getRole() != TeamMember.TeamRole.ADMIN && actor.getRole() != TeamMember.TeamRole.MASTER_ADMIN) {
            throw new IllegalArgumentException("Only ADMIN+ can delete project");
        }
        TeamProject project = teamProjectRepository.findByTeamId(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        long linkCount = linkRepository.countByTeamProjectId(project.getId());
        if (linkCount > 0 && !force) {
            throw new IllegalArgumentException("Project has " + linkCount + " links. Use ?force=true to delete anyway.");
        }
        if (linkCount > 0) {
            linkRepository.deleteByTeamProjectId(project.getId());
        }
        teamProjectRepository.delete(project);
    }

    private void createDefaultCollections(String userId, String teamId, String teamName) {
        String[][] defaultCollections = {
            {"Private", "#1a1a2e", "true"},
            {"Public", "#0f3460", "true"},
            {teamName, "#16213e", "false"}
        };
        for (String[] col : defaultCollections) {
            String name = col[0];
            boolean exists = collectionRepository.existsByTeamIdAndName(teamId, name);
            if (exists) continue;
            int order = collectionRepository.findByTeamIdOrderByOrderAsc(teamId).size();
            Collection c = new Collection(userId, name, col[1], order, Boolean.parseBoolean(col[2]));
            c.setTeamId(teamId);
            collectionRepository.save(c);
        }
    }
}
