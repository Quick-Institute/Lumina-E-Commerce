import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import store from "../data/store";

const STORAGE_KEY = "lumina.cart";

const CartContext = createContext(null);

const DEMO_CART = [
    {productId: "p1", qty: 1},
    {productId: "p2", qty: 1},
    {productId: "p3", qty: 2},
];

function readStored() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return DEMO_CART;
        return JSON.parse(raw);
    } catch {
        return DEMO_CART;
    }
}

export function CartProvider({children}) {
    const [items, setItems] = useState(readStored);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const add = useCallback(
        (productId, qty = 1) => {
            const product = store.getProductById(productId);
            const stock = product ? product.stock : 0;
            const current = items.find((i) => i.productId === productId)?.qty ?? 0;
            const next = Math.min(current + qty, stock);
            const applied = Math.max(0, next - current);

            if (applied > 0) {
                setItems((prev) => {
                    const existing = prev.find((i) => i.productId === productId);
                    const base = existing ? existing.qty : 0;
                    const cappedNext = Math.min(base + qty, stock);
                    if (cappedNext === base) return prev;
                    return existing
                        ? prev.map((i) => (i.productId === productId ? {...i, qty: cappedNext} : i))
                        : [...prev, {productId, qty: cappedNext}];
                });
            }

            return {
                added: applied,
                requested: qty,
                inCart: current + applied,
                stock,
                soldOut: stock === 0,
                capped: applied > 0 && applied < qty,
                atLimit: applied === 0 && current >= stock,
            };
        },
        [items]
    );

    /** Live stock vs. what this cart already holds. */
    const stockInfo = useCallback(
        (productId) => {
            const product = store.getProductById(productId);
            const stock = product ? product.stock : 0;
            const inCart = items.find((i) => i.productId === productId)?.qty ?? 0;
            return {
                stock,
                inCart,
                remaining: Math.max(0, stock - inCart),
                available: stock > 0 && !!product && product.status === "Active"
            };
        },
        [items]
    );

    const setQty = useCallback((productId, qty) => {
        setItems((prev) => {
            const product = store.getProductById(productId);
            const max = Math.max(1, product?.stock ?? 99);
            const next = Math.min(Math.max(1, Number(qty) || 1), max);
            return prev.map((i) => (i.productId === productId ? {...i, qty: next} : i));
        });
    }, []);

    const remove = useCallback((productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    }, []);

    const clear = useCallback(() => setItems([]), []);

    /* Derived view joins live product data so prices/stock never go stale. */
    const lines = useMemo(() => {
        return items
            .map(({productId, qty}) => {
                const product = store.getProductById(productId);
                if (!product) return null;
                return {
                    product,
                    qty,
                    lineTotal: product.price * qty,
                    stock: product.stock,
                    exceedsStock: qty > product.stock,
                };
            })
            .filter(Boolean);
    }, [items]);

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const deliveryFee = subtotal === 0 || subtotal >= 5000 ? 0 : 450;

    const value = useMemo(
        () => ({
            items: lines,
            count,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            add,
            remove,
            setQty,
            clear,
            stockInfo
        }),
        [lines, count, subtotal, deliveryFee, add, remove, setQty, clear, stockInfo]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}