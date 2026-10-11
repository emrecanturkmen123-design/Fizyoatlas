"""Import source-labelled tendon regions and one origin footprint.
Input is export-tendon-completion-source.py output. No procedural tendon is made.
Existing arrays are never modified. Three cuff source objects have no tendon
material; their existing insertion footprints remain explicitly labelled.
"""
import json,hashlib,gzip,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
root=Path(__file__).resolve().parents[1];out=root/'public/models';atlas=json.loads((out/'atlas.json').read_text());meta=json.loads((out/'clinical-source.json').read_text());pat=json.loads((out/'patellar-source.json').read_text())
assert not any(p['id'].startswith('ZA-tendon-completion-') for p in atlas['parts'])
source={s:json.loads((Path(sys.argv[1])/(s+'.json')).read_text()) for s in ['r','l']}
base_scale=meta['baseRegistration']['scale'];base_shift=np.array(meta['baseRegistration']['translation']);transforms={}
def base(name):
 p=next(p for p in atlas['parts'] if p['name'].lower()==name);buf=(root/'public'/atlas['chunks'][p['chunk']]['url'].lstrip('/')).read_bytes();return np.frombuffer(buf,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3).copy()
def initial(v):return v*base_scale+base_shift
for short,side in [('r','right'),('l','left')]:
 a=[];b=[]
 for name in ['Humerus','Radius','Ulna']:
  v=initial(np.array(source[short][name+'.'+short]['p']));t=base(side+' '+name.lower())
  if name=='Humerus':v=v[v[:,1]<v[:,1].min()+.25*np.ptp(v[:,1])];t=t[t[:,1]<t[:,1].min()+.25*np.ptp(t[:,1])]
  else:v=v[v[:,1]>v[:,1].max()-.25*np.ptp(v[:,1])];t=t[t[:,1]>t[:,1].max()-.25*np.ptp(t[:,1])]
  a.extend([v.min(0),v.max(0)]);b.extend([t.min(0),t.max(0)])
 a=np.array(a);b=np.array(b);ac=a.mean(0);bc=b.mean(0);k=np.sum((a-ac)*(b-bc))/np.sum((a-ac)**2);shift=bc-k*ac
 transforms['elbow'+short]={'scale':float(k),'translation':shift.tolist(),'envelopeRmsMm':float(np.sqrt(np.mean(np.sum((a*k+shift-b)**2,axis=1)))*1000)}
def registered(v,region,short):
 tr=(transforms if region=='elbow' else meta['localRegistration'])[region+short];return initial(v)*tr['scale']+np.array(tr['translation'])
def component(v,f,upper):
 parents=list(range(len(v)))
 def find(i):
  while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
  return i
 for x,y,z in f:parents[find(y)]=find(x);parents[find(z)]=find(x)
 groups={}
 for t in f:groups.setdefault(find(t[0]),[]).append(t)
 candidates=[np.array(g,dtype=np.uint32) for g in groups.values() if len(g)>10]
 return sorted(candidates,key=lambda g:v[np.unique(g),1].mean(),reverse=upper)[0]
def compact(v,f):
 used,inv=np.unique(f,return_inverse=True);return v[used],inv.reshape(-1,3).astype(np.uint32)
def clip_above(v,f,low):
 points=[];faces=[];lookup={}
 def add(p):
  k=tuple(np.round(p,9))
  if k not in lookup:lookup[k]=len(points);points.append(p)
  return lookup[k]
 for face in f:
  poly=[v[i] for i in face];q=[]
  for a,b in zip(poly,poly[1:]+poly[:1]):
   ai=a[1]>=low;bi=b[1]>=low
   if ai:q.append(a)
   if ai!=bi:q.append(a+(b-a)*((low-a[1])/(b[1]-a[1])))
  for i in range(1,len(q)-1):
   t=[add(q[0]),add(q[i]),add(q[i+1])]
   if len(set(t))==3:faces.append(t)
 return np.array(points),np.array(faces,dtype=np.uint32)
blob=bytearray();records=[];chunk=len(atlas['chunks'])
def append(key,display,v,f,objects,selection,region,short,shift=None):
 assert len(v)>3 and len(f)>3 and np.isfinite(v).all()
 q=v[f];valid=np.linalg.norm(np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]),axis=1)>1e-12;f=f[valid]
 n=np.zeros_like(v);q=v[f];fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);
 for i in range(3):np.add.at(n,f[:,i],fn)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
 def add(a,dtype):
  while len(blob)%4:blob.append(0)
  offset=len(blob);buf=np.array(a,dtype=dtype).tobytes();blob.extend(buf);return offset,hashlib.sha256(buf).hexdigest()
 po,ph=add(v,'<f4');no,nh=add(np.rint(n*32767),'<i2');io,ih=add(f,'<u4')
 p={'id':key,'name':display,'conceptId':key,'system':'connective','chunk':chunk,'positions':po,'normals':no,'indices':io,'vertexCount':len(v),'indexCount':int(f.size),'bounds':[v.min(0).tolist(),v.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObjects':objects,'sourceSelection':selection}
 atlas['parts'].append(p);atlas['concepts'].append({'id':key,'name':display,'elements':[key]});atlas['triangles']+=len(f)
 records.append({'id':key,'name':display,'sourceObjects':objects,'sourceSelection':selection,'registration':region+short,'vertices':len(v),'triangles':len(f),'positionsSHA256':ph,'normalsSHA256':nh,'indicesSHA256':ih,'additionalUniformTranslationMm':(shift*1000).tolist() if shift is not None else [0,0,0]})
 print(display,len(v),len(f),flush=True)
for short,side in [('r','right'),('l','left')]:
 data=source[short];name='Long head of biceps brachii.'+short;t=data[name];v=np.array(t['p']);f=np.array(t['i'],dtype=np.uint32)
 for upper,label,region in [(True,'biceps long head tendon','shoulder'),(False,'biceps distal tendon','elbow')]:
  p,i=compact(v,component(v,f,upper));p=registered(p,region,short)
  append('ZA-tendon-completion-'+side+'-'+label.replace(' ','-'),side.title()+' '+label,p,i,[name],('Proximal' if upper else 'Distal')+' connected component of source Tendon-material faces; no short-head proximal tendon or generated band',region,short)
 # Preserve the explicitly named origin footprint; it is not a tendon body.
 name='Common extensor tendon.o'+short;t=data[name];v,f=compact(np.array(t['p']),np.array(t['all'],dtype=np.uint32));v=registered(v,'elbow',short);bone=base(side+' humerus');tree=cKDTree(bone);_,nearest=tree.query(v);shift=np.median(bone[nearest]-v,axis=0);v=v+shift
 append('ZA-tendon-completion-'+side+'-common-extensor',side.title()+' common extensor tendon',v,f,[name],'Evaluated source common extensor origin footprint; uniform reference-bone translation; not a complete tendon body','elbow',short,shift)
 # The source-labelled distal regions available in three quadriceps muscles.
 # Vastus medialis has no complete distal material region in this source.
 low=next(r['sourceCutY'] for r in pat['registration'] if r['side']==side);vs=[];fs=[];names=[];offset=0
 for n in ['Rectus femoris muscle.','Vastus intermedius muscle.','Vastus lateralis muscle.']:
  name=n+short;t=data[name];v=np.array(t['p']);f=component(v,np.array(t['i'],dtype=np.uint32),False);v,f=clip_above(v,f,low)
  vs.append(v);fs.append(f+offset);offset+=len(v);names.append(name)
 v=registered(np.concatenate(vs),'knee',short);f=np.concatenate(fs)
 append('ZA-tendon-completion-'+side+'-quadriceps',side.title()+' quadriceps tendon',v,f,names,'Distal source Tendon-material components proximal to the existing patellar extraction boundary; three source muscle regions, not a reconstruction of every quadriceps tendon layer','knee',short)
name='/models/tendon-completion.bin';(root/'public'/name.lstrip('/')).write_bytes(blob);gz=gzip.compress(blob,compresslevel=9,mtime=0);(root/'public'/(name+'.gz').lstrip('/')).write_bytes(gz);atlas['chunks'].append({'url':name,'bytes':len(blob),'gzip':name+'.gz','gzipBytes':len(gz)})
atlas['scope']+=' Source-labelled proximal/distal biceps and distal quadriceps tendon regions, and a common extensor origin footprint; insertion footprints are not full tendon bodies.'
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
report={'source':meta['source'],'archiveURL':meta['archiveURL'],'archiveSHA256':meta['archiveSHA256'],'license':meta['license'],'authors':meta['authors'],'newLocalRegistration':transforms,'parts':records,'unavailableFullBodies':['Supraspinatus: full source muscle has no Tendon material','Subscapularis: full source muscle has no Tendon material','Teres minor: full source muscle has no Tendon material','Common extensor: source provides an origin footprint, not a shared tendon body'],'limitations':'Healthy educational reference anatomy. Source selections and reference registration are not patient-specific segmentation, strain, rupture or healing simulations. Quadriceps shows the available distal material regions, not all anatomical layers.'}
(out/'tendon-completion-source.json').write_text(json.dumps(report,indent=2));print('Imported',len(records),'new bilateral parts;',len(gz),'compressed bytes')
