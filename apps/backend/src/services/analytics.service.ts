import { prisma } from '@rydo/db';

export const fetchAnalyticsData = async () => {
  const allRides = await prisma.ride.findMany({
    include: {
      passenger: {
        select: { name: true }
      }
    }
  });

  const completedRides = allRides.filter(r => r.status === 'COMPLETED');
  const totalRevenue = completedRides.reduce((sum, r) => sum + r.fare, 0);
  const averageFare = completedRides.length > 0 ? parseFloat((totalRevenue / completedRides.length).toFixed(2)) : 0;

  // 1. Calculate daily rides and revenue for the last 7 days
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyRides = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateString = date.toDateString();
    const dayLabel = daysOfWeek[date.getDay()];

    const dayRides = allRides.filter(
      r => new Date(r.createdAt).toDateString() === dateString
    );
    const dayCompleted = dayRides.filter(r => r.status === 'COMPLETED');
    const revenue = dayCompleted.reduce((sum, r) => sum + r.fare, 0);

    return {
      day: dayLabel,
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: dayRides.length,
      revenue
    };
  });

  // 2. Calculate peak hours (0-23 hours clustering)
  const hourlyCounts = Array.from({ length: 24 }).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count: 0
  }));

  allRides.forEach((ride) => {
    const hour = new Date(ride.createdAt).getHours();
    hourlyCounts[hour].count += 1;
  });

  // 3. Calculate popular pickup locations
  const pickupMap: { [key: string]: number } = {};
  allRides.forEach((ride) => {
    const loc = ride.pickupLocation;
    pickupMap[loc] = (pickupMap[loc] || 0) + 1;
  });

  const popularPickupPoints = Object.entries(pickupMap)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    overallStats: {
      totalRides: allRides.length,
      completedRides: completedRides.length,
      cancelledRides: allRides.filter(r => r.status === 'CANCELLED').length,
      totalRevenue,
      averageFare
    },
    dailyRides,
    peakHours: hourlyCounts,
    popularPickupPoints
  };
};
