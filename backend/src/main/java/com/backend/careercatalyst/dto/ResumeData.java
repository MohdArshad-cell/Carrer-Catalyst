package com.backend.careercatalyst.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeData {

    // JSON payload mein "personal_info" hai, toh yeh theek hai.
    @JsonProperty("personal_info")
    private PersonalInfo personalInfo;

    private List<Education> education;

    // YAHAN GALTI THI: Tune JSON mein "workExperience" bheja tha, aur yahan "work_experience" dhoondh raha tha.
    // Annotation hata diya hai taaki Jackson automatically "workExperience" map kare.
    private List<WorkExperience> workExperience;

    private List<Project> projects;
    private List<SkillItem> skills;
    private List<AchievementItem> achievements;
    private List<CertificationItem> certifications;
}