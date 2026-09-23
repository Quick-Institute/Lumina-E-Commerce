import React from "react";
import {Link, useNavigate} from "react-router-dom";
import {FaArrowLeftLong, FaTrashCan} from "react-icons/fa6";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import Button from "../../components/ui/Button";
import QuantityStepper from "../../components/ui/QuantityStepper";
import ProductImage from "../../components/product/ProductImage";
import {EmptyState} from "../../components/ui/States";
import {formatPrice} from "../../utils/format";
import {useCart} from "../../context/CartContext";
import {useToast} from "../../context/ToastContext";
import {DELIVERY_FEE, FREE_DELIVERY_THRESHOLD} from "../../utils/constants";

export default function Cart() {
    const cart = useCart();
    const {notify} = useToast();
    const navigate = useNavigate();

    if (!cart.items.length) {
        return (
            <div className="lum-container py-14">
                <Breadcrumbs items={[{label: "Home", to: "/"}, {label: "Shopping Cart"}]}/>
                <div className="mx-auto mt-10 max-w-xl">
                    <EmptyState
                        title="Your cart is empty"
                        message="Looks like you haven't added anything yet. Explore our curated collections and find something you love."
                        action={{label: "Start shopping", onClick: () => navigate("/shop")}}
                    />
                </div>
            </div>
        );
    }

    const freeDelivery = cart.subtotal >= FREE_DELIVERY_THRESHOLD;
    const missingStock = cart.items.filter((l) => l.exceedsStock);

    return (
        <div className="lum-container py-8">
            <Breadcrumbs items={[{label: "Home", to: "/"}, {label: "Shopping Cart"}]}/>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">
                Your Cart <span className="text-slate-400">({cart.count} {cart.count === 1 ? "item" : "items"})</span>
            </h1>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
                <div className="space-y-3">
                    {cart.items.map(({product, qty, lineTotal, stock}) => {
                        const low = stock <= (product.lowStockLevel ?? 5);
                        return (
                            <div key={product.id}
                                 className="lum-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                <Link to={`/product/${product.id}`} className="shrink-0">
                                    <ProductImage product={product} className="h-24 w-24 rounded-xl sm:h-28 sm:w-28"/>
                                </Link>

                                <div className="min-w-0 flex-1">
                                    <Link to={`/product/${product.id}`}
                                          className="text-base font-bold text-ink-900 hover:text-primary-700">
                                        {product.name}
                                    </Link>
                                    <Link to={`/shop?category=${product.category}`}
                                          className="mt-0.5 block text-xs font-bold text-primary-600 hover:underline">
                                        {product.category}
                                    </Link>
                                    {low && product.stock > 0 && (
                                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-orange-600">
                                            Only {product.stock} left in stock
                                        </p>
                                    )}
                                    {product.stock === 0 && (
                                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-red-500">Out
                                            of stock — remove to continue</p>
                                    )}
                                </div>

                                <div
                                    className="grid grid-cols-3 items-center gap-4 border-t border-slate-100 pt-3 sm:grid-cols-none sm:border-0 sm:pt-0 sm:text-right">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit
                                            Price</p>
                                        <p className="text-sm font-bold text-ink-900">{formatPrice(product.price, {decimals: true})}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <QuantityStepper
                                            value={qty}
                                            min={1}
                                            max={Math.max(1, stock)}
                                            onChange={(v) => cart.setQty(product.id, v)}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total
                                            Price</p>
                                        <p className="text-sm font-extrabold text-ink-900">{formatPrice(lineTotal, {decimals: true})}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        cart.remove(product.id);
                                        notify("Item removed from cart", "info");
                                    }}
                                    aria-label={`Remove ${product.name}`}
                                    className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <FaTrashCan size={14}/>
                                </button>
                            </div>
                        );
                    })}

                    <Link to="/shop"
                          className="inline-flex items-center gap-2.5 pt-2 text-base font-bold text-primary-700 hover:text-primary-800">
                        <FaArrowLeftLong size={15}/> Continue Shopping
                    </Link>
                </div>

                {/* Summary */}
                <aside className="lum-card sticky top-24 p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-ink-900">Order Summary</h2>
                    <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Subtotal
                                ({cart.count} {cart.count === 1 ? "item" : "items"})
                            </dt>
                            <dd className="font-extrabold text-ink-900">{formatPrice(cart.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Delivery Fee</dt>
                            <dd className={`font-extrabold ${freeDelivery ? "text-primary-600" : "text-ink-900"}`}>
                                {freeDelivery ? "Free" : formatPrice(DELIVERY_FEE)}
                            </dd>
                        </div>
                    </dl>
                    <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-5">
                        <p className="text-base font-bold text-ink-900">Total</p>
                        <p className="text-2xl font-extrabold text-primary-600">{formatPrice(cart.total)}</p>
                    </div>
                    {!freeDelivery && (
                        <p className="mt-3 rounded-xl bg-primary-50 px-3.5 py-2.5 text-xs font-medium text-primary-800">
                            Add {formatPrice(FREE_DELIVERY_THRESHOLD - cart.subtotal)} more for free delivery.
                        </p>
                    )}
                    {missingStock.length > 0 && (
                        <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600">
                            Some items exceed available stock. Adjust quantities before checkout.
                        </p>
                    )}
                    <Button
                        size="lg"
                        fullWidth
                        className="mt-6"
                        disabled={missingStock.length > 0 || cart.items.some((l) => l.stock === 0)}
                        onClick={() => navigate("/checkout")}
                    >
                        Proceed to Checkout
                    </Button>
                    <p className="mt-4 text-center text-[11px] text-slate-400">Secure checkout · Cash on Delivery
                        supported</p>
                </aside>
            </div>
        </div>
    );
}