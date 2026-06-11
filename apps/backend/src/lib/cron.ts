import cron from 'node-cron';
import { Server } from 'socket.io';
import { dispatchDueRides } from '../services/scheduled.service.js';

export const initCronJobs = (io: Server) => {
  console.log('⏰ Initializing background cron jobs...');

  // Run every minute: * * * * *
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Checking for due scheduled rides...');
    try {
      const dispatchedRides = await dispatchDueRides();
      if (dispatchedRides.length > 0) {
        console.log(`⏰ Dispatched ${dispatchedRides.length} scheduled rides!`);

        // Broadcast each ride-requested event to all online drivers
        dispatchedRides.forEach((ride) => {
          io.to('drivers').emit('ride-requested', {
            id: ride.id,
            passengerId: ride.passengerId,
            passenger: {
              name: ride.passenger.name || 'Anonymous',
              email: ride.passenger.email
            },
            pickupLocation: ride.pickupLocation,
            destination: ride.destination,
            status: ride.status,
            fare: ride.fare,
            createdAt: ride.createdAt.toISOString()
          });

          // Also notify the individual passenger that their ride has been dispatched
          io.to(`user_${ride.passengerId}`).emit('ride-dispatch-status', {
            success: true,
            message: 'Your scheduled E-Rickshaw has been dispatched and is looking for a driver!',
            ride
          });
        });
      }
    } catch (err) {
      console.error('⏰ Error in scheduled rides dispatch cron:', err);
    }
  });
};
