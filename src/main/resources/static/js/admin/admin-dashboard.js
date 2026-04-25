// Check authentication on page load
$(document).ready(function() {
    checkAuthAndLoad();
    bindEvents();
});

function checkAuthAndLoad() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    // Check if user is logged in and is ADMIN
    if (!token || !role || role !== 'ADMIN') {
        window.location.href = '/login';
        return;
    }

    // Display welcome message
    $('#welcome-message').text(`Xin chào, ${username || 'Admin'}`);

    // Load dashboard data
    loadStatistics();
    loadTopProducts();
}

function bindEvents() {
    // Sidebar navigation
    $('.nav-item').click(function(e) {
        e.preventDefault();
        const page = $(this).data('page');

        // Update active state
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        // Hide all content areas
        $('.content-area').hide();

        // Show selected content
        if (page === 'dashboard') {
            $('#dashboard-content').show();
            loadStatistics();
            loadTopProducts();
        } else if (page === 'users') {
            $('#users-content').show();
            loadAllUsers();
        } else if (page === 'products') {
            $('#products-content').show();
            loadAllProducts(); // Gọi hàm load sản phẩm
        } else if (page === 'orders') {
            $('#orders-content').show();
            loadAllOrders(); // Gọi hàm load đơn hàng
        } else if (page === 'revenue') {
            $('#revenue-content').show();
        } else if (page === 'top-products') {
            $('#top-products-content').show();
            loadTopProducts();
        }
    });

    // Logout button
    $('#logout-btn').click(function() {
        handleLogout();
    });
}

function loadStatistics() {
    const token = localStorage.getItem('token');

    $.ajax({
        url: '/admin/statistics/overview',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                displayStatistics(response.data);
            } else {
                showError('Không thể tải dữ liệu thống kê');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading statistics:', error);
            if (xhr.status === 403 || xhr.status === 401) {
                handleLogout();
            } else {
                showError('Lỗi khi tải dữ liệu thống kê');
            }
        }
    });
}

function displayStatistics(data) {
    // Format currency
    const formattedRevenue = formatCurrency(data.totalRevenue);

    $('#total-revenue').text(formattedRevenue);
    $('#total-orders').text(formatNumber(data.totalOrders));
    $('#total-users').text(formatNumber(data.totalUsers));
    $('#total-products').text(formatNumber(data.totalProducts));
}

function loadTopProducts() {
    const token = localStorage.getItem('token');

    $.ajax({
        url: '/admin/statistics/top-products',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                displayTopProducts(response.data);
            } else {
                showError('Không thể tải danh sách sản phẩm bán chạy');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading top products:', error);
            if (xhr.status === 403 || xhr.status === 401) {
                handleLogout();
            } else {
                showError('Lỗi khi tải danh sách sản phẩm bán chạy');
            }
        }
    });
}

function displayTopProducts(products) {
    const tbody = $('#top-products-list');
    tbody.empty();

    if (!products || products.length === 0) {
        tbody.html('<tr><td colspan="5" class="loading-text">Không có dữ liệu</td></tr>');
        return;
    }

    products.forEach((product, index) => {
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <img src="${product.image || '/images/default-product.png'}" 
                         alt="${product.productName}" 
                         class="product-image"
                         onerror="this.src='/images/default-product.png'">
                </td>
                <td><strong>${escapeHtml(product.productName)}</strong></td>
                <td>${formatNumber(product.totalSold)}</td>
                <td>${formatCurrency(product.totalRevenue)}</td>
            </tr>
        `;
        tbody.append(row);
    });
}

function formatCurrency(amount) {
    if (!amount) return '0 VND';
    return amount.toLocaleString('vi-VN') + ' VND';
}

function formatNumber(number) {
    if (!number) return '0';
    return number.toLocaleString('vi-VN');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Simple error notification
    const errorDiv = $('<div>')
        .addClass('error-notification')
        .text(message)
        .css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#e74c3c',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            zIndex: '1000',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        });

    $('body').append(errorDiv);

    setTimeout(() => {
        errorDiv.fadeOut(() => {
            errorDiv.remove();
        });
    }, 3000);
}

let currentAdminUsers = [];

// 1. Tải danh sách người dùng
function loadAllUsers() {
    const token = localStorage.getItem('token');
    const tbody = $('#users-list-tbody');
    tbody.html('<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>');

    $.ajax({
        url: '/admin/users/list', // Hãy đảm bảo API này chuẩn
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(response) {
            if (response.success && response.data) {
                tbody.empty();
                currentAdminUsers = response.data; // Lưu lại để dùng khi sửa
                currentAdminUsers.forEach((user, index) => {
                    const roleId = user.role === 'ADMIN' ? 1 : 2;
                    tbody.append(`
                        <tr>
                            <td>${index + 1}</td>
                            <td><strong>${escapeHtml(user.username)}</strong></td>
                            <td>${escapeHtml(user.email || 'N/A')}</td>
                            <td><span class="role-badge">${user.role}</span></td>
                            <td>
                                <button onclick="openEditUserModal(${user.id})" class="logout-btn" style="background:#f39c12; width:auto; padding:5px 10px; margin-right:5px;">Sửa</button>
                            </td>
                        </tr>
                    `);
                });
            }
        }
    });
}

// 2. Mở Modal Thêm Người Dùng
function openAddUserModal() {
    $('#modal-title').text('Thêm Người Dùng Mới');
    $('#edit-user-id').val(''); // Reset ID

    // Mở khoá và hiện trường Username, Password
    $('#edit-user-username').val('').prop('disabled', false);
    $('#group-username').show();
    $('#edit-user-password').val('');
    $('#group-password').show();
    $('#edit-user-email').val('');
    $('#edit-user-role').val('2'); // Mặc định Customer

    $('#editUserModal').css('display', 'flex');
}

// 3. Mở Modal Sửa Người Dùng
function openEditUserModal(id) {
    const user = currentAdminUsers.find(u => u.id === id);
    if (!user) return;

    $('#modal-title').text('Cập Nhật Người Dùng');
    $('#edit-user-id').val(user.id);

    // Ẩn/Khoá trường Username và Password khi sửa
    $('#edit-user-username').val(user.username).prop('disabled', true);
    $('#group-username').show();
    $('#group-password').hide();
    $('#edit-user-email').val(user.email || '');

    const roleId = user.role === 'ADMIN' ? 1 : 2;
    $('#edit-user-role').val(roleId);

    $('#editUserModal').css('display', 'flex');
}

// 4. Đóng Modal
function closeUserModal() {
    $('#editUserModal').hide();
}

// 5. Gửi lệnh Lưu (Cho cả Thêm và Sửa)
function submitUser() {
    const id = $('#edit-user-id').val();
    const token = localStorage.getItem('token');

    // Dữ liệu dùng chung
    let payload = {
        email: $('#edit-user-email').val(),
        roleId: $('#edit-user-role').val()
    };

    if (id) {
        // --- NẾU CÓ ID -> GỌI API SỬA (PUT) ---
        $.ajax({
            url: '/admin/users/' + id, // Đổi từ /api/users/ thành /admin/users/ cho đồng bộ
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            data: payload, // Truyền dạng form data chuẩn thay vì JSON.stringify
            success: function(res) {
                if(res.success !== false) { // Chống lỗi API Response format
                    alert('Cập nhật người dùng thành công!');
                    closeUserModal();
                    loadAllUsers();
                } else alert("Lỗi: " + res.message);
            }
        });
    } else {
        // --- NẾU KHÔNG CÓ ID -> GỌI API THÊM (POST) ---
        payload.username = $('#edit-user-username').val();
        payload.password = $('#edit-user-password').val();

        if(!payload.username || !payload.password) {
            alert("Vui lòng nhập Tên đăng nhập và Mật khẩu!");
            return;
        }

        $.ajax({
            url: '/admin/users',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            data: payload,
            success: function(res) {
                if(res.success !== false) {
                    alert('Thêm người dùng thành công!');
                    closeUserModal();
                    loadAllUsers();
                } else alert("Lỗi: " + res.message);
            }
        });
    }
}

function escapeHtml(text) {
    if(!text) return '';
    return text.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let currentAdminProducts = []; // Mảng này sẽ lưu data sản phẩm để đổ vào Form Sửa
// ================= HÀM TẢI DANH SÁCH SẢN PHẨM =================
function loadAllProducts() {
    const tbody = $('#products-list-tbody');
    tbody.html('<tr><td colspan="7" class="loading-text">Đang tải dữ liệu sản phẩm...</td></tr>');

    $.ajax({
        url: '/api/products/all?size=100',
        method: 'GET',
        success: function(response) {
            if (response.success && response.data && response.data.content) {
                tbody.empty();

                // LƯU DATA VÀO BIẾN TOÀN CỤC Ở ĐÂY
                currentAdminProducts = response.data.content;

                if(currentAdminProducts.length === 0) {
                    tbody.html('<tr><td colspan="7" class="loading-text">Chưa có sản phẩm nào</td></tr>');
                    return;
                }

                currentAdminProducts.forEach(product => {
                    const statusHtml = product.quantity > 0
                        ? '<span style="color:#27ae60; font-weight:bold;">Còn hàng</span>'
                        : '<span style="color:#e74c3c; font-weight:bold;">Hết hàng</span>';

                    tbody.append(`
                        <tr>
                            <td>${product.id}</td>
                            <td>
                                <img src="${product.image || '/images/default-product.png'}" class="product-image" onerror="this.src='/images/default-product.png'">
                            </td>
                            <td><strong>${escapeHtml(product.name)}</strong></td>
                            <td>${formatCurrency(product.price)}</td>
                            <td>${product.quantity}</td>
                            <td>${statusHtml}</td>
                            <td>
                                <button onclick="openEditModal(${product.id})" class="logout-btn" style="background:#f39c12; padding:5px 10px; font-size:12px; display:inline-block; width:auto; margin-right:5px;">Sửa</button>
                                <button onclick="deleteProduct(${product.id})" class="logout-btn" style="background:#e74c3c; padding:5px 10px; font-size:12px; display:inline-block; width:auto;">Xóa</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function() {
            showError('Không thể tải danh sách sản phẩm. Hãy kiểm tra lại kết nối!');
        }
    });
}
// ================= HÀM XÓA SẢN PHẨM =================
function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm có ID = ' + id + ' không?')) {
        const token = localStorage.getItem('token');

        $.ajax({
            url: '/api/products/' + id,
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function() {
                alert('Xóa sản phẩm thành công!');
                loadAllProducts(); // Tải lại danh sách sau khi xóa
            },
            error: function(xhr) {
                console.error(xhr);
                alert('Xóa thất bại! Vui lòng kiểm tra lại quyền hoặc sản phẩm đang nằm trong đơn hàng.');
            }
        });
    }
}

// ================= HÀM SỬA SẢN PHẨM =================
// ================= HÀM MỞ FORM SỬA SẢN PHẨM =================
function openEditModal(id) {
    // Tìm sản phẩm trong mảng đã lưu
    const product = currentAdminProducts.find(p => p.id === id);
    if (!product) return;

    // Đổ dữ liệu cũ vào các ô input
    $('#edit-prod-id').val(product.id);
    $('#edit-prod-name').val(product.name);
    $('#edit-prod-price').val(product.price);
    $('#edit-prod-quantity').val(product.quantity);
    $('#edit-prod-desc').val(product.description || '');
    // Đổ dữ liệu cũ vào các ô input (thêm dòng dưới này vào)
    $('#edit-prod-image').val(product.image || '');

    // Hiển thị Popup (flex để căn giữa)
    $('#editProductModal').css('display', 'flex');
}

// ================= HÀM GỬI API CẬP NHẬT =================
function submitEditProduct() {
    const id = $('#edit-prod-id').val();
    const name = $('#edit-prod-name').val();
    const price = $('#edit-prod-price').val();
    const quantity = $('#edit-prod-quantity').val();
    const desc = $('#edit-prod-desc').val();
    const token = localStorage.getItem('token');
    // Thêm biến hứng ảnh
    const image = $('#edit-prod-image').val().trim();


    // Tạo Body theo cấu trúc ProductRequest
    const payload = {
        name: name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description: desc,
        image: image,
        status: 1 // Giữ mặc định là đang bán
    };

    // Đổi chữ nút thành Đang lưu để UX tốt hơn
    const btnLuu = $('#editProductModal button:last-child');
    btnLuu.text('Đang lưu...').prop('disabled', true);

    $.ajax({
        url: '/api/products/' + id,
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json' // Phải khai báo JSON
        },
        data: JSON.stringify(payload),
        success: function(response) {
            alert('Cập nhật sản phẩm thành công!');
            $('#editProductModal').hide();
            btnLuu.text('Lưu thay đổi').prop('disabled', false);
            loadAllProducts(); // Load lại bảng sản phẩm mới
        },
        error: function(xhr) {
            console.error(xhr);
            alert('Lỗi khi cập nhật sản phẩm! Vui lòng kiểm tra lại quyền truy cập.');
            btnLuu.text('Lưu thay đổi').prop('disabled', false);
        }
    });
}

// ================= HÀM MỞ FORM THÊM SẢN PHẨM =================
function openAddModal() {
    // Xóa sạch các ô input cũ trước khi mở form mới
    $('#add-prod-name').val('');
    $('#add-prod-price').val('');
    $('#add-prod-quantity').val('');
    $('#add-prod-desc').val('');
    $('#add-prod-image').val('');
    // Hiển thị Popup (flex để căn giữa màn hình)
    $('#addProductModal').css('display', 'flex');
}

// ================= HÀM GỬI API THÊM SẢN PHẨM =================
function submitAddProduct() {
    const name = $('#add-prod-name').val().trim();
    const price = $('#add-prod-price').val();
    const quantity = $('#add-prod-quantity').val();
    const desc = $('#add-prod-desc').val().trim();
    const image = $('#add-prod-image').val().trim();
    const token = localStorage.getItem('token');

    // Kiểm tra không cho để trống
    if (!name || !price || !quantity) {
        alert("Vui lòng nhập đầy đủ Tên, Giá và Số lượng!");
        return;
    }

    // Tạo Body theo cấu trúc ProductRequest
    const payload = {
        name: name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description: desc,
        image: image,
        status: 1 // Mặc định là đang bán
    };

    // Đổi chữ trên nút để báo hiệu đang xử lý
    const btnThem = $('#addProductModal button:last-child');
    btnThem.text('Đang thêm...').prop('disabled', true);

    $.ajax({
        url: '/api/products',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload),
        success: function(response) {
            alert('Thêm sản phẩm thành công!');
            $('#addProductModal').hide();
            btnThem.text('Thêm sản phẩm').prop('disabled', false);
            loadAllProducts(); // Load lại bảng để hiển thị sản phẩm vừa thêm
        },
        error: function(xhr) {
            console.error(xhr);
            alert('Lỗi khi thêm sản phẩm! Vui lòng kiểm tra lại.');
            btnThem.text('Thêm sản phẩm').prop('disabled', false);
        }
    });
}

// ================= HÀM TẢI DANH SÁCH ĐƠN HÀNG =================
function loadAllOrders() {
    const token = localStorage.getItem('token');
    const tbody = $('#orders-list-tbody');
    tbody.html('<tr><td colspan="6" class="loading-text">Đang tải dữ liệu đơn hàng...</td></tr>');

    $.ajax({
        url: '/api/orders/all',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token // Bắt buộc phải có token Admin
        },
        success: function(response) {
            if (response.success && response.data) {
                tbody.empty();
                const orders = response.data;

                const sortType = $('#sort-order-price').val();
                if (sortType === 'asc') {
                    orders.sort((a, b) => a.totalPrice - b.totalPrice); // Thấp đến Cao
                } else if (sortType === 'desc') {
                    orders.sort((a, b) => b.totalPrice - a.totalPrice); // Cao đến Thấ
                } else {
                    // Mặc định: Mới nhất lên đầu (Dựa vào ID hoặc ngày tháng)
                    orders.sort((a, b) => b.id - a.id);
                }

                if(orders.length === 0) {
                    tbody.html('<tr><td colspan="6" class="loading-text">Chưa có đơn hàng nào</td></tr>');
                    return;
                }

                orders.forEach(order => {
                    // Xử lý format ngày tháng năm
                    const dateObj = new Date(order.createdAt);
                    const dateStr = dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN');

                    // Trạng thái đơn hàng (Có thể tùy chỉnh logic status của bạn)
                    let statusText = order.status === 1
                        ? '<span style="color:#27ae60; font-weight:bold;">Hoàn thành</span>'
                        : '<span style="color:#f39c12; font-weight:bold;">Chờ xử lý</span>';

                    tbody.append(`
                        <tr>
                            <td>#${order.id}</td>
                            <td><strong>${escapeHtml(order.userName)}</strong></td>
                            <td>${dateStr}</td>
                            <td>${formatCurrency(order.totalPrice)}</td>
                            <td>${statusText}</td>
                            <td>
                                <button onclick="viewOrderDetail(${order.id})" class="logout-btn" style="background:#3498db; padding:5px 10px; font-size:12px; display:inline-block; width:auto; cursor: pointer;">Chi tiết</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function() {
            showError('Không thể tải danh sách đơn hàng. Bạn có quyền Admin chưa?');
        }
    });
}

// ================= HÀM XEM CHI TIẾT ĐƠN HÀNG =================
function viewOrderDetail(orderId) {
    const token = localStorage.getItem('token');
    $('#detail-order-items').html('<tr><td colspan="4" style="text-align:center;">Đang tải dữ liệu...</td></tr>');
    $('#orderDetailModal').css('display', 'flex'); // Mở modal ngay lập tức

    $.ajax({
        url: '/api/orders/admin/' + orderId, // Gọi API lấy chi tiết của Admin
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(response) {
            if (response.success && response.data) {
                const order = response.data;

                // Đổ thông tin chung
                $('#detail-order-id').text('#' + order.id);
                $('#detail-order-customer').text(order.userName || 'N/A');

                const dateObj = new Date(order.createdAt);
                $('#detail-order-date').text(dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN'));

                let statusText = order.status === 1
                    ? '<span style="color:#27ae60; font-weight:bold;">Hoàn thành</span>'
                    : '<span style="color:#f39c12; font-weight:bold;">Chờ xử lý</span>';
                $('#detail-order-status').html(statusText);
                $('#detail-order-note').text(order.note || 'Không có ghi chú');
                $('#detail-order-total').text(formatCurrency(order.totalPrice));

                // Đổ danh sách sản phẩm
                const tbody = $('#detail-order-items');
                tbody.empty();

                // Lưu ý: Nếu DTO OrderResponse của bạn trả về danh sách "orderDetails", nó sẽ loop ở đây
                if (order.orderDetails && order.orderDetails.length > 0) {
                    order.orderDetails.forEach(item => {
                        // Tính đơn giá = Thành tiền / Số lượng (Do DB hiện tại lưu price tổng)
                        const unitPrice = item.price / item.quantity;
                        tbody.append(`
                            <tr>
                                <td>${escapeHtml(item.productName || 'Sản phẩm ' + item.productId)}</td>
                                <td>${formatCurrency(unitPrice)}</td>
                                <td style="text-align: center;">${item.quantity}</td>
                                <td><strong>${formatCurrency(item.price)}</strong></td>
                            </tr>
                        `);
                    });
                } else {
                    tbody.html('<tr><td colspan="4" style="text-align:center;">Không có chi tiết sản phẩm hoặc cấu hình DTO chưa map chi tiết.</td></tr>');
                }
            } else {
                alert('Lỗi: ' + response.message);
                closeOrderDetailModal();
            }
        },
        error: function(xhr) {
            alert('Không thể kết nối đến server để lấy chi tiết');
            closeOrderDetailModal();
        }
    });
}

function closeOrderDetailModal() {
    $('#orderDetailModal').hide();
}

let myChart = null; // Biến toàn cục để lưu instance của biểu đồ

function displayStatistics(data) {
    // Cập nhật các thẻ text
    $('#total-revenue').text(formatCurrency(data.totalRevenue));
    $('#total-orders-val').text(formatNumber(data.totalOrders));
    $('#total-users-val').text(formatNumber(data.totalUsers));
    $('#total-products-val').text(formatNumber(data.totalProducts));

    // Vẽ biểu đồ doanh thu
    if (data.revenueChart) {
        const labels = data.revenueChart.map(item => item[0]); // Ngày
        const values = data.revenueChart.map(item => item[1]); // Tiền

        const ctx = document.getElementById('revenueChart').getContext('2d');

        if (myChart) myChart.destroy(); // Xóa biểu đồ cũ nếu có

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: values,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function handleLogout() {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    // Clear cookies
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "token=; path=/api; max-age=0";

    // Redirect to login page
    window.location.href = '/login';
}



// Refresh data every 30 seconds (optional)
setInterval(() => {
    const activePage = $('.nav-item.active').data('page');
    if (activePage === 'dashboard') {
        loadStatistics();
        loadTopProducts();
    }
}, 30000);