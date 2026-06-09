package com.linksaver.team;

import java.time.LocalDateTime;
import java.util.Map;

public class TeamDto {

    public static class OrgResponse {
        public String id;
        public String name;
        public String slug;
        public String createdAt;

        public static OrgResponse from(Organization org) {
            OrgResponse r = new OrgResponse();
            r.id = org.getId();
            r.name = org.getName();
            r.slug = org.getSlug();
            r.createdAt = org.getCreatedAt() != null ? org.getCreatedAt().toString() : null;
            return r;
        }
    }

    public static class TeamResponse {
        public String id;
        public String orgId;
        public String name;
        public String slug;
        public String description;
        public String createdAt;
        public String role;
        public int memberCount;
        public String projectId;

        public static TeamResponse from(Team team, String role, int memberCount, String projectId) {
            TeamResponse r = new TeamResponse();
            r.id = team.getId();
            r.orgId = team.getOrgId();
            r.name = team.getName();
            r.slug = team.getSlug();
            r.description = team.getDescription();
            r.createdAt = team.getCreatedAt() != null ? team.getCreatedAt().toString() : null;
            r.role = role;
            r.memberCount = memberCount;
            r.projectId = projectId;
            return r;
        }
    }

    public static class MemberResponse {
        public String id;
        public String userId;
        public String firstName;
        public String lastName;
        public String role;
        public String joinedAt;

        public static MemberResponse from(TeamMember member, String firstName, String lastName) {
            MemberResponse r = new MemberResponse();
            r.id = member.getId();
            r.userId = member.getUserId();
            r.firstName = firstName;
            r.lastName = lastName;
            r.role = member.getRole().name();
            r.joinedAt = member.getJoinedAt() != null ? member.getJoinedAt().toString() : null;
            return r;
        }
    }

    public static class InviteResponse {
        public String id;
        public String token;
        public String expiresAt;

        public static InviteResponse from(TeamInvite invite) {
            InviteResponse r = new InviteResponse();
            r.id = invite.getId();
            r.token = invite.getToken();
            r.expiresAt = invite.getExpiresAt() != null ? invite.getExpiresAt().toString() : null;
            return r;
        }
    }

    public static class ProjectResponse {
        public String id;
        public String teamId;
        public String name;
        public String description;
        public String createdBy;
        public String createdAt;
        public String updatedAt;

        public static ProjectResponse from(TeamProject project) {
            ProjectResponse r = new ProjectResponse();
            r.id = project.getId();
            r.teamId = project.getTeamId();
            r.name = project.getName();
            r.description = project.getDescription();
            r.createdBy = project.getCreatedBy();
            r.createdAt = project.getCreatedAt() != null ? project.getCreatedAt().toString() : null;
            r.updatedAt = project.getUpdatedAt() != null ? project.getUpdatedAt().toString() : null;
            return r;
        }
    }

    public static class RenameRequest {
        public String name;
    }
}
