"""CPU review of the exact atlas tendon geometry, front and side, both legs."""
import json,numpy as np,sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
root=Path(__file__).resolve().parents[1]/'public/models';a=json.loads((root/'atlas.json').read_text());buf={}
def mesh(p):
 if p['chunk'] not in buf:buf[p['chunk']]=(root/a['chunks'][p['chunk']]['url'].split('/')[-1]).read_bytes()
 b=buf[p['chunk']];return np.frombuffer(b,'<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3),np.frombuffer(b,'<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3)
fig,axes=plt.subplots(1,4,figsize=(12,4),facecolor='#f3f4f3')
for ax,(side,view) in zip(axes,[(s,v) for s in ['right','left'] for v in ['front','side']]):
 items=[p for p in a['parts'] if p['name'].lower() in [side+' '+k for k in ['patellar ligament','patella','femur','tibia']]];t=next(p for p in items if p['system']=='connective');center=np.mean(t['bounds'],axis=0);matrix=np.eye(3) if view=='front' else np.array([[0,0,1],[0,1,0],[-1,0,0]])
 tris=[];colors=[];depth=[]
 for p in items:
  v,f=mesh(p);tri=v[f];n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12);shade=.6+.4*np.abs(n@np.array([.6,.4,.7]));col=np.array([.07,.55,.55] if p['system']=='connective' else [.86,.83,.72]);pr=tri@matrix.T
  tris.extend(pr[:,:,:2]);depth.extend(pr[:,:,2].mean(1));colors.extend(col[None,:]*shade[:,None])
 order=np.argsort(depth);ax.add_collection(PolyCollection(np.array(tris)[order],facecolors=np.array(colors)[order],edgecolors='none'));c=center@matrix.T;ax.set_xlim(c[0]-.065,c[0]+.065);ax.set_ylim(center[1]-.058,center[1]+.08);ax.set_aspect('equal');ax.axis('off');ax.set_title(('Sağ' if side=='right' else 'Sol')+' · '+('Ön' if view=='front' else 'Yan'))
fig.suptitle('Patellar tendon · gerçek model geometrisi');fig.text(.5,.035,'Turkuaz: ayrı seçilebilir tendon · CPU çizimi, WebGL ekran görüntüsü değil',ha='center',fontsize=10);fig.savefig(sys.argv[1],dpi=150,facecolor=fig.get_facecolor());plt.close(fig)
