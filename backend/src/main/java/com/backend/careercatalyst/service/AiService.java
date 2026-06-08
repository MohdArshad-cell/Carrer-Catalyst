package com.backend.careercatalyst.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiService {

    private final WebClient webClient;

    @Autowired
    public AiService(WebClient.Builder webClientBuilder,
                     @Value("${python.service.url:http://localhost:8000}") String pythonServiceUrl) {
        
        // Memory buffer badha diya hai taaki heavy LaTeX aur JSON files memory mein truncate na ho
        this.webClient = webClientBuilder
                .baseUrl(pythonServiceUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    /**
     * Connects to FastAPI for AI Resume Tailor.
     */
    public String getTailoredResume(String resume, String jobDescription) {
        Map<String, String> body = new HashMap<>();
        body.put("resumeText", resume != null ? resume : "");
        body.put("jobDescription", jobDescription != null ? jobDescription : "");

        // 🚨 CRITICAL FIX: Returing RAW String. 
        // Do NOT parse it into a Map to look for "tailored_content" because Python now sends "latex_code" and "pdf_base64"
        return this.webClient.post()
                .uri("/api/ai/tailor")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    /**
     * Connects to FastAPI for ATS Evaluator.
     */
    public String getEvaluationResult(String resume, String jobDescription) {
        Map<String, String> body = new HashMap<>();
        body.put("resumeText", resume != null ? resume : "");
        body.put("jobDescription", jobDescription != null ? jobDescription : "");

        Map response = this.webClient.post()
                .uri("/api/ai/evaluate")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return response != null ? (String) response.get("evaluation_result") : "";
    }

    /**
     * Connects to FastAPI for Cover Letter Generation.
     */
    public String getGeneratedCoverLetter(String resume, String jobDescription) {
        Map<String, String> body = new HashMap<>();
        body.put("resumeText", resume != null ? resume : "");
        body.put("jobDescription", jobDescription != null ? jobDescription : "");

        Map response = this.webClient.post()
                .uri("/api/ai/coverletter")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return response != null ? (String) response.get("cover_letter") : "";
    }

    /**
     * Connects to FastAPI for AI Mock Interview Generation.
     */
    public String getInterviewQuestions(String jobDescription) {
        Map<String, String> body = new HashMap<>();
        body.put("jobDescription", jobDescription != null ? jobDescription : "");

        // Returns raw JSON string directly as expected by your ApiController
        return this.webClient.post()
                .uri("/api/ai/interview")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}