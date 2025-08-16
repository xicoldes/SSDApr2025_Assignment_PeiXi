const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anime Community API',
      version: '1.0.0',
      description: 'A comprehensive API for managing anime communities with user authentication, anime database, forums, and watchlists.',
      contact: {
        name: 'API Support',
        email: 'support@aniconnect.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: {
              type: 'integer',
              description: 'Unique user identifier'
            },
            username: {
              type: 'string',
              description: 'Username (unique)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['admin', 'moderator', 'user'],
              description: 'User role'
            },
            profile_pic: {
              type: 'string',
              nullable: true,
              description: 'Profile picture URL'
            },
            bio: {
              type: 'string',
              nullable: true,
              description: 'User biography'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Anime: {
          type: 'object',
          properties: {
            anime_id: {
              type: 'integer',
              description: 'Unique anime identifier'
            },
            title: {
              type: 'string',
              description: 'Anime title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Anime description'
            },
            genre: {
              type: 'string',
              nullable: true,
              description: 'Anime genres (comma-separated)'
            },
            episodes: {
              type: 'integer',
              nullable: true,
              description: 'Total number of episodes'
            },
            release_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Release date'
            },
            studio: {
              type: 'string',
              nullable: true,
              description: 'Animation studio'
            },
            rating: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 10,
              description: 'Average rating (0-10)'
            },
            poster_url: {
              type: 'string',
              nullable: true,
              description: 'Poster image URL'
            }
          }
        },
        Thread: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'integer',
              description: 'Unique thread identifier'
            },
            anime_id: {
              type: 'integer',
              nullable: true,
              description: 'Related anime ID'
            },
            user_id: {
              type: 'integer',
              description: 'Thread creator ID'
            },
            username: {
              type: 'string',
              description: 'Thread creator username'
            },
            title: {
              type: 'string',
              description: 'Thread title'
            },
            content: {
              type: 'string',
              description: 'Thread content'
            },
            view_count: {
              type: 'integer',
              description: 'Number of views'
            },
            is_pinned: {
              type: 'boolean',
              description: 'Whether thread is pinned'
            },
            is_locked: {
              type: 'boolean',
              description: 'Whether thread is locked'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            comment_id: {
              type: 'integer',
              description: 'Unique comment identifier'
            },
            thread_id: {
              type: 'integer',
              description: 'Thread ID this comment belongs to'
            },
            user_id: {
              type: 'integer',
              description: 'Comment author ID'
            },
            username: {
              type: 'string',
              description: 'Comment author username'
            },
            parent_comment_id: {
              type: 'integer',
              nullable: true,
              description: 'Parent comment ID for nested replies'
            },
            content: {
              type: 'string',
              description: 'Comment content'
            },
            upvotes: {
              type: 'integer',
              description: 'Number of upvotes'
            },
            downvotes: {
              type: 'integer',
              description: 'Number of downvotes'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        WatchlistEntry: {
          type: 'object',
          properties: {
            list_id: {
              type: 'integer',
              description: 'Unique watchlist entry identifier'
            },
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            anime_id: {
              type: 'integer',
              description: 'Anime ID'
            },
            status: {
              type: 'string',
              enum: ['watching', 'completed', 'on-hold', 'dropped', 'plan-to-watch'],
              description: 'Watch status'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
              description: 'User rating (1-5 stars)'
            },
            progress: {
              type: 'integer',
              minimum: 0,
              description: 'Episodes watched'
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'User notes'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Array of data items'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Current page number'
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page'
                },
                total: {
                  type: 'integer',
                  description: 'Total number of items'
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages'
                },
                hasNext: {
                  type: 'boolean',
                  description: 'Whether there is a next page'
                },
                hasPrev: {
                  type: 'boolean',
                  description: 'Whether there is a previous page'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        },
        AuthRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username'
            },
            password: {
              type: 'string',
              description: 'Password'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (minimum 6 characters)'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Access denied'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Forbidden'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation failed'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // 🔥 THIS IS THE KEY CHANGE - Point to the docs folder
  apis: [
    './swagger/docs/*.js'  // Scan all JS files in swagger/docs/
  ]
};

const specs = swaggerJSDoc(options);

module.exports = { swaggerUi, specs };