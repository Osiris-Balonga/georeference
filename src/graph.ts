import type { Entity } from './types.ts';

/** Validate internal relationships; declared external references are resolved by the target importer. */
export function validateGraph(entities:Entity[]):void {
  const byId=new Map(entities.map(entity=>[entity.id,entity]));
  const children=new Map<string,string[]>();const indegree=new Map<string,number>();
  for(const entity of entities) {
    const country=byId.get(entity.countryId),parent=entity.parentId?byId.get(entity.parentId):undefined;
    if(country&&country.entityType!=='country') throw new Error('countryId must reference a country');
    if(parent&&(parent.countryId!==entity.countryId||parent.entityType==='locality')) throw new Error('Invalid country or parent relationship');
    indegree.set(entity.id,parent?1:0);
    if(parent) {const list=children.get(parent.id)??[];list.push(entity.id);children.set(parent.id,list);}
  }
  const queue=entities.filter(entity=>indegree.get(entity.id)===0).map(entity=>entity.id);let visited=0;
  for(let index=0;index<queue.length;index++) {
    visited++;
    for(const child of children.get(queue[index]!)??[]) {indegree.set(child,0);queue.push(child);}
  }
  if(visited!==entities.length) throw new Error('Cycle in entity parent graph');
}
