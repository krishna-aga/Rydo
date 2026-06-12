import { prisma } from '@rydo/db';

export const updateDriverStatus = async (userId: string, isOnline: boolean) => {
  const driver = await prisma.driver.findUnique({
    where: { userId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  if (driver.verificationStatus !== 'APPROVED') {
    throw new Error('Driver profile is not approved by administrator');
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: driver.id },
    data: { isOnline },
    include: { user: true }
  });

  return updatedDriver;
};

export const updateDriverLocation = async (userId: string, latitude: number, longitude: number) => {
  const driver = await prisma.driver.findUnique({
    where: { userId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  if (driver.verificationStatus !== 'APPROVED') {
    throw new Error('Driver profile is not approved by administrator');
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: driver.id },
    data: { latitude, longitude }
  });

  return updatedDriver;
};

export const fetchOnlineDriversList = async () => {
  const onlineDrivers = await prisma.driver.findMany({
    where: { isOnline: true },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  return onlineDrivers.map(d => ({
    id: d.id,
    name: d.user.name || 'Anonymous',
    vehicleType: d.vehicleType,
    vehicleNumber: d.vehicleNumber,
    rating: d.rating,
    latitude: d.latitude,
    longitude: d.longitude
  }));
};
