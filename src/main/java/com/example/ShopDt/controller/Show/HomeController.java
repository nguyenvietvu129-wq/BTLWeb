    package com.example.ShopDt.controller.Show;

    import org.springframework.stereotype.Controller;
    import org.springframework.web.bind.annotation.GetMapping;

    @Controller("/api")
    public class HomeController {

        @GetMapping("/home")
        public String home() {
            // Điều hướng đến file index.html trong thư mục static
            return "index";
        }
    }

