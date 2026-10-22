import React, {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";

export default function Dropdown({trigger, children, align = "right", width = "w-56", className = "", dropUp = false}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const close = () => setOpen(false);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="focus:outline-none"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {trigger(open)}
            </button>
            {open && (
                <div
                    className={`absolute ${align === "right" ? "right-0" : "left-0"} ${dropUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"} ${width} z-50 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lift`}
                    role="menu"
                >
                    {React.Children.map(children, (child) =>
                        React.isValidElement(child) && child.type === DropdownItem
                            ? React.cloneElement(child, {onNavigate: close})
                            : child
                    )}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({icon, danger, onClick, children, className = "", to, onNavigate}) {
    const cls = `flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-ink-700 hover:bg-slate-50"
    } ${className}`;
    const content = (
        <>
            {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
            <span className="truncate">{children}</span>
        </>
    );
    if (to) {
        return (
            <Link to={to} role="menuitem" className={cls} onClick={onNavigate}>
                {content}
            </Link>
        );
    }
    return (
        <button
            type="button"
            role="menuitem"
            className={cls}
            onClick={(e) => {
                if (onClick) onClick(e);
                if (onNavigate) onNavigate();
            }}
        >
            {content}
        </button>
    );
}

export function DropdownDivider() {
    return <div className="my-1.5 border-t border-slate-100" role="separator"/>;
}