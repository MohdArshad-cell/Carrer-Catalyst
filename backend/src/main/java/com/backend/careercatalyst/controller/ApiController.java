package com.backend.careercatalyst.controller;

import com.backend.careercatalyst.dto.*;
import com.backend.careercatalyst.service.AiService;
import com.backend.careercatalyst.service.ResumeGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    private static final Logger logger = LoggerFactory.getLogger(ApiController.class);

    private final ResumeGenerationService resumeGenerationService;
    private final AiService aiService;

    @Autowired
    public ApiController(ResumeGenerationService resumeGenerationService, AiService aiService) {
        this.resumeGenerationService = resumeGenerationService;
        this.aiService = aiService;
    }

    // --- DOWNLOAD ENDPOINT: Returns ZIP file ---
    @PostMapping(value = "/generate", produces = "application/zip")
    public Mono<ResponseEntity<byte[]>> generateResume(@RequestBody GenerateRequest generateRequest) {
        return resumeGenerationService.generateResumeZip(generateRequest)
                .map(zipBytes -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("application/zip"));
                    // 'attachment' forces browser to download the file
                    headers.setContentDispositionFormData("attachment", "hireease_resume_files.zip");
                    return new ResponseEntity<>(zipBytes, headers, HttpStatus.OK);
                })
                .onErrorResume(e -> {
                    logger.error("Critical: Failed to generate and stream resume zip.", e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    // --- PREVIEW ENDPOINT: Extracts and returns ONLY the PDF ---
    @PostMapping(value = "/preview", produces = MediaType.APPLICATION_PDF_VALUE)
    public Mono<ResponseEntity<byte[]>> previewResume(@RequestBody GenerateRequest generateRequest) {
        return resumeGenerationService.generateResumeZip(generateRequest)
                .flatMap(zipBytes -> {
                    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
                        ZipEntry entry;
                        byte[] pdfBytes = null;
                        
                        // Extract only the PDF from the zip stream
                        while ((entry = zis.getNextEntry()) != null) {
                            if (entry.getName().toLowerCase().endsWith(".pdf")) {
                                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                byte[] buffer = new byte[1024];
                                int len;
                                while ((len = zis.read(buffer)) > 0) {
                                    baos.write(buffer, 0, len);
                                }
                                pdfBytes = baos.toByteArray();
                                break; // Found the PDF, stop parsing
                            }
                            zis.closeEntry();
                        }
                        
                        if (pdfBytes == null) {
                            logger.error("Preview Failed: No PDF found inside the generated zip.");
                            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).<byte[]>build());
                        }

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        // 'inline' forces the browser to display it in the iframe instead of downloading
                        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"");
                        return Mono.just(new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK));

                    } catch (IOException e) {
                        logger.error("Failed to extract PDF from generated zip for preview.", e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).<byte[]>build());
                    }
                })
                .onErrorResume(e -> {
                    logger.error("Failed to process resume preview stream.", e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    // --- UPDATED TAILOR ENDPOINT ---
    // Returns exact JSON from Python so React can read latex_code and pdf_base64 directly
    @PostMapping(value = "/tailor", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<String>> tailorResume(@RequestBody TailorRequest request) {
        return Mono.fromCallable(() -> aiService.getTailoredResume(request.getResumeText(), request.getJobDescription()))
                .subscribeOn(Schedulers.boundedElastic())
                .map(rawJsonFromPython -> {
                    // We DO NOT wrap this in TailorResponse anymore. 
                    // We send the raw JSON string directly to the frontend.
                    return ResponseEntity.ok(rawJsonFromPython);
                })
                .onErrorResume(e -> {
                    logger.error("AI Tailoring Service failed.", e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("{\"error\": \"An error occurred while processing the AI request.\"}"));
                });
    }

    @PostMapping("/evaluate-resume")
    public Mono<ResponseEntity<EvaluationResponse>> evaluateResume(@RequestBody EvaluationRequest request) {
        return Mono.fromCallable(() -> aiService.getEvaluationResult(request.getResume(), request.getJobDescription()))
                .subscribeOn(Schedulers.boundedElastic())
                .map(evaluationContent -> ResponseEntity.ok(new EvaluationResponse(evaluationContent)))
                .onErrorResume(e -> {
                    logger.error("AI ATS Evaluation failed.", e);
                    EvaluationResponse errorResponse = new EvaluationResponse("ATS Evaluation is currently unavailable.");
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
                });
    }

    @PostMapping("/generate-cover-letter")
    public Mono<ResponseEntity<CoverLetterResponse>> generateCoverLetter(@RequestBody CoverLetterRequest request) {
        return Mono.fromCallable(() -> aiService.getGeneratedCoverLetter(request.getResumeText(), request.getJobDescription()))
                .subscribeOn(Schedulers.boundedElastic())
                .map(coverLetterContent -> ResponseEntity.ok(new CoverLetterResponse(coverLetterContent)))
                .onErrorResume(e -> {
                    logger.error("AI Cover Letter Generation failed.", e);
                    CoverLetterResponse errorResponse = new CoverLetterResponse("Cover Letter generation failed. Please try again.");
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
                });
    }

    @PostMapping("/interview/generate")
    public Mono<ResponseEntity<InterviewResponse>> generateInterviewQuestions(@RequestBody String jobDescription) {
        return Mono.fromCallable(() -> aiService.getInterviewQuestions(jobDescription))
                .subscribeOn(Schedulers.boundedElastic())
                .map(jsonContent -> ResponseEntity.ok(new InterviewResponse(jsonContent)))
                .onErrorResume(e -> {
                    logger.error("AI Interview Generation failed.", e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new InterviewResponse("{\"error\": \"Failed to generate interview questions.\"}")));
                });
    }    
}