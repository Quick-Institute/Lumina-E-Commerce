import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Customer', 'Seller', 'Administrator'],
        default: 'Customer'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    },
    phone: String,
    customer: Object,
    addresses: [{
        label: String,
        fullName: String,
        phone: String,
        address: String,
        city: String,
        district: String,
        postalCode: String,
        isDefault: Boolean
    }],
    storeName: String,
    businessAddress: String,
    description: String,
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved'
    },
    rejectionReason: String,
    emailVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ""
    },
    avatarPublicId: {
        type: String,
        default: ""
    },
    verifyToken: String,
    verifyExpires: Date,
    resetToken: String,
    resetExpires: Date,
},
    {timestamps: true});

export default mongoose.models.User || mongoose.model('User', schema);