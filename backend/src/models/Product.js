import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        min: 0,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: String,
    images: [String],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    lowStockLevel: {
        type: Number,
        default: 5
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Draft'],
        default: 'Active'
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sellerName: String,
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    soldCount: {
        type: Number,
        default: 0
    },
    featured: Boolean,
    popular: Boolean
},
    {timestamps: true});

export default mongoose.models.Product || mongoose.model('Product', schema);