import React, {useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {FaCircleCheck, FaLock} from "react-icons/fa6";
import {AuthShell, BackToLogin} from "../../layouts/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {resetPassword} from "../../services/authService";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();

    // Get the real reset token from:
    // /reset-password?token=xxxxxxxx
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        setError("");

        // Make sure the email link contains a token
        if (!token) {
            setError("Invalid or missing password reset link.");
            return;
        }

        // Validate password
        if (!password) {
            setError("Please enter a new password.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        // Confirm password
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            await resetPassword(token, password);

            setSuccess(true);
        } catch (error) {
            setError(
                error.message ||
                "Invalid or expired reset token."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell>
            <div className="lum-card p-8 sm:p-10">

                {success ? (
                    <div className="py-6 text-center">

                        <span
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600"
                        >
                            <FaCircleCheck/>
                        </span>

                        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">
                            Password Reset Successful
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                            Your password has been updated successfully.
                            You can now sign in using your new password.
                        </p>

                        <div className="mt-8">
                            <Button
                                as={Link}
                                to="/login"
                                size="lg"
                                fullWidth
                            >
                                Continue to Login
                            </Button>
                        </div>

                    </div>
                ) : (
                    <>
                        <div className="text-center">

                            <span
                                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600"
                            >
                                <FaLock/>
                            </span>

                            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">
                                Reset Your Password
                            </h1>

                            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                                Enter your new password below to reset your
                                Lumina account password.
                            </p>

                        </div>

                        <form
                            onSubmit={submit}
                            className="mt-8"
                            noValidate
                        >

                            <Input
                                label="New Password"
                                name="new-password"
                                type="password"
                                placeholder="Enter your new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <div className="mt-5">
                                <Input
                                    label="Confirm Password"
                                    name="confirm-password"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                />
                            </div>

                            {error && (
                                <p className="mt-4 text-sm text-red-500">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                className="mt-6"
                                loading={submitting}
                            >
                                Reset Password
                            </Button>

                        </form>

                        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                            <BackToLogin/>
                        </div>
                    </>
                )}

            </div>
        </AuthShell>
    );
}