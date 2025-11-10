// server/src/routes/register.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { encryptText, decryptText } from '../utils/crypto.js';

const router = express.Router();
const prisma = new PrismaClient();

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
};

// Create salesperson (ADMIN only)
router.post('/register-salesperson', authenticate, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) return res.status(400).json({ error: 'Username or Email already exists.' });

    const hashed = await hash(password, 10);
    const encrypted = encryptText(password);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashed, // bcrypt hash stored in `password`
        encryptedPassword: encrypted,
        role: 'SALESPERSON',
      },
      select: userSelect,
    });

    res.status(201).json({ message: 'Salesperson registered successfully!', user: newUser, plainPassword: password });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET all salespersons (ADMIN only) — returns decrypted plainPassword in response
router.get('/register-salesperson', authenticate, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'SALESPERSON' },
      orderBy: { id: 'asc' },
      select: { ...userSelect, encryptedPassword: true },
    });
    const prepared = users.map(u => {
      const plain = u.encryptedPassword ? decryptText(u.encryptedPassword) : null;
      const { encryptedPassword, ...rest } = u;
      return { ...rest, plainPassword: plain };
    });
    res.json({ users: prepared });
  } catch (err) {
    console.error('Fetch salespersons error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET by id (ADMIN only)
router.get('/register-salesperson/:id', authenticate, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const u = await prisma.user.findUnique({ where: { id }, select: { ...userSelect, encryptedPassword: true } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (u.role !== 'SALESPERSON') return res.status(400).json({ error: 'Not a salesperson' });
    const plain = u.encryptedPassword ? decryptText(u.encryptedPassword) : null;
    const { encryptedPassword, ...rest } = u;
    res.json({ user: { ...rest, plainPassword: plain } });
  } catch (err) {
    console.error('Fetch by id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update (ADMIN only)
router.put('/register-salesperson/:id', authenticate, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (existing.role !== 'SALESPERSON') return res.status(400).json({ error: 'Not a salesperson' });

    if ((password || confirmPassword) && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if ((username && username !== existing.username) || (email && email !== existing.email)) {
      const conflict = await prisma.user.findFirst({
        where: {
          OR: [
            username && { username },
            email && { email },
          ].filter(Boolean),
          NOT: { id },
        },
      });
      if (conflict) return res.status(400).json({ error: 'Username or Email already in use' });
    }

    const dataToUpdate = {};
    if (firstName) dataToUpdate.firstName = firstName;
    if (lastName) dataToUpdate.lastName = lastName;
    if (username) dataToUpdate.username = username;
    if (email) dataToUpdate.email = email;
    if (password) {
      dataToUpdate.password = await hash(password, 10);
      dataToUpdate.encryptedPassword = encryptText(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: userSelect,
    });

    res.json({ message: 'Updated successfully', user: updated, plainPassword: password || undefined });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE (ADMIN only)
router.delete('/register-salesperson/:id', authenticate, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existed = await prisma.user.findUnique({ where: { id } });
    if (!existed) return res.status(404).json({ error: 'User not found' });
    if (existed.role !== 'SALESPERSON') return res.status(400).json({ error: 'Not a salesperson' });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
