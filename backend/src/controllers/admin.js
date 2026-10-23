import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import {mail} from '../utils/mailer.js';
import mongoose from 'mongoose';

const safe = u => {
    if (!u) return null;
    const x = u.toObject();
    delete x.password;
    delete x.verifyToken;
    delete x.resetToken;
    return x
};
export const users = async (req, res) => res.json((await User.find(req.query.role ? {role: req.query.role} : {}).sort({createdAt: -1})).map(safe));
export const user = async (req, res) => {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({message: 'User not found'});
    const orders = await Order.find({customerId: u._id});
    res.json({
        user: safe(u),
        orders,
        stats: {
            totalOrders: orders.length,
            totalSpent: orders.filter(x => x.status !== 'Cancelled').reduce((s, x) => s + x.totalAmount, 0),
            cancelled: orders.filter(x => x.status === 'Cancelled').length
        }
    })
};
export const updateUser = async (req, res) => {
    const allowed = {
        name: req.body.name,
        deliveryFee: req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) : undefined,
        sellerSettings: req.body.sellerSettings,
        phone: req.body.phone,
        storeName: req.body.storeName,
        businessAddress: req.body.businessAddress,
        description: req.body.description
    };
    res.json(safe(await User.findByIdAndUpdate(req.params.id, {$set: allowed}, {new: true})))
};
export const userStatus = async (req, res) => res.json(safe(await User.findByIdAndUpdate(req.params.id, {status: req.body.status}, {new: true})));
export const sellers = async (req, res) => res.json((await User.find({role: 'Seller'})).map(safe));
export const seller = async (req, res) => {
    const s = await User.findOne({_id: req.params.id, role: 'Seller'});
    if (!s) return res.status(404).json({message: 'Seller not found'});
    const products = await Product.find({sellerId: s._id});
    const orders = await Order.find({'items.sellerId': s._id.toString()});
    res.json({
        seller: safe(s),
        products,
        orders,
        stats: {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.status === 'Active').length,
            totalOrders: orders.length,
            lifetimeRevenue: orders.filter(o => o.status === 'Delivered').reduce((a, o) => a + o.totalAmount, 0)
        }
    })
};
export const reviewSeller = async (req, res) => {
    const {approvalStatus, rejectionReason} = req.body;
    if (!['Approved', 'Rejected'].includes(approvalStatus)) return res.status(400).json({message: 'approvalStatus must be Approved or Rejected'});
    const seller = await User.findOneAndUpdate({_id: req.params.id, role: 'Seller'}, {
        approvalStatus,
        status: approvalStatus === 'Approved' ? 'Active' : 'Inactive',
        rejectionReason: approvalStatus === 'Rejected' ? rejectionReason || 'Application was not approved.' : null
    }, {new: true});
    if (!seller) return res.status(404).json({message: 'Seller not found'});
    const decision = approvalStatus === 'Approved' ? 'approved' : 'rejected';
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${seller.verifyToken}`;
    const approvedHtml = approvalStatus === 'Approved' ? `<p>Your seller application has been <strong>Approved</strong>.</p><p>Please verify your email address to activate your account:</p><p style="margin:28px 0;text-align:center;"><a href="${verifyUrl}" class="email-button" style="display:inline-block;padding:13px 24px;background-color:#1F8482;border:1px solid #2a9997;border-radius:8px;color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;text-align:center;">Verify Your Email</a></p><p style="margin:0;font-size:12px;line-height:20px;color:#71717a;">If the button doesn't work, use the following link:</p><p style="margin:8px 0 0 0;word-break:break-all;font-size:12px;line-height:20px;color:#1F8482;">${verifyUrl}</p><p>After verification, you can sign in and manage your store.</p>` : `<p>Your seller application has been <strong>Rejected</strong>.</p><p>Reason: ${seller.rejectionReason}</p>`;
    const approvedText = approvalStatus === 'Approved' ? `Your seller application has been Approved.\n\nVerify your email address: ${verifyUrl}\n\nAfter verification, you can sign in and manage your store.` : `Your seller application has been Rejected.\n\nReason: ${seller.rejectionReason}`;
    mail(seller.email, `Lumina seller application ${decision}`, `Seller application ${decision}`, `<p>Hi <strong>${seller.name}</strong>,</p>${approvedHtml}`, `Hi ${seller.name},\n\n${approvedText}`).catch(console.error);
    return res.json(safe(seller));
};
export const allProducts = async (req, res) => res.json(await Product.find(req.query.sellerId ? {sellerId: req.query.sellerId} : {}));
export const updateInventory = async (req, res) => {
    const filter = req.user.role === 'Seller' ? {_id: req.params.id, sellerId: req.user.sub} : {_id: req.params.id};
    const p = await Product.findOneAndUpdate(filter, {stock: Number(req.body.quantity)}, {new: true});
    res.json(p)
};
export const inventory = async (req, res) => {
    let q = req.user.role === 'Seller' ? {sellerId: req.user.sub} : {};
    if (req.query.view === 'low') q = {...q, stock: {$gt: 0, $lte: 5}};
    if (req.query.view === 'out') q = {...q, stock: 0};
    res.json(await Product.find(q))
};
export const sellerStats = async (req, res) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sub);
    const products = await Product.find({sellerId});
    const orders = await Order.find({'items.sellerId': sellerId}).sort({createdAt: -1});
    const salesOrders = orders.filter(o => o.status !== 'Cancelled');
    const revenue = salesOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const sales = Array.from({length: 12}, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - index), 1);
        const monthOrders = salesOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        });
        return {
            month: date.toLocaleString('en-US', {month: 'short'}),
            revenue: monthOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
            orders: monthOrders.length
        };
    });
    const topProducts = products.map(p => ({
        name: p.name,
        revenue: p.price * (p.soldCount || 0)
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    res.json({
        snapshot: {
            products: products.length,
            orders: orders.length,
            revenue,
            lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockLevel).length,
            outOfStock: products.filter(p => p.stock === 0).length
        }, sales, topProducts, orders
    });
};
export const stats = async (req, res) => {
    const [users, products, orders, customers, sellers, pendingSellers, activeProducts, productDocs] = await Promise.all([User.countDocuments(), Product.countDocuments(), Order.find().sort({createdAt: -1}), User.countDocuments({role: 'Customer'}), User.countDocuments({role: 'Seller'}), User.countDocuments({
        role: 'Seller',
        approvalStatus: 'Pending'
    }), Product.countDocuments({status: 'Active'}), Product.find().select('category price soldCount')]);
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const ordersByStatus = statuses.map(name => ({name, value: orders.filter(o => o.status === name).length}));
    const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const sales = Array.from({length: 12}, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - index), 1);
        const month = date.toLocaleString('en-US', {month: 'short'});
        const monthOrders = orders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        });
        return {
            month,
            revenue: monthOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
            orders: monthOrders.length
        };
    });
    const productCategory = Object.fromEntries(productDocs.map(p => [String(p._id), p.category]));
    const categoryTotals = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(order => (order.items || []).forEach(item => {
        const category = productCategory[String(item.productId)] || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(item.price || 0) * Number(item.qty || item.quantity || 1);
    }));
    const categorySplit = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value
    })).filter(x => x.value > 0);
    res.json({
        snapshot: {
            users,
            products,
            totalUsers: users,
            totalCustomers: customers,
            totalSellers: sellers,
            pendingSellers,
            totalProducts: products,
            activeProducts,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'Pending').length,
            lowStock: await Product.countDocuments({stock: {$gt: 0, $lte: 5}}),
            outOfStock: await Product.countDocuments({stock: 0}),
            avgOrderValue: orders.length ? revenue / orders.length : 0,
            orders: orders.length,
            revenue,
            ordersByStatus,
            categorySplit
        }, categorySplit, sales, orders
    });
};
export const categories = async (req, res) => res.json(await Category.find());
export const updateCategory = async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, {new: true}));
export const deleteCategory = async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).end()
};