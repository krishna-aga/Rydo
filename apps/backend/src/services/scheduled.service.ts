import { prisma } from '@rydo/db';

export const createScheduledRide = async (
  passengerId: string,
  data: { pickupLocation: string; destination: string; vehicleType: string; scheduledTime: string }
) => {
  const time = new Date(data.scheduledTime);
  if (isNaN(time.getTime())) {
    throw new Error('Invalid scheduled time format');
  }

  if (time <= new Date()) {
    throw new Error('Scheduled time must be in the future');
  }

  if (data.vehicleType !== 'E-Rickshaw' && data.vehicleType !== 'Golf Cart') {
    throw new Error('Invalid vehicle type');
  }
  const fare = data.vehicleType === 'E-Rickshaw' ? 10 : 8;

  return prisma.scheduledRide.create({
    data: {
      passengerId,
      pickupLocation: data.pickupLocation,
      destination: data.destination,
      vehicleType: data.vehicleType,
      fare,
      scheduledTime: time,
      status: 'PENDING'
    }
  });
};

export const fetchUpcomingScheduledRides = async (passengerId: string) => {
  return prisma.scheduledRide.findMany({
    where: {
      passengerId,
      status: 'PENDING',
      scheduledTime: {
        gt: new Date()
      }
    },
    orderBy: {
      scheduledTime: 'asc'
    }
  });
};

export const cancelScheduledRide = async (passengerId: string, id: string) => {
  const scheduled = await prisma.scheduledRide.findUnique({
    where: { id }
  });

  if (!scheduled) {
    throw new Error('Reservation not found');
  }

  if (scheduled.passengerId !== passengerId) {
    throw new Error('Unauthorized to cancel this reservation');
  }

  if (scheduled.status !== 'PENDING') {
    throw new Error('Only pending reservations can be cancelled');
  }

  return prisma.scheduledRide.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
};

export const dispatchDueRides = async () => {
  const now = new Date();

  // Find all due pending rides
  const dueReservations = await prisma.scheduledRide.findMany({
    where: {
      status: 'PENDING',
      scheduledTime: {
        lte: now
      }
    },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (dueReservations.length === 0) {
    return [];
  }

  const dispatchedRides: any[] = [];

  // Transactionally dispatch each due reservation as a standard Ride request
  for (const reservation of dueReservations) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Double check status in transaction to prevent double dispatch
        const check = await tx.scheduledRide.findUnique({
          where: { id: reservation.id }
        });

        if (!check || check.status !== 'PENDING') {
          return null;
        }

        // 1. Update ScheduledRide status to DISPATCHED
        await tx.scheduledRide.update({
          where: { id: reservation.id },
          data: { status: 'DISPATCHED' }
        });

        // 2. Create standard Ride request
        const newRide = await tx.ride.create({
          data: {
            passengerId: reservation.passengerId,
            pickupLocation: reservation.pickupLocation,
            destination: reservation.destination,
            status: 'REQUESTED',
            vehicleType: reservation.vehicleType,
            fare: reservation.fare
          },
          include: {
            passenger: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        return newRide;
      });

      if (result) {
        dispatchedRides.push(result);
      }
    } catch (err) {
      console.error(`Failed to dispatch scheduled ride ${reservation.id}:`, err);
    }
  }

  return dispatchedRides;
};
