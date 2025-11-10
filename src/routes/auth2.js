import express from 'express';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_long_secret_key';

// ✅ LOGIN route — role is auto-detected from database
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    // 2️⃣ Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 3️⃣ Compare password
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 4️⃣ Create JWT payload (role comes from DB)
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role, // ✅ backend decides the role
    };

    // 5️⃣ Generate token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    // 6️⃣ Send secure response
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role, // frontend can know which role logged in
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
