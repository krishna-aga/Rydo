export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Rydo API Documentation',
    version: '1.0.0',
    description: 'REST API documentation for Rydo - Campus Mobility & E-Rickshaw Dispatch Platform'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/api/auth/signup': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['PASSENGER', 'DRIVER'] },
                  vehicleType: { type: 'string' },
                  vehicleNumber: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { description: 'Invalid input or validation failed' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user and get JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Retrieve authenticated user session profile',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Profile retrieved' },
          401: { description: 'Missing or invalid authentication token' }
        }
      }
    },
    '/api/drivers/status': {
      patch: {
        summary: 'Toggle online availability status (Drivers only)',
        tags: ['Drivers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isOnline'],
                properties: {
                  isOnline: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated' }
        }
      }
    },
    '/api/drivers/location': {
      patch: {
        summary: 'Broadcast live driver coordinates',
        tags: ['Drivers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['latitude', 'longitude'],
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Coordinates updated' }
        }
      }
    },
    '/api/drivers/online': {
      get: {
        summary: 'List all online drivers',
        tags: ['Drivers'],
        responses: {
          200: { description: 'Online drivers list' }
        }
      }
    },
    '/api/drivers/dashboard/stats': {
      get: {
        summary: 'Get driver dashboard summaries',
        tags: ['Drivers'],
        responses: {
          200: { description: 'Dashboard metrics data' }
        }
      }
    },
    '/api/rides/request': {
      post: {
        summary: 'Submit a new live ride request (Passengers only)',
        tags: ['Rides'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pickupLocation', 'destination', 'fare'],
                properties: {
                  pickupLocation: { type: 'string' },
                  destination: { type: 'string' },
                  fare: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Ride requested' }
        }
      }
    },
    '/api/rides/accept': {
      post: {
        summary: 'Accept a ride booking (Drivers only)',
        tags: ['Rides'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rideId'],
                properties: {
                  rideId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Ride accepted' }
        }
      }
    },
    '/api/rides/cancel': {
      post: {
        summary: 'Cancel an active ride',
        tags: ['Rides'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rideId'],
                properties: {
                  rideId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Ride cancelled' }
        }
      }
    },
    '/api/rides/active': {
      get: {
        summary: 'Fetch ongoing active ride info',
        tags: ['Rides'],
        responses: {
          200: { description: 'Active ride object details' }
        }
      }
    },
    '/api/rides/available': {
      get: {
        summary: 'Fetch available requested rides list',
        tags: ['Rides'],
        responses: {
          200: { description: 'Available rides array' }
        }
      }
    },
    '/api/rides/{id}/status': {
      patch: {
        summary: 'Update ongoing ride progression status (Drivers only)',
        tags: ['Rides'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status progressed' }
        }
      }
    },
    '/api/rides/schedule': {
      post: {
        summary: 'Reserve a future ride (Passengers only)',
        tags: ['Rides Scheduling'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pickupLocation', 'destination', 'fare', 'scheduledTime'],
                properties: {
                  pickupLocation: { type: 'string' },
                  destination: { type: 'string' },
                  fare: { type: 'number' },
                  scheduledTime: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Ride scheduled successfully' }
        }
      }
    },
    '/api/rides/scheduled/upcoming': {
      get: {
        summary: 'List upcoming reservations (Passengers only)',
        tags: ['Rides Scheduling'],
        responses: {
          200: { description: 'Upcoming scheduled transits list' }
        }
      }
    },
    '/api/rides/scheduled/{id}': {
      delete: {
        summary: 'Cancel an upcoming scheduled ride reservation',
        tags: ['Rides Scheduling'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: { description: 'Reservation cancelled' }
        }
      }
    },
    '/api/ratings': {
      post: {
        summary: 'Submit rating feedback review',
        tags: ['Ratings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rideId', 'stars'],
                properties: {
                  rideId: { type: 'string', format: 'uuid' },
                  stars: { type: 'integer', minimum: 1, maximum: 5 },
                  feedback: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Rating submitted' }
        }
      }
    },
    '/api/ratings/driver/{id}': {
      get: {
        summary: 'List passenger reviews for a driver',
        tags: ['Ratings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: { description: 'Reviews array list' }
        }
      }
    },
    '/api/analytics': {
      get: {
        summary: 'Fetch campus-wide transit metrics',
        tags: ['Analytics'],
        responses: {
          200: { description: 'Aggregate analytics data' }
        }
      }
    },
    '/api/admin/drivers/pending': {
      get: {
        summary: 'Fetch list of pending driver registration requests (Admins only)',
        tags: ['Admin Console'],
        responses: {
          200: { description: 'Pending drivers array list' },
          403: { description: 'Access denied: Admin privileges required' }
        }
      }
    },
    '/api/admin/drivers/{id}/verify': {
      patch: {
        summary: 'Verify (Approve or Reject) a driver registration (Admins only)',
        tags: ['Admin Console'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['APPROVED', 'REJECTED'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Driver verification status updated' },
          400: { description: 'Invalid payload status parameters' },
          403: { description: 'Access denied' },
          404: { description: 'Driver profile not found' }
        }
      }
    }
  }
};
