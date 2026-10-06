import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    description: String,
    iconKey: String,
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
},
    {timestamps: true});

export default mongoose.models.Category || mongoose.model('Category', schema);