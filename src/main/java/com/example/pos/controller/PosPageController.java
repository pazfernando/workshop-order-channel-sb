package com.example.pos.controller;

import com.example.pos.service.ProductCatalog;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PosPageController {

    private final ProductCatalog productCatalog;

    public PosPageController(ProductCatalog productCatalog) {
        this.productCatalog = productCatalog;
    }

    @GetMapping("/")
    String index(Model model) {
        model.addAttribute("products", productCatalog.getProducts());
        model.addAttribute("taxRate", "0.19");
        model.addAttribute("cashRegister", "Caja #01");
        return "pos";
    }
}
