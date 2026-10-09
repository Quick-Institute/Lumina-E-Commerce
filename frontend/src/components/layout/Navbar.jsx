import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {
    FaBars,
    FaCartShopping,
    FaChevronDown,
    FaChevronRight,
    FaGripLines,
    FaReceipt,
    FaStore,
    FaUser,
    FaUserPlus,
    FaUserShield,
    FaXmark,
} from "react-icons/fa6";
import Dropdown, {DropdownDivider, DropdownItem} from "../ui/Dropdown";
import {dashboardPathByRole, useAuth} from "../../context/AuthContext";
import {useCart} from "../../context/CartContext";
import NotificationsBell from "../common/NotificationsBell";
import {useToast} from "../../context/ToastContext";
import CategoryIcon from "../ui/CategoryIcon";

const NAV_CATEGORIES = [
    {name: "Electronics", iconKey: "laptop"},
    {name: "Fashion", iconKey: "shirt"},
    {name: "Home", iconKey: "couch"},
    {name: "Beauty", iconKey: "beauty"},
    {name: "Toys", iconKey: "toys"},
    {name: "Groceries", iconKey: "grocery"},
];

const SEARCH_ICON = (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.41l3.07 3.08-1.41 1.41-3.08-3.07A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
        />
    </svg>
);

export default function Navbar() {
    const {user, isAuthenticated, logout} = useAuth();
    const cart = useCart();
    const {notify} = useToast();
    const navigate = useNavigate();

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [q, setQ] = useState("");

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);

        window.addEventListener("scroll", onScroll);

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const closeMenu = () => setMobileOpen(false);

    const submitSearch = (e) => {
        e.preventDefault();

        navigate(`/shop?search=${encodeURIComponent(q.trim())}`);

        closeMenu();
    };

    const handleLogout = () => {
        logout();
        notify("Signed out - see you soon!", "info");
        navigate("/");
        closeMenu();
    };

    return (
        <header
            className={`sticky top-0 z-50 border-b bg-white transition-shadow ${
                scrolled ? "shadow-sm" : "border-slate-200"
            }`}
        >
            {/* Top bar */}
            <div className="lum-container flex h-16 items-center gap-3 lg:h-[68px]">

                {/* Logo */}
                <Link
                    to="/"
                    className="shrink-0 text-2xl font-extrabold tracking-tight text-primary-700"
                >
                    Lumina
                </Link>

                {/* Search */}
                <form
                    onSubmit={submitSearch}
                    className="relative mx-1 min-w-0 flex-1 lg:mx-8 lg:max-w-xl"
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search for Products..."
                        aria-label="Search products"
                        className="lum-input h-10 w-full rounded-full pl-4 pr-11 text-sm lg:h-11"
                    />

                    <button
                        type="submit"
                        aria-label="Search"
                        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary-700"
                    >
                        {SEARCH_ICON}
                    </button>
                </form>

                {/* Desktop actions */}
                <div className="ml-auto hidden items-center gap-1 lg:flex xl:gap-2">

                    {isAuthenticated && <NotificationsBell/>}

                    {/* Categories */}
                    <Dropdown
                        width="w-60"
                        align="left"
                        trigger={(open) => (
                            <span
                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-slate-100"
                            >
                                <FaGripLines
                                    size={14}
                                    className="text-slate-400"
                                />

                                Categories

                                <FaChevronDown
                                    size={9}
                                    className={`text-slate-400 transition-transform ${
                                        open ? "rotate-180" : ""
                                    }`}
                                />
                            </span>
                        )}
                    >
                        {NAV_CATEGORIES.map((c) => (
                            <DropdownItem
                                key={c.name}
                                to={`/shop?category=${c.name}`}
                                icon={
                                    <CategoryIcon
                                        iconKey={c.iconKey}
                                        size={14}
                                        className="text-primary-600"
                                    />
                                }
                            >
                                {c.name}
                            </DropdownItem>
                        ))}

                        <DropdownDivider/>

                        <DropdownItem
                            to="/shop"
                            icon={
                                <span className="text-primary-600">
                                    <FaStore size={13}/>
                                </span>
                            }
                        >
                            View all products
                        </DropdownItem>
                    </Dropdown>

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-slate-100"
                        aria-label="Cart"
                    >
                        <FaCartShopping
                            size={16}
                            className="text-slate-400"
                        />

                        <span className="hidden xl:inline">
                            Cart
                        </span>

                        {cart.count > 0 && (
                            <span
                                className="absolute -right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white"
                            >
                                {cart.count}
                            </span>
                        )}
                    </Link>

                    {/* Account */}
                    {isAuthenticated ? (
                        <Dropdown
                            trigger={(open) => (
                                <span
                                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-800 hover:bg-slate-100"
                                >
                                    {/* Cloudinary Avatar */}
                                    <span
                                        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-bold text-primary-700 ring-2 ring-primary-200"
                                    >
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name || "User"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            user.avatarLetter ||
                                            user.name?.charAt(0)?.toUpperCase() ||
                                            "U"
                                        )}
                                    </span>

                                    <span className="hidden max-w-28 truncate 2xl:inline">
                                        {user.name}
                                    </span>

                                    <FaChevronDown
                                        size={9}
                                        className={`text-slate-400 transition-transform ${
                                            open ? "rotate-180" : ""
                                        }`}
                                    />
                                </span>
                            )}
                        >
                            <div className="px-4 pb-1.5 pt-1">
                                <p className="truncate text-sm font-bold text-ink-900">
                                    {user.name}
                                </p>

                                <p className="truncate text-xs text-slate-400">
                                    {user.email}
                                </p>
                            </div>

                            <DropdownDivider/>

                            {user.role !== "Customer" ? (
                                <DropdownItem
                                    to={dashboardPathByRole[user.role]}
                                    icon={
                                        <FaUserShield
                                            size={12}
                                            className="text-primary-600"
                                        />
                                    }
                                >
                                    {user.role === "Administrator"
                                        ? "Admin Dashboard"
                                        : "Seller Dashboard"}
                                </DropdownItem>
                            ) : (
                                <DropdownItem
                                    to="/account"
                                    icon={
                                        <FaUser
                                            size={12}
                                            className="text-primary-600"
                                        />
                                    }
                                >
                                    My Account
                                </DropdownItem>
                            )}

                            <DropdownItem
                                to="/account/orders"
                                icon={
                                    <FaReceipt
                                        size={12}
                                        className="text-slate-400"
                                    />
                                }
                            >
                                My Orders
                            </DropdownItem>

                            <DropdownDivider/>

                            <DropdownItem
                                onClick={handleLogout}
                                danger
                                icon={<FaXmark size={12}/>}
                            >
                                Sign out
                            </DropdownItem>
                        </Dropdown>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-slate-100"
                        >
                            <FaUser
                                size={15}
                                className="text-slate-400"
                            />

                            <span className="hidden xl:inline">
                                Account
                            </span>
                        </Link>
                    )}
                </div>

                {/* Mobile notification */}
                {isAuthenticated && (
                    <div className="lg:hidden">
                        <NotificationsBell/>
                    </div>
                )}

                {/* Mobile menu button */}
                <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Menu"
                    aria-expanded={mobileOpen}
                    className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-800 hover:bg-slate-100 lg:hidden"
                >
                    {mobileOpen ? (
                        <FaXmark size={18}/>
                    ) : (
                        <FaBars size={18}/>
                    )}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden">

                    {/* Cart */}
                    <Link
                        to="/cart"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-sm font-bold text-ink-800"
                    >
                        <FaCartShopping
                            size={16}
                            className="text-primary-600"
                        />

                        Cart

                        {cart.count > 0 ? (
                            <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {cart.count}{" "}
                                {cart.count === 1 ? "item" : "items"}
                            </span>
                        ) : (
                            <span className="ml-auto text-xs font-semibold text-slate-400">
                                Empty
                            </span>
                        )}
                    </Link>

                    {/* Categories */}
                    <p className="px-1 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Shop by category
                    </p>

                    <nav
                        aria-label="Categories"
                        className="-mx-1"
                    >
                        {NAV_CATEGORIES.map((c) => (
                            <Link
                                key={c.name}
                                to={`/shop?category=${c.name}`}
                                onClick={closeMenu}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-semibold text-ink-800 hover:bg-slate-50"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                    <CategoryIcon
                                        iconKey={c.iconKey}
                                        size={14}
                                    />
                                </span>

                                {c.name}

                                <FaChevronRight
                                    size={10}
                                    className="ml-auto text-slate-300"
                                />
                            </Link>
                        ))}

                        <Link
                            to="/shop"
                            onClick={closeMenu}
                            className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                                <FaStore size={13}/>
                            </span>

                            View all products

                            <FaChevronRight
                                size={10}
                                className="ml-auto text-primary-300"
                            />
                        </Link>
                    </nav>

                    {/* Account section */}
                    <div className="mt-4 border-t border-slate-100 pt-4">

                        {isAuthenticated ? (
                            <>
                                {/* User information */}
                                <div className="flex items-center gap-3 px-2">

                                    {/* Cloudinary Avatar */}
                                    <span
                                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700 ring-2 ring-primary-200"
                                    >
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name || "User"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            user.avatarLetter ||
                                            user.name?.charAt(0)?.toUpperCase() ||
                                            "U"
                                        )}
                                    </span>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-ink-900">
                                            {user.name}
                                        </p>

                                        <p className="truncate text-xs text-slate-400">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Account links */}
                                <div className="mt-3 grid gap-1.5">

                                    <Link
                                        to={
                                            user.role !== "Customer"
                                                ? dashboardPathByRole[user.role]
                                                : "/account"
                                        }
                                        onClick={closeMenu}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-bold text-ink-800"
                                    >
                                        {user.role === "Administrator"
                                            ? "Admin Dashboard"
                                            : user.role === "Seller"
                                                ? "Seller Dashboard"
                                                : "My Account"}

                                        <FaChevronRight
                                            size={11}
                                            className="text-slate-400"
                                        />
                                    </Link>

                                    {user.role === "Customer" && (
                                        <Link
                                            to="/account/orders"
                                            onClick={closeMenu}
                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-bold text-ink-800"
                                        >
                                            My Orders

                                            <FaChevronRight
                                                size={11}
                                                className="text-slate-400"
                                            />
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm font-bold text-red-600"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="px-1 pb-2 text-sm font-bold text-ink-900">
                                    Your account
                                </p>

                                <div className="grid grid-cols-2 gap-2">

                                    <Link
                                        to="/login"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white"
                                    >
                                        <FaUser size={12}/>
                                        Sign in
                                    </Link>

                                    <Link
                                        to="/register"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-bold text-ink-800"
                                    >
                                        <FaUserPlus size={12}/>
                                        Register
                                    </Link>
                                </div>

                                <Link
                                    to="/become-seller"
                                    onClick={closeMenu}
                                    className="mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide text-primary-700 hover:underline"
                                >
                                    <FaStore size={11}/>
                                    Sell on Lumina
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}