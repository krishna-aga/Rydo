import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';

// Load root .env file
dotenv.config({ path: '../../.env' });

const port = process.env.PORT || 5000;

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

// Listen on the HTTP Server instance which hosts the Socket.io endpoints
httpServer.listen(port, () => {
  console.log(`🚀 Rydo Backend listening at http://localhost:${port}`);
  console.log(`👉 Database connection status: ${process.env.DATABASE_URL ? 'URL present' : 'URL MISSING'}`);
});
