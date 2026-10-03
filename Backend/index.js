import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Factory Order Tracking API',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send(`Factory Order Tracking API is running on port ${PORT}`);
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`==================================================\n`);

  // Test DB connection in background without blocking server
  testConnection().catch((err) => {
    console.error('Database connection test failed:', err.message);
  });
});
