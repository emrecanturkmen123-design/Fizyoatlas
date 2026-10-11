// The Sites build retains its managed ChatGPT sign-in. External hosting uses Access.
export const externalHosting = (import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_AUTH_PROVIDER === 'cloudflare';
export const signInLabel = externalHosting ? 'Hesapla kayıt' : 'ChatGPT ile giriş yap';
export function signInUrl(returnTo:string){return (externalHosting?'/auth/login':'/signin-with-chatgpt')+'?return_to='+encodeURIComponent(returnTo);}
