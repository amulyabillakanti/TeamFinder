# student-skill-team-finder
Student Skill and Project Team Finder-CRT team Project

## Run locally

Requirements: Node.js and a reachable MongoDB database.

1. In `backend`, copy `.env.example` to `.env`, then set `MONGO_URI` and a long, private `JWT_SECRET`. Install dependencies and start the API:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

2. In a second terminal, start the frontend. Its API URL defaults to `http://localhost:5050`; set `VITE_API_URL` in `frontend/.env` if the API uses another address.

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

New users must register with a name, valid email address, and password of at least 8 characters. Returning users must log in with the same email and password. The dashboard is shown only after the API verifies the account and session; invalid credentials are rejected.
