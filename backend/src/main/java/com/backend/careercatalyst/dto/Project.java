package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    // Jackson will automatically map this to "projectName"
    private String projectName;

    // Jackson will automatically map this to "startDate"
    private String startDate;

    // Jackson will automatically map this to "endDate"
    private String endDate;

    // Isko annotation chahiye kyunki Postman mein "tech_stack" bheja tha
    @JsonProperty("tech_stack")
    private String techStack;

    // Jackson will automatically map this to "descriptionPoints"
    private List<String> descriptionPoints;
}