package com.example.ShopDt.service;

import com.example.ShopDt.dto.request.ProductRequest;
import com.example.ShopDt.dto.request.ProductSearchRequest;
import com.example.ShopDt.dto.response.PaginatedResponse;
import com.example.ShopDt.dto.response.ProductResponse;
import com.example.ShopDt.entity.Product;
import com.example.ShopDt.mapper.product.ProductMapper;
import com.example.ShopDt.repository.ProductRepository;
import com.example.ShopDt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public List<ProductResponse> findAll() {
        return productRepository.findAll()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public PaginatedResponse<ProductResponse> searchProducts(
            ProductSearchRequest searchRequest, int page, int size) {

        // Validate page và size
        page = Math.max(page, 0);
        size = (size <= 0) ? 10 : size;

        // Xử lý sắp xếp từ searchRequest hoặc mặc định
        Sort sort = buildSort(searchRequest);
        Pageable pageable = PageRequest.of(page, size, sort);

        // Thực hiện tìm kiếm với các tiêu chí
        Page<Product> productPage = productRepository.searchProducts(
                searchRequest.getKeyword(),
                searchRequest.getListCategoryId(),
                searchRequest.getMinPrice(),
                searchRequest.getMaxPrice(),
                pageable
        );

        // Map sang response
        List<ProductResponse> productResponses = productPage.getContent()
                .stream()
                .map(productMapper::toResponse)
                .toList();

        // Trả về kết quả phân trang
        return PaginatedResponse.<ProductResponse>builder()
                .content(productResponses)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .first(productPage.isFirst())
                .last(productPage.isLast())
                .hasNext(productPage.hasNext())
                .hasPrevious(productPage.hasPrevious())
                .build();
    }
    private Sort buildSort(ProductSearchRequest searchRequest) {
        String sortBy = "id";
        String sortDir = "asc";

        if (searchRequest.getSort() != null && !searchRequest.getSort().isEmpty()) {
            String[] sortParams = searchRequest.getSort().split(",");
            sortBy = sortParams[0];
            if (sortParams.length > 1) {
                sortDir = sortParams[1];
            }
        }

        // Validate sortBy để tránh SQL injection
        List<String> allowedFields = Arrays.asList("id", "name", "price", "quantity");
        if (!allowedFields.contains(sortBy)) {
            sortBy = "id";
        }

        return sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
    }
    public PaginatedResponse<ProductResponse> findAllPaginated(int page, int size, String sortBy, String sortDir) {
        // Validate và set giá trị mặc định
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (sortBy == null || sortBy.isEmpty()) sortBy = "id";
        if (sortDir == null || sortDir.isEmpty()) sortDir = "asc";

        // Tạo Sort object
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        // Tạo Pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Lấy dữ liệu phân trang
        Page<Product> productPage = productRepository.findAll(pageable);

        // Map sang ProductResponse
        List<ProductResponse> productResponses = productPage.getContent()
                .stream()
                .map(productMapper::toResponse)
                .toList();

        // Tạo PaginatedResponse
        return PaginatedResponse.<ProductResponse>builder()
                .content(productResponses)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .first(productPage.isFirst())
                .last(productPage.isLast())
                .hasNext(productPage.hasNext())
                .hasPrevious(productPage.hasPrevious())
                .build();
    }



    public ProductResponse findById(long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return productMapper.toResponse(product);
    }

    public ProductResponse create(ProductRequest productRequest) {
        Product product = productMapper.toEntity(productRequest);
        return productMapper.toResponse(productRepository.save(product));
    }
    public ProductResponse update(long id, ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Đã xóa phần chỉ cập nhật số lượng, thay bằng cập nhật toàn bộ:
        product.setName(productRequest.getName());
        product.setPrice(productRequest.getPrice());
        product.setQuantity(productRequest.getQuantity());
        product.setDescription(productRequest.getDescription());
        product.setStatus(productRequest.getStatus());

        // Nếu có gửi link ảnh mới thì cập nhật, không thì giữ nguyên ảnh cũ
        if (productRequest.getImage() != null && !productRequest.getImage().isEmpty()) {
            product.setImage(productRequest.getImage());
        }

        return productMapper.toResponse(productRepository.save(product));
    }

    // Thêm hàm lấy sản phẩm theo danh mục
    // Thêm hàm lấy sản phẩm theo danh mục
    public PaginatedResponse<ProductResponse> findByCategoryIdPaginated(Long categoryId, int page, int size) {
        // Tạo đối tượng phân trang
        Pageable pageable = PageRequest.of(page, size);

        // Lấy dữ liệu từ DB
        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);

        // ĐÃ SỬA: Dùng productMapper::toResponse
        List<ProductResponse> content = productPage.getContent().stream()
                .map(productMapper::toResponse)
                .toList();

        // ĐÃ SỬA: Đóng gói chuẩn theo thuộc tính của PaginatedResponse.java
        return PaginatedResponse.<ProductResponse>builder()
                .content(content)
                .page(productPage.getNumber())           // Sửa thành page
                .size(productPage.getSize())             // Sửa thành size
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .first(productPage.isFirst())            // Thêm các thuộc tính cờ
                .last(productPage.isLast())
                .hasNext(productPage.hasNext())
                .hasPrevious(productPage.hasPrevious())
                .build();
    }

    public void delete(long id){
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        productRepository.delete(product);
    }
}
