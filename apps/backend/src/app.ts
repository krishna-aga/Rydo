import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import driverRouter from './routes/drivers.js';
import ridesRouter from './routes/rides.js';
import ratingsRouter from './routes/ratings.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Routers
app.use('/api/auth', authRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/drivers/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

export default app;
