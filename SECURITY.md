# Security and GitHub Commit Checklist

## 1) Environment and secrets
- Never commit real `.env` files.
- Keep only `.env.example` templates in git.
- Generate strong secrets before production use:
  - `JWT_SECRET_KEY` at least 32 characters.
  - `BIOMETRIC_INGEST_API_KEY` at least 16 characters.
- In production (`APP_ENV=production`), backend startup now rejects weak default secrets/passwords.

## 2) GitHub repository safety
- Ensure repository is private if it contains internal business logic.
- Enable branch protection on `main` (required PR + status checks).
- Enable GitHub Dependabot alerts and secret scanning.
- Add repository secrets (for CI/CD), never plaintext in workflow files.

## 3) Docker runtime safety
- Backend container runs as non-root user.
- Frontend is served by Nginx with API reverse proxy.
- Do not expose backend port publicly unless required by your deployment topology.
- Use HTTPS termination in production (reverse proxy/load balancer).

## 4) Before pushing to remote
1. Verify `git status` has no real credentials.
2. Confirm no local DB dumps or key files are staged.
3. Keep only template values in `.env.example` files.
4. Rotate any secret that may have been previously committed.
