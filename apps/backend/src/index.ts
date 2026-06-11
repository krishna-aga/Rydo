import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/auth.js';
import driverRouter from './routes/drivers.js';
import ridesRouter from './routes/rides.js';
import ratingsRouter from './routes/ratings.js';
import dashboardRouter from './routes/dashboard.js';

// Load root .env file
dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up HTTP Server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Bind Socket.io globally to the express application
app.set('io', io);

// Handle Socket.io Connections and Room Joins
io.on('connection', (socket) => {
  const { userId, role } = socket.handshake.query;

  if (userId) {
    // Join personal user room to receive targeted status alerts
    socket.join(`user_${userId}`);
    console.log(`🔌 User ${userId} joined room: user_${userId}`);

    // If driver, also join the workspace drivers group to receive requests
    if (role === 'DRIVER') {
      socket.join('drivers');
      console.log(`🔌 Driver ${userId} joined room: drivers`);
    }
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected socket: ${socket.id}`);
  });
});

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

// Listen on the HTTP Server instance which hosts the Socket.io endpoints
httpServer.listen(port, () => {
  console.log(`🚀 Rydo Backend listening at http://localhost:${port}`);
  console.log(`👉 Database connection status: ${process.env.DATABASE_URL ? 'URL present' : 'URL MISSING'}`);
});
