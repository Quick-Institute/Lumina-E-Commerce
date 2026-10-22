import React, {useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {FaArrowLeftLong, FaImage, FaPlus, FaTrashCan, FaUpload} from "react-icons/fa6";
import Button from "../../components/ui/Button";
import Input, {Select, Textarea} from "../../components/ui/Input";
import {ValidationSummary} from "../../components/ui/States";
import {hasErrors, required, requiredAmount, requiredInteger, validate} from "../../utils/validation";
import {getProduct, saveProduct} from "../../services/productService";
import {listCategories} from "../../services/accountService";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";

export default function ProductForm() {
    const {productId} = useParams();
    const isEdit = Boolean(productId);
    const navigate = useNavigate();
    const {notify} = useToast();
    const {user} = useAuth();
    const sellerId = user?._id || user?.id;

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        category: "",
        price: "",
        oldPrice: "",
        stock: "",
        lowStockLevel: "5",
        status: "Active",
        shortDescription: "",
        description: "",
        images: [],
        specs: [{label: "", value: ""}],
    });

    useEffect(() => {
        listCategories().then((c) => setCategories(c.filter((x) => x.status === "Active")));
        if (isEdit) {
            getProduct(productId).then((p) => {
                if (!p) return;
                setForm({
                    name: p.name,
                    category: p.category,
                    price: String(p.price),
                    oldPrice: p.oldPrice ? String(p.oldPrice) : "",
                    stock: String(p.stock),
                    lowStockLevel: String(p.lowStockLevel ?? 5),
                    status: p.status,
                    shortDescription: p.shortDescription || "",
                    description: Array.isArray(p.description) ? p.description.join("\n\n") : (p.description || ""),
                    images: p.images?.length ? p.images : p.image ? [p.image] : [],
                    specs: p.specs?.length ? p.specs : [{label: "", value: ""}],
                });
            });
        }
    }, [isEdit, productId]);

    const set = (key) => (e) => {
        const value = (key === "price" || key === "oldPrice")
            ? e.target.value.replace(/[^0-9.]/g, "")
            : e.target.value;
        setForm((f) => ({...f, [key]: value}));
    };
    const setSpec = (idx, key, value) =>
        setForm((f) => ({
            ...f,
            specs: f.specs.map((s, i) => (i === idx ? {...s, [key]: value} : s)),
        }));

    const MAX_PHOTOS = 6;
    const [uploadError, setUploadError] = useState("");
    const [imageFiles, setImageFiles] = useState([]);
    const fileInputRef = useRef(null);

    const removePhoto = (idx) => {
        setForm((f) => ({...f, images: f.images.filter((_, i) => i !== idx)}));
        setImageFiles((files) => files.filter((_, i) => i !== idx));
    };

    const makeCover = (idx) =>
        setForm((f) => {
            const imgs = [...f.images];
            const [pick] = imgs.splice(idx, 1);
            return {...f, images: [pick, ...imgs]};
        });

    const onPickFiles = (fileList) => {
        setUploadError("");
        const list = Array.from(fileList || []);
        if (!list.length) return;

        const room = MAX_PHOTOS - form.images.length;
        if (room <= 0) {
            setUploadError(`Up to ${MAX_PHOTOS} photos per product - remove one to add another.`);
            return;
        }

        if (list.length > room) {
            setUploadError(
                `Only ${room} slot${room === 1 ? "" : "s"} left - the extra files were skipped.`
            );
        }

        list.slice(0, room).forEach((file) => {
            if (!file.type.startsWith("image/")) {
                setUploadError(`“${file.name}” is not an image file.`);
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                setUploadError(
                    `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB - keep uploads under 1 MB.`
                );
                return;
            }

            setImageFiles((files) => [...files, file]);
            const reader = new FileReader();
            reader.onload = () =>
                setForm((f) =>
                    f.images.length >= MAX_PHOTOS
                        ? f
                        : {...f, images: [...f.images, String(reader.result)]}
                );
            reader.onerror = () => setUploadError(`Could not read “${file.name}”.`);
            reader.readAsDataURL(file);
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, {
            name: [
                (v) => required(v, "Product name"),
                (v) => (String(v).length >= 4 ? "" : "Name should be at least 4 characters"),
            ],
            category: [(v) => required(v, "Category")],
            price: [(v) => requiredAmount(v, "Price")],
            stock: [(v) => requiredInteger(v, "Stock quantity", 0)],
            lowStockLevel: [(v) => requiredInteger(v, "Low-stock threshold", 0)],
        });

        if (form.oldPrice && Number(form.oldPrice) <= Number(form.price)) {
            errs.oldPrice = "Compare-at price must be higher than the selling price";
        }

        setErrors(errs);
        if (hasErrors(errs)) return;

        setSaving(true);
        const payload = {
            name: form.name.trim(),
            category: form.category,
            sellerId,
            price: Number(form.price),
            oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
            stock: Number(form.stock),
            lowStockLevel: Number(form.lowStockLevel),
            status: form.status,
            shortDescription: form.shortDescription.trim(),
            description: form.description.split(/\n\n+/).filter(Boolean),
            image: imageFiles[0] ? null : (form.images[0] || null),
            images: imageFiles[0] ? [] : form.images.filter((src) => !String(src).startsWith('data:')),
            specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
        };

        const requestData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== null && value !== undefined) requestData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
        });
        imageFiles.forEach(file => requestData.append('images', file));

        try {
            const saved = await saveProduct(requestData, isEdit ? productId : undefined);
            notify(isEdit ? "Product updated" : "Product published to your store");
            navigate("/seller/products", {state: {justSaved: saved.id}});
        } catch (err) {
            setErrors({name: err.message});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Link
                to="/seller/products"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
            >
                <FaArrowLeftLong size={12}/> Back to Products
            </Link>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {isEdit
                    ? "Changes go live on the storefront immediately after saving."
                    : "Listings become visible once your seller account is approved."}
            </p>

            <form
                onSubmit={submit}
                className="lum-card mt-6 space-y-8 p-4 sm:mt-7 sm:p-6 md:p-8"
                noValidate
            >
                <ValidationSummary errors={errors}/>

                {/* Basics */}
                <section>
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                        Basics
                    </h2>
                    <div className="mt-4 space-y-5">
                        <Input
                            label="Product Name"
                            name="p-name"
                            placeholder="e.g. Pro Wireless Headphones"
                            value={form.name}
                            onChange={set("name")}
                            error={errors.name}
                        />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Select
                                label="Category"
                                name="p-cat"
                                value={form.category}
                                onChange={set("category")}
                                error={errors.category}
                            >
                                <option value="">Select a category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                            <Select
                                label="Listing Status"
                                name="p-status"
                                value={form.status}
                                onChange={set("status")}
                            >
                                <option value="Active">Active - visible to shoppers</option>
                                <option value="Draft">Draft - hidden</option>
                                <option value="Inactive">Inactive - paused</option>
                            </Select>
                        </div>
                    </div>
                </section>

                {/* Pricing & Inventory */}
                <section>
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                        Pricing &amp; Inventory
                    </h2>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Input
                            label="Price (Rs.)"
                            name="p-price"
                            inputMode="numeric"
                            placeholder="5599"
                            value={form.price}
                            onChange={set("price")}
                            error={errors.price}
                        />
                        <Input
                            label="Compare-at Price (Rs.)"
                            name="p-old"
                            inputMode="numeric"
                            placeholder="Optional"
                            value={form.oldPrice}
                            onChange={set("oldPrice")}
                            error={errors.oldPrice}
                            hint="Shown struck through on the product page."
                        />
                        <Input
                            label="Stock Quantity"
                            name="p-stock"
                            inputMode="numeric"
                            placeholder="10"
                            value={form.stock}
                            onChange={set("stock")}
                            error={errors.stock}
                            hint="Order placement automatically reduces this number."
                        />
                        <Input
                            label="Low Stock Alert Level"
                            name="p-low"
                            inputMode="numeric"
                            value={form.lowStockLevel}
                            onChange={set("lowStockLevel")}
                            error={errors.lowStockLevel}
                        />
                    </div>
                </section>

                {/* Media & Copy */}
                <section>
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                        Media &amp; Copy
                    </h2>

                    <div className="mt-4 space-y-5">
                        <Textarea
                            label="Short Description"
                            name="p-short"
                            rows={2}
                            placeholder="One punchy sentence shown on product cards…"
                            value={form.shortDescription}
                            onChange={set("shortDescription")}
                        />
                        <Textarea
                            label="Full Description"
                            name="p-desc"
                            rows={5}
                            placeholder="Paragraphs separated by a blank line appear as separate blocks."
                            value={form.description}
                            onChange={set("description")}
                        />
                    </div>

                    <div className="mt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="lum-label mb-0">
                                <FaImage className="mr-1.5 inline text-slate-400"/>
                                Product Photos{" "}
                                <span className="ml-1 font-semibold text-slate-400">
                                    ({form.images.length}/{MAX_PHOTOS})
                                </span>
                            </p>

                            <label className="inline-flex w-full cursor-pointer items-center sm:w-auto">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        onPickFiles(e.target.files);
                                        e.target.value = "";
                                    }}
                                />
                                <span
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#E0E0E0] bg-white px-4 text-sm font-semibold text-primary-600 transition-colors hover:border-primary-600 hover:bg-primary-50 sm:h-9 sm:w-auto">
                                    <FaUpload className="text-xs"/>
                                    Upload photos
                                </span>
                            </label>
                        </div>

                        <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-400">
                            JPG/PNG up to 1 MB each (max {MAX_PHOTOS}). The first photo is the cover
                            shown on shop cards.
                        </p>

                        {uploadError && (
                            <p
                                role="alert"
                                className="mt-2 rounded-lg bg-secondary-100/60 px-3 py-2 text-xs font-semibold text-secondary-600"
                            >
                                {uploadError}
                            </p>
                        )}

                        {form.images.length > 0 ? (
                            <div className="mt-3 grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                                {form.images.map((src, i) => (
                                    <div
                                        key={`${String(src).slice(-24)}-${i}`}
                                        className={`group relative overflow-hidden rounded-xl border-2 ${
                                            i === 0
                                                ? "border-primary-600 ring-2 ring-primary-100"
                                                : "border-slate-200"
                                        }`}
                                    >
                                        <img
                                            src={src}
                                            alt={`Shot ${i + 1}`}
                                            className="aspect-square w-full object-cover"
                                        />

                                        {i === 0 && (
                                            <span
                                                className="absolute left-1 top-1 rounded-md bg-primary-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                                                Cover
                                            </span>
                                        )}

                                        {/* Always visible on touch; hover on desktop */}
                                        <div
                                            className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 bg-gradient-to-t from-black/75 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                            {i !== 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => makeCover(i)}
                                                    className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-white"
                                                >
                                                    Make cover
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(i)}
                                                className="ml-auto rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-secondary-600 hover:bg-white"
                                                aria-label={`Remove photo ${i + 1}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className="mt-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
                                No photos yet - upload images from your device.
                            </div>
                        )}
                    </div>
                </section>

                {/* Specifications */}
                <section>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                            Specifications
                        </h2>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={<FaPlus size={10}/>}
                            className="w-full sm:w-auto"
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    specs: [...f.specs, {label: "", value: ""}],
                                }))
                            }
                        >
                            Add row
                        </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                        {form.specs.map((spec, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0"
                            >
                                <input
                                    className="lum-input h-11 w-full"
                                    placeholder="Label (e.g. Battery)"
                                    value={spec.label}
                                    onChange={(e) => setSpec(idx, "label", e.target.value)}
                                    aria-label={`Spec ${idx + 1} label`}
                                />
                                <input
                                    className="lum-input h-11 w-full"
                                    placeholder="Value (e.g. 40 hours)"
                                    value={spec.value}
                                    onChange={(e) => setSpec(idx, "value", e.target.value)}
                                    aria-label={`Spec ${idx + 1} value`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            specs: f.specs.filter((_, i) => i !== idx),
                                        }))
                                    }
                                    className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-400 hover:border-red-300 hover:text-red-500 sm:w-11 sm:gap-0"
                                    aria-label="Remove spec row"
                                >
                                    <FaTrashCan size={13}/>
                                    <span className="sm:hidden">Remove</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer actions */}
                <div
                    className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => navigate("/seller/products")}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={saving}
                        className="w-full sm:w-auto"
                    >
                        {isEdit ? "Save Changes" : "Publish Product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}