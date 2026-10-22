import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import useUrlPage from "../../hooks/useUrlPage";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {FaCheck, FaDownload, FaEye, FaUserPlus, FaUsers, FaUserSlash} from "react-icons/fa6";
import SearchBar from "../../components/ui/SearchBar";
import {Select} from "../../components/ui/Input";
import Badge, {UserStatusBadge} from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import {ConfirmDialog} from "../../components/ui/Modal";
import {EmptyState} from "../../components/ui/States";
import {PageSpinner} from "../../components/ui/Spinner";
import {formatDate, formatNumber} from "../../utils/format";
import {listUsers, setUserStatus} from "../../services/accountService";
import {useToast} from "../../context/ToastContext";

const ROLE_TONES = {Administrator: "purple", Seller: "indigo", Customer: "teal"};
const REG_RANGES = [
    {value: "", label: "Any time"},
    {value: "30", label: "Last 30 days"},
    {value: "90", label: "Last 90 days"},
    {value: "365", label: "This year"},
];

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function AdminUsers() {
    const {notify} = useToast();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [users, setUsers] = useState(null);
    const [search, setSearch] = useState(params.get("q") || "");
    const [tab, setTab] = useState(params.get("role") || "All");
    const [status, setStatus] = useState("");
    const [reg, setReg] = useState("");
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useUrlPage();
    const [perPage, setPerPage] = useState(10);
    const [confirmAction, setConfirmAction] = useState(null); // {users:[], status, label}

    const load = useCallback(() => listUsers().then(setUsers), []);
    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const list = users || [];
        return {
            total: list.length,
            active: list.filter((u) => u.status === "Active").length,
            inactive: list.filter((u) => u.status !== "Active").length,
            newMonth: list.filter((u) => u.joinedAt >= daysAgo(30)).length,
            customers: list.filter((u) => u.role === "Customer").length,
            sellers: list.filter((u) => u.role === "Seller").length,
            admins: list.filter((u) => u.role === "Administrator").length,
        };
    }, [users]);

    const filtered = useMemo(() => {
        let list = users || [];
        if (tab !== "All") list = list.filter((u) => u.role === tab);
        if (status) list = list.filter((u) => (status === "Active" ? u.status === "Active" : u.status !== "Active"));
        if (reg) list = list.filter((u) => u.joinedAt >= daysAgo(Number(reg)));
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        return list;
    }, [users, tab, status, reg, search]);

    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, status, reg, search, perPage]);

    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, pages);
    const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));

    const toggle = (id) => setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
    const togglePage = () =>
        setSelected((sel) => (allOnPage ? sel.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...sel, ...rows.map((r) => r.id)])]));

    const applyStatus = async () => {
        const {targets, status: next} = confirmAction;
        for (const u of targets) await setUserStatus(u.id, next);
        notify(
            targets.length === 1 ? `${targets[0].name} marked ${next}.` : `${targets.length} accounts marked ${next}.`,
            next === "Active" ? "success" : "info"
        );
        setConfirmAction(null);
        setSelected([]);
        load();
    };

    if (!users) return <PageSpinner label="Loading directory…"/>;

    const activeFilters = [tab !== "All", Boolean(status), Boolean(reg), Boolean(search.trim())].filter(Boolean).length;

    const UserActions = ({u}) => (
        <div className="flex items-center justify-end gap-2">
            <Link
                to={`/admin/users/${u.id}`}
                aria-label={`View ${u.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-primary-600"
            >
                <FaEye size={12}/>
            </Link>
            {u.status === "Active" ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="!border-red-200 !text-red-600 hover:!bg-red-50"
                    onClick={() => setConfirmAction({
                        targets: [u],
                        status: "Inactive",
                        label: "Deactivate"
                    })}
                >
                    Deactivate
                </Button>
            ) : u.status === "Inactive" ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="!border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                    onClick={() => setConfirmAction({
                        targets: [u],
                        status: "Active",
                        label: "Activate"
                    })}
                >
                    Activate
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="!border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                    onClick={() => setConfirmAction({
                        targets: [u],
                        status: "Active",
                        label: "Reactivate"
                    })}
                >
                    Reactivate
                </Button>
            )}
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">User Management</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Manage all customer, seller, and admin accounts</p>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto"
                    icon={<FaDownload size={11}/>}
                    onClick={() => {
                        const headers = ["id", "name", "email", "role", "status"];
                        const csv = [headers.join(","), ...users.map(u => headers.map(h => JSON.stringify(u[h] ?? "")).join(","))].join("\n");
                        const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "lumina-users.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    Export
                </Button>
            </div>

            {/* KPI cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        icon: <FaUsers size={15}/>,
                        tone: "bg-blue-50 text-blue-600",
                        label: "Total Users",
                        value: formatNumber(counts.total)
                    },
                    {
                        icon: <FaCheck size={15}/>,
                        tone: "bg-emerald-50 text-emerald-600",
                        label: "Active",
                        value: formatNumber(counts.active)
                    },
                    {
                        icon: <FaUserSlash size={15}/>,
                        tone: "bg-slate-100 text-slate-500",
                        label: "Inactive",
                        value: formatNumber(counts.inactive)
                    },
                    {
                        icon: <FaUserPlus size={15}/>,
                        tone: "bg-purple-50 text-purple-600",
                        label: "New (30 days)",
                        value: formatNumber(counts.newMonth)
                    },
                ].map((k) => (
                    <div key={k.label} className="lum-card flex items-center gap-4 p-4 sm:p-5">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.tone}`}>
                            {k.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xl font-extrabold tracking-tight text-ink-900">{k.value}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Table section */}
            <div className="lum-card mt-6 p-4 sm:p-5">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Search by name or email…"
                        className="w-full sm:max-w-xs"
                    />
                    <Select
                        name="uRole"
                        aria-label="Filter by role"
                        value={tab}
                        onChange={(e) => setTab(e.target.value)}
                        className="h-12 w-full px-4 text-sm sm:w-auto sm:min-w-36"
                    >
                        <option value="All">Role: All</option>
                        <option value="Customer">Customers</option>
                        <option value="Seller">Sellers</option>
                        <option value="Administrator">Administrators</option>
                    </Select>
                    <Select
                        name="uStatus"
                        aria-label="Filter by status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-12 w-full px-4 text-sm sm:w-auto sm:min-w-36"
                    >
                        <option value="">Status: All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive & suspended</option>
                    </Select>
                    <Select
                        name="uReg"
                        aria-label="Filter by registration date"
                        value={reg}
                        onChange={(e) => setReg(e.target.value)}
                        className="h-12 w-full px-4 text-sm sm:w-auto sm:min-w-44"
                    >
                        {REG_RANGES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label === "Any time" ? "Reg. Date" : r.label}
                            </option>
                        ))}
                    </Select>

                    {activeFilters > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setTab("All");
                                setStatus("");
                                setReg("");
                                setSearch("");
                            }}
                            className="text-left text-xs font-bold text-primary-600 hover:underline sm:text-center"
                        >
                            Clear filters ({activeFilters})
                        </button>
                    )}
                </div>

                {/* Role tabs */}
                <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist"
                     aria-label="User groups">
                    {[
                        {key: "All", label: "All Users", count: counts.total},
                        {key: "Customer", label: "Customers", count: counts.customers},
                        {key: "Seller", label: "Sellers", count: counts.sellers},
                        {key: "Administrator", label: "Administrators", count: counts.admins},
                    ].map((t) => {
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setTab(t.key)}
                                className={`relative flex items-center whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                                    isActive ? "text-primary-700" : "text-slate-500 hover:text-ink-800"
                                }`}
                            >
                                {t.label}
                                <span
                                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"}`}>
                                    {t.count}
                                </span>
                                {isActive &&
                                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"/>}
                            </button>
                        );
                    })}
                </div>

                {/* Bulk actions bar */}
                {selected.length > 0 && (
                    <div
                        className="mt-4 flex flex-col gap-3 rounded-xl bg-primary-50 px-4 py-3 text-sm ring-1 ring-primary-200 sm:flex-row sm:items-center">
                        <span className="font-bold text-primary-800">{selected.length} selected</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmAction({
                                    targets: users.filter((u) => selected.includes(u.id)),
                                    status: "Inactive",
                                    label: "Deactivate"
                                })}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                                Deactivate
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmAction({
                                    targets: users.filter((u) => selected.includes(u.id)),
                                    status: "Active",
                                    label: "Activate"
                                })}
                                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                            >
                                Activate
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelected([])}
                            className="text-left text-xs font-bold text-slate-500 hover:text-ink-800 sm:ml-auto"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div className="py-10">
                        <EmptyState icon={<FaUsers size={30}/>} title="No accounts match"
                                    message="Adjust the filters to find people."/>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards (Visible below md) */}
                        <div className="mt-4 space-y-3 md:hidden">
                            {rows.map((u) => (
                                <article key={u.id}
                                         className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select ${u.name}`}
                                            checked={selected.includes(u.id)}
                                            onChange={() => toggle(u.id)}
                                            className="mt-1 h-4 w-4 shrink-0 accent-teal-600"
                                        />
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-700">
                                            {u.avatar ? <img src={u.avatar} alt={u.name || "User"}
                                                             className="h-full w-full rounded-full object-cover"/> : (u.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-ink-900">{u.name}</p>
                                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge tone={ROLE_TONES[u.role] || "slate"} uppercase>
                                                    {u.role}
                                                </Badge>
                                                <UserStatusBadge status={u.status}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Reg: {formatDate(u.joinedAt)}
                                        </span>
                                        <UserActions u={u}/>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Desktop Table (Visible md and up) */}
                        <div className="mt-2 hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[860px] border-collapse text-left">
                                <thead>
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="w-12 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all on this page"
                                            checked={allOnPage}
                                            onChange={togglePage}
                                            className="h-4 w-4 accent-teal-600"
                                        />
                                    </th>
                                    <th className="px-4 py-3">User Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Registration Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {rows.map((u) => (
                                    <tr key={u.id} className="text-sm transition-colors hover:bg-slate-50/70">
                                        <td className="px-4 py-3.5">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${u.name}`}
                                                checked={selected.includes(u.id)}
                                                onChange={() => toggle(u.id)}
                                                className="h-4 w-4 accent-teal-600"
                                            />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/users/${u.id}`)}
                                                className="flex items-center gap-3 text-left"
                                            >
                                                    <span
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-700">
                                                        {u.avatar ? <img src={u.avatar} alt={u.name || "User"}
                                                                         className="h-full w-full rounded-full object-cover"/> : (u.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                                    </span>
                                                <span
                                                    className="truncate font-bold text-ink-900 hover:text-primary-700">
                                                        {u.name}
                                                    </span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500">{u.email}</td>
                                        <td className="px-4 py-3.5">
                                            <Badge tone={ROLE_TONES[u.role] || "slate"} uppercase>
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <UserStatusBadge status={u.status}/>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-semibold text-ink-800">{formatDate(u.joinedAt)}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <UserActions u={u}/>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Pagination & Footer */}
                <div
                    className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div
                        className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between sm:justify-start">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {formatNumber(filtered.length)}
                        </p>
                        <label
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Rows per page:
                            <Select
                                name="perPage"
                                aria-label="Rows per page"
                                value={String(perPage)}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="h-10 w-auto text-xs"
                            >
                                {[10, 25, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </Select>
                        </label>
                    </div>

                    <Pagination
                        page={currentPage}
                        pages={pages}
                        onChange={(p) => {
                            setPage(p);
                            window.scrollTo({top: 0, behavior: "smooth"});
                        }}
                        className="w-full justify-center sm:w-auto"
                    />
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(confirmAction)}
                onClose={() => setConfirmAction(null)}
                onConfirm={applyStatus}
                danger={confirmAction?.status !== "Active"}
                title={confirmAction?.label === "Activate" || confirmAction?.label === "Reactivate" ? "Reactivate these accounts?" : "Deactivate these accounts?"}
                confirmLabel={confirmAction?.status === "Active" ? "Activate" : "Deactivate"}
                message={
                    confirmAction?.status === "Active"
                        ? `${confirmAction?.targets.length === 1 ? confirmAction?.targets[0].name : `${confirmAction?.targets.length} users`} will be able to sign in again immediately.`
                        : `${confirmAction?.targets.length === 1 ? confirmAction?.targets[0].name : `${confirmAction?.targets.length} users`} will be blocked from new logins. Their order history stays intact.`
                }
            />
        </div>
    );
}