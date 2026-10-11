"""CPU projections of shipped production rigs; not WebGL screenshots."""
import json,gzip,sys,numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
family=sys.argv[1];root=sys.argv[2];scenes=json.load(gzip.open(root+'/'+family+'.json.gz'))
fig,axes=plt.subplots(len(scenes)//6,6,figsize=(18,len(scenes)//6*3.3),facecolor='#171e29',squeeze=False)
for ax,scene in zip(axes.flat,scenes):
    faces=[];colors=[];depths=[]
    # Lateral for sagittal motion, oblique front for frontal / rotational motions.
    lateral=scene['id'] in ['flexion','extension','dorsiflexion','plantarflexion']
    view=np.array([[0,0,1],[0,1,0],[-1,0,0]]) if lateral else np.array([[.94,0,.342],[0,1,0],[-.342,0,.94]])
    for obj in scene['objects']:
        v=np.array(obj['p']).reshape(-1,3);f=np.array(obj['i']).reshape(-1,3);tri=v[f];proj=tri@view.T
        normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10)
        shade=.5+.5*np.abs(normal@np.array([.7,.35,.6]));color=np.clip(np.array(obj['color'])[None,:]*shade[:,None],0,1)
        faces.extend(proj[:,:,:2]);colors.extend(color);depths.extend(proj[:,:,2].mean(axis=1))
    order=np.argsort(depths);polys=np.array(faces)[order]
    ax.add_collection(PolyCollection(polys,facecolors=np.array(colors)[order],edgecolors='none',rasterized=True));ax.autoscale_view();ax.set_aspect('equal');ax.axis('off');ax.set_title(scene['name'],color='white',fontsize=8)
fig.suptitle(family+' · 0 / 50 / 100% · right and left · CPU source-mesh review',color='white');fig.tight_layout();fig.savefig(root+'/'+family+'.png',dpi=110,facecolor=fig.get_facecolor());plt.close(fig)
