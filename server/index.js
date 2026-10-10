import 'dotenv/config';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Report from './Report.js';
import { demoReports } from './seed.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const localDataFile = path.resolve(process.env.DATA_FILE || path.join(serverDir, 'data', 'reports.json'));
const validCategories = new Set(['water', 'waste', 'road', 'lighting', 'other']);
const validStatuses = new Set(['new', 'in_progress', 'resolved']);
const seedDemoData = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA === 'true';
const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    error: 'Trop de signalements envoyés. Réessayez dans quelques minutes.',
  }),
});
const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
let localReports = [];
let localWriteQueue = Promise.resolve();
let databaseMode = 'local';

app.disable('x-powered-by');
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS);
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) {
  app.set('trust proxy', trustedProxyHops);
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    },
  },
}));
app.use(express.json({ limit: '16kb' }));

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toPublicReport(report, includeModeration = false) {
  const item = typeof report.toObject === 'function' ? report.toObject() : report;
  return {
    id: String(item._id),
    title: item.title,
    titleAr: item.titleAr || '',
    description: item.description,
    descriptionAr: item.descriptionAr || '',
    category: item.category,
    location: item.location,
    area: item.area,
    status: item.status,
    sample: Boolean(item.sample),
    lang: item.lang || 'fr',
    createdAt: item.createdAt,
    moderatedAt: item.moderatedAt,
    ...(includeModeration ? {
      visibility: item.visibility || 'public',
      moderationNote: item.moderationNote || '',
      moderatedAt: item.moderatedAt,
    } : {}),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: databaseMode, moderationAvailable: Boolean(process.env.ADMIN_TOKEN) });
});

app.get('/api/reports', async (req, res, next) => {
  try {
    const category = cleanString(req.query.category);
    const search = cleanString(req.query.q).slice(0, 100).toLocaleLowerCase();
    const reports = databaseMode === 'mongodb'
      ? await Report.find({
        $or: [{ visibility: 'public' }, { visibility: { $exists: false } }],
        ...(!seedDemoData ? { sample: { $ne: true } } : {}),
        ...(category && validCategories.has(category) ? { category } : {}),
      }).sort({ createdAt: -1 }).limit(100).lean()
      : localReports
        .filter((report) => (report.visibility || 'public') === 'public')
        .filter((report) => seedDemoData || !report.sample)
        .filter((report) => !category || !validCategories.has(category) || report.category === category)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filtered = search
      ? reports.filter((report) => [report.title, report.description, report.location, report.area]
          .some((field) => String(field || '').toLocaleLowerCase().includes(search)))
      : reports;
    res.json({ mode: databaseMode, reports: filtered.map(toPublicReport) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reports', reportSubmissionLimiter, async (req, res, next) => {
  try {
    const title = cleanString(req.body?.title);
    const titleAr = cleanString(req.body?.titleAr).slice(0, 100);
    const description = cleanString(req.body?.description);
    const descriptionAr = cleanString(req.body?.descriptionAr).slice(0, 1000);
    const category = cleanString(req.body?.category);
    const location = cleanString(req.body?.location);
    const area = cleanString(req.body?.area);
    const lang = req.body?.lang === 'ar' ? 'ar' : 'fr';
    const errors = {};

    if (title.length < 4 || title.length > 100) errors.title = 'Le titre doit contenir entre 4 et 100 caractères.';
    if (description.length < 10 || description.length > 1000) errors.description = 'La description doit contenir entre 10 et 1 000 caractères.';
    if (!validCategories.has(category)) errors.category = 'Choisissez une catégorie valide.';
    if (location.length < 3 || location.length > 160) errors.location = 'Indiquez un lieu entre 3 et 160 caractères.';
    if (area.length < 2 || area.length > 80) errors.area = 'Indiquez une ville ou un quartier.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Vérifiez les champs signalés.', fields: errors });
    }

    const values = { title, titleAr, description, descriptionAr, category, location, area, status: 'new', sample: false, lang };
    const created = databaseMode === 'mongodb'
      ? await Report.create(values)
      : { ...values, _id: randomUUID(), visibility: 'public', createdAt: new Date(), updatedAt: new Date() };

    if (databaseMode === 'local') {
      localReports.unshift(created);
      await persistLocalReports();
    }
    res.status(201).json({ report: toPublicReport(created) });
  } catch (error) {
    next(error);
  }
});

function requireModerator(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken) {
    return res.status(503).json({ error: 'La modération n’est pas configurée sur ce serveur.' });
  }

  const suppliedToken = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] || '';
  const expected = createHash('sha256').update(configuredToken).digest();
  const supplied = createHash('sha256').update(suppliedToken).digest();
  if (!timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ error: 'Accès réservé à l’équipe de modération.' });
  }
  next();
}

app.get('/api/moderation/reports', moderationLimiter, requireModerator, async (_req, res, next) => {
  try {
    const reports = databaseMode === 'mongodb'
      ? await Report.find().sort({ createdAt: -1 }).limit(200).lean()
      : [...localReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200);
    res.json({ reports: reports.map((report) => toPublicReport(report, true)) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/moderation/reports/:id', moderationLimiter, requireModerator, async (req, res, next) => {
  try {
    const status = cleanString(req.body?.status);
    const visibility = cleanString(req.body?.visibility);
    const moderationNote = cleanString(req.body?.moderationNote).slice(0, 300);
    if (!validStatuses.has(status) || !['public', 'hidden'].includes(visibility)) {
      return res.status(400).json({ error: 'Choisissez un état et une visibilité valides.' });
    }

    const changes = { status, visibility, moderationNote, moderatedAt: new Date() };
    let updated;
    if (databaseMode === 'mongodb') {
      updated = await Report.findOneAndUpdate(
        { _id: req.params.id, sample: { $ne: true } },
        { $set: changes },
        { new: true, runValidators: true },
      );
    } else {
      const index = localReports.findIndex((report) => report._id === req.params.id && !report.sample);
      if (index !== -1) {
        updated = { ...localReports[index], ...changes, updatedAt: new Date() };
        localReports[index] = updated;
        await persistLocalReports();
      }
    }

    if (!updated) return res.status(404).json({ error: 'Signalement introuvable ou exemple fictif non modifiable.' });
    res.json({ report: toPublicReport(updated, true) });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Cette route API n’existe pas.' }));

async function persistLocalReports() {
  const snapshot = JSON.stringify(localReports, null, 2);
  localWriteQueue = localWriteQueue.catch(() => {}).then(async () => {
    await mkdir(path.dirname(localDataFile), { recursive: true });
    const tempFile = `${localDataFile}.${process.pid}.tmp`;
    await writeFile(tempFile, snapshot, 'utf8');
    await rename(tempFile, localDataFile);
  });
  return localWriteQueue;
}

async function loadLocalReports() {
  try {
    const stored = JSON.parse(await readFile(localDataFile, 'utf8'));
    if (!Array.isArray(stored)) throw new Error(`Expected an array in ${localDataFile}`);
    localReports = stored.length === 0 && seedDemoData
      ? demoReports.map((report, index) => ({
        ...report,
        _id: `demo-${index + 1}`,
        visibility: 'public',
        moderationNote: '',
      }))
      : stored;
    if (localReports !== stored) await persistLocalReports();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    localReports = seedDemoData
      ? demoReports.map((report, index) => ({
        ...report,
        _id: `demo-${index + 1}`,
        visibility: 'public',
        moderationNote: '',
      }))
      : [];
    await persistLocalReports();
  }
}

if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI);
  databaseMode = 'mongodb';
  if (seedDemoData && await Report.countDocuments() === 0) {
    await Report.insertMany(demoReports);
  }
} else {
  await loadLocalReports();
}

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(serverDir, '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Le service a rencontré une erreur. Réessayez dans un instant.' });
});

app.listen(port, () => {
  console.log(`Hawma API listening on http://localhost:${port} (${databaseMode} mode)`);
});
