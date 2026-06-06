package com.backend.careercatalyst.service;

import com.backend.careercatalyst.dto.GenerateRequest;
import com.backend.careercatalyst.exception.PythonServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class ResumeGenerationService {

    private final WebClient webClient;

    @Autowired
    public ResumeGenerationService(WebClient.Builder webClientBuilder,
                                   @Value("${python.service.url:http://localhost:8000}") String pythonServiceUrl) {
        this.webClient = webClientBuilder
                .baseUrl(pythonServiceUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(20 * 1024 * 1024))
                .build();
    }

    /**
     * Streams the ZIP file directly from Python into Memory. No Saving.
     */
    public Mono<byte[]> generateResumeZip(GenerateRequest generateRequest) {
        return this.webClient.post()
            .uri("/generate")
            .bodyValue(generateRequest)
            .retrieve()
            .bodyToMono(byte[].class)
            .timeout(Duration.ofMinutes(2))
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                    .filter(throwable -> throwable instanceof WebClientResponseException &&
                            ((WebClientResponseException) throwable).getStatusCode().is5xxServerError()))
            .onErrorMap(ex -> new PythonServiceException("Failed to stream response from Python AI Service: " + ex.getMessage(), ex));
    }
}