# ✨ Lumina E-Commerce Marketplace

A modern, full-stack, multi-vendor e-commerce platform built using the **MERN Stack** 🚀

---

## 🌟 Project Overview

**Lumina**  is a secure and user-friendly online marketplace where customers can shop from different sellers.

The platform supports three main user roles:

- **Administrator** – Manages and monitors the entire platform.
- **Customer (Buyer)** – Browses products, manages the shopping cart, and places orders.
- **Seller** – Manages products, inventory, and customer orders.

Lumina aims to provide a smooth shopping experience with an elegant, user-friendly interface and efficient backend management.

---

## 🎯 Project Objectives

- 🛒 Provide a seamless online shopping experience.
- 🏪 Allow multiple sellers to manage their products.
- 🔐 Implement secure authentication and role-based access.
- 📦 Support efficient inventory and order management.
- 📊 Provide administrative and seller dashboards.
- 📱 Deliver a responsive experience across devices.
- ⚡ Build a scalable application using the MERN stack.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

- User registration and login.
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected routes and dashboards.
- Separate permissions for each user role.

### 📦 Product Management

- Add new products.
- Update product information.
- Manage products.
- Search products.
- Filter products by category.
- Sort products.
- Manage product prices.
- Track product stock.
- Seller-specific product management.

### 👤 Customer Features

- Browse available products.
- Search and filter products.
- View detailed product information.
- Add products to cart.
- Update item quantities.
- Remove cart items.
- Proceed to checkout.
- Manage delivery information.
- Place Cash on Delivery (COD) orders. 
- View order history.
- Track order status.

### 🛒 Shopping Cart & Checkout

- Customer-specific shopping cart.
- Add, update, and remove cart items.
- Automatic total calculation.
- Checkout summary.
- Delivery address management.
- Order creation.
- Inventory availability validation.

### 💵 Payment Management

Lumina currently supports **Cash on Delivery (COD)**.

Payment statuses:

- ⏳ Pending
- ✅ Paid
- ❌ Failed

Payment information is associated with the relevant order for tracking and management.

### 📦 Order Management

Order statuses:

🕒 **Pending** → ⚙️ **Processing** → 🚚 **Shipped** → ✅ **Delivered**

Additional status:

- ❌ Canceled

Customers can view their orders and track order progress.

Sellers and administrators can manage orders according to their assigned permissions.

### 📊 Inventory Management

- Track product stock.
- Record inventory transactions.
- Update stock during order processing.
- Monitor product availability.
- Support seller inventory management.

---

## 🌐 Technology Stack

### 🎨 Frontend

- React
- Tailwind CSS
- Axios
- Responsive UI Design

### ⚙️ Backend

- Node.js
- Express.js
- RESTful APIs
- JWT Authentication
- bcrypt Password Hashing

### 📂 Database

- MongoDB 
- Mongoose

---

## 𖡎 System Architecture

Lumina follows a **Client–Server Architecture**.

```text
        🎨 FRONTEND
    React + Tailwind CSS
             │
             │
             │ HTTP Requests
             │
             ▼
       ⚙️ BACKEND
    Node.js + Express
             │
             │
             │ Mongoose
             │
             ▼
       📂 DATABASE
         MongoDB
```

### 🔄 Architecture Workflow

1. 👤 The user interacts with the React frontend.
2. 🔗 The frontend sends requests to the backend API.
3. ⚙️ The backend processes business logic.
4. 🔐 Authentication and authorization are validated.
5. 📂 The backend communicates with MongoDB.
6. 📤 The response is returned to the frontend.

---

## 🗄️ Database Collections

| Collection | Description |
|---|---|
| `users` | Stores administrator, customer, and seller accounts |
| `categories` | Stores product categories |
| `products` | Stores product details and seller ownership |
| `carts` | Stores customer shopping cart information |
| `orders` | Stores customer orders and delivery details |
| `payments` | Stores payment information and statuses |
| `inventoryTransactions` | Stores inventory stock movements |

---

## 👨‍💻 Author

### ✨ Chamindu Gayanuka Dharmasiri

🎓 Software Engineering Undergraduate  
💻 Software Developer & UI/UX Designer

🔗 **GitHub:**  
https://github.com/Chamindu-Gayanuka

---

<div align="center">

### 🌟 Lumina E-Commerce Marketplace

**✨ Discover. Shop. Sell. Experience Lumina. ✨**

🚀 Built with the MERN Stack

</div>