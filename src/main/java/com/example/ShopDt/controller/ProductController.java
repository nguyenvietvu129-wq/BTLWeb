package com.example.ShopDt.controller;

import com.example.ShopDt.dto.request.ProductRequest;
import com.example.ShopDt.dto.request.ProductSearchRequest;
import com.example.ShopDt.dto.response.ApiResponse;
import com.example.ShopDt.dto.response.PaginatedResponse;
import com.example.ShopDt.dto.response.ProductResponse;
import com.example.ShopDt.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product")

public class ProductController {
    private final ProductService productService;

//    @GetMapping("/search")
//    @Operation(summary = "Tìm kiếm sản phẩm theo tiêu chí (có phân trang và sắp xếp)")
//    public ApiResponse<PaginatedResponse<ProductResponse>> searchProducts(
//            @Parameter(description = "Tiêu chí tìm kiếm")
//            @ModelAttribute ProductSearchRequest searchRequest,
//            @Parameter(description = "Số trang (bắt đầu từ 0)", example = "0")
//            @RequestParam(defaultValue = "0") int page,
//            @Parameter(description = "Số lượng sản phẩm mỗi trang", example = "10")
//            @RequestParam(defaultValue = "10") int size) {
//        try {
//            PaginatedResponse<ProductResponse> result = productService.searchProducts(
//                    searchRequest, page, size);
//            return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
//                    .success(true)
//                    .message("Tìm kiếm sản phẩm thành công")
//                    .data(result)
//                    .build();
//        } catch (Exception ex) {
//            return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
//                    .success(false)
//                    .message("Tìm kiếm sản phẩm thất bại: " + ex.getMessage())
//                    .error(ex.getMessage())
//                    .build();
//        }
//    }

//    @GetMapping("/all")
//    @Operation(summary = "Lấy tất cả sản phẩm (không phân trang)")
//    public ApiResponse<List<ProductResponse>> getAllProductsWithoutPagination() {
//        try {
//            List<ProductResponse> products = productService.findAll();
//            return ApiResponse.<List<ProductResponse>>builder()
//                    .success(true)
//                    .message("Lấy danh sách sản phẩm thành công")
//                    .data(products)
//                    .build();
//        } catch (Exception ex) {
//            return ApiResponse.<List<ProductResponse>>builder()
//                    .success(false)
//                    .message("Lấy danh sách sản phẩm thất bại")
//                    .error(ex.getMessage())
//                    .build();
//        }
//    }
    @GetMapping("/all")
    @Operation(summary = "Lấy danh sách sản phẩm (có phân trang)")
    public ApiResponse<PaginatedResponse<ProductResponse>> getAllProducts(
            @Parameter(description = "Số trang (bắt đầu từ 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số lượng sản phẩm mỗi trang", example = "10")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Trường sắp xếp (id, name, price, quantity)", example = "id")
            @RequestParam(required = false) String sortBy,
            @Parameter(description = "Hướng sắp xếp (asc, desc)", example = "asc")
            @RequestParam(required = false) String sortDir) {
        try {
            PaginatedResponse<ProductResponse> result = productService.findAllPaginated(page, size, sortBy, sortDir);
            return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                    .success(true)
                    .message("Lấy danh sách sản phẩm thành công")
                    .data(result)
                    .build();
        } catch (Exception ex) {
            return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                    .success(false)
                    .message("Lấy danh sách sản phẩm thất bại")
                    .error(ex.getMessage())
                    .build();
        }
    }

    @GetMapping("/{id}")
    public  ProductResponse getProductById(@PathVariable long id){
        return  productService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse addProduct(@RequestBody ProductRequest request){
        return productService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse updateProduct(@PathVariable long id, @RequestBody ProductRequest request){
        return productService.update(id,request);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(@PathVariable long id){
        productService.delete(id);
    }
}
