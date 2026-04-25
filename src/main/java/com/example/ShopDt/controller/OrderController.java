package com.example.ShopDt.controller;

import com.example.ShopDt.dto.request.OrderRequest;
import com.example.ShopDt.dto.response.ApiResponse;
import com.example.ShopDt.dto.response.OrderResponse;
import com.example.ShopDt.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create")
    public OrderResponse createOrder(@RequestBody OrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponse> getOrderById(
            @PathVariable Long orderId,
            @RequestParam Long userId) {
        try {
            OrderResponse order = orderService.getOrderById(orderId, userId);
            return ApiResponse.<OrderResponse>builder()
                    .success(true)
                    .message("Lấy thông tin đơn hàng thành công")
                    .data(order)
                    .build();
        } catch (Exception ex) {
            return ApiResponse.<OrderResponse>builder()
                    .success(false)
                    .message("Lấy thông tin đơn hàng thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<OrderResponse>> getAllOrders() {
        try {
            List<OrderResponse> orders = orderService.getAllOrders();
            return ApiResponse.<List<OrderResponse>>builder()
                    .success(true)
                    .message("Lấy danh sách đơn hàng thành công")
                    .data(orders)
                    .build();
        } catch (Exception ex) {
            return ApiResponse.<List<OrderResponse>>builder()
                    .success(false)
                    .message("Lấy danh sách đơn hàng thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }
    // API cho Admin xem chi tiết đơn hàng
    @GetMapping("/admin/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> getOrderByIdForAdmin(@PathVariable Long orderId) {
        try {
            OrderResponse order = orderService.getOrderByIdForAdmin(orderId);
            return ApiResponse.<OrderResponse>builder()
                    .success(true)
                    .message("Lấy thông tin chi tiết đơn hàng thành công")
                    .data(order)
                    .build();
        } catch (Exception ex) {
            return ApiResponse.<OrderResponse>builder()
                    .success(false)
                    .message("Lấy thông tin thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }
}
