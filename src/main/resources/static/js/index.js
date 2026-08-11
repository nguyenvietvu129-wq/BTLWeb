// =====================================================
// TRANG INDEX (Trang chủ) - QUẢN LÝ DANH SÁCH SẢN PHẨM
// =====================================================

// ========== BIẾN TOÀN CỤC ==========
let currentPage = 0;           // Trang hiện tại (bắt đầu từ 0)
let pageSize = 12;             // Số sản phẩm hiển thị trên mỗi trang
let totalPages = 0;            // Tổng số trang
let totalElements = 0;         // Tổng số sản phẩm
let currentSortBy = 'id';      // Trường dùng để sắp xếp (id, price, name,...)
let currentSortDir = 'desc';   // Chiều sắp xếp: 'asc' (tăng dần) hoặc 'desc' (giảm dần)
let currentKeyword = '';       // Từ khóa tìm kiếm
let currentCategoryId = '';    // ID danh mục đang chọn (rỗng = tất cả)
let currentMinPrice = '';      // Giá tối thiểu (rỗng = không giới hạn)
let currentMaxPrice = '';      // Giá tối đa (rỗng = không giới hạn)

// =====================================================
// 1. KHỞI TẠO TRANG
// =====================================================
/**
 * Hàm khởi tạo khi DOM đã sẵn sàng
 * - Gán sự kiện cho các nút (topbar: logout, cart, login)
 * - Gán sự kiện tìm kiếm (nút search, phím Enter)
 * - Tải danh mục sản phẩm từ API
 * - Tải danh sách sản phẩm
 * - Cập nhật giao diện dựa trên trạng thái đăng nhập
 */
$(document).ready(function () {
    bindTopActions();           // Gán sự kiện cho nút logout/cart/login/orders
    bindSearchEvents();         // Gán sự kiện cho ô tìm kiếm
    loadCategories();           // Tải danh mục sản phẩm
    loadProducts();             // Tải danh sách sản phẩm (API /all)
    updateUIByAuthStatus();     // Ẩn/hiện nút logout/login dựa trên token
});

// =====================================================
// 2. SỰ KIỆN TÌM KIẾM
// =====================================================
/**
 * Gán sự kiện cho ô tìm kiếm và nút search
 */
function bindSearchEvents() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    // Sự kiện click nút tìm kiếm
    if (searchBtn) {
        searchBtn.addEventListener("click", function() {
            performSearch();
        });
    }

    // Sự kiện nhấn phím Enter trong ô tìm kiếm
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                performSearch();
            }
        });
    }
}

/**
 * Thực hiện tìm kiếm sản phẩm theo từ khóa
 * - Lấy giá trị từ ô input tìm kiếm
 * - Reset về trang đầu tiên
 * - Bỏ chọn danh mục đang chọn
 * - Cập nhật tiêu đề trang
 * - Gọi lại API để tải sản phẩm mới
 */
function performSearch() {
    const searchInput = document.getElementById("searchInput");
    currentKeyword = searchInput ? searchInput.value.trim() : '';

    if (currentKeyword !== '') {
        currentCategoryId = '';     // Bỏ chọn danh mục
        currentPage = 0;            // Về trang đầu tiên

        // Cập nhật tiêu đề hiển thị kết quả tìm kiếm
        $('#category-title').text(`Kết quả tìm kiếm cho: "${currentKeyword}"`);

        // Bỏ active tất cả nút danh mục, active nút "Tất cả sản phẩm"
        $('.btn-danh-muc').removeClass('active');
        $('.btn-danh-muc').first().addClass('active');

        loadProducts();  // Tải lại danh sách sản phẩm
    }
}

// =====================================================
// 3. TẢI VÀ HIỂN THỊ SẢN PHẨM
// =====================================================
/**
 * Tải danh sách sản phẩm từ API /api/products/search
 * - Hỗ trợ phân trang, tìm kiếm, lọc theo danh mục, lọc theo giá, sắp xếp
 * - Xây dựng URL động dựa trên các biến filter hiện tại
 * - Khi thành công: render sản phẩm, phân trang, cập nhật số lượng
 * - Khi thất bại: hiển thị thông báo lỗi
 */
function loadProducts() {
    $("#ds-san-pham").html('<div class="loading">Đang tải sản phẩm...</div>');

    // Xây dựng URL cơ bản với phân trang
    let url = `/api/products/search?page=${currentPage}&size=${pageSize}`;

    // Thêm từ khóa tìm kiếm (nếu có)
    if (currentKeyword !== '') {
        url += `&keyword=${encodeURIComponent(currentKeyword)}`;
    }

    // Thêm danh mục (nếu có)
    if (currentCategoryId !== '') {
        url += `&listCategoryId=${currentCategoryId}`;
    }

    // Thêm khoảng giá (nếu có)
    if (currentMinPrice !== '' && currentMinPrice !== null) {
        url += `&minPrice=${currentMinPrice}`;
    }
    if (currentMaxPrice !== '' && currentMaxPrice !== null) {
        url += `&maxPrice=${currentMaxPrice}`;
    }

    // Thêm sắp xếp (nếu có)
    if (currentSortBy && currentSortDir) {
        url += `&sort=${currentSortBy},${currentSortDir}`;
    }

    // Gọi API
    $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        success: function (response) {
            if (response.success && response.data && response.data.content) {
                totalPages = response.data.totalPages;
                totalElements = response.data.totalElements;
                renderProducts(response.data.content);  // Hiển thị danh sách sản phẩm
                renderPagination();                      // Hiển thị phân trang
                updateTotalItems();                      // Cập nhật số lượng sản phẩm
            } else {
                // Không có sản phẩm nào
                $("#ds-san-pham").html('<div class="empty-state">Không tìm thấy sản phẩm phù hợp.</div>');
                $("#total-items").text("(0 sản phẩm)");
                $("#phan-trang").empty();
            }
        },
        error: function (xhr, status, error) {
            console.log("Load products error:", error);
            renderProducts([]);  // Hiển thị danh sách rỗng
        }
    });
}

/**
 * Sắp xếp sản phẩm theo tiêu chí
 * @param {string} sortBy - Trường cần sắp xếp (id, price, name)
 * @param {string} sortDir - Chiều sắp xếp ('asc' hoặc 'desc')
 */
function sortProducts(sortBy, sortDir) {
    currentSortBy = sortBy;
    currentSortDir = sortDir;
    currentPage = 0;      // Về trang đầu tiên khi sắp xếp
    loadProducts();
}

/**
 * Xử lý khi người dùng thay đổi lựa chọn sắp xếp từ dropdown
 * - Lấy giá trị từ select (ví dụ: "price-asc")
 * - Tách thành sortBy và sortDir
 * - Gọi hàm sortProducts
 */
function handleSortChange() {
    const sortValue = document.getElementById("sortPrice").value;
    const [sortBy, sortDir] = sortValue.split("-");  // ["price", "asc"]
    sortProducts(sortBy, sortDir);
}

// =====================================================
// 4. TẢI VÀ HIỂN THỊ DANH MỤC
// =====================================================
/**
 * Tải danh sách danh mục từ API /api/category
 */
function loadCategories() {
    $.ajax({
        url: "/api/category",
        method: "GET",
        dataType: "json",
        success: function (response) {
            if (response.success) {
                renderCategories(response.data || []);
            } else {
                renderCategories([]);
            }
        },
        error: function (xhr, status, error) {
            console.log("Load categories error:", error);
            renderCategories([]);
        }
    });
}

/**
 * Hiển thị danh sách danh mục dưới dạng các nút bấm
 * @param {Array} categories - Mảng các đối tượng danh mục
 */
function renderCategories(categories) {
    const container = $("#phan-trang-1");
    container.empty();

    let html = '<div class="danh-muc">';
    // Nút "Tất cả sản phẩm" (active khi không chọn danh mục nào)
    const allActive = (currentCategoryId === '') ? 'active' : '';
    html += `<button class="btn-danh-muc ${allActive}" onclick="loadProductsByCategory('', 'Tất cả sản phẩm')">Tất cả sản phẩm</button>`;

    // Duyệt từng danh mục (chỉ hiển thị danh mục có status = 1 - active)
    categories.forEach(c => {
        if (c.status === 1) {
            const isActive = (currentCategoryId == c.id) ? 'active' : '';
            // Truyền cả categoryId và categoryName để cập nhật tiêu đề
            html += `<button class="btn-danh-muc ${isActive}" onclick="loadProductsByCategory(${c.id}, '${c.name}')">${c.name}</button>`;
        }
    });

    html += "</div>";
    container.html(html);
}

/**
 * Tải sản phẩm theo danh mục
 * @param {string|number} categoryId - ID danh mục (rỗng = tất cả)
 * @param {string} categoryName - Tên danh mục (để cập nhật tiêu đề)
 */
function loadProductsByCategory(categoryId, categoryName) {
    currentCategoryId = categoryId;
    currentKeyword = '';                    // Xóa từ khóa tìm kiếm
    $('#searchInput').val('');              // Xóa nội dung ô tìm kiếm
    currentPage = 0;                        // Về trang đầu

    // Cập nhật tiêu đề trang
    if (categoryName) {
        $('#category-title').text(categoryName);
    } else if (categoryId === '') {
        $('#category-title').text('Tất cả sản phẩm');
    }

    // Highlight nút danh mục đang active
    $('.btn-danh-muc').removeClass('active');
    if (categoryId === '') {
        $('.btn-danh-muc').first().addClass('active');
    } else {
        $(`.btn-danh-muc[onclick*="loadProductsByCategory(${categoryId}"]`).addClass('active');
    }

    loadProducts();  // Tải lại sản phẩm
}

/**
 * Tải tất cả sản phẩm (xóa bộ lọc danh mục)
 */
function loadAllProducts() {
    loadProductsByCategory('');  // Truyền rỗng để lấy tất cả
}

// =====================================================
// 5. HIỂN THỊ SẢN PHẨM DẠNG THẺ
// =====================================================
/**
 * Render danh sách sản phẩm dạng thẻ HTML
 * @param {Array} products - Mảng các đối tượng sản phẩm
 */
function renderProducts(products) {
    const container = $("#ds-san-pham");
    container.empty();

    if (!products || products.length === 0) {
        container.html('<div class="empty-state">Không có sản phẩm nào.</div>');
        return;
    }

    products.forEach(p => {
        const hasStock = (p.quantity || 0) > 0;           // Kiểm tra tồn kho
        const stockText = hasStock ? "Còn hàng" : "Hết hàng";
        const stockClass = hasStock ? "in-stock" : "out-stock";

        const token = localStorage.getItem("token");
        const isLoggedIn = token && token !== "null" && token !== "undefined";

        // Xác định nút hành động dựa trên trạng thái đăng nhập và tồn kho
        let buttonHtml = '';
        if (isLoggedIn) {
            buttonHtml = `<button class="btn-them ${hasStock ? "" : "out"}" ${hasStock ? `onclick="addToCart(${p.id})"` : "disabled"}>
                            ${hasStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
                          </button>`;
        } else {
            buttonHtml = `<button class="btn-them" onclick="redirectToLogin()">
                            Đăng nhập để mua hàng
                          </button>`;
        }

        const productHTML = `
        <div class="san-pham" onclick="goToProductDetail(${p.id})">
            <div class="thumbnail-wrap">
                <span class="stock-badge ${stockClass}">${stockText}</span>
                <img src="${getProductImageUrl(p.image)}" alt="${escapeHtml(p.name)}" class="anh-san-pham" onerror="this.onerror=null;this.src='/images/default-product.png'">

            </div>
            <div class="product-body">
                <h3 class="ten-san-pham">${escapeHtml(p.name)}</h3>
                <p class="sku">SKU: PRD-${p.id}</p>
                <p class="mo-ta">${escapeHtml(p.description || "Không có mô tả.")}</p>
                <p class="gia-san-pham">${formatPrice(p.price)}</p>
                ${buttonHtml}
            </div>
        </div>`;

        container.append(productHTML);
    });
}

/**
 * Chuyển hướng đến trang chi tiết sản phẩm
 * @param {number} productId - ID sản phẩm
 */
function goToProductDetail(productId) {
    window.location.href = `/product/${productId}`;
}

// =====================================================
// 6. PHÂN TRANG
// =====================================================
/**
 * Render các nút phân trang
 * - Hiển thị số trang hiện tại, tổng số trang, tổng số sản phẩm
 * - Tạo các nút điều hướng: Đầu, Trước, Số trang, Sau, Cuối
 * - Xử lý logic hiển thị dấu "..." khi có nhiều trang
 */
function renderPagination() {
    const container = $("#phan-trang");
    container.empty();

    if (totalPages <= 1) {
        return;
    }

    let html = '<div class="pagination-container">';
    html += `<div class="pagination-info">Trang ${currentPage + 1} / ${totalPages} - Tổng ${totalElements} sản phẩm</div>`;
    html += '<div class="pagination-buttons">';

    // Nút Đầu và Trước (disabled nếu đang ở trang đầu)
    if (currentPage > 0) {
        html += `<button class="btn-pagination" onclick="goToPage(0)">&laquo;</button>`;
        html += `<button class="btn-pagination" onclick="goToPage(${currentPage - 1})">&lsaquo;</button>`;
    } else {
        html += `<button class="btn-pagination disabled" disabled>&laquo;</button>`;
        html += `<button class="btn-pagination disabled" disabled>&lsaquo;</button>`;
    }

    // Tính toán khoảng trang hiển thị (hiển thị tối đa 5 trang)
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Thêm trang 1 và dấu ... nếu cần
    if (startPage > 0) {
        html += `<button class="btn-pagination" onclick="goToPage(0)">1</button>`;
        if (startPage > 1) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }

    // Hiển thị các trang trong khoảng
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="btn-pagination active" disabled>${i + 1}</button>`;
        } else {
            html += `<button class="btn-pagination" onclick="goToPage(${i})">${i + 1}</button>`;
        }
    }

    // Thêm dấu ... và trang cuối nếu cần
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += `<span class="pagination-dots">...</span>`;
        }
        html += `<button class="btn-pagination" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`;
    }

    // Nút Sau và Cuối (disabled nếu đang ở trang cuối)
    if (currentPage < totalPages - 1) {
        html += `<button class="btn-pagination" onclick="goToPage(${currentPage + 1})">&rsaquo;</button>`;
        html += `<button class="btn-pagination" onclick="goToPage(${totalPages - 1})">&raquo;</button>`;
    } else {
        html += `<button class="btn-pagination disabled" disabled>&rsaquo;</button>`;
        html += `<button class="btn-pagination disabled" disabled>&raquo;</button>`;
    }

    html += "</div></div>";
    container.html(html);
}

/**
 * Chuyển đến trang chỉ định
 * @param {number} page - Số trang cần chuyển (bắt đầu từ 0)
 */
function goToPage(page) {
    if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadProducts();                     // Tải lại sản phẩm
        window.scrollTo({ top: 0, behavior: "smooth" });  // Cuộn lên đầu trang
    }
}

/**
 * Cập nhật hiển thị tổng số sản phẩm
 */
function updateTotalItems() {
    $("#total-items").text(`(${totalElements} sản phẩm)`);
}

// =====================================================
// 7. HÀM TIỆN ÍCH (Format, Escape, Xử lý ảnh)
// =====================================================
/**
 * Định dạng số tiền theo chuẩn Việt Nam
 * @param {number} price - Số tiền cần định dạng
 * @returns {string} - Chuỗi đã định dạng, ví dụ: "100,000 VND"
 */
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + " VND";
}

/**
 * Escape chuỗi để tránh tấn công XSS
 * @param {string} text - Chuỗi đầu vào
 * @returns {string} - Chuỗi đã được escape
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Xử lý URL ảnh sản phẩm
 * - Nếu là URL tuyệt đối (http, https, /, data:, blob:) → giữ nguyên
 * - Nếu là đường dẫn tương đối → thêm prefix /images/
 * @param {string} image - Đường dẫn ảnh gốc
 * @returns {string} - Đường dẫn ảnh đã xử lý
 */
function getProductImageUrl(image) {
    if (!image) {
        return "/uploads/products/default-product.png";
    }

    const value = image.trim();
    // Kiểm tra nếu là URL tuyệt đối hoặc đã có dấu /
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:")) {
        return value;
    }

    // Xử lý đường dẫn tương đối
    return value.startsWith("images/") ? `/${value}` : `/images/${value}`;
}

// =====================================================
// 8. GIỎ HÀNG & XÁC THỰC
// =====================================================
/**
 * Chuyển hướng đến trang đăng nhập khi chưa đăng nhập
 */
function redirectToLogin() {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "/login";
}

/**
 * Thêm sản phẩm vào giỏ hàng (bất đồng bộ)
 * @param {number} productId - ID sản phẩm cần thêm
 * @param {number} quantity - Số lượng (mặc định = 1)
 */
async function addToCart(productId, quantity = 1) {
    event.stopPropagation();  // Ngăn chặn sự kiện click lan ra ngoài (không mở chi tiết sản phẩm)

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/login";
        return;
    }

    const payload = {
        userId: parseInt(userId, 10),
        productId: parseInt(productId, 10),
        quantity: parseInt(quantity, 10)
    };

    try {
        const res = await fetch("/api/carts/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alert("Đã thêm sản phẩm vào giỏ hàng!");
        } else {
            alert("Thêm sản phẩm thất bại: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi khi thêm sản phẩm vào giỏ hàng");
    }
}

// =====================================================
// 9. TOPBAR ACTIONS (Logout, Cart, Login, Orders)
// =====================================================
/**
 * Gán sự kiện cho các nút trên topbar
 * - Logout: xóa token và chuyển hướng
 * - Cart: kiểm tra đăng nhập rồi chuyển đến /cart
 * - Login: chuyển đến /login
 * - Orders: kiểm tra đăng nhập rồi chuyển đến /orders
 */
function bindTopActions() {
    const logoutBtn = document.getElementById("logout-btn");
    const cartBtn = document.getElementById("cart-btn");
    const loginBtn = document.getElementById("login-btn");
    ensureOrdersButton(cartBtn);  // Đảm bảo có nút "Đơn hàng"
    const ordersBtn = document.getElementById("orders-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    if (cartBtn) {
        cartBtn.addEventListener("click", function () {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Vui lòng đăng nhập để xem giỏ hàng!");
                window.location.href = "/login";
                return;
            }
            window.location.href = "/cart";
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", function () {
            window.location.href = "/login";
        });
    }

    if (ordersBtn) {
        ordersBtn.addEventListener("click", function () {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Vui lòng đăng nhập để xem đơn hàng!");
                window.location.href = "/login?redirect=/orders";
                return;
            }
            window.location.href = "/orders";
        });
    }
}

/**
 * Xử lý đăng xuất: xóa thông tin trong localStorage và chuyển về login
 */
function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/login";
}

/**
 * Đảm bảo nút "Đơn hàng" tồn tại trên topbar
 * @param {HTMLElement} cartBtn - Nút giỏ hàng
 */
function ensureOrdersButton(cartBtn) {
    if (!cartBtn || document.getElementById("orders-btn")) {
        return;
    }

    const ordersBtn = document.createElement("button");
    ordersBtn.id = "orders-btn";
    ordersBtn.className = "icon-btn";
    ordersBtn.type = "button";
    ordersBtn.title = "Đơn hàng của tôi";
    ordersBtn.textContent = "Đơn hàng";
    cartBtn.insertAdjacentElement("afterend", ordersBtn);
}

/**
 * Cập nhật giao diện dựa trên trạng thái đăng nhập
 * - Nếu đã đăng nhập: hiện nút logout, ẩn nút login
 * - Nếu chưa đăng nhập: ẩn nút logout, hiện nút login
 */
function updateUIByAuthStatus() {
    const token = localStorage.getItem("token");
    const isLoggedIn = token && token !== "null" && token !== "undefined";

    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");

    if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? "inline-block" : "none";
    }

    if (loginBtn) {
        loginBtn.style.display = isLoggedIn ? "none" : "inline-block";
    }
}

// =====================================================
// 10. LỌC THEO GIÁ
// =====================================================
/**
 * Gán sự kiện cho các nút lọc giá khi trang đã sẵn sàng
 */
$(document).ready(function () {
    const applyBtn = document.getElementById("applyPriceFilter");
    const clearBtn = document.getElementById("clearFilter");

    if (applyBtn) {
        applyBtn.addEventListener("click", applyPriceFilter);
    }
    if (clearBtn) {
        clearBtn.addEventListener("click", clearFilters);
    }

    // Cho phép nhấn Enter trong input giá để lọc
    const minPriceInput = document.getElementById("minPrice");
    const maxPriceInput = document.getElementById("maxPrice");

    if (minPriceInput) {
        minPriceInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") applyPriceFilter();
        });
    }
    if (maxPriceInput) {
        maxPriceInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") applyPriceFilter();
        });
    }
});

/**
 * Áp dụng bộ lọc giá
 * - Lấy giá trị từ ô input minPrice và maxPrice
 * - Kiểm tra giá trị hợp lệ (min <= max)
 * - Cập nhật biến currentMinPrice, currentMaxPrice
 * - Reset về trang đầu tiên
 * - Cập nhật tiêu đề hiển thị
 * - Gọi lại API để tải sản phẩm mới
 */
function applyPriceFilter() {
    const minInput = document.getElementById("minPrice");
    const maxInput = document.getElementById("maxPrice");

    const minVal = minInput ? minInput.value.trim() : '';
    const maxVal = maxInput ? maxInput.value.trim() : '';

    // Validate: giá từ không được lớn hơn giá đến
    if (minVal !== '' && maxVal !== '' && parseFloat(minVal) > parseFloat(maxVal)) {
        alert("Giá từ không được lớn hơn giá đến!");
        return;
    }

    currentMinPrice = minVal !== '' ? parseFloat(minVal) : '';
    currentMaxPrice = maxVal !== '' ? parseFloat(maxVal) : '';
    currentPage = 0;  // Về trang đầu

    // Xây dựng tiêu đề hiển thị
    let filterText = 'Tất cả sản phẩm';
    if (currentKeyword !== '') {
        filterText = `Kết quả tìm kiếm: "${currentKeyword}"`;
    } else if (currentCategoryId !== '') {
        const activeBtn = $('.btn-danh-muc.active');
        filterText = activeBtn.length ? activeBtn.text() : 'Tất cả sản phẩm';
    }

    // Thêm khoảng giá vào tiêu đề
    if (currentMinPrice !== '' || currentMaxPrice !== '') {
        const minStr = currentMinPrice !== '' ? formatPrice(currentMinPrice) : '0 VND';
        const maxStr = currentMaxPrice !== '' ? formatPrice(currentMaxPrice) : '∞';
        filterText += ` (Giá: ${minStr} - ${maxStr})`;
    }

    $('#category-title').text(filterText);
    loadProducts();  // Tải lại sản phẩm
}

/**
 * Xóa tất cả bộ lọc
 * - Reset giá trị các ô input
 * - Reset tất cả biến filter về giá trị mặc định
 * - Reset trang về số 0
 * - Reset sắp xếp về mặc định (id-desc)
 * - Active nút "Tất cả sản phẩm"
 * - Tải lại sản phẩm
 */
function clearFilters() {
    const minInput = document.getElementById("minPrice");
    const maxInput = document.getElementById("maxPrice");

    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';

    // Reset tất cả biến filter
    currentMinPrice = '';
    currentMaxPrice = '';
    currentKeyword = '';
    currentCategoryId = '';
    currentPage = 0;
    currentSortBy = 'id';
    currentSortDir = 'desc';

    // Reset giao diện
    $('#searchInput').val('');
    $('#sortPrice').val('id-desc');
    $('#category-title').text('Tất cả sản phẩm');

    // Active nút "Tất cả sản phẩm"
    $('.btn-danh-muc').removeClass('active');
    $('.btn-danh-muc').first().addClass('active');

    loadProducts();  // Tải lại sản phẩm
}