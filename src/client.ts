import type { Snapshot } from './snapshot.ts';
import type { Entity } from './types.ts';
export function createClient(snapshot:Snapshot) {
  function* select(entityType:'country'|'subdivision'|'locality',countryId?:string):IterableIterator<Entity> {
    const plan=snapshot.select({entityTypes:[entityType],includeAncestors:false,coordinates:true,boundaries:true,...(countryId?{countries:[countryId]}:{})});
    try {yield* plan.entities();} finally {plan.dispose?.();}
  }
  return {
    getEntity(id:string):Entity|undefined { return snapshot.get(id); },
    getCountry(id:string):Entity|undefined {
      const direct=snapshot.get(id);
      if(direct) return direct.entityType==='country'?direct:undefined;
      return [...select('country')].find(entity=>entity.codes?.iso2?.toUpperCase()===id.toUpperCase()||entity.codes?.iso3?.toUpperCase()===id.toUpperCase());
    },
    listCountries():Entity[] { return [...select('country')]; },
    listSubdivisions(countryId?:string,parentId?:string):Entity[] { return [...select('subdivision',countryId)].filter(entity=>parentId===undefined||entity.parentId===parentId); },
    *iterateLocalities(countryId?:string):IterableIterator<Entity> { yield* select('locality',countryId); }
  };
}
