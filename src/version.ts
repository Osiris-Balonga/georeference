import { readFileSync } from 'node:fs';

/** Package and generator versions stay aligned in source checkouts and packed installs. */
export const VERSION: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
