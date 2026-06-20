// ========================
// 1. SỰ KIỆN KHỞI TẠO TRANG
// ========================
// Khi toàn bộ DOM đã sẵn sàng, gọi hàm kiểm tra đăng nhập và tải dữ liệu thanh toán
$(document).ready(function () {
    checkAuthAndLoadCheckout();
});

// Biến lưu giỏ hàng hiện tại (mảng các sản phẩm)
let currentCart = [];
// Biến lưu ID của thông tin giao hàng (nếu đã có từ trước)
let shipmentDetailId = null;

// ========================
// 2. KIỂM TRA ĐĂNG NHẬP
// ========================
/**
 * Hàm kiểm tra trạng thái đăng nhập của người dùng
 * - Đọc userId và token từ localStorage
 * - Nếu chưa đăng nhập (thiếu userId hoặc token) → chuyển hướng về trang login
 * - Nếu đã đăng nhập → gọi hàm loadCheckoutData để lấy dữ liệu giỏ hàng
 */
function checkAuthAndLoadCheckout() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // Kiểm tra thông tin xác thực
    if (!userId || !token) {
        // Chuyển hướng về login, đồng thời lưu lại redirect để sau khi login quay lại checkout
        window.location.href = "/login?redirect=/checkout";
        return;
    }

    // Nếu đã đăng nhập, tiến hành tải dữ liệu giỏ hàng
    loadCheckoutData(userId, token);
}

// ========================
// 3. LẤY DỮ LIỆU GIỎ HÀNG
// ========================
/**
 * Tải danh sách sản phẩm trong giỏ hàng của người dùng từ API
 * @param {string} userId - ID người dùng (lấy từ localStorage)
 * @param {string} token - JWT token xác thực
 *
 * Luồng xử lý:
 * 1. Gọi API GET /api/carts/{userId}
 * 2. Nếu thành công và có dữ liệu:
 *    - Lưu giỏ hàng vào biến currentCart
 *    - Gọi tiếp loadShipmentDetail để lấy thông tin giao hàng đã lưu (nếu có)
 * 3. Nếu giỏ hàng trống:
 *    - Hiển thị thông báo giỏ hàng trống kèm nút "Tiếp tục mua sắm"
 * 4. Nếu lỗi:
 *    - Hiển thị thông báo lỗi từ server hoặc lỗi kết nối
 */
function loadCheckoutData(userId, token) {
    $.ajax({
        url: `/api/carts/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            // Kiểm tra response có dữ liệu không
            if (response.success && response.data && response.data.length > 0) {
                currentCart = response.data;   // Lưu giỏ hàng vào biến toàn cục
                loadShipmentDetail(userId, token);  // Tiếp tục lấy thông tin giao hàng
            } else {
                // Trường hợp giỏ hàng trống → hiển thị thông báo
                $('#checkout-content').html(`
                    <div class="empty-checkout">
                        Giỏ hàng của bạn đang trống!<br>
                        <button class="btn-confirm" onclick="window.location.href='/'" style="margin-top: 20px; width: auto;">Tiếp tục mua sắm</button>
                    </div>
                `);
            }
        },
        error: function (xhr) {
            // Lỗi từ server (400, 401, 500,...) hoặc mất kết nối
            $('#checkout-content').html(`<div class="empty-checkout">${xhr.responseJSON?.error || 'Lỗi kết nối máy chủ! Vui lòng thử lại.'}</div>`);
        }
    });
}

// ========================
// 4. LẤY THÔNG TIN GIAO HÀNG ĐÃ LƯU
// ========================
/**
 * Tải thông tin giao hàng đã có của người dùng (nếu từng nhập trước đó)
 * @param {string} userId - ID người dùng
 * @param {string} token - JWT token
 *
 * Luồng xử lý:
 * 1. Gọi API GET /api/shipment/{userId}
 * 2. Nếu tìm thấy thông tin giao hàng:
 *    - Lưu shipmentDetailId vào biến toàn cục
 *    - Gọi renderCheckout(response) để hiển thị form với dữ liệu đã có
 * 3. Nếu chưa có thông tin giao hàng:
 *    - Gọi renderCheckout(null) để hiển thị form trống
 */
function loadShipmentDetail(userId, token) {
    $.ajax({
        url: `/api/shipment/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            if (response) {
                shipmentDetailId = response.id;   // Lưu ID để sau này cập nhật
                renderCheckout(response);         // Render form với dữ liệu có sẵn
            } else {
                renderCheckout(null);             // Render form trống
            }
        },
        error: function () {
            // Nếu API lỗi (ví dụ 404 Not Found) thì cũng render form trống
            renderCheckout(null);
        }
    });
}

// ========================
// 5. HIỂN THỊ GIAO DIỆN THANH TOÁN
// ========================
/**
 * Render toàn bộ giao diện thanh toán: danh sách sản phẩm, tổng tiền, form thông tin giao hàng
 * @param {Object|null} shipmentDetail - Đối tượng thông tin giao hàng (nếu có) hoặc null
 *
 * Các bước xử lý:
 * 1. Duyệt qua mảng currentCart để tính tổng tiền và tạo HTML cho bảng sản phẩm
 * 2. Lấy thông tin người nhận, số điện thoại, địa chỉ từ shipmentDetail (nếu có)
 * 3. Tạo HTML hoàn chỉnh bao gồm:
 *    - Tiêu đề
 *    - Bảng tóm tắt giỏ hàng
 *    - Form nhập thông tin giao hàng (gán sẵn giá trị nếu có)
 * 4. Chèn HTML vào container #checkout-content
 * 5. Form có onsubmit="submitOrder(event)" để xử lý khi submit
 */
function renderCheckout(shipmentDetail) {
    let totalAmount = 0;
    let itemsHtml = '';

    // Duyệt từng sản phẩm trong giỏ hàng
    currentCart.forEach(item => {
        const itemTotal = item.price * item.quantity;  // Thành tiền = đơn giá * số lượng
        totalAmount += itemTotal;                      // Cộng dồn vào tổng tiền
        itemsHtml += `
            <tr>
                <td>${escapeHtml(item.productName)}</td>   <!-- Tên sản phẩm (có escape) -->
                <td>${item.quantity}</td>                  <!-- Số lượng -->
                <td>${formatCurrency(item.price)}</td>     <!-- Đơn giá (định dạng tiền tệ) -->
                <td>${formatCurrency(itemTotal)}</td>      <!-- Thành tiền -->
            </tr>
        `;
    });

    // Lấy thông tin giao hàng nếu có (nếu không thì để trống)
    const receiver = shipmentDetail ? shipmentDetail.receiver || '' : '';
    const phoneNumber = shipmentDetail ? shipmentDetail.phoneNumber || '' : '';
    const address = shipmentDetail ? shipmentDetail.address || '' : '';

    // Tạo toàn bộ HTML cho trang thanh toán
    const html = `
        <div class="checkout-title">📋 Xác nhận đơn hàng</div>
        <div class="section-title">🛍️ Sản phẩm trong giỏ hàng</div>
        <table class="cart-summary-table">
            <thead>
                <tr><th>Tên sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
            </thead>
            <tbody>
                ${itemsHtml}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">Tổng thanh toán:</td>
                    <td>${formatCurrency(totalAmount)}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">📦 Thông tin giao hàng</div>
        <form id="checkout-form" onsubmit="submitOrder(event)">
            <div class="two-col">
                <div class="form-group">
                    <label for="receiver">Người nhận *</label>
                    <input type="text" id="receiver" name="receiver" value="${escapeHtml(receiver)}" placeholder="Họ và tên người nhận" required>
                </div>
                <div class="form-group">
                    <label for="phoneNumber">Số điện thoại *</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value="${escapeHtml(phoneNumber)}" placeholder="Số điện thoại liên hệ" required>
                </div>
            </div>
            <div class="form-group">
                <label for="address">Địa chỉ giao hàng *</label>
                <textarea id="address" name="address" placeholder="Nhập địa chỉ giao hàng chi tiết..." required>${escapeHtml(address)}</textarea>
            </div>
            <div class="form-group">
                <label for="note">Ghi chú (tùy chọn)</label>
                <textarea id="note" name="note" placeholder="Ghi chú về đơn hàng, thời gian giao hàng..."></textarea>
            </div>
            <button type="submit" class="btn-confirm" id="btn-submit">✅ Xác nhận đặt hàng</button>
        </form>
    `;

    // Chèn HTML vào DOM
    $('#checkout-content').html(html);
}

// ========================
// 6. XỬ LÝ ĐẶT HÀNG (QUAN TRỌNG NHẤT)
// ========================
/**
 * Xử lý khi người dùng submit form đặt hàng
 * @param {Event} event - Sự kiện submit của form
 *
 * Luồng xử lý chi tiết (async/await):
 * 1. Ngăn chặn hành vi reload trang mặc định (event.preventDefault)
 * 2. Lấy userId và token từ localStorage, kiểm tra lại đăng nhập
 * 3. Lấy dữ liệu từ form: receiver, phoneNumber, address, note
 * 4. Validate dữ liệu (không được để trống receiver, phoneNumber, address)
 * 5. Vô hiệu hóa nút submit để tránh submit nhiều lần
 * 6. Xử lý thông tin giao hàng (shipment):
 *    - Nếu chưa có shipmentDetailId → Gọi API POST /api/shipment/create để tạo mới
 *    - Nếu đã có → Gọi API PUT /api/shipment/update để cập nhật
 * 7. Sau khi có shipmentId → Gọi API POST /api/orders/create để tạo đơn hàng
 * 8. Nếu thành công:
 *    - Hiển thị thông báo thành công kèm mã đơn hàng
 *    - Cung cấp nút "Xem đơn hàng của tôi" và "Tiếp tục mua sắm"
 * 9. Nếu thất bại:
 *    - Hiển thị alert lỗi
 *    - Kích hoạt lại nút submit để người dùng thử lại
 */
async function submitOrder(event) {
    event.preventDefault();  // Chặn reload trang

    // Lấy thông tin xác thực
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // Kiểm tra lại đăng nhập (phòng trường hợp token hết hạn)
    if (!userId || !token) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        window.location.href = "/login?redirect=/checkout";
        return;
    }

    // Lấy dữ liệu từ form
    const receiver = document.getElementById("receiver").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();

    // Validate dữ liệu đầu vào
    if (!receiver || !phoneNumber || !address) {
        alert("Vui lòng điền đầy đủ thông tin giao hàng!");
        return;
    }

    // Vô hiệu hóa nút submit để tránh spam
    const submitBtn = document.getElementById("btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    try {
        // ========== BƯỚC 1: XỬ LÝ THÔNG TIN GIAO HÀNG (SHIPMENT) ==========
        let currentShipmentId = shipmentDetailId;

        if (!currentShipmentId) {
            // Trường hợp chưa có thông tin giao hàng → tạo mới
            const createShipmentRes = await fetch("/api/shipment/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: parseInt(userId, 10),
                    receiver,
                    phoneNumber,
                    address,
                    status: 1   // status = 1: trạng thái active/đang sử dụng
                })
            });

            const shipmentData = await createShipmentRes.json();
            if (createShipmentRes.ok && shipmentData && shipmentData.id) {
                currentShipmentId = shipmentData.id;  // Lấy ID của shipment vừa tạo
            } else {
                throw new Error(shipmentData?.error || shipmentData?.message || "Không thể tạo thông tin giao hàng");
            }
        } else {
            // Trường hợp đã có thông tin giao hàng → cập nhật lại
            const updateShipmentRes = await fetch("/api/shipment/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: currentShipmentId,
                    userId: parseInt(userId, 10),
                    receiver,
                    phoneNumber,
                    address,
                    status: 1
                })
            });
            if (!updateShipmentRes.ok) {
                const errData = await updateShipmentRes.json().catch(() => ({}));
                throw new Error(errData?.error || errData?.message || "Không thể cập nhật thông tin giao hàng");
            }
        }

        // ========== BƯỚC 2: TẠO ĐƠN HÀNG (ORDER) ==========
        const orderRes = await fetch("/api/orders/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: parseInt(userId, 10),
                note: note,                       // Ghi chú đơn hàng (có thể để trống)
                shipmentDetailId: currentShipmentId   // Liên kết với thông tin giao hàng
            })
        });

        const orderData = await orderRes.json();
        if (orderRes.ok && orderData && orderData.success) {
            const createdOrder = orderData.data;
            // Hiển thị thông báo đặt hàng thành công
            $('#checkout-content').html(`
                <div class="success-message">
                    <h2>🎉 Đặt hàng thành công!</h2>
                    <p>Cảm ơn bạn đã mua hàng tại Kho Linh Kiện.</p>
                    <p>Đơn hàng #${createdOrder.id} của bạn đang chờ xác nhận.</p>
                    <button class="btn-confirm" onclick="window.location.href='/orders'" style="margin-top: 20px; width: auto;">Xem đơn hàng của tôi</button>
                    <button class="btn-confirm" onclick="window.location.href='/'" style="margin-top: 20px; width: auto; background:#3498db;">Tiếp tục mua sắm</button>
                </div>
            `);
        } else {
            // Nếu API trả về lỗi (success = false)
            throw new Error(orderData?.error || orderData?.message || "Không thể tạo đơn hàng");
        }
    } catch (err) {
        // Bắt tất cả lỗi trong quá trình xử lý
        console.error(err);
        alert("Đặt hàng thất bại: " + err.message);
        // Kích hoạt lại nút submit để người dùng thử lại
        submitBtn.disabled = false;
        submitBtn.textContent = "✅ Xác nhận đặt hàng";
    }
}

// ========================
// 7. HÀM TIỆN ÍCH
// ========================
/**
 * Định dạng số tiền theo chuẩn Việt Nam (VNĐ)
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} - Chuỗi đã định dạng, ví dụ: "1,234,567 ₫"
 */
function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

/**
 * Bảo vệ chống tấn công XSS: chuyển đổi các ký tự đặc biệt HTML thành entity
 * @param {string} text - Chuỗi đầu vào có thể chứa HTML
 * @returns {string} - Chuỗi đã được escape, an toàn khi chèn vào DOM
 *
 * Ví dụ: "<script>alert('xss')</script>" → "&lt;script&gt;alert('xss')&lt;/script&gt;"
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;   // textContent tự động escape
    return div.innerHTML;      // Lấy ra chuỗi đã escape
}