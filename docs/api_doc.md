# Rydo REST API Documentation

This document specifies the REST API endpoints designed for the Rydo Campus Mobility platform. 

All endpoints are served from `/api` (e.g., `http://localhost:5000/api/users`).

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
Retrieves the logged-in user profile from token headers.
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4-identifier",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PASSENGER"
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
      "driverId": "driver-uuid",
      "isOnline": true,
      "verificationStatus": "APPROVED"
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

---

## ⭐ Ratings & Reviews (`/api/ratings`)

### 1. Submit Rating
Submits passenger feedback for a completed ride.
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
 





 