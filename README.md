# Tontine API

> REST API for managing tontines (rotating savings and credit associations) with JWT authentication and automatic round tracking.


## What is a Tontine?

A tontine is a collaborative savings system where:
- Members contribute a fixed amount periodically
- Each cycle, one member receives the total pot
- Rotation continues until all members have received once
- Requires trust and commitment from all participants

## Features

- **JWT Authentication** with token blacklisting
- **Tontine Management** with automatic round progression
- **Participant Tracking** with position assignment
- **Payment System** with validation and round advancement
- **Round Status** monitoring
- **Input Validation** with Joi schemas
- **Comprehensive Testing** (23 tests, 82.71% coverage)
- **API Documentation** (Swagger + Postman)

## 🚀 Tech Stack

- **Backend**: Node.js 18+ + Express
- **Database**: PostgreSQL 14+ + Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI 3.0

## Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone git@github.com:rup1n13-san/tontine-api.git
cd tontine-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tontine_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS (optional)
CORS_ORIGIN=http://localhost:3000
```

### 4. Running the Application

### Development mode (with auto-reload)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

### Run tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Lint code

```bash
npm run lint
```

The API will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker Compose

```bash
# Start all services (API + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

The API will be available at `http://localhost:3000`

### Environment Variables for Docker

Create a `.env` file or use environment variables:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DB_NAME=tontine_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*
```

### Docker Commands

```bash
# Build the image
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f postgres

# Restart a service
docker-compose restart api

# Execute commands in container
docker-compose exec api npm test
docker-compose exec postgres psql -U postgres -d tontine_db

# Stop services
docker-compose stop

# Remove containers and networks
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

### Health Checks

Both services include health checks:

```bash
# Check API health
curl http://localhost:3000/health

# Check container health status
docker-compose ps
```

### Production Deployment

For production, update your `.env`:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASSWORD=<strong-password>
CORS_ORIGIN=https://your-domain.com
```

Then deploy:

```bash
docker-compose up -d
```


##  API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout (blacklist token) | Yes |

### Tontines

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/tontines` | Create tontine | Yes |
| GET | `/api/tontines` | List user's tontines | Yes |
| GET | `/api/tontines/:id` | Get tontine details | Yes |
| POST | `/api/tontines/:id/join` | Join tontine | Yes |
| POST | `/api/tontines/:id/pay` | Make payment | Yes |
| GET | `/api/tontines/:id/round` | Get round status | Yes |

### System

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

## 📚 API Documentation

### Swagger/OpenAPI

Full API documentation is available in Swagger format:
- **File**: [`docs/swagger.yaml`](docs/swagger.yaml)
- **View**: Use [Swagger Editor](https://editor.swagger.io/) or check the [Endpoints](http://localhost:3000/api-docs)

### Postman Collection

Import the Postman collection for easy testing:
- **File**: [`docs/tontine-api.postman_collection.json`](docs/tontine-api.postman_collection.json)
- **Features**:
  - All endpoints with examples
  - Automated tests
  - Environment variables
  - Auto-save auth token

**Environment Variables** (Postman):
```json
{
  "baseUrl": "http://localhost:3000",
  "authToken": "",
  "userId": "",
  "tontineId": ""
}
```

## 💡 Usage Examples

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Compte créé avec succès"
}
```

### 2. Create a tontine

```bash
curl -X POST http://localhost:3000/api/tontines \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Monthly Savings",
    "amount": 50000,
    "frequency": 30,
    "startDate": "2025-02-01"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Monthly Savings",
    "amount": "50000.00",
    "frequency": 30,
    "currentRound": 1,
    "status": "pending",
    "creator": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### 3. Make a payment

```bash
curl -X POST http://localhost:3000/api/tontines/TONTINE_ID/pay \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 50000}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roundNumber": 1,
    "amount": "50000.00",
    "status": "completed"
  },
  "message": "Payment for round 1 recorded successfully"
}
```

## 📁 Project Structure

```
tontine-api/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize configuration
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   └── tontine.controller.js # Tontine logic
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── validate.js          # Joi validation wrapper
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Tontine.js           # Tontine model
│   │   ├── Participant.js       # Participant model
│   │   ├── Payment.js           # Payment model
│   │   ├── BlacklistedToken.js  # Token blacklist model
│   │   └── index.js             # Model associations
│   ├── routes/
│   │   ├── auth.routes.js       # Auth routes
│   │   ├── tontine.routes.js    # Tontine routes
│   │   └── index.js             # Route aggregator
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   └── response.js          # Response helpers
│   ├── validators/
│   │   ├── auth.validator.js    # Auth validation schemas
│   │   └── tontine.validator.js # Tontine validation schemas
│   └── index.js                 # Application entry point
├── test/
│   ├── auth.test.js             # Auth tests (10 tests)
│   └── tontine.test.js          # Tontine tests (13 tests)
├── docs/
│   ├── swagger.yaml             # OpenAPI documentation
│   └── tontine-api.postman_collection.json
├── .env.example
├── .eslintrc.json
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## 🧪 Testing

The project includes comprehensive tests with Jest and Supertest.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Test Suites:**
- Authentication Tests (10 tests)
- Tontine CRUD Tests (13 tests)

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Tokens**: With expiration and blacklisting
- **CORS**: Configurable origins
- **Helmet**: Security headers
- **Rate Limiting**: On authentication endpoints
- **Input Validation**: Joi schemas on all inputs
- **SQL Injection Prevention**: Sequelize ORM
- **Environment Variables**: Sensitive data protection

## 🐳 Docker Support

✅ **Available!** See [Docker Deployment](#-docker-deployment) section above.

**Features:**
- Multi-stage Dockerfile for optimized images
- Docker Compose with PostgreSQL
- Health checks for both services
- Volume persistence for database
- Non-root user for security

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

**rup1n13-san**
