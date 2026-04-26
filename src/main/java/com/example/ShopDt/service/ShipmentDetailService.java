package com.example.ShopDt.service;

import com.example.ShopDt.dto.request.ShipmentDetailRequest;
import com.example.ShopDt.dto.response.ShipmentDetailResponse;
import com.example.ShopDt.entity.ShipmentDetail;
import com.example.ShopDt.entity.User;
import com.example.ShopDt.mapper.shipment_detail.ShipmentDetailMapper;
import com.example.ShopDt.repository.ShipmentDetailRepository;
import com.example.ShopDt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShipmentDetailService {

    private final ShipmentDetailRepository shipmentDetailRepository;
    private final ShipmentDetailMapper shipmentDetailMapper;
    private final UserRepository userRepository;

    public ShipmentDetailResponse getShipmentDetailByUser(Long userId) {
        ShipmentDetail detail = shipmentDetailRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ giao hàng của user"));
        return shipmentDetailMapper.toResponse(detail);
    }

    public ShipmentDetailResponse createShipmentDetail(ShipmentDetailRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        ShipmentDetail detail = shipmentDetailMapper.toEntity(request, user);

        ShipmentDetail saved = shipmentDetailRepository.save(detail);
        return shipmentDetailMapper.toResponse(saved);
    }

    /**
     * Cập nhật shipment detail
     */
    public ShipmentDetailResponse updateShipmentDetail(ShipmentDetailRequest request) {
        ShipmentDetail detail = shipmentDetailRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy shipment detail"));

        shipmentDetailMapper.updateEntity(detail, request);
        ShipmentDetail updated = shipmentDetailRepository.save(detail);

        return shipmentDetailMapper.toResponse(updated);
    }
}
