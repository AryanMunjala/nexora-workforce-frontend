# Nexora Workforce — Frontend

React and Vite frontend for the Nexora Workforce employee management system.

- **Live app:** https://nexora-frontend-production-ebc0.up.railway.app
- **Backend API:** https://nexora-backend-production-3f15.up.railway.app
- **Backend repository:** https://github.com/AryanMunjala/nexora-workforce-backend
- **Original full-stack repository:** https://github.com/AryanMunjala/nexora-workforce

## Requirements

- Node.js 22 or a compatible current LTS release
- npm

## Run locally

Run these commands from the frontend repository folder:

```bash
npm install
```

Create your local environment file by copying `.env.example` to `.env`. On Windows Command Prompt:

```bat
copy .env.example .env
```

The example config points the frontend to `http://localhost:8080/api`. Make sure the backend is running locally at that address, then start Vite:

```bash
npm run dev
```

Vite prints the local development URL in the terminal.

## Production / Docker

The included Dockerfile builds the static frontend and serves it through Nginx. The Nginx configuration proxies `/api/` requests to the deployed backend. The Docker build defaults `VITE_API_BASE_URL` to `/api`.

Do not put database credentials or other secrets in frontend environment variables; values prefixed with `VITE_` are exposed to the browser.
