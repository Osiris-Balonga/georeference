import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function assertBranchPolicy(eventName,event) {
  if(eventName!=='pull_request') return;
  const {base,head}=event.pull_request;
  if(base.ref==='main') {
    if(head.ref!=='dev') throw new Error('Release PRs must go from dev to main');
    if(head.repo?.full_name!==event.repository.full_name) throw new Error('Release PR must use the same repository');
  } else if(base.ref==='dev') {
    if(!/^(feature|feat|fix|chore|docs|refactor|test|ci)\/.+/.test(head.ref)) throw new Error('Use a descriptive task branch prefix for dev PRs');
  } else throw new Error('Pull requests must target dev or main');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  assertBranchPolicy(process.env.GITHUB_EVENT_NAME,JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')));
  console.log('Branch policy accepted');
}
