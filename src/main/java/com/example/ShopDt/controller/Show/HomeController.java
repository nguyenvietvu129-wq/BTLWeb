    package com.example.ShopDt.controller.Show;

    import org.springframework.stereotype.Controller;
    import org.springframework.ui.Model;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.PathVariable;

    @Controller("/api")
    public class HomeController {

        @GetMapping("/home")
        public String home() {
            // Điều hướng đến file index.html trong thư mục static
            return "index";
        }
        @GetMapping("/product/{id}")
        public String showProductDetail(@PathVariable Long id, Model model) {
            // Truyền id sang file HTML để Javascript có thể lấy được
            model.addAttribute("productId", id);
            return "product-detail";
        }
    }

