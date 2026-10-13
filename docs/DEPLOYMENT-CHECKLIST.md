# Frontend deployment checklist

- [ ] Set `VITE_API_BASE_URL` to the backend public URL ending in `/api`.
- [ ] Rebuild the frontend after changing Vite environment variables.
- [ ] Deploy the frontend container/static site.
- [ ] Confirm the deployed origin is allowed by the backend CORS configuration.
- [ ] Verify listing, search, create, edit, and delete against the deployed backend.
- [ ] Never commit real secrets or `.env` files.

Only mark items complete after verifying them in the target environment.
