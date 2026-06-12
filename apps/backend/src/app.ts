import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/error.js';
import swaggerRouter from './routes/swagger.js';

import authRouter from './routes/auth.js';
import driverRouter from './routes/drivers.js';
import ridesRouter from './routes/rides.js';
import ratingsRouter from './routes/ratings.js';
import dashboardRouter from './routes/dashboard.js';
import analyticsRouter from './routes/analytics.js';
import adminRouter from './routes/admin.js';

const app = express();

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000","https://rydo-web.vercel.app"];
if (env.CLIENT_URL) {
  const additional = env.CLIENT_URL.split(',').map(url => url.trim());
  additional.forEach(origin => {
    if (origin && !allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Log environment status on start to prevent unused warning
logger.info(`Starting server on port ${env.PORT}`);

// Morgan request logging piped to custom logger stream
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Apply global rate limiter
app.use(globalLimiter);

// Swagger API Documentation route
app.use('/api-docs', swaggerRouter);

// API Routers
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/drivers/dashboard', dashboardRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Bind global error handler at the end of middleware chain
app.use(errorHandler);

export default app;
