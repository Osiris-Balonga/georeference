import type { Snapshot } from './snapshot.ts';
import type { Entity } from './types.ts';
import type { GeographicKind } from './types.ts';
export function createClient(snapshot:Snapshot) {
  function* select(entityType:'country'|'subdivision'|'locality',countryId?:string):IterableIterator<Entity> {
    const plan=snapshot.select({entityTypes:[entityType],includeAncestors:false,coordinates:true,boundaries:true,...(countryId?{countries:[countryId]}:{})});
    try {yield* plan.entities();} finally {plan.dispose?.();}
  }
  function byKind(kind:GeographicKind,parentId?:string):Entity[] {
    const plan=snapshot.select({kinds:[kind],includeAncestors:false,coordinates:true,boundaries:true,...(parentId?{subdivisions:[parentId]}:{})});
    try {return [...plan.entities()];}finally{plan.dispose?.();}
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
    *iterateLocalities(countryId?:string):IterableIterator<Entity> { yield* select('locality',countryId); },
    listCommunes():Entity[] {return byKind('commune');},
    listArrondissements(communeId?:string):Entity[] {return byKind('arrondissement',communeId);},
    listNeighborhoods(parentId?:string):Entity[] {return byKind('neighborhood',parentId);},
  };
}
