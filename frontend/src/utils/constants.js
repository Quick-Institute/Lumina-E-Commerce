export const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
export const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded", "Cancelled"];
export const USER_STATUSES = ["Active", "Inactive", "Suspended"];
export const SELLER_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected", "Suspended"];
export const PRODUCT_STATUSES = ["Active", "Inactive", "Out of Stock", "Draft"];
export const PAYMENT_METHODS = ["Cash on Delivery"]; // v1 per project plan: COD only

export const DELIVERY_FEE = 450;
export const FREE_DELIVERY_THRESHOLD = 5000;

export const SORT_OPTIONS = [
    {value: "newest", label: "Newest First"},
    {value: "popular", label: "Most Popular (Best Selling)"},
    {value: "price-asc", label: "Price: Low to High"},
    {value: "price-desc", label: "Price: High to Low"},
    {value: "rating", label: "Top Rated"},
];

/* All 25 Sri Lankan districts (checkout address form). */
export const DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export const ORDER_STATUS_META = {
    Pending: {badge: "amber", color: "#f59e0b"},
    Processing: {badge: "blue", color: "#3b82f6"},
    Shipped: {badge: "purple", color: "#8b5cf6"},
    Delivered: {badge: "green", color: "#10b981"},
    Cancelled: {badge: "red", color: "#ef4444"},
};

export const PAYMENT_STATUS_META = {
    Pending: "amber",
    Paid: "green",
    Failed: "red",
    Refunded: "blue",
    Cancelled: "red",
};

export const USER_STATUS_META = {
    Active: "green",
    Inactive: "slate",
    Suspended: "red",
};

export const SELLER_STATUS_META = {
    Pending: "amber",
    Approved: "green",
    Rejected: "red",
    Suspended: "purple",
};

export const STOCK_META = {
    in: "green",
    low: "amber",
    out: "red",
};