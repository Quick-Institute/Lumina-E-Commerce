import {Router} from "express";
import * as a from "../controllers/auth.js";
import {allow, auth} from "../middleware/auth.js";
import * as me from "../controllers/account.js";
import * as c from "../controllers/catelog.js";
import * as o from "../controllers/orders.js";
import * as admin from "../controllers/admin.js";
import {uploadAvatar} from "../middleware/upload.js";
import {uploadProduct} from "../middleware/uploadProduct.js";

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
r.post('/auth/resend-verification', auth, a.resendVerification);

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
r.get('/public/sellers/:id', c.publicSeller);

r.get('/products', c.products);
r.get('/products/:id', c.product);
r.post('/products', auth, allow('Seller', 'Administrator'), uploadProduct.array('images', 6), c.create);
r.put('/products/:id', auth, allow('Seller', 'Administrator'), uploadProduct.array('images', 6), c.update);
r.delete('/products/:id', auth, allow('Seller', 'Administrator'), c.remove);
r.get('/products/:id/reviews', c.reviews);
r.post('/products/:id/reviews', auth, allow('Customer'), c.addReview);

r.post('/orders', auth, allow('Customer'), o.create);
r.get('/orders/mine', auth, o.mine);
r.get('/orders/:id', auth, o.one);
r.get('/seller/orders', auth, allow('Seller'), o.sellerOrders);
r.patch('/orders/:id/cancel', auth, allow('Customer'), o.cancel);
r.patch('/orders/:id/status', auth, allow('Seller', 'Administrator'), o.status);
r.get('/admin/orders', auth, allow('Administrator'), o.all);

r.get('/users', auth, allow('Administrator'), admin.users);
r.get('/users/:id', auth, allow('Administrator'), admin.user);
r.patch('/users/:id/status', auth, allow('Administrator'), admin.userStatus);
r.patch('/users/:id', auth, allow('Seller', 'Administrator'), admin.updateUser);
r.get('/sellers', auth, allow('Administrator'), admin.sellers);
r.get('/sellers/:id', auth, allow('Administrator'), admin.seller);
r.patch('/sellers/:id/review', auth, allow('Administrator'), admin.reviewSeller);
r.get('/admin/products', auth, allow('Administrator'), admin.allProducts);
r.get('/inventory', auth, allow('Seller', 'Administrator'), admin.inventory);
r.patch('/inventory/:id', auth, allow('Seller', 'Administrator'), admin.updateInventory);
r.get('/admin/stats', auth, allow('Administrator'), admin.stats);
r.get('/seller/stats', auth, allow('Seller'), admin.sellerStats);
r.get('/admin/categories', auth, allow('Administrator'), admin.categories);
r.post('/categories', auth, allow('Administrator'), c.createCategory);
r.patch('/categories/:id', auth, allow('Administrator'), admin.updateCategory);
r.delete('/categories/:id', auth, allow('Administrator'), admin.deleteCategory);
export default r;