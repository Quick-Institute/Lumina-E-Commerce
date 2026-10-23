import React, {useCallback, useEffect, useMemo, useState} from "react";
import {FaBan, FaBoxOpen, FaCircleCheck, FaTriangleExclamation,} from "react-icons/fa6";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import DataTable from "../../components/ui/DataTable";
import QuantityStepper from "../../components/ui/QuantityStepper";
import SearchBar from "../../components/ui/SearchBar";
import {Select} from "../../components/ui/Input";
import {PageSpinner} from "../../components/ui/Spinner";
import ProductImage from "../../components/product/ProductImage";
import {EmptyState} from "../../components/ui/States";
import {formatDate} from "../../utils/format";
import {getInventory, updateStock} from "../../services/productService";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";

export default function SellerInventory() {
    const {notify} = useToast();
    const {user} = useAuth();
    const sellerId = user?._id || user?.id;

    const [rows, setRows] = useState(null);
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("");

    const load = useCallback(() => getInventory().then(setRows), []);

    useEffect(() => {
        load();
    }, [load]);

    const mine = useMemo(
        () =>
            (rows || []).filter(
                (r) => r.product && (!sellerId || String(r.product.sellerId) === String(sellerId))
            ),
        [rows, sellerId]
    );

    const filtered = useMemo(() => {
        let list = mine;

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((r) =>
                r.product.name.toLowerCase().includes(q)
            );
        }

        if (level === "low") {
            list = list.filter(
                (r) =>
                    r.product.stock > 0 &&
                    r.product.stock <= (r.product.lowStockLevel ?? 5)
            );
        }

        if (level === "out") {
            list = list.filter((r) => r.product.stock === 0);
        }

        return list;
    }, [mine, search, level]);

    const setQty = async (r, next) => {
        await updateStock(r.productId, next);
        setRows((prev) =>
            prev.map((row) =>
                row.productId === r.productId
                    ? {
                        ...row,
                        quantity: next,
                        product: {...row.product, stock: next},
                    }
                    : row
            )
        );
        notify(`Stock set to ${next} for ${r.product.name}`);
    };

    if (!rows) {
        return <PageSpinner label="Reading your stock levels…"/>;
    }

    const lowCount = mine.filter(
        (r) =>
            r.product.stock > 0 &&
            r.product.stock <= (r.product.lowStockLevel ?? 5)
    ).length;

    const outCount = mine.filter((r) => r.product.stock === 0).length;

    const statusBadge = (r) => {
        if (r.product.stock === 0) {
            return (
                <Badge tone="red" uppercase>
                    Out of stock
                </Badge>
            );
        }

        if (r.product.stock <= (r.product.lowStockLevel ?? 5)) {
            return (
                <Badge tone="amber" uppercase>
                    Low stock
                </Badge>
            );
        }

        return (
            <Badge tone="green" uppercase>
                In stock
            </Badge>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    Inventory
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    Live stock levels. Orders automatically decrement availability
                    and lock overselling.
                </p>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-3 sm:gap-5">
                <StatCard
                    label="Total SKUs"
                    value={mine.length}
                    icon={<FaBoxOpen size={18}/>}
                    tone="teal"
                />
                <StatCard
                    label="Low stock"
                    value={lowCount}
                    icon={<FaTriangleExclamation size={18}/>}
                    tone="amber"
                    trendLabel="at or below alert level"
                />
                <StatCard
                    label="Out of stock"
                    value={outCount}
                    icon={<FaBan size={18}/>}
                    tone="red"
                    trendLabel="hidden from add-to-cart"
                />
            </div>

            <div className="lum-card mt-6 p-4 sm:p-5">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Search inventory…"
                        className="w-full sm:max-w-xs"
                    />

                    <Select
                        name="invLevel"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="h-12 w-full text-sm sm:w-auto sm:min-w-40"
                    >
                        <option value="">All stock levels</option>
                        <option value="low">Low stock only</option>
                        <option value="out">Out of stock only</option>
                    </Select>

                    {lowCount > 0 ? (
                        <span
                            className="inline-flex w-full items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200 sm:ml-auto sm:w-auto">
                            <FaTriangleExclamation size={11}/>
                            {lowCount} product{lowCount > 1 ? "s" : ""} need
                            restocking
                        </span>
                    ) : outCount === 0 ? (
                        <span
                            className="inline-flex w-full items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 sm:ml-auto sm:w-auto">
                            <FaCircleCheck size={11}/>
                            Everything is healthy
                        </span>
                    ) : null}
                </div>

                <div className="mt-4">
                    {filtered.length === 0 ? (
                        <EmptyState
                            title="Nothing here"
                            message={
                                search || level
                                    ? "No inventory matches this view."
                                    : "Add products to start tracking stock."
                            }
                        />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="space-y-3 md:hidden">
                                {filtered.map((r) => (
                                    <article
                                        key={r.productId}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ProductImage
                                                product={r.product}
                                                className="h-12 w-12 shrink-0 rounded-xl"
                                                iconSize={16}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-ink-900">
                                                            {r.product.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {r.product.category}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        {statusBadge(r)}
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Reserved
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-extrabold text-ink-900">
                                                            {r.reservedQuantity}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Alert
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-extrabold text-ink-900">
                                                            ≤ {r.lowStockLevel}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Updated
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] font-bold leading-tight text-ink-900">
                                                            {formatDate(r.lastUpdated)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Available stock
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <QuantityStepper
                                                    value={r.quantity}
                                                    min={0}
                                                    max={999}
                                                    onChange={(v) => setQty(r, v)}
                                                    size="sm"
                                                />
                                                <span className="text-xs text-slate-400">
                                                    units
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <div className="min-w-[760px]">
                                    <DataTable
                                        columns={[
                                            {
                                                key: "product",
                                                header: "Product",
                                                render: (r) => (
                                                    <div className="flex items-center gap-3">
                                                        <ProductImage
                                                            product={r.product}
                                                            className="h-10 w-10 shrink-0 rounded-lg"
                                                            iconSize={15}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-ink-900">
                                                                {r.product.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {r.product.category}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: "quantity",
                                                header: "Available",
                                                render: (r) => (
                                                    <div className="flex items-center gap-3">
                                                        <QuantityStepper
                                                            value={r.quantity}
                                                            min={0}
                                                            max={999}
                                                            onChange={(v) =>
                                                                setQty(r, v)
                                                            }
                                                            size="sm"
                                                        />
                                                        <span className="text-xs text-slate-400">
                                                            units
                                                        </span>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: "reserved",
                                                header: "Reserved",
                                                render: (r) => (
                                                    <span className="text-sm font-semibold text-slate-500">
                                                        {r.reservedQuantity}
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "lowStockLevel",
                                                header: "Alert level",
                                                render: (r) => (
                                                    <span className="text-sm text-slate-500">
                                                        ≤ {r.lowStockLevel}
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "status",
                                                header: "Status",
                                                render: (r) => statusBadge(r),
                                            },
                                            {
                                                key: "lastUpdated",
                                                header: "Updated",
                                                render: (r) => (
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(r.lastUpdated)}
                                                    </span>
                                                ),
                                            },
                                        ]}
                                        rows={filtered}
                                        dense
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}