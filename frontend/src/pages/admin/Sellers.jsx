import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import useUrlPage from "../../hooks/useUrlPage";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {
    FaArrowUpRightFromSquare,
    FaCheck,
    FaDownload,
    FaEllipsisVertical,
    FaEye,
    FaStore,
    FaTriangleExclamation,
    FaUserSlash
} from "react-icons/fa6";
import SearchBar from "../../components/ui/SearchBar";
import {Select} from "../../components/ui/Input";
import Badge, {SellerStatusBadge} from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Dropdown, {DropdownItem} from "../../components/ui/Dropdown";
import {ConfirmDialog} from "../../components/ui/Modal";
import {EmptyState} from "../../components/ui/States";
import {PageSpinner} from "../../components/ui/Spinner";
import SellerReviewModal from "./SellerReviewModal";
import {formatNumber} from "../../utils/format";
import {listSellers, setSellerApproval} from "../../services/accountService";
import {useToast} from "../../context/ToastContext";

const TABS = [
    {key: "All", label: "All"},
    {key: "Pending", label: "Pending"},
    {key: "Approved", label: "Approved"},
    {key: "Rejected", label: "Rejected"},
    {key: "Suspended", label: "Suspended"},
];

export default function AdminSellers() {
    const {notify} = useToast();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [sellers, setSellers] = useState(null);
    const [search, setSearch] = useState(params.get("q") || "");
    const [tab, setTab] = useState(params.get("tab") || "All");
    const [page, setPage] = useUrlPage();
    const [perPage, setPerPage] = useState(10);
    const [reviewing, setReviewing] = useState(null); // { seller, initial } opened in review modal
    const [confirm, setConfirm] = useState(null); // {seller, status, label, message}

    const load = useCallback(() => listSellers().then(setSellers), []);
    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const list = sellers || [];
        return {All: list.length, ...Object.fromEntries(["Pending", "Approved", "Rejected", "Suspended"].map((k) => [k, list.filter((s) => s.approvalStatus === k).length]))};
    }, [sellers]);

    const filtered = useMemo(() => {
        let list = sellers || [];
        if (tab !== "All") list = list.filter((s) => s.approvalStatus === tab);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((s) => [s.storeName, s.businessName, s.ownerName, s.ownerEmail].some((f) => String(f || "").toLowerCase().includes(q)));
        }
        return list;
    }, [sellers, tab, search]);

    const firstRender = useRef(true);
    useEffect(() => {
        // Keep a deep-linked ?page=n on mount; reset to page 1 only when filters change.
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, search, perPage]);

    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    const rows = filtered.slice((page - 1) * perPage, page * perPage);

    const act = async (seller, status) => {
        await setSellerApproval(seller.id, status);
        notify(`${seller.storeName} → ${status}.`, status === "Approved" ? "success" : "info");
        load();
    };

    if (!sellers) return <PageSpinner label="Loading partners…"/>;

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Seller
                        Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Review, approve, and manage seller accounts</p>
                </div>
                <Button size="sm" variant="secondary" icon={<FaDownload size={11}/>} onClick={() => {
                    const headers = ["id", "name", "email", "storeName", "approvalStatus", "status"];
                    const csv = [headers.join(","), ...sellers.map(s => headers.map(h => JSON.stringify(s[h] ?? "")).join(","))].join("\n");
                    const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "lumina-sellers.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                }}>
                    Export
                </Button>
            </div>

            {/* KPI cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                    {label: "Total Sellers", value: counts.All, cls: ""},
                    {
                        label: "Pending Approval",
                        value: counts.Pending,
                        cls: "border-amber-200 bg-amber-50/60 ring-1 ring-amber-100"
                    },
                    {label: "Approved", value: counts.Approved, cls: ""},
                    {label: "Rejected", value: counts.Rejected, cls: ""},
                    {label: "Suspended", value: counts.Suspended, cls: ""},
                ].map((k) => (
                    <div key={k.label} className={`lum-card p-4 sm:p-5 ${k.cls}`}>
                        <p className={`text-[22px] font-extrabold leading-none tracking-tight ${k.cls ? "text-amber-600" : "text-ink-900"}`}>{formatNumber(k.value)}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{k.label}</p>
                    </div>
                ))}
            </div>

            <div className="lum-card mt-6 p-4 sm:p-5">
                {/* Filter row */}
                <div className="flex flex-wrap items-center gap-3">
                    <SearchBar value={search} onChange={setSearch} placeholder="Search by seller, business, or email…"
                               className="w-full sm:max-w-xs"/>
                    <Select
                        name="sTab"
                        aria-label="Filter by approval status"
                        value={tab}
                        onChange={(e) => {
                            setTab(e.target.value);
                            setParams(e.target.value === "All" ? {} : {tab: e.target.value});
                        }}
                        className="h-12 w-auto px-3 min-w-36 text-sm"
                    >
                        {TABS.map((t) => (
                            <option key={t.key} value={t.key}>
                                {t.key === "All" ? "All statuses" : t.label}
                            </option>
                        ))}
                    </Select>
                    <span
                        className="ml-auto hidden items-center gap-1.5 text-xs font-semibold text-slate-400 md:inline-flex">
            <FaTriangleExclamation className="text-amber-500" size={11}/>
                        {counts.Pending} application{counts.Pending === 1 ? "" : "s"} waiting
          </span>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist"
                     aria-label="Seller approval groups">
                    {TABS.map((t) => {
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => {
                                    setTab(t.key);
                                    setParams(t.key === "All" ? {} : {tab: t.key});
                                }}
                                className={`relative flex items-center whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                                    isActive ? (t.key === "Pending" ? "text-amber-600" : "text-primary-700") : "text-slate-500 hover:text-ink-800"
                                }`}
                            >
                                {t.label}
                                <span
                                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        isActive ? (t.key === "Pending" ? "bg-amber-100 text-amber-700" : "bg-primary-100 text-primary-700") : "bg-slate-100 text-slate-500"
                                    }`}
                                >
                  {counts[t.key]}
                </span>
                                {isActive && <span
                                    className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full ${t.key === "Pending" ? "bg-amber-500" : "bg-primary-600"}`}/>}
                            </button>
                        );
                    })}
                </div>

                {rows.length === 0 ? (
                    <div className="py-10">
                        <EmptyState icon={<FaStore size={30}/>} title="No sellers here"
                                    message="Try another tab or clear the search."/>
                    </div>
                ) : (
                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                            <thead>
                            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-4 py-3">Seller Name</th>
                                <th className="px-4 py-3">Business Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Approval Status</th>
                                <th className="px-4 py-3">Account Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {rows.map((s) => (
                                <tr key={s.id}
                                    className={`transition-colors hover:bg-slate-50/70 ${s.approvalStatus === "Pending" ? "border-l-2 border-l-amber-400 bg-amber-50/30" : ""}`}>
                                    <td className="px-4 py-3.5">
                                        <button type="button" onClick={() => navigate(`/admin/sellers/${s.id}`)}
                                                className="flex items-center gap-3 text-left">
                        <span
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-700">
                          {s.avatar ? <img src={s.avatar} alt={s.name || s.storeName}
                                           className="h-full w-full rounded-full object-cover"/> : (s.name || s.storeName || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                                            <span
                                                className="font-bold text-ink-900 hover:text-primary-700">{s.name || s.ownerName || s.storeName}</span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="flex items-center gap-1.5 font-semibold text-ink-800">
                                            <FaStore className="text-slate-300"
                                                     size={10}/> {s.businessName || s.storeName}
                                        </p>
                                        <p className="text-xs text-slate-400">{s.city || "-"}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-500">{s.ownerEmail}</td>
                                    <td className="px-4 py-3.5">
                                        <SellerStatusBadge status={s.approvalStatus}/>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <Badge tone={s.accountStatus === "Active" ? "green" : "slate"} uppercase dot>
                                            {s.accountStatus || (s.approvalStatus === "Approved" ? "Active" : "Inactive")}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/admin/sellers/${s.id}`}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-700 hover:bg-slate-50"
                                            >
                                                View
                                            </Link>
                                            {s.approvalStatus === "Pending" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => act(s, "Approved", "Approve")}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                                                    >
                                                        <FaCheck size={9}/> Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReviewing({seller: s, initial: "reject"})}
                                                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-red-600 hover:bg-red-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {s.approvalStatus === "Suspended" && (
                                                <button
                                                    type="button"
                                                    onClick={() => act(s, "Approved", "Reinstate")}
                                                    className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    Reinstate
                                                </button>
                                            )}
                                            {s.approvalStatus === "Approved" && (
                                                <Dropdown
                                                    dropUp
                                                    trigger={(open) => (
                                                        <span aria-label="Seller actions"
                                                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-300 hover:bg-slate-50 ${open ? "bg-slate-100" : ""}`}><FaEllipsisVertical
                                                            size={14}/></span>
                                                    )}
                                                >
                                                    <DropdownItem icon={<FaEye size={12}/>}
                                                                  to={`/admin/sellers/${s.id}`}>
                                                        Open seller details
                                                    </DropdownItem>
                                                    <DropdownItem icon={<FaArrowUpRightFromSquare size={12}/>}
                                                                  to={`/store/${s.id}`}>
                                                        View public storefront
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        icon={<FaUserSlash size={12}/>}
                                                        danger
                                                        onClick={() =>
                                                            setConfirm({
                                                                seller: s,
                                                                status: "Suspended",
                                                                label: "Suspend",
                                                                message: "The store page goes offline and checkout blocks their products. Existing orders are still fulfilled.",
                                                            })
                                                        }
                                                    >
                                                        Suspend seller
                                                    </DropdownItem>
                                                </Dropdown>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Showing {rows.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {formatNumber(filtered.length)}
                        {tab !== "All" && ` ${tab.toLowerCase()}`}
                    </p>
                    <label
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Rows per page:
                        <Select name="sPerPage" aria-label="Rows per page" value={String(perPage)}
                                onChange={(e) => setPerPage(Number(e.target.value))} className="h-11 w-auto text-xs">
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <Pagination page={page} pages={pages} onChange={setPage} className="ml-auto"/>
                </div>
            </div>

            <SellerReviewModal
                open={Boolean(reviewing)}
                seller={reviewing?.seller}
                initialDecision={reviewing?.initial || "approve"}
                onClose={() => setReviewing(null)}
                onDecided={(status) => {
                    notify(`${reviewing?.seller?.storeName} application ${status.toLowerCase()}.`, status === "Approved" ? "success" : "info");
                    load();
                }}
            />

            <ConfirmDialog
                open={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => {
                    act(confirm.seller, confirm.status, confirm.label);
                    setConfirm(null);
                }}
                danger
                title={`Suspend ${confirm?.seller.storeName}?`}
                confirmLabel="Suspend"
                message={confirm?.message}
            />
        </div>
    );
}