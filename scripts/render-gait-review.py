import json,gzip,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
scenes=json.load(gzip.open('/tmp/gait-review/poses.json.gz'))
for view in ['side','front']:
 fig,axes=plt.subplots(2,4,figsize=(18,10),facecolor='#f3f5f5')
 transform=np.array([[0,0,1],[0,1,0],[-1,0,0]]) if view=='side' else np.eye(3)
 for ax,scene in zip(axes.flat,scenes):
  faces=[];colors=[];depths=[]
  for obj in scene['objects']:
   v=np.array(obj['p']).reshape(-1,3);f=np.array(obj['i']).reshape(-1,3);tri=v[f];proj=tri@transform.T
   normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10)
   shade=.52+.48*np.abs(normal@np.array([.7,.35,.6]));color=np.clip(np.array(obj['color'])[None,:]*shade[:,None],0,1)
   faces.extend(proj[:,:,:2]);colors.extend(color);depths.extend(proj[:,:,2].mean(axis=1))
  order=np.argsort(depths);ax.add_collection(PolyCollection(np.array(faces)[order],facecolors=np.array(colors)[order],edgecolors='none',rasterized=True))
  ax.axhline(.003,color='#647b79',lw=1)
  for side,c in scene['contacts'].items():
   if c['phase']<60:
    pt=np.array(c['point'])@transform.T;ax.scatter(pt[0],.003,edgecolors='#167c9b' if side=='right' else '#c08040',s=50,facecolors='none',lw=2,zorder=10)
  ax.set_xlim(-.3,1.4) if view=='side' else ax.set_xlim(-.3,.3)
  ax.set_ylim(-.03,1.07);ax.set_aspect('equal');ax.axis('off');ax.set_title(f"{scene['name']} · %{scene['progress']}",fontsize=12)
 fig.suptitle(('Yandan' if view=='side' else 'Önden')+' · 8 yürüyüş pozu · gerçek kaynak geometrisi',fontsize=18);fig.tight_layout();fig.savefig('/tmp/gait-review/'+view+'.png',dpi=120);plt.close(fig)
