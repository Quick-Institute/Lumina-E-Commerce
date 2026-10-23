import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {FaChartLine, FaCircleXmark, FaDownload, FaSackDollar, FaStore, FaTruckFast,} from "react-icons/fa6";

import {ChartCard, OrdersBar, SalesArea, StatusPie} from "../../components/charts/Charts";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import {PageSpinner} from "../../components/ui/Spinner";
import {formatNumber, formatPrice} from "../../utils/format";
import {getPlatformStats, listSellers} from "../../services/accountService";
import {getAllOrders} from "../../services/orderService";
import {useToast} from "../../context/ToastContext";

export default function AdminSalesReport() {
    const {notify} = useToast();
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState(null);
    const [sellers, setSellers] = useState(null);

    useEffect(() => {
        Promise.all([getPlatformStats(), getAllOrders(), listSellers()]).then(
            ([st, o, se]) => {
                setStats(st);
                setOrders(o);
                setSellers(se);
            }
        );
    }, []);

    const leaderboard = useMemo(() => {
        if (!orders) return [];
        const byId = Object.fromEntries((sellers || []).map((s) => [String(s.id || s._id), s]));
        const acc = new Map();
        orders
            .filter((o) => o.status !== "Cancelled")
            .forEach((o) => {
                const sellerIds = [
                    ...new Set(
                        (o.items || []).map((i) => i.sellerId).filter(Boolean)
                    ),
                ];
                sellerIds.forEach((sid) => {
                    const key = String(sid);
                    const prev = acc.get(key) || {
                        seller: byId[sid],
                        revenue: 0,
                        orders: 0,
                    };
                    acc.set(key, {
                        ...prev,
                        revenue: prev.revenue + o.totalAmount,
                        orders: prev.orders + 1,
                    });
                });
            });
        return Array.from(acc.values())
            .filter((r) => r.seller)
            .sort((a, b) => b.revenue - a.revenue);
    }, [orders, sellers]);

    if (!stats || !orders || !sellers) {
        return <PageSpinner label="Crunching the numbers…"/>;
    }

    const snap = stats.snapshot;
    const cancelled =
        snap.ordersByStatus?.find((s) => s.name === "Cancelled")?.value || 0;

    return (
        <div className="w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                        Sales Report
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <FaChartLine className="shrink-0 text-primary-600" size={13}/>
                        <span>Platform revenue, orders and category performance</span>
                    </p>
                </div>

                <Button
                    size="sm"
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto"
                    icon={<FaDownload size={11}/>}
                    onClick={() => {
                        const headers = ["orderNumber", "status", "paymentMethod", "subtotal", "deliveryFee", "totalAmount", "placedAt"];
                        const csv = [headers.join(","), ...orders.map(o => headers.map(h => JSON.stringify(o[h] ?? "")).join(","))].join("\n");
                        const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "lumina-sales-report.csv";
                        link.click();
                        URL.revokeObjectURL(url);
                        notify("Sales report exported successfully.", "success");
                    }}
                >
                    Export
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="mt-6 grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {[
                    {
                        icon: <FaSackDollar size={15}/>,
                        label: "Gross Revenue",
                        value: formatPrice(snap.revenue),
                    },
                    {
                        icon: <FaTruckFast size={15}/>,
                        label: "Orders (lifetime)",
                        value: formatNumber(snap.totalOrders),
                    },
                    {
                        icon: <FaChartLine size={15}/>,
                        label: "Avg Order Value",
                        value: formatPrice(snap.avgOrderValue),
                    },
                    {
                        icon: <FaCircleXmark size={15}/>,
                        label: "Cancel Rate",
                        value: `${
                            snap.totalOrders
                                ? Math.round((cancelled / snap.totalOrders) * 100)
                                : 0
                        }%`,
                    },
                ].map((k) => (
                    <div key={k.label} className="lum-card p-4 sm:p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {k.label}
                        </p>
                        <p className="mt-1.5 truncate text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
                            {k.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Revenue & Orders Charts */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <ChartCard
                    title="Revenue by Month"
                    subtitle="Gross value of all placed orders"
                >
                    <SalesArea data={stats.sales}/>
                </ChartCard>
                <ChartCard title="Orders by Month">
                    <OrdersBar data={stats.sales}/>
                </ChartCard>
            </div>

            {/* Category Mix & Seller Leaderboard */}
            <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-2">
                <ChartCard title="Category Mix" subtitle="Share of platform revenue">
                    <StatusPie data={stats.categorySplit}/>
                </ChartCard>

                <section className="lum-card min-w-0 overflow-hidden">
                    <div
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6">
                        <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink-900">
                            <FaStore className="text-primary-600" size={13}/> Seller Leaderboard
                        </h3>
                        <Link
                            to="/admin/sellers?tab=Approved"
                            className="text-xs font-bold text-primary-600 hover:underline"
                        >
                            All sellers →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[340px]">
                            <DataTable
                                dense
                                columns={[
                                    {
                                        key: "seller",
                                        header: "Seller",
                                        render: (r) => (
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <span
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                                                    style={{
                                                        background:
                                                            r.seller.accent || "#0d9488",
                                                    }}
                                                >
                                                    {(r.seller.storeName || "S")
                                                        .split(/\s+/)
                                                        .map((w) => w[0])
                                                        .slice(0, 2)
                                                        .join("")}
                                                </span>
                                                <Link
                                                    to={`/admin/sellers/${r.seller.id}`}
                                                    className="truncate font-bold text-ink-900 hover:text-primary-700 max-w-[160px] sm:max-w-[220px]"
                                                >
                                                    {r.seller.storeName}
                                                </Link>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "orders",
                                        header: "Orders",
                                        render: (r) => (
                                            <span className="font-semibold text-slate-500">
                                                {r.orders}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "revenue",
                                        header: "Revenue",
                                        render: (r) => (
                                            <span className="font-extrabold text-ink-900">
                                                {formatPrice(r.revenue)}
                                            </span>
                                        ),
                                    },
                                ]}
                                rows={leaderboard}
                                emptyMessage="No completed sales to rank yet."
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}