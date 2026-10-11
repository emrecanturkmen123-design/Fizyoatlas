import {connectionTraceRole,connectionTraceBones} from './connection-trace';
import {createKneeTendonRig,updateKneeTendonRig,disposeKneeTendonRig,patellaMatrix,type KneeTendonRig} from './knee-tendon';
import {requiredChunks} from './model-demand';
import {createGaitRig,updateGaitRig,disposeGaitRig,type GaitRig} from './gait-rig';
import {tendonContextParts} from './tendon-context';
import {createAtlasRenderer,watchAtlasContext} from './webgl-startup';
import {modelViewport,viewportUsable} from './model-viewport';
import {frameModelBounds} from './model-framing';
import {spineRegion,SPINE_REGIONS} from './spine';
import {limbConfig,createLimbRig,updateLimbRig,disposeLimbRig,type LimbRig} from './limb-muscles';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig,type ShoulderRig} from './shoulder-muscles';
import {anatomicalMode,createMuscleRig,updateMuscleRig,disposeMuscleRig,type MuscleRig} from './anatomical-muscles';
import {lowerMatrices,lowerSegment,lowerRoles} from './lower-motion';
import {jointFrame,planeOverlay} from './joint-overlay';
import {kneeMatrices,kneeSegment,kneeRoles} from './knee-motion';
import {muscleDemo,disposeMuscleDemo} from './muscle-demo';
import {elbowMatrices,elbowSegment} from './elbow-motion';
import {attachmentOverlay,disposeAttachments} from './attachment-overlay';
import {SHOULDER_MOVES,shoulderRoles} from './shoulder';
import {armSegment,motionSegment,poseMatrices} from './shoulder-motion';
import {shoulderOverlay,disposeOverlay} from './shoulder-overlay';
import {configureNavigation} from './navigation';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createExplosionLayout} from './explosion-layout';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,type Atlas,type SceneState} from './anatomy';
import {selectionPalette} from './selection-palette';
import {writeSelectionPalette,applySelectionPalette} from './selection-color-shader';
interface Props {embedded?:boolean;compatibility?:boolean;atlas:Atlas;state:SceneState;onSelect:(id:string,focus?:boolean)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void}
export default function AnatomyScene({atlas,state,onSelect,onProgress,onError,compatibility=false,embedded=false}:Props){
 const [generation,setGeneration]=useState(0);
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect);
 latest.current=state;select.current=onSelect;
 useEffect(()=>{
  const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',layoutKey='',amount=0;
  let kneeTendon:KneeTendonRig|undefined,kneeTendonKey='';
  let gaitRig:GaitRig|undefined,gaitRigRevision=-1;
  let overlay:T.Group|undefined,overlayKey='';let muscleGroup:T.Group|undefined,muscleKey='';
  let limbRig:LimbRig|undefined,limbRigKey='';let shoulderRig:ShoulderRig|undefined,shoulderRigKey='';let anatomicalRig:MuscleRig|undefined;let anatomicalRigKey='';let geometryRevision=0;
  let attachmentGroup:T.Group|undefined,attachmentKey='';const attachmentGeometry=new Map<string,T.BufferGeometry>();
  const armMeshes=new Map<number,T.Mesh>();let poseKey='';
  let lastState:SceneState|null=null;let lastFocus=0;
  const contextOpacity={value:1},contextActive={value:0};
  const abort=new AbortController();
  let startup:ReturnType<typeof createAtlasRenderer>;
  try{startup=createAtlasRenderer(compatibility||generation>0);}catch(e){onError(e instanceof Error?e.message:'3D görüntüleyici başlatılamadı.');return;}
  const renderer=startup.renderer;let contextBlocked=false;
  const recovery=watchAtlasContext(renderer.domElement,()=>{contextBlocked=true;onError('3D grafik bağlantısı kesildi. Tarayıcı bağlantıyı geri getirirse model otomatik yeniden açılacak. Uyumlu modla da yeniden deneyebilirsin.');},()=>{if(disposed)return;if(generation>=2){onError('Grafik bağlantısı tekrar kesildi. Diğer 3D sekmeleri kapatıp uyumlu modla yeniden deneyebilirsin.');return;}onProgress(0);onError('');setGeneration(v=>v+1);});
  renderer.setPixelRatio(startup.compatibility?1:Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#f2f3f3');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;el.appendChild(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D anatomi. Tek parmak döndürür; iki parmak yakınlaştırır ve kaydırır. Klavye: oklar döndürür, artı ve eksi yakınlaştırır, Home görünümü sıfırlar.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100),controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);controls.target.set(0,.85,0);configureNavigation(controls);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=.07;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.96;controls.addEventListener('change',()=>{dirty=true;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0xa7acb2,1.05));
  const key=new T.DirectionalLight(0xfffaf4,2.3);key.position.set(-2,4,3);scene.add(key);
  const rim=new T.DirectionalLight(0xe9f0ff,1.8);rim.position.set(2,2,-3);scene.add(rim);
  const ground=new T.Mesh(new T.CircleGeometry(30,96),new T.MeshStandardMaterial({color:0xd5d9dc,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.019;scene.add(ground);
  const platform=new T.Mesh(new T.CylinderGeometry(.68,.7,.028,100),new T.MeshStandardMaterial({color:0xeeeeec,metalness:.12,roughness:.67}));platform.position.y=-.016;scene.add(platform);
  const ring=new T.Mesh(new T.RingGeometry(.63,.632,128),new T.MeshBasicMaterial({color:0x8c969f,transparent:true,opacity:.4,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
  const innerRing=new T.Mesh(new T.RingGeometry(.55,.551,128),new T.MeshBasicMaterial({color:0xa4aeb8,transparent:true,opacity:.16,side:T.DoubleSide}));innerRing.rotation.x=-Math.PI/2;innerRing.position.y=.001;scene.add(innerRing);
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selectedData=new Uint8Array(width*4),selectionTexture=new T.DataTexture(selectedData,width,1);selectionTexture.needsUpdate=true;
  const selectionColors=new Float32Array(width*4),selectionColorTexture=new T.DataTexture(selectionColors,width,1,T.RGBAFormat,T.FloatType);selectionColorTexture.needsUpdate=true;
  const contextMeshes:T.Mesh[]=[];
  const batches:{mesh:T.Mesh;ghost:T.Mesh;indices:number[]}[]=[];
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const offsets:T.Vector3[]=[],bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  let packingWidth=1,packingHeight=1;
  const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
  const markerMaterial=new T.PointsMaterial({color:0x64748b,size:5,sizeAttenuation:false,transparent:true,opacity:.72,depthTest:false});
  markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.renderOrder=10;markers.visible=false;scene.add(markers);
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  type Target={index:number;x:number;y:number;left:number;right:number;top:number;bottom:number};let targets:Target[]=[];
  const projected=new T.Vector3();
  const findTarget=(x:number,y:number,radius:number)=>{
   let best=-1,score=Infinity;
   for(const t of targets){const dx=Math.max(t.left-x,0,x-t.right),dy=Math.max(t.top-y,0,y-t.bottom),distance=Math.hypot(dx,dy);if(distance>radius)continue;const candidate=distance+Math.hypot(t.x-x,t.y-y)*.025;if(candidate<score){score=candidate;best=t.index;}}
   return best;
  };
  const materialFor=(system:string,ghost=false)=>{
   const m=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:.08,roughness:.53,side:T.DoubleSide,transparent:ghost||system==='integumentary',opacity:system==='integumentary'?.1:1,depthWrite:!ghost&&system!=='integumentary'});
   m.customProgramCacheKey=()=>ghost?'atlas-ghost':'atlas-solid';
   m.onBeforeCompile=shader=>{
    shader.uniforms.contextOpacity=contextOpacity;shader.uniforms.contextActive=contextActive;
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying float partAntagonist; varying float partFocused; varying float partRegion;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r; partAntagonist = texture2D(selectionState, stateUv).g; partFocused = texture2D(selectionState, stateUv).b; partRegion = texture2D(selectionState, stateUv).a * 255.0;');
    shader.fragmentShader='uniform float contextOpacity; uniform float contextActive; varying float partVisible; varying float partSelected; varying float partAntagonist; varying float partFocused; varying float partRegion;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;'+(ghost?'\nif (contextActive < 0.5 || max(partSelected, partFocused) > 0.5) discard;':'\nif (contextActive > 0.5 && max(partSelected, partFocused) < 0.5) discard;'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.12, 0.65, 0.82), vec3(0.95, 0.38, 0.12), partAntagonist), partSelected * 0.85);\nif (abs(partRegion - 1.0) < 0.1) diffuseColor.rgb = vec3(0.08866,0.49102,1.00000);\nif (abs(partRegion - 2.0) < 0.1) diffuseColor.rgb = vec3(0.45079,0.29614,1.00000);\nif (abs(partRegion - 3.0) < 0.1) diffuseColor.rgb = vec3(0.12214,0.68669,0.35640);\nif (abs(partRegion - 4.0) < 0.1) diffuseColor.rgb = vec3(1.00000,0.54572,0.10702);\nif (abs(partRegion - 11.0) < 0.1) diffuseColor.rgb = vec3(0.72,0.19,0.12);\nif (abs(partRegion - 12.0) < 0.1) diffuseColor.rgb = vec3(0.02,0.55,0.48);\nif (abs(partRegion - 13.0) < 0.1) diffuseColor.rgb = vec3(0.9,0.60,0.15);\nif (abs(partRegion - 5.0) < 0.1) diffuseColor.rgb = vec3(1.00000,0.19807,0.28315);'+(ghost?'\ndiffuseColor.a *= contextOpacity;':''));
    applySelectionPalette(shader,selectionColorTexture);
   };materials.push(m);return m;
  };
  const mats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id)])),ghostMats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id,true)]));
  const armMaterial=new T.MeshStandardMaterial({color:0xe5c990,roughness:.55,side:T.DoubleSide});materials.push(armMaterial);
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    // GPU normalized signed-short normals keep the complete atlas compact in memory.
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
    g.boundingBox=bounds[i].clone();g.computeBoundingSphere();const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);attachmentGeometry.set(p.id,g);attachmentKey='';
    if(lowerSegment(p,{joint:'hip',side:'left'})||lowerSegment(p,{joint:'hip',side:'right'})||kneeSegment(p,{side:'left'})||kneeSegment(p,{side:'right'})||armSegment(p,'left')||armSegment(p,'right')||p.system==='skeletal'&&/^(left|right) (scapula|patella)$/i.test(p.name)){const arm=new T.Mesh(g,armMaterial);arm.matrixAutoUpdate=false;arm.visible=false;scene.add(arm);armMeshes.set(i,arm);poseKey='';}
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const list=groups.get(p.system)??[];list.push(g);groups.set(p.system,list);
   });
   groups.forEach((gs,system)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mats.get(system as never));mesh.frustumCulled=false;scene.add(mesh);const ghostMesh=new T.Mesh(geometry,ghostMats.get(system as never));ghostMesh.frustumCulled=false;ghostMesh.renderOrder=5;ghostMesh.visible=contextActive.value>0;contextMeshes.push(ghostMesh);scene.add(ghostMesh);batches.push({mesh,ghost:ghostMesh,indices:atlas.parts.flatMap((p,i)=>p.chunk===ci&&p.system===system?[i]:[])});});
   geometryRevision++;lastState=null;loaded++;dirty=true;
  };
  const loadedChunks=new Set<number>(),loadingChunks=new Set<number>(),failedChunks=new Set<number>();let wantedChunks:number[]=[],demandKey='';
  const scheduleLoads=()=>{
   if(disposed)return;
   wantedChunks=requiredChunks(atlas,latest.current);ready=wantedChunks.every(i=>loadedChunks.has(i));
   const bytes=wantedChunks.reduce((n,i)=>n+atlas.chunks[i].bytes,0),complete=wantedChunks.filter(i=>loadedChunks.has(i)).reduce((n,i)=>n+atlas.chunks[i].bytes,0);
   if(!contextBlocked)onProgress(bytes?Math.round(complete/bytes*100):100);
   while(loadingChunks.size<3){const i=wantedChunks.find(i=>!loadedChunks.has(i)&&!loadingChunks.has(i)&&!failedChunks.has(i));if(i===undefined)break;
    loadingChunks.add(i);void loadChunk(i).then(()=>{loadedChunks.add(i);}).catch(e=>{if(!disposed&&e.name!=='AbortError'){failedChunks.add(i);onError('Bu bölgenin 3D verisi yüklenemedi. Bağlantını kontrol edip uyumlu modla yeniden deneyebilirsin. Kartlar ve çalışmalar kullanılabilir.');}}).finally(()=>{loadingChunks.delete(i);scheduleLoads();});
   }
   dirty=true;
  };
  scheduleLoads();
  const availableViewport=()=>embedded?{left:16,right:el.clientWidth-16,top:16,bottom:el.clientHeight-16}:modelViewport(el.clientWidth,el.clientHeight,Array.from(document.querySelectorAll('.study-panel,.learning-panel,.shoulder-panel,.search-panel,.detail-sheet')).filter(p=>p.getClientRects().length>0).map(p=>p.getBoundingClientRect()),Math.max(0,...Array.from(document.querySelectorAll('.top-actions,.model-toolbar')).filter(p=>p.getClientRects().length>0).map(p=>p.getBoundingClientRect()).filter(p=>p.top<el.clientHeight*.4).map(p=>p.bottom)));
  const fit=(view:string,extent=0)=>{
   if(!viewportUsable(availableViewport()))return;
   if(latest.current.gait&&extent<.01){const w=el.clientWidth,h=el.clientHeight,{left,right,top,bottom}=availableViewport(),aw=right-left,ah=bottom-top;camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(1.65*w/aw/camera.aspect,1.95*h/ah)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));controls.target.set(0,.8,.4);const direction=view==='side'?new T.Vector3(-1,.03,0):view==='back'?new T.Vector3(0,.03,-1):view==='front'?new T.Vector3(0,.03,1):new T.Vector3(.5,.08,1).normalize();camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;return;}
   if((latest.current.lower||latest.current.shoulder||latest.current.elbow||latest.current.knee)&&extent<.01){const w=el.clientWidth,h=el.clientHeight,{left,right,top,bottom}=availableViewport();const aw=right-left,ah=bottom-top;camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(((latest.current.knee||latest.current.lower)?1.0:1.4)*w/aw/camera.aspect,((latest.current.knee||latest.current.lower)?1.2:.95)*h/ah)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));controls.target.set(0,latest.current.lower?.joint==='ankle'?.22:latest.current.knee||latest.current.lower?.joint==='hip'?.6:1.2,(latest.current.knee||latest.current.lower)?-.12:0);const direction=view==='side'?new T.Vector3((latest.current.knee||latest.current.lower)?.side==='right'?-1:1,0,0):view==='back'?new T.Vector3(0,0,-1):view==='front'?new T.Vector3(0,0,1):new T.Vector3(.5,.12,1).normalize();camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;return;}

   const w=el.clientWidth,h=el.clientHeight,mobile=w<768,{left,right,top,bottom}=availableViewport(),aw=right-left,ah=bottom-top;
   camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);
   const normalDistance=Math.max(1.95*h/ah,.9*w/aw/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
   const atlasDistance=Math.max(packingHeight*h/ah,packingWidth*w/aw/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.08;
   const distance=T.MathUtils.lerp(normalDistance,Math.max(.2,atlasDistance),extent);if(extent>.8)view='front';
   const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
   controls.target.set(0,.85,0);camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;
  };
  const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;layoutKey='';lastState=null;if((latest.current.focus??0)>0||latest.current.isolate)lastFocus=-1;renderer.setPixelRatio(startup.compatibility?1:Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);fit(latest.current.view,amount);};const observer=new ResizeObserver(resize);observer.observe(el);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  const down=(e:PointerEvent)=>{hover.hidden=true;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);};
  const move=(e:PointerEvent)=>{tap.move(e.pointerId,e.clientX,e.clientY);if(latest.current.hideNames||e.buttons||amount<.5||e.pointerType==='touch'){hover.hidden=true;return;}const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,index=findTarget(x,y,12);hover.hidden=index<0;renderer.domElement.style.cursor=index<0?'grab':'pointer';if(index>=0){hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;}};
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  let lastTap={id:'',time:0,x:0,y:0};
  const up=(e:PointerEvent)=>{
   const validTap=tap.up(e.pointerId,e.clientX,e.clientY);if(e.button!==0||!validTap||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   if(latest.current.gait){if(gaitRig){const hit=raycaster.intersectObjects(gaitRig.muscles.filter(m=>m.mesh.visible).map(m=>m.mesh),false)[0];if(hit)select.current(hit.object.userData.partId);}return;}
   if(latest.current.shoulder?.motion||latest.current.elbow?.motion||(latest.current.knee||latest.current.lower)?.motion){const group=anatomicalRig?.group.visible?anatomicalRig.group:shoulderRig?.group.visible?shoulderRig.group:limbRig?.group.visible?limbRig.group:undefined;if(kneeTendon?.mesh.visible&&latest.current.knee?.tendons){const hit=raycaster.intersectObject(kneeTendon.mesh,false)[0];if(hit){select.current(hit.object.userData.partId);return;}}if(group){const hit=raycaster.intersectObjects(group.children,false).find(h=>h.object.userData.partId);if(hit)select.current(hit.object.userData.partId);}return;}
   let nearest=Infinity,found=-1,nearestSelected=Infinity,selectedFound=-1;const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);
   pickers.forEach((mesh,i)=>{if(!mesh||(latest.current.spine&&!spineRegion(atlas.parts[i]))||data[i*4+3]<.5||(hasSolid&&atlas.parts[i].system==='integumentary'))return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);if(hits[0]&&hits[0].distance<nearest){nearest=hits[0].distance;found=i;}if(!latest.current.spine&&contextActive.value>0&&(selectedData[i*4]>0||selectedData[i*4+2]>0)&&hits[0]&&hits[0].distance<nearestSelected){nearestSelected=hits[0].distance;selectedFound=i;}});
   if(selectedFound>=0)found=selectedFound;if(found<0&&amount>.45)found=findTarget(e.clientX-rect.left,e.clientY-rect.top,e.pointerType==='touch'?24:16);if(found>=0){hover.hidden=true;const now=performance.now(),id=atlas.parts[found].id;const twice=lastTap.id===id&&now-lastTap.time<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<16;lastTap={id,time:twice?0:now,x:e.clientX,y:e.clientY};select.current(id,twice);}
  };
  const keyboard=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){fit(latest.current.view,amount);}else{const offset=camera.position.clone().sub(controls.target);if(['+','=','-'].includes(e.key))offset.multiplyScalar(e.key==='-'?1.12:1/1.12);else{const sphere=new T.Spherical().setFromVector3(offset);sphere.theta+=(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0);sphere.phi=T.MathUtils.clamp(sphere.phi+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0),.05,Math.PI-.05);offset.setFromSpherical(sphere);}offset.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset);}controls.update();dirty=true;};renderer.domElement.addEventListener('keydown',keyboard);
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  const clock=new T.Clock();let lastExtent=-1;
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);if(contextBlocked||document.hidden)return;const dt=Math.min(clock.getDelta(),.05),s=latest.current;
   const nextDemandKey=JSON.stringify([s.visible,s.selected,s.hidden,s.isolate,s.spine,s.gait&&[s.gait.muscles],s.shoulder&&[s.shoulder.side,s.shoulder.id,s.shoulder.motion,s.shoulder.anatomicalMuscles,s.shoulder.antagonists,s.shoulder.cuff,s.shoulder.tendons],s.elbow&&[s.elbow.side,s.elbow.id,s.elbow.motion,s.elbow.anatomicalMuscles,s.elbow.tendons],s.lower&&[s.lower.joint,s.lower.id,s.lower.side,s.lower.motion,s.lower.anatomicalMuscles,s.lower.antagonists,s.lower.achilles],s.knee&&[s.knee.side,s.knee.id,s.knee.motion,s.knee.anatomicalMuscles,s.knee.antagonists,s.knee.tendons]]);
   if(nextDemandKey!==demandKey){demandKey=nextDemandKey;scheduleLoads();}
   const tendonKey=s.knee?.motion&&s.knee.tendons?s.knee.side+':'+geometryRevision:'';
   if(tendonKey!==kneeTendonKey){if(kneeTendon)disposeKneeTendonRig(kneeTendon);kneeTendon=tendonKey?createKneeTendonRig(atlas,attachmentGeometry,s.knee!):undefined;if(kneeTendon)scene.add(kneeTendon.mesh);kneeTendonKey=tendonKey;}
   if(kneeTendon&&s.knee){const before=kneeTendon.key;updateKneeTendonRig(kneeTendon,s.knee);if(before!==kneeTendon.key)dirty=true;}
   if(s.gait&&ready&&gaitRigRevision!==geometryRevision){if(gaitRig)disposeGaitRig(gaitRig);gaitRig=createGaitRig(atlas,attachmentGeometry);scene.add(gaitRig.group);gaitRigRevision=geometryRevision;}
   if(gaitRig){gaitRig.group.visible=!!s.gait;if(s.gait){const before=gaitRig.key;updateGaitRig(gaitRig,s.gait);if(before!==gaitRig.key)dirty=true;}}
   const nextOverlayKey=JSON.stringify(s.shoulder?{id:s.shoulder.id,side:s.shoulder.side,plane:s.shoulder.plane}:s.knee?{joint:'knee',id:s.knee.id,side:s.knee.side,plane:s.knee.plane}:s.elbow?{joint:'elbow',id:s.elbow.id,side:s.elbow.side,plane:s.elbow.plane}:s.lower?{joint:s.lower.joint,id:s.lower.id,side:s.lower.side,plane:s.lower.plane}:null);if(nextOverlayKey!==overlayKey){if(overlay)disposeOverlay(overlay);overlay=s.shoulder?shoulderOverlay(s.shoulder):planeOverlay(jointFrame(atlas,s));if(overlay)scene.add(overlay);overlayKey=nextOverlayKey;dirty=true;}if(overlay){const visible=s.explode<.01&&!s.isolate;if(overlay.visible!==visible){overlay.visible=visible;dirty=true;}}
   const nextAttachmentKey=JSON.stringify(s.attachments??null);if(nextAttachmentKey!==attachmentKey){if(attachmentGroup)disposeAttachments(attachmentGroup);attachmentGroup=s.attachments?attachmentOverlay(atlas,s.attachments,attachmentGeometry):undefined;if(attachmentGroup)scene.add(attachmentGroup);attachmentKey=nextAttachmentKey;dirty=true;}if(attachmentGroup){const show=s.explode<.01&&!s.isolate;if(attachmentGroup.visible!==show){attachmentGroup.visible=show;dirty=true;}}
   const nextMuscleKey=JSON.stringify(s.elbow?.motion&&s.elbow.muscleDemo&&!anatomicalMode(s.elbow)?s.elbow:null);if(nextMuscleKey!==muscleKey){if(muscleGroup)disposeMuscleDemo(muscleGroup);muscleGroup=s.elbow&&!anatomicalMode(s.elbow)?muscleDemo(atlas,s.elbow):undefined;if(muscleGroup)scene.add(muscleGroup);muscleKey=nextMuscleKey;dirty=true;}
   const config=limbConfig(s),nextLimbKey=config?JSON.stringify([config,(s.lower??s.knee??s.elbow)?.id,(s.lower??s.knee)?.antagonists,s.lower?.achilles,s.knee?.tendons,s.elbow?.tendons,geometryRevision]):'';
   if(nextLimbKey!==limbRigKey){if(limbRig)disposeLimbRig(limbRig);limbRig=config?createLimbRig(atlas,attachmentGeometry,s):undefined;if(limbRig)scene.add(limbRig.group);limbRigKey=nextLimbKey;dirty=true;}
   if(limbRig){const before=limbRig.key;updateLimbRig(limbRig,s);limbRig.group.visible=s.explode<.01&&!s.isolate;if(before!==limbRig.key)dirty=true;}
   const nextShoulderRigKey=s.shoulder?.motion&&s.shoulder.anatomicalMuscles?JSON.stringify([s.shoulder.side,s.shoulder.id,s.shoulder.antagonists,s.shoulder.cuff,s.shoulder.tendons,geometryRevision]):'';
   if(nextShoulderRigKey!==shoulderRigKey){if(shoulderRig)disposeShoulderRig(shoulderRig);shoulderRig=nextShoulderRigKey?createShoulderRig(atlas,attachmentGeometry,s.shoulder!):undefined;if(shoulderRig)scene.add(shoulderRig.group);shoulderRigKey=nextShoulderRigKey;dirty=true;}
   if(shoulderRig&&s.shoulder){const before=shoulderRig.key;updateShoulderRig(shoulderRig,s.shoulder);shoulderRig.group.visible=s.explode<.01&&!s.isolate;if(before!==shoulderRig.key)dirty=true;}
   const showAnatomical=anatomicalMode(s.elbow),nextRigKey=showAnatomical?s.elbow!.side+':'+!!s.elbow!.tendons+':'+geometryRevision:'';
   if(nextRigKey!==anatomicalRigKey){if(anatomicalRig)disposeMuscleRig(anatomicalRig);anatomicalRig=showAnatomical?createMuscleRig(atlas,attachmentGeometry,s.elbow!.side,!!s.elbow!.tendons):undefined;if(anatomicalRig)scene.add(anatomicalRig.group);anatomicalRigKey=nextRigKey;dirty=true;}
   if(anatomicalRig&&s.elbow){const before=anatomicalRig.angle,markersBefore=anatomicalRig.markersVisible;updateMuscleRig(anatomicalRig,s.elbow);anatomicalRig.group.visible=s.explode<.01&&!s.isolate;if(before!==anatomicalRig.angle||markersBefore!==anatomicalRig.markersVisible)dirty=true;}
   const motion=!!s.gait||!!s.lower?.motion||!!s.shoulder?.motion||!!s.elbow?.motion||!!s.knee?.motion;const segmentFor=(p:typeof atlas.parts[number])=>s.knee?.motion&&s.knee.tendons&&p.name.toLowerCase()===s.knee.side+' patella'?4:s.lower?.motion?lowerSegment(p,s.lower):s.knee?.motion?kneeSegment(p,s.knee):s.elbow?.motion?elbowSegment(p,s.elbow):s.shoulder?.motion?motionSegment(p,s.shoulder):0;
   const changed=!!lastState?.gait!==!!s.gait||lastState?.trace!==s.trace||lastState?.hideNames!==s.hideNames||lastState?.spine!==s.spine||lastState?.highlightedSystem!==s.highlightedSystem||lastState?.lower?.joint!==s.lower?.joint||lastState?.lower?.id!==s.lower?.id||lastState?.lower?.side!==s.lower?.side||lastState?.lower?.motion!==s.lower?.motion||lastState?.lower?.antagonists!==s.lower?.antagonists||lastState?.knee?.id!==s.knee?.id||lastState?.knee?.side!==s.knee?.side||lastState?.knee?.motion!==s.knee?.motion||lastState?.knee?.tendons!==s.knee?.tendons||lastState?.knee?.antagonists!==s.knee?.antagonists||lastState?.elbow?.motion!==s.elbow?.motion||lastState?.elbow?.id!==s.elbow?.id||lastState?.elbow?.side!==s.elbow?.side||lastState?.shoulder?.scapula!==s.shoulder?.scapula||lastState?.shoulder?.id!==s.shoulder?.id||lastState?.shoulder?.motion!==s.shoulder?.motion||lastState?.shoulder?.side!==s.shoulder?.side||lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate||lastState?.hidden!==s.hidden||lastState?.contextOpacity!==s.contextOpacity;
   const moving=Math.abs(amount-s.explode)>.0001;
   if(moving){amount=window.matchMedia('(prefers-reduced-motion: reduce)').matches?s.explode:T.MathUtils.damp(amount,s.explode,8,dt);dirty=true;}
   if(changed||moving||lastExtent<0){
    const roleIds=s.lower?.antagonists?new Set(lowerRoles(atlas,s.lower).antagonists):s.knee?.antagonists?new Set(kneeRoles(atlas,s.knee).antagonists):s.shoulder&&s.shoulder.antagonists!==false?new Set(shoulderRoles(atlas,SHOULDER_MOVES.find(m=>m.id===s.shoulder!.id)!,s.shoulder.side).antagonists):new Set<string>();
    const visible=new Set(s.visible),selection=new Set(s.selected),hidden=new Set(s.hidden??[]),tendonContext=new Set(tendonContextParts(atlas,s.selected));
    writeSelectionPalette(selectionColors,atlas,selectionPalette(atlas,s));selectionColorTexture.needsUpdate=true;
    const layerFocus=!motion&&s.highlightedSystem&&s.visible.includes(s.highlightedSystem);contextOpacity.value=motion?1:layerFocus?.07:(s.contextOpacity??1);contextActive.value=(selection.size>0||layerFocus)&&!s.isolate&&contextOpacity.value<1?1:0;contextMeshes.forEach(m=>{m.visible=contextActive.value>0;});
    const traceBones=s.trace?connectionTraceBones(atlas,selection):new Set<string>(),traceActive=s.trace&&!motion&&traceBones.size>0;
    const visibleParts=atlas.parts.filter(p=>!hidden.has(p.id)&&(s.isolate?selection.has(p.id):visible.has(p.system)||selection.has(p.id)||tendonContext.has(p.id)));
    const nextLayoutKey=visibleParts.map(p=>p.id).join(',')+':'+camera.aspect.toFixed(3);
    if(nextLayoutKey!==layoutKey){const layout=createExplosionLayout(visibleParts,camera.aspect);packingWidth=layout.width;packingHeight=layout.height;atlas.parts.forEach((p,i)=>{const cell=layout.cells.get(p.id);offsets[i]=cell?new T.Vector3(cell.x,cell.y+.85,0):centers[i].clone();});layoutKey=nextLayoutKey;if(amount>.05&&!s.isolate)fit(s.view,Math.max(0,(amount-.3)/.7));}

    atlas.parts.forEach((p,i)=>{
     const c=centers[i],destination=offsets[i];let dx=0,dy=0,dz=0;
     if(amount<=.45){const t=amount/.45;const group=SYSTEMS.findIndex(sys=>sys.id===p.system);const angle=group/SYSTEMS.length*Math.PI*2;dx=Math.sin(angle)*t*.48;dy=(c.y-.85)*t*.28;dz=Math.cos(angle)*t*.48;}
     else {const t=(amount-.45)/.55,group=SYSTEMS.findIndex(sys=>sys.id===p.system),angle=group/SYSTEMS.length*Math.PI*2;dx=T.MathUtils.lerp(Math.sin(angle)*.48,destination.x-c.x,t);dy=T.MathUtils.lerp((c.y-.85)*.28,destination.y-c.y,t);dz=T.MathUtils.lerp(Math.cos(angle)*.48,-c.z,t);}
     const selected=!motion&&selection.has(p.id);data.set([dx,dy,dz,(motion?(!hidden.has(p.id)&&!s.gait&&p.system==='skeletal'&&!segmentFor(p)&&!(s.knee?.motion&&p.name.toLowerCase()===s.knee.side+' patella')):(!hidden.has(p.id)&&(s.isolate?selected:visible.has(p.system)||selected||tendonContext.has(p.id))))?1:0],i*4);selectedData[i*4]=selected?255:0;selectedData[i*4+1]=!motion&&roleIds.has(p.id)?255:0;selectedData[i*4+3]=s.spine?SPINE_REGIONS.findIndex(r=>r.id===spineRegion(p))+1:0;if(traceActive){const role=connectionTraceRole(p,selected,tendonContext.has(p.id),traceBones.has(p.id)&&!hidden.has(p.id));if(role){selectedData[i*4+3]=role;selectedData[i*4]=255;}}selectedData[i*4+2]=layerFocus&&p.system===s.highlightedSystem?255:0;
     markerPositions.set(data[i*4+3]>.5?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);const mesh=pickers[i];if(mesh){mesh.position.set(dx,dy,dz);mesh.updateMatrix();mesh.updateMatrixWorld(true);}
    });batches.forEach(b=>{const visible=b.indices.some(i=>data[i*4+3]>.5);b.mesh.visible=visible;b.ghost.visible=visible&&contextActive.value>0;});partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;markerGeometry.attributes.position.needsUpdate=true;lastState=s;lastExtent=amount;dirty=true;
   }
   const nextPoseKey=JSON.stringify(motion?(s.gait??s.lower??s.knee??s.elbow??s.shoulder):null);if(nextPoseKey!==poseKey||changed){const pose=motion&&!s.gait?(s.lower?lowerMatrices(atlas,s.lower):s.knee?kneeMatrices(atlas,s.knee):s.elbow?elbowMatrices(atlas,s.elbow):poseMatrices(atlas,s.shoulder!)):null;const hiddenMotion=new Set(s.hidden??[]);armMeshes.forEach((mesh,i)=>{const segment=motion?segmentFor(atlas.parts[i]):0;mesh.visible=!!segment&&!hiddenMotion.has(atlas.parts[i].id);if(pose&&segment){mesh.matrix.copy(segment===4?patellaMatrix(atlas,s.knee!):segment===1?pose.upper:segment===2?pose.lower:pose.scapula);mesh.updateMatrixWorld(true);}});poseKey=nextPoseKey;dirty=true;}
   if(s.view!==lastView||s.reset!==lastReset){fit(s.view,amount);if((s.focus??0)>0||s.isolate)lastFocus=-1;lastView=s.view;lastReset=s.reset;}
   if(moving&&!s.isolate)fit(amount>.5?'front':s.view,Math.max(0,(amount-.3)/.7));
   const isolateKey=s.isolate?s.selected.join(',')+':'+s.reset+':'+s.inspectorOpen+':'+camera.aspect:'';
   const focusRequested=(s.focus??0)!==lastFocus;
   if(isolateKey!==lastIsolate||(s.isolate&&moving)||(focusRequested&&!moving)){
    let focusApplied=true;
    if(s.isolate||focusRequested){const box=new T.Box3(),focusIds=new Set([...s.selected,...(s.isolate?[]:tendonContextParts(atlas,s.selected).filter(id=>!s.hidden?.includes(id)))]);atlas.parts.forEach((p,i)=>{if(focusIds.has(p.id))box.union(bounds[i].clone().translate(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])));});
     if(!box.isEmpty()){
      const direction=s.view==='back'?new T.Vector3(.2,.1,-1):s.view==='side'?new T.Vector3(1,.1,0):new T.Vector3(.2,.1,1);
      const framed=frameModelBounds(camera,box,availableViewport(),el.clientWidth,el.clientHeight,direction);
      focusApplied=!!framed;
      if(framed){controls.maxDistance=Math.max(40,framed.distance*2);controls.target.copy(framed.center);controls.update();dirty=true;}
     }
    }else if(lastIsolate){fit(s.view,amount);}
    // Keep a focus request pending while an expanded card covers the model.
    if(focusApplied){lastIsolate=isolateKey;lastFocus=s.focus??0;}
   }
   controls.enableRotate=amount<.8;controls.mouseButtons.LEFT=amount<.8?T.MOUSE.ROTATE:T.MOUSE.PAN;controls.touches.ONE=amount<.8?T.TOUCH.ROTATE:T.TOUCH.PAN;ground.visible=platform.visible=ring.visible=innerRing.visible=amount<.5&&!s.isolate&&!s.lower?.motion&&!s.gait;markers.visible=amount>.75;controls.autoRotate=s.rotate&&!s.isolate&&amount<.4&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotateSpeed=.65;controls.update();if(controls.autoRotate)dirty=true;
   if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);atlas.parts.forEach((p,i)=>{if(data[i*4+3]<.5||(hasSolid&&p.system==='integumentary'))return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;}

  };animate();
  return()=>{disposed=true;recovery.dispose();abort.abort();cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('keydown',keyboard);controls.dispose();if(kneeTendon)disposeKneeTendonRig(kneeTendon);if(gaitRig)disposeGaitRig(gaitRig);if(limbRig)disposeLimbRig(limbRig);if(shoulderRig)disposeShoulderRig(shoulderRig);if(anatomicalRig)disposeMuscleRig(anatomicalRig);if(muscleGroup)disposeMuscleDemo(muscleGroup);if(attachmentGroup)disposeAttachments(attachmentGroup);if(overlay)disposeOverlay(overlay);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();selectionColorTexture.dispose();markerGeometry.dispose();markerMaterial.dispose();hover.remove();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[atlas,generation,compatibility,embedded]);
 return <div className="scene" ref={host}/>;
}
