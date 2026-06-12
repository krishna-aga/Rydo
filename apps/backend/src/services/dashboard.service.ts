import { prisma } from '@rydo/db';

export const fetchDashboardData = async (userId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { userId }
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  // 1. Gather general statistics
  const totalCompleted = await prisma.ride.count({
    where: { driverId: driver.id, status: 'COMPLETED' }
  });

  const activeRides = await prisma.ride.count({
    where: {
      driverId: driver.id,
      status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
    }
  });

  const completedRides = await prisma.ride.findMany({
    where: { driverId: driver.id, status: 'COMPLETED' }
  });

  const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);

  // 2. Compute 7-day earnings dataset for graph
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateString = date.toDateString();
    const dayLabel = daysOfWeek[date.getDay()];

    const dayRides = completedRides.filter(
      r => new Date(r.createdAt).toDateString() === dateString
    );
    const earnings = dayRides.reduce((sum, r) => sum + r.fare, 0);

    return { day: dayLabel, earnings };
  });

  // 3. Fetch recent ride history (last 5)
  const recentRidesRaw = await prisma.ride.findMany({
    where: { driverId: driver.id },
    include: {
      passenger: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const recentRides = recentRidesRaw.map(r => ({
    id: r.id,
    passengerName: r.passenger.name || 'Anonymous',
    pickupLocation: r.pickupLocation,
    destination: r.destination,
    status: r.status,
    fare: r.fare,
    createdAt: r.createdAt.toISOString()
  }));

  return {
    stats: {
      totalRides: totalCompleted,
      activeRides,
      earnings: totalEarnings,
      rating: driver.rating
    },
    chartData,
    recentRides
  };
};
