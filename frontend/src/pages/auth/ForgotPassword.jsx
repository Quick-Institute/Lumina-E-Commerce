import React, {useState} from "react";
import {FaCircleCheck, FaEnvelope, FaUnlockKeyhole} from "react-icons/fa6";
import {AuthShell, BackToLogin} from "../../layouts/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {hasErrors, isEmail, required, validate} from "../../utils/validation";
import {requestPasswordReset} from "../../services/authService";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        const errs = validate(
            {email},
            {
                email: [(v) => required(v, "Email"), isEmail]
            }
        );

        setError(errs.email || "");

        if (hasErrors(errs)) return;

        setSubmitting(true);

        try {
            await requestPasswordReset(email);
            setSent(true);
        } catch (error) {
            setError(error.message || "Unable to send reset link.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell>
            <div className="lum-card p-8 text-center sm:p-10">
                {sent ? (
                    <div className="py-6">
                        <span
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600"
                        >
                            <FaCircleCheck/>
                        </span>

                        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">
                            Check Your Inbox
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                            If an account exists for{" "}
                            <strong className="text-ink-800">{email}</strong>,
                            we&apos;ve sent a password reset link to your email address.
                        </p>

                        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
                            Please check your inbox and spam folder. Click the
                            reset link in the email to create a new password.
                        </p>

                        <div className="mt-8">
                            <Button
                                as="a"
                                href="https://mail.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="lg"
                                fullWidth
                            >
                                Open Email
                            </Button>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-6">
                            <BackToLogin/>
                        </div>
                    </div>
                ) : (
                    <>
                        <span
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600"
                        >
                            <FaUnlockKeyhole/>
                        </span>

                        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">
                            Forgot Your Password
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                            No worries! Enter the email address associated with
                            your account and we&apos;ll send you a link to reset
                            your password.
                        </p>

                        <form
                            onSubmit={submit}
                            className="mt-8 text-left"
                            noValidate
                        >
                            <Input
                                label="Email Address"
                                name="forgot-email"
                                type="email"
                                icon={FaEnvelope}
                                placeholder="jane@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                className="mt-6"
                                loading={submitting}
                            >
                                Send Reset Link
                            </Button>
                        </form>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <BackToLogin/>
                        </div>
                    </>
                )}
            </div>
        </AuthShell>
    );
}