package com.backend.careercatalyst.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {
    private String content; // JSON string of questions

}