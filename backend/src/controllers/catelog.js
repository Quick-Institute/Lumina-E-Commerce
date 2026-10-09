import mongoose from "mongoose";
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';

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
    const q = {status: status || 'Active'};
    if (category) q.category = category;
    if (sellerId) q.sellerId = sellerId;
    if (search) q.$or = [{name: {$regex: search, $options: 'i'}}, {description: {$regex: search, $options: 'i'}}];
    if (min || max) q.price = {...(min && {$gte: +min}), ...(max && {$lte: +max})};
    if (availability === 'in') q.stock = {$gt: 0};
    if (availability === 'out') q.stock = 0;
    const sortQ = sort === 'price-asc' ? {price: 1} : sort === 'price-desc' ? {price: -1} : sort === 'rating' ? {rating: -1} : sort === 'popular' ? {soldCount: -1} : {createdAt: -1};
    const total = await Product.countDocuments(q), pages = Math.max(1, Math.ceil(total / +perPage)),
        p = Math.min(Math.max(1, +page), pages);
    res.json({
        items: await Product.find(q).sort(sortQ).skip((p - 1) * +perPage).limit(+perPage),
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

        const p = await Product.findById(id);

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
export const create = async (req, res) => res.status(201).json(await Product.create({
    ...req.body,
    sellerId: req.user.sub
}));
export const update = async (req, res) => res.json(await Product.findOneAndUpdate({_id: req.params.id, ...(req.user.role === 'Seller' ? {sellerId: req.user.sub} : {})}, req.body, {new: true}));
export const remove = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).end()
};
export const categories = async (req, res) => res.json(await Category.find({status: 'Active'}));
export const createCategory = async (req, res) => res.status(201).json(await Category.create(req.body));
export const reviews = async (req, res) => res.json(await Review.find({productId: req.params.id}).sort({createdAt: -1}));

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