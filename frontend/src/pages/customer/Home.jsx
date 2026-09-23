import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {FaArrowRight} from "react-icons/fa6";
import Button from "../../components/ui/Button";
import CategoryIcon from "../../components/ui/CategoryIcon";
import ProductGrid from "../../components/product/ProductGrid";
import {getFeaturedProducts, getPopularProducts} from "../../services/productService";
import {listCategories} from "../../services/accountService";

const CATEGORY_ICONS = {
    Electronics: "laptop",
    Fashion: "shirt",
    Home: "couch",
    Beauty: "beauty",
    Toys: "toys",
    Groceries: "grocery",
};

function ProductsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="aspect-[4/3.4] w-full bg-slate-100"/>
                    <div className="space-y-2.5 p-4">
                        <div className="h-2.5 w-16 rounded bg-slate-100"/>
                        <div className="h-3.5 w-3/4 rounded bg-slate-200"/>
                        <div className="h-3 w-1/3 rounded bg-slate-100"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Home() {
    const [featured, setFeatured] = useState(null);
    const [popular, setPopular] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let alive = true;
        Promise.all([getFeaturedProducts(), getPopularProducts()]).then(([f, p]) => {
            if (!alive) return;
            setFeatured(f);
            setPopular(p);
        });
        listCategories().then((cats) => alive && setCategories(cats.filter((c) => c.status === "Active")));
        return () => {
            alive = false;
        };
    }, []);

    return (
        <div>
            {/* ───────────── Hero ───────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-slate-100">
                <div className="lum-container grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
                    <div className="max-w-xl">
                        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                            Elevate Your
                            <span className="block text-primary-600">Everyday</span>
                        </h1>
                        <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
                            Discover curated collections for the modern lifestyle. Premium quality, delivered to
                            your door.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button as={Link} to="/shop" size="lg" variant="amber"
                                    className="rounded-full px-8 shadow-lift">
                                Shop Now
                            </Button>
                        </div>
                        <dl className="mt-10 flex gap-8">
                            {[
                                ["148+", "Premium products"],
                                ["2.4k+", "Happy customers"],
                                ["4.8★", "Average rating"],
                            ].map(([v, l]) => (
                                <div key={l}>
                                    <dt className="text-xl font-extrabold text-ink-900">{v}</dt>
                                    <dd className="text-xs font-medium uppercase tracking-wide text-slate-400">{l}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <div className="relative">
                        <div className="overflow-hidden rounded-3xl shadow-lift ring-1 ring-slate-900/5">
                            <img
                                src="/images/hero-flatlay.jpg"
                                alt="A premium flat lay of lifestyle gadgets"
                                className="aspect-[4/3] w-full bg-slate-200 object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ───────────── Categories ───────────── */}
            <section className="lum-container py-14">
                <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Shop by
                    Category</h2>
                <div className="mt-9 flex flex-wrap items-start justify-center gap-x-10 gap-y-6">
                    {categories.map((c) => (
                        <Link key={c.id} to={`/shop?category=${c.name}`}
                              className="group flex w-24 flex-col items-center gap-3">
              <span
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-900 shadow-card transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:bg-primary-50 group-hover:text-primary-700">
                <CategoryIcon iconKey={CATEGORY_ICONS[c.name] || "laptop"} size={28}/>
              </span>
                            <span
                                className="text-sm font-semibold text-ink-800 group-hover:text-primary-700">{c.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ───────────── Featured ───────────── */}
            <section className="bg-white py-14 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <div className="lum-container">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Featured
                                Products</h2>
                            <p className="mt-1 text-sm text-slate-500">Handpicked best sellers just for you</p>
                        </div>
                        <Link to="/shop"
                              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700">
                            View All <FaArrowRight size={12}/>
                        </Link>
                    </div>
                    <div className="mt-8">{featured ? <ProductGrid products={featured}/> : <ProductsSkeleton/>}</div>
                </div>
            </section>

            {/* ───────────── Popular ───────────── */}
            <section className="lum-container py-14">
                <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Popular Right
                        Now</h2>
                    <Link to="/shop?sort=popular"
                          className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700">
                        View All <FaArrowRight size={12}/>
                    </Link>
                </div>
                <div className="mt-8">{popular ? <ProductGrid products={popular}/> : <ProductsSkeleton/>}</div>
            </section>

            {/* ───────────── Promo banners ───────────── */}
            <section className="lum-container grid gap-6 pb-16 lg:grid-cols-2">
                {[
                    {
                        title: "Summer Sale",
                        copy: "Get up to 40% off selected fashion items",
                        img: "/images/banner-summer.jpg",
                        tone: "from-primary-800 to-primary-600",
                        cta: "secondary",
                    },
                    {
                        title: "New Arrivals",
                        copy: "Shop the latest tech & lifestyle drops before they sell out",
                        img: "/images/banner-arrivals.jpg",
                        tone: "from-ink-900 to-ink-800",
                        cta: "amber",
                    },
                ].map((b) => (
                    <div key={b.title}
                         className={`grid overflow-hidden rounded-3xl bg-gradient-to-br ${b.tone} text-white sm:grid-cols-2`}>
                        <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                            <h3 className="text-3xl font-extrabold tracking-tight">{b.title}</h3>
                            <p className="max-w-56 text-sm leading-relaxed text-white/80">{b.copy}</p>
                            <div>
                                <Button as={Link} to="/shop" variant={b.cta === "amber" ? "amber" : "secondary"}
                                        size="sm" className="rounded-lg px-5">
                                    Shop Deals
                                </Button>
                            </div>
                        </div>
                        <div className="relative hidden sm:block">
                            <img src={b.img} alt="" className="absolute inset-0 h-full w-full bg-white/5 object-cover"
                                 onError={(e) => {
                                     e.currentTarget.style.opacity = 0;
                                 }}/>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}