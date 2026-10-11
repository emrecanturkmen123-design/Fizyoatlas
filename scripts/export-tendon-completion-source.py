"""Load only named source objects, with auto execution disabled.
Export evaluated source Tendon triangles and footprint/bone references unchanged.
Blender --background --disable-autoexec --python SCRIPT -- SOURCE.blend OUT_DIR.
"""
import bpy,numpy as np,json,sys,re
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];source=Path(args[0]);out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
pattern=re.compile(r'(head of biceps brachii|Rectus femoris|Vastus |Common extensor tendon|Extensor carpi radialis brevis|Supraspinatus|Infraspinatus|Subscapularis|Teres minor|^(Humerus|Scapula|Radius|Ulna|Patella|Tibia|Femur)\.[lr]$)',re.I)
with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.objects=[n for n in src.objects if pattern.search(n)]
for o in dst.objects:
 if o is not None:bpy.context.collection.objects.link(o)
for side in ['r','l']:
 data={}
 for o in dst.objects:
  if o is None or o.type!='MESH' or not o.name.endswith(side):continue
  ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();m.calc_loop_triangles();v=np.array([o.matrix_world@a.co for a in m.vertices])[:,[0,2,1]];v[:,2]*=-1
  allfaces=np.array([t.vertices for t in m.loop_triangles],dtype=np.uint32)
  faces=np.array([t.vertices for t in m.loop_triangles if m.materials[t.material_index] and m.materials[t.material_index].name=='Tendon'],dtype=np.uint32).reshape(-1,3)
  if o.matrix_world.to_3x3().determinant()<0:faces=faces[:,[0,2,1]];allfaces=allfaces[:,[0,2,1]]
  data[o.name]={'p':v.tolist(),'i':faces.tolist(),'all':allfaces.tolist()};ev.to_mesh_clear()
 (out/(side+'.json')).write_text(json.dumps(data));print(side,len(data),'source objects exported',flush=True)
