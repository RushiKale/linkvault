package com.linksaver.collection;

import com.linksaver.team.Team;
import com.linksaver.team.TeamMember;
import com.linksaver.team.TeamMemberRepository;
import com.linksaver.team.TeamRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final EntityManager entityManager;

    public CollectionService(CollectionRepository collectionRepository,
                             TeamMemberRepository teamMemberRepository,
                             TeamRepository teamRepository,
                             EntityManager entityManager) {
        this.collectionRepository = collectionRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRepository = teamRepository;
        this.entityManager = entityManager;
    }

    public List<CollectionDto.CollectionResponse> findAll(String userId) {
        List<Collection> result = new ArrayList<>();
        result.addAll(collectionRepository.findByUserIdOrderByOrderAsc(userId));

        // Inject shared org-wide Public collection (owned by admin) for every user
        List<Collection> sharedPublic = collectionRepository.findByNameAndTeamIdIsNull("Public");
        for (Collection sp : sharedPublic) {
            if (result.stream().noneMatch(r -> r.getId().equals(sp.getId()))) {
                result.add(sp);
            }
        }

        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
        for (TeamMember m : memberships) {
            List<Collection> teamCols = collectionRepository.findByTeamIdOrderByOrderAsc(m.getTeamId());
            for (Collection c : teamCols) {
                if (result.stream().noneMatch(r -> r.getId().equals(c.getId()))) {
                    result.add(c);
                }
            }
        }
        return result.stream()
                .map(c -> {
                    String teamName = null;
                    if (c.getTeamId() != null) {
                        teamName = teamRepository.findById(c.getTeamId())
                                .map(Team::getName).orElse(null);
                    }
                    return CollectionDto.CollectionResponse.from(c, teamName);
                })
                .collect(Collectors.toList());
    }

    public CollectionDto.CollectionResponse create(String userId, CollectionDto.CreateRequest request) {
        if (request.color == null || request.color.isBlank()) {
            request.color = "#6366f1";
        }

        if (request.teamId != null) {
            TeamMember member = teamMemberRepository.findByTeamIdAndUserId(request.teamId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Not a team member"));

            if (collectionRepository.existsByTeamIdAndName(request.teamId, request.name)) {
                throw new IllegalArgumentException("Collection already exists in this team");
            }

            int maxOrder = collectionRepository.findByTeamIdOrderByOrderAsc(request.teamId).size();
            Collection collection = new Collection(userId, request.name, request.color, maxOrder, false);
            collection.setTeamId(request.teamId);
            collection = collectionRepository.save(collection);
            String teamName = teamRepository.findById(request.teamId)
                    .map(Team::getName).orElse(null);
            return CollectionDto.CollectionResponse.from(collection, teamName);
        }

        int maxOrder = collectionRepository.findByUserIdOrderByOrderAsc(userId).size();
        Collection collection = new Collection(userId, request.name, request.color, maxOrder, false);
        collection = collectionRepository.save(collection);
        return CollectionDto.CollectionResponse.from(collection, null);
    }

    @Transactional
    public CollectionDto.CollectionResponse update(String userId, String id, CollectionDto.UpdateRequest request) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        if (collection.getTeamId() != null) {
            TeamMember member = teamMemberRepository.findByTeamIdAndUserId(collection.getTeamId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        } else if (!collection.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Collection not found");
        }

        if (collection.isLocked()) {
            throw new IllegalArgumentException("Cannot modify a locked collection");
        }

        if (request.name != null) collection.setName(request.name);
        if (request.color != null) collection.setColor(request.color);
        if (request.order != null) collection.setOrder(request.order);

        collection = collectionRepository.save(collection);
        String teamName = collection.getTeamId() != null
                ? teamRepository.findById(collection.getTeamId()).map(Team::getName).orElse(null)
                : null;
        return CollectionDto.CollectionResponse.from(collection, teamName);
    }

    @Transactional
    public void delete(String userId, String id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        if (collection.getTeamId() != null) {
            TeamMember member = teamMemberRepository.findByTeamIdAndUserId(collection.getTeamId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Not a team member"));
        } else if (!collection.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Collection not found");
        }

        if (collection.isLocked()) {
            throw new IllegalArgumentException("Cannot delete a locked collection");
        }

        Collection learning = collectionRepository.findByUserIdAndName(userId, "Learning")
                .orElse(null);
        if (learning != null) {
            Query query = entityManager.createNativeQuery(
                    "UPDATE links SET collection_id = :learningId WHERE collection_id = :oldId AND user_id = :userId");
            query.setParameter("learningId", learning.getId());
            query.setParameter("oldId", id);
            query.setParameter("userId", userId);
            query.executeUpdate();
        }

        collectionRepository.delete(collection);
    }

    @Transactional
    public void reorder(String userId, List<String> ids) {
        List<Collection> collections = collectionRepository.findByUserIdOrderByOrderAsc(userId);
        for (int i = 0; i < ids.size(); i++) {
            String id = ids.get(i);
            int order = i;
            collections.stream()
                    .filter(c -> c.getId().equals(id))
                    .findFirst()
                    .ifPresent(c -> c.setOrder(order));
        }
        collectionRepository.saveAll(collections);
    }
}
