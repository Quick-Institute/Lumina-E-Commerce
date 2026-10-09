import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({products = [], columns = 4, className = ""}) {
    const cols = {
        2: "sm:grid-cols-2",
        3: "sm:grid-cols-2 lg:grid-cols-3",
        4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    }[columns] || "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    return (
        <div className={`grid grid-cols-1 gap-5 ${cols} ${className}`}>
            {products.map((p) => (
                <ProductCard key={p._id} product={p}/>
            ))}
        </div>
    );
}
