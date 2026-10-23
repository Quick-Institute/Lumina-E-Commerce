import React, {useCallback, useEffect, useMemo, useState} from "react";
import useUrlPage from "../../hooks/useUrlPage";
import {Link, useNavigate} from "react-router-dom";
import {FaEye, FaPencil, FaPlus, FaPowerOff, FaTrash} from "react-icons/fa6";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import {Select} from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import {ProductStatusBadge} from "../../components/ui/Badge";
import {ConfirmDialog} from "../../components/ui/Modal";
import {EmptyState} from "../../components/ui/States";
import {PageSpinner} from "../../components/ui/Spinner";
import ProductImage from "../../components/product/ProductImage";
import {formatPrice} from "../../utils/format";
import {deleteProduct, getSellerProducts, toggleProductStatus} from "../../services/productService";
import {rankBySearch} from "../../utils/search";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";

const PER_PAGE = 8;

export default function SellerProducts() {
    const navigate = useNavigate();
    const {notify} = useToast();
    const {user} = useAuth();
    const sellerId = user?._id || user?.id;

    const [items, setItems] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useUrlPage();
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(
        () => getSellerProducts(sellerId).then(setItems),
        [sellerId]
    );

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        let list = items || [];
        if (search.trim()) list = rankBySearch(list, search.trim());
        if (status) list = list.filter((p) => p.status === status);
        return list;
    }, [items, search, status]);

    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
    );

    const doDelete = async () => {
        await deleteProduct(deleting.id);
        notify("Product deleted", "info");
        setDeleting(null);
        load();
    };

    const toggle = async (p) => {
        const nextStatus = p.status === "Active" ? "Inactive" : "Active";
        const updated = await toggleProductStatus(p.id, nextStatus);
        setItems((current) => (current || []).map(item => item.id === p.id ? {
            ...item, ...(updated || {}),
            status: updated?.status || nextStatus
        } : item));
        notify(nextStatus === "Inactive" ? "Product deactivated" : "Product activated", "info");
    };

    if (!items) {
        return <PageSpinner label="Loading your catalogue…"/>;
    }

    const ActionButtons = ({product, compact = false}) => (
        <div className={`flex ${compact ? "w-full justify-between gap-2" : "inline-flex gap-1.5"}`}>
            <button
                type="button"
                onClick={() => navigate(`/product/${product.id}`)}
                title="Preview"
                className={`rounded-lg border border-slate-200 text-slate-400 hover:border-primary-300 hover:text-primary-700 ${
                    compact ? "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold" : "p-2"
                }`}
            >
                <FaEye size={12}/>
                {compact && <span>View</span>}
            </button>
            <button
                type="button"
                onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                title="Edit"
                className={`rounded-lg border border-slate-200 text-slate-400 hover:border-primary-300 hover:text-primary-700 ${
                    compact ? "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold" : "p-2"
                }`}
            >
                <FaPencil size={12}/>
                {compact && <span>Edit</span>}
            </button>
            <button
                type="button"
                onClick={() => toggle(product)}
                title={product.status === "Active" ? "Deactivate" : "Activate"}
                className={`rounded-lg border border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600 ${
                    compact ? "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold" : "p-2"
                }`}
            >
                <FaPowerOff size={12}/>
                {compact && <span>{product.status === "Active" ? "Off" : "On"}</span>}
            </button>
            <button
                type="button"
                onClick={() => setDeleting(product)}
                title="Delete"
                className={`rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 ${
                    compact ? "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold" : "p-2"
                }`}
            >
                {compact ? (
                    <>
                        <FaTrash size={11}/>
                        <span>Delete</span>
                    </>
                ) : (
                    <span className="block text-xs font-bold">✕</span>
                )}
            </button>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                        My Products
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                        {items.length} listings · price, stock &amp; status updates
                        sync with the marketplace.
                    </p>
                </div>
                <Button
                    as={Link}
                    to="/seller/products/new"
                    icon={<FaPlus size={11}/>}
                    className="w-full shrink-0 sm:w-auto"
                >
                    Add Product
                </Button>
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
                        placeholder="Search my products…"
                        className="w-full sm:max-w-xs"
                    />
                    <Select
                        name="prodStatus"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="h-12 w-full text-sm sm:w-auto sm:min-w-36"
                    >
                        <option value="">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                    </Select>
                    {(search || status) && (
                        <button
                            type="button"
                            className="text-left text-xs font-bold text-slate-400 underline-offset-2 hover:text-primary-700 hover:underline sm:text-center"
                            onClick={() => {
                                setSearch("");
                                setStatus("");
                                setPage(1);
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="mt-4">
                    {filtered.length === 0 ? (
                        <EmptyState
                            title={
                                search || status
                                    ? "No products match your filters"
                                    : "No products yet"
                            }
                            message={
                                search || status
                                    ? "Try clearing the filters above."
                                    : "Add your first product and it will appear here instantly."
                            }
                            action={{
                                label: "Add product",
                                onClick: () => navigate("/seller/products/new"),
                            }}
                        />
                    ) : (
                        <>
                            {/* Mobile card list */}
                            <div className="space-y-3 md:hidden">
                                {visible.map((p) => (
                                    <article
                                        key={p.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ProductImage
                                                product={p}
                                                className="h-14 w-14 shrink-0 rounded-xl"
                                                iconSize={18}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-ink-900">
                                                            {p.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {p.category}
                                                        </p>
                                                    </div>
                                                    <ProductStatusBadge
                                                        status={p.status}
                                                        stock={p.stock}
                                                    />
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Price
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-extrabold text-ink-900">
                                                            {formatPrice(p.price, {
                                                                decimals: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Stock
                                                        </p>
                                                        <p
                                                            className={`mt-0.5 text-sm font-extrabold ${
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
                                                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Rating
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-extrabold text-ink-900">
                                                            {p.rating
                                                                ? `★ ${p.rating}`
                                                                : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 border-t border-slate-100 pt-3">
                                            <ActionButtons product={p} compact/>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <div className="min-w-[720px]">
                                    <DataTable
                                        columns={[
                                            {
                                                key: "product",
                                                header: "Product",
                                                render: (p) => (
                                                    <div className="flex items-center gap-3">
                                                        <ProductImage
                                                            product={p}
                                                            className="h-11 w-11 shrink-0 rounded-lg"
                                                            iconSize={16}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-ink-900">
                                                                {p.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {p.category}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: "price",
                                                header: "Price",
                                                render: (p) => (
                                                    <div>
                                                        <p className="font-bold text-ink-900">
                                                            {formatPrice(p.price, {
                                                                decimals: true,
                                                            })}
                                                        </p>
                                                        {p.oldPrice && (
                                                            <p className="text-xs text-slate-400 line-through">
                                                                {formatPrice(p.oldPrice)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: "stock",
                                                header: "Stock",
                                                render: (p) => (
                                                    <span
                                                        className={`font-bold ${
                                                            p.stock === 0
                                                                ? "text-red-500"
                                                                : p.stock <=
                                                                (p.lowStockLevel ?? 5)
                                                                    ? "text-amber-600"
                                                                    : "text-ink-900"
                                                        }`}
                                                    >
                                                        {p.stock} units
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: "rating",
                                                header: "Rating",
                                                render: (p) => (
                                                    <span className="text-sm font-semibold text-slate-500">
                                                        {p.rating
                                                            ? `★ ${p.rating} (${p.reviewCount})`
                                                            : "-"}
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
                                                thClassName: "text-right",
                                                className: "text-right",
                                                render: (p) => (
                                                    <ActionButtons product={p}/>
                                                ),
                                            },
                                        ]}
                                        rows={visible}
                                    />
                                </div>
                            </div>

                            {pages > 1 && (
                                <Pagination
                                    className="mt-5"
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
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={doDelete}
                title="Delete this product?"
                confirmLabel="Delete permanently"
                message={`"${deleting?.name}" will be removed from your catalogue and the storefront. Customers with it in their cart will see it as unavailable.`}
            />
        </div>
    );
}