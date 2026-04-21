package com.example.ShopDt.dto.request;

import lombok.Data;

@Data
public class UpdateCartRequest {
    private Long userId;
    private Long productId;
    private int quantity;
}
