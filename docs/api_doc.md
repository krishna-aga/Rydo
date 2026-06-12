# Rydo REST API Documentation

This document specifies the REST API endpoints designed for the Rydo Campus Mobility platform. 

All endpoints are served from `/api` (e.g., `http://localhost:5000/api/users`).

---

## 📖 Interactive Swagger API Documentation
Interactive Swagger UI documentation is hosted at:
- **URL**: `/api-docs` (e.g., `http://localhost:5000/api-docs`)

This dashboard provides a visual interface detailing each path's expected parameters, payload formats, and status codes, and allows sandbox execution of requests directly in-browser.

## 🛡️ Production & Security Safeguards
1. **Global Rate Limiting**: All client IPs are globally rate-limited to 100 requests per 15 minutes.
2. **Brute Force Prevention**: Authentication endpoints (`/api/auth/login` and `/api/auth/signup`) are strictly limited to 20 requests per 15 minutes.
3. **Request Schema Validation**: Incoming payloads for signup, login, ride booking, scheduling, and ratings are strictly validated using Zod. If the request body doesn't meet the schemas, a `400 Bad Request` is returned:
   ```json
   {
     "success": false,
     "error": "Validation failed: field_name: error_description"
   }
   ```
4. **Standardized Error Handling**: Uncaught runtime backend exceptions are intercepted by a global handler, logged with server timestamps and stack traces, and returned using standard API envelopes.

---

## 🔒 Authentication Routes (`/api/auth`)

### 1. Register User
Creates a new account (Passenger or Driver).
- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe",
    "role": "PASSENGER" // or "DRIVER"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4-identifier",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PASSENGER",
      "createdAt": "2026-06-10T12:00:00.000Z"
    }
  }
  ```

### 2. Login User
Authenticates a user and returns a JSON Web Token (JWT).
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "uuid-v4-identifier",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "PASSENGER"
      }
    }
  }
  ```

### 3. Get Current User Profile
Retrieves the logged-in user profile and driver profile details (if role is DRIVER) from token headers.
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK` - Passenger)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-v4-identifier",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "PASSENGER",
        "createdAt": "2026-06-10T12:00:00.000Z"
      }
    }
  }
  ```
- **Response (`200 OK` - Driver)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-v4-identifier",
        "email": "driver@example.com",
        "name": "Jane Driver",
        "role": "DRIVER",
        "createdAt": "2026-06-10T12:00:00.000Z"
      },
      "driver": {
        "id": "driver-uuid",
        "vehicleType": "E-Rickshaw",
        "vehicleNumber": "UK-08-ER-1234",
        "isOnline": true,
        "verificationStatus": "APPROVED",
        "rating": 4.9,
        "latitude": 29.8643,
        "longitude": 77.8965
      }
    }
  }
  ```

---

## 🚗 Driver Status Management (`/api/drivers`)

### 1. Toggle Online/Offline State
Updates a driver's online status and availability.
- **URL**: `/api/drivers/status`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "isOnline": true
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "driver-uuid",
      "userId": "user-uuid",
      "vehicleType": "E-Rickshaw",
      "vehicleNumber": "UK-08-ER-1234",
      "isOnline": true,
      "verificationStatus": "APPROVED",
      "rating": 4.9,
      "latitude": 29.8643,
      "longitude": 77.8965
    }
  }
  ```

### 2. Update Location Coordinates
Updates a driver's current coordinates and broadcasts location coordinates to passengers in real-time.
- **URL**: `/api/drivers/location`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "latitude": 29.8643,
    "longitude": 77.8965
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "driver-uuid",
      "latitude": 29.8643,
      "longitude": 77.8965
    }
  }
  ```

---

## 🗺️ Ride Requests & Booking Workflow (`/api/rides`)

### 1. Request a Ride
Creates a new ride request in the system (triggered by Passengers).
- **URL**: `/api/rides/request`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "pickupLocation": "Main Gate, IIT Roorkee",
    "destination": "Govind Bhawan, IIT Roorkee",
    "fare": 50.0
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ride-uuid",
      "passengerId": "passenger-uuid",
      "pickupLocation": "Main Gate, IIT Roorkee",
      "destination": "Govind Bhawan, IIT Roorkee",
      "status": "REQUESTED",
      "fare": 50.0,
      "createdAt": "2026-06-10T12:05:00.000Z"
    }
  }
  ```

### 2. Accept Ride Request
Accepts an incoming ride request (triggered by Drivers).
- **URL**: `/api/rides/accept`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "rideId": "ride-uuid"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ride-uuid",
      "status": "ACCEPTED",
      "driverId": "driver-uuid"
    }
  }
  ```

### 3. Reject/Cancel Ride
Cancels or rejects a ride workflow stage.
- **URL**: `/api/rides/reject`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "rideId": "ride-uuid"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ride-uuid",
      "status": "CANCELLED"
    }
  }
  ```

### 4. Fetch Active Ride
Retrieves the current ongoing ride booking associated with the authenticated passenger or driver.
- **URL**: `/api/rides/active`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ride-uuid",
      "passengerId": "passenger-uuid",
      "driverId": "driver-uuid",
      "pickupLocation": "Main Gate",
      "destination": "Govind Bhawan",
      "status": "ACCEPTED",
      "fare": 50
    }
  }
  ```

### 5. Fetch Available Rides (Drivers Only)
Retrieves a list of pending/requested ride bookings awaiting assignment.
- **URL**: `/api/rides/available`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ride-uuid",
        "passengerId": "passenger-uuid",
        "pickupLocation": "Main Gate",
        "destination": "Govind Bhawan",
        "status": "REQUESTED",
        "fare": 50
      }
    ]
  }
  ```

### 6. Progress Ride Status (Drivers Only)
Progresses the ride lifecycle states (e.g. starting a ride or completing a ride).
- **URL**: `/api/rides/:id/status`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS" // or "COMPLETED"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ride-uuid",
      "status": "IN_PROGRESS"
    }
  }
  ```

---

## 🚗 Driver Online Listings (`/api/drivers`)

### 1. Fetch Online Drivers
Lists all drivers currently marked as online, along with their coordinates for active passenger maps.
- **URL**: `/api/drivers/online`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "driver-uuid",
        "name": "Jane Driver",
        "vehicleType": "E-Rickshaw",
        "vehicleNumber": "UK-08-ER-1234",
        "rating": 4.9,
        "latitude": 29.8643,
        "longitude": 77.8965
      }
    ]
  }
  ```

### 2. Fetch Driver Dashboard Stats (Drivers Only)
Retrieves statistics (completed rides, active jobs, earnings, ratings), weekly chart datasets, and the last 5 recent ride logs.
- **URL**: `/api/drivers/dashboard/stats`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalRides": 14,
        "activeRides": 0,
        "earnings": 560,
        "rating": 4.8
      },
      "chartData": [
        { "day": "Mon", "earnings": 80 },
        { "day": "Tue", "earnings": 120 }
      ],
      "recentRides": [
        {
          "id": "ride-uuid",
          "passengerName": "John Doe",
          "pickupLocation": "Main Gate",
          "destination": "Library",
          "status": "COMPLETED",
          "fare": 40,
          "createdAt": "2026-06-12T01:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## ⭐ Ratings & Reviews (`/api/ratings`)

### 1. Submit Rating
Submits passenger feedback for a completed ride and updates the driver's running average rating.
- **URL**: `/api/ratings`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "rideId": "ride-uuid",
    "stars": 5,
    "feedback": "Great and fast ride!"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "rating-uuid",
      "rideId": "ride-uuid",
      "stars": 5,
      "feedback": "Great and fast ride!"
    }
  }
  ```

### 2. Fetch Reviews for Driver
Retrieves a chronological list of reviews and feedback submitted by passengers for a specific driver.
- **URL**: `/api/ratings/driver/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "rating-uuid",
        "stars": 5,
        "feedback": "Great and fast ride!",
        "createdAt": "2026-06-12T01:00:00.000Z",
        "passengerName": "John Passenger"
      }
    ]
  }
  ```

---

## 📅 Ride Scheduling Routes (`/api/rides`)

### 1. Schedule a Future Ride
Reserves a ride for a future time.
- **URL**: `/api/rides/schedule`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "pickupLocation": "Main Gate",
    "destination": "Library",
    "fare": 45.0,
    "scheduledTime": "2026-06-12T14:30:00.000Z"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "scheduled-ride-uuid",
      "passengerId": "passenger-uuid",
      "pickupLocation": "Main Gate",
      "destination": "Library",
      "fare": 45,
      "scheduledTime": "2026-06-12T14:30:00.000Z",
      "status": "PENDING",
      "createdAt": "2026-06-12T03:00:00.000Z"
    }
  }
  ```

### 2. Get Upcoming Reservations
Lists pending future rides scheduled by the passenger.
- **URL**: `/api/rides/scheduled/upcoming`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "scheduled-ride-uuid",
        "passengerId": "passenger-uuid",
        "pickupLocation": "Main Gate",
        "destination": "Library",
        "fare": 45,
        "scheduledTime": "2026-06-12T14:30:00.000Z",
        "status": "PENDING",
        "createdAt": "2026-06-12T03:00:00.000Z"
      }
    ]
  }
  ```

### 3. Cancel Reservation
Cancels an upcoming scheduled ride.
- **URL**: `/api/rides/scheduled/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "scheduled-ride-uuid",
      "status": "CANCELLED"
    }
  }
  ```

---

## 📈 Analytics & Reporting (`/api/analytics`)

### 1. Fetch Campus Analytics
Retrieves system-wide transits counts, hourly peak demand patterns, and landmark usage metrics.
- **URL**: `/api/analytics`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "overallStats": {
        "totalRides": 250,
        "completedRides": 210,
        "cancelledRides": 40,
        "totalRevenue": 9450,
        "averageFare": 45.0
      },
      "dailyRides": [
        { "day": "Mon", "date": "Jun 08", "count": 35, "revenue": 1575 }
      ],
      "peakHours": [
        { "hour": "00:00", "count": 2 },
        { "hour": "17:00", "count": 48 }
      ],
      "popularPickupPoints": [
        { "location": "Main Gate", "count": 94 }
      ]
    }
  }
  ```

---

## 🛡️ Admin Console Routes (`/api/admin`)

These endpoints are strictly restricted to authenticated users logged in under the `ADMIN` role.

### 1. Fetch Verification Queue
Lists all drivers currently marked as `PENDING` or `REJECTED` awaiting credential reviews.
- **URL**: `/api/admin/drivers/pending`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "driver-uuid",
        "userId": "user-uuid",
        "name": "Jane Driver",
        "email": "driver@example.com",
        "vehicleType": "E-Rickshaw",
        "vehicleNumber": "UK-08-ER-1234",
        "verificationStatus": "PENDING",
        "createdAt": "2026-06-12T02:00:00.000Z"
      }
    ]
  }
  ```

### 2. Verify Driver Status
Approves or rejects a pending driver registration.
- **URL**: `/api/admin/drivers/:id/verify`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "APPROVED" // or "REJECTED"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "driver-uuid",
      "name": "Jane Driver",
      "verificationStatus": "APPROVED"
    }
  }
  ```