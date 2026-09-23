import React from "react";
import {Link} from "react-router-dom";

export default function Tabs({items, active, onChange, variant = "underline", className = ""}) {
    if (variant === "pill") {
        return (
            <div className={`flex gap-1.5 overflow-x-auto rounded-xl bg-slate-100 p-1 ${className}`}>
                {items.map((it) => (
                    <button
                        key={it.key}
                        type="button"
                        onClick={() => onChange && onChange(it.key)}
                        className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            active === it.key ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-ink-800"
                        }`}
                    >
                        {it.label}
                    </button>
                ))}
            </div>
        );
    }
    return (
        <div className={`flex gap-1 overflow-x-auto border-b border-slate-200 ${className}`} role="tablist">
            {items.map((it) => {
                const isActive = active === it.key;
                const inner = (
                    <>
                        {it.label}
                        {it.count !== undefined && (
                            <span
                                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"}`}>
                {it.count}
              </span>
                        )}
                    </>
                );
                const cls = `relative flex items-center whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "text-primary-700" : "text-slate-500 hover:text-ink-800"
                }`;
                return it.to ? (
                    <Link key={it.key} to={it.to} className={cls} role="tab">
                        {inner}
                        {isActive &&
                            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"/>}
                    </Link>
                ) : (
                    <button key={it.key} type="button" onClick={() => onChange && onChange(it.key)} className={cls}
                            role="tab">
                        {inner}
                        {isActive &&
                            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"/>}
                    </button>
                );
            })}
        </div>
    );
}