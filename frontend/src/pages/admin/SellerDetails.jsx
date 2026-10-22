import React, {useEffect, useMemo, useState} from "react";
import {Link, useParams, useSearchParams} from "react-router-dom";
import {
    FaArrowLeft,
    FaBan,
    FaBoxOpen,
    FaCalendarDay,
    FaCheck,
    FaCircleCheck,
    FaClock,
    FaIdCard,
    FaListUl,
    FaPhone,
    FaRegEnvelope,
    FaStore,
    FaTruckFast,
    FaUser,
    FaXmark,
} from "react-icons/fa6";
import Badge, {SellerStatusBadge} from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import ProductImage from "../../components/product/ProductImage";
import Dropdown, {DropdownItem} from "../../components/ui/Dropdown";
import {ConfirmDialog} from "../../components/ui/Modal";
import {EmptyState} from "../../components/ui/States";
import {PageSpinner} from "../../components/ui/Spinner";
import SellerReviewModal from "./SellerReviewModal";
import {formatDate, formatNumber, formatPrice} from "../../utils/format";
import {getAdminSellerDetail, setSellerApproval} from "../../services/accountService";
import {useToast} from "../../context/ToastContext";

function InfoRow({icon, label, value, tone}) {
    return (
        <div className="flex items-start gap-3 py-3 sm:py-2.5">
            <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className={`mt-0.5 text-sm font-semibold [overflow-wrap:anywhere] ${tone || "text-ink-900"}`}>
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}

export default function AdminSellerDetails() {
    const {sellerId} = useParams();
    const [params, setParams] = useSearchParams();
    const {notify} = useToast();

    const [detail, setDetail] = useState(null);
    const [reviewOpen, setReviewOpen] = useState(params.get("review") === "1");
    const [reviewInitial, setReviewInitial] = useState("approve");
    const [confirmReject, setConfirmReject] = useState(false);

    const [prodSearch, setProdSearch] = useState("");
    const [prodPage, setProdPage] = useState(1);
    const perPage = 10;

    const load = () => getAdminSellerDetail(sellerId).then(setDetail);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellerId]);

    const products = useMemo(() => {
        let list = detail?.products || [];
        if (prodSearch.trim()) {
            const q = prodSearch.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [detail, prodSearch]);

    useEffect(() => setProdPage(1), [prodSearch]);

    if (!detail) return <PageSpinner label="Loading seller…"/>;

    const {seller, stats} = detail;
    if (!seller) {
        return (
            <div className="py-12">
                <EmptyState
                    icon={<FaStore size={30}/>}
                    title="Seller not found"
                    message="This account may have been removed."
                />
            </div>
        );
    }

    const pending = seller.approvalStatus === "Pending";
    const accountActive = (seller.accountStatus || (seller.approvalStatus === "Approved" ? "Active" : "Inactive")) === "Active";
    const initials = (seller.storeName || seller.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
    const pages = Math.max(1, Math.ceil(products.length / perPage));
    const pageRows = products.slice((prodPage - 1) * perPage, prodPage * perPage);

    const decide = async (status, message) => {
        await setSellerApproval(seller.id, status);
        notify(message, status === "Approved" ? "success" : "info");
        setConfirmReject(false);
        load();
    };

    return (
        <div>
            {/* Breadcrumb + back */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Link to="/admin/sellers" className="hover:text-primary-600">
                        Seller Management
                    </Link>
                    <span aria-hidden>›</span>
                    <span className="text-ink-700">Seller Details</span>
                </nav>
                <Link
                    to="/admin/sellers"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline"
                >
                    <FaArrowLeft size={10}/> Back to Sellers
                </Link>
            </div>

            {/* Full-width store cover with responsive heights */}
            <div
                className="relative h-44 w-full overflow-hidden sm:h-56 md:h-64 lg:h-72 rounded-t-2xl shadow-card"
                style={{background: `linear-gradient(105deg, ${seller.accent || "#0d9488"}, #0f766e)`}}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent"/>

                {/* Actions / Dropdown Top Right */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-10 flex flex-wrap items-center gap-2">
                    {pending ? (
                        <>
                            <Button
                                size="sm"
                                className="!bg-emerald-500 !text-white hover:!bg-emerald-600"
                                icon={<FaCheck size={10}/>}
                                onClick={() => decide("Approved", `${seller.storeName} approved - the store is live.`)}
                            >
                                <span className="hidden xs:inline">Approve Seller</span>
                                <span className="xs:hidden">Approve</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="!border-white/70 !bg-white/90 !text-red-600 hover:!bg-white"
                                icon={<FaXmark size={10}/>}
                                onClick={() => {
                                    setReviewInitial("reject");
                                    setReviewOpen(true);
                                }}
                            >
                                <span className="hidden xs:inline">Reject Seller</span>
                                <span className="xs:hidden">Reject</span>
                            </Button>
                        </>
                    ) : (
                        <Badge tone="green" className="!bg-white/90">
                            {seller.approvalStatus}
                        </Badge>
                    )}
                    <Dropdown
                        trigger={(open) => (
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 ring-1 ring-white/40 transition-colors ${open ? "bg-white/25" : "hover:bg-white/15"}`}>
                                ⋯
                            </span>
                        )}
                    >
                        <DropdownItem icon={<FaStore size={12}/>} to={`/store/${seller.id}`}>
                            View public storefront
                        </DropdownItem>
                        {pending && (
                            <DropdownItem icon={<FaIdCard size={12}/>} onClick={() => setReviewOpen(true)}>
                                Open review dialog
                            </DropdownItem>
                        )}
                        {seller.approvalStatus === "Approved" && (
                            <DropdownItem icon={<FaBan size={12}/>} danger onClick={() => setConfirmReject(true)}>
                                Suspend seller
                            </DropdownItem>
                        )}
                    </Dropdown>
                </div>
            </div>

            {/* Profile Card Overlapping Cover */}
            <section
                className="relative -mt-12 rounded-b-2xl border-x border-b border-slate-200 bg-white px-4 pb-5 pt-16 shadow-card sm:-mt-14 sm:px-7 sm:pb-7 sm:pl-40 sm:pt-6"
                aria-labelledby="store-name"
            >
                {/* Avatar overlapping the cover */}
                <div
                    className="absolute -top-12 left-4 flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-extrabold text-white shadow-lift ring-4 ring-white sm:-top-14 sm:left-7 sm:h-28 sm:w-28 sm:rounded-3xl sm:text-4xl z-10"
                    style={{
                        background: `linear-gradient(135deg, ${seller.accent || "#0d9488"}, #134e4a)`,
                    }}
                    aria-hidden="true"
                >
                    {seller.avatar ? <img src={seller.avatar} alt={seller.storeName}
                                          className="h-full w-full rounded-2xl object-cover"/> : initials}
                </div>

                <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1
                            id="store-name"
                            className="text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl lg:text-3xl [overflow-wrap:anywhere]"
                        >
                            {seller.storeName}
                        </h1>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 sm:gap-2">
                            <span className="truncate">Owner: {seller.ownerName}</span>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex flex-wrap gap-1.5">
                                <SellerStatusBadge status={seller.approvalStatus}/>
                                <Badge tone={accountActive ? "green" : "slate"} uppercase dot>
                                    {accountActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[340px_1fr] lg:gap-6">
                {/* Left column */}
                <div className="min-w-0 space-y-5 lg:space-y-6">
                    <section className="lum-card p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold tracking-tight text-ink-900">
                            <FaCircleCheck className="text-primary-600" size={13}/> Seller Information
                        </h2>
                        <div className="mt-2 divide-y divide-slate-50">
                            <InfoRow icon={<FaUser size={12}/>} label="Owner Name" value={seller.ownerName}/>
                            <InfoRow icon={<FaRegEnvelope size={12}/>} label="Email" value={seller.ownerEmail}/>
                            <InfoRow icon={<FaPhone size={12}/>} label="Phone Number" value={seller.phone}/>
                            <InfoRow icon={<FaCalendarDay size={12}/>} label="Registration Date"
                                     value={formatDate(seller.appliedAt || seller.joinedAt)}/>
                            <InfoRow
                                icon={<FaTruckFast size={12}/>}
                                label="Delivery Policy"
                                value={seller.deliveryFee > 0 ? `Rs. ${seller.deliveryFee} per order` : "Free delivery"}
                                tone={seller.deliveryFee > 0 ? "text-amber-600" : "text-emerald-600"}
                            />
                            <InfoRow
                                icon={<FaIdCard size={12}/>}
                                label="Account Status"
                                value={accountActive ? "Active" : `Inactive (${seller.approvalStatus})`}
                            />
                        </div>
                    </section>

                    <section className="lum-card p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold tracking-tight text-ink-900">
                            <FaStore className="text-primary-600" size={13}/> Business Information
                        </h2>
                        <dl className="mt-4 space-y-4 text-sm">
                            {[
                                ["Business Name", seller.businessName || seller.storeName],
                                ["Business Description", seller.description],
                                ["Business Address", seller.businessAddress || seller.address],
                                ["Business Phone", seller.phone],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{k}</dt>
                                    <dd className="mt-1 leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{v || "-"}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className="lum-card p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold tracking-tight text-ink-900">
                            <FaListUl className="text-primary-600" size={13}/> Approval Status
                        </h2>
                        <ol className="mt-4 space-y-0">
                            {[
                                {
                                    title: "Application Applied",
                                    at: formatDate(seller.appliedAt || seller.joinedAt),
                                    state: "done"
                                },
                                {
                                    title: "Under Review",
                                    at: seller.underReviewAt ? formatDate(seller.underReviewAt) : pending ? "In progress" : formatDate(seller.appliedAt || seller.joinedAt),
                                    state: pending ? "current" : "done",
                                },
                                {
                                    title: seller.approvalStatus === "Rejected" ? "Rejected" : "Approved",
                                    at: seller.approvalStatus === "Pending"
                                        ? "Awaiting decision"
                                        : seller.approvalStatus === "Rejected"
                                            ? seller.rejectionReason
                                                ? `Reason: ${seller.rejectionReason}`
                                                : "Rejected by admin"
                                            : seller.reviewedAt
                                                ? `Approved ${formatDate(seller.reviewedAt)}`
                                                : "Approved - store is live",
                                    state: seller.approvalStatus === "Pending" ? "upcoming" : seller.approvalStatus === "Rejected" ? "rejected" : "done",
                                },
                            ].map((step, i, arr) => (
                                <li key={step.title} className="relative flex gap-3 pb-6 last:pb-0">
                                    {i < arr.length - 1 && (
                                        <span className="absolute left-[11px] top-6 h-full w-px bg-slate-200"
                                              aria-hidden/>
                                    )}
                                    <span
                                        className={`z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                                            step.state === "done" ? "bg-emerald-500" : step.state === "current" ? "bg-amber-400" : step.state === "rejected" ? "bg-red-500" : "bg-slate-200 text-slate-400"
                                        }`}
                                    >
                                        {step.state === "done" ? <FaCheck size={10}/> : step.state === "current" ?
                                            <FaClock size={10}/> : step.state === "rejected" ? <FaXmark size={10}/> :
                                                <span className="h-1.5 w-1.5 rounded-full bg-current"/>}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-bold ${step.state === "upcoming" ? "italic text-slate-400" : "text-ink-900"}`}>{step.title}</p>
                                        <p className="text-xs text-slate-400 [overflow-wrap:anywhere]">{step.at}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                {/* Right column */}
                <div className="min-w-0 space-y-5 lg:space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                        {[
                            {
                                label: "Total Products",
                                value: formatNumber(stats.totalProducts),
                                sub: "Listed in catalog",
                                tone: ""
                            },
                            {
                                label: "Active Products",
                                value: formatNumber(pending ? 0 : stats.activeProducts),
                                sub: pending ? "Pending approval" : "Live on marketplace",
                                tone: pending ? "text-amber-600" : "text-emerald-600"
                            },
                            {
                                label: "Total Orders",
                                value: formatNumber(detail.orders?.length || 0),
                                sub: "Lifetime count",
                                tone: ""
                            },
                            {
                                label: "Total Sales",
                                value: formatPrice(stats.lifetimeRevenue),
                                sub: "Revenue generated",
                                tone: ""
                            },
                        ].map((t) => (
                            <div key={t.label} className="lum-card p-4 sm:p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.label}</p>
                                <p className="mt-1.5 truncate text-lg font-extrabold tracking-tight text-ink-900 sm:text-xl">{t.value}</p>
                                <p className={`mt-1 text-xs font-semibold ${t.tone || "text-slate-400"}`}>{t.sub}</p>
                            </div>
                        ))}
                    </div>

                    <section className="lum-card">
                        <div
                            className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <h2 className="text-base font-extrabold tracking-tight text-ink-900">Seller Products</h2>
                            <SearchBar
                                value={prodSearch}
                                onChange={setProdSearch}
                                placeholder="Search products…"
                                className="w-full sm:max-w-xs"
                            />
                        </div>

                        {products.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    icon={<FaBoxOpen size={26}/>}
                                    title="No products yet"
                                    message="This seller hasn't uploaded a catalog."
                                />
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards View */}
                                <div className="space-y-3 p-4 md:hidden">
                                    {pageRows.map((p) => (
                                        <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-start gap-3">
                                                <ProductImage
                                                    product={p}
                                                    className="h-12 w-12 shrink-0 rounded-lg"
                                                    iconSize={18}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-bold text-ink-900">{p.name}</p>
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        <Badge tone="teal" uppercase>
                                                            {p.category}
                                                        </Badge>
                                                        <Badge
                                                            tone={pending ? "slate" : p.status === "Active" ? "green" : "amber"}
                                                            uppercase>
                                                            {pending ? "Draft" : p.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</p>
                                                    <p className="text-sm font-extrabold text-ink-900">{formatPrice(p.price)}</p>
                                                </div>
                                                <div className="flex items-end justify-between gap-2">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock</p>
                                                        <p className="text-sm font-semibold text-slate-600">{p.stock}</p>
                                                    </div>
                                                    <Link
                                                        to={`/product/${p.id}`}
                                                        className="text-xs font-bold text-primary-600 hover:underline"
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                                        <thead>
                                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">Stock</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {pageRows.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/70">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <ProductImage
                                                            product={p}
                                                            className="h-9 w-9 shrink-0 rounded-lg"
                                                            iconSize={15}
                                                        />
                                                        <span
                                                            className="truncate font-bold text-ink-900 max-w-[200px] xl:max-w-[280px]">
                                                                {p.name}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge tone="teal" uppercase>
                                                        {p.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-extrabold text-ink-900">{formatPrice(p.price)}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-600">{p.stock}</td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        tone={pending ? "slate" : p.status === "Active" ? "green" : "amber"}
                                                        uppercase
                                                    >
                                                        {pending ? "Draft" : p.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        to={`/product/${p.id}`}
                                                        className="text-xs font-bold text-primary-600 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div
                                    className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Showing {Math.min((prodPage - 1) * perPage + 1, products.length)}–{Math.min(prodPage * perPage, products.length)} of {products.length} products
                                    </p>
                                    <Pagination
                                        page={prodPage}
                                        pages={pages}
                                        onChange={setProdPage}
                                        className="w-full justify-center sm:w-auto"
                                    />
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>

            <SellerReviewModal
                open={reviewOpen && pending}
                seller={seller}
                initialDecision={reviewInitial}
                onClose={() => {
                    setReviewOpen(false);
                    if (params.get("review")) {
                        params.delete("review");
                        setParams(params, {replace: true});
                    }
                }}
                onDecided={() => load()}
            />

            <ConfirmDialog
                open={confirmReject}
                onClose={() => setConfirmReject(false)}
                onConfirm={() => decide("Suspended", `${seller.storeName} suspended - the storefront is offline.`)}
                danger
                title={`Suspend ${seller.storeName}?`}
                confirmLabel="Suspend"
                message="Buyers can no longer purchase their products until reinstated. Existing orders are still fulfilled."
            />
        </div>
    );
}