import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ExportAdapter } from '../types.ts';
import { project, validateOptions } from './common.ts';

export const sqliteAdapter: ExportAdapter = {
  format: 'sqlite', version: '1.0.0', validate: validateOptions,
  async write(context) {
    if (context.plan.externalReferences.length) throw new Error('Standalone SQLite requires included ancestors; unresolved references cannot be delivered as a ready-to-use database');
    context.signal?.throwIfAborted();
    const database = new DatabaseSync(join(context.directory, 'entities.sqlite'));
    try {
      database.exec(`PRAGMA foreign_keys = ON;
        CREATE TABLE georeference_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE georeference_entities (
          id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, name TEXT NOT NULL, country_id TEXT NOT NULL,
          parent_id TEXT REFERENCES georeference_entities(id) DEFERRABLE INITIALLY DEFERRED,
          codes TEXT NOT NULL DEFAULT '{}', names TEXT NOT NULL DEFAULT '{}', level INTEGER,
          coordinates TEXT, boundary TEXT
        );
        CREATE INDEX georeference_entities_parent_idx ON georeference_entities(parent_id);
        CREATE INDEX georeference_entities_country_idx ON georeference_entities(country_id);
        BEGIN;`);
      database.prepare('INSERT INTO georeference_metadata VALUES (?, ?)').run('snapshot', JSON.stringify(context.plan.metadata));
      const insert = database.prepare('INSERT INTO georeference_entities (id, entity_type, name, country_id, parent_id, codes, names, level, coordinates, boundary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const original of context.plan.entities()) {
        context.signal?.throwIfAborted();
        const entity = project(original, context.plan.request);
        insert.run(entity.id, entity.entityType, entity.name, entity.countryId, entity.parentId,
          JSON.stringify(entity.codes ?? {}), JSON.stringify(entity.names ?? {}), entity.level ?? null,
          entity.coordinates == null ? null : JSON.stringify(entity.coordinates), entity.boundary == null ? null : JSON.stringify(entity.boundary));
      }
      database.exec('COMMIT;');
      if (database.prepare('PRAGMA foreign_key_check').all().length) throw new Error('SQLite foreign-key verification failed');
      if (database.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok') throw new Error('SQLite integrity verification failed');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* A failed COMMIT may already have rolled back. */ }
      throw error;
    } finally { database.close(); }
    return ['entities.sqlite'];
  },
};
