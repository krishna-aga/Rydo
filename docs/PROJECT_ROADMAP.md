# General Architecture Guidelines

Follow these rules throughout development:

* Use TypeScript everywhere.
* Use a Turborepo monorepo.
* Keep frontend, backend, database, and shared packages modular.
* Follow clean architecture and separation of concerns.
* Build each phase so the application remains functional.
* Commit after every completed phase.
* Prefer reliability and maintainability over adding many features.
* Use environment variables for all configuration.
* Do not hardcode secrets.
* Design the project so Docker can be added later with minimal changes.
* Avoid assumptions that tie the project to localhost.
* Use configurable URLs and ports.
* Keep services independent so they can later run inside separate containers.
* Ask before making major architectural changes.

---

# Tech Stack

## Monorepo

Structure:

```text
apps/
    web
    backend

packages/
    db
    shared
    ui
```

## Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Router
* Zustand
* Socket.io-client

## Backend

* Node.js
* Express
* TypeScript
* Socket.io
* Prisma ORM
* PostgreSQL

## Validation

* Zod

## Charts

* Recharts

## Maps

* Leaflet + OpenStreetMap

## Future Additions

* Redis
* Swagger
* Docker
* Nginx
* CI/CD

---

# Phase 1: Project Setup ✅

Create a Turborepo with:

* [x] apps/web → React + TypeScript + Tailwind
* [x] apps/backend → Express + TypeScript
* [x] packages/db → Prisma
* [x] packages/shared → shared types
* [x] packages/ui → reusable components

Configure pnpm workspaces. ✅

Ensure both frontend and backend run independently. ✅

Do not introduce Docker in this phase. ✅

---

# Phase 2: Database Design ✅

Design Prisma schema. ✅

Tables:

### User ✅
* [x] id
* [x] name
* [x] email
* [x] password
* [x] role (PASSENGER or DRIVER)
* [x] createdAt

### Driver ✅
* [x] id
* [x] userId
* [x] vehicleType
* [x] vehicleNumber
* [x] isOnline
* [x] verificationStatus
* [x] rating

### Ride ✅
* [x] id
* [x] passengerId
* [x] driverId
* [x] pickupLocation
* [x] destination
* [x] status
* [x] fare
* [x] createdAt

Ride status:
* [x] REQUESTED
* [x] ACCEPTED
* [x] IN_PROGRESS
* [x] COMPLETED
* [x] CANCELLED

### Rating ✅
* [x] id
* [x] rideId
* [x] driverId
* [x] passengerId
* [x] stars
* [x] feedback

Create migrations and relationships. ✅

---

# Phase 3: Authentication ✅

Implement:

Passenger:
* [x] Signup
* [x] Login

Driver:
* [x] Signup
* [x] Login

Use:
* [x] JWT
* [x] bcrypt (bcryptjs)

Protected routes via middleware. ✅

APIs:
* [x] POST /auth/signup
* [x] POST /auth/login
* [x] GET /me

Frontend pages:
* [x] Login
* [x] Signup

---

# Phase 4: Driver Availability ✅

Drivers can:
* [x] Go online
* [x] Go offline
* [x] Update availability

Passengers can view available drivers. ✅

API:
* [x] PATCH /driver/status

---

# Phase 5: Ride Request Workflow ✅

Passenger:
* [x] Select pickup
* [x] Select destination
* [x] Request ride

Driver:
* [x] View incoming requests
* [x] Accept request
* [x] Reject request

APIs:
* [x] POST /ride/request
* [x] POST /ride/accept
* [x] POST /ride/reject (implemented via /rides/cancel)

Ensure only one driver can accept a ride. ✅
Use Prisma transactions to prevent race conditions. ✅

---

# Phase 6: Real-Time Communication ✅

Use Socket.io. ✅

Implement events:

Driver events:
* [x] driver-online
* [x] driver-offline

Ride events:
* [x] ride-requested
* [x] ride-accepted
* [x] ride-started
* [x] ride-completed
* [x] ride-cancelled

Passenger and driver should receive updates instantly. ✅

---

# Phase 7: Ride Lifecycle Management ✅

Support:

REQUESTED
↓
ACCEPTED
↓
IN_PROGRESS
↓
COMPLETED

or

REQUESTED
↓
CANCELLED

Prevent invalid transitions. ✅

---

# Phase 8: Driver Dashboard ✅

Display:

Summary cards:
* [x] Total rides
* [x] Active rides
* [x] Earnings
* [x] Average rating

Ride history table. ✅

Charts using Recharts. ✅

---

# Phase 9: Ratings and Feedback ✅

Passengers can:
* [x] Give rating
* [x] Write feedback

Maintain:
* [x] Average driver rating
* [x] Feedback history
* [x] Performance summary

APIs:
* [x] POST /rating (implemented via /api/ratings)
* [x] GET /driver/:id/ratings (implemented via /api/ratings/driver/:id)

---

# Phase 10: Maps ✅

Use:

Leaflet + OpenStreetMap ✅

Display:

* [x] Driver locations
* [x] Pickup location
* [x] Destination location
* [x] Active ride route

Avoid Google Maps API. ✅

---

# Phase 11: Analytics Dashboard ✅

Provide:

* Daily rides
* Peak hours
* Popular pickup points
* Demand statistics

Use Recharts. ✅

---

# Phase 12: Scheduled Rides ✅

Create ScheduledRide table. ✅

Allow:

* Future bookings
* Upcoming rides
* Cancellation

Use node-cron. ✅

---

# Phase 13: AI Features

Implement:

### Driver Recommendation

Based on:

* Distance
* Rating
* Availability

### Demand Analytics

Analyze:

* Peak hours
* Ride hotspots

### Demand Forecasting

Predict:

* High-demand periods
* Popular locations

Models:

* Linear Regression
* Decision Trees
* Time Series

### AI Chatbot

Support:

* Where is my ride?
* Show recent rides.
* Ride statistics.

---

# Phase 14: Production Improvements

Add:

* Global error handling
* Validation with Zod
* Logging
* Rate limiting
* Environment configuration
* Swagger API documentation

---

# Phase 15: Redis Integration

Introduce Redis for:

* Caching
* Session storage
* Real-time scaling support
* Frequently accessed data

Keep Redis optional during development.

---

# Phase 16: Dockerization

Only after the entire application is stable.

Create:

* Dockerfile for frontend
* Dockerfile for backend
* Dockerfile for PostgreSQL (optional)

Add:

docker-compose.yml

Services:

* web
* backend
* postgres
* redis

Use environment variables.

Ensure all services communicate through container names instead of localhost.

Prepare the project for future Kubernetes deployment.

---

# Phase 17: Deployment

Frontend:

Vercel

Backend:

Render

Database:

Neon PostgreSQL

Redis:

Upstash Redis (optional)

---

# Phase 18: Documentation

Prepare:

* ER Diagram
* System Architecture Diagram
* README
* API documentation
* Setup instructions
* Folder structure documentation
* Demo video

Demonstrate:

* Authentication
* Ride request flow
* Driver acceptance
* Real-time updates
* Dashboard
* Ratings
* Maps
* Analytics
