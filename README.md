# Hawma — Le quartier, en clair

Hawma is a bilingual, community-run pilot for sharing visible neighborhood issues across all 24 Tunisian governorates. Residents can browse, search, and filter reports, submit a report in French or Arabic without creating an account, add their town or neighborhood, confirm that they see the same issue, and flag content for moderator review.

It is a community visibility tool, **not** an official municipal channel. New reports wait for human review before publication; published reports are still community observations, not verified facts, and are never automatically forwarded to public services. Hawma cannot promise a response or repair. Do not use it for emergencies or include names, contact details, or other sensitive personal information.

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

Open [http://localhost:5173](http://localhost:5173). Without a database URL, Express stores reports and anonymous interaction records under `server/data/`, and creates five clearly fictional seed examples on first start. This JSON fallback survives server restarts but is suitable only for local development or a single-instance pilot.

Run `npm test` to start an isolated production-mode API against temporary files and exercise the report queue, anonymous actions, moderation privacy, authentication failures, and persistence across restarts. The tests do not connect to MongoDB or modify your local reports.

## Use MongoDB

Copy `.env.example` to `.env` and set `MONGODB_URI` to a local MongoDB connection string or an Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hawma
```

Then run `npm run dev` as above. If the database has no reports, the server inserts the synthetic sample reports once. New reports are kept private in a moderation queue until an operator publishes them. Keep `.env` private; it is excluded from version control.

To create and serve a production build:

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Before starting production, copy `.env.example` to `.env` and configure MongoDB, a moderator key, and a stable anonymous-interaction key. Production startup refuses to use the local JSON fallback and fails if `MONGODB_URI` is missing or if either application key is shorter than 32 characters. Generate two random secrets locally:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set one generated value as `ADMIN_TOKEN` and another as `SUPPORT_SECRET` in `.env`. Do not commit or share either key. The moderator opens **Espace modération** in the footer, enters the admin key, and can publish, return to review, or hide reports; update their status; and inspect private flag counts and moderation notes. Failed moderator authentication attempts are rate-limited.

## Stack

- **Frontend:** React, Vite, Lucide icons
- **API:** Node.js and Express
- **Database:** MongoDB through Mongoose, with an atomic JSON-file fallback for a single server instance
- **Community actions:** anonymous, per-browser support and content flags; no names, accounts, or email addresses are collected
- **Fonts:** Barlow and Changa are self-hosted under the SIL Open Font License; page visits do not request fonts from an external provider

## API

- `GET /api/health` — readiness, storage mode (`local` or `mongodb`), moderation, and community-action availability
- `GET /api/reports` — list reports; optional `category`, `governorate`, and `q` query parameters
- `POST /api/reports` — submit a report to the private moderation queue
- `POST /api/reports/:id/support` — anonymously confirm that you also see a published issue; deduplicated per browser
- `POST /api/reports/:id/flag` — privately flag a published report for moderator review
- `GET /api/moderation/reports` — list up to 200 reports, moderator-only
- `PATCH /api/moderation/reports/:id` — publish, return to review, or hide a report; change its board status and private note, moderator-only

Configure `ADMIN_TOKEN` with a long random secret to enable the bilingual moderation workspace linked in the footer. The token is held only in the moderator's page memory and sent as a Bearer token over HTTPS. The workspace can update report status or hide/re-publish reports; it cannot edit fictional examples. Hidden reports disappear from public listings but remain available to moderators. Never put the token in frontend code, a public issue, or a committed file.

Example request:

```json
{
  "title": "Éclairage public en panne",
  "description": "Un lampadaire ne s’allume plus à la tombée de la nuit.",
  "category": "lighting",
  "location": "Rue et repère à proximité",
  "area": "Tunis",
  "governorate": "tunis",
  "lang": "fr"
}
```

`governorate` is one of the 24 IDs in `shared/governorates.js`; `area` remains a resident-entered city, town, or neighborhood so smaller places are not restricted to a fixed list. Valid categories are `water`, `waste`, `road`, `lighting`, and `other`. Public reports are unverified community submissions. Moderator-set statuses and private notes describe activity on this board only; they do not confirm public-service action.

Each new report is reviewed by a human moderator before it can appear publicly. Public reports can receive one anonymous “I see it too” support and one content flag per browser; opaque browser identifiers are signed with `SUPPORT_SECRET`, hashed before storage, and never expose an IP address to the application database. MongoDB expires these hashed deduplication records after one year; the local fallback prunes them at startup. Clearing browser storage or changing devices can reset this limit, so these actions are abuse signals, not identity verification or a vote. API rate limits are per process/IP and reset on restart; use a shared rate-limit store and bot protection before running multiple app replicas or a high-traffic public launch. Do not submit personal, sensitive, or identifying information. Host and proxy access logs may contain IP addresses and need their own retention controls. The service does not collect contact details and does not provide user accounts, private follow-up, a public removal-request form, image upload, municipal integration, or emergency response.

## Public deployment on a VPS

The included Docker Compose setup runs the production-built app, a private MongoDB database with separate root and app credentials, and Caddy for automatic HTTPS. It requires a Linux VPS with Docker Compose, a domain name whose DNS A/AAAA records point to that VPS, and inbound TCP ports 80 and 443 open. A small VPS in a region suitable for your users is enough for a pilot; choose a paid host and database backup plan appropriate to expected community use.

1. Copy the project files (including `Dockerfile`, `compose.yaml`, `Caddyfile`, and `server/init-mongo.js`) onto the VPS. Keep `.env` private; never publish it.
2. In the project directory, create `.env` with the domain, two long, randomly generated **letters-and-numbers-only** MongoDB passwords, and two independent 64-character random application keys:

   ```env
   HAWMA_DOMAIN=reports.example.tn
   MONGO_ROOT_USERNAME=hawmaRoot
   MONGO_ROOT_PASSWORD=replaceWithLongRandomAlphanumericSecret
   MONGO_APP_USERNAME=hawmaApp
   MONGO_APP_PASSWORD=replaceWithAnotherLongRandomAlphanumericSecret
   ADMIN_TOKEN=replaceWith64CharacterRandomHexToken
   SUPPORT_SECRET=replaceWithAnother64CharacterRandomHexToken
   ```

   Use unique secrets. Alphanumeric MongoDB passwords avoid connection-string escaping issues. Generate each application key independently with `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`.

3. Start the services:

   ```sh
   docker compose up --build -d
   docker compose ps
   ```

   Caddy obtains and renews the TLS certificate once DNS is pointing to the VPS and ports 80/443 are reachable. Visit `https://reports.example.tn`; check `/api/health` reports `"mode":"mongodb"`.

MongoDB is not published on a host port. Its data lives in the `mongodb_data` Docker volume. Compose runs a daily compressed database dump and retains 14 days in a separate `mongodb_backups` volume. This protects against some accidental database changes, but it is **not an off-site backup** because both volumes share a host. Copy archives to a separate account/location and periodically test recovery before relying on the service. Restore an archive after checking its name and accepting that `--drop` replaces database contents:

```sh
docker compose exec -T mongo-backup sh -ec 'mongorestore --uri="$MONGODB_URI" --archive=/backups/hawma-YYYYMMDDTHHMMSSZ.archive.gz --gzip --drop'
```

The Compose stack is a single-host pilot, not high availability: the app, MongoDB, and backup volume still share one VPS, and app rate limits are in memory. Keep the host patched, restrict SSH, use unique strong secrets, monitor disk/backup health, copy backups off-host, and test recovery. The database and backup containers restart after process or host restarts, and the backup container reports unhealthy if no recent archive exists. This does not repair storage failures or make the same-host archive a recovery copy; arrange encrypted off-site backups and test restores before depending on the service. GitHub Actions runs dependency, API integration, production build, and image-build checks on pushes and pull requests; passing CI does not deploy or provide runtime monitoring. Before broader public use, add a shared rate-limit store, bot mitigation, an operational removal/contact process, and a documented data-retention policy. No design can guarantee that a website will never be compromised or unavailable.

## License

MIT — see [LICENSE](LICENSE).
