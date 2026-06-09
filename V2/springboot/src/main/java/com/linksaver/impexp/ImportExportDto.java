package com.linksaver.impexp;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ImportExportDto {

    public static class ImportLink {
        @NotBlank
        public String url;

        public String title;
        public String description;
        public String notes;
        public String collection;
        public List<String> tags;
        public String createdAt;
    }

    public static class ImportRequest {
        public List<ImportLink> links;
    }
}
