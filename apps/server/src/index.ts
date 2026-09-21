import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { gearRouter } from './routes/gearRoutes';
import { bookingRouter } from './routes/bookingRoutes';
import { debtRouter } from './routes/debtRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LensFlow API Server (PoC)',
  });
});

// Main Feature Routes
app.use('/api/gears', gearRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/debt-collector', debtRouter);

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 LensFlow Server running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`=========================================`);
});
