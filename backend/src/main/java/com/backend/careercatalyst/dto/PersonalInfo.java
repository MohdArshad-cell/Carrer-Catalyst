package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalInfo {

    // Removed the wrong snake_case annotation. Jackson will default to "fullName"
    private String fullName;
    
    private String address;
    private String email;
    private String phone;

    // Postman sends "github", Python expects "github". Tell Java to map it exactly.
    @JsonProperty("github")
    private String githubHandle;

    @JsonProperty("linkedin")
    private String linkedinHandle;

    @JsonProperty("portfolioUrl")
    private String portfolioUrl;

    @JsonProperty("extraInfo")
    private String extraInfo;
}