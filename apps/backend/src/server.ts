import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { prisma } from '@rydo/db';
import { env } from './config/env.js';

// Load root .env file
dotenv.config({ path: '../../.env' });

const port = process.env.PORT || 5000;

// Set up CORS allowed origins dynamic lookup
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000","https://rydo-k1l4.onrender.com"];
if (env.CLIENT_URL) {
  const additional = env.CLIENT_URL.split(',').map(url => url.trim());
  additional.forEach(origin => {
    if (origin && !allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// Set up HTTP Server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Bind Socket.io globally to the express application
app.set('io', io);

// Initialize background cron jobs
import { initCronJobs } from './lib/cron.js';
initCronJobs(io);

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

      // Look up driver's vehicle type to join vehicle-specific room
      prisma.driver.findUnique({
        where: { userId: userId as string }
      }).then((driver) => {
        if (driver) {
          socket.join(`drivers_${driver.vehicleType}`);
          console.log(`🔌 Driver ${userId} joined vehicle room: drivers_${driver.vehicleType}`);
        }
      }).catch((err) => {
        console.error('Error fetching driver vehicle type for room join:', err);
      });
    }

    // If admin, join the admins group to receive verification notifications
    if (role === 'ADMIN') {
      socket.join('admins');
      console.log(`🔌 Admin ${userId} joined room: admins`);
    }
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected socket: ${socket.id}`);
  });
});

// Listen on the HTTP Server instance which hosts the Socket.io endpoints
httpServer.listen(port, () => {
  console.log(`🚀 Rydo Backend listening at http://localhost:${port}`);
  console.log(`👉 Database connection status: ${process.env.DATABASE_URL ? 'URL present' : 'URL MISSING'}`);
});
