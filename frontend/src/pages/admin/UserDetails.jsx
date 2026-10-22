import React, {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {
    FaArrowLeft,
    FaArrowRightToBracket,
    FaCalendarDay,
    FaCircleXmark,
    FaEnvelope,
    FaIdCard,
    FaListUl,
    FaLocationArrow,
    FaLocationDot,
    FaPhone,
    FaRegEnvelope,
    FaRegUser,
    FaShieldHalved,
} from "react-icons/fa6";
import Badge, {OrderStatusBadge} from "../../components/ui/Badge";
import {PageSpinner} from "../../components/ui/Spinner";
import {EmptyState} from "../../components/ui/States";
import {Select} from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dropdown, {DropdownItem} from "../../components/ui/Dropdown";
import {ConfirmDialog} from "../../components/ui/Modal";
import {formatDate, formatNumber, formatPrice} from "../../utils/format";
import {getUserDetail, setUserStatus} from "../../services/accountService";
import {useToast} from "../../context/ToastContext";

const ROLE_TONES = {Administrator: "purple", Seller: "indigo", Customer: "teal"};

function InfoRow({icon, label, value}) {
    return (
        <div className="flex items-start gap-3 py-3 sm:py-2.5">
            <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink-900 [overflow-wrap:anywhere]">{value || "-"}</p>
            </div>
        </div>
    );
}

export default function AdminUserDetails() {
    const {userId} = useParams();
    const {notify} = useToast();
    const [detail, setDetail] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [confirmToggle, setConfirmToggle] = useState(null); // next status

    useEffect(() => {
        let alive = true;
        getUserDetail(userId).then((d) => alive && setDetail(d));
        return () => {
            alive = false;
        };
    }, [userId]);

    const orders = useMemo(() => {
        let list = detail?.orders || [];
        if (statusFilter) list = list.filter((o) => o.status === statusFilter);
        return list;
    }, [detail, statusFilter]);

    if (!detail) return <PageSpinner label="Loading account…"/>;

    const {user, stats} = detail;
    if (!user) {
        return (
            <div className="py-12">
                <EmptyState
                    icon={<FaRegUser size={30}/>}
                    title="User not found"
                    message="This account may have been removed."
                />
            </div>
        );
    }

    const isActive = user.status === "Active";
    const vsAverage = Number(stats?.vsAverage) || 0;
    const serial = `USR-${10000 + (Number(String(user.id).replace(/\D/g, "")) || 0) * 293}-X`;

    const applyToggle = async () => {
        await setUserStatus(user.id, confirmToggle);
        notify(`${user.name} is now ${confirmToggle.toLowerCase()}.`, confirmToggle === "Active" ? "success" : "info");
        setConfirmToggle(null);
        getUserDetail(userId).then(setDetail);
    };

    return (
        <div>
            {/* Breadcrumb + back */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Link to="/admin/users" className="hover:text-primary-600">
                        User Management
                    </Link>
                    <span aria-hidden>›</span>
                    <span className="text-ink-700">User Details</span>
                </nav>
                <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline"
                >
                    <FaArrowLeft size={10}/> Back to Users
                </Link>
            </div>

            {/* Header card - Responsive layout prevents button/email overlap */}
            <section className="lum-card mt-4 p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                    <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-extrabold text-indigo-600 sm:h-16 sm:w-16 sm:text-xl">
                        {user.avatar ? <img src={user.avatar} alt={user.name || "User"}
                                            className="h-full w-full rounded-2xl object-cover"/> : (user.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl [overflow-wrap:anywhere]">
                            {user.name}
                        </h1>
                        <p className="mt-1 break-all text-sm text-slate-500">
                            {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone={ROLE_TONES[user.role] || "slate"} uppercase>
                                {user.role}
                            </Badge>
                            <Badge tone={isActive ? "green" : user.status === "Suspended" ? "red" : "slate"} uppercase
                                   dot>
                                {user.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <Dropdown
                            trigger={(open) => (
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition-colors ${open ? "bg-slate-100 ring-slate-300" : "ring-slate-200 hover:bg-slate-50"}`}>
                                    ⋯
                                </span>
                            )}
                        >
                            <DropdownItem
                                icon={<FaEnvelope size={12}/>}
                                onClick={() => notify("Messaging ships with the backend phase.", "info")}
                            >
                                Email user
                            </DropdownItem>
                            <DropdownItem
                                icon={<FaShieldHalved size={12}/>}
                                onClick={() => notify("Password resets are handled by the auth API in phase 2.", "info")}
                            >
                                Force password reset
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </div>

                <div
                    className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-center !border-red-200 !text-red-600 hover:!bg-red-50 sm:w-auto"
                        icon={isActive ? <FaCircleXmark size={11}/> : <FaArrowRightToBracket size={11}/>}
                        onClick={() => setConfirmToggle(isActive ? "Inactive" : "Active")}
                    >
                        {isActive ? "Deactivate Account" : "Activate Account"}
                    </Button>
                </div>
            </section>

            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[340px_1fr] lg:gap-6">
                {/* Left column */}
                <div className="min-w-0 space-y-5 lg:space-y-6">
                    <section className="lum-card p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold tracking-tight text-ink-900">
                            <FaRegUser className="text-primary-600" size={13}/> User Information
                        </h2>
                        <div className="mt-2 divide-y divide-slate-50">
                            <InfoRow icon={<FaIdCard size={12}/>} label="User ID" value={serial}/>
                            <InfoRow icon={<FaRegUser size={12}/>} label="Full Name" value={user.name}/>
                            <InfoRow icon={<FaRegEnvelope size={12}/>} label="Email" value={user.email}/>
                            <InfoRow icon={<FaShieldHalved size={12}/>} label="Role" value={user.role}/>
                            <InfoRow icon={<FaCalendarDay size={12}/>} label="Registration Date"
                                     value={formatDate(user.joinedAt)}/>
                            <InfoRow icon={<FaArrowRightToBracket size={12}/>} label="Last Login"
                                     value={user.lastLogin || "-"}/>
                        </div>
                    </section>

                    <section className="lum-card p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold tracking-tight text-ink-900">
                            <FaListUl className="text-primary-600" size={13}/> Profile Information
                        </h2>
                        {user.customer || user.phone ? (
                            <div className="mt-2 divide-y divide-slate-50">
                                <InfoRow icon={<FaPhone size={12}/>} label="Phone Number" value={user.phone}/>
                                <InfoRow icon={<FaLocationDot size={12}/>} label="Address"
                                         value={user.customer?.address}/>
                                <InfoRow icon={<FaLocationArrow size={12}/>} label="City / District"
                                         value={user.customer ? `${user.customer.city}, ${user.customer.district}` : null}/>
                                <InfoRow icon={<FaIdCard size={12}/>} label="Postal Code"
                                         value={user.customer?.postalCode}/>
                            </div>
                        ) : (
                            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-500">
                                {user.role === "Seller" ? "Seller accounts keep their contact details on the business profile." : "No profile details on file."}
                            </p>
                        )}
                    </section>

                    {/* Desktop-only action block (mobile uses the header buttons instead) */}
                    <section className="lum-card hidden p-6 lg:block">
                        <h2 className="text-sm font-extrabold tracking-tight text-ink-900">Account Actions</h2>
                        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-bold text-ink-900">Account Status</p>
                                <p className="text-xs text-slate-400">Inactive users cannot log in</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isActive}
                                aria-label="Toggle account status"
                                onClick={() => setConfirmToggle(isActive ? "Inactive" : "Active")}
                                className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-primary-600" : "bg-slate-300"}`}
                            >
                                <span
                                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isActive ? "left-[22px]" : "left-0.5"}`}/>
                            </button>
                        </div>
                        <Button
                            className="mt-4 w-full justify-center !border-red-200 !text-red-600 hover:!bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmToggle(isActive ? "Inactive" : "Active")}
                        >
                            {isActive ? "Deactivate Account" : "Activate Account"}
                        </Button>
                    </section>
                </div>

                {/* Right column */}
                <div className="min-w-0 space-y-5 lg:space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[
                            {
                                label: "Total Orders",
                                value: formatNumber(stats.totalOrders),
                                chip: `${vsAverage >= 0 ? "↑" : "↓"} ${Math.abs(vsAverage)}% vs avg`,
                                tone: vsAverage >= 0 ? "text-emerald-600" : "text-red-500"
                            },
                            {
                                label: "Total Spent",
                                value: formatPrice(stats.totalSpent),
                                chip: user.memberTier || (user.role === "Seller" ? "Seller account" : "Standard"),
                                tone: "text-purple-600"
                            },
                            {
                                label: "Cancelled",
                                value: formatNumber(stats.cancelled),
                                chip: stats.totalOrders && (stats.cancelled / stats.totalOrders) > 0.25 ? "High rate" : "Low rate",
                                tone: stats.totalOrders && (stats.cancelled / stats.totalOrders) > 0.25 ? "text-red-500" : "text-emerald-600"
                            },
                        ].map((t) => (
                            <div key={t.label} className="lum-card p-4 sm:p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.label}</p>
                                <p className="mt-1.5 truncate text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{t.value}</p>
                                <p className={`mt-1.5 truncate text-xs font-semibold ${t.tone}`}>{t.chip}</p>
                            </div>
                        ))}
                    </div>

                    <section className="lum-card">
                        <div
                            className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <h2 className="text-base font-extrabold tracking-tight text-ink-900">Order History</h2>
                            <label
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:w-auto">
                                <span className="hidden sm:inline">Status:</span>
                                <Select
                                    name="uh-filter"
                                    aria-label="Filter orders by status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-11 w-auto sm:h-11 sm:w-auto text-xs"
                                >
                                    <option value="">All statuses</option>
                                    {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((st) => (
                                        <option key={st} value={st}>
                                            {st}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                        </div>

                        {orders.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    icon={<FaListUl size={26}/>}
                                    title={user.role === "Customer" ? "No orders yet" : "No customer orders"}
                                    message={user.role === "Customer" ? "This account has not placed an order." : "This account does not buy on the platform - check their seller/admin records instead."}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards View */}
                                <div className="space-y-3 p-4 md:hidden">
                                    {orders.slice(0, 10).map((o) => (
                                        <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-extrabold text-ink-900">{o.orderNumber}</p>
                                                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(o.placedAt)}</p>
                                                </div>
                                                <OrderStatusBadge status={o.status}/>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Items</p>
                                                    <p className="text-sm font-semibold text-ink-900">
                                                        {o.items.length} {o.items.length === 1 ? "Product" : "Products"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                                                    <p className="text-sm font-extrabold text-ink-900">{formatPrice(o.totalAmount)}</p>
                                                </div>
                                            </div>
                                            <div
                                                className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                                <Badge
                                                    tone={o.payment?.status === "Paid" ? "green" : o.payment?.status === "Failed" ? "red" : o.payment?.status === "Cancelled" ? "slate" : "amber"}
                                                    uppercase
                                                >
                                                    {o.payment?.status === "Paid" ? "Paid" : o.payment?.status || "Pending"}
                                                </Badge>
                                                <Link
                                                    to={`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`}
                                                    className="text-xs font-bold text-primary-600 hover:underline"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                        <thead>
                                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-3">Order No.</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Items</th>
                                            <th className="px-4 py-3">Total Amount</th>
                                            <th className="px-4 py-3">Payment</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {orders.slice(0, 10).map((o) => (
                                            <tr key={o.id} className="hover:bg-slate-50/70">
                                                <td className="px-6 py-3 font-bold text-ink-900">{o.orderNumber}</td>
                                                <td className="px-4 py-3 text-slate-500">{formatDate(o.placedAt)}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {o.items.length} {o.items.length === 1 ? "Product" : "Products"}
                                                </td>
                                                <td className="px-4 py-3 font-extrabold text-ink-900">{formatPrice(o.totalAmount)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        tone={o.payment?.status === "Paid" ? "green" : o.payment?.status === "Failed" ? "red" : o.payment?.status === "Cancelled" ? "slate" : "amber"}
                                                        uppercase>
                                                        {o.payment?.status === "Paid" ? "Paid" : o.payment?.status || "Pending"}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <OrderStatusBadge status={o.status}/>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link to={`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`}
                                                          className="text-xs font-bold text-primary-600 hover:underline">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {orders.length > 0 && (
                            <p className="border-t border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:px-6">
                                Showing 1–{Math.min(10, orders.length)} of {formatNumber(orders.length)} orders
                            </p>
                        )}
                    </section>
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(confirmToggle)}
                onClose={() => setConfirmToggle(null)}
                onConfirm={applyToggle}
                danger={confirmToggle !== "Active"}
                title={confirmToggle === "Active" ? "Activate this account?" : "Deactivate this account?"}
                confirmLabel={confirmToggle === "Active" ? "Activate" : "Deactivate"}
                message={
                    confirmToggle === "Active"
                        ? `${user.name} will be able to sign in again immediately.`
                        : `${user.name} will be signed out and blocked from new logins. Their order history stays intact.`
                }
            />
        </div>
    );
}