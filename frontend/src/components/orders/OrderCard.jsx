import React from "react";
import {Link} from "react-router-dom";
import {FaMoneyBill1Wave, FaRotate} from "react-icons/fa6";
import {OrderStatusBadge} from "../ui/Badge";
import Button from "../ui/Button";
import ProductImage from "../product/ProductImage";
import {formatDate, formatPrice} from "../../utils/format";

export default function OrderCard({
                                      order,
                                      onTrack,
                                      onReorder,
                                      onCancel,
                                      onDetails,
                                  }) {
    const canTrack = [
        "Pending",
        "Processing",
        "Shipped",
    ].includes(order.status) || order.status === "Cancelled";

    const canCancel = ["Pending", "Processing"].includes(order.status);
    const canReorder = order.status !== "Cancelled";

    const items = order.items || [];
    const visible = items.slice(0, 2);
    const extra = Math.max(0, items.length - visible.length);

    // Support both the old frontend structure and the backend schema.
    const orderId = order._id || order.id;
    const orderNumber = order.orderNumber || orderId;
    const placedAt = order.placedAt || order.createdAt;

    const paymentMethod =
        order.paymentMethod ||
        order.payment?.method ||
        "COD";

    const itemCount = items.reduce(
        (sum, item) => sum + Number(item.qty ?? item.quantity ?? 0),
        0
    );

    return (
        <article className="lum-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-extrabold tracking-tight text-ink-800">
                        <button
                            type="button"
                            onClick={() => onDetails?.(order)}
                            className="hover:text-primary-700"
                        >
                            # {orderNumber}
                        </button>
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Placed on {placedAt ? formatDate(placedAt) : "—"}
                    </p>
                </div>

                <OrderStatusBadge status={order.status}/>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {visible.map((item, idx) => (
                            <span
                                key={`${item.productId || item._id || item.name}-${idx}`}
                                className="h-11 w-11 overflow-hidden rounded-lg bg-white ring-2 ring-white"
                            >
                                <ProductImage
                                    product={{
                                        ...item,
                                        _id: item.productId || item._id,
                                    }}
                                    className="h-full w-full"
                                    iconSize={16}
                                />
                            </span>
                        ))}

                        {extra > 0 && (
                            <span
                                className="flex h-11 items-center justify-center rounded-lg bg-primary-50 px-2.5 text-xs font-bold text-primary-700 ring-2 ring-white">
                                +{extra}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-slate-500">
                        <span className="font-semibold text-ink-800">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>

                        <span className="mx-2 text-slate-200">|</span>

                        Total:{" "}
                        <span className="font-extrabold text-primary-700">
                            {formatPrice(order.totalAmount ?? 0, {
                                decimals: true,
                            })}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button size="sm" onClick={() => onDetails?.(order)}>
                        View Details
                    </Button>

                    {canTrack && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onTrack?.(order)}
                        >
                            Track Order
                        </Button>
                    )}

                    {canReorder && !canCancel && (
                        <Button
                            size="sm"
                            variant="secondary"
                            icon={<FaRotate size={10}/>}
                            onClick={() => onReorder?.(order)}
                        >
                            Reorder
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <FaMoneyBill1Wave
                        size={12}
                        className="text-emerald-500"
                    />
                    {paymentMethod}
                </p>

                {canCancel && (
                    <button
                        type="button"
                        onClick={() => onCancel?.(order)}
                        className="text-xs font-bold uppercase tracking-wide text-red-500 transition-colors hover:text-red-600"
                    >
                        Cancel Order
                    </button>
                )}

                {order.status === "Delivered" && orderId && (
                    <Link
                        to={`/account/orders/${orderId}`}
                        className="text-xs font-bold text-primary-600 hover:underline"
                    >
                        Write a review →
                    </Link>
                )}
            </div>
        </article>
    );
}