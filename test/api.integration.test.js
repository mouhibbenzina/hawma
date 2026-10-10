import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { governorates } from '../shared/governorates.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function startApi(dataDirectory) {
  const port = await unusedPort();
  const environment = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
    DOTENV_CONFIG_PATH: path.join(dataDirectory, 'no-project-env'),
    DATA_FILE: path.join(dataDirectory, 'reports.json'),
    SEED_DEMO_DATA: 'false',
    ADMIN_TOKEN: 'a'.repeat(64),
    SUPPORT_SECRET: 'b'.repeat(64),
  };
  delete environment.MONGODB_URI;
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: environment,
    stdio: 'ignore',
    windowsHide: true,
  });
  const url = `http://127.0.0.1:${port}`;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited during startup (${child.exitCode}).`);
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return { child, url };
    } catch {
      await delay(50);
    }
  }
  child.kill();
  throw new Error('API did not become ready in time.');
}

async function stopApi(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await Promise.race([exited, delay(3000)]);
}

async function jsonRequest(url, options) {
  const response = await fetch(url, options);
  return { response, data: await response.json() };
}

test('moderation queue, anonymous actions, and private metadata persist across restarts', async (t) => {
  assert.equal(governorates.length, 24);
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), 'hawma-api-'));
  let api;
  t.after(async () => {
    if (api) await stopApi(api.child);
    await rm(dataDirectory, { recursive: true, force: true });
  });
  api = await startApi(dataDirectory);

  const health = await (await fetch(`${api.url}/api/health`)).json();
  assert.deepEqual(
    { mode: health.mode, moderationAvailable: health.moderationAvailable, communityActionsAvailable: health.communityActionsAvailable },
    { mode: 'local', moderationAvailable: true, communityActionsAvailable: true },
  );
  const unauthorized = await fetch(`${api.url}/api/moderation/reports`, {
    headers: { Authorization: `Bearer ${'c'.repeat(64)}` },
  });
  assert.equal(unauthorized.status, 401);
  const malformed = await fetch(`${api.url}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid',
  });
  assert.equal(malformed.status, 400);

  const reportInput = {
    title: 'Éclairage en panne',
    description: 'Le lampadaire ne fonctionne plus depuis plusieurs jours.',
    category: 'lighting',
    location: 'Près de la place principale',
    area: 'Tunis',
    lang: 'fr',
  };
  const missingGovernorate = await jsonRequest(`${api.url}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportInput),
  });
  assert.equal(missingGovernorate.response.status, 400);
  assert.ok(missingGovernorate.data.fields.governorate);

  const submission = await jsonRequest(`${api.url}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...reportInput, governorate: 'tunis' }),
  });
  assert.equal(submission.response.status, 201);
  assert.equal(submission.data.reviewRequired, true);
  const reportId = submission.data.report.id;
  assert.equal('visibility' in submission.data.report, false);

  let publicFeed = await (await fetch(`${api.url}/api/reports`)).json();
  assert.equal(publicFeed.reports.length, 0, 'new submissions must remain private until review');

  const authorization = { Authorization: `Bearer ${'a'.repeat(64)}` };
  const queue = await jsonRequest(`${api.url}/api/moderation/reports`, { headers: authorization });
  assert.equal(queue.response.status, 200);
  assert.equal(queue.data.reports[0].visibility, 'pending');

  const publish = await jsonRequest(`${api.url}/api/moderation/reports/${reportId}`, {
    method: 'PATCH',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'new', visibility: 'public', moderationNote: 'Reviewed by moderator.' }),
  });
  assert.equal(publish.response.status, 200);

  publicFeed = await (await fetch(`${api.url}/api/reports`)).json();
  assert.equal(publicFeed.reports.length, 1);
  assert.equal(publicFeed.reports[0].supportCount, 0);
  const governorateFeed = await (await fetch(`${api.url}/api/reports?governorate=tunis`)).json();
  assert.equal(governorateFeed.reports.length, 1);
  const otherGovernorateFeed = await (await fetch(`${api.url}/api/reports?governorate=sfax`)).json();
  assert.equal(otherGovernorateFeed.reports.length, 0);
  assert.equal('moderationNote' in publicFeed.reports[0], false);
  assert.equal('flagCount' in publicFeed.reports[0], false);

  const support = await jsonRequest(`${api.url}/api/reports/${reportId}/support`, { method: 'POST' });
  assert.equal(support.response.status, 200);
  assert.equal(support.data.counted, true);
  assert.equal(support.data.supportCount, 1);
  const visitorCookie = support.response.headers.get('set-cookie').split(';', 1)[0];

  const duplicateSupport = await jsonRequest(`${api.url}/api/reports/${reportId}/support`, {
    method: 'POST',
    headers: { Cookie: visitorCookie },
  });
  assert.equal(duplicateSupport.data.counted, false);
  assert.equal(duplicateSupport.data.supportCount, 1);

  const flag = await jsonRequest(`${api.url}/api/reports/${reportId}/flag`, {
    method: 'POST',
    headers: { Cookie: visitorCookie },
  });
  assert.equal(flag.response.status, 200);
  assert.equal(flag.data.counted, true);
  const duplicateFlag = await jsonRequest(`${api.url}/api/reports/${reportId}/flag`, {
    method: 'POST',
    headers: { Cookie: visitorCookie },
  });
  assert.equal(duplicateFlag.data.counted, false);

  await stopApi(api.child);
  api = await startApi(dataDirectory);

  publicFeed = await (await fetch(`${api.url}/api/reports`)).json();
  assert.equal(publicFeed.reports[0].supportCount, 1);
  const persistedQueue = await jsonRequest(`${api.url}/api/moderation/reports`, { headers: authorization });
  assert.equal(persistedQueue.data.reports[0].flagCount, 1);
  assert.equal(persistedQueue.data.reports[0].moderationNote, 'Reviewed by moderator.');
  assert.equal(persistedQueue.data.reports[0].visibility, 'public');
});
