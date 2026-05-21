package com.spamclassifier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Entry point for the Spam Classifier Spring Boot application.
 *
 * Registers a RestTemplate bean used by SpamService to call the Flask ML service.
 */
@SpringBootApplication
public class SpamClassifierApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpamClassifierApplication.class, args);
    }

    /**
     * RestTemplate is the Spring HTTP client used to call the Flask ML API.
     * Declared as a bean so it can be injected wherever needed.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
