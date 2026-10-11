"""Import Open3DModel's own tendon surfaces; never generate a bridging tube.
Requires numpy/scipy/DracoPy. Downloads are supplied as an extracted GLB folder.
UV v=0.12/0.88 follows the source texture's tendon/muscle transition: this is
an educational tissue-colour boundary, not histological segmentation. Source
triangles are clipped at that boundary. Only the humeral/proximal component is
retained. Uniform bone-envelope registration and bilateral mirroring are logged.
"""
import json,struct,hashlib,gzip,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
import DracoPy
root=Path(__file__).resolve().parents[1];out=root/'public/models';atlas=json.loads((out/'atlas.json').read_text());source=Path(sys.argv[1]);decoded={};digests={}
assert not any(p['id'].startswith('O3D-tendon-') for p in atlas['parts'])
for region in ['upper-limb','lower-limb']:
 b=(source/region/(region+'.glb')).read_bytes();digests[region]=hashlib.sha256(b).hexdigest();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);buf=b[28+n:];items={}
 for node in d['nodes']:
  name=node.get('name','')
  if not any(t in name.lower() for t in ['supraspinatus muscle','subscapularis muscle','teres minor muscle','extensor carpi radialis brevis.r','extensor digitorum.r','extensor digiti minimi.r','humeral head of extensor carpi ulnaris.r','quadriceps common tendon and patellar ligament.r','humerus.r','scapula.r.','radius.r','ulna.r','femur.r','tibia.r','patella.r']):continue
  p=d['meshes'][node['mesh']]['primitives'][0];view=d['bufferViews'][p['extensions']['KHR_draco_mesh_compression']['bufferView']];m=DracoPy.decode(buf[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]);assert not any(k in node for k in ['matrix','translation','rotation','scale']);items[name]=(m.points,m.faces,m.tex_coord)
 decoded[region]=items

def base(name):
 p=next(p for p in atlas['parts'] if p['name'].lower()==name);b=(root/'public'/atlas['chunks'][p['chunk']]['url'].lstrip('/')).read_bytes();return np.frombuffer(b,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3).copy()
def clipped(v,f,values,cut,above):
 points=[];faces=[];lookup={};boundary=[]
 def add(p):
  k=tuple(np.round(p,8))
  if k not in lookup:lookup[k]=len(points);points.append(p)
  return lookup[k]
 for face in f:
  poly=[(v[i],values[i]) for i in face];q=[]
  for (a,x),(b,y) in zip(poly,poly[1:]+poly[:1]):
   ai=x>=cut if above else x<=cut;bi=y>=cut if above else y<=cut
   if ai:q.append(a)
   if ai!=bi:
    edge=a+(b-a)*((cut-x)/(y-x));q.append(edge);boundary.append(edge)
  for i in range(1,len(q)-1):
   t=[add(q[0]),add(q[i]),add(q[i+1])]
   if len(set(t))==3:faces.append(t)
 clipped.boundary=np.array(boundary);return np.array(points),np.array(faces,dtype=np.uint32)
def compact(v,f):
 used,inv=np.unique(f,return_inverse=True);return v[used],inv.reshape(-1,3).astype(np.uint32)
def components(v,f):
 parents=list(range(len(v)))
 def find(i):
  while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
  return i
 for x,y,z in f:parents[find(y)]=find(x);parents[find(z)]=find(x)
 groups={}
 for t in f:groups.setdefault(find(t[0]),[]).append(t)
 return [compact(v,np.array(g,dtype=np.uint32)) for g in groups.values() if len(g)>5]
transforms={}
for side in ['right','left']:
 for region,names in [('shoulder',['Humerus.r','Scapula.r.']),('elbow',['Humerus.r','Radius.r','Ulna.r']),('knee',['Femur.r','Tibia.r','Patella.r'])]:
  a=[];b=[]
  for name in names:
   v=decoded['lower-limb' if region=='knee' else 'upper-limb'][name][0].copy()
   if side=='left':v[:,0]*=-1
   target=base(side+' '+name.split('.')[0].lower())
   if region=='elbow':
    if name.startswith('Humerus'):v=v[v[:,1]<v[:,1].min()+.25*np.ptp(v[:,1])];target=target[target[:,1]<target[:,1].min()+.25*np.ptp(target[:,1])]
    else:v=v[v[:,1]>v[:,1].max()-.25*np.ptp(v[:,1])];target=target[target[:,1]>target[:,1].max()-.25*np.ptp(target[:,1])]
   if region=='knee' and not name.startswith('Patella'):
    if name.startswith('Femur'):v=v[v[:,1]<v[:,1].min()+.25*np.ptp(v[:,1])];target=target[target[:,1]<target[:,1].min()+.25*np.ptp(target[:,1])]
    else:v=v[v[:,1]>v[:,1].max()-.25*np.ptp(v[:,1])];target=target[target[:,1]>target[:,1].max()-.25*np.ptp(target[:,1])]
   a.extend([v.min(0),v.max(0)]);b.extend([target.min(0),target.max(0)])
  a=np.array(a);b=np.array(b);ac=a.mean(0);bc=b.mean(0);scale=np.sum((a-ac)*(b-bc))/np.sum((a-ac)**2);shift=bc-scale*ac;transforms[side+'-'+region]={'scale':float(scale),'translation':shift.tolist(),'envelopeRmsMm':float(np.sqrt(np.mean(np.sum((a*scale+shift-b)**2,axis=1)))*1000)}
def registered(v,side,region):
 v=v.copy()
 if side=='left':v[:,0]*=-1
 tr=transforms[side+'-'+region];return v*tr['scale']+np.array(tr['translation'])
blob=bytearray();records=[];chunk=len(atlas['chunks'])
def append(side,key,name,v,f,objects,selection,region,extra=None):
 if side=='left':f=f[:,[0,2,1]]
 q=v[f];f=f[np.linalg.norm(np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]),axis=1)>1e-12];n=np.zeros_like(v);q=v[f];fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0])
 for i in range(3):np.add.at(n,f[:,i],fn)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
 def add(a,dtype):
  while len(blob)%4:blob.append(0)
  offset=len(blob);data=np.array(a,dtype=dtype).tobytes();blob.extend(data);return offset,hashlib.sha256(data).hexdigest()
 po,ph=add(v,'<f4');no,nh=add(np.rint(n*32767),'<i2');io,ih=add(f,'<u4');id='O3D-tendon-'+side+'-'+name.replace(' ','-');display=side.title()+' '+name
 part={'id':id,'name':display,'conceptId':id,'system':'connective','clinicalKey':key,'modelRole':'body','chunk':chunk,'positions':po,'normals':no,'indices':io,'vertexCount':len(v),'indexCount':int(f.size),'bounds':[v.min(0).tolist(),v.max(0).tolist()],'source':'Open3DModel / AnatomyTOOL','license':'CC-BY-SA-4.0'}
 if extra and 'muscleBoundaryIndices' in extra:part['tendonBoundary']=extra['muscleBoundaryIndices']
 atlas['parts'].append(part);atlas['concepts'].append({'id':id,'name':display,'elements':[id]});atlas['triangles']+=len(f)
 records.append({'id':id,'key':key,'region':region,'side':side,'sourceObjects':objects,'sourceSelection':selection,'vertices':len(v),'triangles':len(f),'positionsSHA256':ph,'normalsSHA256':nh,'indicesSHA256':ih,**(extra or {})});print(display,len(v),len(f),flush=True)
for side in ['right','left']:
 for muscle in ['supraspinatus','subscapularis','teres minor']:
  name=muscle.capitalize()+' muscle.r';v,f,uv=decoded['upper-limb'][name];candidates=[]
  for cut,above in [(.12,False),(.88,True)]:
   p,t=clipped(v,f,uv[:,1],cut,above);boundaryTree=cKDTree(clipped.boundary)
   candidates.extend((cp,cf,np.where(boundaryTree.query(cp)[0]<1e-6)[0].tolist()) for cp,cf in components(p,t))
  footprint=base(side+' '+muscle+' tendon insertion surface');tree=cKDTree(footprint)
  p,t,boundary=min(candidates,key=lambda pt:tree.query(registered(pt[0],side,'shoulder'))[0].min());p=registered(p,side,'shoulder')
  # Whole source-region translation seats its closest insertion patch on the
  # existing reference footprint, with no per-vertex sculpting or bridge.
  distances,nearest=tree.query(p);cap=distances<=distances.min()+.003;shift=np.median(footprint[nearest[cap]]-p[cap],axis=0);p+=shift
  append(side,muscle+' tendon insertion surface',muscle+' tendon',p,t,[name],'Distal humeral connected component clipped at the source texture tendon/muscle boundary (UV v=0.12 or 0.88); uniform insertion alignment; no generated bridge','shoulder',{'muscleBoundaryIndices':boundary,'insertionAlignmentMm':(shift*1000).tolist(),'boundary':'Source colour boundary, approximate musculotendinous division'})
 # Each proximal region remains distinct in one selectable complex. No invented
 # fusion is added between the ECRB/EDC/EDM/ECU source surfaces.
 objects=['Extensor carpi radialis brevis.r','Extensor digitorum.r','Extensor digiti minimi.r','Humeral head of extensor carpi ulnaris.r'];vs=[];fs=[];offset=0;regions=[]
 for name in objects:
  v,f,uv=decoded['upper-limb'][name];candidates=[]
  for cut,above in [(.12,False),(.88,True)]:
   p,t=clipped(v,f,uv[:,1],cut,above);candidates.extend(components(p,t))
  p,t=max(candidates,key=lambda pt:pt[0][:,1].max());p=registered(p,side,'elbow');vs.append(p);fs.append(t+offset);offset+=len(p);regions.append({'object':name,'vertices':len(p),'triangles':len(t)})
 append(side,'common extensor tendon','common extensor tendon',np.concatenate(vs),np.concatenate(fs),objects,'Four source-texture-defined proximal extensor tendon regions, retaining separate source shapes; no invented common fibre mesh','elbow',{'components':regions,'boundary':'Source colour boundary, approximate musculotendinous division'})
 name='Quadriceps common tendon and patellar ligament.r';v,f,uv=decoded['lower-limb'][name];cut=decoded['lower-limb']['Patella.r'][0][:,1].max();p,t=clipped(v,f,v[:,1],cut,True);p=registered(p,side,'knee');append(side,'quadriceps tendon','quadriceps tendon',p,t,[name],'Source common quadriceps tendon proximal to the source superior patellar pole; four contributing muscle regions are connected by the source common envelope; does not segment microscopic tendon layers','knee',{'sourceCutY':float(cut)})
url='/models/open3d-tendons.bin';(root/'public'/url.lstrip('/')).write_bytes(blob);gz=gzip.compress(blob,compresslevel=9,mtime=0);(root/'public'/(url+'.gz').lstrip('/')).write_bytes(gz);atlas['chunks'].append({'url':url,'bytes':len(blob),'gzip':url+'.gz','gzipBytes':len(gz)})
atlas['scope']+=' Open3DModel reference common quadriceps body and source texture-defined supraspinatus/subscapularis/teres minor and proximal extensor regions; colour boundaries are approximate tissue divisions.'
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
report={'source':'https://anatomytool.org/open3dmodel-create','about':'https://anatomytool.org/open3dmodel-about','credits':'https://anatomytool.org/open3dmodel-credit','license':'CC-BY-SA-4.0','authors':['Open3DModel project / LUMC','Eungyeol Lee (medical artist)','Jan Kooloos (upper/lower limb anatomy)','Denise Arnold / Marco DeRuiter (upper limb anatomy)','Z-Anatomy / BodyParts3D (predecessor models)'],'sourceFiles':[{ 'url':f'https://caskanatomy.info/open3dmodelfiles/{r}/{r}-glb.zip','glbSHA256':digests[r]} for r in ['upper-limb','lower-limb']],'registration':transforms,'parts':records,'limitations':'Reference anatomy. Source texture boundaries are approximate educational musculotendinous divisions, not histological segmentation. Extensor components retain distinct source shapes; full microscopic common fibre architecture is not reconstructed. Quadriceps common envelope does not resolve all layers. Left side is mirrored source registered independently. No strain, tear or healing simulation.'}
(out/'open3d-tendon-source.json').write_text(json.dumps(report,indent=2));print('Imported',len(records),'source parts, compressed bytes',len(gz))
