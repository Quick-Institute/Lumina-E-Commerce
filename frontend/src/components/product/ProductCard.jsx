import React from "react";
import {Link} from "react-router-dom";
import {FaCartPlus} from "react-icons/fa";
import RatingStars from "../ui/RatingStars";
import ProductImage from "./ProductImage";
import {formatPrice} from "../../utils/format";
import {useCart} from "../../context/CartContext";
import {useToast} from "../../context/ToastContext";

export default function ProductCard({product, priority = false}) {
    const cart = useCart();
    const {notify} = useToast();
    const info = cart.stockInfo(product.id);
    const out = info.stock === 0;
    const maxed = !out && info.remaining <= 0;
    const low = !out && info.stock <= (product.lowStockLevel ?? 5);
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

    return (
        <article
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <Link to={`/product/${product.id}`} className="block">
                <ProductImage product={product}
                              className={`aspect-[4/3.4] w-full ${priority ? "" : "transition-transform duration-300 group-hover:scale-[1.03]"}`}/>
            </Link>


            {discount > 0 && (
                <span
                    className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          −{discount}%
        </span>
            )}
            {out && (
                <span
                    className="absolute left-3 top-3 rounded-full bg-ink-900/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Out of stock
        </span>
            )}

            <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{product.category}</p>
                <Link to={`/product/${product.id}`}
                      className="mt-1 line-clamp-1 text-sm font-bold text-ink-900 hover:text-primary-700">
                    {product.name}
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-sm font-extrabold text-ink-900">{formatPrice(product.price, {decimals: true})}</p>
                    {product.oldPrice &&
                        <p className="text-xs text-slate-400 line-through">{formatPrice(product.oldPrice)}</p>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <RatingStars rating={product.rating} count={product.reviewCount} size={11}/>
                    {maxed ? (
                        <span className="text-[10px] font-bold uppercase text-emerald-600">{info.inCart} in cart · all we have</span>
                    ) : (
                        low &&
                        <span className="text-[10px] font-bold uppercase text-orange-600">{info.remaining} left</span>
                    )}
                </div>
                <button
                    type="button"
                    disabled={out || maxed}
                    onClick={() => {
                        const res = cart.add(product.id, 1);
                        if (res.added > 0) {
                            notify(res.capped ? `Only ${res.stock} in stock — ${res.inCart} now in your cart` : `${product.name} added to cart`, res.capped ? "info" : "success");
                        } else if (res.soldOut) {
                            notify(`${product.name} is out of stock`, "error");
                        } else {
                            notify(`All ${res.stock} available are already in your cart`, "info");
                        }
                    }}
                    className="mt-3.5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-50 py-2 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-600 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                    <FaCartPlus size={12}/>
                    {out ? "Unavailable" : maxed ? "Max in Cart" : "Add to Cart"}
                </button>
            </div>
        </article>
    );
}