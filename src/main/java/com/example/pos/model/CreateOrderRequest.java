package com.example.pos.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateOrderRequest(
        String channel,
        String pointOfSale,
        String sellerName,
        String currency,
        BigDecimal subtotal,
        BigDecimal tax,
        BigDecimal total,
        List<OrderItemRequest> items,
        OffsetDateTime createdAt
) {
}
