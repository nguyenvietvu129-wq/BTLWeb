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
        window.location.href = '/api/login';
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
        } else if (page === 'products') {
            $('#products-content').show();
        } else if (page === 'orders') {
            $('#orders-content').show();
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
        url: '/api/admin/statistics/overview',
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
        url: '/api/admin/statistics/top-products',
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
    window.location.href = '/api/login';
}

// Refresh data every 30 seconds (optional)
setInterval(() => {
    const activePage = $('.nav-item.active').data('page');
    if (activePage === 'dashboard') {
        loadStatistics();
        loadTopProducts();
    }
}, 30000);