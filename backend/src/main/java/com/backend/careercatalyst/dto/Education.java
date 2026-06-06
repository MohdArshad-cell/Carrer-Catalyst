package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Education {

    private String degree;
    private String institution;

    // Jackson will automatically map this to "startYear"
    private String startYear;

    // Jackson will automatically map this to "endYear"
    private String endYear;

    // Postman sends "grade", so we tell Java to map "grade" to this variable
    @JsonProperty("grade")
    private String gpa; 
}