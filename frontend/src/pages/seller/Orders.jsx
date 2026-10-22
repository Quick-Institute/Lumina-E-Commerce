import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaArrowRight, FaTruckFast} from "react-icons/fa6";
import Tabs from "../../components/ui/Tabs";
import SearchBar from "../../components/ui/SearchBar";
import Badge, {OrderStatusBadge, PaymentStatusBadge} from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import {PageSpinner} from "../../components/ui/Spinner";
import {EmptyState} from "../../components/ui/States";
import {formatDate, formatDateTime, formatPrice} from "../../utils/format";
import {getSellerOrders, updateOrderStatus} from "../../services/orderService";
import {allowedNext} from "../../utils/orderFlow";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";
import {ORDER_STATUSES} from "../../utils/constants";

export default function SellerOrders() {
    const navigate = useNavigate();
    const {notify} = useToast();
    const {user} = useAuth();
    const sellerId = user?._id || user?.id;

    const [orders, setOrders] = useState(null);
    const [tab, setTab] = useState("All");
    const [search, setSearch] = useState("");
    const [advanceTarget, setAdvanceTarget] = useState(null);
    const [updating, setUpdating] = useState(false);

    const load = useCallback(
        () => getSellerOrders(sellerId).then(setOrders),
        [sellerId]
    );

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const map = {All: (orders || []).length};
        ORDER_STATUSES.forEach((s) => {
            map[s] = (orders || []).filter((o) => o.status === s).length;
        });
        return map;
    }, [orders]);

    const filtered = useMemo(() => {
        let list = orders || [];
        if (tab !== "All") list = list.filter((o) => o.status === tab);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (o) =>
                    o.orderNumber.toLowerCase().includes(q) ||
                    (o.customerName || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [orders, tab, search]);

    const advance = async (status) => {
        if (!advanceTarget || updating) return;
        setUpdating(true);
        try {
            await updateOrderStatus(advanceTarget.id, status);
            notify(`Order ${advanceTarget.orderNumber} → ${status}`);
            setAdvanceTarget(null);
            await load();
        } catch (err) {
            notify(err?.message || "Could not update order status", "error");
        } finally {
            setUpdating(false);
        }
    };

    if (!orders) {
        return <PageSpinner label="Loading your order queue…"/>;
    }

    const nextOptions = advanceTarget ? allowedNext(advanceTarget.status) : [];

    const OrderActions = ({order, compact = false}) => {
        const canAdvance =
            allowedNext(order.status).filter((s) => s !== "Cancelled").length >
            0;

        return (
            <div
                className={`flex gap-2 ${
                    compact ? "w-full flex-col xs:flex-row" : "inline-flex justify-end"
                }`}
            >
                {canAdvance && (
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<FaArrowRight size={10}/>}
                        className={compact ? "w-full xs:flex-1" : ""}
                        onClick={() => setAdvanceTarget(order)}
                    >
                        Update status
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="secondary"
                    className={compact ? "w-full xs:flex-1" : ""}
                    onClick={() => navigate(`/seller/orders/${order.id}`)}
                >
                    Details
                </Button>
            </div>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                        Orders
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        Orders containing your products. Update statuses here -
                        customers track them live.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto"
                    icon={
                        <FaTruckFast size={12} className="text-primary-600"/>
                    }
                    onClick={() => {
                        const headers = ["orderNumber", "customerName", "status", "paymentMethod", "totalAmount", "placedAt"];
                        const csv = [headers.join(","), ...orders.map(order => headers.map(key => JSON.stringify(order[key] ?? "")).join(","))].join("\n");
                        const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "seller-orders.csv";
                        link.click();
                        URL.revokeObjectURL(url);
                        notify("Orders exported successfully.", "success");
                    }}
                >
                    Export / bulk fulfil
                </Button>
            </div>

            {/* Tabs - scrollable on small screens */}
            <Tabs
                className="mt-6 overflow-x-auto sm:mt-7"
                items={[
                    {key: "All", label: "All", count: counts.All},
                    ...ORDER_STATUSES.map((s) => ({
                        key: s,
                        label: s,
                        count: counts[s],
                    })),
                ]}
                active={tab}
                onChange={setTab}
            />

            {/* Search */}
            <div className="mt-5">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search order number or customer…"
                    className="w-full sm:max-w-sm"
                />
            </div>

            <div className="lum-card mt-4 p-4 sm:p-5">
                {filtered.length === 0 ? (
                    <EmptyState
                        title="No orders in this view"
                        message="When shoppers check out with your products, the queue fills up here."
                    />
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="space-y-3 md:hidden">
                            {filtered.map((o) => (
                                <article
                                    key={o.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-ink-900">
                                                {o.orderNumber}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {formatDate(o.placedAt)}
                                            </p>
                                        </div>
                                        <OrderStatusBadge status={o.status}/>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Customer
                                            </p>
                                            <p className="mt-0.5 truncate text-sm font-semibold text-ink-800">
                                                {o.customerName || "Guest"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {o.items?.length || 0} item
                                                {(o.items?.length || 0) !== 1
                                                    ? "s"
                                                    : ""}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Total
                                            </p>
                                            <p className="mt-0.5 text-sm font-extrabold text-ink-900">
                                                {formatPrice(o.totalAmount, {
                                                    decimals: true,
                                                })}
                                            </p>
                                            <div className="mt-1 flex justify-end">
                                                {o.payment?.status ? (
                                                    <PaymentStatusBadge
                                                        status={o.payment.status}
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-slate-100 pt-3">
                                        <OrderActions order={o} compact/>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <div className="min-w-[860px]">
                                <DataTable
                                    columns={[
                                        {
                                            key: "orderNumber",
                                            header: "Order",
                                            render: (o) => (
                                                <div>
                                                    <p className="font-extrabold text-ink-900">
                                                        {o.orderNumber}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {formatDate(o.placedAt)}
                                                    </p>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "customer",
                                            header: "Customer",
                                            render: (o) => (
                                                <div>
                                                    <p className="font-semibold text-ink-800">
                                                        {o.customerName ||
                                                            "Guest"}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {o.items?.length || 0}{" "}
                                                        item
                                                        {(o.items?.length ||
                                                            0) !== 1
                                                            ? "s"
                                                            : ""}
                                                    </p>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "total",
                                            header: "Total",
                                            render: (o) => (
                                                <p className="font-bold text-ink-900">
                                                    {formatPrice(
                                                        o.totalAmount,
                                                        {decimals: true}
                                                    )}
                                                </p>
                                            ),
                                        },
                                        {
                                            key: "payment",
                                            header: "Payment",
                                            render: (o) =>
                                                o.payment?.status ? (
                                                    <PaymentStatusBadge
                                                        status={
                                                            o.payment.status
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                ),
                                        },
                                        {
                                            key: "status",
                                            header: "Fulfilment",
                                            render: (o) => (
                                                <OrderStatusBadge
                                                    status={o.status}
                                                />
                                            ),
                                        },
                                        {
                                            key: "actions",
                                            header: "",
                                            className: "text-right",
                                            render: (o) => (
                                                <OrderActions order={o}/>
                                            ),
                                        },
                                    ]}
                                    rows={filtered}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Status update modal */}
            <Modal
                open={Boolean(advanceTarget)}
                onClose={() => !updating && setAdvanceTarget(null)}
                title={`Update ${advanceTarget?.orderNumber || ""}`}
                subtitle={
                    advanceTarget
                        ? `Currently ${advanceTarget.status} · placed ${formatDateTime(
                            advanceTarget.placedAt
                        )}`
                        : ""
                }
                size="sm"
            >
                <p className="text-sm leading-relaxed text-slate-500">
                    Choose the next step in fulfilment. The customer&apos;s
                    tracking timeline updates instantly.
                </p>

                <div className="mt-4 space-y-2.5">
                    {nextOptions.length === 0 && (
                        <EmptyState
                            title="No transitions available"
                            message="This order is finalised."
                        />
                    )}

                    {nextOptions.map((status) => (
                        <button
                            key={status}
                            type="button"
                            disabled={updating}
                            onClick={() => advance(status)}
                            className={`flex w-full min-w-0 flex-col gap-3 rounded-xl border-2 px-3 py-3 text-left transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5 ${
                                status === "Cancelled"
                                    ? "border-red-200 bg-red-50/40 hover:border-red-400"
                                    : "border-slate-200 bg-white hover:border-primary-500"
                            }`}
                        >
                            <span className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-ink-900">
                                {status === "Processing" &&
                                    "Mark as Processing - pack & label"}
                                {status === "Shipped" &&
                                    "Mark as Shipped - hand to courier"}
                                {status === "Delivered" &&
                                    "Mark as Delivered - COD collected"}
                                {status === "Cancelled" && "Cancel this order"}
                            </span>
                            <Badge
                                tone={
                                    status === "Cancelled" ? "red" : "teal"
                                }
                                uppercase
                                className="shrink-0 self-start sm:self-center"
                            >
                                → {status}
                            </Badge>
                        </button>
                    ))}
                </div>
            </Modal>
        </div>
    );
}