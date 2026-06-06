package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateRequest {

    @JsonProperty("template_name")
    private String templateName;

    @JsonProperty("resume_data")
    private ResumeData resumeData;

    
}