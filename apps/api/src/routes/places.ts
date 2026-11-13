import type { FastifyInstance } from 'fastify';
import type { GeographicCatalog, ResourceName } from 'georeference';
import { registerRelationshipRoute, registerResourceRoutes } from './resources.ts';

export function registerPlacesRoutes(app: FastifyInstance, catalog: GeographicCatalog): void {
  for (const resource of ['neighborhoods', 'villages'] as const) registerResourceRoutes(app, catalog, resource);
  const relations: [ResourceName, ResourceName][] = [
    ['communes', 'neighborhoods'], ['arrondissements', 'neighborhoods'], ['districts', 'villages'],
    ['urbanCommunities', 'neighborhoods'], ['urbanCommunities', 'villages'], ['ruralCommunities', 'villages'],
  ];
  for (const [parent, child] of relations) registerRelationshipRoute(app, catalog, parent, child);
}
