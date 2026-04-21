package com.example.ShopDt.controller;

import com.example.ShopDt.repository.OrderRepository;
import com.example.ShopDt.repository.ProductRepository;
import com.example.ShopDt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @GetMapping
    public String adminDashboard(Model model) {
        // Lấy thông tin username từ SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "Admin";

        // Thống kê tổng quan
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        Long totalRevenue = orderRepository.sumTotalPriceByCompletedOrders();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", totalProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("totalUsers", totalUsers);
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0L);

        model.addAttribute("stats", stats);
        model.addAttribute("adminName", username);  // Thêm dòng này

        return "admin/admin-dashboard";
    }
}