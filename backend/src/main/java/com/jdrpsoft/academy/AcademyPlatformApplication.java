package com.jdrpsoft.academy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AcademyPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademyPlatformApplication.class, args);
    }
}
