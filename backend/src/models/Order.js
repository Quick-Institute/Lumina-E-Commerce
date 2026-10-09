import mongoose from 'mongoose';

const schema = new mongoose.Schema({
        customerId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        items: [Object],
        deliveryAddress: Object,
        subtotal: Number,
        deliveryFee: {type: Number, default: 0},
        totalAmount: Number,
        paymentMethod: {type: String, default: 'COD'},
        paymentStatus: {type: String, default: 'Pending'},
        status: {type: String, default: 'Pending'},
        cancellationReason: String
    },
    {timestamps: true});

export default mongoose.models.Order || mongoose.model('Order', schema);