package com.example.ShopDt.dto.request;

import lombok.Data;

@Data
public class OrderRequest {
    private Long userId;
    private String note;
    private Long shipmentDetailId;
}
