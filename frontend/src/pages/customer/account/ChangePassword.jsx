import React, {useState} from "react";
import {FaCircleInfo} from "react-icons/fa6";
import Button from "../../../components/ui/Button";
import {PasswordInput} from "../../../components/ui/Input";
import PasswordRules from "../../../components/forms/PasswordRules";
import {matches, minLength, passwordRules} from "../../../utils/validation";
import {useAuth} from "../../../context/AuthContext";
import {useToast} from "../../../context/ToastContext";
import {changePassword} from "../../../services/authService";

export default function ChangePassword() {
    const {notify} = useToast();
    const {user} = useAuth();

    const [form, setForm] = useState({
        current: "",
        next: "",
        confirm: ""
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        const errs = {};

        if (!form.current) {
            errs.current = "Enter your current password";
        }

        if (!passwordRules(form.next).valid) {
            errs.next = "New password does not meet the requirements";
        } else {
            const m = minLength(form.next, 8, "New password");

            if (m) {
                errs.next = m;
            }
        }

        const match = matches(
            form.confirm,
            form.next,
            "Passwords"
        );

        if (match) {
            errs.confirm = match;
        }

        setErrors(errs);

        if (Object.keys(errs).length) {
            return;
        }

        setSaving(true);

        try {
            await changePassword(
                form.current,
                form.next
            );

            setForm({
                current: "",
                next: "",
                confirm: ""
            });

            setErrors({});

            notify("Password updated successfully.");
        } catch (error) {
            setErrors({
                current: error.message || "Unable to change password."
            });
        } finally {
            setSaving(false);
        }
    };

    const clearForm = () => {
        setForm({
            current: "",
            next: "",
            confirm: ""
        });

        setErrors({});
    };

    return (
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
                Change Password
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
                Keep your Lumina account{" "}
                {user ? `for ${user.email}` : ""} secure.
            </p>

            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[520px_1fr]">

                <form
                    onSubmit={submit}
                    className="lum-card p-6 sm:p-8"
                    noValidate
                >
                    <div className="space-y-5">

                        <PasswordInput
                            label="Current Password"
                            name="cur"
                            value={form.current}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    current: e.target.value
                                }))
                            }
                            error={errors.current}
                        />

                        <PasswordInput
                            label="New Password"
                            name="new"
                            value={form.next}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    next: e.target.value
                                }))
                            }
                            error={errors.next}
                        />

                        <PasswordInput
                            label="Confirm New Password"
                            name="conf"
                            value={form.confirm}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    confirm: e.target.value
                                }))
                            }
                            error={errors.confirm}
                        />

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <PasswordRules value={form.next}/>
                        </div>

                    </div>

                    <div className="mt-7 flex justify-end gap-3">

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={clearForm}
                        >
                            Clear
                        </Button>

                        <Button
                            type="submit"
                            loading={saving}
                        >
                            Update Password
                        </Button>

                    </div>
                </form>

                <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-6">

                    <p className="flex items-center gap-2 text-sm font-extrabold text-primary-900">
                        <FaCircleInfo className="text-primary-600"/>
                        Security note
                    </p>

                    <p className="mt-2.5 text-sm leading-relaxed text-primary-900/80">
                        Your current password is verified securely by the
                        Lumina backend. The new password is hashed with
                        bcrypt before it is stored in MongoDB.
                    </p>

                </div>

            </div>
        </div>
    );
}