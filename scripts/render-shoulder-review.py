"""Orthographic CPU projections of exported shipped meshes; no generated anatomy."""
import json,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
scenes=json.load(open(sys.argv[1]));fig,axes=plt.subplots(2,3,figsize=(15,10),facecolor='#171e29')
achilles=len(sys.argv)>3 and sys.argv[3]=='achilles'
cuff=['soleus','gastrocnemius','calcaneal tendon','tibia','fibula','calcaneus','talus'] if achilles else ['supraspinatus','infraspinatus','teres minor','subscapularis']
for ax,scene in zip(axes.flat,scenes):
    faces=[];colors=[];depths=[]
    for obj in scene['objects']:
        name=obj['name'].lower()
        if not any(k in name for k in cuff+['humerus','scapula','clavicle']):continue
        v=np.array(obj['p']).reshape(-1,3);f=np.array(obj['i']).reshape(-1,3);tri=v[f]
        # Posterior oblique view, all transforms already applied by production rig.
        x=tri[:,:,0]*.94+tri[:,:,2]*.342;y=tri[:,:,1];z=tri[:,:,2]*.94-tri[:,:,0]*.342
        normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10)
        shade=.55+.45*np.abs(normal@np.array([.25,.4,-.88]));color=np.clip(np.array(obj['color'])[None,:]*shade[:,None],0,1)
        faces.extend(np.stack([x,y],axis=2));colors.extend(color);depths.extend(z.mean(axis=1))
    order=np.argsort(depths)[::-1];polys=np.array(faces)[order]
    ax.add_collection(PolyCollection(polys,facecolors=np.array(colors)[order],edgecolors='none',rasterized=True))
    ax.autoscale_view();ax.set_aspect('equal');ax.set_facecolor('#171e29');ax.axis('off');ax.set_title(scene['name'],color='white')
fig.suptitle(('Right Achilles' if achilles else 'Right shoulder')+' · source meshes · posterior oblique CPU projection',color='white');fig.tight_layout();fig.savefig(sys.argv[2],dpi=130,facecolor=fig.get_facecolor());plt.close(fig)
