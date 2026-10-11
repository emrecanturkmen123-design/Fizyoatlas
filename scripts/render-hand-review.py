import json,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
scenes=json.load(open(sys.argv[1]))
fig,axes=plt.subplots(len(scenes),3,figsize=(12,3.2*len(scenes)),facecolor='#f2f3f3')
for row,s in enumerate(scenes):
 for col,(angle,soft) in enumerate([(0,False),(.9,False),(0,True)]):
  ax=axes[row,col];faces=[];colors=[];depth=[];sign=1 if s['side']=='right' else -1
  centre=np.array([-.26 if sign==1 else .26,.84,.025]);u=np.array([np.cos(angle),0,-np.sin(angle)*sign]);z=np.array([np.sin(angle)*sign,0,np.cos(angle)])
  for obj in s['objects']:
   if not soft and obj['system']!='skeletal':continue
   tri=np.array(obj['p']).reshape(-1,3)[np.array(obj['i']).reshape(-1,3)]-centre
   pr=np.stack([tri@u,tri[:,:,1],tri@z],axis=-1)
   normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-12)
   shade=.7+.3*np.abs(normal@np.array([.4,.3,.8]))
   faces.extend(pr[:,:,:2]);colors.extend(np.array(obj['color'])[None,:]*shade[:,None]);depth.extend(pr[:,:,2].mean(1))
  order=np.argsort(depth);ax.add_collection(PolyCollection(np.array(faces)[order],facecolors=np.array(colors)[order],edgecolors='none',rasterized=True))
  ax.set_xlim(-.095,.095);ax.set_ylim(-.12,.1);ax.set_aspect('equal');ax.axis('off');ax.set_title(s['name']+'\n'+['Önden kemikler','Eğik kemikler','Kaynak kas ve tendonlar'][col],fontsize=10)
fig.suptitle('Kaynak el modelinin poz ve deformasyon kontrolü',fontsize=16)
fig.text(.5,.015,'Kaynak üçgenlerin CPU çizimi; WebGL ekran görüntüsü veya klinik kinematik doğrulaması değildir.',ha='center',fontsize=9)
fig.tight_layout(rect=[0,.025,1,.975]);fig.savefig(sys.argv[2],dpi=120,facecolor=fig.get_facecolor());plt.close(fig)
