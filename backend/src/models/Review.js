import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    rating: {type: Number, min: 1, max: 5, required: true},
    comment: String
}, {timestamps: true});
schema.index({productId: 1, userId: 1}, {unique: true});
export default mongoose.models.Review || mongoose.model('Review', schema);