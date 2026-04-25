package com.example.ShopDt.mapper.product;

import com.example.ShopDt.dto.response.CategoryResponse;
import com.example.ShopDt.entity.Product;
import com.example.ShopDt.dto.request.ProductRequest;
import com.example.ShopDt.dto.response.ProductResponse;
import com.example.ShopDt.entity.ProductCategory;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.springframework.web.bind.annotation.Mapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toEntity(ProductRequest request);

    ProductResponse toResponse(Product product);

    // Dùng để update entity có sẵn từ request
    void updateEntity(@MappingTarget Product product, ProductRequest request);
}
