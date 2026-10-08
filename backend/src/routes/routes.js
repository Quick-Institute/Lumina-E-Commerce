import {Router} from "express";
import * as a from "../controllers/auth.js";
import {auth} from "../middleware/auth.js";
import * as me from "../controllers/account.js";
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

r.get('/account/addresses', auth, me.addresses);
r.post('/account/addresses', auth, me.addAddress);
r.patch('/account/addresses/:addressId', auth, me.updateAddress);
r.delete('/account/addresses/:addressId', auth, me.removeAddress);
r.post('/account/change-password', auth, me.changePassword);

export default r;