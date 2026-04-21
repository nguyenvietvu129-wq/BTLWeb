// ========== TRANG SEARCH ==========
let currentPage = serverData.currentPage || 0;
let pageSize = 12;
let totalPages = serverData.totalPages || 0;
let currentKeyword = serverData.keyword || '';
let currentCategoryId = serverData.categoryId || '';
let currentMinPrice = serverData.minPrice;
let currentMaxPrice = serverData.maxPrice;
let currentSort = serverData.sort || 'id,desc';

$(document).ready(function() {
    // Set giá trị cho ô tìm kiếm
    $('#searchInput').val(currentKeyword);

    // Ẩn/hiện sidebar khi click nút bộ lọc
    let sidebarVisible = true;
    $('#filterBtn').click(function() {
        if (sidebarVisible) {
            $('#sidebar').hide();
            $(this).html('📋 Hiện lọc');
            sidebarVisible = false;
        } else {
            $('#sidebar').show();
            $(this).html('📋 Ẩn lọc');
            sidebarVisible = true;
        }
    });

    // Xóa tất cả bộ lọc
    $('#clearFilterBtn').click(function() {
        clearAllFilters();
    });

    // Load categories
    loadCategories();

    // Bind events
    bindEvents();
    updateUIByAuthStatus();

    // Highlight các filter đang active
    highlightActiveFilters();
});

function bindEvents() {
    // Search button click
    $('#searchBtn').click(function() {
        performSearch();
    });

    $('#searchInput').keypress(function(e) {
        if (e.which === 13) {
            performSearch();
        }
    });

    // Category filter
    $(document).on('change', 'input[name="category"]', function() {
        currentCategoryId = $(this).val();
        refreshPage();
    });

    // Price filter
    $(document).on('change', 'input[name="price"]', function() {
        const priceValue = $(this).val();
        if (priceValue) {
            const [min, max] = priceValue.split('-');
            currentMinPrice = parseFloat(min);
            currentMaxPrice = parseFloat(max);
        } else {
            currentMinPrice = null;
            currentMaxPrice = null;
        }
        refreshPage();
    });

    // Sort change
    $('#sort-select').change(function() {
        currentSort = $(this).val();
        refreshPage();
    });

    // Pagination
    $(document).on('click', '.page-btn', function() {
        const page = $(this).data('page');
        if (page !== undefined && page !== currentPage && page >= 0 && page < totalPages) {
            currentPage = page;
            refreshPage();
            $('html, body').animate({ scrollTop: 0 }, 300);
        }
    });

    // Cart button
    $('#cart-btn').click(function() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem giỏ hàng!');
            window.location.href = '/login';
            return;
        }
        window.location.href = '/cart';
    });

    $('#login-btn').click(function() {
        window.location.href = '/login';
    });

    $('#logout-btn').click(function() {
        handleLogout();
    });
}

function performSearch() {
    const keyword = $('#searchInput').val().trim();
    if (keyword) {
        window.location.href = `/search?keyword=${encodeURIComponent(keyword)}`;
    } else {
        window.location.href = '/';
    }
}

function clearAllFilters() {
    // Reset category
    currentCategoryId = '';
    $('input[name="category"]').prop('checked', false);
    $('input[name="category"][value=""]').prop('checked', true);

    // Reset price
    currentMinPrice = null;
    currentMaxPrice = null;
    $('input[name="price"]').prop('checked', false);
    $('input[name="price"][value=""]').prop('checked', true);

    // Reset sort
    currentSort = 'id,desc';
    $('#sort-select').val('id,desc');

    // Reset page
    currentPage = 0;

    // Refresh trang
    refreshPage();
}

function refreshPage() {
    // Xây dựng URL mới với các filter hiện tại
    let url = '/search?';
    const params = [];

    if (currentKeyword) {
        params.push(`keyword=${encodeURIComponent(currentKeyword)}`);
    }
    if (currentCategoryId) {
        params.push(`categoryId=${currentCategoryId}`);
    }
    if (currentMinPrice !== null) {
        params.push(`minPrice=${currentMinPrice}`);
    }
    if (currentMaxPrice !== null) {
        params.push(`maxPrice=${currentMaxPrice}`);
    }
    if (currentSort && currentSort !== 'id,desc') {
        params.push(`sort=${currentSort}`);
    }
    if (currentPage > 0) {
        params.push(`page=${currentPage}`);
    }

    url += params.join('&');

    // Chuyển hướng đến URL mới (server sẽ trả về HTML đã được render)
    window.location.href = url;
}

function loadCategories() {
    $.ajax({
        url: '/api/category',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                displayCategories(response.data);
                highlightActiveFilters();
            }
        },
        error: function() {
            console.error('Error loading categories');
        }
    });
}

function displayCategories(categories) {
    const container = $('#category-list');
    container.empty();

    container.append(`
        <label class="filter-option">
            <input type="radio" name="category" value="" ${!currentCategoryId ? 'checked' : ''}> Tất cả
        </label>
    `);

    categories.forEach(category => {
        if (category.status === 1) {
            container.append(`
                <label class="filter-option">
                    <input type="radio" name="category" value="${category.id}" ${currentCategoryId == category.id ? 'checked' : ''}> ${escapeHtml(category.name)}
                </label>
            `);
        }
    });
}

function highlightActiveFilters() {
    // Highlight price filter
    if (currentMinPrice !== null && currentMaxPrice !== null) {
        const priceValue = `${currentMinPrice}-${currentMaxPrice}`;
        $(`input[name="price"][value="${priceValue}"]`).prop('checked', true);
    } else {
        $('input[name="price"][value=""]').prop('checked', true);
    }
}

function formatPrice(price) {
    if (!price) return '0 VND';
    return price.toLocaleString('vi-VN') + ' VND';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateUIByAuthStatus() {
    const token = localStorage.getItem('token');
    const isLoggedIn = token && token !== 'null' && token !== 'undefined';

    if (isLoggedIn) {
        $('#login-btn').hide();
        $('#logout-btn').show();
    } else {
        $('#login-btn').show();
        $('#logout-btn').hide();
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = '/login';
}