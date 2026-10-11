"""Run with Blender's Python/bpy: script SOURCE.blend OUTPUT_DIRECTORY.
Evaluates modifiers with embedded scripts disabled; exports exact tendon-material
triangles and anatomical footprint/bone references, not a fabricated tendon.
"""
import bpy,numpy as np,json,sys
from pathlib import Path
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(Path(sys.argv[1]).resolve()),load_ui=False,use_scripts=False)
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
for side in ['l','r']:
 data={}
 for name in ['Rectus femoris muscle.'+side,'Patellar ligament.o'+side,'Patellar ligament.e'+side,'Patella.'+side,'Tibia.'+side]:
  o=bpy.data.objects[name];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();m.calc_loop_triangles();v=np.array([o.matrix_world@a.co for a in m.vertices])[:,[0,2,1]];v[:,2]*=-1
  ts=[t for t in m.loop_triangles if not name.startswith('Rectus') or m.materials[t.material_index].name=='Tendon'];f=np.array([t.vertices for t in ts]);
  if o.matrix_world.to_3x3().determinant()<0:f=f[:,[0,2,1]]
  data[name]={'p':v.tolist(),'i':f.tolist()};ev.to_mesh_clear()
 (out/(side+'.json')).write_text(json.dumps(data));print(side,'exported',flush=True)
