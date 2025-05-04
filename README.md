# DraftMons - Pokemon Draft League Management System

DraftMons is a comprehensive backend system designed to manage Pokemon draft leagues, built with TypeScript, Node.js, Express.js, TypeORM, and PostgreSQL.

## Features

- **User Authentication**: OAuth 2.0 with Google for secure login
- **League Management**: Create and manage Pokemon draft leagues
- **Season System**: Configure seasons with custom rules and point values
- **Team Management**: Draft Pokemon to build competitive teams
- **Match Scheduling**: Organize weekly matches between teams
- **Game Statistics**: Track battle stats for individual Pokemon
- **RESTful API**: Clean API design with proper validation and error handling

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js with Google OAuth 2.0
- **Session Management**: Redis for session storage
- **Data Transfer**: Class-transformer for DTO pattern
- **Validation**: Class-validator for input validation

## Project Structure

```
draftmons-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── dtos/             # Data Transfer Objects
│   ├── entities/         # Database entities
│   ├── middleware/       # Express middleware
│   ├── migrations/       # TypeORM migrations
│   ├── repositories/     # Repository extensions
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── routes/           # Route definitions
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server entry point
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis (optional, for production)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/draftmons-backend.git
   cd draftmons-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   # Create a PostgreSQL database named 'draftmons'
   npm run migration:run
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### OAuth Configuration

To enable Google OAuth 2.0:

1. Create a project in the Google Developer Console
2. Configure OAuth credentials
3. Add the callback URL: `http://localhost:3000/auth/google/callback`
4. Add Google credentials to your `.env` file

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout current user

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Leagues
- `GET /api/leagues` - List all leagues
- `GET /api/leagues/:id` - Get league by ID
- `POST /api/leagues` - Create league
- `PUT /api/leagues/:id` - Update league (moderator only)
- `DELETE /api/leagues/:id` - Delete league (moderator only)
- `GET /api/leagues/:id/members` - List league members
- `POST /api/leagues/:id/members` - Add member to league
- `PUT /api/leagues/:id/members/:userId` - Update member role
- `DELETE /api/leagues/:id/members/:userId` - Remove member

### Seasons
- `GET /api/leagues/:id/seasons` - List league seasons
- `GET /api/leagues/:id/seasons/:seasonId` - Get season details
- `POST /api/leagues/:id/seasons` - Create season
- `PUT /api/leagues/:id/seasons/:seasonId` - Update season
- `DELETE /api/leagues/:id/seasons/:seasonId` - Delete season

### Pokemon
- `GET /api/pokemon` - List all Pokemon
- `GET /api/pokemon/:id` - Get Pokemon by ID
- `POST /api/pokemon` - Create Pokemon (admin only)
- `PUT /api/pokemon/:id` - Update Pokemon (admin only)
- `DELETE /api/pokemon/:id` - Delete Pokemon (admin only)
- Various routes for managing Pokemon types, abilities, moves, etc.

## Deployment

For production deployment:

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables for production
3. Run migrations:
   ```bash
   npm run migration:run
   ```

4. Start the server:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
