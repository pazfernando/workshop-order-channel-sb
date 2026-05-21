package com.example.pos.service;

import com.example.pos.model.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ProductCatalog {

    private final List<Product> products = List.of(
            new Product("LAPTOP-001", "Laptop", new BigDecimal("1299.00")),
            new Product("MOUSE-001", "Mouse", new BigDecimal("24.90")),
            new Product("KEYBOARD-001", "Teclado", new BigDecimal("69.90")),
            new Product("MONITOR-001", "Monitor", new BigDecimal("349.00")),
            new Product("USB-001", "USB", new BigDecimal("14.50")),
            new Product("HDMI-001", "Cable HDMI", new BigDecimal("12.90"))
    );

    public List<Product> getProducts() {
        return products;
    }
}
