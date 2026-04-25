package com.example.ShopDt.controller.Show;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller // Đã xóa bỏ @RequestMapping("/api")
public class CartShowController {

    @GetMapping("/cart")
    public String showCart() {
        return "cart"; // Đã sửa từ "giohang" thành "cart" để khớp với tên file cart.html
    }
}