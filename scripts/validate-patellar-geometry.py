"""Requires bpy's mathutils; exact triangle-surface attachment distance audit."""
import bpy
import json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path(__file__).resolve().parents[1]/'public/models';a=json.loads((root/'atlas.json').read_text());buffers={}
def mesh(name):
 p=next(p for p in a['parts'] if p['name'].lower()==name)
 if p['chunk'] not in buffers:buffers[p['chunk']]=(root/a['chunks'][p['chunk']]['url'].split('/')[-1]).read_bytes()
 b=buffers[p['chunk']];return np.frombuffer(b,'<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3),np.frombuffer(b,'<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3)
report=[]
for side in ['left','right']:
 v,f=mesh(side+' patellar ligament');assert np.isfinite(v).all();assert len(v)>100 and len(f)>200
 # One continuous surface, no isolated fragments left by material extraction.
 parents=list(range(len(v)))
 def find(x):
  while parents[x]!=x:parents[x]=parents[parents[x]];x=parents[x]
  return x
 for face in f:
  for x in face[1:]:parents[find(int(x))]=find(int(face[0]))
 assert len({find(i) for i in range(len(v))})==1
 length=float(np.ptp(v[:,1]));assert .035<length<.075
 row={'side':side,'lengthMm':length*1000,'vertices':len(v),'triangles':len(f)}
 for bone,points in [('patella',v[v[:,1]>v[:,1].max()-.001]),('tibia',v[v[:,1]<v[:,1].min()+.006])]:
  bv,bf=mesh(side+' '+bone);tree=BVHTree.FromPolygons(bv.tolist(),bf.tolist(),all_triangles=True);dist=np.array([tree.find_nearest(Vector(p))[3] for p in points])*1000
  assert dist.min()<.5,(side,bone,dist.min())
  row[bone+'EndDistanceMmMinMedianMax']=np.percentile(dist,[0,50,100]).tolist()
 report.append(row)
print(json.dumps(report,indent=2))
if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(report,indent=2))
