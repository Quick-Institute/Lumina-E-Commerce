import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {FaBoxOpen, FaCircleExclamation, FaPlus, FaTruckFast, FaWallet} from "react-icons/fa6";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import {OrderStatusBadge, ProductStatusBadge} from "../../components/ui/Badge";
import DataTable from "../../components/ui/DataTable";
import {ChartCard, OrdersBar, SalesArea} from "../../components/charts/Charts";
import ProductImage from "../../components/product/ProductImage";
import {PageSpinner} from "../../components/ui/Spinner";
import {formatDate, formatPrice} from "../../utils/format";
import {getSellerStats} from "../../services/accountService";
import {getSellerProducts} from "../../services/productService";
import {getSellerOrders} from "../../services/orderService";
import {useAuth} from "../../context/AuthContext";

export default function SellerDashboard() {
    const {user} = useAuth();
    const sellerId = [user?._id, user?.id].find(value => /^[a-f\d]{24}$/i.test(String(value || '')));
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState(null);
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        if (!sellerId) return undefined;
        let alive = true;
        Promise.all([
            getSellerStats(sellerId),
            getSellerProducts(sellerId),
            getSellerOrders(sellerId)
        ]).then(([s, p, o]) => {
            if (!alive) return;
            setStats(s);
            setProducts(p);
            setOrders(o);
        });
        return () => {
            alive = false;
        };
    }, [sellerId]);

    const lowStock = useMemo(
        () => (products || []).filter((p) => p.stock <= (p.lowStockLevel ?? 5)).slice(0, 5),
        [products]
    );

    if (!stats || !products || !orders) {
        return <PageSpinner label="Crunching your store numbers…"/>;
    }

    const openOrders = orders.filter((o) => ["Pending", "Processing"].includes(o.status));

    return (
        <div>
            {/* Header: Stacks on mobile, inline on sm+ */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl [overflow-wrap:anywhere]">
                        Welcome back, {user?.name?.split(" ")[0] || "Seller"} 👋
                    </h1>
                    <p className="mt-1.5 truncate text-sm text-slate-500">
                        {user?.seller?.storeName || "SoundMaster Official"} ·{" "}
                        <span className="font-semibold text-emerald-600">Store approved & trading</span>
                    </p>
                </div>

                {/* Actions: Full width buttons on very small screens */}
                <div className="flex w-full shrink-0 flex-col gap-2.5 xs:flex-row sm:w-auto">
                    <Button
                        as={Link}
                        to="/seller/products/new"
                        icon={<FaPlus size={11}/>}
                        className="w-full xs:w-auto"
                    >
                        Add Product
                    </Button>
                    <Button
                        as={Link}
                        to={`/store/${sellerId}`}
                        variant="secondary"
                        className="w-full xs:w-auto"
                    >
                        View Store Page
                    </Button>
                </div>
            </div>

            {/* Stat Cards: 1 col (mobile) -> 2 cols (tablet) -> 4 cols (desktop) */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                <StatCard
                    label="Revenue (12 mo)"
                    value={formatPrice(stats.snapshot.revenue)}
                    trend={12.4}
                    icon={<FaWallet size={18}/>}
                    tone="teal"
                />
                <StatCard
                    label="Orders this month"
                    value={orders.length}
                    trendLabel={`${openOrders.length} need action`}
                    icon={<FaTruckFast size={18}/>}
                    tone="blue"
                />
                <StatCard
                    label="Active products"
                    value={products.length}
                    icon={<FaBoxOpen size={18}/>}
                    tone="purple"
                    trendLabel="across all categories"
                />
                <StatCard
                    label="Inventory alerts"
                    value={stats.snapshot.lowStock + stats.snapshot.outOfStock}
                    icon={<FaCircleExclamation size={18}/>}
                    tone="amber"
                    trendLabel={`${stats.snapshot.outOfStock} out of stock`}
                />
            </div>

            {/* Charts: Stack on small/medium, side-by-side on extra-large screens */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1.5fr_1fr]">
                <ChartCard title="Revenue Trend" subtitle="Rolling 12 months, all channels">
                    <SalesArea data={stats.sales}/>
                </ChartCard>
                <ChartCard title="Monthly Orders" subtitle="Paid + delivered orders">
                    <OrdersBar data={stats.sales}/>
                </ChartCard>
            </div>

            {/* Data Tables & Lists: Stack on small/medium, side-by-side on extra-large screens */}
            <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="lum-card overflow-hidden">
                    <div
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">Recent Orders</h3>
                        <Link to="/seller/orders" className="text-xs font-bold text-primary-600 hover:underline">
                            Manage all →
                        </Link>
                    </div>
                    {/* Overflow wrapper ensures table scrolls horizontally on mobile instead of stretching the screen */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            <DataTable
                                keyField="id"
                                columns={[
                                    {
                                        key: "orderNumber",
                                        header: "Order",
                                        render: (r) => (
                                            <div>
                                                <p className="font-bold text-ink-900">{r.orderNumber}</p>
                                                <p className="text-xs text-slate-400">{formatDate(r.placedAt)}</p>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "customer",
                                        header: "Customer",
                                        render: (r) => <p
                                            className="text-sm font-semibold text-slate-600">{r.customerName}</p>
                                    },
                                    {
                                        key: "total",
                                        header: "Total",
                                        render: (r) => <p
                                            className="font-bold text-ink-900">{formatPrice(r.totalAmount)}</p>
                                    },
                                    {
                                        key: "status",
                                        header: "Status",
                                        render: (r) => <OrderStatusBadge status={r.status}/>
                                    },
                                ]}
                                rows={orders.slice(0, 5)}
                                emptyMessage="No orders yet - they'll show up here the moment a customer checks out."
                            />
                        </div>
                    </div>
                </section>

                <section className="lum-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">Low / Out of Stock</h3>
                        <Link to="/seller/inventory" className="text-xs font-bold text-primary-600 hover:underline">
                            Restock →
                        </Link>
                    </div>
                    <ul className="mt-5 space-y-4 sm:mt-4 sm:space-y-3">
                        {lowStock.length === 0 && (
                            <li className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                🎉 Every product is comfortably in stock.
                            </li>
                        )}
                        {lowStock.map((p) => (
                            <li key={p.id} className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                                <ProductImage product={p} className="h-11 w-11 shrink-0 rounded-lg" iconSize={15}/>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-ink-900">{p.name}</p>
                                    <p className="text-xs text-slate-400">{p.stock} units left</p>
                                </div>
                                <div className="shrink-0">
                                    <ProductStatusBadge status={p.status} stock={p.stock}/>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}