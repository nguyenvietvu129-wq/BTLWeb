package com.example.ShopDt.service;

import com.example.ShopDt.dto.request.OrderRequest;
import com.example.ShopDt.dto.response.OrderResponse;
import com.example.ShopDt.entity.*;
import com.example.ShopDt.mapper.order.OrderMapper;
import com.example.ShopDt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderDetailRepository orderDetailRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;
    private final ShipmentDetailRepository shipmentDetailRepository;

    public OrderResponse createOrder(OrderRequest request) {
        Long userId = request.getUserId();

        // Lấy giỏ hàng
        List<Cart> cartItems = cartRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // Lấy shipment detail
        ShipmentDetail shipmentDetail = null;
        if (request.getShipmentDetailId() != null) {
            shipmentDetail = shipmentDetailRepository.findById(request.getShipmentDetailId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy shipment detail"));
        }

        // Tạo order
        Order order = new Order();
        order.setUser(user);
        order.setShipmentDetails(shipmentDetail);
        order.setCreateAt(LocalDateTime.now());
        order.setStatus(1);
        order.setNote(request.getNote());
        order.setTotalPrice(0f);
        order = orderRepository.save(order);

        float totalPrice = 0f;
        for (Cart cart : cartItems) {
            Product product = cart.getProduct();
            if (product.getQuantity() < cart.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ tồn kho!");
            }

            OrderDetail detail = new OrderDetail();
            detail.setOrders(order);
            detail.setProduct(product);
            detail.setQuantity(cart.getQuantity());
            detail.setPrice(product.getPrice() * cart.getQuantity());
            detail.setStatus(1);
            orderDetailRepository.save(detail);

            product.setQuantity(product.getQuantity() - cart.getQuantity());
            productRepository.save(product);

            totalPrice += detail.getPrice();
        }

        order.setTotalPrice(totalPrice);
        orderRepository.save(order);

        cartRepository.deleteAll(cartItems);

        return orderMapper.toOrderResponse(order);
    }

    public OrderResponse getOrderById(Long orderId, Long userId) {  // Added userId parameter
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem đơn hàng này. Kiểm tra userId hoặc token của bạn.");
        }

        return orderMapper.toOrderResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(orderMapper::toOrderResponse)
                .toList();
    }
}
