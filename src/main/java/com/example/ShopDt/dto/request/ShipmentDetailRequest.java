package com.example.ShopDt.dto.request;

import lombok.Data;

@Data
public class ShipmentDetailRequest {
    private Long userId;
    private String address;
    private String phoneNumber;
    private String receiver;
}
