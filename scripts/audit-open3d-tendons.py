"""Inspect shipped surfaces and source colour boundaries, using CPU geometry."""
import json,sys,numpy as np
from pathlib import Path
from scipy.spatial import cKDTree
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
root=Path(__file__).resolve().parents[1];atlas=json.loads((root/'public/models/atlas.json').read_text());buffers={}
def mesh(p):
 path=root/'public'/atlas['chunks'][p['chunk']]['url'].lstrip('/')
 if path not in buffers:buffers[path]=path.read_bytes()
 b=buffers[path];return np.frombuffer(b,'<f4',p['vertexCount']*3,p['positions']).reshape(-1,3),np.frombuffer(b,'<u4',p['indexCount'],p['indices']).reshape(-1,3)
keys=['supraspinatus','subscapularis','teres minor','common extensor','quadriceps'];fig,axs=plt.subplots(2,5,figsize=(18,10),facecolor='#f1f5f4');records=[]
for row,side in enumerate(['right','left']):
 for col,key in enumerate(keys):
  ax=axs[row,col];part=next(p for p in atlas['parts'] if p['id']==f'O3D-tendon-{side}-{key.replace(" ","-")}-tendon');v,f=mesh(part);boneNames=['femur','patella','tibia'] if key=='quadriceps' else ['humerus','radius','ulna'] if key=='common extensor' else ['humerus','scapula'];muscleNames=['rectus femoris','vastus'] if key=='quadriceps' else ['extensor carpi radialis brevis','extensor digitorum','extensor digiti minimi','extensor carpi ulnaris'] if key=='common extensor' else [key]
  angle=0 if key=='subscapularis' else -.55;view=np.array([[np.cos(angle),0,np.sin(angle)],[0,1,0],[-np.sin(angle),0,np.cos(angle)]])
  verts=v@view.T;low=verts[:,:2].min(0)-.022;high=verts[:,:2].max(0)+.022;contexts=[]
  for p in atlas['parts']:
   n=p['name'].lower()
   if side not in n:continue
   if p['system']=='skeletal' and n in [side+' '+b for b in boneNames] or p['system']=='muscular' and any(k in n for k in muscleNames):contexts.append(p)
  for p in contexts:
   bv,bf=mesh(p);tri=(bv@view.T)[bf];mask=(tri[:,:,0].max(1)>=low[0])&(tri[:,:,0].min(1)<=high[0])&(tri[:,:,1].max(1)>=low[1])&(tri[:,:,1].min(1)<=high[1]);tri=tri[mask];order=np.argsort(tri[:,:,2].mean(1));ax.add_collection(PolyCollection(tri[order,:,:2],facecolors='#bfc3b8' if p['system']=='skeletal' else '#b56761',edgecolors='none',alpha=.32,rasterized=True))
  tri=(v@view.T)[f];normal=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10);shade=.5+.5*np.abs(normal@np.array([.7,.3,.6]));colors=np.clip(np.array([.10,.46,.48])[None,:]*shade[:,None],0,1);order=np.argsort(tri[:,:,2].mean(1));ax.add_collection(PolyCollection(tri[order,:,:2],facecolors=colors[order],edgecolors='none',rasterized=True))
  ax.set_xlim(low[0],high[0]);ax.set_ylim(low[1],high[1]);ax.set_aspect('equal');ax.axis('off');ax.set_title(side+' · '+key,fontsize=10)
  bone=base=next(p for p in contexts if p['name'].lower()==side+' '+('patella' if key=='quadriceps' else 'humerus'));distances=cKDTree(mesh(bone)[0]).query(v)[0]*1000;muscles=[p for p in contexts if p['system']=='muscular'];md=cKDTree(np.concatenate([mesh(p)[0] for p in muscles])).query(v)[0]*1000
  q={'id':part['id'],'vertices':len(v),'triangles':len(f),'spanMm':(np.ptp(v,axis=0)*1000).tolist(),'boneVertexMinMm':float(distances.min()),'muscleVertexMinMm':float(md.min()),'muscleVertexP90Mm':float(np.percentile(md,90))};records.append(q);print(q)
fig.suptitle('Open3DModel reference tendon regions · exact shipped triangles · CPU inspection (not WebGL)',fontsize=14);fig.tight_layout();fig.savefig(root/'docs/tendon-review-v40/reference-surfaces.png',dpi=150,facecolor=fig.get_facecolor());(root/'docs/tendon-review-v40/attachment-distances.json').write_text(json.dumps(records,indent=2))
