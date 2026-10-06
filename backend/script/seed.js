import "dotenv/config";
import bcrypt from "bcryptjs";
import connect from "../src/config/db.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";

await connect();
const password = await bcrypt.hash("Lumina@2026", 12);
await User.deleteMany({});
await Product.deleteMany({});
await Category.deleteMany({});
const [admin, customer, seller] = await User.create([
    {
        name: "Admin User",
        email: "admin@lumina.lk",
        password,
        role: "Administrator",
    },
    {
        name: "John Doe",
        email: "john.doe@example.com",
        password,
        role: "Customer",
    },
    {
        name: "Demo Seller",
        email: "seller@lumina.lk",
        password,
        role: "Seller",
        approvalStatus: "Approved",
    },
]);
await Category.insertMany(
    ["Electronics", "Fashion", "Home", "Beauty", "Toys", "Groceries"].map(
        (name) => ({name}),
    ),
);
await Product.insertMany([
    {
        name: "Aura Wireless Headphones",
        description: "Wireless audio",
        price: 24900,
        category: "Electronics",
        stock: 25,
        sellerId: seller._id,
        status: "Active",
        featured: true,
    },
    {
        name: "Ceylon Cotton Tee",
        description: "Soft cotton tee",
        price: 4500,
        category: "Fashion",
        stock: 40,
        sellerId: seller._id,
        status: "Active",
    },
]);
console.log("Seed complete");
process.exit();