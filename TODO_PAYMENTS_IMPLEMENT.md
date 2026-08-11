# TODO thanh toán - checklist triển khai

## Backend
- [ ] Tạo `PaymentRepository`
- [ ] Tạo `PaymentService`
- [ ] Tạo `PaymentController`
- [ ] Tạo `PaymentDTO` / `PaymentMapper`
- [ ] Implement API:
  - [ ] `GET /order/{orderId}/payment`
  - [ ] `POST /order/{orderId}/payment`
  - [ ] `GET /api/payments/by-order/{orderId}`
  - [ ] `PUT /admin/orders/{orderId}/payment/cod-success`
  - [ ] `PUT /admin/orders/{orderId}/payment/bank-success`
  - [ ] `POST /payment/webhook/momo`
  - [ ] `POST /payment/webhook/zalopay`
- [ ] Cập nhật `Order` trạng thái khi payment SUCCESS (xác định mapping theo `OrderService` constants)

## Frontend
- [ ] Tạo `templates/payment.html`
- [ ] Sửa `static/js/checkout.js` để redirect `/order/{id}/payment`
- [ ] Sửa `admin-dashboard.html` + `admin-dashboard.js`:
  - [ ] Hiển thị payment info trong modal
  - [ ] Hiển thị nút COD + BANK_TRANSFER

## Test
- [ ] `mvn test`
- [ ] `mvn package`

