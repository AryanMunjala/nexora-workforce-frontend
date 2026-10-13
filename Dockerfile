FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build
FROM nginx:1.27-alpine
# Cap worker count on hosts exposing unusually high CPU counts.
RUN sed -i 's/worker_processes[[:space:]]\+auto;/worker_processes 2;/' /etc/nginx/nginx.conf \
    && rm -f /docker-entrypoint.d/30-tune-worker-processes.sh
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
