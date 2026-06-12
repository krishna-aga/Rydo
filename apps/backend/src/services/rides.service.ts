import { prisma } from '@rydo/db';

export const createRideRequest = async (
  passengerId: string,
  pickupLocation: string,
  destination: string,
  vehicleType: string
) => {
  // Check if passenger already has an active ride
  const activeRide = await prisma.ride.findFirst({
    where: {
      passengerId,
      status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] }
    }
  });

  if (activeRide) {
    throw new Error('You already have an active ride request');
  }

  // Enforce fixed fares: E-Rickshaw = ₹10, Golf Cart = ₹8
  if (vehicleType !== 'E-Rickshaw' && vehicleType !== 'Golf Cart') {
    throw new Error('Invalid vehicle type');
  }
  const fare = vehicleType === 'E-Rickshaw' ? 10 : 8;

  const newRide = await prisma.ride.create({
    data: {
      passengerId,
      pickupLocation,
      destination,
      vehicleType,
      fare,
      status: 'REQUESTED'
    },
    include: {
      passenger: {
        select: { name: true, email: true }
      }
    }
  });

  return newRide;
};

export const executeRideAccept = async (userId: string, rideId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { userId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  if (!driver.isOnline) {
    throw new Error('You must go online to accept rides');
  }

  const activeDriverRide = await prisma.ride.findFirst({
    where: {
      driverId: driver.id,
      status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
    }
  });

  if (activeDriverRide) {
    throw new Error('You are already handling an active ride');
  }

  const updatedRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({
      where: { id: rideId }
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.status !== 'REQUESTED' || ride.driverId) {
      throw new Error('Ride already accepted or cancelled');
    }

    if (driver.vehicleType !== ride.vehicleType) {
      throw new Error('Vehicle type mismatch: Driver vehicle does not match ride request');
    }

    return tx.ride.update({
      where: { id: rideId },
      data: {
        status: 'ACCEPTED',
        driverId: driver.id
      },
      include: {
        passenger: {
          select: { name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });
  });

  return updatedRide;
};

export const executeRideCancel = async (userId: string, userRole: string, rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: {
        select: { userId: true }
      }
    }
  });

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (userRole === 'PASSENGER' && ride.passengerId !== userId) {
    throw new Error('Access denied: You cannot cancel someone else\'s ride');
  }

  if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
    throw new Error('Ride is already closed');
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: { status: 'CANCELLED' }
  });

  return {
    updatedRide,
    driverUserId: ride.driver?.userId
  };
};

export const fetchActiveRideInfo = async (userId: string, userRole: string) => {
  if (userRole === 'PASSENGER') {
    return prisma.ride.findFirst({
      where: {
        passengerId: userId,
        status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] }
      },
      include: {
        passenger: {
          select: { name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });
  } else {
    const driver = await prisma.driver.findUnique({
      where: { userId }
    });
    if (!driver) {
      throw new Error('Driver profile not found');
    }
    return prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
      },
      include: {
        passenger: {
          select: { name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });
  }
};

export const fetchAvailableRidesList = async (driverVehicleType: string) => {
  return prisma.ride.findMany({
    where: {
      status: 'REQUESTED',
      driverId: null,
      vehicleType: driverVehicleType
    },
    include: {
      passenger: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateRideStatusLifecycle = async (userId: string, rideId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
  const driver = await prisma.driver.findUnique({
    where: { userId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!ride || ride.driverId !== driver.id) {
    throw new Error('Ride not found or not assigned to you');
  }

  if (status === 'IN_PROGRESS' && ride.status !== 'ACCEPTED') {
    throw new Error('Ride must be accepted before starting');
  }
  if (status === 'COMPLETED' && ride.status !== 'IN_PROGRESS') {
    throw new Error('Ride must be in progress before completing');
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: { status },
    include: {
      passenger: {
        select: { name: true, email: true }
      },
      driver: {
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  });

  return updatedRide;
};
