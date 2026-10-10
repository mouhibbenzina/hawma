import 'dotenv/config';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import ReportInteraction from './ReportInteraction.js';
import { governorates } from '../shared/governorates.js';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Report from './Report.js';
import { demoReports } from './seed.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const localDataFile = path.resolve(process.env.DATA_FILE || path.join(serverDir, 'data', 'reports.json'));
const localInteractionFile = path.join(path.dirname(localDataFile), 'interactions.json');
const validCategories = new Set(['water', 'waste', 'road', 'lighting', 'other']);
const validStatuses = new Set(['new', 'in_progress', 'resolved']);
const validVisibilities = new Set(['pending', 'public', 'hidden']);
const validGovernorates = new Set(governorates.map(({ id }) => id));
const seedDemoData = process.env.NODE_ENV === 'test'
  ? false
  : process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA === 'true';
const supportSecret = process.env.SUPPORT_SECRET || (
  process.env.NODE_ENV === 'production' ? '' : randomBytes(32).toString('hex')
);
if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) {
    throw new Error('Production requires MONGODB_URI; local JSON storage is not production-ready.');
  }
  if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 32) {
    throw new Error('Production requires an ADMIN_TOKEN with at least 32 characters.');
  }
  if (!process.env.SUPPORT_SECRET || process.env.SUPPORT_SECRET.length < 32) {
    throw new Error('Production requires a stable SUPPORT_SECRET with at least 32 characters.');
  }
}
const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    error: 'Trop de signalements envoyés. Réessayez dans quelques minutes.',
  }),
});
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const flagLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
const moderationAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
let localReports = [];
let localInteractions = { support: [], flag: [] };
let localWriteQueue = Promise.resolve();
let databaseMode = 'local';

app.disable('x-powered-by');
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS);
if (process.env.NODE_ENV === 'production' && (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1)) {
  throw new Error('Production requires TRUST_PROXY_HOPS to be a positive integer matching the proxy chain.');
}
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) {
  app.set('trust proxy', trustedProxyHops);
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(express.json({ limit: '16kb' }));

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function inferGovernorate(area) {
  const normalizedArea = cleanString(area).toLocaleLowerCase();
  return governorates.find((item) => (
    item.fr.toLocaleLowerCase() === normalizedArea || item.id === normalizedArea
  ))?.id || '';
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
    governorate: item.governorate || '',
    status: item.status,
    supportCount: Number(item.supportCount) || 0,
    sample: Boolean(item.sample),
    lang: item.lang || 'fr',
    createdAt: item.createdAt,
    moderatedAt: item.moderatedAt,
    ...(includeModeration ? {
      visibility: item.visibility || 'public',
      moderationNote: item.moderationNote || '',
      flagCount: Number(item.flagCount) || 0,
      moderatedAt: item.moderatedAt,
    } : {}),
  };
}

app.get('/api/health', (_req, res) => {
  const databaseReady = databaseMode !== 'mongodb' || mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    ok: databaseReady,
    mode: databaseMode,
    databaseReady,
    moderationAvailable: Boolean(process.env.ADMIN_TOKEN),
    communityActionsAvailable: Boolean(supportSecret),
  });
});

app.get('/api/reports', async (req, res, next) => {
  try {
    const category = cleanString(req.query.category);
    const governorate = cleanString(req.query.governorate);
    const search = cleanString(req.query.q).slice(0, 100).toLocaleLowerCase();
    const reports = databaseMode === 'mongodb'
      ? await Report.find({
        $or: [{ visibility: 'public' }, { visibility: { $exists: false } }],
        ...(!seedDemoData ? { sample: { $ne: true } } : {}),
        ...(category && validCategories.has(category) ? { category } : {}),
        ...(governorate && validGovernorates.has(governorate) ? { governorate } : {}),
      }).sort({ createdAt: -1 }).limit(100).lean()
      : localReports
        .filter((report) => (report.visibility || 'public') === 'public')
        .filter((report) => seedDemoData || !report.sample)
        .filter((report) => !category || !validCategories.has(category) || report.category === category)
        .filter((report) => !governorate || !validGovernorates.has(governorate) || report.governorate === governorate)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);

    const filtered = search
      ? reports.filter((report) => {
        const governorateName = governorates.find((item) => item.id === report.governorate);
        return [
          report.title,
          report.description,
          report.location,
          report.area,
          governorateName?.fr,
          governorateName?.ar,
        ].some((field) => String(field || '').toLocaleLowerCase().includes(search));
      })
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
    const governorate = cleanString(req.body?.governorate);
    const lang = req.body?.lang === 'ar' ? 'ar' : 'fr';
    const errors = {};

    if (title.length < 4 || title.length > 100) errors.title = 'Le titre doit contenir entre 4 et 100 caractères.';
    if (description.length < 10 || description.length > 1000) errors.description = 'La description doit contenir entre 10 et 1 000 caractères.';
    if (!validCategories.has(category)) errors.category = 'Choisissez une catégorie valide.';
    if (location.length < 3 || location.length > 160) errors.location = 'Indiquez un lieu entre 3 et 160 caractères.';
    if (area.length < 2 || area.length > 80) errors.area = 'Indiquez une ville ou un quartier.';
    if (!validGovernorates.has(governorate)) errors.governorate = 'Choisissez un gouvernorat valide.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Vérifiez les champs signalés.', fields: errors });
    }

    const values = {
      title,
      titleAr,
      description,
      descriptionAr,
      category,
      location,
      area,
      governorate,
      status: 'new',
      visibility: 'pending',
      supportCount: 0,
      flagCount: 0,
      sample: false,
      lang,
    };
    const created = databaseMode === 'mongodb'
      ? await Report.create(values)
      : { ...values, _id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };

    if (databaseMode === 'local') {
      localReports.unshift(created);
      await persistLocalReports();
    }
    res.status(201).json({ report: toPublicReport(created), reviewRequired: true });
  } catch (error) {
    next(error);
  }
});

function parseVisitorCookie(req) {
  const cookie = req.headers.cookie?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('hawma_visitor='))
    ?.slice('hawma_visitor='.length);
  if (!cookie || !supportSecret) return null;

  const [visitorId, signature] = cookie.split('.');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(visitorId || '') || !signature) return null;
  const expected = createHmac('sha256', supportSecret).update(visitorId).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;
  return visitorId;
}

function getVisitorHash(req, res) {
  if (!supportSecret) return null;
  let visitorId = parseVisitorCookie(req);
  if (!visitorId) {
    visitorId = randomBytes(32).toString('base64url');
    const signature = createHmac('sha256', supportSecret).update(visitorId).digest('base64url');
    const attributes = [
      `hawma_visitor=${visitorId}.${signature}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=15552000',
    ];
    if (process.env.NODE_ENV === 'production') attributes.push('Secure');
    res.append('Set-Cookie', attributes.join('; '));
  }
  return createHmac('sha256', supportSecret).update(`visitor:${visitorId}`).digest('hex');
}

function validReportId(id) {
  return databaseMode === 'local'
    ? typeof id === 'string' && id.length > 0 && id.length <= 80
    : mongoose.isValidObjectId(id);
}

async function hasPublicReport(id) {
  if (databaseMode === 'mongodb') {
    return Report.exists({
      _id: id,
      $or: [{ visibility: 'public' }, { visibility: { $exists: false } }],
      sample: { $ne: true },
    });
  }
  return localReports.some((report) => (
    report._id === id && (report.visibility || 'public') === 'public' && !report.sample
  ));
}

async function recordInteraction(reportId, kind, visitorHash) {
  if (databaseMode === 'mongodb') {
    try {
      const result = await ReportInteraction.updateOne(
        { reportId, kind, visitorHash },
        { $setOnInsert: { reportId, kind, visitorHash } },
        { upsert: true },
      );
      const added = result.upsertedCount === 1;
      if (added) {
        const field = kind === 'support' ? 'supportCount' : 'flagCount';
        await Report.updateOne({ _id: reportId }, { $inc: { [field]: 1 } });
      }
      return added;
    } catch (error) {
      if (error.code === 11000) return false;
      throw error;
    }
  }

  const interactions = localInteractions[kind];
  if (interactions.some((entry) => entry.reportId === reportId && entry.visitorHash === visitorHash)) {
    return false;
  }
  interactions.push({ reportId, visitorHash, createdAt: new Date().toISOString() });
  const report = localReports.find((entry) => entry._id === reportId);
  const countField = kind === 'support' ? 'supportCount' : 'flagCount';
  report[countField] = (Number(report[countField]) || 0) + 1;
  await persistLocalInteractions();
  await persistLocalReports();
  return true;
}

app.post('/api/reports/:id/support', supportLimiter, async (req, res, next) => {
  try {
    if (!validReportId(req.params.id)) return res.status(404).json({ error: 'Signalement introuvable.' });
    if (!await hasPublicReport(req.params.id)) return res.status(404).json({ error: 'Signalement introuvable.' });
    const visitorHash = getVisitorHash(req, res);
    if (!visitorHash) return res.status(503).json({ error: 'Les actions communautaires ne sont pas configurées.' });
    const counted = await recordInteraction(req.params.id, 'support', visitorHash);
    const report = databaseMode === 'mongodb'
      ? await Report.findById(req.params.id).lean()
      : localReports.find((entry) => entry._id === req.params.id);
    res.json({ counted, supportCount: Number(report?.supportCount) || 0 });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reports/:id/flag', flagLimiter, async (req, res, next) => {
  try {
    if (!validReportId(req.params.id)) return res.status(404).json({ error: 'Signalement introuvable.' });
    if (!await hasPublicReport(req.params.id)) return res.status(404).json({ error: 'Signalement introuvable.' });
    const visitorHash = getVisitorHash(req, res);
    if (!visitorHash) return res.status(503).json({ error: 'Les actions communautaires ne sont pas configurées.' });
    const counted = await recordInteraction(req.params.id, 'flag', visitorHash);
    const report = databaseMode === 'mongodb'
      ? await Report.findById(req.params.id).lean()
      : localReports.find((entry) => entry._id === req.params.id);
    res.json({ counted, flagCount: Number(report?.flagCount) || 0 });
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

app.get('/api/moderation/reports', moderationLimiter, moderationAuthLimiter, requireModerator, async (_req, res, next) => {
  try {
    const reports = databaseMode === 'mongodb'
      ? await Report.aggregate([
        {
          $addFields: {
            queuePriority: {
              $cond: [
                { $eq: [{ $ifNull: ['$visibility', 'public'] }, 'pending'] },
                0,
                1,
              ],
            },
          },
        },
        { $sort: { queuePriority: 1, flagCount: -1, createdAt: -1 } },
        { $limit: 200 },
        { $project: { queuePriority: 0 } },
      ])
      : [...localReports].sort((a, b) => {
        const queueRank = (report) => (report.visibility || 'public') === 'pending' ? 0 : 1;
        return queueRank(a) - queueRank(b)
          || (Number(b.flagCount) || 0) - (Number(a.flagCount) || 0)
          || new Date(b.createdAt) - new Date(a.createdAt);
      }).slice(0, 200);
    res.json({ reports: reports.map((report) => toPublicReport(report, true)) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/moderation/reports/:id', moderationLimiter, moderationAuthLimiter, requireModerator, async (req, res, next) => {
  try {
    if (!validReportId(req.params.id)) return res.status(404).json({ error: 'Signalement introuvable.' });
    const status = cleanString(req.body?.status);
    const visibility = cleanString(req.body?.visibility);
    const moderationNote = cleanString(req.body?.moderationNote).slice(0, 300);
    if (!validStatuses.has(status) || !validVisibilities.has(visibility)) {
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

async function persistLocalInteractions() {
  const snapshot = JSON.stringify(localInteractions, null, 2);
  localWriteQueue = localWriteQueue.catch(() => {}).then(async () => {
    await mkdir(path.dirname(localInteractionFile), { recursive: true });
    const tempFile = `${localInteractionFile}.${process.pid}.tmp`;
    await writeFile(tempFile, snapshot, 'utf8');
    await rename(tempFile, localInteractionFile);
  });
  return localWriteQueue;
}

async function loadLocalInteractions() {
  try {
    const stored = JSON.parse(await readFile(localInteractionFile, 'utf8'));
    if (!stored || !Array.isArray(stored.support) || !Array.isArray(stored.flag)) {
      throw new Error(`Expected support and flag arrays in ${localInteractionFile}`);
    }
    const retentionMs = 31_536_000_000;
    localInteractions = {
      support: stored.support.filter((entry) => isRecentInteraction(entry, retentionMs)),
      flag: stored.flag.filter((entry) => isRecentInteraction(entry, retentionMs)),
    };
    if (localInteractions.support.length !== stored.support.length
      || localInteractions.flag.length !== stored.flag.length) {
      await persistLocalInteractions();
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    localInteractions = { support: [], flag: [] };
    await persistLocalInteractions();
  }
}

async function loadLocalReports() {
  try {
    const stored = JSON.parse(await readFile(localDataFile, 'utf8'));
    if (!Array.isArray(stored)) throw new Error(`Expected an array in ${localDataFile}`);
    let migrated = false;
    const upgraded = stored.map((report) => {
      if (report.governorate) return report;
      const inferred = inferGovernorate(report.area);
      if (!inferred) return report;
      migrated = true;
      return { ...report, governorate: inferred };
    });
    localReports = stored.length === 0 && seedDemoData
      ? demoReports.map((report, index) => ({
        ...report,
        _id: `demo-${index + 1}`,
        visibility: 'public',
        moderationNote: '',
      }))
      : migrated ? upgraded : stored;
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

function isRecentInteraction(entry, retentionMs) {
  const createdAt = Date.parse(entry?.createdAt);
  const age = Date.now() - createdAt;
  return typeof entry?.reportId === 'string'
    && typeof entry?.visitorHash === 'string'
    && Number.isFinite(createdAt)
    && age >= 0
    && age < retentionMs;
}

if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI);
  databaseMode = 'mongodb';
  await Report.bulkWrite(governorates.map((item) => ({
    updateMany: {
      filter: {
        governorate: { $in: ['', null] },
        area: { $in: [item.fr, item.id] },
      },
      update: { $set: { governorate: item.id } },
    },
  })), { ordered: false });
  if (seedDemoData && await Report.countDocuments() === 0) {
    await Report.insertMany(demoReports);
  }
} else {
  await loadLocalReports();
}
if (databaseMode === 'mongodb') {
  await ReportInteraction.init();
} else {
  await loadLocalInteractions();
}

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(serverDir, '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Le corps de la requête JSON est invalide.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La requête dépasse la taille autorisée.' });
  }
  res.status(500).json({ error: 'Le service a rencontré une erreur. Réessayez dans un instant.' });
});

const server = app.listen(port, () => {
  console.log(`Hawma API listening on http://localhost:${port} (${databaseMode} mode)`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; closing the API and database connection.`);
  server.close(async (error) => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch((disconnectError) => {
        console.error('MongoDB disconnect failed during shutdown.', disconnectError);
        process.exitCode = 1;
      });
    }
    if (error) {
      console.error('HTTP server failed to close cleanly.', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
