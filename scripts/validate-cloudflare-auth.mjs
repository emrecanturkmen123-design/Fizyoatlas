import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {resolveIdentity,authResponse,safeReturnTo} from '../server/auth.ts';
import worker from '../server/worker.ts';

const env={AUTH_PROVIDER:'cloudflare',ACCESS_TEAM_DOMAIN:'https://fizyoatlas.cloudflareaccess.com',ACCESS_AUD:'test-audience'};
const {publicKey,privateKey}=await generateKeyPair('RS256');
const jwk=await exportJWK(publicKey);jwk.kid='test-key';jwk.alg='RS256';jwk.use='sig';
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{assert.equal(String(url),env.ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};
const token=async (overrides={})=>new SignJWT({email:'student@example.test',...overrides}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(overrides.iss??env.ACCESS_TEAM_DOMAIN).setAudience(overrides.aud??env.ACCESS_AUD).setSubject('student-1').setExpirationTime(overrides.exp??'1h').sign(privateKey);
const request=headers=>new Request('https://atlas.fizyoatlas.workers.dev/api/learning',{headers});
try {
  const forged=request({'oai-authenticated-user-id':'victim','oai-authenticated-user-email':'victim@example.test'});
  assert.equal(await resolveIdentity(forged,env),null);
  assert.equal((await worker.fetch(forged,env)).status,401);
  assert.equal(await resolveIdentity(forged,{AUTH_PROVIDER:'cloudflare'}),null);
  const good=await token();
  assert.deepEqual(await resolveIdentity(request({'Cf-Access-Jwt-Assertion':good}),env),{id:'cf:student-1',email:'student@example.test'});
  assert.deepEqual(await resolveIdentity(request({Cookie:'other=x; CF_Authorization='+good}),env),{id:'cf:student-1',email:'student@example.test'});
  for(const bad of [await token({aud:'wrong'}),await token({iss:'https://other.cloudflareaccess.com'}),await token({exp:1}),await token({email:null}),'not.a.jwt'])assert.equal(await resolveIdentity(request({'Cf-Access-Jwt-Assertion':bad}),env),null);
  const pending=await authResponse(new Request('https://atlas.fizyoatlas.workers.dev/auth/login'),{AUTH_PROVIDER:'cloudflare'});
  assert.equal(pending.status,503);assert.match(await pending.text(),/kurulumu sürüyor/);
  const login=await authResponse(new Request('https://atlas.fizyoatlas.workers.dev/auth/login?return_to=https://evil.test',{headers:{Cookie:'CF_Authorization='+good}}),env);
  assert.equal(login.status,302);assert.equal(login.headers.get('Location'),'/#calismalarim');
  assert.equal(safeReturnTo('/#vakalar'),'/#vakalar');
  assert.equal(safeReturnTo('//evil.test'),'/#calismalarim');
  assert.equal(await authResponse(new Request('https://atlas.test/auth/login'),{}),null);
  console.log('PASS: public-host header spoofing blocked; signed Access JWT and cookie verified; wrong issuer/audience, expired/malformed tokens rejected; pending login explicit; redirect restricted; Sites behavior preserved.');
}finally{globalThis.fetch=originalFetch;}
