import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
    try {
        const h = req.headers.authorization || '';
        if (!h.startsWith('Bearer ')) throw new Error('Missing token');
        const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
        const user = await User.findById(payload.sub).select('status role approvalStatus');
        if (!user || user.status !== 'Active') return res.status(403).json({message: 'Account is inactive'});
        if (user.role === 'Seller' && user.approvalStatus !== 'Approved') return res.status(403).json({message: 'Seller account is not approved'});
        req.user = {...payload, role: user.role};
        next();
    } catch {
        res.status(401).json({message: 'Authentication required'});
    }
}

export const allow = (...roles) => (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({message: 'Forbidden'});