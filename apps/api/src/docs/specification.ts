import { resources, type Locale } from './content.ts';

interface Operation {
  tags?: string[]; summary?: string; description?: string;
  parameters?: { name: string; description?: string }[];
  responses?: Record<string, { description?: string }>;
}
interface Document {
  info: { title: string; description?: string };
  paths: Record<string, Record<string, Operation>>;
  tags?: { name: string }[];
  servers?: { description?: string }[];
}

/** Keep route-owned schemas intact; translate prose on a detached chapter projection. */
export function chapterSpecification(document: unknown, locale: Locale, slug: string) {
  const result = structuredClone(document) as Document;
  result.info.title = resources.find(row => row[0] === slug)?.[locale === 'fr' ? 1 : 2] ?? slug;
  result.info.description = '';
  result.paths = Object.fromEntries(Object.entries(result.paths).filter(([, methods]) =>
    methods.get?.tags?.includes(slug)));
  delete result.tags;
  for (const server of result.servers ?? []) server.description = locale === 'fr' ? 'Origine de ce serveur API' : 'Current API server origin';
  const labels = Object.fromEntries(resources.map(([key, fr, en]) => [key, (locale === 'fr' ? fr : en).toLocaleLowerCase(locale)]));
  for (const [path, methods] of Object.entries(result.paths)) {
    const operation = methods.get;
    if (!operation) continue;
    const segments = path.split('/').filter(Boolean);
    const child = segments.at(-1)!;
    const detail = child === '{id}';
    const relationship = segments.includes('{id}') && !detail;
    const name = labels[detail ? segments.at(-2)! : child] ?? child;
    operation.tags = [result.info.title];
    if (slug === 'reference') {
      operation.summary = locale === 'fr' ? (child === 'dataset' ? 'Consulter la version et les sources' : 'Consulter la couverture connue')
        : (child === 'dataset' ? 'Read dataset version and sources' : 'Read known coverage');
    } else if (slug === 'health') {
      operation.summary = locale === 'fr' ? (child === 'live' ? 'Vérifier le processus' : 'Vérifier la disponibilité')
        : (child === 'live' ? 'Check process liveness' : 'Check service readiness');
    } else {
      operation.summary = locale === 'fr' ? `${detail ? 'Consulter par UUID :' : 'Lister les'} ${name}${relationship ? ' par parent' : ''}`
        : `${detail ? 'Get one resource from' : 'List'} ${name}${relationship ? ' by parent' : ''}`;
    }
    const geographicDescription = locale === 'fr'
      ? (relationship ? 'Retourne les descendants documentés du parent, sans modifier leur rattachement réel.' : 'Retourne les lieux connus du référentiel. Les identifiants UUID restent stables entre l’API et les exports.')
      : (relationship ? 'Returns documented descendants while preserving their actual direct parents.' : 'Returns known places in the reference. UUIDs remain stable across API responses and exports.');
    operation.description = slug === 'health'
      ? (locale === 'fr' ? 'Indique si le processus répond ou si le service est prêt à recevoir les requêtes.' : 'Reports whether the process is alive or the service is ready to receive requests.')
      : slug === 'reference'
        ? (locale === 'fr' ? 'Décrit la version des données, leurs sources et leur couverture partielle. Les nombres indiquent les enregistrements connus.' : 'Describes the dataset version, sources and partial coverage. Counts indicate known records.')
        : geographicDescription;
    for (const parameter of operation.parameters ?? []) {
      parameter.description = parameter.name === 'q' ? (locale === 'fr' ? 'Partie du nom, sans distinction de casse ni d’accents.' : 'Name substring, ignoring case and accents.')
        : parameter.name === 'limit' ? (locale === 'fr' ? 'Taille de la page : 50 par défaut, 100 au maximum.' : 'Page size: 50 by default, up to 100.')
        : parameter.name === 'offset' ? (locale === 'fr' ? 'Nombre de résultats à ignorer, à partir de zéro.' : 'Number of results to skip, starting at zero.')
        : (locale === 'fr' ? 'UUID du lieu ou du parent direct documenté.' : 'UUID of the place or its documented direct parent.');
    }
    for (const [code, response] of Object.entries(operation.responses ?? {})) {
      const descriptions: Record<string, [string, string]> = {
        200: ['Requête réussie', 'Successful request'], 400: ['Paramètres invalides', 'Invalid parameters'],
        404: ['Ressource introuvable', 'Resource not found'], 405: ['Méthode non autorisée', 'Method not allowed'],
        413: ['Corps trop volumineux', 'Payload too large'], 429: ['Limite de requêtes atteinte', 'Rate limit exceeded'],
        500: ['Erreur du serveur', 'Server error'],
      };
      const translated = descriptions[code]?.[locale === 'fr' ? 0 : 1];
      if (translated) response.description = translated;
    }
  }
  return result;
}
