import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {FaArrowTrendUp, FaBan, FaBoxOpen, FaStore, FaTriangleExclamation, FaTruckFast, FaUsers} from "react-icons/fa6";
import Badge, {OrderStatusBadge} from "../../components/ui/Badge";
import DataTable from "../../components/ui/DataTable";
import ProductImage from "../../components/product/ProductImage";
import {ChartCard, PIE_COLORS, SalesArea} from "../../components/charts/Charts";
import {PageSpinner} from "../../components/ui/Spinner";
import {Select} from "../../components/ui/Input";
import {formatNumber, formatPrice, formatDate} from "../../utils/format";
import {getPlatformStats, listSellers, setSellerApproval} from "../../services/accountService";
import {getAllOrders} from "../../services/orderService";
import {getInventory} from "../../services/productService";
import {useToast} from "../../context/ToastContext";

/** KPI tile in the wireframe style: icon · big number · label · trend or action chip. */
function Kpi({icon, label, value, delta, tone = "teal", accent, action, actionTo}) {
    const iconTones = {
        teal: "bg-primary-50 text-primary-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-100 text-amber-600",
        red: "bg-red-50 text-red-500",
        green: "bg-emerald-50 text-emerald-600",
        ink: "bg-slate-100 text-slate-500",
    };
    return (
        <div
            className={`lum-card p-4 sm:p-5 ${
                accent === "amber" ? "border-amber-200 bg-amber-50/50 ring-1 ring-amber-100" : accent === "red" ? "border-red-200 bg-red-50/40" : ""
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTones[tone] || iconTones.teal}`}>{icon}</span>
                {action ? (
                    <Link to={actionTo}
                          className="text-[11px] font-extrabold uppercase tracking-wider text-primary-600 hover:underline">
                        {action}
                    </Link>
                ) : (
                    delta !== undefined && (
                        <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              <FaArrowTrendUp size={9} className={delta < 0 ? "rotate-180" : ""}/>
                            {Math.abs(delta)}%
            </span>
                    )
                )}
            </div>
            <p className="mt-3 text-xl leading-none tracking-tight text-ink-900 sm:text-[22px]">{value}</p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        </div>
    );
}

function DonutStatus({data, total}) {
    const sum = data.reduce((s, d) => s + d.value, 0) || 1;
    const R = 62;
    const C = 2 * Math.PI * R;
    let offset = 0;
    return (
        <section className="lum-card flex h-full min-w-0 flex-col p-5 sm:p-6">
            <h3 className="text-base font-extrabold tracking-tight text-ink-900">Order Status</h3>
            <div className="relative mx-auto mt-4 h-44 w-44">
                <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img"
                     aria-label="Orders by status">
                    {data.map((d, i) => {
                        const len = (d.value / sum) * C;
                        const seg = (
                            <circle
                                key={d.name}
                                cx="80"
                                cy="80"
                                r={R}
                                fill="none"
                                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                                strokeWidth="22"
                                strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += len;
                        return seg;
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-extrabold tracking-tight text-ink-900">{formatNumber(total || sum)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Orders</p>
                </div>
            </div>
            <ul className="mt-5 space-y-2.5">
                {data.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2.5 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full"
                              style={{background: PIE_COLORS[i % PIE_COLORS.length]}}/>
                        <span className="text-slate-500">{d.name}</span>
                        <span className="ml-auto font-extrabold text-ink-900">{formatNumber(d.value)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const {notify} = useToast();
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState(null);
    const [sellers, setSellers] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [range, setRange] = useState("6");

    const load = () =>
        Promise.all([getPlatformStats(), getAllOrders(), listSellers(), getInventory()]).then(([st, o, se, inv]) => {
            setStats(st);
            setOrders(o);
            setSellers(se);
            setInventory(inv);
        });

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!stats || !orders || !sellers || !inventory) return <PageSpinner label="Aggregating platform data…"/>;

    const snap = stats.snapshot;
    const pendingSellers = sellers.filter((s) => s.approvalStatus === "Pending");
    const sales = stats.sales;
    const chartData = sales.slice(-Number(range));
    const lowRows = inventory
        .filter((r) => r.product && r.product.stock <= (r.product.lowStockLevel ?? 5))
        .sort((a, b) => a.product.stock - b.product.stock)
        .slice(0, 5);

    const quickApprove = async (id) => {
        await setSellerApproval(id, "Approved");
        notify("Seller approved - store is live.", "success");
        setSellers(null);
        load();
    };

    return (
        <div>
            {/* Header row - title left, quick period control right (search lives in the top bar) */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">System Overview & Management</p>
                </div>
                <p className="text-xs text-slate-400">All figures reflect the live mock store.</p>
            </div>

            {/* KPI grid - two rows of five, as per wireframes */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                <Kpi icon={<FaUsers size={15}/>} tone="blue" label="Total Users" value={formatNumber(snap.totalUsers)}
                     delta={snap.usersMonthDelta === 0 ? 0 : 8}/>
                <Kpi icon={<FaUsers size={15}/>} tone="teal" label="Total Customers"
                     value={formatNumber(snap.totalCustomers)} delta={12}/>
                <Kpi icon={<FaStore size={15}/>} tone="purple" label="Total Sellers"
                     value={formatNumber(snap.totalSellers)} delta={5}/>
                <Kpi
                    icon={<FaStore size={15}/>}
                    tone="amber"
                    accent="amber"
                    label="Pending Sellers"
                    value={snap.pendingSellers}
                    action={pendingSellers.length ? "Review" : undefined}
                    actionTo="/admin/sellers?tab=Pending"
                />
                <Kpi icon={<FaBoxOpen size={15}/>} tone="blue" label="Total Products"
                     value={formatNumber(snap.totalProducts)} delta={3}/>
                <Kpi icon={<FaBoxOpen size={15}/>} tone="green" label="Active Products"
                     value={formatNumber(snap.activeProducts)}/>
                <Kpi icon={<FaTruckFast size={15}/>} tone="purple" label="Total Orders"
                     value={formatNumber(snap.totalOrders)} delta={15}/>
                <Kpi icon={<FaTruckFast size={15}/>} tone="amber" label="Pending Orders"
                     value={formatNumber(snap.pendingOrders)}/>
                <Kpi icon={<FaStore size={15}/>} tone="green" label="Total Sales"
                     value={`Rs. ${(snap.revenue / 1_000_000).toFixed(1)}M`} delta={snap.salesMonthDeltaPct}/>
                <Kpi
                    icon={<FaTriangleExclamation size={15}/>}
                    tone="red"
                    accent="red"
                    label="Low-Stock Alerts"
                    value={snap.lowStock + snap.outOfStock}
                    action="View"
                    actionTo="/admin/inventory/low"
                />
            </div>

            {/* Charts */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <ChartCard
                    className="min-w-0"
                    title="Sales Overview"
                    subtitle="Platform-wide revenue tracking"
                    actions={
                        <Select name="dash-range" aria-label="Reporting period" value={range}
                                onChange={(e) => setRange(e.target.value)} className="h-12 w-auto min-w-36 text-xs">
                            <option value="3">Last 3 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="12">Last 12 Months</option>
                        </Select>
                    }
                >
                    <SalesArea data={chartData}/>
                    <div
                        className="mt-5 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4 text-center">
                        {[
                            ["Total Revenue", formatPrice(sales.reduce((s, m) => s + m.revenue, 0))],
                            ["Total Orders", formatNumber(sales.reduce((s, m) => s + m.orders, 0))],
                            ["Avg Order Value", formatPrice(snap.avgOrderValue)],
                        ].map(([l, v]) => (
                            <div key={l}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{l}</p>
                                <p className="mt-1 text-lg font-extrabold tracking-tight text-ink-900">{v}</p>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <div className="grid gap-6">
                    <DonutStatus data={snap.ordersByStatus} total={snap.totalOrders}/>
                </div>
            </div>

            {/* Pending approvals + recent orders */}
            <div className="mt-6 grid items-start gap-6 xl:grid-cols-[repeat(2,minmax(0,1fr))]">
                <section className="lum-card min-w-0">
                    <div
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6">
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">Pending Seller
                            Approvals</h3>
                        <Link to="/admin/sellers?tab=Pending"
                              className="text-xs font-bold text-primary-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    {pendingSellers.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-slate-400">Approval queue is clear 🎉</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {pendingSellers.slice(0, 4).map((s) => (
                                <li key={s.id} className="flex items-center gap-3.5 px-6 py-4">
                  <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                      style={{background: s.accent}}>
                    {s.storeName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-extrabold text-ink-900">{s.storeName}</p>
                                        <p className="text-xs text-slate-400">Applied: {formatDate(s.appliedAt || s.joinedAt)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => quickApprove(s.id)}
                                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                                    >
                                        Approve
                                    </button>
                                    <Link
                                        to={`/admin/sellers/${s.id}?review=1`}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-700 hover:bg-slate-50"
                                    >
                                        Review
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="lum-card min-w-0">
                    <div
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6">
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">Recent Orders</h3>
                        <Link to="/admin/orders" className="text-xs font-bold text-primary-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    <DataTable
                        dense
                        columns={[
                            {
                                key: "orderNumber",
                                header: "Order ID",
                                render: (o) => <span className="font-bold text-ink-900">{o.orderNumber}</span>
                            },
                            {key: "customerName", header: "Customer"},
                            {
                                key: "totalAmount",
                                header: "Amount",
                                render: (o) => <span className="font-bold">{formatPrice(o.totalAmount)}</span>
                            },
                            {key: "status", header: "Status", render: (o) => <OrderStatusBadge status={o.status}/>},
                        ]}
                        rows={orders.slice(0, 4)}
                        onRowClick={(o) => navigate(`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`)}
                    />
                </section>
            </div>

            {/* Low stock alerts */}
            <section className="lum-card mt-6 min-w-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink-900">
                        <FaTriangleExclamation className="text-red-500" size={14}/> Low Stock Alerts
                    </h3>
                    <Link to="/admin/inventory" className="text-xs font-bold text-primary-600 hover:underline">
                        Manage All
                    </Link>
                </div>
                <DataTable
                    dense
                    columns={[
                        {
                            key: "product",
                            header: "Product",
                            render: (r) => (
                                <div className="flex items-center gap-3">
                                    <ProductImage src={r.product.imageUrl} alt="" className="h-9 w-9 rounded-lg"
                                                  fallbackLetter={r.product.name.charAt(0)}/>
                                    <span className="font-bold text-ink-900">{r.product.name}</span>
                                </div>
                            ),
                        },
                        {
                            key: "seller",
                            header: "Seller",
                            render: (r) => <span className="text-slate-500">{r.seller?.storeName || "-"}</span>
                        },
                        {
                            key: "stock",
                            header: "Current Stock",
                            render: (r) => <span
                                className={`font-extrabold ${r.product.stock === 0 ? "text-red-500" : "text-amber-600"}`}>{r.product.stock}</span>
                        },
                        {
                            key: "level",
                            header: "Low Level",
                            render: (r) => <span className="text-slate-400">{r.product.lowStockLevel ?? 5}</span>
                        },
                        {
                            key: "status",
                            header: "Status",
                            render: (r) =>
                                r.product.stock === 0 ?
                                    <Badge tone="red" uppercase dot><FaBan size={9}/> Out of Stock</Badge> :
                                    <Badge tone="amber" uppercase dot>Low Stock</Badge>,
                        },
                    ]}
                    rows={lowRows}
                    emptyMessage="Every product is comfortably stocked."
                />
            </section>
        </div>
    );
}