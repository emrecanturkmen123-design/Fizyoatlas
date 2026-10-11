"""Extract the source-labelled distal extensor tendon below patellar origin.
Input: evaluated Blender export from export-patellar-source.py; no generated band.
Registration preserves shape apart from a linear endpoint translation to the
base atlas' corresponding patellar/tibial attachment surfaces.
"""
import json,gzip,hashlib,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
root=Path(__file__).resolve().parents[1];out=root/'public/models';atlas=json.loads((out/'atlas.json').read_text());meta=json.loads((out/'clinical-source.json').read_text())
previous=[p for p in atlas['parts'] if p['id'].startswith('ZA-patellar-')]
if previous:
 assert atlas['chunks'][-1]['url']=='/models/patellar.bin' and all(p['chunk']==len(atlas['chunks'])-1 for p in previous)
 atlas['triangles']-=sum(p['indexCount']//3 for p in previous);atlas['parts']=[p for p in atlas['parts'] if not p['id'].startswith('ZA-patellar-')];atlas['concepts']=[p for p in atlas['concepts'] if not p['id'].startswith('ZA-patellar-')];atlas['chunks'].pop()
def base(name):
 p=next(p for p in atlas['parts'] if p['name'].lower()==name);raw=(out/atlas['chunks'][p['chunk']]['url'].split('/')[-1]).read_bytes();return np.frombuffer(raw,'<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3).copy()
def clip(v,faces,top):
 points=[];tri=[];lookup={}
 def add(p):
  k=tuple(np.round(p,9))
  if k not in lookup:lookup[k]=len(points);points.append(p)
  return lookup[k]
 for face in faces:
  polygon=[v[i] for i in face];clipped=[]
  for a,b in zip(polygon,polygon[1:]+polygon[:1]):
   ai=a[1]<=top;bi=b[1]<=top
   if ai:clipped.append(a)
   if ai!=bi:clipped.append(a+(b-a)*((top-a[1])/(b[1]-a[1])))
  for j in range(1,len(clipped)-1):
   t=[add(clipped[0]),add(clipped[j]),add(clipped[j+1])]
   if len(set(t))==3:tri.append(t)
 return np.array(points),np.array(tri,dtype=np.uint32)
blob=bytearray();records=[];reports=[];total=0;chunk=len(atlas['chunks'])
for side,short in [('right','r'),('left','l')]:
 source=json.loads((Path(sys.argv[1])/(short+'.json')).read_text());t=source['Rectus femoris muscle.'+short];v=np.array(t['p']);faces=np.array(t['i']);foot=np.array(source['Patellar ligament.o'+short]['p']);top=foot[:,1].max();v,f=clip(v,faces,top)
 tr=meta['localRegistration']['knee'+short];reg=lambda x:(x*meta['baseRegistration']['scale']+np.array(meta['baseRegistration']['translation']))*tr['scale']+np.array(tr['translation'])
 v=reg(v);prox=v[v[:,1]>v[:,1].max()-.001];dist=v[v[:,1]<v[:,1].min()+.006]
 # Region-constrained bone surface references; same side, lower patella and
 # anterior proximal tibia. Use one translation per end, never individual snapping.
 pat=base(side+' patella');tib=base(side+' tibia');pat=pat[pat[:,1]<pat[:,1].min()+.014];tib=tib[(tib[:,1]>tib[:,1].max()-.09)&(tib[:,2]>np.quantile(tib[:,2],.7))]
 shifts=[]
 for end,bone in [(prox,pat),(dist,tib)]:
  tree=cKDTree(bone);ds,ids=tree.query(end);j=np.argmin(ds);shifts.append(bone[ids[j]]-end[j])
 lo=v[:,1].min();hi=v[:,1].max();w=np.clip((v[:,1]-lo)/(hi-lo),0,1)
 v=v+shifts[1][None,:]*(1-w[:,None])+shifts[0][None,:]*w[:,None]
 n=np.zeros_like(v);q=v[f];fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);
 for i in range(3):np.add.at(n,f[:,i],fn)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
 def add(a,dtype):
  while len(blob)%4:blob.append(0)
  at=len(blob);blob.extend(np.array(a,dtype=dtype).tobytes());return at
 key='ZA-patellar-'+side;display=side.title()+' patellar ligament'
 record={'id':key,'name':display,'conceptId':key,'system':'connective','chunk':chunk,'positions':add(v,'<f4'),'normals':add(np.rint(n*32767),'<i2'),'indices':add(f,'<u4'),'vertexCount':len(v),'indexCount':int(f.size),'bounds':[v.min(0).tolist(),v.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObject':'Rectus femoris muscle.'+short,'sourceSelection':'Tendon-material faces distal to the patellar origin footprint upper boundary, boundary clipped; endpoint-registered to reference bones'}
 atlas['parts'].append(record);atlas['concepts'].append({'id':key,'name':display,'elements':[key]});records.append(record);total+=len(f)
 reports.append({'side':side,'triangles':len(f),'vertices':len(v),'bounds':record['bounds'],'sourceCutY':float(top),'proximalTranslationMm':(shifts[0]*1000).tolist(),'distalTranslationMm':(shifts[1]*1000).tolist()})
 print(reports[-1])
(out/'patellar.bin').write_bytes(blob);gz=gzip.compress(blob,compresslevel=9,mtime=0);(out/'patellar.bin.gz').write_bytes(gz);atlas['chunks'].append({'url':'/models/patellar.bin','bytes':len(blob),'gzip':'/models/patellar.bin.gz','gzipBytes':len(gz)});atlas['triangles']+=total
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
(out/'patellar-source.json').write_text(json.dumps({'source':meta['source'],'archiveSHA256':meta['archiveSHA256'],'license':'CC-BY-SA-4.0','authors':meta['authors'],'parts':records,'registration':reports,'limitations':'Educational extraction and reference-bone registration, not patient-specific segmentation. Static model; no patellar tracking or tendon strain simulation.','sha256':hashlib.sha256(blob).hexdigest()},indent=2))
