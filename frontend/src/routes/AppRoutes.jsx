import React from "react";
import {Routes, Route, Navigate} from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import ProtectedRoute from "./ProtectedRoute";
import SellerLayout from "../layouts/SellerLayout";
import NotFoundLayout from "../layouts/NotFoundLayout";
import AdminLayout from "../layouts/AdminLayout";

//  Authentication
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import SellerRegister from "../pages/auth/SellerRegister";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ProductDetails from "../pages/customer/ProductDetails";

// Customer Routes
import Home from "../pages/customer/Home";
import Shop from "../pages/customer/Shop";
import Cart from "../pages/customer/Cart";
import StorePage from "../pages/customer/StorePage";
import Checkout from "../pages/customer/Checkout";
import OrderConfirmation from "../pages/customer/OrderConfirmation";
import OrderDetails from "../pages/customer/account/OrderDetails";
import OrderTracking from "../pages/customer/account/OrderTracking";

// Customer Account
import MyOrders from "../pages/customer/account/MyOrders";
import Addresses from "../pages/customer/account/Addresses";
import Profile from "../pages/customer/account/Profile";
import ChangePassword from "../pages/customer/account/ChangePassword";

// Seller Routes
import SellerDashboard from "../pages/seller/Dashboard";
import SellerProducts from "../pages/seller/Products";
import ProductForm from "../pages/seller/ProductForm";
import SellerInventory from "../pages/seller/Inventory";
import SellerOrders from "../pages/seller/Orders";
import SellerSales from "../pages/seller/Sales";
import SellerProfile from "../pages/seller/Profile";
import SellerSettings from "../pages/seller/Settings";
import SellerOrderDetails from "../pages/seller/OrderDetails";

// Admin Routes
import AdminDashboard from "../pages/admin/Dashboard";
import AdminSettings from "../pages/admin/Settings";
import AdminUsers from "../pages/admin/Users";
import AdminUserDetails from "../pages/admin/UserDetails";
import AdminSellers from "../pages/admin/Sellers";
import AdminSellerDetails from "../pages/admin/SellerDetails";
import AdminProducts from "../pages/admin/Products";
import AdminCategories from "../pages/admin/Categories";
import AdminOrders from "../pages/admin/Orders";
import AdminInventory from "../pages/admin/Inventory";
import AdminSalesReport from "../pages/admin/SalesReport";

// Company & Help Pages
import InfoPage from "../pages/info/InfoPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route index element={<Home/>}/>
                <Route path={"shop"} element={<Shop/>}/>
                <Route path={"cart"} element={<Cart/>}/>
                <Route path={"store/:storeId"} element={<StorePage/>}/>
                <Route path={"checkout"} element={<Checkout/>}/>
                <Route path={"order-confirmation/:orderId"} element={<OrderConfirmation/>}/>
                <Route path={"product/:id"} element={<ProductDetails/>}/>

                {/* Company & Help Pages */}
                <Route path={"our-story"} element={<InfoPage slug="our-story"/>}/>
                <Route path={"careers"} element={<InfoPage slug="careers"/>}/>
                <Route path={"press"} element={<InfoPage slug="press"/>}/>
                <Route path={"blog"} element={<InfoPage slug="blog"/>}/>

                <Route path={"customer-service"} element={<InfoPage slug="customer-service"/>}/>
                <Route path={"returns"} element={<InfoPage slug="returns"/>}/>
                <Route path={"shipping-info"} element={<InfoPage slug="shipping-info"/>}/>
                <Route path={"privacy-policy"} element={<InfoPage slug="privacy-policy"/>}/>
            </Route>

            {/* Authentication */}
            <Route path={"login"} element={<Login/>}/>
            <Route path={"register"} element={<Register/>}/>
            <Route path={"verify-email"} element={<VerifyEmail/>}/>
            <Route path={"become-seller"} element={<SellerRegister/>}/>
            <Route path={"forgot-password"} element={<ForgotPassword/>}/>
            <Route path={"reset-password"} element={<ResetPassword/>}/>

            {/* Customer Account Routes */}
            <Route path={"/account"} element={<ProtectedRoute roles={["Customer"]}/>}>
                <Route element={<CustomerLayout/>}>
                    <Route index element={<Profile/>}/>
                    <Route path={"orders"} element={<MyOrders/>}/>
                    <Route path={"addresses"} element={<Addresses/>}/>
                    <Route path={"change-password"} element={<ChangePassword/>}/>
                    <Route path={"orders/:orderId"} element={<OrderDetails/>}/>
                    <Route path={"orders/:orderId/track"} element={<OrderTracking/>}/>
                </Route>
            </Route>

            {/* Seller Routes */}
            <Route path="/seller" element={<ProtectedRoute roles={["Seller"]}/>}>
                <Route element={<SellerLayout/>}>
                    <Route index element={<SellerDashboard/>}/>
                    <Route path="products" element={<SellerProducts/>}/>
                    <Route path="products/new" element={<ProductForm/>}/>
                    <Route path="products/:productId/edit" element={<ProductForm/>}/>
                    <Route path="inventory" element={<SellerInventory/>}/>
                    <Route path="orders" element={<SellerOrders/>}/>
                    <Route path="sales" element={<SellerSales/>}/>
                    <Route path="profile" element={<SellerProfile/>}/>
                    <Route path="settings" element={<SellerSettings/>}/>
                    <Route path="orders/:orderId" element={<SellerOrderDetails/>}/>
                </Route>
            </Route>

            {/* Legacy single-product edit alias → keep deep links working */}
            <Route path="/seller/products/:productId" element={<Navigate to="/seller/products" replace/>}/>

            {/* ── Admin console ──────────────────────────────────────────── */}
            <Route path="/admin" element={<ProtectedRoute roles={["Administrator"]} />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/:userId" element={<AdminUserDetails />} />
                    <Route path="sellers" element={<AdminSellers />} />
                    <Route path="sellers/:sellerId" element={<AdminSellerDetails />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="inventory/low" element={<AdminInventory view="low" />} />
                    <Route path="inventory/out" element={<AdminInventory view="out" />} />
                    <Route path="reports/sales" element={<AdminSalesReport />} />
                </Route>
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundLayout/>}/>
        </Routes>
    )
}