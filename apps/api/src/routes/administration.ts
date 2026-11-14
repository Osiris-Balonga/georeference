import type { FastifyInstance } from 'fastify';
import type { GeographicCatalog, ResourceName } from '242places';
import { registerRelationshipRoute, registerResourceRoutes } from './resources.ts';

export function registerAdministrationRoutes(app: FastifyInstance, catalog: GeographicCatalog): void {
  const resources: ResourceName[] = ['countries', 'departments', 'communes', 'districts',
    'arrondissements', 'urbanCommunities', 'ruralCommunities'];
  for (const resource of resources) registerResourceRoutes(app, catalog, resource);
  const relations: [ResourceName, ResourceName][] = [
    ['countries', 'departments'], ['departments', 'communes'], ['departments', 'districts'],
    ['communes', 'arrondissements'], ['districts', 'urbanCommunities'], ['districts', 'ruralCommunities'],
  ];
  for (const [parent, child] of relations) registerRelationshipRoute(app, catalog, parent, child);
}
