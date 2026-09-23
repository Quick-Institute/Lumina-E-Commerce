import store from "../data/store";
import api, {isBackendConfigured} from "./api";

const delay = (ms = 180) => new Promise((res) => setTimeout(res, ms));

export async function getMyOrders(customerId = "u1") {
    if (isBackendConfigured) {
        const {data} = await api.get("/orders/mine");
        return data;
    }
    await delay();
    return store.getOrdersByCustomer(customerId);
}

export async function getOrder(id) {
    await delay(120);
    return store.getOrderById(id);
}

export async function placeOrder(payload) {
    if (isBackendConfigured) {
        const {data} = await api.post("/orders", payload);
        return data;
    }
    await delay(500); // simulates a network round-trip

    const problems = [];
    for (const it of payload.items || []) {
        const p = store.getProductById(it.productId);
        if (!p || p.status !== "Active") {
            problems.push(`${it.name || it.productId} is no longer available`);
        } else if (it.qty > p.stock) {
            problems.push(`Only ${p.stock} × ${p.name} left in stock (you asked for ${it.qty})`);
        }
    }
    if (problems.length) {
        const err = new Error(`Stock changed while you were shopping — ${problems.join("; ")}.`);
        err.code = "STOCK_UNAVAILABLE";
        throw err;
    }

    return store.addOrder(payload);
}

export async function cancelOrder(id, reason) {
    await delay(250);
    const res = store.cancelOrder(id, reason);
    if (res && res.error) {
        const err = new Error(res.error);
        err.code = "CANCEL_NOT_ALLOWED";
        throw err;
    }
    return res;
}

export async function getAllOrders() {
    if (isBackendConfigured) {
        const {data} = await api.get("/admin/orders");
        return data;
    }
    await delay();
    return store.getAllOrders();
}

export async function getSellerOrders(sellerId) {
    await delay();
    return store.getOrdersBySeller(sellerId);
}

export async function updateOrderStatus(id, status) {
    if (isBackendConfigured) {
        const {data} = await api.patch(`/orders/${id}/status`, {status});
        return data;
    }
    await delay(200);
    return store.updateOrderStatus(id, status);
}
