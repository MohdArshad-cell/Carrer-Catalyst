package com.backend.careercatalyst.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoverLetterRequest {
    private String resumeText; // 'resumeText' use karo taaki baaki DTOs aur Python API ke sath naming consistent rahe
    private String jobDescription;
}