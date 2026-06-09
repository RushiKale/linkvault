package com.linksaver.team;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // --- Organizations ---

    @PostMapping("/organizations")
    public ResponseEntity<TeamDto.OrgResponse> createOrg(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.createOrg(userId, body.get("name"), body.get("slug")));
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<TeamDto.OrgResponse>> listOrgs(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(teamService.listOrgs(userId));
    }

    // --- Teams ---

    @GetMapping("/teams")
    public ResponseEntity<List<TeamDto.TeamResponse>> listTeams(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(teamService.listTeams(userId));
    }

    @PostMapping("/teams")
    public ResponseEntity<TeamDto.TeamResponse> createTeam(
            @RequestAttribute("userId") String userId,
            @Valid @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.createTeam(userId, body.get("orgId"),
                body.get("name"), body.get("slug"), body.get("description")));
    }

    @GetMapping("/teams/{id}")
    public ResponseEntity<TeamDto.TeamResponse> getTeam(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId) {
        return ResponseEntity.ok(teamService.getTeam(userId, teamId));
    }

    @GetMapping("/teams/{id}/members")
    public ResponseEntity<List<TeamDto.MemberResponse>> listMembers(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId) {
        return ResponseEntity.ok(teamService.listMembers(userId, teamId));
    }

    @PostMapping("/teams/{id}/invite")
    public ResponseEntity<TeamDto.InviteResponse> createInvite(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId) {
        return ResponseEntity.ok(teamService.createInvite(userId, teamId));
    }

    @PostMapping("/teams/join")
    public ResponseEntity<Map<String, Object>> joinTeam(
            @RequestAttribute("userId") String userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.joinTeam(userId, body.get("token")));
    }

    @PatchMapping("/teams/{teamId}/members/{userId}")
    public ResponseEntity<TeamDto.MemberResponse> updateMemberRole(
            @RequestAttribute("userId") String actorId,
            @PathVariable String teamId,
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateMemberRole(actorId, teamId, userId, body.get("role")));
    }

    @DeleteMapping("/teams/{teamId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @RequestAttribute("userId") String actorId,
            @PathVariable String teamId,
            @PathVariable String userId) {
        teamService.removeMember(actorId, teamId, userId);
        return ResponseEntity.noContent().build();
    }

    // --- Team rename ---

    @PatchMapping("/teams/{id}")
    public ResponseEntity<TeamDto.TeamResponse> renameTeam(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.renameTeam(userId, teamId, body.get("name")));
    }

    // --- Team Project ---

    @GetMapping("/teams/{id}/project")
    public ResponseEntity<TeamDto.ProjectResponse> getProject(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId) {
        return ResponseEntity.ok(teamService.getProject(userId, teamId));
    }

    @PatchMapping("/teams/{id}/project")
    public ResponseEntity<TeamDto.ProjectResponse> renameProject(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId,
            @RequestBody TeamDto.RenameRequest body) {
        return ResponseEntity.ok(teamService.renameProject(userId, teamId, body.name));
    }

    @DeleteMapping("/teams/{id}/project")
    public ResponseEntity<Void> deleteProject(
            @RequestAttribute("userId") String userId,
            @PathVariable("id") String teamId,
            @RequestParam(name = "force", defaultValue = "false") boolean force) {
        teamService.deleteProject(userId, teamId, force);
        return ResponseEntity.noContent().build();
    }
}
