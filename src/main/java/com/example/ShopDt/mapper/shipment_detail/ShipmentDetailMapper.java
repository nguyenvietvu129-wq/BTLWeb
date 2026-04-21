package com.example.ShopDt.mapper.shipment_detail;

import com.example.ShopDt.dto.request.ShipmentDetailRequest;
import com.example.ShopDt.dto.response.ShipmentDetailResponse;
import com.example.ShopDt.entity.ShipmentDetail;
import com.example.ShopDt.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ShipmentDetailMapper {

    // Tạo mới shipment detail
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", source = "user")
    ShipmentDetail toEntity(ShipmentDetailRequest request, User user);

    // Map sang DTO phản hồi
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.username")
    ShipmentDetailResponse toResponse(ShipmentDetail shipmentDetail);

    // Cập nhật shipment detail
    void updateEntity(@MappingTarget ShipmentDetail entity, ShipmentDetailRequest request);
}


