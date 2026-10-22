import mongoose from "mongoose";
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import {uploadToCloudinary} from '../utils/cloudinary.js';
import cloudinary from '../config/cloudinary.js';

export async function products(req, res) {
    const {
        search = '',
        category,
        min,
        max,
        availability = 'all',
        sort = 'newest',
        page = 1,
        perPage = 12,
        sellerId,
        status
    } = req.query;
    const q = status ? {status} : (String(req.query.includeAll) === 'true' ? {} : {status: 'Active'});
    if (category) q.category = category;
    if (req.query.categories) q.category = {$in: Array.isArray(req.query.categories) ? req.query.categories : String(req.query.categories).split(',')};
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) q.sellerId = sellerId;
    if (req.query.featured === 'true') q.featured = true;
    if (req.query.popular === 'true') q.popular = true;
    if (search) q.$or = [{name: {$regex: search, $options: 'i'}}, {description: {$regex: search, $options: 'i'}}];
    if (min || max) q.price = {...(min && {$gte: +min}), ...(max && {$lte: +max})};
    if (availability === 'in') q.stock = {$gt: 0};
    if (availability === 'out') q.stock = 0;
    const sortQ = sort === 'price-asc' ? {price: 1} : sort === 'price-desc' ? {price: -1} : sort === 'rating' ? {rating: -1} : sort === 'popular' ? {soldCount: -1} : {createdAt: -1};
    const total = await Product.countDocuments(q), pages = Math.max(1, Math.ceil(total / +perPage)),
        p = Math.min(Math.max(1, +page), pages);
    res.json({
        items: await Product.find(q).populate('sellerId', 'name storeName avatar').sort(sortQ).skip((p - 1) * +perPage).limit(+perPage),
        total,
        page: p,
        pages,
        perPage: +perPage
    });
}

export const product = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'Product ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const p = await Product.findById(id).populate('sellerId', 'name storeName avatar');

        if (!p) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        return res.json(p);

    } catch (error) {
        console.error('Get product error:', error);

        return res.status(500).json({
            message: 'Unable to load product'
        });
    }
};
export const create = async (req, res) => {
    const data = {...req.body, sellerId: req.user.sub};
    for (const key of ['description', 'specifications', 'specs', 'images']) if (typeof data[key] === 'string') {
        try {
            data[key] = JSON.parse(data[key]);
        } catch {
        }
    }
    if (Array.isArray(data.description)) data.description = data.description.join('\n\n');
    if (data.specs && !data.specifications) data.specifications = data.specs;
    if (data.specifications && !data.specs) data.specs = data.specifications;
    if (data.specs && !data.specifications) data.specifications = data.specs;
    if (data.specifications && !data.specs) data.specs = data.specifications;

    if (req.files?.length) {
        const uploaded = await Promise.all(req.files.map(file => uploadToCloudinary(file.buffer, 'lumina/products')));
        data.images = uploaded.map(file => file.secure_url);
        data.image = data.images[0];
        data.imagePublicId = uploaded[0].public_id;
        data.imagePublicIds = uploaded.map(file => file.public_id);
    }
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    res.status(201).json(await Product.create(data));
};
export const update = async (req, res) => {
    const filter = {_id: req.params.id, ...(req.user.role === 'Seller' ? {sellerId: req.user.sub} : {})};
    const data = {...req.body};
    for (const key of ['description', 'specifications', 'specs', 'images']) if (typeof data[key] === 'string') {
        try {
            data[key] = JSON.parse(data[key]);
        } catch {
        }
    }
    if (Array.isArray(data.description)) data.description = data.description.join('\n\n');
    if (data.specs && !data.specifications) data.specifications = data.specs;
    if (data.specifications && !data.specs) data.specs = data.specifications;

    if (req.files?.length) {
        const old = await Product.findOne(filter);
        const uploaded = await Promise.all(req.files.map(file => uploadToCloudinary(file.buffer, 'lumina/products')));
        data.images = uploaded.map(file => file.secure_url);
        data.image = data.images[0];
        data.imagePublicId = uploaded[0].public_id;
        data.imagePublicIds = uploaded.map(file => file.public_id);
        const oldIds = old?.imagePublicIds?.length ? old.imagePublicIds : (old?.imagePublicId ? [old.imagePublicId] : []);
        await Promise.all(oldIds.map(id => cloudinary.uploader.destroy(id).catch(console.error)));
    }
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    const updated = await Product.findOneAndUpdate(filter, data, {new: true});
    if (!updated) return res.status(404).json({message: 'Product not found or not owned by this seller'});
    res.json(updated);
};
export const remove = async (req, res) => {
    const filter = {_id: req.params.id, ...(req.user.role === 'Seller' ? {sellerId: req.user.sub} : {})};
    const p = await Product.findOneAndDelete(filter);
    if (p?.imagePublicId) cloudinary.uploader.destroy(p.imagePublicId).catch(console.error);
    res.status(204).end()
};
export const publicSeller = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({message: 'Store not found'});
    const seller = await User.findOne({
        _id: req.params.id,
        role: 'Seller',
        approvalStatus: 'Approved'
    }).select('name email phone storeName businessAddress description avatar deliveryFee approvalStatus createdAt sellerSettings');
    if (!seller) return res.status(404).json({message: 'Store not found'});
    const products = await Product.find({
        sellerId: seller._id,
        status: 'Active'
    }).populate('sellerId', 'name storeName avatar');
    const ratedProducts = products.filter(p => Number(p.rating) > 0);
    const averageRating = ratedProducts.length ? ratedProducts.reduce((sum, p) => sum + Number(p.rating), 0) / ratedProducts.length : 0;
    const completedOrders = await Order.countDocuments({'items.sellerId': seller._id, status: 'Delivered'});
    const data = seller.toObject();
    data.productsCount = products.length;
    data.ordersCompleted = completedOrders;
    data.responseRate = data.responseRate ?? 100;
    data.joinedAt = data.createdAt;
    data.rating = averageRating;
    res.json({seller: data, products});
};
export const categories = async (req, res) => res.json(await Category.find({status: 'Active'}));
export const createCategory = async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({message: 'Category name is required'});
    const existing = await Category.findOne({name});
    if (existing) return res.status(409).json({message: 'Category already exists'});
    return res.status(201).json(await Category.create({...req.body, name}));
};
export const reviews = async (req, res) => res.json(await Review.find({productId: req.params.id}).populate('userId', 'name avatar').sort({createdAt: -1}));

export async function addReview(req, res) {
    const r = await Review.create({
        productId: req.params.id,
        userId: req.user.sub,
        rating: req.body.rating,
        comment: req.body.comment
    });
    const a = await Review.aggregate([{$match: {productId: r.productId}}, {
        $group: {
            _id: null,
            avg: {$avg: '$rating'},
            count: {$sum: 1}
        }
    }]);
    await Product.findByIdAndUpdate(r.productId, {rating: a[0].avg, reviewCount: a[0].count});
    res.status(201).json(r);
}