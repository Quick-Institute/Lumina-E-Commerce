import React from "react";
import {Routes, Route} from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Customer Public Routes
import Home from "../pages/customer/Home";

// Company & Help Pages
import InfoPage from "../pages/info/InfoPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route index element={<Home/>}/>

                {/* Company & Help Pages */}
                <Route path={"our-story"} element={<InfoPage slug="our-story"/>} />
                <Route path={"careers"} element={<InfoPage slug="careers"/>} />
                <Route path={"press"} element={<InfoPage slug="press"/>} />
                <Route path={"blog"} element={<InfoPage slug="blog"/>} />

                <Route path={"customer-service"} element={<InfoPage slug="customer-service"/>} />
                <Route path={"returns"} element={<InfoPage slug="returns"/>} />
                <Route path={"shipping-info"} element={<InfoPage slug="shipping-info"/>} />
                <Route path={"privacy-policy"} element={<InfoPage slug="privacy-policy"/>} />
            </Route>
        </Routes>
    )
}