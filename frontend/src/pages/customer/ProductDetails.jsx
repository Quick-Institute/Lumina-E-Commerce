import React, {useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {
    FaAngleLeft,
    FaAngleRight,
    FaCartPlus,
    FaCircleCheck,
    FaChevronRight,
    FaTruck,
} from "react-icons/fa6";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import Button from "../../components/ui/Button";
import RatingStars from "../../components/ui/RatingStars";
import Tabs from "../../components/ui/Tabs";
import QuantityStepper from "../../components/ui/QuantityStepper";
import CategoryIcon from "../../components/ui/CategoryIcon";
import ProductImage from "../../components/product/ProductImage";
import ProductCard from "../../components/product/ProductCard";
import {PageSpinner} from "../../components/ui/Spinner";
import {EmptyState} from "../../components/ui/States";
import {formatPrice, formatDate} from "../../utils/format";
import {getProduct, getRelatedProducts} from "../../services/productService";
import {useCart} from "../../context/CartContext";
import {useToast} from "../../context/ToastContext";

export default function ProductDetails() {
    const {id} = useParams();
    const navigate = useNavigate();
    const cart = useCart();
    const {notify} = useToast();

    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [qty, setQty] = useState(1);
    const [tab, setTab] = useState("description");
    const [activeShot, setActiveShot] = useState(0);
    const carouselRef = useRef(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setNotFound(false);
        getProduct(id)
            .then((p) => {
                if (!alive) return;
                setProduct(p);
                setQty(1);
                setTab("description");
                setActiveShot(0);
                return getRelatedProducts(p, 5);
            })
            .then((rel) => alive && rel && setRelated(rel))
            .catch(() => alive && setNotFound(true))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [id]);

    /* Fake gallery variations (zoom positions) until real media is served. */
    const shots = useMemo(() => {
        if (!product) return [];
        return [
            {id: 0, zoom: "", label: "Front"},
            {id: 1, zoom: "scale-[1.6] -translate-x-6 translate-y-3", label: "Detail"},
            {id: 2, zoom: "scale-[1.25] -rotate-3", label: "Angle"},
            {id: 3, zoom: "grayscale scale-[1.1]", label: "B&W"},
        ];
    }, [product]);

    const scrollCarousel = (dir) => {
        carouselRef.current?.scrollBy({left: dir * 320, behavior: "smooth"});
    };

    if (loading) return <div className="lum-container py-24"><PageSpinner/></div>;

    if (notFound || !product) {
        return (
            <div className="lum-container py-16">
                <EmptyState
                    title="Product not found"
                    message="This product may have been removed or the link is out of date."
                    action={{label: "Back to shop", onClick: () => navigate("/shop")}}
                />
            </div>
        );
    }

    const info = cart.stockInfo(product.id);
    const out = product.stock === 0;
    const addable = Math.max(0, info.stock - info.inCart);
    const maxed = !out && addable <= 0;
    const low = !out && info.stock <= (product.lowStockLevel ?? 5);
    const effQty = Math.max(1, Math.min(qty, Math.max(1, addable)));
    const discount = product.oldPrice ? product.oldPrice - product.price : 0;

    return (
        <div className="lum-container pb-20 pt-6">
            <Breadcrumbs
                items={[
                    {label: "Home", to: "/"},
                    {label: product.category, to: `/shop?category=${product.category}`},
                    {label: product.name},
                ]}
            />

            <div className="mt-6 grid gap-10 lg:grid-cols-2">
                {/* Gallery */}
                <div className="flex flex-col-reverse gap-4 sm:flex-row">
                    <div className="flex gap-3 sm:flex-col">
                        {shots.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveShot(i)}
                                aria-label={`View ${s.label}`}
                                className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                                    activeShot === i ? "border-primary-600 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <ProductImage product={product} className="h-full w-full" imgClassName={s.zoom}
                                              iconSize={20}/>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="aspect-square w-full transition-transform duration-500 hover:scale-105">
                            <ProductImage product={product} className="h-full w-full"
                                          imgClassName={shots[activeShot]?.zoom} iconSize={110}/>
                        </div>
                    </div>
                </div>

                {/* Buy box */}
                <div>
                    <Link to={`/shop?category=${product.category}`}
                          className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:underline">
                        {product.category}
                    </Link>
                    <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{product.name}</h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <RatingStars rating={product.rating} showValue size={15}/>
                        <span className="text-xs text-slate-400">({product.reviewCount} Reviews)</span>
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold ${out ? "text-red-500" : "text-emerald-600"}`}>
              <FaCircleCheck size={12}/> {out ? "Out of stock" : "In Stock"}
            </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-baseline gap-3">
                        <p className="text-3xl font-extrabold text-ink-900">{formatPrice(product.price, {decimals: true})}</p>
                        {product.oldPrice &&
                            <p className="text-lg text-slate-400 line-through">{formatPrice(product.oldPrice)}</p>}
                        {discount > 0 &&
                            <p className="text-sm font-bold text-orange-600">Save {formatPrice(discount)}</p>}
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-500">{product.shortDescription}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <QuantityStepper
                            value={effQty}
                            min={1}
                            max={out ? 1 : Math.max(1, addable)}
                            onChange={setQty}
                        />
                        <Button
                            size="lg"
                            className="flex-1 sm:flex-none"
                            icon={<FaCartPlus size={15}/>}
                            disabled={out || maxed}
                            onClick={() => {
                                const res = cart.add(product.id, effQty);
                                if (res.added > 0) {
                                    notify(res.capped ? `Only ${res.stock} in stock — ${res.inCart} now in your cart` : `${res.added} × ${product.name} added to cart`, res.capped ? "info" : "success");
                                } else if (res.soldOut) {
                                    notify(`${product.name} is out of stock`, "error");
                                } else {
                                    notify(`All ${res.stock} available are already in your cart`, "info");
                                }
                            }}
                        >
                            {out ? "Out of Stock" : maxed ? "Max in Cart" : "Add to Cart"}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            disabled={out}
                            onClick={() => {
                                cart.add(product.id, effQty);
                                navigate("/checkout");
                            }}
                        >
                            Buy Now
                        </Button>
                    </div>
                    {maxed && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">
                            <FaCircleCheck size={11}/> You already have all {info.stock} available in your cart
                        </p>
                    )}
                    {low && !maxed && (
                        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-orange-600">
                            Hurry — only {addable} left to add!
                        </p>
                    )}
                    {out &&
                        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-500">Currently unavailable
                            — check back soon or browse similar products below.</p>}

                    {/* Seller card */}
                    {product.seller && (
                        <div className="lum-card mt-7 flex items-center justify-between gap-4 p-4">
                            <div className="flex items-center gap-3.5">
                <span
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-base font-extrabold text-primary-700 ring-1 ring-slate-200">
                  {product.seller.storeName.charAt(0)}
                </span>
                                <div>
                                    <p className="text-sm font-bold text-ink-900">{product.seller.storeName}</p>
                                    <div className="mt-0.5 flex items-center gap-1.5">
                                        <RatingStars rating={product.seller.rating} size={10}/>
                                        <span className="text-[11px] text-slate-400">({product.seller.rating} store rating)</span>
                                    </div>
                                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                                        <FaTruck size={10}/> Shipped by {product.seller.storeName.split(" ")[0]},
                                        fulfilled by Lumina Express
                                    </p>
                                </div>
                            </div>
                            <Link to={`/store/${product.seller.id}`}
                                  className="shrink-0 text-xs font-bold text-primary-600 hover:underline">
                                Visit Store
                            </Link>
                        </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2.5 text-[11px] font-semibold text-slate-500">
                        {["7-day easy returns", "COD available", "Lumina verified seller"].map((t) => (
                            <span key={t} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-14">
                <Tabs
                    items={[
                        {key: "description", label: "Description"},
                        {key: "specs", label: "Specifications"},
                        {key: "reviews", label: `Reviews (${product.reviewCount})`},
                    ]}
                    active={tab}
                    onChange={setTab}
                    className="[&_button]:px-4 [&_button]:py-3 [&_button]:text-base"
                />

                <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
                    <div className="min-w-0">
                        {tab === "description" && (
                            <div>
                                <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">Experience the
                                    difference</h2>
                                {product.description.map((para, i) => (
                                    <p key={i} className="mt-4 text-sm leading-relaxed text-slate-500">{para}</p>
                                ))}
                                {product.highlights?.length > 0 && (
                                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                        {product.highlights.map((h) => (
                                            <div key={h.label}
                                                 className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
                        <span
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <CategoryIcon kind="highlight" iconKey={h.iconKey} size={15}/>
                        </span>
                                                <div>
                                                    <p className="text-sm font-bold text-ink-900">{h.label}</p>
                                                    <p className="text-xs text-slate-400">{h.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "specs" && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-slate-100">
                                    {(product.specs?.length ? product.specs : [{
                                        label: "—",
                                        value: "No specifications listed."
                                    }]).map((s) => (
                                        <tr key={s.label}>
                                            <th className="w-1/2 bg-slate-50/60 px-5 py-3.5 text-left font-semibold text-slate-500 sm:w-1/3">{s.label}</th>
                                            <td className="px-5 py-3.5 font-semibold text-ink-900">{s.value}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <th className="bg-slate-50/60 px-5 py-3.5 text-left font-semibold text-slate-500">Listed
                                            since
                                        </th>
                                        <td className="px-5 py-3.5 font-semibold text-ink-900">{formatDate(product.createdAt)}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === "reviews" && (
                            <div className="space-y-4">
                                {product.reviews?.length ? (
                                    product.reviews.map((r) => (
                                        <article key={r.id} className="lum-card p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                          <span
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-700">
                            {r.user.charAt(0)}
                          </span>
                                                    <div>
                                                        <p className="text-sm font-bold text-ink-900">{r.user}</p>
                                                        <p className="text-[11px] text-slate-400">{formatDate(r.date)} ·
                                                            Verified purchase</p>
                                                    </div>
                                                </div>
                                                <RatingStars rating={r.rating} size={12}/>
                                            </div>
                                            <h4 className="mt-3 text-sm font-extrabold text-ink-900">{r.title}</h4>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-500">{r.comment}</p>
                                        </article>
                                    ))
                                ) : (
                                    <EmptyState title="No reviews yet"
                                                message="Be the first to review this product once it lands in your cart."/>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Review histogram (description tab style from wireframe) */}
                    <aside className="hidden lg:block">
                        <div className="lum-card sticky top-24 p-6 text-center">
                            <p className="text-4xl font-extrabold text-ink-900">{product.rating ? product.rating.toFixed(1) : "—"}</p>
                            <RatingStars rating={product.rating} size={18} className="mt-2 justify-center"/>
                            <p className="mt-2 text-xs text-slate-400">Based on {product.reviewCount} reviews</p>
                            <div className="mt-5 space-y-2">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = product.ratingBreakdown?.[star] || 0;
                                    const pct = product.reviewCount ? Math.round((count / product.reviewCount) * 100) : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-2.5">
                                            <span className="w-3 text-xs font-semibold text-slate-500">{star}</span>
                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-blue-500"
                                                     style={{width: `${pct}%`}}/>
                                            </div>
                                            <span className="w-8 text-right text-[11px] text-slate-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Related carousel */}
            {related.length > 0 && (
                <div className="mt-16">
                    <div className="flex items-end justify-between">
                        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">You Might Also Like</h2>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => scrollCarousel(-1)} aria-label="Scroll left"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-ink-700 hover:bg-slate-50">
                                <FaAngleLeft size={16}/>
                            </button>
                            <button type="button" onClick={() => scrollCarousel(1)} aria-label="Scroll right"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-ink-700 hover:bg-slate-50">
                                <FaAngleRight size={16}/>
                            </button>
                        </div>
                    </div>
                    <div ref={carouselRef}
                         className="mt-6 flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {related.map((p) => (
                            <div key={p.id} className="w-72 shrink-0 snap-start">
                                <ProductCard product={p}/>
                            </div>
                        ))}
                    </div>
                    <Link to={`/shop?category=${product.category}`}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:underline">
                        Browse all {product.category} <FaChevronRight size={10}/>
                    </Link>
                </div>
            )}
        </div>
    );
}