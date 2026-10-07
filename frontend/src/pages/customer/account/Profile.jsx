import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaCamera, FaEnvelope, FaPhone, FaShieldHalved, FaUser} from "react-icons/fa6";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import {isEmail, isPhone, required, validate} from "../../../utils/validation";
import {updateProfile} from "../../../services/accountService";
import {useAuth} from "../../../context/AuthContext";
import {useToast} from "../../../context/ToastContext";
import {formatDate} from "../../../utils/format";

const API_URL = process.env.REACT_APP_API_URL;

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

export default function Profile() {
    const {user, updateUser} = useAuth();
    const navigate = useNavigate();
    const {notify} = useToast();

    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || ""
        });

        if (user.avatar) {
            setAvatarPreview(
                user.avatar.startsWith("http")
                    ? user.avatar
                    : `${SERVER_URL}${user.avatar}`
            );
        } else {
            setAvatarPreview("");
        }
    }, [user]);

    if (!user) return null;

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            notify("Please select a JPG, PNG or WEBP image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            notify("Profile photo must be smaller than 5 MB.");
            return;
        }

        setAvatarFile(file);

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
    };

    const submit = async (e) => {
        e.preventDefault();

        const errs = validate(form, {
            name: [(v) => required(v, "Full name")],
            email: [(v) => required(v, "Email"), isEmail],
            phone: [(v) => required(v, "Phone"), isPhone],
        });

        setErrors(errs);

        if (Object.keys(errs).length) return;

        setSaving(true);

        try {
            const response = await updateProfile(user.id, {
                name: form.name.trim(),
                phone: form.phone,
                avatar: avatarFile
            });

            const updatedUser = response.user;

            updateUser({
                name: updatedUser.name,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                avatarLetter: updatedUser.name
                    ?.trim()
                    .charAt(0)
                    .toUpperCase()
            });

            setAvatarFile(null);

            notify("Profile updated successfully.");

        } catch (error) {
            setErrors({
                submit:
                    error.message ||
                    "Unable to update profile."
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || ""
        });

        setAvatarFile(null);

        if (user.avatar) {
            setAvatarPreview(
                user.avatar.startsWith("http")
                    ? user.avatar
                    : `${SERVER_URL}${user.avatar}`
            );
        } else {
            setAvatarPreview("");
        }

        setErrors({});
    };

    return (
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
                My Profile
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
                Manage your personal information and how Lumina reaches you.
            </p>

            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_340px]">

                <form
                    onSubmit={submit}
                    className="lum-card p-6 sm:p-8"
                    noValidate
                >
                    <h2 className="border-b border-slate-100 pb-4 text-base font-extrabold tracking-tight text-ink-900">
                        Personal Information
                    </h2>

                    <div className="mt-6 flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex h-24 w-24 overflow-hidden rounded-full bg-primary-100 text-3xl font-extrabold text-primary-700 ring-4 ring-primary-50"
                            >
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center">
                                        {user.avatarLetter ||
                                            user.name?.charAt(0)}
                                    </span>
                                )}

                                <span
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                    <FaCamera/>
                                </span>
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="mt-4 text-center sm:mt-2 sm:text-left">
                            <p className="text-sm font-extrabold text-ink-900">
                                Profile Photo
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                                JPG, PNG or WEBP. Maximum 5 MB.
                            </p>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >
                                Upload Photo
                            </Button>
                        </div>

                    </div>

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">

                        <Input
                            label="Full Name"
                            name="profile-name"
                            icon={FaUser}
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    name: e.target.value
                                }))
                            }
                            error={errors.name}
                        />

                        <Input
                            label="Phone Number"
                            name="profile-phone"
                            icon={FaPhone}
                            placeholder="+94 76 xxx xxxx"
                            value={form.phone}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    phone: e.target.value
                                }))
                            }
                            error={errors.phone}
                        />

                    </div>

                    <Input
                        className="mt-5 max-w-md"
                        label="Email Address"
                        name="profile-email"
                        icon={FaEnvelope}
                        value={form.email}
                        readOnly
                        hint="Email changes require backend verification."
                    />

                    {errors.submit && (
                        <p className="mt-4 text-sm text-red-500">
                            {errors.submit}
                        </p>
                    )}

                    <div className="mt-7 flex justify-end gap-3">

                        <Button
                            variant="secondary"
                            type="button"
                            onClick={resetForm}
                        >
                            Reset
                        </Button>

                        <Button
                            type="submit"
                            loading={saving}
                        >
                            Save Changes
                        </Button>

                    </div>
                </form>

                <div className="space-y-6">

                    <div className="lum-card p-6 text-center">

                        <span
                            className="mx-auto flex h-20 w-20 overflow-hidden items-center justify-center rounded-full bg-primary-100 text-2xl font-extrabold text-primary-700 ring-4 ring-primary-50">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                user.avatarLetter ||
                                user.name.charAt(0)
                            )}
                        </span>

                        <p className="mt-4 text-lg font-extrabold text-ink-900">
                            {user.name}
                        </p>

                        <p className="text-xs font-semibold text-slate-400">
                            {user.email}
                        </p>

                        <div className="mt-3 flex justify-center gap-2">
                            <Badge tone="teal">
                                {user.memberTier || user.role}
                            </Badge>

                            <Badge
                                tone={
                                    user.status === "Active"
                                        ? "green"
                                        : "slate"
                                }
                            >
                                {user.status}
                            </Badge>
                        </div>

                        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                            Member since {formatDate(user.createdAt)}
                        </p>
                    </div>

                    <div className="lum-card p-6">

                        <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
                            <FaShieldHalved className="text-primary-600"/>
                            Security
                        </h3>

                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Passwords are securely hashed with bcrypt.js and
                            sessions are protected with JWT authentication.
                        </p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() =>
                                navigate("/account/change-password")
                            }
                        >
                            Change Password
                        </Button>

                    </div>

                </div>
            </div>
        </div>
    );
}