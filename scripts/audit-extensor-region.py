"""Inspect source ECRB geometry near the common origin; no clinical tolerance."""
import bpy, json, numpy as np, sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path(__file__).resolve().parents[1]/'public/models'
atlas=json.loads((root/'atlas.json').read_text()); buffers={}; rows=[]
def mesh(part):
    key=part['chunk']
    if key not in buffers:
        buffers[key]=(root/Path(atlas['chunks'][key]['url']).name).read_bytes()
    b=buffers[key]
    return np.frombuffer(b,'<f4',part['vertexCount']*3,part['positions']).reshape(-1,3),np.frombuffer(b,'<u4',part['indexCount'],part['indices']).reshape(-1,3)
for side in ['right','left']:
    tendon=next(p for p in atlas['parts'] if p['id']==f'ZA-extensor-region-{side}-ecrb-proximal')
    bone=next(p for p in atlas['parts'] if p['name'].lower()==side+' humerus')
    footprint=next(p for p in atlas['parts'] if p['name'].lower()==side+' common extensor tendon')
    vertices,faces=mesh(tendon);bv,bf=mesh(bone);fv,ff=mesh(footprint)
    tree=BVHTree.FromPolygons(bv.tolist(),bf.tolist(),all_triangles=True)
    vicinity=np.sqrt(((vertices[:,None,:]-fv[None,:,:])**2).sum(2)).min(1)
    patch=vertices[vicinity<vicinity.min()+.004]
    distances=np.array([tree.find_nearest(Vector(v))[3] for v in patch])*1000
    rows.append({'name':tendon['name'],'triangles':len(faces),'patch':'within 4 mm of closest source common-origin footprint vertex','vertices':len(patch),'distanceToHumerusMmMinMedianMax':np.percentile(distances,[0,50,100]).tolist(),'closestFootprintVertexMm':float(vicinity.min()*1000)})
    assert np.isfinite(vertices).all() and np.isfinite(distances).all() and len(faces)==453
path=Path(sys.argv[sys.argv.index('--')+1]);path.write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
