require('dotenv').config(); // ✅ MUST be on top

const { User } = require('../models');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { signToken } = require('../../utils/jwt');
const nodemailer = require('nodemailer');

// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // APP PASSWORD (NO SPACES)
  },
});

// ================= VERIFY TRANSPORTER =================
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail transporter error:", error);
  } else {
    console.log("✅ Mail transporter is ready to send emails");
  }
});

// ================= SIGN UP =================
async function signup(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      mobile,
      password,
      confirm_password,
      city_id,
      profile_image
    } = req.body;

    const finalPhone = phone || mobile;

    if (!first_name || !last_name || !email || !password || !finalPhone || !city_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const password_hash = await hashPassword(password);
    const full_name = `${first_name} ${last_name}`;

    const user = await User.create({
      first_name,
      last_name,
      full_name,
      email,
      phone: finalPhone,
      password_hash,
      city_id,
      profile_image: profile_image || null
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        city_id: user.city_id,
        phone: user.phone,
        profile_image: user.profile_image
      },
      token
    });

  } catch (err) {
    next(err);
  }
}

// ================= SIGN IN =================
async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        city_id: user.city_id
      }
    });
  } catch (err) {
    next(err);
  }
}

// ================= SEND RESET CODE =================
async function sendResetCode(req, res, next) {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "No user found with this email" });

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.reset_code = code;
    user.reset_code_expiry = expiry;
    await user.save();

    // ================= SEND EMAIL =================
    try {
      const info = await transporter.sendMail({
        from: `"Event App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your Password Reset Code",
        text: `Your OTP for password reset is ${code}. It will expire in 10 minutes.`,
        html: `
          <h3>Password Reset</h3>
          <p>Your OTP is:</p>
          <h2>${code}</h2>
          <p>This code will expire in 10 minutes.</p>
        `
      });

      console.log("✅ Email sent successfully");
      console.log("📧 Message ID:", info.messageId);
      console.log("📨 Accepted:", info.accepted);
      console.log("📭 Rejected:", info.rejected);

    } catch (mailError) {
      console.error("❌ Email send failed:", mailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email"
      });
    }

    return res.json({
      success: true,
      message: "Reset code sent successfully",
      email: user.email
    });

  } catch (err) {
    next(err);
  }
}

// ================= VERIFY CODE =================
async function verifyResetCode(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Email and code are required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.reset_code || !user.reset_code_expiry)
      return res.status(400).json({ message: "No reset code found" });

    if (user.reset_code !== code)
      return res.status(400).json({ message: "Invalid code" });

    if (new Date() > user.reset_code_expiry)
      return res.status(400).json({ message: "Code expired" });

    user.reset_code = "VERIFIED";
    user.reset_code_expiry = null;
    await user.save();

    return res.json({
      success: true,
      message: "Code verified successfully"
    });

  } catch (err) {
    next(err);
  }
}

// ================= RESET PASSWORD =================
async function resetPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ message: "Email and newPassword required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.reset_code !== "VERIFIED")
      return res.status(400).json({ message: "Code not verified" });

    const newHash = await hashPassword(newPassword);
    user.password_hash = newHash;
    user.reset_code = null;
    user.reset_code_expiry = null;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    next(err);
  }
}

// ================= EXPORT =================
module.exports = {
  signup,
  signin,
  sendResetCode,
  verifyResetCode,
  resetPassword
};
