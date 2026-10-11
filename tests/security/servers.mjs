import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import https from 'node:https';
import http from 'node:http';
const temp = mkdtempSync(join(tmpdir(),'sigmavet-tls-'));
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(temp,'key.pem'),'-out',join(temp,'cert.pem'),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
const api=spawn('node',['-r','ts-node/register','test/security/harness.ts'],{cwd:resolve(process.env.SECURITY_API_DIR || '../saluki_vet_api'),env:{...process.env,SECURITY_TEST_PRODUCTION:'1'},stdio:'inherit'});
const ui=spawn('node',['.output/server/index.mjs'],{env:{...process.env,NODE_ENV:'production',PORT:'3301',HOST:'127.0.0.1',NUXT_API_UPSTREAM:'http://127.0.0.1:3300'},stdio:'inherit'});
const server=https.createServer({key:readFileSync(join(temp,'key.pem')),cert:readFileSync(join(temp,'cert.pem'))},(req,res)=>{
  const upstream=http.request({host:'127.0.0.1',port:3301,path:req.url,method:req.method,headers:{...req.headers,'x-forwarded-proto':'https'}},(r)=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',()=>{res.writeHead(503);res.end();});req.pipe(upstream);
});
server.listen(3443,'127.0.0.1');
const stop=()=>{api.kill();ui.kill();server.close();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
