"""BVH distances on the shipped reference surfaces, not clinical accuracy."""
import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
root=Path(__file__).resolve().parents[1]/'public/models';a=json.loads((root/'atlas.json').read_text());buf={};rows=[]
def mesh(p):
 if p['chunk'] not in buf:buf[p['chunk']]=(root/a['chunks'][p['chunk']]['url'].split('/')[-1]).read_bytes()
 b=buf[p['chunk']];return np.frombuffer(b,'<f4',p['vertexCount']*3,p['positions']).reshape(-1,3).copy(),np.frombuffer(b,'<u4',p['indexCount'],p['indices']).reshape(-1,3).copy()
for side in ['right','left']:
 for name,bone,end in [('biceps long head tendon','scapula','high'),('biceps distal tendon','radius','low'),('quadriceps tendon','patella','low'),('common extensor tendon','humerus','all')]:
  p=next(p for p in a['parts'] if p['name'].lower()==side+' '+name);v,f=mesh(p);b=next(p for p in a['parts'] if p['name'].lower()==side+' '+bone);bv,bf=mesh(b);tree=BVHTree.FromPolygons(bv.tolist(),bf.tolist(),all_triangles=True)
  patch=v if end=='all' else v[v[:,1]>v[:,1].max()-.012] if end=='high' else v[v[:,1]<v[:,1].min()+.012]
  if name=='biceps long head tendon':
   short='r' if side=='right' else 'l';export=json.loads(Path(sys.argv[sys.argv.index('--')+2],short+'.json').read_text());meta=json.loads((root/'clinical-source.json').read_text());tr=meta['localRegistration']['shoulder'+short];foot=(np.array(export['Long head of biceps brachii.o'+short]['p'])*meta['baseRegistration']['scale']+np.array(meta['baseRegistration']['translation']))*tr['scale']+np.array(tr['translation']);dist=np.sqrt(((v[:,None,:]-foot[None,:,:])**2).sum(2)).min(1);patch=v[dist<dist.min()+.004];end='source origin footprint vicinity'
  d=np.array([tree.find_nearest(Vector(x))[3] for x in patch])*1000;rows.append({'name':p['name'],'bone':b['name'],'patch':end,'distanceMmMinMedianMax':np.percentile(d,[0,50,100]).tolist()})
print(json.dumps(rows,indent=2));Path(sys.argv[sys.argv.index('--')+1]).write_text(json.dumps(rows,indent=2))
