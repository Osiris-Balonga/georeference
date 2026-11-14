import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));
const npmCli = process.env.npm_execpath;

async function npm(args: string[], cwd = repository) {
  assert.ok(npmCli, 'Run acceptance through npm run test:acceptance');
  return execute(process.execPath, [npmCli, ...args], {
    cwd, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, npm_config_update_notifier: 'false' },
    timeout: 180_000,
  });
}

test('the API workspace resolves the local core package', async () => {
  await npm(['ls', 'georeference', '--workspace', '@georeference/api', '--json']);
  const script = `
    import assert from 'node:assert/strict';
    import { realpath } from 'node:fs/promises';
    import { fileURLToPath } from 'node:url';
    const actual = await realpath(fileURLToPath(import.meta.resolve('georeference')));
    assert.equal(actual, await realpath(process.argv[1]));
    const core = await import('georeference');
    assert.equal(typeof core.loadCongoReference, 'function');
    console.log('local core linked');
  `;
  const result = await execute(process.execPath, ['--input-type=module', '-e', script,
    join(repository, 'dist/index.js')], { cwd: join(repository, 'apps/api') });
  assert.match(result.stdout, /local core linked/);
});

test('the packed CLI stays standalone and API responses preserve source/export identities',
  { timeout: 240_000 }, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'georeference-api-acceptance-'));
    t.after(async () => {
      assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
      assert.match(basename(directory), /^georeference-api-acceptance-/);
      await rm(directory, { recursive: true, force: true });
    });
    const packed = JSON.parse((await npm(['pack', '--ignore-scripts', '--json',
      '--pack-destination', directory])).stdout)[0];
    assert.ok(packed.files.some((file: { path: string }) => file.path === 'dist/cli.js'));
    assert.ok(!packed.files.some((file: { path: string }) =>
      /^(apps\/|node_modules\/)/.test(file.path)));

    const cache = join(directory, 'npm-cache');
    const output = join(directory, 'data');
    const archive = join(directory, packed.filename);
    await npm(['exec', '--yes', '--cache', cache, '--package', archive, '--',
      'georeference', 'generate', '--output', output, '--format', 'json'], directory);
    assert.deepEqual((await readdir(directory)).filter(name => name !== 'npm-cache').sort(),
      ['data', packed.filename].sort());
    const installs = await readdir(join(cache, '_npx'));
    assert.equal(installs.length, 1);
    const modules = join(cache, '_npx', installs[0]!, 'node_modules');
    const installed = JSON.parse(await readFile(join(modules, 'georeference/package.json'), 'utf8'));
    assert.ok(!Object.keys(installed.dependencies ?? {}).some(name => /fastify|typebox/.test(name)));
    assert.ok(!(await readdir(modules)).some(name => /^(fastify|@fastify|typebox)$/.test(name)));

    const networkGuard = fileURLToPath(new URL('./deny-network.mjs', import.meta.url));
    const guardCheck = `
      import assert from 'node:assert/strict';
      import http from 'node:http';
      import net from 'node:net';
      for (const attempt of [() => fetch('http://127.0.0.1:1'),
        () => http.get('http://127.0.0.1:1'), () => net.connect(1, '127.0.0.1')]) {
        assert.throws(attempt, /forbids outbound network/);
      }
    `;
    await execute(process.execPath, ['--import', pathToFileURL(networkGuard).href,
      '--input-type=module', '-e', guardCheck], { cwd: directory });
    const offlineOutput = join(directory, 'offline-data');
    await execute(process.execPath, ['--import', pathToFileURL(networkGuard).href,
      join(modules, 'georeference/dist/cli.js'), 'generate', '--output', offlineOutput,
      '--format', 'json', '--city', 'Brazzaville'], { cwd: directory });
    assert.equal(JSON.parse(await readFile(join(offlineOutput, 'neighborhoods.json'), 'utf8')).length, 88);

    const { buildApp } = await import(pathToFileURL(join(repository, 'apps/api/dist/app.js')).href);
    const app = await buildApp({ logger: false, rateLimitMax: 1000 });
    t.after(() => app.close());
    const source = JSON.parse(await readFile(join(repository, 'reference/congo.json'), 'utf8'));
    const resources = {
      countries: 'country', departments: 'department', communes: 'commune', districts: 'district',
      arrondissements: 'arrondissement', 'urban-communities': 'urban-community',
      'rural-communities': 'rural-community', neighborhoods: 'neighborhood', villages: 'village',
    };
    for (const [route, kind] of Object.entries(resources)) {
      const expected = source.entries.filter((entry: { entity: { kind: string } }) => entry.entity.kind === kind)
        .map((entry: { entity: { id: string } }) => entry.entity.id).sort();
      const rows: { id: string }[] = [];
      for (let offset = 0; offset < Math.max(1, expected.length); offset += 100) {
        const response = await app.inject({ url: `/v1/${route}?limit=100&offset=${offset}` });
        assert.equal(response.statusCode, 200, response.body);
        const body = response.json();
        assert.equal(body.meta.total, expected.length);
        assert.equal(body.meta.datasetVersion, source.datasetVersion);
        assert.equal(body.meta.coverageStatus, 'partial');
        rows.push(...body.data);
      }
      const file = route.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      const exported = JSON.parse(await readFile(join(output, `${file}.json`), 'utf8'));
      assert.deepEqual(rows.map(row => row.id).sort(), expected, `${route}: source identity parity`);
      const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
      assert.deepEqual(rows.sort(byId), exported.sort(byId), `${route}: API/export parity`);
    }
  });
