package com.linksaver.favorite;

import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.link.Link;
import com.linksaver.link.LinkRepository;
import com.linksaver.team.TeamMember;
import com.linksaver.team.TeamMemberRepository;
import com.linksaver.team.TeamProject;
import com.linksaver.team.TeamProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final LinkRepository linkRepository;
    private final CollectionRepository collectionRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamProjectRepository teamProjectRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, LinkRepository linkRepository,
                           CollectionRepository collectionRepository,
                           TeamMemberRepository teamMemberRepository,
                           TeamProjectRepository teamProjectRepository) {
        this.favoriteRepository = favoriteRepository;
        this.linkRepository = linkRepository;
        this.collectionRepository = collectionRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamProjectRepository = teamProjectRepository;
    }

    @Transactional
    public Map<String, Boolean> toggle(String userId, String linkId) {
        Link link = linkRepository.findById(linkId)
                .orElseThrow(() -> new IllegalArgumentException("Link not found"));

        boolean canAccess = link.getUserId().equals(userId);
        if (!canAccess && link.getTeamProjectId() != null) {
            canAccess = teamProjectRepository.findById(link.getTeamProjectId())
                    .map(tp -> teamMemberRepository.existsByTeamIdAndUserId(tp.getTeamId(), userId))
                    .orElse(false);
        }
        if (!canAccess && link.getCollectionId() != null) {
            canAccess = collectionRepository.findById(link.getCollectionId())
                    .filter(c -> c.getTeamId() != null)
                    .map(c -> teamMemberRepository.existsByTeamIdAndUserId(c.getTeamId(), userId))
                    .orElse(false);
        }
        // Allow favoriting links in the org-wide shared Public collection
        if (!canAccess && link.getCollectionId() != null) {
            canAccess = collectionRepository.findById(link.getCollectionId())
                    .filter(c -> c.getTeamId() == null && "Public".equals(c.getName()))
                    .isPresent();
        }
        if (!canAccess) {
            throw new IllegalArgumentException("Link not found");
        }

        Optional<Favorite> existing = favoriteRepository.findByUserIdAndLinkId(userId, linkId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return Map.of("favorited", false);
        }

        favoriteRepository.save(new Favorite(userId, linkId));
        return Map.of("favorited", true);
    }

    public List<Map<String, Object>> findAll(String userId) {
        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Set<String> linkIds = favorites.stream()
                .map(Favorite::getLinkId)
                .collect(Collectors.toSet());
        List<Link> links = linkRepository.findAllById(linkIds);
        Map<String, Link> linkMap = links.stream()
                .collect(Collectors.toMap(Link::getId, l -> l));

        Set<String> collectionIds = links.stream()
                .map(Link::getCollectionId)
                .collect(Collectors.toSet());
        List<Collection> collections = collectionRepository.findAllById(collectionIds);
        Map<String, Collection> collectionMap = collections.stream()
                .collect(Collectors.toMap(Collection::getId, c -> c));

        Map<String, Favorite> favMap = favorites.stream()
                .collect(Collectors.toMap(Favorite::getLinkId, f -> f));

        return favorites.stream()
                .map(f -> {
                    Link link = linkMap.get(f.getLinkId());
                    if (link == null) return null;
                    Collection col = collectionMap.get(link.getCollectionId());

                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("id", link.getId());
                    result.put("title", link.getTitle());
                    result.put("url", link.getUrl());
                    result.put("description", link.getDescription());
                    result.put("faviconUrl", link.getFaviconUrl());
                    result.put("imageUrl", link.getImageUrl());
                    result.put("notes", link.getNotes());
                    result.put("openCount", link.getOpenCount());
                    result.put("lastOpenedAt", link.getLastOpenedAt());
                    result.put("createdAt", link.getCreatedAt());
                    result.put("collection", col != null ? Map.of(
                            "id", col.getId(), "name", col.getName(), "color", col.getColor()
                    ) : null);
                    result.put("tags", link.getTags().stream().map(t -> t.getName()).collect(Collectors.toList()));
                    result.put("isFavorite", true);
                    result.put("favoritedAt", f.getCreatedAt());
                    return result;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Boolean> remove(String userId, String linkId) {
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndLinkId(userId, linkId);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Favorite not found");
        }
        favoriteRepository.delete(existing.get());
        return Map.of("deleted", true);
    }
}
