import json,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
scenes=json.load(open(sys.argv[1]))
fig,axes=plt.subplots(2,3,figsize=(12,8),facecolor='#f2f3f3')
for ax,s in zip(axes.flat,scenes):
 faces=[];colors=[];depth=[]
 for obj in s['objects']:
  tri=np.array(obj['p']).reshape(-1,3)[np.array(obj['i']).reshape(-1,3)]
  # Same side projection for both legs; axes are anterior/posterior and height.
  pr=tri[:,:,[2,1,0]]
  normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-12)
  shade=.66+.34*np.abs(normal@np.array([.75,.4,.3]))
  faces.extend(pr[:,:,:2]);colors.extend(np.array(obj['color'])[None,:]*shade[:,None]);depth.extend(pr[:,:,2].mean(1))
 order=np.argsort(depth)*(1 if s['side']=='right' else -1)
 if s['side']=='left':order=np.argsort(depth)[::-1]
 ax.add_collection(PolyCollection(np.array(faces)[order],facecolors=np.array(colors)[order],edgecolors='none',rasterized=True))
 c=s['center'];ax.set_xlim(c[2]-.20,c[2]+.16);ax.set_ylim(c[1]-.14,c[1]+.17);ax.set_aspect('equal');ax.axis('off');ax.set_title(('Sağ' if s['side']=='right' else 'Sol')+f" diz · {s['angle']:.0f}°",fontsize=12)
fig.suptitle('Patella ve patellar tendon · şematik hareket kontrolü',fontsize=16)
fig.text(.5,.035,'Gerçek model yüzeylerinin CPU çizimi. WebGL ekran görüntüsü ve klinik kinematik doğrulaması değildir.',ha='center',fontsize=10)
fig.tight_layout(rect=[0,.06,1,.94]);fig.savefig(sys.argv[2],dpi=140,facecolor=fig.get_facecolor());plt.close(fig)
