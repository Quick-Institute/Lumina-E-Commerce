import store from "../data/store";
import api from "./api"

const delay = (ms = 160) => new Promise((res) => setTimeout(res, ms));

/* Users (admin) */
export async function listUsers(role) {
    await delay();
    return store.getUsers(role);
}

export async function setUserStatus(id, status) {
    await delay(140);
    return store.updateUser(id, {status});
}

/* Sellers (admin) */
export async function listSellers() {
    await delay();
    return store.getSellers();
}

export async function getSeller(id) {
    await delay(120);
    return store.getSellerById(id);
}

export async function setSellerApproval(id, approvalStatus) {
    await delay(200);
    return store.updateSeller(id, {approvalStatus});
}

export async function updateSellerProfile(id, patch) {
    await delay(220);
    return store.updateSeller(id, patch);
}

/** Admin decision on a seller application (Approve / Reject with reason). */
export async function reviewSellerApplication(id, decision, reason) {
    await delay(240);
    return store.updateSeller(id, {
        approvalStatus: decision,
        reviewedAt: new Date().toISOString(),
        rejectionReason: decision === "Rejected" ? reason : null,
        accountStatus: decision === "Approved" ? "Active" : "Inactive",
    });
}

/** Everything the admin User Details screen shows, in one round-trip. */
export async function getUserDetail(userId) {
    await delay(140);
    const user = store.getUserById(userId);
    if (!user) return null;
    const orders = store.getAllOrders().filter((o) => o.customerId === userId);
    const paid = orders.filter((o) => o.status !== "Cancelled");
    const all = store.getAllOrders();
    const avg = all.length ? all.reduce((s, o) => s + o.totalAmount, 0) / all.length : 0;
    return {
        user,
        orders,
        stats: {
            totalOrders: orders.length,
            totalSpent: paid.reduce((s, o) => s + o.totalAmount, 0),
            cancelled: orders.filter((o) => o.status === "Cancelled").length,
            vsAverage: avg ? Math.round(((paid.reduce((s, o) => s + o.totalAmount, 0) / Math.max(paid.length, 1) - avg) / avg) * 100) : 0,
        },
    };
}

/** Admin Seller Details: profile + ALL products (incl. unlisted) + history. */
export async function getAdminSellerDetail(sellerId) {
    await delay(160);
    const sellers = store.getSellers();
    const seller = sellers.find((x) => x.id === sellerId);
    if (!seller) return null;
    const products = store.getProducts().filter((p) => p.sellerId === sellerId);
    const orders = store.getOrdersBySeller(sellerId);
    const delivered = orders.filter((o) => o.status === "Delivered");
    return {
        seller,
        products,
        orders,
        stats: {
            totalProducts: products.length,
            activeProducts: products.filter((p) => p.status === "Active").length,
            totalOrders: orders.length,
            lifetimeRevenue: delivered.reduce((s, o) => s + o.totalAmount, 0),
        },
    };
}

/* Categories (admin + shop nav) */
export async function listCategories() {
    await delay(80);
    return store.getCategories();
}

export async function saveCategory(data, id) {
    await delay(180);
    return id ? store.updateCategory(id, data) : store.addCategory(data);
}

export async function deleteCategory(id) {
    await delay(180);
    return store.removeCategory(id);
}

/* Customer profile */
export async function getProfile(userId) {
    await delay(100);
    return store.getUserById(userId);
}

export async function updateProfile(userId, data) {
    try {
        const formData = new FormData();

        formData.append("name", data.name);
        formData.append("phone", data.phone);

        if (data.avatar instanceof File) {
            formData.append("avatar", data.avatar);
        }

        const response = await api.patch(
            "/account/profile",
            formData
        );

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            "Unable to update profile.";

        const err = new Error(message);
        err.code = error.response?.status;

        throw err;
    }
}

/* Stats */
export async function getPlatformStats() {
    await delay(200);
    return {
        snapshot: store.platformSnapshot(),
        sales: store.monthlySales(),
        categorySplit: store.categorySplit(),
        activity: store.activity(),
    };
}

export async function getSellerStats(sellerId) {
    await delay(200);
    const products = store.getProducts().filter((p) => p.sellerId === sellerId);
    const orders = store.getOrdersBySeller(sellerId);
    const sales = store.monthlySales();
    const scale = 0.26; // deterministic demo scaling for the seller slice
    return {
        sales: sales.map((m) => ({
            month: m.month,
            revenue: Math.round(m.revenue * scale),
            orders: Math.round(m.orders * scale),
        })),
        topProducts: store.topProducts(),
        snapshot: {
            revenue: Math.round(sales.reduce((s, m) => s + m.revenue, 0) * scale),
            orders: orders.length,
            products: products.length,
            lowStock: products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockLevel ?? 5)).length,
            outOfStock: products.filter((p) => p.stock === 0).length,
        },
    };
}