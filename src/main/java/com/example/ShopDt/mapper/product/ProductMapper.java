package com.example.ShopDt.mapper.product;

import com.example.ShopDt.entity.Product;
import com.example.ShopDt.dto.request.ProductRequest;
import com.example.ShopDt.dto.response.ProductResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toEntity(ProductRequest request);

    ProductResponse toResponse(Product product);

    // Dùng để update entity có sẵn từ request
    void updateEntity(@MappingTarget Product product, ProductRequest request);
}
