package com.example.ShopDt.controller;

import com.example.ShopDt.dto.request.CartRequest;
import com.example.ShopDt.dto.request.UpdateCartRequest;
import com.example.ShopDt.dto.response.ApiResponse;
import com.example.ShopDt.dto.response.CartResponse;
import com.example.ShopDt.service.CartService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/carts")
@RequiredArgsConstructor
@Tag(name = "Cart")

public class CartController {
    final CartService cartService;

    @GetMapping("/{userId}")
    public ApiResponse<List<CartResponse>> getCart(@PathVariable long userId){
        try {
            List<CartResponse> cart = cartService.getCartByUserId(userId);
            return ApiResponse.<List<CartResponse>>builder()
                    .success(true)
                    .message("Mở giỏ hàng thành công")
                    .data(cart)
                    .build();
        } catch(Exception ex){
            return ApiResponse.<List<CartResponse>>builder()
                    .success(false)
                    .message("Mở giỏ hàng thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }

    @PostMapping("/add")
    public ApiResponse<CartResponse> addCart(@RequestBody CartRequest cartRequest){
        try{
             CartResponse cart = cartService.addToCart(cartRequest);
             return ApiResponse.<CartResponse>builder()
                     .success(true)
                     .message("Đã sản phẩm vào giỏ")
                     .data(cart)
                     .build();
        } catch(Exception ex){
            return ApiResponse.<CartResponse>builder()
                    .success(false)
                    .message("Không thêm được sản phẩm")
                    .error(ex.getMessage())
                    .build();
        }
    }

    @PutMapping("/update")
    public ApiResponse<Void> updateQuantity(@RequestBody UpdateCartRequest request){
        try{
            cartService.updateQuantity(java.util.List.of(request));
            return ApiResponse.<Void>builder()
                        .success(true)
                        .message("cập nhật thành công")
                        .build();
        } catch(Exception ex){
            return ApiResponse.<Void>builder()
                        .success(false)
                        .message("Cập nhật thất bại")
                        .error(ex.getMessage())
                        .build();
        }
    }

    @DeleteMapping("/{userId}/{productId}")
    public ApiResponse<Void> deleteCart(@PathVariable Long userId, @PathVariable Long productId){
        try{
            cartService.removeFromCart(userId, productId);
            return ApiResponse.<Void>builder()
                    .success(true)
                    .message("xóa thành công")
                    .build();
        }  catch(Exception ex){
            return ApiResponse.<Void>builder()
                    .success(false)
                    .message("xóa thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }
}
