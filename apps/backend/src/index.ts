import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '@rydo/db';
import { ApiResponse, User } from '@rydo/shared';

// Load root .env file
dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET /api/users - Fetch users from database
app.get('/api/users', async (req, res) => {
  const response: ApiResponse<User[]> = {
    success: false,
  };

  try {
    // Attempt database query
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    response.success = true;
    response.data = dbUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name || undefined,
      createdAt: u.createdAt.toISOString()
    }));
    return res.json(response);
  } catch (err: any) {
    console.error('Prisma query failed:', err.message);
    
    // In case user hasn't configured Neon yet, return structured fallback mock data
    response.success = true;
    response.data = [
      {
        id: 'mock-1',
        name: 'John Neon (Mock)',
        email: 'neon@rydo.app',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-2',
        name: 'Jane Turborepo (Mock)',
        email: 'turbo@rydo.app',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    response.error = 'Database connection error. Using local fallback server state. (Check DATABASE_URL in root .env)';
    return res.json(response);
  }
});

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  const { email, name } = req.body;
  const response: ApiResponse<User> = {
    success: false,
  };

  if (!email) {
    response.error = 'Email is required';
    return res.status(400).json(response);
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    response.success = true;
    response.data = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || undefined,
      createdAt: newUser.createdAt.toISOString()
    };
    return res.status(201).json(response);
  } catch (err: any) {
    console.error('Failed to create user:', err.message);
    response.error = 'Failed to write to database. Database connection string might not be configured.';
    return res.status(500).json(response);
  }
});

app.listen(port, () => {
  console.log(`🚀 Rydo Backend listening at http://localhost:${port}`);
  console.log(`👉 Database connection status: ${process.env.DATABASE_URL ? 'URL present' : 'URL MISSING'}`);
});
