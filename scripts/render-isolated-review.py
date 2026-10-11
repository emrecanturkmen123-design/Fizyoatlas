"""Orthographic projections of actual muscle meshes, individually with adjacent bones."""
import gzip,json,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
scenes=json.load(gzip.open(sys.argv[1]));side=sys.argv[3] if len(sys.argv)>3 else 'right'
scenes=[s for s in scenes if (len(sys.argv)<7 or sys.argv[6] in s['part'].lower()) and s['side']==side and (len(sys.argv)<6 or sys.argv[5]=='*' or s['id']==sys.argv[5])];groups=sorted(set((s['part'],s['id']) for s in scenes));viewname=sys.argv[4] if len(sys.argv)>4 else 'front'
view={'front':np.array([[1,0,0],[0,1,0],[0,0,1]]),'back':np.array([[-1,0,0],[0,1,0],[0,0,-1]]),'side':np.array([[0,0,1],[0,1,0],[-1,0,0]])}[viewname]
fig,axes=plt.subplots(len(groups),3,figsize=(12,max(4,len(groups)*3.2)),squeeze=False,facecolor='#f5f4f0')
for row,(part,id) in enumerate(groups):
 for col,pr in enumerate([0,50,100]):
  ax=axes[row,col];s=next(s for s in scenes if s['part']==part and s['id']==id and s['progress']==pr);faces=[];colors=[];depths=[]
  for obj in s['objects']:
   tri=np.array(obj['p']).reshape(-1,3)[np.array(obj['i']).reshape(-1,3)];proj=tri@view.T
   normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10)
   shade=.6+.4*np.abs(normal@np.array([.2,.6,.77]));color=np.clip(np.array(obj['color'])[None,:]*shade[:,None],0,1)
   faces.extend(proj[:,:,:2]);colors.extend(color);depths.extend(proj[:,:,2].mean(axis=1))
  order=np.argsort(depths);ax.add_collection(PolyCollection(np.array(faces)[order],facecolors=np.array(colors)[order],edgecolors='none',rasterized=True));ax.autoscale_view();ax.set_aspect('equal');ax.axis('off');ax.set_title(part+'\n'+id+' '+str(pr)+'% '+viewname,fontsize=8)
fig.tight_layout();fig.savefig(sys.argv[2],dpi=110,facecolor=fig.get_facecolor());plt.close(fig)
