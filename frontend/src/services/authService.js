import api from "./api";

export async function login(email, password) {
    try {
        const response = await api.post("/auth/login", {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Invalid email or password.";

        const err = new Error(message);
        err.code = error.response?.status;
        throw err;
    }
}

export async function registerCustomer(data) {
    try {
        const response = await api.post("/auth/register", data);
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Registration failed.";

        const err = new Error(message);
        err.code = error.response?.status;
        throw err;
    }
}

export async function registerSeller(data) {
    try {
        const response = await api.post("/auth/register-seller", data);
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Seller registration failed.";

        const err = new Error(message);
        err.code = error.response?.status;
        throw err;
    }
}

export async function requestPasswordReset(email) {
    try {
        const response = await api.post("/auth/forgot-password", {
            email,
        });
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Unable to process password reset request.";

        const err = new Error(message);
        err.code = error.response?.status;
        throw err;
    }
}

export async function resetPassword(token, password) {
    try {
        const response = await api.post("/auth/reset-password", {
            token,
            password,
        });
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Unable to reset password.";

        throw new Error(message);
    }
}

export async function changePassword(currentPassword, newPassword) {
    try {
        const response = await api.post("/account/change-password", {
            currentPassword,
            newPassword,
        });

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Unable to change password.";

        const err = new Error(message);
        err.code = error.response?.status;
        throw err;
    }
}

export async function verifyEmail(token) {
    try {
        const response = await api.get("/auth/verify-email", {
            params: {token},
        });

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Email verification failed.";

        throw new Error(message);
    }
}