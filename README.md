# Draft

Draft is a modern drink ordering system designed for popular bars and restaurants. It allows users to browse menus, place orders, manage tabs, and handle payments seamlessly through a real-time web application. It aims to address the inefficiencies of bar staff having to handle and conduct transations while also serving customers in a busy environment. The tab management is offloaded to the customer to increase staff efficiency.

## Features

- **User Authentication**: Secure signup and login with JWT tokens
- **Restaurant Management**: Browse available restaurants and their menus
- **Real-time Ordering**: Place drink orders with live updates via WebSocket
- **Tab Management**: Create and manage drink tabs for groups
- **Payment Processing**: Add and manage payment methods (currently using test card data)
- **Responsive Design**: Modern React-based frontend that works on all devices

## Tech Stack

### Frontend
- **React 19** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database operations
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time bidirectional communication
- **Winston** - Logging library

### Development Tools
- **Jest** - Testing framework

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jcairns19/Draft.git
   cd Draft
   ```

2. **Install dependencies for both client and server:**

   **Client:**
   ```bash
   cd client
   npm install
   npm run build
   ```

   **Server:**
   ```bash
   cd ../server
   npm install
   ```

## Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=draft_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_jwt_secret_key_here

# Logging Level
LOG_LEVEL=info
```
## Database Setup

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE draft_db;
   ```

2. **Run the database schema:**
   ```bash
   cd server
   npm run db-reset
   ```

   This will create all necessary tables and populate them with sample data.

## Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend development server: (Optional if frontend dist code was not built)**
   ```bash
   cd client
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Build

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server:**
   ```bash
   cd server
   npm start
   ```

The production build will serve the frontend from the backend server.

#### Check out the live demo server!
View the live demo at https://draft.jackhcairns.dev

## Testing

### Backend Tests using Jest
```bash
cd server
npm test
```

## API Documentation

The API endpoints are organized as follows:

- **Authentication**: `/api/auth`
  - `POST /login` - User login
  - `POST /signup` - User registration
  - `POST /logout` - User logout

- **Restaurants**: `/api/restaurants`
  - `GET /` - Get all restaurants
  - `GET /:id` - Get restaurant details

- **Tabs**: `/api/tabs`
  - `GET /` - Get user's tabs
  - `POST /` - Create new tab
  - `GET /:id` - Get tab details
  - `POST /:id/items` - Add item to tab

- **Payments**: `/api/payments`
  - `GET /methods` - Get payment methods
  - `POST /methods` - Add payment method

All API endpoints require authentication except for signup and login.

## Project Structure

```
Draft/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, Socket)
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── database/          # Database configuration and models
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── tests/             # Unit tests
│   └── package.json
└── README.md
```

## Author

Jack Cairns (cairnsjh@bu.edu)
