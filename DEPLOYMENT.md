# Deployment (future path — documentation only)

Dayfold runs 100% locally for development. This document describes the intended
self-hosting path so the app can be deployed later without rework. **Nothing here is
required to develop locally.**

Everything is designed to be **12-factor** (all config via environment variables), so
this stays a copy-paste deployment.

---

## Target: one Oracle Cloud Always-Free VM

Oracle Cloud's Always-Free tier includes an ARM Ampere A1 instance with up to
**4 OCPU / 24 GB RAM** — plenty for Postgres, the sync service, and the Next.js app.

### Topology

```
                     ┌─────────────────────────────┐
   Internet ── 443 ──▶  Caddy (reverse proxy, TLS)  │
                     └───────────────┬──────────────┘
                        ┌────────────┼─────────────┐
                        ▼            ▼             ▼
                     web:3000    sync:1234     (static/uploads)
                        │            │
                        └──────┬─────┘
                               ▼
                          postgres:5432
```

All services run under **Docker Compose** on the VM.

---

## Steps (outline)

1. **Provision** the Always-Free ARM VM (Ubuntu LTS). Open ports 80/443 in the
   security list; keep 5432/1234/3000 internal to the Docker network.

2. **Install** Docker + Docker Compose plugin.

3. **Clone** the repo and create a production `.env`:
   - Strong `BETTER_AUTH_SECRET` (`openssl rand -base64 32`)
   - Strong `SYNC_SHARED_SECRET`
   - Strong `POSTGRES_PASSWORD`
   - `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` → `https://your-domain`
   - `NEXT_PUBLIC_SYNC_URL` → `wss://your-domain/sync` (proxied by Caddy)
   - Optional `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

4. **Extend `docker-compose.yml`** for production to also run the web app
   (`apps/web/Dockerfile`, already provided) and Caddy. Example services to add:
   - `web` — built from `apps/web/Dockerfile`, `depends_on` postgres
   - `caddy` — terminates TLS, proxies `/` → web, `/sync` → sync

5. **Caddy** handles HTTPS automatically via Let's Encrypt. A minimal `Caddyfile`:

   ```
   your-domain.com {
     handle_path /sync* {
       reverse_proxy sync:1234
     }
     reverse_proxy web:3000
   }
   ```

6. **Run migrations** once on deploy:
   `docker compose run --rm web npm run db:migrate`
   (seeding is only for local demos — skip in production).

7. **Backups** — nightly `pg_dump` to a second block volume:

   ```bash
   # /etc/cron.daily/dayfold-backup
   docker exec dayfold-postgres pg_dump -U dayfold dayfold \
     | gzip > /mnt/backups/dayfold-$(date +%F).sql.gz
   find /mnt/backups -name 'dayfold-*.sql.gz' -mtime +14 -delete
   ```

---

## Production checklist

- [ ] All secrets rotated away from the `dev-insecure-*` defaults
- [ ] `NODE_ENV=production`
- [ ] Postgres data on a persistent volume; nightly `pg_dump` verified restorable
- [ ] Caddy TLS working; HTTP → HTTPS redirect
- [ ] Only 80/443 exposed publicly
- [ ] `/uploads` on a persistent volume (or swap `storage.js` for S3/R2)
- [ ] Health checks green: web `/`, sync `/health`
