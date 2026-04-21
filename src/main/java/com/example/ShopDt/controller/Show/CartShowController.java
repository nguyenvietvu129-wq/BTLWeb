package com.example.ShopDt.controller.Show;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api")
public class CartShowController {

    @GetMapping("/cart")
    public String showCart() {
        return "giohang";
    }
}