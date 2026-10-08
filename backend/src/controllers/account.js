import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {publicUser} from '../utils/tokens.js';
import fs from 'fs';
import path from "path";

export const me = async (req, res) => res.json(
    publicUser(await User.findById(req.user.sub))
);
export async function updateProfile(req, res) {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const {name, phone} = req.body;

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        // Save the old avatar path before replacing it
        const oldAvatar = user.avatar;

        if (req.file) {
            user.avatar = `/uploads/avatars/${req.file.filename}`;
        }

        await user.save();

        // Delete the old avatar after the new one is saved successfully
        if (req.file && oldAvatar) {
            const oldAvatarPath = path.resolve(
                oldAvatar.replace(/^\/+/, "")
            );

            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        return res.json({
            message: "Profile updated successfully",
            user: publicUser(user)
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            message: error.message || "Unable to update profile"
        });
    }
}
export const addresses = async (req, res) => res.json((
    await User.findById(req.user.sub)).addresses || []
);
export const addAddress = async (req, res) => {
    const u = await User.findById(req.user.sub);
    if (req.body.isDefault) u.addresses.forEach(a => a.isDefault = false);
    u.addresses.push(req.body);
    await u.save();
    res.status(201).json(u.addresses.at(-1));
};
export const updateAddress = async (req, res) => {
    const u = await User.findById(req.user.sub), a = u.addresses.id(req.params.addressId);
    if (!a) return res.status(404).json({message: 'Address not found'});
    Object.assign(a, req.body);
    await u.save();
    res.json(a)
};
export const removeAddress = async (req, res) => {
    const u = await User.findById(req.user.sub);
    u.addresses.pull(req.params.addressId);
    await u.save();
    res.status(204).end()
};
export const changePassword = async (req, res) => {
    const u = await User.findById(req.user.sub);
    if (!await bcrypt.compare(req.body.currentPassword, u.password)) return res.status(400).json({message: 'Current password is incorrect'});
    u.password = await bcrypt.hash(req.body.newPassword, 12);
    await u.save();
    res.json({updated: true})
};