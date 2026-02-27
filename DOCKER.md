# Docker Quick Start

## Prerequisites
- Docker Desktop

## 1) Prepare environment files
- Copy templates and set real values:
  - `copy .env.example .env`
  - `copy backend\.env.example backend\.env`
  - `copy frontend\.env.example frontend\.env`

## 2) Build and run
From project root:

```powershell
docker compose up --build -d
```

## 3) Access apps
- Frontend: `http://localhost:8080`
- Backend API (via frontend proxy): `http://localhost:8080/api/v1`

## 4) Logs and stop
```powershell
docker compose logs -f
docker compose down
```

## Notes
- SQLite data is persisted in Docker volume `backend-data`.
- For production, set `APP_ENV=production` and provide strong non-default secrets/passwords.
