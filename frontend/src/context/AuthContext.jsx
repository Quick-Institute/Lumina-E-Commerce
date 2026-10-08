import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import * as authService from "../services/authService";

const STORAGE_KEY = "lumina.auth";

const AuthContext = createContext(null);

function readStored() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({children}) {
    const [session, setSession] = useState(readStored);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // brief settle so protected routes don't flash before hydration
        const t = setTimeout(() => setReady(true), 50);
        return () => clearTimeout(t);
    }, []);

    const persist = useCallback((next) => {
        setSession(next);

        if (next) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const login = useCallback(
        async (email, password) => {
            const res = await authService.login(email, password);
            persist(res);
            return res.user;
        },
        [persist]
    );

    const registerCustomer = useCallback(
        async (data) => {
            const res = await authService.registerCustomer(data);
            persist(res);
            return res.user;
        },
        [persist]
    );

    // Email verification
    const verifyEmail = useCallback(async (token) => {
        const res = await authService.verifyEmail(token);
        return res;
    }, []);

    const logout = useCallback(() => persist(null), [persist]);

    const updateUser = useCallback(
        (patch) => {
            setSession((s) => {
                const next = {
                    ...s,
                    user: {
                        ...s.user,
                        ...patch
                    }
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

                return next;
            });
        },
        []
    );

    const value = useMemo(
        () => ({
            ready,
            user: session?.user || null,
            token: session?.token || null,
            isAuthenticated: Boolean(session?.token),
            role: session?.user?.role || null,

            login,
            registerCustomer,
            verifyEmail,
            logout,
            updateUser,
        }),
        [
            ready,
            session,
            login,
            registerCustomer,
            verifyEmail,
            logout,
            updateUser
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error("useAuth must be used within <AuthProvider>");
    }

    return ctx;
}

export const dashboardPathByRole = {
    Customer: "/account",
    Seller: "/seller",
    Administrator: "/admin",
};