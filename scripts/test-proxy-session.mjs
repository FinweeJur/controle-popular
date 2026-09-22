import { GuaraApiClient } from 'file:///C:/nodejs/node_modules/@guaracloud/cli/dist/lib/api-client.js';
import { SessionWebSocket } from 'file:///C:/nodejs/node_modules/@guaracloud/cli/dist/lib/ws-client.js';

const apiKey = process.env.GUARA_API_KEY;
if (!apiKey) {
  console.error('Defina GUARA_API_KEY no ambiente.');
  process.exit(1);
}
const baseUrl = process.env.GUARA_API_URL || 'https://api.guaracloud.com';
const project = 'controle-popular';
const service = 'cp-postgres-597bd0';

const client = new GuaraApiClient(baseUrl, apiKey, globalThis.fetch);
console.log('Resolving IDs...');
const projectId = await client.resolveProjectId(project);
const serviceId = await client.resolveServiceId(projectId, service);
console.log('projectId:', projectId, 'serviceId:', serviceId);
console.log('Creating proxy session...');
const res = await client.createProxySession(projectId, serviceId);
const session = res.data;
console.log('session keys:', Object.keys(session));
console.log('sessionId:', session.sessionId);
console.log('sessionToken length:', session.sessionToken?.length);
console.log('expiresAt:', session.expiresAt, 'now:', new Date().toISOString(), 'ttl_ms:', new Date(session.expiresAt) - Date.now());
console.log('pod:', session.pod?.name, 'remotePort:', session.remotePort);
console.log('wsUrl:', client.getWebSocketUrl());

const delayMs = Number(process.env.DELAY_MS || 0);
if (delayMs > 0) {
  console.log('waiting', delayMs, 'ms before WS...');
  await new Promise((r) => setTimeout(r, delayMs));
}

await new Promise((resolve) => {
  const ws = new SessionWebSocket({
    url: client.getWebSocketUrl(),
    sessionToken: session.sessionToken,
    onData: (d) => console.log('data:', d.toString().slice(0, 100)),
    onClose: (code, reason) => {
      console.log('WS closed:', code, reason);
      resolve();
    },
    onError: (err) => {
      console.log('WS error:', err.message);
    },
  });
  ws.connect().then(() => {
    console.log('WS AUTH OK');
    setTimeout(() => { ws.close(); resolve(); }, 500);
  }).catch((err) => {
    console.log('WS AUTH FAIL:', err.message);
    resolve();
  });
});
console.log('done');
process.exit(0);
