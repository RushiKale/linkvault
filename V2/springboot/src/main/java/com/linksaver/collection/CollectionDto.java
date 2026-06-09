package com.linksaver.collection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CollectionDto {

    public static class CreateRequest {
        @NotBlank @Size(max = 100)
        public String name;

        public String color;

        public String teamId;
    }

    public static class UpdateRequest {
        @Size(max = 100)
        public String name;

        public String color;

        public Integer order;
    }

    public static class ReorderRequest {
        public List<String> ids;
    }

    public static class CollectionResponse {
        public String id;
        public String name;
        public String color;
        public int order;
        public boolean locked;
        public String createdAt;
        public String teamId;
        public String teamName;

        public static CollectionResponse from(Collection c, String teamName) {
            CollectionResponse r = new CollectionResponse();
            r.id = c.getId();
            r.name = c.getName();
            r.color = c.getColor();
            r.order = c.getOrder();
            r.locked = c.isLocked();
            r.createdAt = c.getCreatedAt() != null ? c.getCreatedAt().toString() : null;
            r.teamId = c.getTeamId();
            r.teamName = teamName;
            return r;
        }
    }
}
