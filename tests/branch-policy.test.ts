import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertBranchPolicy } from '../.github/scripts/branch-policy.mjs';
const pr=(base:string,head:string,owner='owner/repo')=>({repository:{full_name:'owner/repo'},pull_request:{base:{ref:base},head:{ref:head,repo:{full_name:owner}}}});
test('branch policy accepts task PRs into dev and same-repository dev releases into main',()=>{
  assert.doesNotThrow(()=>assertBranchPolicy('pull_request',pr('dev','feature/exports')));
  assert.doesNotThrow(()=>assertBranchPolicy('pull_request',pr('main','dev')));
});
test('branch policy rejects feature releases, cross-repository releases and tool-named branches',()=>{
  assert.throws(()=>assertBranchPolicy('pull_request',pr('main','feature/exports')),/dev.*main|release/i);
  assert.throws(()=>assertBranchPolicy('pull_request',pr('main','dev','other/repo')),/same.repository/i);
  assert.throws(()=>assertBranchPolicy('pull_request',pr('dev','codex/exports')),/prefix|branch/i);
  assert.throws(()=>assertBranchPolicy('pull_request',pr('dev','feature/','other/repo')),/prefix|branch/i);
});
