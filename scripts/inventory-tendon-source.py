"""Inspect source object/material coverage without executing the blend's code.

Blender --background --factory-startup --disable-autoexec --python SCRIPT -- SOURCE OUT
Only relevant objects are appended: opening the entire atlas is unnecessary.
"""
import bpy, json, re, sys
from pathlib import Path

source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
pattern = re.compile(r'supraspinatus|subscapularis|teres minor|common extensor|vastus medialis|quadriceps|tendon', re.I)
with bpy.data.libraries.load(str(source), link=False) as (src, dst):
    names = [name for name in src.objects if pattern.search(name)]
    dst.objects = list(names)
records = []
for obj in dst.objects:
    if obj is None or obj.type != 'MESH':
        continue
    bpy.context.collection.objects.link(obj)
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    counts = {}
    for triangle in mesh.loop_triangles:
        material = mesh.materials[triangle.material_index] if triangle.material_index < len(mesh.materials) else None
        name = material.name if material else '(none)'
        counts[name] = counts.get(name, 0) + 1
    records.append({'object': obj.name, 'vertices': len(mesh.vertices), 'trianglesByMaterial': counts})
    evaluated.to_mesh_clear()
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'source': source.name, 'matchedObjects': names, 'meshes': records}, indent=2))
print(json.dumps(records, indent=2), flush=True)
