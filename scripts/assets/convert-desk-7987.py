"""Blender: import the user-provided 7987 FBX once as source.blend, then export web props.
Usage: blender -b --python this.py -- EXTRACTED_DIRECTORY OUTPUT_DIRECTORY
The source .max is not read; FBX from the same archive supplies geometry and UVs.
"""
import bpy,sys,os,bmesh,math
from mathutils import Vector,Matrix
args=sys.argv[sys.argv.index('--')+1:]
source,out=args
blend=os.path.join(source,'source.blend')
if os.path.isfile(blend):
 bpy.ops.wm.open_mainfile(filepath=blend)
else:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=os.path.join(source,'Export','Classic Silver Workplace MacBoo.fbx'))
os.makedirs(out,exist_ok=True)
# Resolve bitmap resources and replace unsupported V-Ray procedural placeholders.
for m in bpy.data.materials:
 if not m.use_nodes: continue
 nodes=m.node_tree.nodes; links=m.node_tree.links
 bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
 bs.inputs['Roughness'].default_value=.4
 for n in list(nodes):
  if n.type=='TEX_IMAGE' and n.image:
   path=os.path.join(source,'map',os.path.basename(n.image.filepath))
   if os.path.isfile(path): n.image.filepath=path;n.image.reload()
   else: nodes.remove(n)
  elif n.type=='NORMAL_MAP':
   # FBX scalar bump inputs are not tangent-space normals.
   nodes.remove(n)
 if m.name=='vray_VRay-09-01':
  bs.inputs['Base Color'].default_value=(.58,.61,.64,1);bs.inputs['Metallic'].default_value=.8;bs.inputs['Roughness'].default_value=.28
 if m.name=='vray_VRay-04':
  bs.inputs['Base Color'].default_value=(.92,.91,.88,1);bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.24
 if m.name=='vray_VRay-06-01':
  bs.inputs['Base Color'].default_value=(.8,.85,.9,1);bs.inputs['Alpha'].default_value=.035;bs.inputs['Roughness'].default_value=.12;m.surface_render_method='DITHERED'
 if m.name=='vray_VRay-06-07':
  tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(source,'map','VRay-08.jpg'))
  links.new(tex.outputs['Color'],bs.inputs['Base Color']);links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.3;bs.inputs['Roughness'].default_value=.22
 for n in nodes:
  if n.type=='TEX_IMAGE' and n.image and n.image.has_data: n.image.pack()
sets={'macbook-open':['VRay-60','VRay-61'],'coffee':['VRay-03','VRay-05','VRay-06'],'phone':['VRay-57','VRay-59']}
for name,names in sets.items():
 objs=[bpy.data.objects[n] for n in names]
 points=[o.matrix_world@Vector(p) for o in objs for p in o.bound_box]
 lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)])
 origin=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
 copies=[]
 bpy.ops.object.select_all(action='DESELECT')
 for original in objs:
  o=original.copy();o.data=original.data.copy();bpy.context.collection.objects.link(o)
  world=original.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4)
  # Bake positions and normals together; editing vertex positions alone leaves
  # FBX custom split normals in the old transformed coordinate system.
  o.data.transform(Matrix.Scale(100,4) @ Matrix.Translation(-origin) @ world)
  bpy.context.view_layer.objects.active=o
  if o.data.has_custom_normals:
   bpy.ops.mesh.customdata_custom_splitnormals_clear()
  bm=bmesh.new();bm.from_mesh(o.data)
  bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.00001)
  bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
  for edge in bm.edges:
   if edge.is_manifold: edge.smooth=edge.calc_face_angle()<math.radians(45)
  bm.to_mesh(o.data);bm.free();o.data.update()
  for poly in o.data.polygons:poly.use_smooth=True
  if original.name=='VRay-05':
   mod=o.modifiers.new('Ceramic smoothing','SUBSURF');mod.levels=2;mod.render_levels=2
   bpy.ops.object.modifier_apply(modifier=mod.name)
  if name=='macbook-open':
   # Keep broad deck faces strictly planar; smooth only the rounded perimeter.
   for poly in o.data.polygons:
    if abs(poly.normal.z)>.9 and poly.area>.05:poly.use_smooth=False
   normal=o.modifiers.new('Planar aluminium normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=50
   bpy.ops.object.modifier_apply(modifier=normal.name)
  o.name=name+'-'+original.name;o.select_set(True);copies.append(o)
 bpy.context.view_layer.objects.active=copies[0]
 bpy.ops.export_scene.gltf(filepath=os.path.join(out,name+'.glb'),export_format='GLB',export_apply=True,use_selection=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_animations=False)
 print('EXPORTED',name,'dimensions cm',tuple((hi-lo)*100))
 for o in copies:bpy.data.objects.remove(o,do_unlink=True)
