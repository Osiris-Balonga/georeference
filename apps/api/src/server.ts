import { buildApp } from './app.ts';
import { readServerConfig } from './config.ts';
import { installShutdown } from './shutdown.ts';

const config = readServerConfig(process.env);
const app = await buildApp({ logger: true, trustedProxies: config.trustedProxies, rateLimitMax: config.rateLimitMax });
const dispose = installShutdown(app);
app.addHook('onClose', async () => { dispose(); });
try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ err: error }, 'API startup failed');
  await app.close();
  process.exitCode = 1;
}
