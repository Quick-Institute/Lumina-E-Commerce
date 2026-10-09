import React, {useEffect, useMemo, useRef, useState} from "react";
import {Link, NavLink, Outlet, useLocation, useNavigate} from "react-router-dom";
import {
    FaArrowRightFromBracket,
    FaBars,
    FaBoxOpen,
    FaMagnifyingGlass,
    FaStore,
    FaTruckFast,
    FaUser,
    FaXmark,
} from "react-icons/fa6";

import {useAuth} from "../context/AuthContext";
import {useToast} from "../context/ToastContext";
import store from "../data/store";
import NotificationsBell from "../components/common/NotificationsBell";
import {formatPrice} from "../utils/format";

const TITLES = {
    admin: {
        label: "Admin Dashboard",
        tint: "bg-primary-100 text-primary-800"
    },

    seller: {
        label: "Seller Hub",
        tint: "bg-primary-100 text-primary-800"
    },

    customer: {
        label: "My Account",
        tint: "bg-primary-100 text-primary-800"
    },
};


/* ── Admin "Search everywhere" box ── */
function GlobalSearch() {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);

    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const onDown = (e) =>
            ref.current &&
            !ref.current.contains(e.target) &&
            setOpen(false);

        const onKey = (e) =>
            e.key === "Escape" && setOpen(false);

        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const groups = useMemo(() => {
        const term = q.trim().toLowerCase();

        if (term.length < 2) {
            return [];
        }

        const hit = (t) =>
            String(t || "")
                .toLowerCase()
                .includes(term);


        const users = store
            .getUsers()
            .filter(
                (u) =>
                    hit(u.name) ||
                    hit(u.email)
            )
            .slice(0, 3)
            .map((u) => ({
                key: `u-${u.id}`,
                icon: <FaUser size={10}/>,
                title: u.name,
                sub: u.email,
                to: `/admin/users/${u.id}`,
            }));


        const sellers = store
            .getSellers()
            .filter(
                (s) =>
                    hit(s.storeName) ||
                    hit(s.businessName) ||
                    hit(s.ownerEmail)
            )
            .slice(0, 3)
            .map((s) => ({
                key: `s-${s.id}`,
                icon: <FaStore size={10}/>,
                title: s.storeName,
                sub: `${s.approvalStatus} · ${s.ownerEmail}`,
                to: `/admin/sellers/${s.id}`,
            }));


        const orders = store
            .getAllOrders()
            .filter(
                (o) =>
                    hit(o.orderNumber) ||
                    hit(o.customerName)
            )
            .slice(0, 3)
            .map((o) => ({
                key: `o-${o.id}`,
                icon: <FaTruckFast size={10}/>,
                title: o.orderNumber,
                sub: `${o.customerName} · ${formatPrice(o.totalAmount)}`,
                to: `/admin/orders?q=${encodeURIComponent(
                    o.orderNumber
                )}`,
            }));


        const products = store
            .getProducts()
            .filter((p) => hit(p.name))
            .slice(0, 3)
            .map((p) => ({
                key: `p-${p.id}`,
                icon: <FaBoxOpen size={10}/>,
                title: p.name,
                sub: `Rs. ${p.price.toLocaleString(
                    "en-LK"
                )} · stock ${p.stock}`,
                to: `/admin/products?q=${encodeURIComponent(
                    p.name
                )}`,
            }));


        return [
            {
                label: "Customers & admins",
                rows: users
            },
            {
                label: "Sellers",
                rows: sellers
            },
            {
                label: "Orders",
                rows: orders
            },
            {
                label: "Products",
                rows: products
            },
        ].filter(
            (g) => g.rows.length
        );
    }, [q]);


    const go = (to) => {
        setOpen(false);
        setQ("");
        navigate(to);
    };


    return (
        <div
            className="relative w-full min-w-0"
            ref={ref}
        >
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();

                    if (q.trim()) {
                        navigate(
                            `/admin/users?q=${encodeURIComponent(
                                q.trim()
                            )}`
                        );
                    }

                    setOpen(false);
                }}
            >
                <label
                    htmlFor="admin-everywhere-search"
                    className="sr-only"
                >
                    Search everywhere
                </label>

                <div className="relative">
                    <FaMagnifyingGlass
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={12}
                    />

                    <input
                        id="admin-everywhere-search"
                        type="search"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() =>
                            setOpen(true)
                        }
                        placeholder="Search everywhere…"
                        autoComplete="off"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-ink-800 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </form>


            {open &&
                q.trim().length >= 2 && (
                    <div
                        className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lift"
                    >
                        {groups.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-slate-400">
                                No matches for “
                                {q.trim()}
                                ”.
                            </p>
                        ) : (
                            groups.map((g) => (
                                <div
                                    key={g.label}
                                    className="py-1"
                                >
                                    <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        {g.label}
                                    </p>

                                    {g.rows.map((r) => (
                                        <button
                                            key={r.key}
                                            type="button"
                                            onClick={() =>
                                                go(r.to)
                                            }
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                                        >
                                            <span
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
                                            >
                                                {r.icon}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-bold text-ink-900">
                                                    {r.title}
                                                </span>

                                                <span className="block truncate text-xs text-slate-400">
                                                    {r.sub}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}
        </div>
    );
}


export default function DashboardShell({
                                           role,
                                           navItems,
                                           footerExtra,
                                           footerNav = [],
                                           globalSearch = false,
                                           children,
                                       }) {
    const {user, logout} = useAuth();
    const {notify} = useToast();

    const location = useLocation();

    const [drawer, setDrawer] = useState(false);

    const meta =
        TITLES[role] ||
        TITLES.customer;


    /*
     * Avatar component
     *
     * Before Cloudinary upload:
     *     Shows user's first letter.
     *
     * After Cloudinary upload:
     *     Shows user.avatar URL.
     */
    const UserAvatar = ({
                            size = "default",
                            rounded = "rounded-full"
                        }) => {
        const sizeClass =
            size === "large"
                ? "h-16 w-16 text-xl"
                : size === "small"
                    ? "h-8 w-8 text-xs"
                    : "h-10 w-10 text-sm";

        return (
            <div
                className={`flex shrink-0 items-center justify-center overflow-hidden bg-primary-100 font-extrabold text-primary-700 ${rounded} ${sizeClass}`}
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    user?.avatarLetter ||
                    user?.name?.charAt(0)?.toUpperCase() ||
                    "U"
                )}
            </div>
        );
    };


    const NavBody = ({onNavigate}) => (
        <>
            {navItems.map((item) =>
                item.section ? (
                    <p
                        key={`sec-${item.section}`}
                        className="px-3.5 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 first:pt-1"
                    >
                        {item.section}
                    </p>
                ) : (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({isActive}) =>
                            `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-ink-800"
                            }`
                        }
                    >
                        {({isActive}) => (
                            <>
                                {isActive && (
                                    <span
                                        className="absolute inset-y-2 left-0 w-1 rounded-r bg-primary-600"
                                        aria-hidden="true"
                                    />
                                )}

                                <span
                                    className={
                                        isActive
                                            ? "text-primary-600"
                                            : "text-slate-400"
                                    }
                                >
                                    {item.icon}
                                </span>

                                <span className="min-w-0 truncate">
                                    {item.label}
                                </span>

                                {item.count !== undefined &&
                                    item.count > 0 && (
                                        <span
                                            className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                                item.countTone === "amber"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {item.count}
                                        </span>
                                    )}
                            </>
                        )}
                    </NavLink>
                )
            )}
        </>
    );


    const SidebarBody = (
        <>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-6">

                <Link
                    to="/"
                    className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary-700"
                >
                    Lumina
                </Link>

                <button
                    type="button"
                    onClick={() =>
                        setDrawer(false)
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
                    aria-label="Close sidebar"
                >
                    <FaXmark size={16}/>
                </button>

            </div>


            {/* Dashboard Role */}
            <span
                className={`mx-5 mb-2 inline-block w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.tint}`}
            >
                {meta.label}
            </span>


            {/* Customer Profile */}
            {role === "customer" &&
                user && (
                    <div
                        className="mx-3 mb-5 mt-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-card"
                    >

                        <div className="mx-auto flex items-center justify-center">

                            <UserAvatar
                                size="large"
                                rounded="rounded-full ring-4 ring-primary-50"
                            />

                        </div>

                        <p className="mt-3 truncate text-sm font-bold text-ink-900">
                            {user.name}
                        </p>

                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {user.memberTier ||
                                "Member"}
                        </p>

                    </div>
                )}


            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
                <NavBody
                    onNavigate={() =>
                        setDrawer(false)
                    }
                />
            </nav>


            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-4">

                {footerNav.map((f) => (
                    <Link
                        key={f.to}
                        to={f.to}
                        onClick={() =>
                            setDrawer(false)
                        }
                        className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-700"
                    >
                        {f.icon}
                        {f.label}
                    </Link>
                ))}


                {role !== "customer" && (
                    <Link
                        to="/"
                        className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-500 hover:text-primary-700"
                        onClick={() =>
                            setDrawer(false)
                        }
                    >
                        <FaStore size={13}/>
                        View storefront
                    </Link>
                )}


                <button
                    type="button"
                    onClick={() => {
                        logout();

                        notify(
                            "Signed out.",
                            "info"
                        );

                        window.location.href = "/";
                    }}
                    className="flex items-center gap-2.5 text-sm font-semibold text-red-500 hover:text-red-600"
                >
                    <FaArrowRightFromBracket
                        size={13}
                    />
                    Logout
                </button>


                {footerExtra}

            </div>
        </>
    );


    return (
        <div className="min-h-screen lg:flex">

            {/* Desktop sidebar */}
            <aside
                className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex"
            >
                {SidebarBody}
            </aside>


            {/* Mobile drawer */}
            {drawer && (
                <div
                    className="fixed inset-0 z-[70] lg:hidden"
                    role="dialog"
                    aria-modal="true"
                >

                    <div
                        className="absolute inset-0 bg-ink-900/50"
                        onClick={() =>
                            setDrawer(false)
                        }
                        aria-hidden="true"
                    />

                    <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-white shadow-2xl">
                        {SidebarBody}
                    </aside>

                </div>
            )}


            {/* Main Column */}
            <div className="flex min-h-screen min-w-0 flex-1 flex-col">

                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

                    {/* Top Row */}
                    <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">

                        {/* Mobile menu */}
                        <button
                            type="button"
                            className="shrink-0 rounded-lg p-2 text-ink-800 hover:bg-slate-100 lg:hidden"
                            onClick={() =>
                                setDrawer(true)
                            }
                            aria-label="Open sidebar"
                        >
                            <FaBars size={16}/>
                        </button>


                        {/* Mobile logo */}
                        <Link
                            to="/"
                            className="shrink-0 text-lg font-extrabold tracking-tight text-primary-700 lg:hidden"
                        >
                            Lumina
                        </Link>


                        {/* Desktop Search */}
                        {globalSearch && (
                            <div className="ml-4 hidden min-w-0 flex-1 lg:block lg:max-w-sm">
                                <GlobalSearch/>
                            </div>
                        )}


                        {/* Right side */}
                        <div className="ml-auto flex shrink-0 items-center gap-2">

                            <div className="relative shrink-0">
                                <NotificationsBell/>
                            </div>


                            {/* User */}
                            {user && (
                                <div
                                    className="flex max-w-[9.5rem] items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 sm:max-w-none sm:gap-2.5 sm:pr-3.5"
                                >

                                    <UserAvatar
                                        size="small"
                                        rounded="rounded-lg"
                                    />

                                    <span className="hidden min-w-0 text-left sm:block">

                                        <span
                                            className="block truncate text-sm font-semibold leading-tight text-ink-900"
                                        >
                                            {user.name}
                                        </span>

                                        <span
                                            className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                                        >
                                            {role === "admin"
                                                ? "Platform Manager"
                                                : role === "seller"
                                                    ? "Seller Account"
                                                    : "Member"}
                                        </span>

                                    </span>

                                </div>
                            )}

                        </div>

                    </div>


                    {/* Mobile Search */}
                    {globalSearch && (
                        <div className="border-t border-slate-100 px-3 py-2 sm:px-6 lg:hidden">
                            <GlobalSearch/>
                        </div>
                    )}

                </header>


                {/* Page content */}
                <main
                    className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
                    key={location.pathname}
                >
                    {children !== undefined
                        ? children
                        : <Outlet/>}
                </main>

            </div>

        </div>
    );
}