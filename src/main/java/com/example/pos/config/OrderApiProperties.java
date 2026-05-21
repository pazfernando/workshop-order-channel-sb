package com.example.pos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "order-api")
public record OrderApiProperties(String baseUrl) {
}
