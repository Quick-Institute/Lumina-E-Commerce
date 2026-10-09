import React, {useCallback, useEffect, useMemo, useState} from "react";
import useUrlPage from "../../../hooks/useUrlPage";
import {useNavigate, useSearchParams} from "react-router-dom";
import {FaInbox, FaWandMagicSparkles} from "react-icons/fa6";
import Tabs from "../../../components/ui/Tabs";
import SearchBar from "../../../components/ui/SearchBar";
import {Select} from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/ui/Pagination";
import OrderCard from "../../../components/orders/OrderCard";
import {EmptyState} from "../../../components/ui/States";
import {ConfirmDialog} from "../../../components/ui/Modal";
import {PageSpinner} from "../../../components/ui/Spinner";
import {Textarea} from "../../../components/ui/Input";
import {getMyOrders, cancelOrder} from "../../../services/orderService";
import {useAuth} from "../../../context/AuthContext";
import {useCart} from "../../../context/CartContext";
import {useToast} from "../../../context/ToastContext";
import {ORDER_STATUSES} from "../../../utils/constants";

const PER_PAGE = 6;
const DATE_RANGES = [
    {value: "30", label: "Last 30 Days"},
    {value: "90", label: "Last 3 Months"},
    {value: "365", label: "Last 12 Months"},
    {value: "all", label: "All Time"},
];

export default function MyOrders() {
    const {user} = useAuth();
    const cart = useCart();
    const navigate = useNavigate();
    const {notify} = useToast();
    const [params, setParams] = useSearchParams();

    const [orders, setOrders] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [range, setRange] = useState("all");
    const [page, setPage] = useUrlPage();
    const [demoEmpty, setDemoEmpty] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const tab = params.get("status") || "All";

    const load = useCallback(() => getMyOrders(user?.id).then(setOrders), [user]);
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
        if (status) list = list.filter((o) => o.status === status);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q)));
        }
        if (range !== "all") {
            const cutoff = Date.now() - Number(range) * 86400000;
            list = list.filter((o) => new Date(o.placedAt).getTime() >= cutoff);
        }
        return list;
    }, [orders, tab, status, search, range]);

    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const visible = filtered.slice((Math.min(page, pages) - 1) * PER_PAGE, Math.min(page, pages) * PER_PAGE);

    const reorder = (order) => {
        let n = 0;
        order.items.forEach((it) => {
            cart.add(it.productId, it.qty);
            n += 1;
        });
        notify(`${n} ${n === 1 ? "item" : "items"} added back to your cart`);
        navigate("/cart");
    };

    const doCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await cancelOrder(cancelTarget.id, cancelReason.trim());
            notify("Order cancelled - items returned to stock", "info");
            setCancelTarget(null);
            setCancelReason("");
            load();
        } catch (err) {
            notify(err.message, "error");
        } finally {
            setCancelling(false);
        }
    };

    if (!orders) return <PageSpinner label="Loading your orders…"/>;

    const isEmpty = demoEmpty || filtered.length === 0;

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">My Orders</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Track and manage your recent and historical orders.</p>
                </div>
            </div>

            <div className="mt-7">
                <Tabs
                    items={[{key: "All", label: "All Orders", count: counts.All}, ...ORDER_STATUSES.map((s) => ({
                        key: s,
                        label: s,
                        count: counts[s]
                    }))]}
                    active={tab}
                    onChange={(key) => {
                        setPage(1);
                        if (key === "All") setParams(new URLSearchParams());
                        else setParams(new URLSearchParams({status: key}));
                    }}
                    className="overflow-x-auto"
                />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <SearchBar value={search} onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                }} placeholder="Search by order number..." className="w-full sm:max-w-xs"/>
                <Select name="statusFilter" value={status} onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                }} className="h-[44px] w-auto min-w-40 text-sm sm:!w-44">
                    <option value="">All Statuses</option>
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </Select>
                <Select name="rangeFilter" value={range} onChange={(e) => setRange(e.target.value)}
                        className="h-[44px] w-auto text-sm">
                    {DATE_RANGES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </Select>
            </div>

            <div className="mt-6 space-y-4">
                {isEmpty ? (
                    <EmptyState
                        icon={<FaInbox size={34}/>}
                        title={demoEmpty ? "No orders yet" : "No orders match this view"}
                        message={
                            demoEmpty
                                ? "When you place your first order it will appear here with live tracking, receipts and one-tap reorder."
                                : "Try a different status tab, date range, or search term."
                        }
                        action={{label: "Start shopping", onClick: () => navigate("/shop")}}
                    />
                ) : (
                    visible.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onDetails={(o) => navigate(`/account/orders/${o.id}`)}
                            onTrack={(o) => navigate(`/account/orders/${o.id}/track`)}
                            onReorder={reorder}
                            onCancel={setCancelTarget}
                        />
                    ))
                )}
            </div>

            {!isEmpty && pages > 1 && (
                <Pagination className="mt-10" page={Math.min(page, pages)} pages={pages} onChange={(p) => {
                    setPage(p);
                    window.scrollTo({top: 0, behavior: "smooth"});
                }}/>
            )}

            <ConfirmDialog
                open={Boolean(cancelTarget)}
                onClose={() => setCancelTarget(null)}
                onConfirm={doCancel}
                loading={cancelling}
                title="Cancel this order?"
                confirmLabel="Yes, cancel order"
                message={`${cancelTarget?.orderNumber} will be cancelled. Items return to seller stock and any COD payment is voided. This cannot be undone.`}
            >
                <div className="mt-4">
                    <Textarea
                        label="Reason (optional)"
                        name="cancelReason"
                        rows={3}
                        placeholder='e.g. "I decided to purchase a different model instead."'
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </div>
            </ConfirmDialog>
        </div>
    );
}