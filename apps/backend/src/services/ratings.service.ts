import { prisma } from '@rydo/db';

export const executeSubmitRating = async (passengerId: string, rideId: string, stars: number, feedback?: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!ride || ride.passengerId !== passengerId) {
    throw new Error('Ride not found or not requested by you');
  }

  if (ride.status !== 'COMPLETED') {
    throw new Error('You can only rate completed rides');
  }

  if (!ride.driverId) {
    throw new Error('No driver was assigned to this ride');
  }

  const ratingResult = await prisma.$transaction(async (tx) => {
    const existingRating = await tx.rating.findUnique({
      where: { rideId }
    });

    if (existingRating) {
      throw new Error('You have already rated this ride');
    }

    const rating = await tx.rating.create({
      data: {
        rideId,
        driverId: ride.driverId!,
        passengerId,
        stars,
        feedback
      }
    });

    const ratings = await tx.rating.findMany({
      where: { driverId: ride.driverId! }
    });

    const totalStars = ratings.reduce((sum, r) => sum + r.stars, 0);
    const averageRating = totalStars / ratings.length;

    await tx.driver.update({
      where: { id: ride.driverId! },
      data: { rating: averageRating }
    });

    return rating;
  });

  return ratingResult;
};

export const fetchDriverRatingsList = async (driverId: string) => {
  const ratings = await prisma.rating.findMany({
    where: { driverId },
    include: {
      passenger: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return ratings.map(r => ({
    id: r.id,
    stars: r.stars,
    feedback: r.feedback,
    createdAt: r.createdAt.toISOString(),
    passengerName: r.passenger.name || 'Anonymous Passenger'
  }));
};
