import React, {useState} from "react";
import {Link} from "react-router-dom";
import {FaCircleCheck, FaClock, FaEnvelope, FaPhone, FaStore, FaUser} from "react-icons/fa6";
import {AuthShell} from "../../layouts/AuthShell";
import Button from "../../components/ui/Button";
import Input, {Checkbox, PasswordInput, Textarea} from "../../components/ui/Input";
import {ValidationSummary} from "../../components/ui/States";
import {hasErrors, isEmail, isPhone, matches, minLength, required, validate} from "../../utils/validation";
import {registerSeller} from "../../services/authService";

function SectionHead({icon, tone, title, sub}) {
    return (
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
            <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink-900">{title}</h2>
                <p className="text-sm text-slate-400">{sub}</p>
            </div>
        </div>
    );
}

export default function SellerRegister() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirm: "",
        storeName: "",
        businessAddress: "",
        description: "",
        terms: false,
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const set = (key) => (e) => setForm((f) => ({
        ...f,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value
    }));

    const submit = async (e) => {
        e.preventDefault();
        setFormError("");
        const errs = validate(form, {
            name: [(v) => required(v, "Full name")],
            email: [(v) => required(v, "Email"), isEmail],
            phone: [(v) => required(v, "Phone"), isPhone],
            password: [(v) => minLength(v, 8, "Password")],
            confirm: [(v) => matches(v, form.password, "Passwords")],
            storeName: [(v) => required(v, "Store name")],
            businessAddress: [(v) => required(v, "Business address")],
        });
        if (!form.terms) errs.terms = "You must accept the seller agreement";
        setErrors(errs);
        if (hasErrors(errs)) return;
        setSubmitting(true);
        try {
            await registerSeller(form);
            setDone(true);
        } catch (err) {
            setFormError(err.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <AuthShell>
                <div className="lum-card p-10 text-center">
          <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            <FaCircleCheck/>
          </span>
                    <h1 className="mt-6 text-2xl font-extrabold text-ink-900">Application submitted!</h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                        Thanks, {form.name || "seller"} - your store <strong
                        className="text-ink-800">{form.storeName}</strong> is now
                        pending manual review by the Lumina team. You&apos;ll hear from{" "}
                        <span className="font-semibold text-ink-800">{form.email}</span> within 2 business days.
                    </p>
                    <div className="mt-8 flex justify-center gap-3">
                        <Button as={Link} to="/login" size="lg">Go to Login</Button>
                        <Button as={Link} to="/" size="lg" variant="secondary">Back to store</Button>
                    </div>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell wide>
            <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Become a Seller</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                    Create your store account and join our global community of artisans and brands.
                </p>
                <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700 ring-1 ring-primary-100">
                    <FaClock size={11}/> Your account will be reviewed by our team before activation
                </p>
            </div>

            <div className="lum-card mt-8 p-6 sm:p-10">
                <form onSubmit={submit} noValidate>
                    {formError && <ValidationSummary errors={{_: formError}}/>}

                    <SectionHead icon={<FaUser className="text-primary-600" size={18}/>} tone="bg-primary-50"
                                 title="Personal Information" sub="Provide your basic contact details."/>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Input label="Full Name" name="seller-name" placeholder="John Doe" value={form.name}
                               onChange={set("name")} error={errors.name}/>
                        <Input label="Email Address" name="seller-email" type="email" icon={FaEnvelope}
                               placeholder="jane@example.com" value={form.email} onChange={set("email")}
                               error={errors.email}/>
                        <Input label="Phone Number" name="seller-phone" icon={FaPhone} placeholder="+94 76 xxx xxxx"
                               value={form.phone} onChange={set("phone")} error={errors.phone} inputMode="tel"/>
                        <div className="hidden sm:block"/>
                        <PasswordInput label="Password" name="seller-password" placeholder="••••••••••••••••"
                                       value={form.password} onChange={set("password")} error={errors.password}/>
                        <PasswordInput label="Confirm Password" name="seller-confirm" placeholder="••••••••••••••••"
                                       value={form.confirm} onChange={set("confirm")} error={errors.confirm}/>
                    </div>

                    <div className="my-9 border-t border-slate-100"/>

                    <SectionHead icon={<FaStore className="text-orange-500" size={18}/>} tone="bg-orange-50"
                                 title="Business Information" sub="Details about your store and location."/>
                    <div className="mt-6 space-y-5">
                        <Input wrapperClassName="sm:max-w-lg" className="" label="Business / Store Name"
                               name="store-name" placeholder="The SoundMaster Official" value={form.storeName}
                               onChange={set("storeName")} error={errors.storeName}/>
                        <Textarea label="Business Address" name="biz-address" rows={3}
                                  placeholder="Street, City, State, Zip Code, Country" value={form.businessAddress}
                                  onChange={set("businessAddress")} error={errors.businessAddress}/>
                        <Textarea label="Store Description" name="biz-desc" rows={3}
                                  placeholder="Briefly describe what you sell and your brand story…"
                                  value={form.description} onChange={set("description")}/>
                    </div>

                    <div className="mt-7">
                        <Checkbox
                            name="seller-terms"
                            checked={form.terms}
                            onChange={set("terms")}
                            label={
                                <span className="text-sm leading-relaxed text-slate-500">
                  I agree to the{" "}
                                    <Link to="/seller-terms-and-conditions"
                                          className="font-semibold text-primary-700 hover:underline">Seller Terms &amp; Conditions</Link>,{" "}
                                    <Link to="/marketplace-policy"
                                          className="font-semibold text-primary-700 hover:underline">Marketplace Policy</Link>, and understand that my store
                  application is subject to manual review
                </span>
                            }
                        />
                        {errors.terms && <p className="ml-7 mt-1 text-xs font-medium text-red-600">{errors.terms}</p>}
                    </div>

                    <Button type="submit" size="lg" fullWidth className="mt-7" loading={submitting}>
                        Register as Seller
                    </Button>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-slate-400">
                            Already have a seller account?{" "}
                            <Link to="/login" className="font-bold text-primary-700 hover:underline">Login</Link>
                        </p>
                        <p>
                            <Link to="/register"
                                  className="text-slate-400 underline-offset-2 hover:text-primary-700 hover:underline">
                                Register as a Customer instead
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </AuthShell>
    );
}