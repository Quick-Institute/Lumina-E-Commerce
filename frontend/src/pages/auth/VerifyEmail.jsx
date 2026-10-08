import React, {useEffect, useRef, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {FaCircleCheck, FaCircleExclamation, FaEnvelope} from "react-icons/fa6";
import {AuthSplit} from "../../layouts/AuthShell";
import Button from "../../components/ui/Button";
import {useAuth} from "../../context/AuthContext";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const {verifyEmail} = useAuth();

    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("");

    // Prevent the verification request from being sent twice
    // during React development/StrictMode.
    const verificationStarted = useRef(false);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        if (verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const verify = async () => {
            try {
                const result = await verifyEmail(token);

                setStatus("success");
                setMessage(
                    result?.message ||
                    "Your email address has been verified successfully."
                );
            } catch (error) {
                setStatus("error");
                setMessage(
                    error.message ||
                    "Invalid or expired verification token"
                );
            }
        };

        verify();
    }, [searchParams, verifyEmail]);

    return (
        <AuthSplit
            image="/images/auth-bag.jpg"
            badge="email verification"
            title={
                status === "success"
                    ? "Email Verified"
                    : status === "error"
                        ? "Verification Failed"
                        : "Verify Your Email"
            }
            subtitle={
                status === "success"
                    ? "Your Lumina account is now ready to use."
                    : status === "error"
                        ? "We couldn't verify your email address."
                        : "Please wait while we confirm your email address."
            }
        >
            {status === "verifying" && (
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                        <FaEnvelope className="text-2xl text-primary-700"/>
                    </div>

                    <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink-900">
                        Verifying Your Email
                    </h1>

                    <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
                        Please wait while we verify your email address.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <div
                            className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary-700"/>
                    </div>
                </div>
            )}

            {status === "success" && (
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <FaCircleCheck className="text-3xl text-emerald-500"/>
                    </div>

                    <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink-900">
                        Email Verified!
                    </h1>

                    <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
                        {message}
                    </p>

                    <div className="mt-8">
                        <Link to="/login">
                            <Button size="lg" fullWidth>
                                Continue to Login
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-slate-400">
                        Your email address has been successfully confirmed.
                    </p>
                </div>
            )}

            {status === "error" && (
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <FaCircleExclamation className="text-3xl text-red-500"/>
                    </div>

                    <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink-900">
                        Verification Failed
                    </h1>

                    <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
                        {message}
                    </p>

                    <div className="mt-8">
                        <Link to="/">
                            <Button size="lg" fullWidth>
                                Back to Home
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-slate-400">
                        The verification link may have expired or already been used.
                    </p>
                </div>
            )}
        </AuthSplit>
    );
}