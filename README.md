# Hawma — Le quartier, en clair

Hawma is a small, bilingual civic-reporting MVP for documenting visible neighborhood issues in Tunisia. Residents can browse, search, and filter reports, inspect their displayed status, and submit a report in French or Arabic.

It is a community visibility tool, **not** an official municipal channel. Reports are not verified or automatically forwarded to public services, and the site does not promise a response or repair. Do not use it for emergencies or include sensitive personal information.

## Why this focus

The World Bank's Tunisia Country Climate and Development Report overview names water scarcity, coastal erosion, and increasing flood risk among the country's climate challenges. Hawma offers a modest local mechanism for documenting and sharing visible neighborhood observations; it does not solve those national challenges.

- [World Bank — Tunisia Country Climate and Development Report](https://www.worldbank.org/en/country/tunisia/publication/tunisia-country-climate-and-development-report)

Local development starts with five fictional examples in Tunis, Sfax, and Sousse. They are labeled in the interface and are not evidence about actual neighborhoods or municipal services. Production starts with an empty public feed by default, so the public site never presents invented incidents as real. Set `SEED_DEMO_DATA=true` only when you explicitly want to seed a demonstration instance.

## Run locally

Requirements: Node.js 18+ and npm.

```powershell
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Without a database URL, Express stores reports in `server/data/reports.json` and creates the five clearly fictional seed examples on first start. This local file survives server restarts but is only suitable for a single server instance. Set `DATA_FILE` to move it to a persistent disk location.

## Use MongoDB

Copy `.env.example` to `.env` and set `MONGODB_URI` to a local MongoDB connection string or an Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hawma
```

Then run `npm run dev` as above. If the database has no reports, the server inserts the synthetic sample reports once. New submissions are stored in MongoDB. Keep `.env` private; it is excluded from version control.

To create and serve a production build:

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Set `MONGODB_URI` in the same environment to use MongoDB. Without it, production uses the persistent single-instance JSON store. Generate a moderator key and set `ADMIN_TOKEN` in `.env` to enable report review and hiding:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `.env` as `ADMIN_TOKEN=...`; do not commit or share it. The moderator opens **Espace modération** in the footer, enters this key, and can update public status or hide a report. Moderator notes are private to the moderation API.

## Stack

- **Frontend:** React, Vite, Lucide icons
- **API:** Node.js and Express
- **Database:** MongoDB through Mongoose, with an atomic JSON-file fallback for a single server instance

## API

- `GET /api/health` — readiness, storage mode (`local` or `mongodb`), and moderation availability
- `GET /api/reports` — list reports; optional `category` and `q` query parameters
- `POST /api/reports` — add a report
- `GET /api/moderation/reports` — list up to 200 reports, moderator-only
- `PATCH /api/moderation/reports/:id` — change status/visibility and add a private moderation note, moderator-only

Configure `ADMIN_TOKEN` with a long random secret to enable the bilingual moderation workspace linked in the footer. The token is held only in the moderator's page memory and sent as a Bearer token over HTTPS. The workspace can update report status or hide/re-publish reports; it cannot edit fictional examples. Hidden reports disappear from public listings but remain available to moderators. Never put the token in frontend code, a public issue, or a committed file.

Example request:

```json
{
  "title": "Éclairage public en panne",
  "description": "Un lampadaire ne s’allume plus à la tombée de la nuit.",
  "category": "lighting",
  "location": "Rue et repère à proximité",
  "area": "Tunis",
  "lang": "fr"
}
```

Valid categories are `water`, `waste`, `road`, `lighting`, and `other`. Public reports are unverified community submissions. Moderator-set statuses and private notes describe activity on this board only; they do not confirm public-service action.

New reports are immediately visible to everyone until a moderator hides them. The API limits each visitor IP to five submissions per 15 minutes, but this is a basic single-instance anti-spam measure, not identity verification. Do not submit personal, sensitive, or identifying information. The service does not collect contact details and does not currently provide account-based follow-up, a public removal-request form, image upload, municipal integration, or emergency response.

## Public deployment on a VPS

The included Docker Compose setup runs the production-built app, a private MongoDB database with separate root and app credentials, and Caddy for automatic HTTPS. It requires a Linux VPS with Docker Compose, a domain name whose DNS A/AAAA records point to that VPS, and inbound TCP ports 80 and 443 open. A small VPS in a region suitable for your users is enough for a pilot; choose a paid host and database backup plan appropriate to expected community use.

1. Copy the project files (including `Dockerfile`, `compose.yaml`, `Caddyfile`, and `server/init-mongo.js`) onto the VPS. Keep `.env` private; never publish it.
2. In the project directory, create `.env` with the domain, three long, randomly generated **letters-and-numbers-only** passwords, and a 64-character random moderator key:

   ```env
   HAWMA_DOMAIN=reports.example.tn
   MONGO_ROOT_USERNAME=hawmaRoot
   MONGO_ROOT_PASSWORD=replaceWithLongRandomAlphanumericSecret
   MONGO_APP_USERNAME=hawmaApp
   MONGO_APP_PASSWORD=replaceWithAnotherLongRandomAlphanumericSecret
   ADMIN_TOKEN=replaceWith64CharacterRandomHexToken
   ```

   Use unique secrets. Alphanumeric MongoDB passwords avoid connection-string escaping issues. Generate the moderator token with `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`.

3. Start the services:

   ```sh
   docker compose up --build -d
   docker compose ps
   ```

   Caddy obtains and renews the TLS certificate once DNS is pointing to the VPS and ports 80/443 are reachable. Visit `https://reports.example.tn`; check `/api/health` reports `"mode":"mongodb"`.

MongoDB is not published on a host port. Its data lives in the `mongodb_data` Docker volume. Back up that volume regularly before real community use; the compose file does not configure off-site backups. Use `docker compose logs -f app caddy` to troubleshoot and `docker compose down` to stop. Do not use `docker compose down -v` unless you intend to erase the database volume.

Set `ADMIN_TOKEN` in `.env` before starting the app to enable moderation; use a long, randomly generated secret and keep `.env` private. The IP rate limiter is in-memory and resets when the app restarts; it is suitable only for a small single-instance pilot. When running behind exactly one trusted reverse proxy, set `TRUST_PROXY_HOPS=1` so limits use the visitor IP (as the included Compose setup does). A larger launch needs a shared rate-limit store, a published moderation/removal process, a documented privacy/data-retention policy, and off-site backups. The moderator can hide reports but the app does not have account-based identity or emergency handling.

## License

MIT — see [LICENSE](LICENSE).
