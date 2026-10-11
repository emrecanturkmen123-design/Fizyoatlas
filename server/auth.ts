import {createRemoteJWKSet,jwtVerify} from 'jose';

export interface AuthEnv {
  AUTH_PROVIDER?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

export async function resolveIdentity(request:Request,env:AuthEnv) {
  if(env.AUTH_PROVIDER!=='cloudflare') {
    const id=request.headers.get('oai-authenticated-user-id');
    const email=request.headers.get('oai-authenticated-user-email');
    return id&&email?{id,email}:null;
  }
  // Public Cloudflare requests must never trust Sites identity headers.
  if(!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN)return null;
  if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))return null;
  const cookie=request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const token=request.headers.get('Cf-Access-Jwt-Assertion')||cookie;
  if(!token||token.length>16384)return null;
  try {
    const keys=createRemoteJWKSet(new URL(env.ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs'));
    const {payload}=await jwtVerify(token,keys,{issuer:env.ACCESS_TEAM_DOMAIN,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','sub','email']});
    if(typeof payload.sub!=='string'||typeof payload.email!=='string'||!payload.email)return null;
    return {id:'cf:'+payload.sub,email:payload.email};
  }catch{return null;}
}

export function safeReturnTo(value:string|null) {
  return value?.startsWith('/#')?value:'/#calismalarim';
}

export async function authResponse(request:Request,env:AuthEnv):Promise<Response|null> {
  const url=new URL(request.url);
  if(env.AUTH_PROVIDER!=='cloudflare'||!['/auth/login','/signin-with-chatgpt'].includes(url.pathname))return null;
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  const headers={'Cache-Control':'no-store','Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"};
  if(!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN)return new Response(`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hesapla kayıt · Fizyo Atlas</title><style>body{font:18px/1.6 system-ui;margin:12vh auto;padding:24px;max-width:620px;color:#17312e;background:#f5f8f6}a{color:#066b60}</style><h1>Hesapla kayıt kurulumu sürüyor</h1><p>Atlası, hareketleri ve vakaları giriş yapmadan kullanabilirsin. Favoriler, test yanıtları ve misafir vaka ilerlemesi bu tarayıcıda saklanır.</p><p>Defter ve cihazlar arası hesap kayıtları için giriş henüz etkin değil. Önceki sitedeki hesap kayıtların bu adrese taşınmadı.</p><p><a href="/#calismalarim">Atlasa dön</a> · <a href="https://fizyo-kas-atlasi.efebtrkmn.chatgpt.site/#calismalarim">Önceki sitedeki kayıtları aç</a></p></html>`,{status:503,headers});
  const identity=await resolveIdentity(request,env);
  if(!identity)return new Response('Giriş doğrulanamadı. Lütfen yeniden giriş yap.',{status:401,headers});
  return new Response(null,{status:302,headers:{Location:safeReturnTo(url.searchParams.get('return_to')),'Cache-Control':'no-store'}});
}
