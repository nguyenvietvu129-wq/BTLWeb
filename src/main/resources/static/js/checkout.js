$(document).ready(function () {
    checkAuthAndLoadCheckout();
});

let currentCart = [];
let shipmentDetailId = null;

// 1. Kiểm tra đăng nhập và tải thông tin thanh toán
function checkAuthAndLoadCheckout() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
        // Chưa đăng nhập → chuyển sang trang đăng nhập với redirect
        window.location.href = "/login?redirect=/checkout";
        return;
    }

    loadCheckoutData(userId, token);
}

// 2. Tải dữ liệu giỏ hàng và thông tin giao hàng
function loadCheckoutData(userId, token) {
    $.ajax({
        url: `/api/carts/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            if (response.success && response.data && response.data.length > 0) {
                currentCart = response.data;
                loadShipmentDetail(userId, token);
            } else {
                $('#checkout-content').html(`
                    <div class="empty-checkout">
                        Giỏ hàng của bạn đang trống!<br>
                        <button class="btn-confirm" onclick="window.location.href='/'" style="margin-top: 20px; width: auto;">Tiếp tục mua sắm</button>
                    </div>
                `);
            }
        },
        error: function () {
            $('#checkout-content').html('<div class="empty-checkout">Lỗi kết nối máy chủ! Vui lòng thử lại.</div>');
        }
    });
}

// 3. Tải thông tin giao hàng
function loadShipmentDetail(userId, token) {
    $.ajax({
        url: `/api/shipment/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            if (response) {
                shipmentDetailId = response.id;
                renderCheckout(response);
            } else {
                renderCheckout(null);
            }
        },
        error: function () {
            // Nếu chưa có thông tin giao hàng, render form trống
            renderCheckout(null);
        }
    });
}

// 4. Vẽ giao diện thanh toán
function renderCheckout(shipmentDetail) {
    let totalAmount = 0;
    let itemsHtml = '';

    currentCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        itemsHtml += `
            <tr>
                <td>${escapeHtml(item.productName)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(itemTotal)}</td>
            </tr>
        `;
    });

    const receiver = shipmentDetail ? shipmentDetail.receiver || '' : '';
    const phoneNumber = shipmentDetail ? shipmentDetail.phoneNumber || '' : '';
    const address = shipmentDetail ? shipmentDetail.address || '' : '';

    const html = `
        <div class="checkout-title">📋 Xác nhận đơn hàng</div>

        <div class="section-title">🛍️ Sản phẩm trong giỏ hàng</div>
        <table class="cart-summary-table">
            <thead>
                <tr>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                </tr>
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

    $('#checkout-content').html(html);
}

// 5. Xử lý đặt hàng
async function submitOrder(event) {
    event.preventDefault();

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        window.location.href = "/login?redirect=/checkout";
        return;
    }

    const receiver = document.getElementById("receiver").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();

    // Validate
    if (!receiver || !phoneNumber || !address) {
        alert("Vui lòng điền đầy đủ thông tin giao hàng!");
        return;
    }

    const submitBtn = document.getElementById("btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    try {
        // Bước 1: Tạo hoặc cập nhật thông tin giao hàng
        let currentShipmentId = shipmentDetailId;

        if (!currentShipmentId) {
            // Tạo mới shipment detail
            const createShipmentRes = await fetch("/api/shipment/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: parseInt(userId, 10),
                    receiver: receiver,
                    phoneNumber: phoneNumber,
                    address: address,
                    status: 1
                })
            });

            const shipmentData = await createShipmentRes.json();
            if (shipmentData && shipmentData.id) {
                currentShipmentId = shipmentData.id;
            } else {
                throw new Error("Không thể tạo thông tin giao hàng");
            }
        } else {
            // Cập nhật shipment detail
            await fetch("/api/shipment/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: currentShipmentId,
                    receiver: receiver,
                    phoneNumber: phoneNumber,
                    address: address,
                    status: 1
                })
            });
        }

        // Bước 2: Tạo đơn hàng
        const orderRes = await fetch("/api/orders/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: parseInt(userId, 10),
                note: note,
                shipmentDetailId: currentShipmentId
            })
        });

        const orderData = await orderRes.json();

        if (orderData) {
            $('#checkout-content').html(`
                <div class="success-message">
                    <h2>🎉 Đặt hàng thành công!</h2>
                    <p>Cảm ơn bạn đã mua hàng tại Kho Linh Kiện.</p>
                    <p>Đơn hàng của bạn đang được xử lý.</p>
                    <button class="btn-confirm" onclick="window.location.href='/'" style="margin-top: 20px; width: auto;">Tiếp tục mua sắm</button>
                </div>
            `);
        } else {
            throw new Error("Không thể tạo đơn hàng");
        }

    } catch (err) {
        console.error(err);
        alert("Đặt hàng thất bại: " + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "✅ Xác nhận đặt hàng";
    }
}

// Helper: Định dạng tiền tệ VND
function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

// Helper: Chống lỗi hiển thị HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

