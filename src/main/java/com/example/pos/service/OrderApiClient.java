package com.example.pos.service;

import com.example.pos.model.CreateOrderRequest;
import com.example.pos.model.OrderApiException;
import com.example.pos.model.OrderResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class OrderApiClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrderApiClient.class);

    private final WebClient orderApiWebClient;
    private final Counter ordersCreatedCounter;
    private final Counter orderLookupCounter;
    private final Timer createOrderTimer;
    private final Timer getOrderTimer;

    public OrderApiClient(WebClient orderApiWebClient, MeterRegistry meterRegistry) {
        this.orderApiWebClient = orderApiWebClient;
        this.ordersCreatedCounter = Counter.builder("pos_orders_created_total")
                .description("Ordenes creadas desde el canal POS fisico")
                .register(meterRegistry);
        this.orderLookupCounter = Counter.builder("pos_order_lookup_total")
                .description("Consultas de ordenes ejecutadas desde el POS")
                .register(meterRegistry);
        this.createOrderTimer = Timer.builder("pos_order_create_duration")
                .description("Duracion de creacion de orden contra API externa")
                .register(meterRegistry);
        this.getOrderTimer = Timer.builder("pos_order_lookup_duration")
                .description("Duracion de consulta de orden contra API externa")
                .register(meterRegistry);
    }

    public OrderResponse createOrder(CreateOrderRequest request) {
        LOGGER.info("event=order_create_attempt channel={} seller={} item_count={} total={}",
                request.channel(), request.sellerName(), request.items().size(), request.total());
        try {
            OrderResponse response = createOrderTimer.record(() -> orderApiWebClient.post()
                    .uri("/orders")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> clientResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> Mono.error(new OrderApiException(clientResponse.statusCode().value(), body))))
                    .bodyToMono(OrderResponse.class)
                    .block());
            ordersCreatedCounter.increment();
            LOGGER.info("event=order_create_success order_id={} total={}", response.getOrderId(), response.getTotal());
            return response;
        } catch (RuntimeException exception) {
            LOGGER.warn("event=order_create_failure message={}", exception.getMessage());
            throw exception;
        }
    }

    public OrderResponse getOrder(String orderId) {
        LOGGER.info("event=order_lookup_attempt order_id={}", orderId);
        try {
            OrderResponse response = getOrderTimer.record(() -> orderApiWebClient.get()
                    .uri("/orders/{orderId}", orderId)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> clientResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> Mono.error(new OrderApiException(clientResponse.statusCode().value(), body))))
                    .bodyToMono(OrderResponse.class)
                    .block());
            orderLookupCounter.increment();
            return response;
        } catch (RuntimeException exception) {
            LOGGER.warn("event=order_lookup_failure order_id={} message={}", orderId, exception.getMessage());
            throw exception;
        }
    }
}
