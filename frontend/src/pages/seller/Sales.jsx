import React, {useEffect, useMemo, useState} from "react";
import {FaCalculator, FaCoins, FaSackDollar} from "react-icons/fa6";
import StatCard from "../../components/ui/StatCard";
import {ChartCard, OrdersBar, SalesArea, TopProductsBars} from "../../components/charts/Charts";
import {Select} from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import {PageSpinner} from "../../components/ui/Spinner";
import {formatPrice} from "../../utils/format";
import {getSellerStats} from "../../services/accountService";
import {useAuth} from "../../context/AuthContext";

const RANGES = {"6m": 6, "3m": 3, "12m": 12};

export default function SellerSales() {
    const {user} = useAuth();
    const sellerId = user?.sellerId || "s1";
    const [stats, setStats] = useState(null);
    const [range, setRange] = useState("12m");

    useEffect(() => {
        let alive = true;
        getSellerStats(sellerId).then((s) => {
            if (alive) setStats(s);
        });
        return () => {
            alive = false;
        };
    }, [sellerId]);

    const sliced = useMemo(() => {
        if (!stats) return [];
        const months = stats.sales.slice(-RANGES[range]);
        return months;
    }, [stats, range]);

    if (!stats) return <PageSpinner label="Building your sales report…"/>;

    const revenue = sliced.reduce((s, m) => s + m.revenue, 0);
    const orderCount = sliced.reduce((s, m) => s + m.orders, 0);
    const aov = orderCount ? Math.round(revenue / orderCount) : 0;

    const monthly = sliced.map((m) => ({
        month: m.month,
        revenue: formatPrice(m.revenue),
        orders: m.orders,
        aov: formatPrice(Math.round(m.revenue / (m.orders || 1)))
    }));

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                        Sales Overview
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        Revenue performance across your storefront.
                    </p>
                </div>

                <Select
                    name="salesRange"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="h-12 w-full text-sm sm:w-auto"
                >
                    <option value="12m">Last 12 months</option>
                    <option value="6m">Last 6 months</option>
                    <option value="3m">Last quarter</option>
                </Select>
            </div>

            {/* Stats Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-3 sm:gap-5">
                <StatCard
                    label="Revenue"
                    value={formatPrice(revenue)}
                    icon={<FaSackDollar size={18}/>}
                    tone="teal"
                    trend={8.1}
                />
                <StatCard
                    label="Orders"
                    value={orderCount}
                    icon={<FaCoins size={18}/>}
                    tone="blue"
                    trend={4.6}
                />
                <StatCard
                    label="Avg. order value"
                    value={formatPrice(aov)}
                    icon={<FaCalculator size={18}/>}
                    tone="purple"
                    trend={-1.8}
                />
            </div>

            {/* Main Trends Charts */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-2">
                <ChartCard title="Revenue trend" subtitle={`Rs. collected over ${RANGES[range]} months`}>
                    <SalesArea data={sliced} color="#0d9488"/>
                </ChartCard>
                <ChartCard title="Orders per month" subtitle="Units shipped">
                    <OrdersBar data={sliced}/>
                </ChartCard>
            </div>

            {/* Breakdown Table and Top Products */}
            <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[1fr_420px]">
                <section className="lum-card overflow-hidden">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">
                            Monthly breakdown
                        </h3>
                    </div>
                    {/* Safe scrollable container for narrow mobile screens */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[480px]">
                            <DataTable
                                dense
                                columns={[
                                    {
                                        key: "month",
                                        header: "Month",
                                        render: (r) => <span className="font-bold text-ink-900">{r.month}</span>
                                    },
                                    {
                                        key: "revenue",
                                        header: "Revenue",
                                        render: (r) => <span
                                            className="font-semibold text-emerald-600">{r.revenue}</span>
                                    },
                                    {key: "orders", header: "Orders"},
                                    {
                                        key: "aov",
                                        header: "AOV",
                                        render: (r) => <span className="text-slate-500">{r.aov}</span>
                                    },
                                ]}
                                rows={[...monthly].reverse()}
                            />
                        </div>
                    </div>
                </section>

                <ChartCard title="Top products" subtitle="Lifetime revenue by SKU">
                    <TopProductsBars data={stats.topProducts}/>
                </ChartCard>
            </div>
        </div>
    );
}