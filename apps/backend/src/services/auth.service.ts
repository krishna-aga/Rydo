import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@rydo/db';

const JWT_SECRET = process.env.JWT_SECRET || 'rydo-super-secret-key-123456';

export const registerUser = async (data: any) => {
  const { email, password, name, role, vehicleType, vehicleNumber } = data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      driverProfile: role === 'DRIVER' ? {
        create: {
          vehicleType: vehicleType!,
          vehicleNumber: vehicleNumber!,
          verificationStatus: 'APPROVED'
        }
      } : undefined
    },
    include: {
      driverProfile: true
    }
  });

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || undefined,
      role: newUser.role,
      createdAt: newUser.createdAt.toISOString()
    }
  };
};

export const authenticateUser = async (credentials: any) => {
  const { email, password } = credentials;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { driverProfile: true }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    }
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    },
    driver: user.driverProfile ? {
      id: user.driverProfile.id,
      vehicleType: user.driverProfile.vehicleType,
      vehicleNumber: user.driverProfile.vehicleNumber,
      isOnline: user.driverProfile.isOnline,
      verificationStatus: user.driverProfile.verificationStatus,
      rating: user.driverProfile.rating,
      latitude: user.driverProfile.latitude,
      longitude: user.driverProfile.longitude
    } : undefined
  };
};
