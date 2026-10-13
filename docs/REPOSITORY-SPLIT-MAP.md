# Repository split and file coverage

The original full-stack repository is preserved at https://github.com/AryanMunjala/nexora-workforce.

## Frontend files in this repository
All frontend application files from the original `frontend/` directory are at the root of this repository: React source, Vite config, package manifest, HTML entry point, styles, API client, environment example, ignore rules, Nginx config, Railway config, and Dockerfile.

## Shared/root assets and where they went
- Root README information: summarized in this repository's README and project report.
- Root GitHub Actions workflow: separated into frontend and backend CI workflows in their respective repositories.
- Root `.env.example`: service-specific variables are documented in the frontend and backend environment examples; local full-stack Compose secrets remain documented with the original monorepo.
- Root `.gitignore`: each standalone repository has its own ignore rules.
- `docs/PROJECT-REPORT.md`, deployment checklist, Railway deployment notes, and Postman testing pointer are included here in frontend-specific form.
- `compose.yaml` is a full-stack integration file whose original build contexts point to both `frontend/` and `backend/`; it remains in the preserved monorepo rather than being copied unchanged into this standalone repository.

## Backend and API testing
The backend implementation and importable Postman collection are in https://github.com/AryanMunjala/nexora-workforce-backend.

No files have been deleted from the original monorepo. The standalone repositories contain the appropriate application code and supporting files for presenting each layer separately.
