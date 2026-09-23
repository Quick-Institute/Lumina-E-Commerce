import React from "react";
import {FaMinus, FaPlus} from "react-icons/fa";

export default function QuantityStepper({value, min = 1, max = 99, onChange, size = "md"}) {
    const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
    const btn = `${dim} flex items-center justify-center text-slate-500 transition-colors hover:text-primary-700 disabled:opacity-30 disabled:hover:text-slate-500`;
    return (
        <div
            className={`inline-flex items-center rounded-lg border border-slate-300 bg-white ${size === "sm" ? "" : "overflow-visible"}`}>
            <button type="button" className={btn} disabled={value <= min}
                    onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease quantity">
                <FaMinus size={10}/>
            </button>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n >= min) onChange(Math.min(n, max));
                }}
                className="w-10 border-x border-slate-200 bg-transparent py-1 text-center text-sm font-semibold text-ink-900 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Quantity"
            />
            <button type="button" className={btn} disabled={value >= max}
                    onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity">
                <FaPlus size={10}/>
            </button>
        </div>
    );
}