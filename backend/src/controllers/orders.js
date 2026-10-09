import Order from '../models/Order.js';
import Product from '../models/Product.js';

export async function create(req, res) {
    const {items = [], deliveryAddress, deliveryFee = 0} = req.body;
    const ps = await Product.find({_id: {$in: items.map(i => i.productId)}, status: 'Active'});
    const m = new Map(ps.map(p => [p._id.toString(), p]));
    for (const i of items) {
        const p = m.get(i.productId);
        if (!p || p.stock < i.qty) return res.status(409).json({message: 'Insufficient stock'})
    }
    const lines = items.map(i => {
        const p = m.get(i.productId);
        return {...i, name: p.name, price: p.price, sellerId: p.sellerId}
    }), subtotal = lines.reduce((s, i) => s + i.price * i.qty, 0);
    for (const i of lines) await Product.updateOne({_id: i.productId}, {$inc: {stock: -i.qty, soldCount: i.qty}});
    res.status(201).json(await Order.create({
        customerId: req.user.sub,
        items: lines,
        deliveryAddress,
        deliveryFee,
        subtotal,
        totalAmount: subtotal + deliveryFee
    }));
}

export const mine = async (req, res) => res.json(await Order.find({customerId: req.user.sub}).sort({createdAt: -1}));
export const sellerOrders = async (req, res) => {
    const orders = await Order.find({'items.sellerId': req.user.sub}).sort({createdAt: -1});
    res.json(orders)
};
export const one = async (req, res) => {
    const o = await Order.findById(req.params.id);
    o ? res.json(o) : res.status(404).json({message: 'Order not found'})
};
export const all = async (req, res) => res.json(await Order.find().sort({createdAt: -1}));
export const status = async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, {status: req.body.status}, {new: true}));

export async function cancel(req, res) {
    const o = await Order.findOne({_id: req.params.id, customerId: req.user.sub});
    if (!o) return res.status(404).json({message: 'Order not found'});
    if (!['Pending', 'Processing'].includes(o.status)) return res.status(409).json({message: 'Cannot cancel order'});
    o.status = 'Cancelled';
    o.cancellationReason = req.body.reason;
    for (const i of o.items) await Product.updateOne({_id: i.productId}, {$inc: {stock: i.qty, soldCount: -i.qty}});
    res.json(await o.save());
}