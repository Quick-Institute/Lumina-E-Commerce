import "dotenv/config";
import bcrypt from "bcryptjs";

import connect from "../src/config/db.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import Order from "../src/models/Order.js";

const CUSTOMER_ID = "6ac784b030ef89c9e9634f4c";

const password = await bcrypt.hash("Lumina@2026", 12);

try {
    await connect();

    // 1. Find the existing customer. Do not delete users.
    const customer = await User.findById(CUSTOMER_ID);

    if (!customer) {
        throw new Error(
            `Customer not found: ${CUSTOMER_ID}. Check the customer ID in MongoDB.`
        );
    }

    // 2. Find an existing seller or create a demo seller.
    let seller = await User.findOne({role: "Seller"});

    if (!seller) {
        seller = await User.create({
            name: "Demo Seller",
            email: "seller@lumina.lk",
            password,
            role: "Seller",
            approvalStatus: "Approved",
        });
    }

    // 3. Ensure categories exist without deleting existing categories.
    const categoryNames = [
        "Electronics",
        "Fashion",
        "Home",
        "Beauty",
        "Toys",
        "Groceries",
    ];

    for (const name of categoryNames) {
        await Category.updateOne(
            {name},
            {$setOnInsert: {name}},
            {upsert: true}
        );
    }

    // 4. Add products only when they do not already exist.
    const productData = [
        {
            name: "Aura Wireless Headphones",
            description: "Wireless audio",
            price: 24900,
            category: "Electronics",
            stock: 25,
            featured: true,
        },
        {
            name: "Ceylon Cotton Tee",
            description:
                "Soft and breathable cotton T-shirt for everyday comfort.",
            price: 4500,
            category: "Fashion",
            stock: 40,
        },
        {
            name: "Smart Fitness Watch",
            description:
                "Track daily activity, heart rate, and workouts.",
            price: 12900,
            category: "Electronics",
            stock: 18,
            featured: true,
        },
        {
            name: "Wireless Bluetooth Speaker",
            description:
                "Portable Bluetooth speaker with clear sound and powerful bass.",
            price: 8500,
            category: "Electronics",
            stock: 30,
        },
        {
            name: "Classic Ceramic Mug Set",
            description:
                "A stylish ceramic mug set for home and office use.",
            price: 3200,
            category: "Home",
            stock: 50,
        },
        {
            name: "Ceylon Herbal Face Wash",
            description:
                "Gentle herbal face wash for everyday skincare.",
            price: 1800,
            category: "Beauty",
            stock: 35,
        },
        {
            name: "Educational Building Blocks",
            description:
                "Colourful building blocks for creative play and learning.",
            price: 2900,
            category: "Toys",
            stock: 22,
        },
        {
            name: "Premium Ceylon Tea Pack",
            description:
                "Aromatic Ceylon black tea sourced from Sri Lanka.",
            price: 1500,
            category: "Groceries",
            stock: 60,
        },
    ];

    for (const data of productData) {
        const existingProduct = await Product.findOne({
            name: data.name,
        });

        if (!existingProduct) {
            await Product.create({
                ...data,
                sellerId: seller._id,
                status: "Active",
            });

            console.log(`Product added: ${data.name}`);
        }
    }

    // 5. Load products for creating orders.
    const products = await Product.find({
        name: {
            $in: [
                "Aura Wireless Headphones",
                "Ceylon Cotton Tee",
                "Smart Fitness Watch",
                "Wireless Bluetooth Speaker",
                "Classic Ceramic Mug Set",
                "Premium Ceylon Tea Pack",
            ],
        },
    });

    const productMap = new Map(
        products.map((product) => [product.name, product])
    );

    function makeItem(name, quantity) {
        const product = productMap.get(name);

        if (!product) {
            throw new Error(`Product not found: ${name}`);
        }

        return {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images?.[0] || "",
            seedData: true,
        };
    }

    function makeOrderItems(entries) {
        return entries.map(([name, quantity]) =>
            makeItem(name, quantity)
        );
    }

    function calculateSubtotal(items) {
        return items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    // 6. Remove only orders created by this seed script.
    // Real customer orders are preserved.
    await Order.deleteMany({
        customerId: customer._id,
        "items.seedData": true,
    });

    // Update these sample address fields to match your checkout schema.
    const deliveryAddress = {
        fullName: customer.name,
        phone: "0771234567",
        addressLine1: "Main Street",
        city: "Padiyathalawa",
        district: "Ampara",
        postalCode: "",
        country: "Sri Lanka",
    };

    // 7. Create sample orders for the existing customer.
    const orderData = [
        {
            items: makeOrderItems([
                ["Aura Wireless Headphones", 1],
                ["Ceylon Cotton Tee", 1],
            ]),
            status: "Pending",
            paymentStatus: "Pending",
        },
        {
            items: makeOrderItems([
                ["Smart Fitness Watch", 1],
                ["Premium Ceylon Tea Pack", 2],
            ]),
            status: "Processing",
            paymentStatus: "Pending",
        },
        {
            items: makeOrderItems([
                ["Wireless Bluetooth Speaker", 1],
                ["Classic Ceramic Mug Set", 1],
            ]),
            status: "Delivered",
            paymentStatus: "Paid",
        },
    ];

    for (const data of orderData) {
        const subtotal = calculateSubtotal(data.items);
        const deliveryFee = subtotal >= 5000 ? 0 : 450;

        await Order.create({
            customerId: customer._id,
            items: data.items,
            deliveryAddress,
            subtotal,
            deliveryFee,
            totalAmount: subtotal + deliveryFee,
            paymentMethod: "COD",
            paymentStatus: data.paymentStatus,
            status: data.status,
        });
    }

    console.log("Seed complete!");
    console.log(`Customer preserved: ${customer._id}`);
    console.log(`Seller: ${seller._id}`);
    console.log(`Products available: ${productMap.size}`);
    console.log(`Sample orders created: ${orderData.length}`);
} catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
} finally {
    await import("mongoose").then(({default: mongoose}) =>
        mongoose.disconnect()
    );
}