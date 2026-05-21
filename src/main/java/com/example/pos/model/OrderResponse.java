package com.example.pos.model;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderResponse {

    @JsonAlias({"order_id", "orderNumber", "order_number"})
    private String orderId;
    private String id;
    @JsonAlias({"orderStatus", "order_status"})
    private String status;
    @JsonAlias({"totalAmount", "total_amount"})
    private BigDecimal total;
    @JsonAlias({"created_at", "timestamp"})
    private OffsetDateTime createdAt;
    private final Map<String, Object> additionalProperties = new LinkedHashMap<>();

    public String getOrderId() {
        return orderId != null ? orderId : id;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return additionalProperties;
    }

    @JsonAnySetter
    public void addAdditionalProperty(String key, Object value) {
        additionalProperties.put(key, value);
    }
}
