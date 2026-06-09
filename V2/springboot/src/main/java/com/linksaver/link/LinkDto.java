package com.linksaver.link;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class LinkDto {

    public static class CreateRequest {
        @NotBlank
        public String url;

        @NotBlank @Size(max = 255)
        public String title;

        public String description;
        public String notes;
        public String faviconUrl;
        public String imageUrl;

        public String collectionId;

        public String teamProjectId;

        public List<String> tags;
    }

    public static class UpdateRequest {
        @Size(max = 255)
        public String title;
        public String description;
        public String notes;
        public String faviconUrl;
        public String imageUrl;
        public String collectionId;
        public String teamProjectId;
        public List<String> tags;
    }

    public static class BulkMoveRequest {
        public List<String> ids;
        @NotBlank
        public String collectionId;
    }

    public static class BulkDeleteRequest {
        public List<String> ids;
    }

    public static class CollectionInfo {
        public String id;
        public String name;
        public String color;

        public CollectionInfo(String id, String name, String color) {
            this.id = id;
            this.name = name;
            this.color = color;
        }
    }

    public static class LinkResponse {
        public String id;
        public String url;
        public String title;
        public String description;
        public String faviconUrl;
        public String imageUrl;
        public String notes;
        public String collectionId;
        public String collectionName;
        public CollectionInfo collection;
        public String teamProjectId;
        public int openCount;
        public boolean isFavorited;
        public Set<String> tags;
        public String createdAt;
        public String updatedAt;

        public static LinkResponse from(Link link, com.linksaver.collection.Collection col, boolean isFavorited) {
            LinkResponse r = new LinkResponse();
            r.id = link.getId();
            r.url = link.getUrl();
            r.title = link.getTitle();
            r.description = link.getDescription();
            r.faviconUrl = link.getFaviconUrl();
            r.imageUrl = link.getImageUrl();
            r.notes = link.getNotes();
            r.collectionId = link.getCollectionId();
            r.collectionName = col != null ? col.getName() : null;
            r.collection = col != null ? new CollectionInfo(col.getId(), col.getName(), col.getColor()) : null;
            r.teamProjectId = link.getTeamProjectId();
            r.openCount = link.getOpenCount();
            r.isFavorited = isFavorited;
            r.tags = link.getTags().stream().map(t -> t.getName()).collect(Collectors.toSet());
            r.createdAt = link.getCreatedAt() != null ? link.getCreatedAt().toString() : null;
            r.updatedAt = link.getUpdatedAt() != null ? link.getUpdatedAt().toString() : null;
            return r;
        }
    }

    public static class PaginatedResponse {
        public List<LinkResponse> links;
        public long total;
        public int page;
        public int limit;

        public static PaginatedResponse of(List<LinkResponse> links, long total, int page, int limit) {
            PaginatedResponse r = new PaginatedResponse();
            r.links = links;
            r.total = total;
            r.page = page;
            r.limit = limit;
            return r;
        }
    }
}
