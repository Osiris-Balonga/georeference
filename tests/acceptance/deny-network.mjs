import { syncBuiltinESMExports } from 'node:module';
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';

function denied() {
  throw new Error('Acceptance test forbids outbound network access');
}

globalThis.fetch = denied;
net.connect = denied;
net.createConnection = denied;
net.Socket.prototype.connect = denied;
tls.connect = denied;
http.get = http.request = denied;
https.get = https.request = denied;
syncBuiltinESMExports();
