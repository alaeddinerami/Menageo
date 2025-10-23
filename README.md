# Reservation & Employee Chat System 🗓️💬

Menageo is a NestJS-based backend application that provides a reservation system and a real-time chat feature for customers and employees. The project aims to simplify the management of service reservations and facilitate communication between clients and service providers.

Main Function Points
Reservation System: Includes features like time slot availability checking, JWT-protected reservation operations, reservation conflict detection, and a notification system (email/SMS ready).
Employee Chat: Offers real-time messaging via Socket.IO, conversation history tracking, online status indicators, end-to-end encrypted messages, and message read receipts.
Technology Stack
Core: NestJS 11
Database: MongoDB + Mongoose
Real-Time: Socket.IO
Auth: JWT + Passport
Validation: class-validator
Testing: Jest + Supertest

## Key Features ✨

**Reservation System**
-  Time slot availability checking
-  JWT-protected reservation operations
-  Reservation conflict detection
-  Notification system (email/SMS ready)
-  Reservation timeout handling

**Employee Chat**
-  Real-time messaging via Socket.IO
-  Conversation history tracking
-  Online status indicators
-  End-to-end encrypted messages
-  Message read receipts

## Tech Stack 

- **Core**: NestJS 11
- **Database**: MongoDB + Mongoose
- **Real-Time**: Socket.IO
- **Auth**: JWT + Passport
- **Validation**: class-validator
- **Testing**: Jest + Supertest

## Quick Start 🚀

```bash
# 1. Clone and install
git clone https://github.com/alaeddinerami/Menageo
cd server
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start development server
npm run start:dev
```

## Testing

```bash
npm run test:user-reservation
```

## Docker

```bash
# Build and start containers
docker-compose up --build
```

---

## 📚 API Endpoints

### 🔐 Auth Routes (`/auth`)
| Method | Endpoint        | Description         |
|--------|------------------|---------------------|
| POST   | `/auth/signUp`   | Register a new user |
| POST   | `/auth/login`    | Login a user        |

---

### 👤 User Routes (`/user`)
| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| GET    | `/user`          | Get all users             |
| POST   | `/user`          | Create a new user         |
| GET    | `/user/:id`      | Get a specific user       |
| PATCH  | `/user/:id`      | Update a user             |
| DELETE | `/user/:id`      | Delete a user             |

---

### 📅 Reservation Routes (`/reservations`)
| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/reservations`           | Get all reservations               |
| POST   | `/reservations`           | Create a new reservation           |
| GET    | `/reservations/cleaner`   | Get reservations by cleaner        |
| GET    | `/reservations/client`    | Get reservations by client         |
| GET    | `/reservations/:id`       | Get reservation by ID              |
| PATCH  | `/reservations/:id`       | Update reservation by ID           |
| DELETE | `/reservations/:id`       | Delete reservation by ID           |

---

### 💬 Chat Routes (`/chat`)
| Method | Endpoint                                            | Description                        |
|--------|-----------------------------------------------------|------------------------------------|
| POST   | `/chat/message`                                     | Send a message                     |
| GET    | `/chat/messages/:userId/:otherUserId`               | Get messages between two users     |
| GET    | `/chat/:userId`                                     | Get all chats for a user           |
| PATCH  | `/chat/message/:messageId/read`                     | Mark message as read               |
