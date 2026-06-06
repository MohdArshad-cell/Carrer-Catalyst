package com.backend.careercatalyst.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TailorRequest {
    // These names MUST match the keys in the JSON payload
    private String resumeText;
    private String jobDescription;


}