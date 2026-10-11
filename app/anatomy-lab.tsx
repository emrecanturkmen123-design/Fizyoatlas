import MuscleComparisonInfo from './muscle-comparison-info';
import {MUSCLE_COMPARISON_ITEMS,MUSCLE_COMPARISON_PAIRS,muscleComparisonSelection,muscleComparisonPalette,suggestedMuscleComparison} from './muscle-comparison';
import {SelectionLegend} from './selection-legend';
import {Disclosure} from './disclosure';
import TendonStudyPanel from './tendon-study-panel';
import {TENDON_COMPARISONS,comparisonFor} from './tendon-comparisons';
import {suggestedComparison,comparisonFrames} from './comparison-options';
import type {WorkspaceRoute} from './workspace-route';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {CLINICAL_STRUCTURES,geometryLabel} from './clinical-structures';
import {connectiveSelection} from './connective-study';
import {decodeModelResponse} from './model-download';
import {cameraPoint,type LabMesh,type Vec3} from './anatomy-lab-geometry';
import type {Atlas} from './anatomy';
const palette={skeletal:'#a4864f',muscular:'#b35445',connective:'#247e79'};
const cache=new Map<string,Promise<ArrayBuffer>>(),cacheBytes=new Map<string,number>();
function loadChunk(atlas:Atlas,index:number){const c=atlas.chunks[index],url=c.gzip&&typeof DecompressionStream!=='undefined'?c.gzip:c.url;if(!cache.has(url)){const task=fetch(url).then(r=>{if(!r.ok)throw Error('Model yüzeyleri yüklenemedi.');return decodeModelResponse(r,c.bytes,url.endsWith('.gz'));}).catch(e=>{cache.delete(url);cacheBytes.delete(url);throw e;});cache.set(url,task);cacheBytes.set(url,c.bytes);while(cache.size>1&&[...cacheBytes.values()].reduce((a,b)=>a+b,0)>24*1024*1024){const old=cache.keys().next().value!;cache.delete(old);cacheBytes.delete(old);}}return cache.get(url)!;}
function SurfaceView({meshes,center,span,yaw,pitch,zoom,label,highlightIds,partColors}:{highlightIds?:string[];partColors?:Map<string,string>;meshes:LabMesh[];center:Vec3;span:number;yaw:number;pitch:number;zoom:number;label:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;let frame=0;
 const draw=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const ratio=Math.min(globalThis.devicePixelRatio||1,1.5);canvas.width=w*ratio;canvas.height=h*ratio;ctx.scale(ratio,ratio);ctx.fillStyle='#f5f6f4';ctx.fillRect(0,0,w,h);const scale=Math.min(w,h)*.78/span*zoom;
 const project=(p:Vec3):Vec3=>{const q=cameraPoint(p,center,yaw,pitch);return [q[0]*scale+w/2,-q[1]*scale+h/2,q[2]];};
 const faces:{p:Vec3[];color:string;depth:number;alpha:number}[]=[];
  for(const mesh of meshes){const color=partColors?.get(mesh.part.id)??palette[mesh.part.system as keyof typeof palette]??'#647b87',v=mesh.positions;for(let i=0;i<mesh.indices.length;i+=3){const p=[0,1,2].map(k=>{const n=mesh.indices[i+k]*3;return project([v[n],v[n+1],v[n+2]]);});faces.push({p,color,alpha:highlightIds&&!highlightIds.includes(mesh.part.id)?.15:.9,depth:p.reduce((s,q)=>s+q[2],0)/3});}}
  faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){ctx.fillStyle=f.color;ctx.globalAlpha=f.alpha;ctx.beginPath();ctx.moveTo(f.p[0][0],f.p[0][1]);ctx.lineTo(f.p[1][0],f.p[1][1]);ctx.lineTo(f.p[2][0],f.p[2][1]);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
 ctx.fillStyle='#526568';ctx.font='12px sans-serif';ctx.fillText('3D kaynak yüzeylerinin izdüşümü',12,h-14);};
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});observer.observe(canvas);draw();return()=>{observer.disconnect();cancelAnimationFrame(frame);};},[meshes,center,span,yaw,pitch,zoom,highlightIds,partColors]);
 return <canvas ref={ref} role="img" aria-label={label}/>;
}
export default function AnatomyLab({atlas,initialStructure,initialRoute={},onRouteChange,onClose,onStructure,onQuiz}:{atlas:Atlas;initialStructure?:string;initialRoute?:Partial<WorkspaceRoute>;onRouteChange?:(route:Partial<WorkspaceRoute>)=>void;onClose:()=>void;onStructure:(key:string)=>void;onQuiz:(key:string)=>void}){
 const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>{heading.current?.focus();},[]);
 const initialKey=initialRoute.structure??initialStructure;
 const initialKind=initialRoute.labKind==='muscles'||initialKey?.startsWith('muscle:')?'muscles':'connective';
 const [kind,setKind]=useState<'muscles'|'connective'>(initialKind);
 const initialCatalog=initialKind==='muscles'?MUSCLE_COMPARISON_ITEMS:CLINICAL_STRUCTURES;
 const start=initialCatalog.some(s=>s.key===initialKey)?initialKey!:initialKind==='muscles'?'muscle:quadriceps':'quadriceps tendon';
 const suggest=(key:string)=>key.startsWith('muscle:')?suggestedMuscleComparison(key):suggestedComparison(key);
 const [mode,setMode]=useState<'compare'|'clinical'>(initialRoute.labMode==='clinical'?'clinical':'compare'),[left,setLeft]=useState(start),[right,setRight]=useState(initialRoute.compare&&initialRoute.compare!==start&&initialCatalog.some(s=>s.key===initialRoute.compare)?initialRoute.compare:suggest(start));
 const [framing,setFraming]=useState<'centered'|'aligned'>(initialRoute.labFrame??'centered'),[side,setSide]=useState<'right'|'left'>(initialRoute.side??'right');
 const [pair,setPair]=useState(TENDON_COMPARISONS.some(p=>p.id===initialRoute.clinicalPair)?initialRoute.clinicalPair!:comparisonFor(start)??'knee-chain');
 const [yaw,setYaw]=useState(initialRoute.yaw??0),[pitch,setPitch]=useState(initialRoute.pitch??0),[zoom,setZoom]=useState(initialRoute.zoom??1),[context,setContext]=useState(initialRoute.labContext??true),[meshes,setMeshes]=useState<LabMesh[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const routeChange=useRef(onRouteChange);routeChange.current=onRouteChange;
 useEffect(()=>{routeChange.current?.({structure:left,compare:right,side,labMode:mode,labFrame:framing,labContext:context,clinicalPair:pair,yaw,pitch,zoom,labKind:kind==='muscles'?'muscles':undefined});},[left,right,side,mode,framing,context,pair,yaw,pitch,zoom,kind]);
 const a=useMemo(()=>kind==='muscles'?muscleComparisonSelection(atlas,left,side):connectiveSelection(atlas,left,side),[atlas,left,side,kind]),b=useMemo(()=>kind==='muscles'?muscleComparisonSelection(atlas,right,side):connectiveSelection(atlas,right,side),[atlas,right,side,kind]);
 const colors=useMemo(()=>kind==='muscles'?muscleComparisonPalette(atlas,a.selected,b.selected):undefined,[atlas,a,b,kind]);
 const selected=useMemo(()=>mode==='clinical'?[]:atlas.parts.filter(p=>[...a.selected,...b.selected,...(context?[...a.context,...b.context]:[])].includes(p.id)),[atlas,a,b,context,mode]);
 useEffect(()=>{let active=true;setLoading(true);setError('');Promise.all([...new Set(selected.map(p=>p.chunk))].map(async index=>[index,await loadChunk(atlas,index)] as const)).then(values=>{if(!active)return;const buffers=new Map(values);setMeshes(selected.map(part=>({part,positions:new Float32Array(buffers.get(part.chunk)!,part.positions,part.vertexCount*3),indices:new Uint32Array(buffers.get(part.chunk)!,part.indices,part.indexCount)})));setLoading(false);}).catch(e=>{if(active){setError(e.message);setLoading(false);}});return()=>{active=false;};},[atlas,selected,retry]);
 const frames=useMemo(()=>comparisonFrames(atlas,a.selected,b.selected,framing),[atlas,a,b,framing]);
 const sideName=side==='right'?'Sağ':'Sol';
 const catalog=kind==='muscles'?MUSCLE_COMPARISON_ITEMS:CLINICAL_STRUCTURES;
 const itemName=(key:string)=>catalog.find(s=>s.key===key)?.name;
 const preset=MUSCLE_COMPARISON_PAIRS.find(p=>'muscle:'+p.left===left&&'muscle:'+p.right===right);
 const changeKind=(value:'muscles'|'connective')=>{setKind(value);setMode('compare');const key=value==='muscles'?'muscle:quadriceps':'quadriceps tendon';setLeft(key);setRight(suggest(key));};
 const options=(exclude?:string)=>catalog.map(s=><option key={s.key} value={s.key} disabled={s.key===exclude}>{s.name}</option>);
 const sideControl=<label className="lab-side">Taraf<select aria-label="İncelenen taraf" value={side} onChange={e=>setSide(e.target.value as 'right'|'left')}><option value="right">Sağ</option><option value="left">Sol</option></select></label>;
 return <section className="anatomy-lab glass" aria-label="Karşılaştırma"><div className="panel-heading"><h2 ref={heading} tabIndex={-1}>Karşılaştırma</h2><Button variant="ghost" onClick={onClose} aria-label="İncelemeyi kapat">✕</Button></div>
  <div className="learning-options" aria-label="İnceleme biçimi">{([{id:'compare',label:'Görsel karşılaştırma'},{id:'clinical',label:'Bilgiyi karşılaştır'}] as const).map(x=><Button key={x.id} aria-pressed={mode===x.id} variant={mode===x.id?'default':'outline'} onClick={()=>setMode(x.id)}>{x.label}</Button>)}</div>
  <div className="learning-options lab-kind-selector" aria-label="Karşılaştırılan yapı grubu"><Button variant={kind==='muscles'?'default':'outline'} aria-pressed={kind==='muscles'} onClick={()=>changeKind('muscles')}>Kaslar</Button><Button variant={kind==='connective'?'default':'outline'} aria-pressed={kind==='connective'} onClick={()=>changeKind('connective')}>Bağ ve tendonlar</Button></div>
  {mode==='clinical'&&kind==='connective'?<><div className="lab-selects">{sideControl}</div><TendonStudyPanel embedded side={side} pairId={pair} onPair={id=>{setPair(id);const match=TENDON_COMPARISONS.find(p=>p.id===id),key=match?.sides[0].route.structure;if(key){setLeft(key);setRight(match?.sides.find(s=>s.route.structure&&s.route.structure!==key)?.route.structure??suggestedComparison(key));}}} onQuiz={onQuiz} onClose={onClose}/></>:<>
    <div className="lab-selects"><label>Birinci yapı<select aria-label="Birinci yapı" value={left} onChange={e=>{const key=e.target.value;setLeft(key);setRight(suggest(key));const match=comparisonFor(key);if(match)setPair(match);}}>{options()}</select></label><label>İkinci yapı<select aria-label="İkinci yapı" value={right} onChange={e=>setRight(e.target.value)}>{options(left)}</select></label>{kind==='muscles'&&<label>Hazır çift<select aria-label="Hazır kas çifti" value={preset?.id??'custom'} onChange={e=>{const pair=MUSCLE_COMPARISON_PAIRS.find(p=>p.id===e.target.value);if(pair){setLeft('muscle:'+pair.left);setRight('muscle:'+pair.right);}}}><option value="custom">Özel seçim</option>{MUSCLE_COMPARISON_PAIRS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}{sideControl}</div>
    {mode==='compare'&&<>
    <div className="learning-options" aria-label="Karşılaştırma yerleşimi"><Button variant={framing==='centered'?'default':'outline'} aria-pressed={framing==='centered'} onClick={()=>setFraming('centered')}>Yapıları merkezle</Button><Button variant={framing==='aligned'?'default':'outline'} aria-pressed={framing==='aligned'} onClick={()=>setFraming('aligned')}>Anatomik konum</Button></div>
    <p className="lab-explanation">Açı ve ölçek ortaktır. {framing==='centered'?'Her yapı kendi alanında merkezlenir; vücuttaki göreli konumu gösterilmez.':'Yapılar vücuttaki ortak koordinatlarında kalır; farklı bölgeler küçük görünebilir.'} {context?'Çevre yapılar saydamdır.':''}</p>
   {kind==='connective'&&<p className="trace-legend"><span style={{color:palette.muscular}}>● Kas</span><span style={{color:palette.connective}}>● Tendon / bağ / kılıf</span><span style={{color:'#795f2f'}}>● Kemik</span></p>}
   {loading?<p role="status">Kaynak yüzeyler hazırlanıyor…</p>:error?<p role="alert">{error} <Button onClick={()=>setRetry(v=>v+1)}>Yeniden dene</Button></p>:<div className="lab-views">{[{key:left,ids:[...a.selected,...(context?a.context:[])]},{key:right,ids:[...b.selected,...(context?b.context:[])]}].map((s,i)=><figure key={i}><figcaption>{sideName} · {itemName(s.key)}</figcaption><p className="lab-scope">{kind==='muscles'?`${(i===0?a:b).selected.length} kaynak kas parçası`:geometryLabel(CLINICAL_STRUCTURES.find(c=>c.key===s.key)!)}</p><SurfaceView meshes={meshes.filter(m=>s.ids.includes(m.part.id))} highlightIds={i===0?a.selected:b.selected} partColors={colors?.partColors} {...frames[i]} yaw={yaw} pitch={pitch} zoom={zoom} label={sideName+' · Aynı açı ve ölçek · '+itemName(s.key)}/>{colors&&<SelectionLegend members={colors.members.filter(m=>m.ids.some(id=>(i===0?a:b).selected.includes(id)))}/>}<Button variant="outline" onClick={()=>onStructure(s.key)}>Atlas kartını aç</Button></figure>)}</div>}
   <Disclosure title="Kamera ve çevre yapılar"><div className="lab-camera"><label>Dönüş<input aria-label="Ortak kamera dönüşü" type="range" min={-180} max={180} value={yaw} onChange={e=>setYaw(+e.target.value)}/></label><label>Eğim<input aria-label="Ortak kamera eğimi" type="range" min={-80} max={80} value={pitch} onChange={e=>setPitch(+e.target.value)}/></label><label>Yakınlık<input aria-label="Ortak kamera yakınlığı" type="range" min={.5} max={2} step={.05} value={zoom} onChange={e=>setZoom(+e.target.value)}/></label><label><input type="checkbox" checked={context} onChange={e=>setContext(e.target.checked)}/> İlişkili kas ve kemikleri göster</label><Button variant="outline" onClick={()=>{setYaw(0);setPitch(0);setZoom(1);}}>Kamerayı sıfırla</Button></div></Disclosure>
   </>}
   {kind==='muscles'&&<MuscleComparisonInfo left={left} right={right}/>}
   <Disclosure title="Kaynaklar ve gösterimin sınırları"><p>Bu görünüm 3D kaynak yüzeylerinin izdüşümüdür. Kaynaklarda bulunmayan dokular ve bireysel varyasyonlar bu görünümden çıkarılamaz. Anatomik sağ/sol, ekrandaki sağ/sol ile aynı anlamda değildir.</p><p>BodyParts3D · CC BY 4.0; Z-Anatomy ve Open3DModel · CC BY-SA 4.0. Renkler eğitim için eklenmiştir. <a href="/ATTRIBUTION.md" target="_blank" rel="noreferrer">Kaynaklar ve değişiklikler ↗</a></p></Disclosure>
  </>}
 </section>;
}
