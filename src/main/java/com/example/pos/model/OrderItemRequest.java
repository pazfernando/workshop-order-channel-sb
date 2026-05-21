package com.example.pos.model;

import java.math.BigDecimal;

public record OrderItemRequest(
        String sku,
        String name,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
