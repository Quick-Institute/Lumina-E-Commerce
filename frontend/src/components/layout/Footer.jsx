import React, {useState} from "react";
import {Link} from "react-router-dom";
import Button from "../ui/Button";
import {useToast} from "../../context/ToastContext";
import {FaPhone, FaEnvelope, FaMapLocation} from "react-icons/fa6";
import {FaFacebookSquare, FaYoutube, FaLinkedin, FaWhatsappSquare} from "react-icons/fa";

const COLS = [
    {
        title: "About",
        links: [
            {label: "Our Story", to: "/our-story"},
            {label: "Careers", to: "/careers"},
            {label: "Press", to: "/press"},
            {label: "Blog", to: "/blog"},
        ],
    },
    {
        title: "Help",
        links: [
            {label: "Customer Service", to: "/customer-service"},
            {label: "Returns", to: "/returns"},
            {label: "Shipping Info", to: "/shipping-info"},
            {label: "Privacy Policy", to: "/privacy-policy"},
        ],
    },
];

export default function Footer() {
    const [email, setEmail] = useState("");
    const {notify} = useToast();

    const subscribe = (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            notify("Enter a valid email address", "error");
            return;
        }
        notify("Subscribed! Exclusive offers are on their way.");
        setEmail("");
    };

    return (
        <footer className="mt-20 bg-ink-900 text-slate-300">
            <div className="lum-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
                <div>
                    <p className="text-3xl font-extrabold tracking-tight text-teal-700">Lumina</p>
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                        Your one-stop destination for premium products. Quality, style, and convenience in
                        every order.
                    </p>
                    {/* Contact Information */}
                    <div className="mt-6 space-y-5 text-sm text-slate-400">
                        <div className="flex items-center gap-5">
                            <FaPhone className="text-teal-500" />
                            <a href="tel:+94762944551" className="hover:text-teal-500">+94 76 294 4551 (Hotline)</a>
                        </div>
                        <div className="flex items-center gap-5">
                            <FaEnvelope className="text-teal-500" />
                            <a href="mailto:chamindugayanuka2002@gmail.com" className="hover:text-teal-500">chamindugayanuka2002@gmail.com</a>
                        </div>
                        <div className="flex items-center gap-5">
                            <FaMapLocation className="text-teal-500 w-4 h-4" />
                            <span>No.123, Kiula Place, Upper Street, Padiyathalawa.</span>
                        </div>
                    </div>
                </div>

                {COLS.map((col) => (
                    <nav key={col.title} aria-label={col.title}>
                        <h3 className="text-base font-bold text-white">{col.title}</h3>
                        <ul className="mt-4 space-y-3">
                            {col.links.map((l) => (
                                <li key={l.label}>
                                    <Link to={l.to}
                                          className="text-sm text-slate-400 transition-colors hover:text-primary-300">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}

                <div>
                    <h3 className="text-base font-bold text-white">Stay Connected</h3>
                    <p className="mt-4 text-sm text-slate-400">Subscribe for exclusive offers</p>
                    <form onSubmit={subscribe}
                          className="mt-3 flex max-w-sm overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 focus-within:bg-cyan-700">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            aria-label="Email address"
                            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <Button type="submit" className="h-auto rounded-none px-5 py-3">
                            Join
                        </Button>
                    </form>
                    {/*Social Media Links*/}
                    <div className="mt-6 flex gap-2.5">
                        <a href="https://web.facebook.com/chamindu.gayanuka.1" target="_blank" rel="noopener noreferrer"
                           className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-blue-700 hover:text-white">
                            <FaFacebookSquare size={14} />
                        </a>
                        <a href="https://www.youtube.com/@chamindugayanuka/" target="_blank" rel="noopener noreferrer"
                           className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-red-500 hover:text-white">
                            <FaYoutube size={14} />
                        </a>
                        <a href="https://www.linkedin.com/in/chamindu-gayanuka-244585270/" target="_blank" rel="noopener noreferrer"
                           className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-blue-700 hover:text-white">
                            <FaLinkedin size={14} />
                        </a>
                        <a href="https://wa.me/94762944551" target="_blank" rel="noopener noreferrer"
                           className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-green-500 hover:text-white">
                            <FaWhatsappSquare size={14} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <p className="lum-container py-3 text-center text-sm text-slate-500">
                    2026 Lumina Inc. All rights reserved.
                </p>
            </div>
        </footer>
    );
}