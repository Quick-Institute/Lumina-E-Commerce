import store from "../data/store";
import api, {isBackendConfigured} from "./api";
import {rankBySearch, tokenize} from "../utils/search";

const delay = (ms = 160) => new Promise((res) => setTimeout(res, ms));

/** Units sold to date, with review count as the legacy fallback. */
const popularityOf = (p) => (p.soldCount ?? 0) * 100 + (p.reviewCount ?? 0);

export function sortProducts(list, sort) {
    const arr = [...list];
    switch (sort) {
        case "price-asc":
            return arr.sort((a, b) => a.price - b.price);
        case "price-desc":
            return arr.sort((a, b) => b.price - a.price);
        case "rating":
            return arr.sort((a, b) => b.rating - a.rating);
        case "popular":
            return arr.sort((a, b) => popularityOf(b) - popularityOf(a));
        case "newest":
        default:
            return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

export async function listProducts(query = {}) {
    const {
        search = "",
        categories = [],
        min,
        max,
        availability = "all", // all | in | out
        sort = "newest",
        page = 1,
        perPage = 12,
        status,
        includeAll = false, // admin views list Draft/Inactive too
        sellerId,
    } = query;

    if (isBackendConfigured) {
        const {data} = await api.get("/products", {params: query});
        return data;
    }

    await delay();
    let items = store.getProducts();
    if (status) items = items.filter((p) => p.status === status);
    else if (!includeAll) items = items.filter((p) => p.status === "Active");
    if (sellerId) items = items.filter((p) => p.sellerId === sellerId);
    const hasSearch = tokenize(search).length > 0;
    if (hasSearch) {
        // fuzzy, order-insensitive relevance ranking (see utils/search.js)
        items = rankBySearch(items, search);
    }
    if (categories.length) items = items.filter((p) => categories.includes(p.category));
    if (min !== undefined && min !== "" && !Number.isNaN(Number(min)))
        items = items.filter((p) => p.price >= Number(min));
    if (max !== undefined && max !== "" && !Number.isNaN(Number(max)))
        items = items.filter((p) => p.price <= Number(max));
    if (availability === "in") items = items.filter((p) => p.stock > 0);
    if (availability === "out") items = items.filter((p) => p.stock === 0);

    if (!hasSearch || (sort && sort !== "newest")) items = sortProducts(items, sort);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, Number(page)), pages);
    const paged = items.slice((safePage - 1) * perPage, safePage * perPage);
    return {items: paged, total, page: safePage, pages, perPage};
}

export async function getProduct(id) {
    if (isBackendConfigured) {
        const {data} = await api.get(`/products/${id}`);
        return data;
    }
    await delay();
    const product = store.getProductForDetails(id);
    if (!product) {
        const err = new Error("Product not found");
        err.code = "NOT_FOUND";
        throw err;
    }
    return product;
}

export async function getRelatedProducts(product, limit = 4) {
    await delay(80);
    const all = store.getProducts().filter((p) => p.status === "Active" && p.id !== product.id);
    const sameCat = all.filter((p) => p.category === product.category);
    const rest = all.filter((p) => p.category !== product.category);
    return [...sameCat, ...rest].slice(0, limit);
}

export async function getFeaturedProducts(limit = 4) {
    await delay(100);
    return store.getProducts().filter((p) => p.featured && p.status === "Active").slice(0, limit);
}

export async function getPopularProducts(limit = 4) {
    await delay(100);
    // "Popular Right Now" = genuine best sellers (units sold), same ranking
    // the storefront's Most Popular sort uses, so the rail and View All agree.
    const sold = sortProducts(store.getProducts().filter((p) => p.status === "Active"), "popular");
    if (sold.length >= limit) return sold.slice(0, limit);
    const extra = store
        .getProducts()
        .filter((p) => p.popular && p.status === "Active" && !sold.some((x) => x.id === p.id));
    return [...sold, ...extra].slice(0, limit);
}

export async function getSellerProducts(sellerId) {
    await delay(100);
    return store.getProducts().filter((p) => p.sellerId === sellerId && p.status !== "Draft");
}

export async function saveProduct(data, id) {
    if (isBackendConfigured) {
        const {data: res} = id ? await api.put(`/products/${id}`, data) : await api.post("/products", data);
        return res;
    }
    await delay(220);
    return id ? store.updateProduct(id, data) : store.addProduct(data);
}

export async function deleteProduct(id) {
    if (isBackendConfigured) {
        await api.delete(`/products/${id}`);
        return true;
    }
    await delay(150);
    store.removeProduct(id);
    return true;
}

export async function toggleProductStatus(id) {
    await delay(120);
    const p = store.getProductById(id);
    if (!p) return null;
    return store.updateProduct(id, {status: p.status === "Active" ? "Inactive" : "Active"});
}

export async function updateStock(productId, quantity) {
    await delay(120);
    store.setStock(productId, quantity);
    return store.getProductById(productId);
}

export async function getInventory() {
    if (isBackendConfigured) {
        const {data} = await api.get("/inventory");
        return data;
    }
    await delay(140);
    return store.getInventory();
}