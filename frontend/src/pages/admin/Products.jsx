import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {FaEyeSlash, FaShieldVirus} from "react-icons/fa6";

import useUrlPage from "../../hooks/useUrlPage";
import SearchBar from "../../components/ui/SearchBar";
import {Select} from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import {ProductStatusBadge} from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import {ConfirmDialog} from "../../components/ui/Modal";
import {EmptyState} from "../../components/ui/States";
import {PageSpinner} from "../../components/ui/Spinner";
import ProductImage from "../../components/product/ProductImage";
import {formatPrice, formatDate} from "../../utils/format";
import {listProducts, toggleProductStatus} from "../../services/productService";
import {listSellers} from "../../services/accountService";
import {rankBySearch} from "../../utils/search";
import {useToast} from "../../context/ToastContext";

const PER_PAGE = 10;

export default function AdminProducts() {
    const {notify} = useToast();
    const [params] = useSearchParams();

    const [result, setResult] = useState(null);
    const [sellers, setSellers] = useState([]);
    const [search, setSearch] = useState(params.get("q") || "");
    const [sellerFilter, setSellerFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useUrlPage();
    const [flagging, setFlagging] = useState(null);

    const load = useCallback(
        () =>
            listProducts({includeAll: true, perPage: 999}).then((r) =>
                setResult(r.items)
            ),
        []
    );

    useEffect(() => {
        load();
        listSellers().then(setSellers);
    }, [load]);

    const rows = useMemo(() => {
        let list = result || [];
        if (search.trim()) list = rankBySearch(list, search.trim());
        if (sellerFilter) list = list.filter((p) => p.sellerId === sellerFilter);
        if (statusFilter === "low") {
            list = list.filter(
                (p) => p.stock > 0 && p.stock <= (p.lowStockLevel ?? 5)
            );
        } else if (statusFilter === "out") {
            list = list.filter((p) => p.stock === 0);
        } else if (statusFilter) {
            list = list.filter((p) => p.status === statusFilter);
        }
        return list;
    }, [result, search, sellerFilter, statusFilter]);

    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const currentPage = Math.min(page, pages);
    const visible = rows.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
    );

    const sellerName = (id) =>
        sellers.find((s) => s.id === id)?.storeName || "-";

    const clearFilters = () => {
        setSearch("");
        setSellerFilter("");
        setStatusFilter("");
        setPage(1);
    };

    const flag = async () => {
        await toggleProductStatus(flagging.id);
        notify(`${flagging.name} deactivated & flagged for seller`, "info");
        setFlagging(null);
        load();
    };

    if (!result) return <PageSpinner label="Loading catalogue…"/>;

    const ActionButton = ({product, fullWidth = false}) => (
        <button
            type="button"
            onClick={() => setFlagging(product)}
            disabled={product.status !== "Active"}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 ${
                fullWidth ? "w-full" : ""
            }`}
        >
            {product.status === "Active" ? (
                <>
                    <FaShieldVirus size={11}/> Deactivate
                </>
            ) : (
                <>
                    <FaEyeSlash size={11}/> Inactive
                </>
            )}
        </button>
    );

    return (
        <div className="w-full min-w-0">
            <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    Product Management
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    Monitor every listing across sellers. Deactivate inappropriate
                    or invalid products.
                </p>
            </div>

            <div className="lum-card mt-6 p-4 sm:mt-7 sm:p-5">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <SearchBar
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        placeholder="Search all products…"
                        className="w-full sm:max-w-xs"
                    />

                    <Select
                        name="pSeller"
                        value={sellerFilter}
                        onChange={(e) => {
                            setSellerFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-12 w-full text-sm sm:w-auto sm:min-w-44"
                    >
                        <option value="">All sellers</option>
                        {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.storeName}
                            </option>
                        ))}
                    </Select>

                    <Select
                        name="pStatus"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-12 w-full text-sm sm:w-auto sm:min-w-40"
                    >
                        <option value="">Any status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                        <option value="low">Low stock</option>
                        <option value="out">Out of stock</option>
                    </Select>

                    {(search || sellerFilter || statusFilter) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-left text-xs font-bold text-primary-600 hover:underline sm:text-center"
                        >
                            Clear filters
                        </button>
                    )}

                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 sm:ml-auto">
                        {rows.length} products
                    </span>
                </div>

                <div className="mt-4">
                    {visible.length === 0 ? (
                        <EmptyState
                            title="Nothing matches"
                            message="No product fits the current filters."
                            action={{
                                label: "Clear filters",
                                onClick: clearFilters,
                            }}
                        />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <ul className="space-y-3 md:hidden">
                                {visible.map((p) => (
                                    <li
                                        key={p.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ProductImage
                                                product={p}
                                                className="h-14 w-14 shrink-0 rounded-xl"
                                                iconSize={16}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    to={`/product/${p.id}`}
                                                    className="font-bold leading-snug text-ink-900 hover:text-primary-700 [overflow-wrap:anywhere]"
                                                >
                                                    {p.name}
                                                </Link>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {p.category} · listed{" "}
                                                    {formatDate(p.createdAt)}
                                                </p>
                                                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                    {sellerName(p.sellerId)}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                <ProductStatusBadge
                                                    status={p.status}
                                                    stock={p.stock}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    Price
                                                </p>
                                                <p className="text-sm font-extrabold text-ink-900">
                                                    {formatPrice(p.price, {
                                                        decimals: true,
                                                    })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    Stock
                                                </p>
                                                <p
                                                    className={`text-sm font-extrabold ${
                                                        p.stock === 0
                                                            ? "text-red-500"
                                                            : p.stock <=
                                                            (p.lowStockLevel ?? 5)
                                                                ? "text-amber-600"
                                                                : "text-ink-900"
                                                    }`}
                                                >
                                                    {p.stock}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <ActionButton product={p} fullWidth/>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <div className="min-w-[820px]">
                                    <DataTable
                                        columns={[
                                            {
                                                key: "product",
                                                header: "Product",
                                                render: (p) => (
                                                    <div className="flex items-center gap-3">
                                                        <ProductImage
                                                            product={p}
                                                            className="h-10 w-10 shrink-0 rounded-lg"
                                                            iconSize={15}
                                                        />
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/product/${p.id}`}
                                                                className="block truncate font-bold text-ink-900 hover:text-primary-700"
                                                            >
                                                                {p.name}
                                                            </Link>
                                                            <p className="text-xs text-slate-400">
                                                                {p.category} · listed{" "}
                                                                {formatDate(
                                                                    p.createdAt
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: "seller",
                                                header: "Seller",
                                                render: (p) => (
                                                    <span className="text-sm font-semibold text-slate-600">
                                                        {sellerName(p.sellerId)}
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "price",
                                                header: "Price",
                                                render: (p) => (
                                                    <span className="font-bold">
                                                        {formatPrice(p.price, {
                                                            decimals: true,
                                                        })}
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "stock",
                                                header: "Stock",
                                                render: (p) => (
                                                    <span
                                                        className={
                                                            p.stock === 0
                                                                ? "font-bold text-red-500"
                                                                : p.stock <=
                                                                (p.lowStockLevel ??
                                                                    5)
                                                                    ? "font-bold text-amber-600"
                                                                    : ""
                                                        }
                                                    >
                                                        {p.stock}
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "status",
                                                header: "Status",
                                                render: (p) => (
                                                    <ProductStatusBadge
                                                        status={p.status}
                                                        stock={p.stock}
                                                    />
                                                ),
                                            },
                                            {
                                                key: "actions",
                                                header: "Actions",
                                                className: "text-right",
                                                render: (p) => (
                                                    <ActionButton product={p}/>
                                                ),
                                            },
                                        ]}
                                        rows={visible}
                                        dense
                                    />
                                </div>
                            </div>

                            {pages > 1 && (
                                <Pagination
                                    className="mt-4"
                                    page={currentPage}
                                    pages={pages}
                                    onChange={(p) => {
                                        setPage(p);
                                        window.scrollTo({
                                            top: 0,
                                            behavior: "smooth",
                                        });
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(flagging)}
                onClose={() => setFlagging(null)}
                onConfirm={flag}
                title="Deactivate this listing?"
                confirmLabel="Deactivate & flag"
                message={`"${flagging?.name}" will be hidden from shoppers and the seller notified. Use this for inappropriate, duplicate or invalid products.`}
            />
        </div>
    );
}