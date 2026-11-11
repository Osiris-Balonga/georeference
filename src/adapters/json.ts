import type { AdapterContext, Entity, ExportAdapter } from '../types.ts';
import { jsonArray, project, validateOptions, writeChunks } from './common.ts';

interface TreeEntity extends Entity { children: TreeEntity[] }

function* flatDocument(context: AdapterContext): Generator<string> {
  yield `{"metadata":${JSON.stringify(context.plan.metadata)},"entities":`;
  yield* jsonArray((function* () { for (const entity of context.plan.entities()) yield project(entity, context.plan.request); })());
  yield '}\n';
}

function hierarchy(context: AdapterContext): TreeEntity[] {
  if (context.plan.count > 50_000) throw new Error('Hierarchical JSON is limited to 50,000 entities; use flat JSON or partitions');
  const nodes = new Map<string, TreeEntity>();
  for (const entity of context.plan.entities()) nodes.set(entity.id, { ...project(entity, context.plan.request), children: [] });
  const roots: TreeEntity[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export const jsonAdapter: ExportAdapter = {
  format: 'json', version: '1.0.0',
  validate(request) { validateOptions(request, true); },
  async write(context) {
    if (context.plan.request.layout === 'hierarchical') {
      const entities = hierarchy(context);
      await writeChunks(context, 'entities.json', [JSON.stringify({ metadata: context.plan.metadata, entities }) + '\n']);
    } else await writeChunks(context, 'entities.json', flatDocument(context));
    return ['entities.json'];
  },
};

export const ndjsonAdapter: ExportAdapter = {
  format: 'ndjson', version: '1.0.0',
  validate: validateOptions,
  async write(context) {
    await writeChunks(context, 'entities.ndjson', (function* () {
      for (const entity of context.plan.entities()) yield JSON.stringify(project(entity, context.plan.request)) + '\n';
    })());
    return ['entities.ndjson'];
  },
};
