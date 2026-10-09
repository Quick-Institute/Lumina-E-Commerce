import {Router} from "express";
import * as a from "../controllers/auth.js";
import {allow, auth} from "../middleware/auth.js";
import * as me from "../controllers/account.js";
import * as c from "../controllers/catelog.js";
import * as o from "../controllers/orders.js";
import {uploadAvatar} from "../middleware/upload.js";

const r = Router();

r.get('/health', (req, res) =>
    res.json({
        ok: true,
        service: 'lumina-backend'
    }));

r.post('/auth/register', a.register);
r.post('/auth/register-seller', a.registerSeller);
r.post('/auth/login', a.login);
r.get('/auth/verify-email', a.verify);
r.post('/auth/forgot-password', a.forgot);
r.post('/auth/reset-password', a.reset);

r.get('/auth/me', auth, me.me);

r.patch(
    "/account/profile",
    auth,
    uploadAvatar.single("avatar"),
    me.updateProfile
);

r.delete(
    "/account/profile/avatar",
    auth,
    me.deleteAvatar
);

r.get('/account/addresses', auth, me.addresses);
r.post('/account/addresses', auth, me.addAddress);
r.patch('/account/addresses/:addressId', auth, me.updateAddress);
r.delete('/account/addresses/:addressId', auth, me.removeAddress);
r.post('/account/change-password', auth, me.changePassword);

r.get('/categories', c.categories);

r.get('/products', c.products);
r.get('/products/:id', c.product);

r.post('/orders', auth, allow('Customer'), o.create);
r.get('/orders/mine', auth, o.mine);
r.get('/orders/:id', auth, o.one);
r.get('/seller/orders', auth, allow('Seller'), o.sellerOrders);
r.patch('/orders/:id/cancel', auth, allow('Customer'), o.cancel);
r.patch('/orders/:id/status', auth, allow('Seller', 'Administrator'), o.status);
r.get('/admin/orders', auth, allow('Administrator'), o.all);

export default r;