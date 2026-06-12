import { prisma } from '@rydo/db';

export const fetchPendingDrivers = async () => {
  const drivers = await prisma.driver.findMany({
    where: {
      verificationStatus: {
        in: ['PENDING', 'REJECTED']
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      user: {
        createdAt: 'desc'
      }
    }
  });

  return drivers.map(d => ({
    id: d.id,
    userId: d.userId,
    name: d.user.name || 'Anonymous',
    email: d.user.email,
    vehicleType: d.vehicleType,
    vehicleNumber: d.vehicleNumber,
    verificationStatus: d.verificationStatus,
    createdAt: d.user.createdAt.toISOString()
  }));
};

export const verifyDriverProfile = async (driverId: string, status: 'APPROVED' | 'REJECTED') => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: driverId },
    data: {
      verificationStatus: status,
      // Force offline if rejected to prevent showing up on client maps
      isOnline: status === 'APPROVED' ? driver.isOnline : false
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return updatedDriver;
};
