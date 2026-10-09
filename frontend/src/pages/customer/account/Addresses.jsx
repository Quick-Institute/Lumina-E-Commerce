import React, {useEffect, useState} from "react";
import {FaLocationDot, FaPencil, FaPlus, FaStar, FaTrashCan} from "react-icons/fa6";

import Button from "../../../components/ui/Button";
import Input, {Checkbox, Select} from "../../../components/ui/Input";
import Modal, {ConfirmDialog} from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import {EmptyState} from "../../../components/ui/States";

import {DISTRICTS} from "../../../utils/constants";
import {isPhone, isPostalCode, required, validate} from "../../../utils/validation";

import {useToast} from "../../../context/ToastContext";

import {addAddress, deleteAddress, getAddresses, updateAddress} from "../../../services/accountService";


const EMPTY = {
    label: "",
    fullName: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    phone: "",
    isDefault: false
};


export default function Addresses() {
    const {notify} = useToast();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);


    /*
     * Load addresses from backend
     */
    useEffect(() => {
        let mounted = true;

        const loadAddresses = async () => {
            try {
                setLoading(true);

                const addresses = await getAddresses();

                if (mounted) {
                    setList(Array.isArray(addresses) ? addresses : []);
                }
            } catch (error) {
                console.error("Unable to load addresses:", error);

                if (mounted) {
                    notify(
                        error.message || "Unable to load addresses.",
                        "error"
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadAddresses();

        return () => {
            mounted = false;
        };
    }, [notify]);


    /*
     * Open add address modal
     */
    const openNew = () => {
        setForm({
            ...EMPTY
        });

        setErrors({});
        setEditing("new");
    };


    /*
     * Open edit address modal
     */
    const openEdit = (addr) => {
        setForm({
            label: addr.label || "",
            fullName: addr.fullName || "",
            address: addr.address || "",
            city: addr.city || "",
            district: addr.district || "",
            postalCode: addr.postalCode || "",
            phone: addr.phone || "",
            isDefault: Boolean(addr.isDefault)
        });

        setErrors({});
        setEditing(addr._id || addr.id);
    };


    /*
     * Save address
     */
    const save = async (e) => {
        e.preventDefault();

        const errs = validate(form, {
            label: [
                (v) => required(v, "Label")
            ],

            fullName: [
                (v) => required(v, "Recipient name")
            ],

            address: [
                (v) => required(v, "Address")
            ],

            city: [
                (v) => required(v, "City")
            ],

            district: [
                (v) => required(v, "District")
            ],

            postalCode: [
                (v) => required(v, "Postal code"),
                isPostalCode
            ],

            phone: [
                (v) => required(v, "Phone"),
                isPhone
            ]
        });

        setErrors(errs);

        if (Object.keys(errs).length) {
            return;
        }

        try {
            setSaving(true);

            /*
             * ADD
             */
            if (editing === "new") {
                const created = await addAddress({
                    label: form.label.trim(),
                    fullName: form.fullName.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    city: form.city.trim(),
                    district: form.district,
                    postalCode: form.postalCode.trim(),
                    isDefault: form.isDefault
                });

                setList((prev) => {
                    /*
                     * If backend returns the complete updated
                     * address object, use it directly.
                     */
                    let next = [...prev, created];

                    /*
                     * Keep frontend state consistent with
                     * backend default-address behavior.
                     */
                    if (created?.isDefault) {
                        next = next.map((addr) => ({
                            ...addr,
                            isDefault:
                                (addr._id || addr.id) ===
                                (created._id || created.id)
                        }));
                    }

                    return next;
                });

                notify("Address added successfully");
            }

            /*
             * UPDATE
             */
            else {
                const updated = await updateAddress(
                    editing,
                    {
                        label: form.label.trim(),
                        fullName: form.fullName.trim(),
                        phone: form.phone.trim(),
                        address: form.address.trim(),
                        city: form.city.trim(),
                        district: form.district,
                        postalCode: form.postalCode.trim(),
                        isDefault: form.isDefault
                    }
                );

                setList((prev) => {
                    let next = prev.map((addr) => {
                        const id = addr._id || addr.id;

                        if (id === editing) {
                            return updated;
                        }

                        return addr;
                    });

                    /*
                     * Only one address should be default.
                     */
                    if (updated?.isDefault) {
                        next = next.map((addr) => ({
                            ...addr,
                            isDefault:
                                (addr._id || addr.id) ===
                                (updated._id || updated.id)
                        }));
                    }

                    return next;
                });

                notify("Address updated successfully");
            }

            setEditing(null);
            setForm(EMPTY);
            setErrors({});
        } catch (error) {
            console.error("Unable to save address:", error);

            notify(
                error.message || "Unable to save address.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };


    /*
     * Remove address
     */
    const remove = async (addressId) => {
        try {
            setDeletingLoading(true);

            await deleteAddress(addressId);

            setList((prev) => {
                const next = prev.filter(
                    (addr) =>
                        (addr._id || addr.id) !== addressId
                );

                /*
                 * If the deleted address was the default
                 * and other addresses remain, make the first
                 * address default locally.
                 *
                 * If your backend automatically handles this,
                 * the next page refresh will reflect its state.
                 */
                if (
                    next.length > 0 &&
                    !next.some((addr) => addr.isDefault)
                ) {
                    next[0] = {
                        ...next[0],
                        isDefault: true
                    };
                }

                return next;
            });

            setDeleting(null);

            notify("Address removed", "info");
        } catch (error) {
            console.error("Unable to remove address:", error);

            notify(
                error.message || "Unable to remove address.",
                "error"
            );
        } finally {
            setDeletingLoading(false);
        }
    };


    /*
     * Set default address
     *
     * Your backend PATCH endpoint is used here as well.
     */
    const setDefault = async (addr) => {
        const addressId = addr._id || addr.id;

        try {
            await updateAddress(addressId, {
                isDefault: true
            });

            setList((prev) =>
                prev.map((item) => ({
                    ...item,
                    isDefault:
                        (item._id || item.id) === addressId
                }))
            );

            notify("Default address updated");
        } catch (error) {
            console.error(
                "Unable to update default address:",
                error
            );

            notify(
                error.message ||
                "Unable to update default address.",
                "error"
            );
        }
    };


    /*
     * Form field handler
     */
    const set = (key) => (e) => {
        setForm((current) => ({
            ...current,

            [key]:
                e.target.type === "checkbox"
                    ? e.target.checked
                    : e.target.value
        }));
    };


    return (
        <div>

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
                        Addresses
                    </h1>

                    <p className="mt-1.5 text-sm text-slate-500">
                        Save delivery addresses to check out faster on
                        Lumina.
                    </p>
                </div>

                <Button
                    icon={<FaPlus size={11}/>}
                    onClick={openNew}
                >
                    Add Address
                </Button>
            </div>


            {/* Loading */}
            {loading ? (
                <div className="mt-8 grid gap-5 sm:grid-cols-2">

                    {[1, 2].map((item) => (
                        <div
                            key={item}
                            className="lum-card animate-pulse p-6"
                        >
                            <div className="h-5 w-28 rounded bg-slate-200"/>

                            <div className="mt-5 space-y-3">
                                <div className="h-4 w-32 rounded bg-slate-200"/>
                                <div className="h-4 w-full rounded bg-slate-200"/>
                                <div className="h-4 w-2/3 rounded bg-slate-200"/>
                                <div className="h-3 w-28 rounded bg-slate-200"/>
                            </div>
                        </div>
                    ))}

                </div>
            ) : list.length === 0 ? (

                /* Empty State */
                <div className="mt-8">
                    <EmptyState
                        icon={<FaLocationDot size={34}/>}
                        title="No saved addresses"
                        message="Add a delivery address now and it will be waiting for you at checkout."
                        action={{
                            label: "Add your first address",
                            onClick: openNew
                        }}
                    />
                </div>

            ) : (

                /* Address List */
                <div className="mt-7 grid gap-5 sm:grid-cols-2">

                    {list.map((addr) => {
                        const addressId =
                            addr._id || addr.id;

                        return (
                            <div
                                key={addressId}
                                className={`lum-card flex flex-col p-6 ${
                                    addr.isDefault
                                        ? "ring-2 ring-primary-200"
                                        : ""
                                }`}
                            >

                                {/* Address Header */}
                                <div className="flex items-start justify-between gap-3">

                                    <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink-900">

                                        <FaLocationDot
                                            className="text-primary-600"
                                            size={14}
                                        />

                                        {addr.label}

                                        {addr.isDefault && (
                                            <Badge tone="teal">
                                                Default
                                            </Badge>
                                        )}

                                    </p>


                                    {!addr.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDefault(addr)
                                            }
                                            className="flex items-center text-xs font-bold text-slate-400 hover:text-primary-700"
                                        >
                                            <FaStar
                                                size={10}
                                                className="mr-1"
                                            />

                                            Set default
                                        </button>
                                    )}

                                </div>


                                {/* Address Details */}
                                <div className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">

                                    <p className="font-bold text-ink-900">
                                        {addr.fullName}
                                    </p>

                                    <p>
                                        {addr.address}
                                    </p>

                                    <p>
                                        {addr.city},{" "}
                                        {addr.district}{" "}
                                        {addr.postalCode}
                                    </p>

                                    <p className="mt-1 text-xs">
                                        {addr.phone}
                                    </p>

                                </div>


                                {/* Actions */}
                                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={<FaPencil size={10}/>}
                                        onClick={() =>
                                            openEdit(addr)
                                        }
                                    >
                                        Edit
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="dangerSoft"
                                        icon={<FaTrashCan size={10}/>}
                                        onClick={() =>
                                            setDeleting(addr)
                                        }
                                    >
                                        Remove
                                    </Button>

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}


            {/* Add / Edit Modal */}
            <Modal
                open={Boolean(editing)}
                onClose={() => {
                    if (!saving) {
                        setEditing(null);
                    }
                }}
                title={
                    editing === "new"
                        ? "Add Address"
                        : "Edit Address"
                }
                subtitle="Your address will be saved to your Lumina account."
                size="md"
            >

                <form
                    onSubmit={save}
                    className="space-y-4"
                    noValidate
                >

                    {/* Label + Name */}
                    <div className="grid gap-4 sm:grid-cols-2">

                        <Input
                            label="Label"
                            name="addr-label"
                            placeholder="Home / Office"
                            value={form.label}
                            onChange={set("label")}
                            error={errors.label}
                        />

                        <Input
                            label="Recipient Name"
                            name="addr-full-name"
                            placeholder="John Doe"
                            value={form.fullName}
                            onChange={set("fullName")}
                            error={errors.fullName}
                        />

                    </div>


                    {/* Address */}
                    <Input
                        label="Street Address"
                        name="addr-address"
                        placeholder="No, Street, Apartment"
                        value={form.address}
                        onChange={set("address")}
                        error={errors.address}
                    />


                    {/* City + District + Postal */}
                    <div className="grid gap-4 sm:grid-cols-3">

                        <Input
                            label="City"
                            name="addr-city"
                            value={form.city}
                            onChange={set("city")}
                            error={errors.city}
                        />

                        <Select
                            label="District"
                            name="addr-district"
                            value={form.district}
                            onChange={set("district")}
                            error={errors.district}
                        >
                            <option value="">
                                Select
                            </option>

                            {DISTRICTS.map((district) => (
                                <option
                                    key={district}
                                    value={district}
                                >
                                    {district}
                                </option>
                            ))}
                        </Select>

                        <Input
                            label="Postal Code"
                            name="addr-postal"
                            maxLength={5}
                            value={form.postalCode}
                            onChange={set("postalCode")}
                            error={errors.postalCode}
                        />

                    </div>


                    {/* Phone */}
                    <Input
                        label="Phone Number"
                        name="addr-phone"
                        placeholder="+94 77 xxx xxxx"
                        value={form.phone}
                        onChange={set("phone")}
                        error={errors.phone}
                    />


                    {/* Default */}
                    <Checkbox
                        label="Use as my default delivery address"
                        name="addr-default"
                        checked={form.isDefault}
                        onChange={set("isDefault")}
                    />


                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">

                        <Button
                            variant="secondary"
                            type="button"
                            disabled={saving}
                            onClick={() => setEditing(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Address"}
                        </Button>

                    </div>

                </form>

            </Modal>


            {/* Delete Confirmation */}
            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => {
                    if (!deletingLoading) {
                        setDeleting(null);
                    }
                }}
                onConfirm={() => {
                    if (deleting) {
                        remove(
                            deleting._id ||
                            deleting.id
                        );
                    }
                }}
                title="Remove this address?"
                confirmLabel={
                    deletingLoading
                        ? "Removing..."
                        : "Remove"
                }
                message={`${
                    deleting?.label || "This address"
                } will be deleted from your address book.`}
            />

        </div>
    );
}