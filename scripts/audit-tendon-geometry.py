import bpy,json,numpy as np,sys,argparse
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--render',action='store_true');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
r=Path(__file__).resolve().parents[1]/'public/models';a=json.loads((r/'atlas.json').read_text());buf={}
def mesh(p):
 i=p['chunk']
 if i not in buf:buf[i]=(r/a['chunks'][i]['url'].split('/')[-1]).read_bytes()
 b=buf[i];return np.frombuffer(b,dtype='<f4',offset=p['positions'],count=p['vertexCount']*3).reshape(-1,3).copy(),np.frombuffer(b,dtype='<u4',offset=p['indices'],count=p['indexCount']).reshape(-1,3).copy()
def tree(p):
 v,f=mesh(p);return BVHTree.FromPolygons(v.tolist(),f.tolist(),all_triangles=True)
report=[]
for side in ['right','left']:
 bone=next(p for p in a['parts'] if p['name'].lower()==side+' calcaneus');t=next(p for p in a['parts'] if p['name'].lower()==side+' calcaneal tendon');v,f=mesh(t);bvh=tree(bone)
 distal=v[v[:,1]<v[:,1].min()+.012];d=np.array([bvh.find_nearest(Vector(x))[3] for x in distal])*1000
 muscles=[p for p in a['parts'] if side in p['name'].lower() and any(k in p['name'].lower() for k in ['soleus','gastrocnemius'])]
 prox=v[v[:,1]>v[:,1].max()-.03];trees=[tree(p) for p in muscles];pd=np.array([min(bt.find_nearest(Vector(x))[3] for bt in trees) for x in prox])*1000
 report.append({'name':t['name'],'distal12mm_to_calcaneus_mm':np.percentile(d,[0,50,100]).tolist(),'proximal30mm_to_calf_mm':np.percentile(pd,[0,50,100]).tolist()})
 bone=next(p for p in a['parts'] if p['name'].lower()==side+' humerus');bvh=tree(bone)
 for p in a['parts']:
  if p['id'].startswith('ZA-clinical-'+side) and 'tendon' in p['name']:
   v,f=mesh(p);d=np.array([bvh.find_nearest(Vector(x))[3] for x in v])*1000
   report.append({'name':p['name'],'to_humerus_mm_min_median_max':np.percentile(d,[0,50,100]).tolist()})
print(json.dumps(report,indent=2));(out/'tendon-distance-audit.json').write_text(json.dumps(report,indent=2))
if not args.render:sys.exit(0)
# Real shipped geometry, unmodified. CPU renders avoid dependence on browser WebGL.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.7;return m
boneMat=mat('Bone',(.64,.67,.7));muscleMat=mat('Muscle',(.46,.09,.07));tendonMat=mat('Tendon',(.03,.55,.65))
def obj(p):
 v,f=mesh(p);v=v[:,[0,2,1]];v[:,1]*=-1;me=bpy.data.meshes.new(p['id']);me.from_pydata(v.tolist(),[],f.tolist());me.update();o=bpy.data.objects.new(p['name'],me);bpy.context.collection.objects.link(o);o.data.materials.append(boneMat if p['system']=='skeletal' else muscleMat if p['system']=='muscular' else tendonMat);return o
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=16;s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100;s.world.color=(.7,.7,.7);s.view_settings.view_transform='Standard'
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.type='ORTHO'
bpy.ops.object.light_add(type='AREA',location=(0,2,1));light=bpy.context.object;light.data.energy=25;light.data.shape='DISK';light.data.size=2
for region in ['achilles','shoulder']:
 objects=[]
 for p in a['parts']:
  n=p['name'].lower()
  if 'right' not in n:continue
  ok= any(k in n for k in ['calcaneal tendon','soleus','gastrocnemius']) or n in ['right calcaneus','right tibia','right fibula'] if region=='achilles' else any(k in n for k in ['infraspinatus','supraspinatus','teres minor','subscapularis']) or n in ['right humerus','right scapula']
  if ok:objects.append(obj(p))
 center=Vector((-.08,.025,.28)) if region=='achilles' else Vector((-.16,.03,1.4));cam.data.ortho_scale=.58 if region=='achilles' else .22
 for view,offset in [('posterior',Vector((-.3,1,.05))),('lateral',Vector((-1,.1,.04)))]:
  cam.location=center+offset;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();light.location=cam.location+Vector((0,0,.5));light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(out/(region+'-'+view+'.png'));bpy.ops.render.render(write_still=True)
 for o in objects:bpy.data.objects.remove(o,do_unlink=True)
