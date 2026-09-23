import {
    CATEGORIES,
    SELLERS,
    USERS,
    PRODUCTS,
    INVENTORY,
    ORDERS,
    PLATFORM_ORDERS,
    MONTHLY_SALES,
    CATEGORY_SPLIT,
    ADMIN_ACTIVITY,
    SELLER_TOP_PRODUCTS,
} from "./mockData";

const state = {
    categories: [...CATEGORIES],
    sellers: [...SELLERS],
    users: USERS.map((u) => ({...u})),
    products: PRODUCTS.map((p) => ({...p})),
    inventory: INVENTORY.map((i) => ({...i})),
    orders: ORDERS.map((o) => ({...o})),
    platformOrders: PLATFORM_ORDERS.map((o) => ({...o})),
    monthlySales: MONTHLY_SALES,
    categorySplit: CATEGORY_SPLIT,
    topProducts: SELLER_TOP_PRODUCTS,
    activity: ADMIN_ACTIVITY,
};

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

const now = () => new Date().toISOString();

/* ── products & inventory ─────────────────────────────────────────────────── */

const stockOf = (productId) => state.products.find((p) => p.id === productId)?.stock ?? 0;

export const store = {
    getProducts() {
        return clone(state.products);
    },
    getProductById(id) {
        const p = state.products.find((x) => x.id === id || x.slug === id);
        return p ? clone(p) : null;
    },
    getProductForDetails(id) {
        const p = state.products.find((x) => x.id === id || x.slug === id);
        if (!p) return null;
        const seller = state.sellers.find((s) => s.id === p.sellerId) || null;
        return clone({...p, seller});
    },
    addProduct(data) {
        const product = {
            id: uid("p"),
            rating: 0,
            reviewCount: 0,
            soldCount: 0,
            reviews: [],
            ratingBreakdown: null,
            highlights: [],
            specs: [],
            image: null,
            createdAt: now(),
            featured: false,
            popular: false,
            ...data,
        };
        state.products.unshift(product);
        state.inventory.unshift({
            id: uid("inv"),
            productId: product.id,
            quantity: product.stock || 0,
            reservedQuantity: 0,
            lowStockLevel: product.lowStockLevel ?? 5,
            lastUpdated: now(),
        });
        return clone(product);
    },
    updateProduct(id, patch) {
        const p = state.products.find((x) => x.id === id);
        if (!p) return null;
        Object.assign(p, patch, {updatedAt: now()});
        if (patch.stock !== undefined) store.setStock(id, patch.stock);
        return clone(p);
    },
    removeProduct(id) {
        state.products = state.products.filter((p) => p.id !== id);
        state.inventory = state.inventory.filter((i) => i.productId !== id);
    },
    getInventory() {
        return clone(
            state.inventory.map((inv) => {
                const product = state.products.find((p) => p.id === inv.productId);
                const seller = product ? state.sellers.find((s) => s.id === product.sellerId) : null;
                return {...inv, product: product || null, seller: seller || null};
            })
        );
    },
    setStock(productId, quantity) {
        const p = state.products.find((x) => x.id === productId);
        if (p) p.stock = Math.max(0, Number(quantity) || 0);
        const inv = state.inventory.find((x) => x.productId === productId);
        if (inv) {
            inv.quantity = p ? p.stock : 0;
            inv.lastUpdated = now();
        }
    },

    /* ── categories ── */
    getCategories() {
        return clone(
            state.categories.map((c) => ({
                ...c,
                productCount: state.products.filter((p) => p.category === c.name && p.status === "Active").length,
            }))
        );
    },
    addCategory(data) {
        const category = {id: uid("c"), status: "Active", createdAt: now(), ...data};
        state.categories.push(category);
        return clone(category);
    },
    updateCategory(id, patch) {
        const c = state.categories.find((x) => x.id === id);
        if (!c) return null;
        Object.assign(c, patch);
        return clone(c);
    },
    removeCategory(id) {
        const category = state.categories.find((x) => x.id === id);
        if (!category) return false;
        const inUse = state.products.some((p) => p.category === category.name);
        if (inUse) {
            const err = new Error("This category still contains products. Move or deactivate them first.");
            err.code = "CATEGORY_IN_USE";
            throw err;
        }
        state.categories = state.categories.filter((c) => c.id !== id);
        return true;
    },

    /* ── sellers & users ── */
    getSellers() {
        return clone(
            state.sellers.map((s) => {
                const products = state.products.filter((p) => p.sellerId === s.id);
                const user = state.users.find((u) => u.id === s.userId);
                return {
                    ...s,
                    productCount: products.length,
                    ownerName: user ? user.name : "—",
                    ownerEmail: user ? user.email : "—",
                    products: products.map((p) => p.id)
                };
            })
        );
    },
    getSellerById(id) {
        const s = state.sellers.find((x) => x.id === id);
        if (!s) return null;
        const products = state.products.filter((p) => p.sellerId === id && p.status === "Active");
        return clone({...s, products});
    },
    updateSeller(id, patch) {
        const s = state.sellers.find((x) => x.id === id);
        if (!s) return null;
        Object.assign(s, patch);
        return clone(s);
    },
    getUsers(role) {
        const users = state.users.filter((u) => (role ? u.role === role : true));
        return clone(users.map(({password, ...u}) => u));
    },
    getUserById(id) {
        const u = state.users.find((x) => x.id === id);
        if (!u) return null;
        const {password, ...safe} = u;
        return clone(safe);
    },
    updateUser(id, patch) {
        const u = state.users.find((x) => x.id === id);
        if (!u) return null;
        Object.assign(u, patch);
        return store.getUserById(id);
    },
    findUserByEmail(email) {
        return state.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase()) || null;
    },
    registerUser(data) {
        const user = {
            id: uid("u"),
            status: "Active",
            joinedAt: now().slice(0, 10),
            avatarLetter: (data.name || "?").trim().charAt(0).toUpperCase(),
            memberTier: "Standard Member",
            ...data,
        };
        state.users.push(user);
        return store.getUserById(user.id);
    },

    /* ── orders ── */
    getOrdersByCustomer(customerId) {
        return clone(state.orders.filter((o) => o.customerId === customerId).sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)));
    },
    getOrderById(id) {
        const o = state.orders.find((x) => x.id === id || x.orderNumber.replace("#", "") === id);
        return o ? clone(o) : null;
    },
    getAllOrders() {
        const all = [...state.orders, ...state.platformOrders].map((o) => ({
            ...o,
            items: (o.items || []).map((it) => ({
                ...it,
                sellerId: state.products.find((p) => p.id === it.productId)?.sellerId || null
            })),
        }));
        return clone(all.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)));
    },
    getOrdersBySeller(sellerId) {
        const all = store.getAllOrders();
        return all.filter((o) => o.items.some((it) => it.sellerId === sellerId));
    },
    addOrder(payload) {
        const maxNum = Math.max(
            186,
            ...[...state.orders, ...state.platformOrders].map((o) => Number(String(o.orderNumber).replace(/\D/g, "").slice(4)) || 0)
        );
        const id = uid("o");
        const order = {
            id,
            orderNumber: `#ORD-2026-${String(maxNum + 1).padStart(5, "0")}`,
            placedAt: now(),
            status: "Pending",
            payment: {
                method: payload.paymentMethod || "Cash on Delivery",
                status: "Pending",
                amount: payload.totalAmount
            },
            timeline: [
                {
                    key: "pending",
                    title: "Pending",
                    note: "Order placed and awaiting seller confirmation",
                    at: now(),
                    done: true
                },
            ],
            estimatedDelivery: null,
            cancelledAt: null,
            cancellationReason: null,
            ...payload,
        };
        state.orders.unshift(order);
        /* Inventory rule (plan §5.8): reduce stock when an order is placed. */
        (order.items || []).forEach((it) => {
            const next = Math.max(0, stockOf(it.productId) - it.qty);
            store.setStock(it.productId, next);
            const prod = state.products.find((x) => x.id === it.productId);
            if (prod) prod.soldCount = (prod.soldCount || 0) + it.qty; // feeds popularity ranking
        });
        return clone(order);
    },
    cancelOrder(id, reason) {
        const o = state.orders.find((x) => x.id === id);
        if (!o) return null;
        if (!["Pending", "Processing"].includes(o.status)) return {error: "This order can no longer be cancelled."};
        o.status = "Cancelled";
        o.cancelledAt = now();
        o.cancellationReason = reason || null;
        o.payment.status = "Cancelled";
        o.timeline = (o.timeline || []).filter((t) => !t.key.includes("delivered"));
        o.timeline.push({
            key: "cancelled",
            title: "Cancelled",
            note: "Order was cancelled by the user",
            at: now(),
            cancelled: true,
        });
        /* Stock returns to inventory on cancellation; sales counter follows. */
        (o.items || []).forEach((it) => {
            store.setStock(it.productId, stockOf(it.productId) + it.qty);
            const prod = state.products.find((x) => x.id === it.productId);
            if (prod) prod.soldCount = Math.max(0, (prod.soldCount || 0) - it.qty);
        });
        return clone(o);
    },
    updateOrderStatus(id, status) {
        const o = state.orders.find((x) => x.id === id);
        if (!o) return null;
        o.status = status;
        const map = {
            Processing: "Seller is preparing your order for dispatch",
            Shipped: "Your order has been dispatched for delivery",
            Delivered: "Order delivered successfully to your address",
            Cancelled: "Order was cancelled",
        };
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
            key: status.toLowerCase(),
            title: status,
            note: map[status] || "",
            at: now(),
            done: status !== "Cancelled"
        });
        if (status === "Delivered") o.payment = {...o.payment, status: "Paid"};
        if (status === "Cancelled") o.payment = {...o.payment, status: "Cancelled"};
        return clone(o);
    },

    /* ── stats ── */
    monthlySales() {
        return clone(state.monthlySales);
    },
    categorySplit() {
        return clone(state.categorySplit);
    },
    topProducts() {
        return clone(state.topProducts);
    },
    activity() {
        return clone(state.activity);
    },
    platformSnapshot() {
        const revenue = state.monthlySales.reduce((s, m) => s + m.revenue, 0);
        const orders = [...state.orders, ...state.platformOrders];
        return {
            revenue,
            totalOrders: orders.length,
            totalProducts: state.products.length,
            totalCustomers: state.users.filter((u) => u.role === "Customer").length,
            totalSellers: state.sellers.length,
            pendingSellers: state.sellers.filter((s) => s.approvalStatus === "Pending").length,
            lowStock: state.products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockLevel ?? 5)).length,
            outOfStock: state.products.filter((p) => p.stock === 0).length,
            ordersByStatus: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => ({
                name: status,
                value: orders.filter((o) => o.status === status).length,
            })),
        };
    },
};

export default store;