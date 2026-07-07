KẾ HOẠCH TRIỂN KHAI CHỨC NĂNG THANH TOÁN
Mục tiêu

Hỗ trợ 4 phương thức thanh toán:

COD (Thanh toán khi nhận hàng)
MoMo
ZaloPay
Chuyển khoản ngân hàng

Tất cả đơn hàng đều được tạo trước, sau đó người dùng mới lựa chọn phương thức thanh toán.

1. Flow tổng thể
Checkout

↓

Tạo Order
(Order + OrderDetail)

↓

Redirect
/order/{orderId}/payment

↓

Khách chọn phương thức thanh toán

↓

Tạo Payment (PENDING)

↓

Xử lý theo từng phương thức

↓

Payment SUCCESS

↓

Order chuyển sang trạng thái tiếp theo
2. Bước 1 - Tạo Order
Checkout

User nhập:

Họ tên
Số điện thoại
Địa chỉ
Ghi chú

Sau đó:

POST /api/orders/create

Backend tạo:

Order
OrderDetail

Không tạo Payment ở bước này.

Sau khi tạo Order

Thay đổi trong:

static/js/checkout.js

Hiện tại:

Đặt hàng thành công

↓

Redirect /orders

Sửa thành:

Đặt hàng thành công

↓

window.location =
/order/{orderId}/payment
3. Bước 2 - Trang Payment

Tạo:

payment.html

Route:

GET /order/{orderId}/payment

Hiển thị:

( ) COD

( ) MOMO

( ) ZALOPAY

( ) BANK_TRANSFER

Nếu chọn:

BANK_TRANSFER

Hiển thị:

Ngân hàng:
Vietcombank

STK:
0123456789

Tên TK:
ABC SHOP

QR Code
4. Tạo Payment

User bấm:

Thanh toán

Gọi:

POST /order/{orderId}/payment

Backend tạo Payment.

Ví dụ:

Field	Value
order	Order
amount	Order.totalPrice
paymentMethod	COD/MOMO/ZALOPAY/BANK_TRANSFER
status	PENDING
transactionId
COD
NULL
MOMO
NULL

(chờ webhook trả về)
ZALOPAY
NULL

(chờ webhook)
BANK_TRANSFER

Lưu thông tin tài khoản:

{
  "bankName":"Vietcombank",
  "accountNumber":"0123456789",
  "accountHolder":"ABC Shop"
}
5. Flow từng phương thức
A. COD
User chọn COD

↓

Payment=PENDING

↓

Admin giao hàng

↓

Khách trả tiền

↓

Admin bấm

"Đã nhận tiền mặt"

↓

Payment=SUCCESS

API:

PUT
/admin/orders/{orderId}/payment/cod-success
B. MOMO
User

↓

MoMo

↓

Webhook

↓

Payment SUCCESS

API:

POST
/payment/webhook/momo

Nếu demo:

POST
/payment/webhook/momo/mock
C. ZaloPay

Flow giống MoMo.

POST
/payment/webhook/zalopay
D. Chuyển khoản ngân hàng
User

↓

Hiển thị QR

↓

User chuyển khoản

↓

Admin kiểm tra

↓

Bấm

"Đã xác nhận chuyển khoản"

↓

Payment SUCCESS

API:

PUT
/admin/orders/{orderId}/payment/bank-success
6. Admin Dashboard
Chọn phương án A

Không tạo trang Payment mới.

Tất cả sẽ nằm trong:

admin-dashboard.html

↓

Modal

orderDetailModal
Khi mở chi tiết đơn hàng

Hiển thị thêm:

Thông tin thanh toán

---------------------

Phương thức:

COD

Trạng thái:

PENDING

Số tiền:

350.000đ

Nếu BANK_TRANSFER:

Ngân hàng

Vietcombank

STK

0123456789

Tên TK

ABC Shop
Các nút trong modal
COD
[Đã nhận tiền mặt]
BANK_TRANSFER
[Đã xác nhận chuyển khoản]
MOMO

Không có nút.

Chỉ webhook cập nhật.

ZALOPAY

Không có nút.

Chỉ webhook cập nhật.

7. API cần bổ sung
Payment
GET
/order/{orderId}/payment

Hiển thị trang thanh toán.

POST
/order/{orderId}/payment

Tạo Payment PENDING.

GET
/api/payments/by-order/{orderId}

Admin lấy thông tin Payment.

PUT
/admin/orders/{orderId}/payment/cod-success

Admin xác nhận COD.

PUT
/admin/orders/{orderId}/payment/bank-success

Admin xác nhận chuyển khoản.

POST
/payment/webhook/momo

Webhook.

POST
/payment/webhook/zalopay

Webhook.

8. Các file cần sửa
Frontend
checkout.js

Sau khi tạo Order:

redirect

/order/{id}/payment
payment.html

Trang chọn phương thức thanh toán.

admin-dashboard.js

Thêm:

GET

/api/payments/by-order/{orderId}

Hiển thị Payment trong modal.

admin-dashboard.html

Thêm:

Thông tin Payment
Nút xác nhận COD
Nút xác nhận Chuyển khoản
9. Backend

Tạo:

PaymentRepository
PaymentService
PaymentController
PaymentDTO
PaymentMapper
10. Luồng hoàn chỉnh
Checkout

↓

POST /api/orders/create

↓

Order
OrderDetail

↓

Redirect

/order/{id}/payment

↓

User chọn

COD
MoMo
ZaloPay
Bank Transfer

↓

POST /order/{id}/payment

↓

Payment = PENDING

↓

─────────────────────────────

COD
↓

Admin xác nhận

↓

SUCCESS

─────────────────────────────

MoMo

↓

Webhook

↓

SUCCESS

─────────────────────────────

ZaloPay

↓

Webhook

↓

SUCCESS

─────────────────────────────

Bank Transfer

↓

Khách chuyển khoản

↓

Admin xác nhận

↓

SUCCESS

─────────────────────────────

↓

Order chuyển trạng thái tiếp theo