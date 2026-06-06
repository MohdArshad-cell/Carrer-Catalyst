package com.backend.careercatalyst.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationRequest {
    private String resume;
    private String jobDescription;


}