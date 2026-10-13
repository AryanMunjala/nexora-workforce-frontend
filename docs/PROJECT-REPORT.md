# Nexora Workforce — Frontend Project Report

## Abstract
Nexora Workforce is a full-stack employee management web application. This repository contains the responsive React + Vite frontend. It communicates with the separate Spring Boot backend through the API helper and supports employee directory, search, create, edit, delete, and status presentation.

## Technology stack
React, Vite, JavaScript, CSS, Fetch/Axios API integration, Nginx for container hosting, GitHub Actions, Railway.

## Frontend modules
- Employee directory and status display
- Search/filter interface
- Employee create/edit form and validation
- Delete action and API error handling
- API client configured using `VITE_API_BASE_URL`
- Production container configuration and Nginx routing

## Run locally
1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env` if a custom API URL is needed.
3. Run `npm install` and `npm run dev`.
4. Set `VITE_API_BASE_URL` to the backend API base URL (ending in `/api`) when not using the local default.

The backend must be running and configured to allow the frontend origin.

## Full-stack context
The original monorepo remains available at https://github.com/AryanMunjala/nexora-workforce and contains the integration Docker Compose file and the combined project history. The standalone frontend repository intentionally contains frontend source and frontend-specific deployment/build configuration.
