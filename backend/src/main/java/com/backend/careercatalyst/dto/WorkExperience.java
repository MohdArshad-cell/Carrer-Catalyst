package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkExperience {

    // Postman se "role" aa raha hai, usko is jobTitle variable se map kar.
    @JsonProperty("role")
    private String jobTitle;

    // Postman se "company" aa raha hai.
    @JsonProperty("company")
    private String companyName;

    private String location;

    // Jackson will automatically map this to "startDate"
    private String startDate;

    // Jackson will automatically map this to "endDate"
    private String endDate;

    // Jackson will automatically map this to "descriptionPoints"
    private List<String> descriptionPoints;
}