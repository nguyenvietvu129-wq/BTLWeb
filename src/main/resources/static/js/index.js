// ========== TRANG INDEX (Trang chủ) ==========
let currentPage = 0;
let pageSize = 12;
let totalPages = 0;
let totalElements = 0;
let currentSortBy = 'id';
let currentSortDir = 'desc';

$(document).ready(function () {
    bindTopActions();
    bindSearchEvents();
    loadCategories();
    loadProducts(); // Load tất cả sản phẩm từ API /all
    updateUIByAuthStatus();
});

function bindSearchEvents() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    if (searchBtn) {
        searchBtn.addEventListener("click", function() {
            performSearch();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.getElementById("searchInput");
    const keyword = searchInput ? searchInput.value.trim() : '';

    if (keyword !== '') {
        // Chuyển sang trang search với từ khóa
        window.location.href = `/search?keyword=${encodeURIComponent(keyword)}`;
    } else {
        alert("Vui lòng nhập từ khóa tìm kiếm!");
    }
}

// Load products từ API /all (không có filter)
function loadProducts() {
    $("#ds-san-pham").html('<div class="loading">Đang tải sản phẩm...</div>');

    // Sử dụng API /api/products/all thay vì /search
    let url = `/api/products/all?page=${currentPage}&size=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}`;

    console.log('Loading all products from /all:', url);

    $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        success: function (response) {
            if (response.success && response.data) {
                totalPages = response.data.totalPages;
                totalElements = response.data.totalElements;
                renderProducts(response.data.content || []);
                renderPagination();
                updateTotalItems();
            } else {
                renderProducts([]);
            }
        },
        error: function (xhr, status, error) {
            console.log("Load products error:", error);
            renderProducts([]);
        }
    });
}

// Sort products
function sortProducts(sortBy, sortDir) {
    currentSortBy = sortBy;
    currentSortDir = sortDir;
    currentPage = 0;
    loadProducts();
}

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

function renderCategories(categories) {
    const container = $("#phan-trang-1");
    container.empty();

    let html = '<div class="danh-muc">';
    html += `<button class="btn-danh-muc active" onclick="loadProducts()">Tất cả sản phẩm</button>`;

    categories.forEach(c => {
        if (c.status === 1) {
            html += `<button class="btn-danh-muc" onclick="loadProductsByCategory(${c.id})">${c.name}</button>`;
        }
    });

    html += "</div>";
    container.html(html);
}

function loadProductsByCategory(categoryId) {
    // Chuyển sang trang search với categoryId
    window.location.href = `/search?categoryId=${categoryId}`;
}

function renderProducts(products) {
    const container = $("#ds-san-pham");
    container.empty();

    if (!products || products.length === 0) {
        container.html('<div class="empty-state">Không có sản phẩm nào.</div>');
        return;
    }

    products.forEach(p => {
        const hasStock = (p.quantity || 0) > 0;
        const stockText = hasStock ? "Còn hàng" : "Hết hàng";
        const stockClass = hasStock ? "in-stock" : "out-stock";

        const token = localStorage.getItem("token");
        const isLoggedIn = token && token !== "null" && token !== "undefined";

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
                <img src="${p.image || '/images/default-product.png'}" alt="${p.name}" class="anh-san-pham" onerror="this.src='/images/default-product.png'">
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

function goToProductDetail(productId) {
    window.location.href = `/product/${productId}`;
}

function renderPagination() {
    const container = $("#phan-trang");
    container.empty();

    if (totalPages <= 1) {
        return;
    }

    let html = '<div class="pagination-container">';
    html += `<div class="pagination-info">Trang ${currentPage + 1} / ${totalPages} - Tổng ${totalElements} sản phẩm</div>`;
    html += '<div class="pagination-buttons">';

    if (currentPage > 0) {
        html += `<button class="btn-pagination" onclick="goToPage(0)">&laquo;</button>`;
        html += `<button class="btn-pagination" onclick="goToPage(${currentPage - 1})">&lsaquo;</button>`;
    } else {
        html += `<button class="btn-pagination disabled" disabled>&laquo;</button>`;
        html += `<button class="btn-pagination disabled" disabled>&lsaquo;</button>`;
    }

    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage > 0) {
        html += `<button class="btn-pagination" onclick="goToPage(0)">1</button>`;
        if (startPage > 1) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="btn-pagination active" disabled>${i + 1}</button>`;
        } else {
            html += `<button class="btn-pagination" onclick="goToPage(${i})">${i + 1}</button>`;
        }
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += `<span class="pagination-dots">...</span>`;
        }
        html += `<button class="btn-pagination" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`;
    }

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

function goToPage(page) {
    if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function updateTotalItems() {
    $("#total-items").text(`(${totalElements} sản phẩm)`);
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + " VND";
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function redirectToLogin() {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "/login";
}

async function addToCart(productId, quantity = 1) {
    event.stopPropagation(); // Ngăn click vào sản phẩm
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

function bindTopActions() {
    const logoutBtn = document.getElementById("logout-btn");
    const cartBtn = document.getElementById("cart-btn");
    const loginBtn = document.getElementById("login-btn");

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
}

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

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/login";
}