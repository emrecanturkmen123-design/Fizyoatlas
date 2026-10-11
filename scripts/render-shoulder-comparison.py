"""Same-camera before/after of the reported defect, from production meshes."""
import gzip,json,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
fig,axes=plt.subplots(1,2,figsize=(12,4.2),facecolor='#f5f4f0')
for ax,path,title in zip(axes,sys.argv[1:3],['Önce','Sonra']):
 scenes=json.load(gzip.open(path));s=next(s for s in scenes if s['side']=='right' and s['id']=='abduction' and s['progress']==100 and 'acromial' in s['part'].lower());faces=[];colors=[];depths=[]
 for obj in s['objects']:
  tri=np.array(obj['p']).reshape(-1,3)[np.array(obj['i']).reshape(-1,3)];n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-10)
  shade=.6+.4*np.abs(n@np.array([.2,.6,.77]));faces.extend(tri[:,:,:2]);colors.extend(np.array(obj['color'])[None,:]*shade[:,None]);depths.extend(tri[:,:,2].mean(axis=1))
 order=np.argsort(depths);ax.add_collection(PolyCollection(np.array(faces)[order],facecolors=np.array(colors)[order],edgecolors='none'));ax.set_xlim(-.54,-.07);ax.set_ylim(1.22,1.55);ax.set_aspect('equal');ax.axis('off');ax.set_title(title,fontsize=17,weight='bold')
fig.suptitle('Omuz abdüksiyonu · aynı açı, aynı kas',fontsize=17);fig.text(.5,.015,'Gerçek model geometrisinden çizim · tarayıcı ekran görüntüsü değil',ha='center',fontsize=10,color='#555');fig.tight_layout(rect=(0,.035,1,.93));fig.savefig(sys.argv[3],dpi=140,facecolor=fig.get_facecolor());plt.close(fig)
