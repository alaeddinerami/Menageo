# Reservation & Employee Chat System 

A NestJS backend for managing service reservations and facilitating real-time chat between customers and employees.

## Key Features 

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
git clone https://github.com/your-username/reservation-chat.git
cd server
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start development server
npm run start:dev

```
## testing cmd
```bash
npm run test:user-reservation
```
## Build and start containers
docker-compose up --build

