import bcrypt from 'bcryptjs';
import User from "../models/User.js";
import {randomToken, sign, publicUser} from "../utils/tokens.js";
import {mail} from "../utils/mailer.js";

export async function register(req, res) {
    const {name, email, password, phone} = req.body;

    if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({
            message: 'Valid name, email and password are required'
        });
    }

    if (await User.findOne({email})) {
        return res.status(409).json({
            message: 'Email already exists'
        });
    }

    const U = await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 12),
        phone,
        emailVerified: false,
        verifyToken: randomToken(),
        verifyExpires: Date.now() + 86400000
    });

    const verifyUrl =
        `${process.env.CLIENT_URL}/verify-email?token=${U.verifyToken}`;

    mail(
        email,
        'Confirm your Lumina email',
        'Welcome to Lumina',
        `
            <p style="
                margin:0;
                color:#d4d4d8;
            ">
                Hi <strong style="color:#fafafa;">${name}</strong>,
            </p>

            <p style="
                margin:18px 0 0 0;
                color:#a1a1aa;
            ">
                Thank you for creating a Lumina account.
                Please confirm your email address to complete
                your registration.
            </p>

            <p style="
                margin:28px 0;
                text-align:center;
            ">
                <a
                    href="${verifyUrl}"
                    class="email-button"
                    style="
                        display:inline-block;
                        padding:13px 24px;
                        background-color:#1F8482;
                        border:1px solid #2a9997;
                        border-radius:8px;
                        color:#ffffff;
                        font-size:14px;
                        line-height:20px;
                        font-weight:700;
                        text-decoration:none;
                        text-align:center;
                    "
                >
                    Confirm Your Email
                </a>
            </p>

            <p style="
                margin:0;
                font-size:12px;
                line-height:20px;
                color:#71717a;
            ">
                If the button doesn't work, use the following link:
            </p>

            <p style="
                margin:8px 0 0 0;
                word-break:break-all;
                font-size:12px;
                line-height:20px;
                color:#1F8482;
            ">
                ${verifyUrl}
            </p>

            <p style="
                margin:22px 0 0 0;
                font-size:12px;
                line-height:20px;
                color:#71717a;
            ">
                This verification link will expire in 24 hours.
            </p>

            <p style="
                margin:10px 0 0 0;
                font-size:12px;
                line-height:20px;
                color:#71717a;
            ">
                If you did not create a Lumina account,
                you can safely ignore this email.
            </p>
        `,
        `Welcome to Lumina!

Hi ${name},

Thank you for creating a Lumina account.

Please confirm your email address using the link below:

${verifyUrl}

This verification link will expire in 24 hours.

If you did not create a Lumina account,
you can safely ignore this email.`,
        'Confirm your Lumina email address to complete your registration.'
    ).catch(console.error);

    res.status(201).json({
        user: publicUser(U),
        token: sign(U)
    });
}

export async function registerSeller(req, res) {
    const {name, email, password, phone, storeName, businessAddress, description} = req.body;

    if (!name || !email || !password || !storeName || !businessAddress) return res.status(400).json({
        message: 'Personal and business details are required'
    });

    if (await User.findOne({email})) return res.status(409).json({
        message: 'Email already exists'
    });

    const U = await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 12),
        phone,
        storeName,
        businessAddress,
        description,
        role: 'Seller',
        status: 'Inactive',
        approvalStatus: 'Pending'
    });
    res.status(201).json({
       applicationId: U._id,
       status: 'Pending'
    });
}

export async function login(req, res) {
    const U = await User.findOne({
        email: req.body.email
    });

    if (
        !U ||
        !(await bcrypt.compare(req.body.password, U.password))
    ) {
        return res.status(401).json({
            message: 'Invalid email or password'
        });
    }

    if (
        U.status === 'Suspended' ||
        (U.role === 'Seller' && U.approvalStatus !== 'Approved')
    ) {
        return res.status(403).json({
            message: 'Account is not active'
        });
    }

    res.json({
        user: publicUser(U),
        token: sign(U)
    });
}

export async function verify(req, res) {
    const u = await User.findOne({
        verifyToken: req.query.token,
        verifyExpires: {
            $gt: Date.now()
        }
    });

    if (!u) {
        return res.status(400).json({
            message: 'Invalid or expired verification token'
        });
    }

    u.emailVerified = true;
    u.verifyToken = undefined;
    u.verifyExpires = undefined;

    await u.save();

    res.json({
        message: 'Email verified successfully'
    });
}

export async function forgot(req, res) {
    const u = await User.findOne({
        email: req.body.email
    });

    if (u) {
        u.resetToken = randomToken();
        u.resetExpires = Date.now() + 3600000; // 1 hour
        await u.save();
        mail(u.email, 'Reset your Lumina password', 'Reset your password', `<a href="${process.env.CLIENT_URL}/reset-password?token=${u.resetToken}">Reset password</a>`).catch(console.error)

    }
    res.json({sent: true});
}

export async function reset(req, res) {
    const u = await User.findOne({
        resetToken: req.body.token,
        resetExpires: {
            $gt: Date.now()
        }
    });

    if (!u) {
        return res.status(400).json({
            message: 'Invalid or expired reset token'
        });
    }

    u.password = await bcrypt.hash(req.body.password, 12);
    u.resetToken = undefined;
    u.resetExpires = undefined;
    await u.save();
    res.json({updated: true});
}