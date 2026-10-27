# CareerTrack

CareerTrack is a full-stack job and internship tracker designed as a college end-term project. It helps users manage applications, track progress, monitor interview follow-ups, and review analytics from a single dashboard.

## Features

- User registration and login with JWT authentication
- Protected routes for authenticated users only
- Add, edit, delete, and search job applications
- Status tracking across the application lifecycle
- Dashboard analytics with totals and monthly activity
- Upcoming follow-up reminders
- User profile management and password update
- Clean React + Express project structure for maintainability

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express, local JSON file storage, JWT, bcryptjs
- Testing: Jest, Supertest

## Project Structure

- `client/` — frontend React app
- `server/` — Express API server and local JSON data storage
- `.gitignore` — project gitignore
- `package.json` — root convenience scripts

## Setup

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

Create a `.env` file in `server/` based on `.env.example`.

```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
```

### 3. Run the app

From the project root, start the backend and frontend in separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The server creates `server/data/users.json` and `server/data/applications.json` automatically on first use. These files are ignored by Git and keep data between restarts.


## Production build

```bash
npm run build
```

## Notes

- The app uses JWT-based auth for protected API routes.
- Backend data is stored locally in JSON files. This is suitable for a small demo, but not for production, large datasets, or concurrent multi-process writes.
- Existing MongoDB/Atlas records are not automatically copied into JSON storage. Keep any existing database or backup until you have exported and verified records you need.
- Run backend API and storage tests with:

```bash
npm run test:server
```

## Viva-ready project summary

CareerTrack is a full-stack job and internship tracking application built to help students and early-career professionals manage their applications in one place. The project focuses on real-world skills such as building a secure authenticated system, designing protected APIs, persisting local JSON data safely, and connecting a React frontend to a backend service.

The application allows users to:

- register and log in securely with JWT authentication
- manage job applications with create, read, update, and delete actions
- filter and search application records by status and keyword
- track progress through stages such as applied, assessment, interview, offer, and rejected
- review dashboard metrics and recent activity
- maintain a profile and update their password
- plan follow-up reminders for active opportunities

This makes CareerTrack a strong end-term project because it combines both frontend and backend development with practical problem-solving, user workflow design, and maintainable modular structure.

## Suggested demo flow

1. Open the app and register a new user.
2. Log in and land on the dashboard.
3. Add a couple of job applications with different statuses.
4. Search and filter the applications list.
5. View the dashboard analytics and follow-up items.
6. Update the profile and password.
7. Explain the architecture and security decisions.

## End-term project focus

This project was built with a beginner-friendly, maintainable structure that keeps frontend and backend responsibilities separate while still delivering a usable application workflow and dashboard for a college project demo.
