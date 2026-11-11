import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { access, mkdir, link, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { canonicalJson, validateEntity, validateMetadata } from './validation.ts';
import type { Entity, SnapshotMetadata, Selection, ExportPlan, ExportRequest } from './types.ts';

function ensureGraph(db: DatabaseSync): void {
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Unknown parent reference');
  const invalid = db.prepare(`SELECT e.id FROM entities e LEFT JOIN entities c ON e.country_id=c.id LEFT JOIN entities p ON e.parent_id=p.id
    WHERE c.entity_type IS NULL OR c.entity_type!='country' OR
    (e.parent_id IS NOT NULL AND (p.country_id!=e.country_id OR p.entity_type='locality')) LIMIT 1`).get();
  if (invalid) throw new Error(`Invalid country or parent relationship for ${invalid.id}`);
  const reached = db.prepare(`WITH RECURSIVE tree(id,depth) AS (
    SELECT id,0 FROM entities WHERE parent_id IS NULL UNION ALL
    SELECT e.id,t.depth+1 FROM entities e JOIN tree t ON e.parent_id=t.id)
    SELECT count(*) AS count FROM tree`).get()!;
  if (Number(reached.count) !== Number(db.prepare('SELECT count(*) AS count FROM entities').get()!.count)) throw new Error('Cycle or unreachable entity in parent graph');
  db.exec(`WITH RECURSIVE tree(id,depth) AS (
    SELECT id,0 FROM entities WHERE parent_id IS NULL UNION ALL
    SELECT e.id,t.depth+1 FROM entities e JOIN tree t ON e.parent_id=t.id)
    UPDATE entities SET depth=(SELECT depth FROM tree WHERE tree.id=entities.id)`);
}

export async function createSnapshot(path: string, metadata: SnapshotMetadata, entities: Iterable<Entity> | AsyncIterable<Entity>): Promise<void> {
  validateMetadata(metadata);
  await mkdir(dirname(path), { recursive: true });
  try { await access(path); throw new Error('Snapshot destination already exists'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const temporary = path + '.' + randomUUID() + '.tmp';
  const db = new DatabaseSync(temporary);
  let closed = false;
  try {
    db.exec(`PRAGMA foreign_keys=ON; BEGIN;
      CREATE TABLE metadata (value TEXT NOT NULL);
      CREATE TABLE entities (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, country_id TEXT NOT NULL,
        parent_id TEXT REFERENCES entities(id) DEFERRABLE INITIALLY DEFERRED, depth INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL);
      CREATE INDEX entities_parent ON entities(parent_id);
      CREATE INDEX entities_country ON entities(country_id);`);
    db.prepare('INSERT INTO metadata VALUES (?)').run(canonicalJson(metadata));
    const insert = db.prepare('INSERT INTO entities (id,entity_type,country_id,parent_id,data) VALUES (?,?,?,?,?)');
    for await (const entity of entities) {
      validateEntity(entity);
      insert.run(entity.id,entity.entityType,entity.countryId,entity.parentId,canonicalJson(entity));
    }
    ensureGraph(db);
    db.exec('COMMIT; PRAGMA optimize;');
    db.close(); closed = true;
    await link(temporary,path);
  } finally {
    if (!closed) db.close();
    await unlink(temporary).catch(()=>{});
  }
}

export class Snapshot {
  private db: DatabaseSync;
  private nextPlan = 0;
  private constructor(path: string) {
    this.db = new DatabaseSync(path,{readOnly:true});
    try { validateMetadata(this.metadata); } catch (error) { this.db.close(); throw error; }
  }
  static open(path: string): Snapshot { return new Snapshot(path); }
  get metadata(): SnapshotMetadata { return JSON.parse(this.db.prepare('SELECT value FROM metadata').get()!.value as string) as SnapshotMetadata; }
  get count(): number { return Number(this.db.prepare('SELECT count(*) AS count FROM entities').get()!.count); }
  get(id: string): Entity | undefined {
    const row=this.db.prepare('SELECT data FROM entities WHERE id=?').get(id);
    return row ? JSON.parse(row.data as string) as Entity : undefined;
  }
  *entities(): IterableIterator<Entity> {
    for (const row of this.db.prepare('SELECT data FROM entities ORDER BY depth,id').iterate()) yield JSON.parse(row.data as string) as Entity;
  }
  select(selection: Selection): ExportPlan {
    selection=structuredClone(selection);
    const request = {format:'json',...selection} as ExportRequest;
    if (selection.entityTypes && (selection.entityTypes.length===0 || selection.entityTypes.some(type=>!['country','subdivision','locality'].includes(type)))) throw new Error('Invalid entityTypes selection');
    const table = `selected_${this.nextPlan++}`;
    this.db.exec(`CREATE TEMP TABLE ${table} (id TEXT PRIMARY KEY, context INTEGER NOT NULL DEFAULT 0)`);
    try {
    const insert = this.db.prepare(`INSERT OR IGNORE INTO ${table}(id) SELECT id FROM entities WHERE country_id=?`);
    const scoped = Boolean(selection.countries?.length || selection.subdivisions?.length);
    for (const country of selection.countries ?? []) {
      const matches=this.db.prepare(`SELECT id FROM entities WHERE entity_type='country' AND
        (id=? OR upper(json_extract(data,'$.codes.iso2'))=upper(?) OR upper(json_extract(data,'$.codes.iso3'))=upper(?))`).all(country,country,country);
      if (matches.length!==1) throw new Error(`Unknown country or ambiguous code: ${country}`);
      insert.run(matches[0]!.id as string);
    }
    for (const id of selection.subdivisions ?? []) {
      const entity=this.get(id);
      if (!entity || entity.entityType!=='subdivision') throw new Error(`Unknown subdivision: ${id}`);
      this.db.prepare(`WITH RECURSIVE subtree(id) AS (SELECT ? UNION ALL SELECT e.id FROM entities e JOIN subtree s ON e.parent_id=s.id)
        INSERT OR IGNORE INTO ${table}(id) SELECT id FROM subtree`).run(id);
    }
    if (!scoped) this.db.exec(`INSERT INTO ${table}(id) SELECT id FROM entities`);
    if (selection.entityTypes) this.db.prepare(`DELETE FROM ${table} WHERE id IN (SELECT id FROM entities WHERE entity_type NOT IN (${selection.entityTypes.map(()=>'?').join(',')}))`).run(...selection.entityTypes);
    if (selection.includeAncestors!==false) this.db.exec(`WITH RECURSIVE ancestors(id) AS (
      SELECT e.parent_id FROM entities e JOIN ${table} s ON e.id=s.id WHERE e.parent_id IS NOT NULL UNION
      SELECT e.parent_id FROM entities e JOIN ancestors a ON e.id=a.id WHERE e.parent_id IS NOT NULL)
      INSERT OR IGNORE INTO ${table}(id,context) SELECT id,1 FROM ancestors`);
    const contextIds=this.db.prepare(`SELECT s.id FROM ${table} s JOIN entities e ON s.id=e.id WHERE s.context=1 ORDER BY e.depth,e.id`).all().map(row=>row.id as string);
    const externalReferences=this.db.prepare(`SELECT DISTINCT ref FROM (
      SELECT e.parent_id AS ref FROM entities e JOIN ${table} s ON s.id=e.id UNION
      SELECT e.country_id AS ref FROM entities e JOIN ${table} s ON s.id=e.id)
      WHERE ref IS NOT NULL AND ref NOT IN (SELECT id FROM ${table}) ORDER BY ref`).all().map(row=>row.ref as string);
    const db=this.db;let disposed=false;
    function* iterate(order:string):IterableIterator<Entity> {
        if(disposed) throw new Error('Selection plan is disposed');
        for (const row of db.prepare(`SELECT e.data FROM entities e JOIN ${table} s ON s.id=e.id ORDER BY ${order}`).iterate()) {
          const entity=JSON.parse(row.data as string) as Entity;
          if (!selection.coordinates) delete entity.coordinates;
          if (!selection.boundaries) delete entity.boundary;
          yield entity;
        }
    }
    return {request, metadata:this.metadata, count:Number(db.prepare(`SELECT count(*) AS count FROM ${table}`).get()!.count),contextIds,externalReferences,
      entities:()=>iterate('e.depth,e.id'),identityEntities:()=>iterate('e.id'),
      dispose(){ if(!disposed) {db.exec(`DROP TABLE ${table}`);disposed=true;} }
    };
    } catch(error) {this.db.exec(`DROP TABLE IF EXISTS ${table}`);throw error;}
  }
  close(): void { this.db.close(); }
}
