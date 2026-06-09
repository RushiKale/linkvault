package com.linksaver.link;

import com.linksaver.activity.ActivityService;
import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.favorite.FavoriteRepository;
import com.linksaver.tag.Tag;
import com.linksaver.tag.TagRepository;
import com.linksaver.team.TeamMember;
import com.linksaver.team.TeamMemberRepository;
import com.linksaver.team.TeamProject;
import com.linksaver.team.TeamProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static com.linksaver.link.LinkRepository.*;

@Service
public class LinkService {

    private final LinkRepository linkRepository;
    private final CollectionRepository collectionRepository;
    private final TagRepository tagRepository;
    private final FavoriteRepository favoriteRepository;
    private final ActivityService activityService;
    private final TeamProjectRepository teamProjectRepository;
    private final TeamMemberRepository teamMemberRepository;

    public LinkService(LinkRepository linkRepository, CollectionRepository collectionRepository,
                       TagRepository tagRepository, FavoriteRepository favoriteRepository,
                       ActivityService activityService,
                       TeamProjectRepository teamProjectRepository,
                       TeamMemberRepository teamMemberRepository) {
        this.linkRepository = linkRepository;
        this.collectionRepository = collectionRepository;
        this.tagRepository = tagRepository;
        this.favoriteRepository = favoriteRepository;
        this.activityService = activityService;
        this.teamProjectRepository = teamProjectRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public LinkDto.PaginatedResponse findAll(
            String userId, String q, String tag, String collectionId,
            Boolean favorites, String scope, String sort, String order,
            int page, int limit, String projectId) {

        Specification<Link> spec;

        if (projectId != null) {
            spec = Specification.where(withProject(projectId));
        } else {
            spec = Specification.where(withUserId(userId));

            List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
            if (!memberships.isEmpty()) {
                List<String> teamIds = memberships.stream()
                        .map(TeamMember::getTeamId)
                        .collect(Collectors.toList());

                // Include links from team projects
                List<TeamProject> projects = teamProjectRepository.findByTeamIdIn(teamIds);
                if (!projects.isEmpty()) {
                    List<String> projectIds = projects.stream()
                            .map(TeamProject::getId)
                            .collect(Collectors.toList());
                    spec = spec.or(withProjectIn(projectIds));
                }

                // Also include links in team-scoped collections (may not have teamProjectId)
                List<Collection> teamCollections = collectionRepository.findByTeamIdIn(teamIds);
                if (!teamCollections.isEmpty()) {
                    List<String> colIds = teamCollections.stream()
                            .map(Collection::getId)
                            .collect(Collectors.toList());
                    spec = spec.or(withCollectionIn(colIds));
            }

            // Include links in the org-wide shared Public collection (visible to everyone)
            List<Collection> sharedPublic = collectionRepository.findByNameAndTeamIdIsNull("Public");
            if (!sharedPublic.isEmpty()) {
                spec = spec.or(withCollection(sharedPublic.get(0).getId()));
            }
        }
        }

        if (q != null && !q.isBlank()) {
            spec = spec.and(withSearch(q));
        }
        if (tag != null && !tag.isBlank()) {
            spec = spec.and(withTag(tag));
        }
        if (collectionId != null) {
            spec = spec.and(withCollection(collectionId));
        }
        if (projectId != null) {
            spec = spec.and(withProject(projectId));
        }
        if (favorites != null && favorites) {
            spec = spec.and(withFavorites(userId, true));
        }
        if (scope != null && !scope.isBlank()) {
            String[] names = scope.split(",");
            spec = spec.and(inCollectionNames(userId, Arrays.asList(names)));
        }

        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null) {
            String field = switch (sort) {
                case "title" -> "title";
                case "url" -> "url";
                default -> "createdAt";
            };
            Sort.Direction dir = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
            sortObj = Sort.by(dir, field);
        }

        Pageable pageable = PageRequest.of(page, limit, sortObj);
        Page<Link> linkPage = linkRepository.findAll(spec, pageable);

        Map<String, Collection> collectionMap = getCollectionsMap(linkPage.getContent());

        List<LinkDto.LinkResponse> responses = linkPage.getContent().stream()
                .map(link -> LinkDto.LinkResponse.from(
                        link,
                        collectionMap.get(link.getCollectionId()),
                        favoriteRepository.existsByUserIdAndLinkId(userId, link.getId())
                ))
                .collect(Collectors.toList());

        return LinkDto.PaginatedResponse.of(responses, linkPage.getTotalElements(), page, limit);
    }

    public LinkDto.LinkResponse findById(String userId, String id) {
        Link link = linkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Link not found"));

        boolean canView = link.getUserId().equals(userId);
        if (!canView && link.getTeamProjectId() != null) {
            canView = teamProjectRepository.findById(link.getTeamProjectId())
                    .map(tp -> teamMemberRepository.existsByTeamIdAndUserId(tp.getTeamId(), userId))
                    .orElse(false);
        }
        if (!canView && link.getCollectionId() != null) {
            canView = collectionRepository.findById(link.getCollectionId())
                    .filter(c -> c.getTeamId() != null)
                    .map(c -> teamMemberRepository.existsByTeamIdAndUserId(c.getTeamId(), userId))
                    .orElse(false);
        }
        // Allow viewing links in the org-wide shared Public collection
        if (!canView && link.getCollectionId() != null) {
            canView = collectionRepository.findById(link.getCollectionId())
                    .filter(c -> c.getTeamId() == null && "Public".equals(c.getName()))
                    .isPresent();
        }
        if (!canView) {
            throw new IllegalArgumentException("Link not found");
        }

        Collection col = link.getCollectionId() != null
                ? collectionRepository.findById(link.getCollectionId()).orElse(null)
                : null;

        boolean isFavorited = favoriteRepository.existsByUserIdAndLinkId(userId, id);
        return LinkDto.LinkResponse.from(link, col, isFavorited);
    }

    @Transactional
    public LinkDto.LinkResponse create(String userId, LinkDto.CreateRequest request) {
        Link link = new Link();
        link.setUserId(userId);
        link.setUrl(request.url);
        link.setTitle(request.title);
        link.setDescription(request.description);
        link.setNotes(request.notes);
        link.setFaviconUrl(request.faviconUrl);
        link.setImageUrl(request.imageUrl);

        if (request.teamProjectId != null) {
            link.setTeamProjectId(request.teamProjectId);
        } else if (request.collectionId != null) {
            link.setCollectionId(request.collectionId);
            String colTeamId = collectionRepository.findById(request.collectionId)
                    .map(Collection::getTeamId).orElse(null);
            if (colTeamId != null) {
                String projId = teamProjectRepository.findByTeamId(colTeamId)
                        .map(TeamProject::getId).orElse(null);
                if (projId != null) link.setTeamProjectId(projId);
            }
        } else {
            throw new IllegalArgumentException("Either collectionId or teamProjectId is required");
        }

        if (request.tags != null) {
            link.setTags(resolveTags(request.tags));
        }

        link = linkRepository.save(link);

        Collection col = link.getCollectionId() != null
                ? collectionRepository.findById(link.getCollectionId()).orElse(null)
                : null;
        String collectionName = col != null ? col.getName() : "Unknown";

        activityService.log(userId, "LINK_CREATED", "link", link.getId(),
                Map.of("title", link.getTitle(), "url", link.getUrl(), "collectionName", collectionName));

        return LinkDto.LinkResponse.from(link, col, false);
    }

    @Transactional
    public LinkDto.LinkResponse update(String userId, String id, LinkDto.UpdateRequest request) {
        Link link = linkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Link not found"));

        boolean canUpdate = link.getUserId().equals(userId);

        if (!canUpdate && link.getCollectionId() != null) {
            String colTeamId = collectionRepository.findById(link.getCollectionId())
                    .map(Collection::getTeamId).orElse(null);
            if (colTeamId != null) {
                canUpdate = teamMemberRepository.findByTeamIdAndUserId(colTeamId, userId)
                        .filter(m -> m.getRole() == TeamMember.TeamRole.ADMIN
                                || m.getRole() == TeamMember.TeamRole.MASTER_ADMIN)
                        .isPresent();
            }
        }

        if (!canUpdate && link.getTeamProjectId() != null) {
            String projTeamId = teamProjectRepository.findById(link.getTeamProjectId())
                    .map(TeamProject::getTeamId).orElse(null);
            if (projTeamId != null) {
                canUpdate = teamMemberRepository.findByTeamIdAndUserId(projTeamId, userId)
                        .filter(m -> m.getRole() == TeamMember.TeamRole.ADMIN
                                || m.getRole() == TeamMember.TeamRole.MASTER_ADMIN)
                        .isPresent();
            }
        }

        if (!canUpdate) {
            throw new IllegalArgumentException("Link not found");
        }

        if (request.title != null) link.setTitle(request.title);
        if (request.description != null) link.setDescription(request.description);
        if (request.notes != null) link.setNotes(request.notes);
        if (request.faviconUrl != null) link.setFaviconUrl(request.faviconUrl);
        if (request.imageUrl != null) link.setImageUrl(request.imageUrl);
        if (request.collectionId != null) link.setCollectionId(request.collectionId);
        if (request.teamProjectId != null) link.setTeamProjectId(request.teamProjectId);
        if (request.tags != null) {
            link.setTags(resolveTags(request.tags));
        }

        link = linkRepository.save(link);

        Collection col = link.getCollectionId() != null
                ? collectionRepository.findById(link.getCollectionId()).orElse(null)
                : null;

        boolean isFavorited = favoriteRepository.existsByUserIdAndLinkId(userId, id);
        return LinkDto.LinkResponse.from(link, col, isFavorited);
    }

    @Transactional
    public void delete(String userId, String id) {
        Link link = linkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Link not found"));

        boolean canDelete = link.getUserId().equals(userId);

        if (!canDelete && link.getCollectionId() != null) {
            String colTeamId = collectionRepository.findById(link.getCollectionId())
                    .map(Collection::getTeamId).orElse(null);
            if (colTeamId != null) {
                canDelete = teamMemberRepository.findByTeamIdAndUserId(colTeamId, userId)
                        .filter(m -> m.getRole() == TeamMember.TeamRole.ADMIN
                                || m.getRole() == TeamMember.TeamRole.MASTER_ADMIN)
                        .isPresent();
            }
        }

        if (!canDelete && link.getTeamProjectId() != null) {
            String projTeamId = teamProjectRepository.findById(link.getTeamProjectId())
                    .map(TeamProject::getTeamId).orElse(null);
            if (projTeamId != null) {
                canDelete = teamMemberRepository.findByTeamIdAndUserId(projTeamId, userId)
                        .filter(m -> m.getRole() == TeamMember.TeamRole.ADMIN
                                || m.getRole() == TeamMember.TeamRole.MASTER_ADMIN)
                        .isPresent();
            }
        }

        if (!canDelete) {
            throw new IllegalArgumentException("Link not found");
        }

        linkRepository.delete(link);
        activityService.log(userId, "LINK_DELETED", "link", id,
                Map.of("title", link.getTitle(), "url", link.getUrl()));
    }

    @Transactional
    public void bulkMove(String userId, LinkDto.BulkMoveRequest request) {
        List<Link> links = linkRepository.findAllById(request.ids);
        for (Link link : links) {
            if (link.getUserId().equals(userId)) {
                link.setCollectionId(request.collectionId);
            }
        }
        linkRepository.saveAll(links);
    }

    @Transactional
    public void bulkDelete(String userId, LinkDto.BulkDeleteRequest request) {
        List<Link> links = linkRepository.findAllById(request.ids);
        links.removeIf(link -> !link.getUserId().equals(userId));
        linkRepository.deleteAll(links);
        for (Link link : links) {
            activityService.log(userId, "LINK_DELETED", "link", link.getId(),
                    Map.of("title", link.getTitle(), "url", link.getUrl(), "bulk", true));
        }
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null) return new HashSet<>();
        Set<Tag> tags = new HashSet<>();
        for (String name : tagNames) {
            Tag tag = tagRepository.findByName(name)
                    .orElseGet(() -> tagRepository.save(new Tag(name)));
            tags.add(tag);
        }
        return tags;
    }

    private Map<String, Collection> getCollectionsMap(List<Link> links) {
        Set<String> collectionIds = links.stream()
                .map(Link::getCollectionId)
                .collect(Collectors.toSet());
        if (collectionIds.isEmpty()) return Collections.emptyMap();

        List<Collection> collections = collectionRepository.findAllById(collectionIds);
        return collections.stream()
                .collect(Collectors.toMap(Collection::getId, c -> c));
    }
}
