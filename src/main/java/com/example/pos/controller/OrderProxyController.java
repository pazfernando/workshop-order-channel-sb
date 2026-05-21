package com.example.pos.controller;

import com.example.pos.model.CreateOrderRequest;
import com.example.pos.model.OrderApiException;
import com.example.pos.model.OrderResponse;
import com.example.pos.service.OrderApiClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pos/orders")
public class OrderProxyController {

    private final OrderApiClient orderApiClient;

    public OrderProxyController(OrderApiClient orderApiClient) {
        this.orderApiClient = orderApiClient;
    }

    @PostMapping
    OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        return orderApiClient.createOrder(request);
    }

    @GetMapping("/{orderId}")
    OrderResponse getOrder(@PathVariable String orderId) {
        return orderApiClient.getOrder(orderId);
    }

    @ExceptionHandler(OrderApiException.class)
    ResponseEntity<Map<String, Object>> handleOrderApiException(OrderApiException exception) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        return ResponseEntity.status(status).body(Map.of(
                "message", exception.getMessage(),
                "upstreamStatus", exception.getStatusCode(),
                "upstreamBody", exception.getResponseBody()
        ));
    }
}
