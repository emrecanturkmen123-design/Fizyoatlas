import * as T from 'three';
export const WEBGL_UNAVAILABLE='3D görüntüleyici başlatılamadı. Tarayıcı bu oturumda WebGL bağlantısı oluşturamadı. Uyumlu modla yeniden deneyebilir veya siteyi başka bir tarayıcıda açabilirsin. Kas kartları ve vakalar kullanılabilir.';
export function createAtlasRenderer(compatibility=false,create:(p:T.WebGLRendererParameters)=>T.WebGLRenderer=p=>new T.WebGLRenderer(p),canvas:()=>HTMLCanvasElement=()=>document.createElement('canvas')){
 const attempts:T.WebGLRendererParameters[]=compatibility?[{antialias:false,alpha:false,powerPreference:'default'}]:[{antialias:true,alpha:false,powerPreference:'default'},{antialias:false,alpha:false,powerPreference:'default'}];
 const errors:string[]=[];
 for(const [i,options] of attempts.entries()){
  const surface=canvas();let reason='';const failed=(e:Event)=>{reason=(e as WebGLContextEvent).statusMessage||'Bağlantı kurulamadı';};surface.addEventListener('webglcontextcreationerror',failed);
  try{const renderer=create({...options,canvas:surface});return {renderer,compatibility:compatibility||i>0};}
  catch(e){errors.push(reason||(e instanceof Error?e.message:'WebGL oluşturulamadı'));}
  finally{surface.removeEventListener('webglcontextcreationerror',failed);}
 }
 console.warn('Atlas WebGL startup failed:',errors);
 throw new Error(WEBGL_UNAVAILABLE);
}
// A lost context must stop rendering/loading updates until a fresh scene is mounted.
export function watchAtlasContext(canvas:HTMLCanvasElement,onLost:()=>void,onRestored:()=>void){
 let lost=false,active=true;
 const lose=(e:Event)=>{e.preventDefault();if(!active||lost)return;lost=true;onLost();};
 const restore=()=>{if(!active||!lost)return;lost=false;onRestored();};
 canvas.addEventListener('webglcontextlost',lose);canvas.addEventListener('webglcontextrestored',restore);
 return {isLost:()=>lost,dispose:()=>{active=false;canvas.removeEventListener('webglcontextlost',lose);canvas.removeEventListener('webglcontextrestored',restore);}};
}
