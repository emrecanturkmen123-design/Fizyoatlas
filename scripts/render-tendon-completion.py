"""Exact shipped triangles, orthographic CPU inspection. Not a WebGL image."""
import json,sys,numpy as np
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
root=Path(__file__).resolve().parents[1]/'public';atlas=json.loads((root/'models/atlas.json').read_text());buffers={}
def mesh(p):
 path=root/atlas['chunks'][p['chunk']]['url'].lstrip('/')
 if path not in buffers:buffers[path]=path.read_bytes()
 b=buffers[path];return np.frombuffer(b,'<f4',p['vertexCount']*3,p['positions']).reshape(-1,3),np.frombuffer(b,'<u4',p['indexCount'],p['indices']).reshape(-1,3)
keys=['biceps long head tendon','biceps distal tendon','quadriceps tendon','common extensor tendon']
bones=[['scapula','humerus'],['humerus','radius','ulna'],['femur','patella','tibia'],['humerus','radius','ulna']]
fig,axs=plt.subplots(2,4,figsize=(16,10),facecolor='#f1f5f4')
for row,side in enumerate(['right','left']):
 for col,key in enumerate(keys):
  ax=axs[row,col];part=next(p for p in atlas['parts'] if p['name'].lower()==side+' '+key);v,f=mesh(part);selected=[part];
  if key=='common extensor tendon':selected.append(next(p for p in atlas['parts'] if p['id']==f'ZA-extensor-region-{side}-ecrb-proximal'))
  extent=np.concatenate([mesh(p)[0] for p in selected]);angle=-.5 if key=='common extensor tendon' else .2;view=np.array([[np.cos(angle),0,np.sin(angle)],[0,1,0],[-np.sin(angle),0,np.cos(angle)]])
  verts=extent@view.T;low=verts[:,:2].min(0)-.025;high=verts[:,:2].max(0)+.025
  context=[p for p in atlas['parts'] if p['name'].lower() in [side+' '+b for b in bones[col]]]
  for p in context:
   bv,bf=mesh(p);tri=(bv@view.T)[bf];mask=(tri[:,:,0].max(1)>=low[0])&(tri[:,:,0].min(1)<=high[0])&(tri[:,:,1].max(1)>=low[1])&(tri[:,:,1].min(1)<=high[1]);tri=tri[mask];order=np.argsort(tri[:,:,2].mean(1));ax.add_collection(PolyCollection(tri[order,:,:2],facecolors='#bfc3b8',edgecolors='none',alpha=.35,rasterized=True))
  for p in selected:
   v,f=mesh(p);tri=(v@view.T)[f];normal=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10);shade=.5+.5*np.abs(normal@np.array([.7,.3,.6]));colors=np.clip(np.array([.17,.49,.52])[None,:]*shade[:,None],0,1);order=np.argsort(tri[:,:,2].mean(1));ax.add_collection(PolyCollection(tri[order,:,:2],facecolors=colors[order],edgecolors='none',rasterized=True))
  ax.set_xlim(low[0],high[0]);ax.set_ylim(low[1],high[1]);ax.set_aspect('equal');ax.axis('off');ax.set_title(side+' · '+key+('\norigin footprint + partial ECRB component' if col==3 else '\nsource tendon region'),fontsize=10)
fig.suptitle('Source tendon completion · exact reference triangles · bone context translucent',fontsize=15);fig.tight_layout();fig.savefig(sys.argv[1],dpi=140,facecolor=fig.get_facecolor());plt.close(fig)
