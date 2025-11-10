import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import registerRoutes from './routes/register.js'; // 👈 confirm file name

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://<YOUR_VERCEL_DOMAIN>.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// ✅ Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', registerRoutes);

// ✅ Test route
app.get('/api/protected', (req, res) => {
  res.json({ ok: true });
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
