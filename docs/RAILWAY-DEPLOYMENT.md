# Railway deployment — frontend repository

1. Add a service from `AryanMunjala/nexora-workforce-frontend`, branch `main`. Its Dockerfile is at the repository root.
2. Set `VITE_API_BASE_URL` to the backend public URL plus `/api` before building (for example, `https://your-backend-domain/api`).
3. Generate a public domain for the frontend.
4. Set the backend's `FRONTEND_ORIGIN` to the frontend's HTTPS origin.
5. Verify employee listing, search, create, update, and delete on the live site.

Never commit real secrets. The backend and database are maintained separately.
