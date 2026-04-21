package com.example.ShopDt.service;

import com.example.ShopDt.dto.request.CartRequest;
import com.example.ShopDt.dto.request.UpdateCartRequest;
import com.example.ShopDt.dto.response.CartResponse;
import com.example.ShopDt.entity.Cart;
import com.example.ShopDt.entity.Product;
import com.example.ShopDt.entity.User;
import com.example.ShopDt.mapper.cart.CartMapper;
import com.example.ShopDt.repository.CartRepository;
import com.example.ShopDt.repository.ProductRepository;
import com.example.ShopDt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {


    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartMapper cartMapper;

    //Lấy toàn bộ giỏ hàng của 1 user
    public List<CartResponse> getCartByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return cartRepository.findByUserId(userId)
                .stream()
                .map(cartMapper::toResponse)
                .collect(Collectors.toList());
    }

    // thêm sản phẩm vào giỏ
    public CartResponse addToCart(CartRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Kiểm tra số lượng sản phẩm còn lại
        int currentQuantityInCart = cartRepository.findByUserAndProduct(user, product)
                .map(Cart::getQuantity)
                .orElse(0);
        int totalRequested = currentQuantityInCart + request.getQuantity();
        
        if (totalRequested > product.getQuantity()) {
            throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng! Còn lại: " + product.getQuantity());
        }

        Cart cart = cartRepository.findByUserAndProduct(user, product)
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + request.getQuantity());
                    return existing;
                })
                .orElseGet(() -> new Cart(null, user, product, request.getQuantity()));

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    public void updateQuantity(List<UpdateCartRequest> updateCartRequest) {
        for  (UpdateCartRequest request : updateCartRequest) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            
            // Kiểm tra số lượng sản phẩm còn lại
            if (request.getQuantity() > product.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng! Còn lại: " + product.getQuantity());
            }
            
            Cart cart = cartRepository.findByUserAndProduct(user, product)
                    .orElseThrow(() -> new RuntimeException("Cart not found"));
            cart.setQuantity(request.getQuantity());
            cartRepository.save(cart);
        }
    }

    public void removeFromCart(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        Cart cart = cartRepository.findByUserAndProduct(user, product)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        cartRepository.delete(cart);
    }
}

