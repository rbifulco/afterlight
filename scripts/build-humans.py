"""Original smoothly skinned street residents, modeled in Blender. Y-up design coordinates."""
import bpy, math, os
from mathutils import Vector

def xyz(p): return (p[0],-p[2],p[1])
def material(name,c,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*c,1);n.inputs['Roughness'].default_value=rough;return m

def build(kind,path):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 coat=material('Waxed petrol cotton',(.17,.23,.235));pants=material('Charcoal technical knit',(.032,.043,.05));skin=material('Face in hood shadow',(.44,.28,.20),.72);hair=material('Dark hair',(.022,.018,.016));sole=material('Rubber sole',(.014,.019,.023));trim=material('Garment stitching',(.11,.15,.155));objects=[]
 def mesh(name,verts,faces,mat,region):
  data=bpy.data.meshes.new(name);data.from_pydata([xyz(v) for v in verts],[],faces);data.materials.append(mat);o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o['region']=region;objects.append(o)
  for p in data.polygons:p.use_smooth=True
  return o
 def loft(name,rings,mat,region,n=32):
  vs=[]
  for y,rx,rz,cx,cz in rings:
   for i in range(n):
    a=i*math.tau/n;fold=1+.009*math.sin(5*a+y*3);vs.append((cx+math.cos(a)*rx*fold,y,cz+math.sin(a)*rz*fold))
  fs=[tuple(reversed(range(n))),tuple(range(len(vs)-n,len(vs)))]
  for j in range(len(rings)-1):
   for i in range(n):a=j*n+i;b=j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
  return mesh(name,vs,fs,mat,region)
 def ellipsoid(name,p,scale,mat,region):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=xyz(p));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o['region']=region;objects.append(o)
  for f in o.data.polygons:f.use_smooth=True
  return o
 def unite(parts,name,voxel=.014):
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=parts[0];o.name=name
  rem=o.modifiers.new('Continuous cloth volume','REMESH');rem.mode='VOXEL';rem.voxel_size=voxel;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
  sm=o.modifiers.new('Soft cloth surface','SMOOTH');sm.factor=.6;sm.iterations=4;bpy.ops.object.modifier_apply(modifier=sm.name)
  dec=o.modifiers.new('Surface economy','DECIMATE');dec.ratio=.28;bpy.ops.object.modifier_apply(modifier=dec.name)
  for f in o.data.polygons:f.use_smooth=True
  return o
 long=kind in ['courier','coat'];hem=.57 if long else .87
 clothes=[loft('Tailored garment',[(hem,.25 if long else .215,.145,0,0),(.91,.212,.132,0,0),(1.04,.201,.125,0,0),(1.20,.217,.136,0,0),(1.36,.239,.123,0,-.008),(1.43,.211,.112,0,-.004),(1.48,.132,.095,0,0)],coat,'cloth')]
 for s in [-1,1]:
  clothes.append(loft('Continuous sleeve',[(.82,.051,.055,s*.303,.025),(.91,.057,.063,s*.3,.018),(1.03,.064,.068,s*.292,.008),(1.12,.068,.072,s*.285,0),(1.25,.077,.082,s*.265,0),(1.37,.085,.091,s*.227,0),(1.425,.078,.085,s*.195,-.002)],coat,'cloth'))
 garment=unite(clothes,'Continuous tailored outerwear')
 # A single trouser volume smoothly bridges the hips and both knees.
 trousers=[loft('Trouser hips',[(.80,.176,.106,0,0),(.91,.188,.112,0,0),(.98,.185,.111,0,0)],pants,'legs')]
 for s in [-1,1]:
  trousers.append(loft('Trouser leg',[(.12,.061,.068,s*.105,-.01),(.20,.063,.075,s*.107,-.005),(.35,.072,.084,s*.112,0),(.49,.077,.083,s*.113,.006),(.64,.089,.094,s*.108,0),(.81,.096,.105,s*.103,0),(.91,.094,.099,s*.099,0)],pants,'legs'))
  ellipsoid('Low leather boot',(s*.107,.084,.049),(.078,.083,.155),pants,'foot'+str(s));ellipsoid('Boot outsole',(s*.107,.035,.053),(.08,.027,.159),sole,'foot'+str(s))
  ellipsoid('Hand',(s*.303,.755,.029),(.036,.067,.029),pants if kind=='courier' else skin,'hand'+str(s));ellipsoid('Thumb',(s*.272,.77,.053),(.018,.038,.022),pants if kind=='courier' else skin,'hand'+str(s))
 unite(trousers,'Continuous trousers',.012)
 loft('Neck',[(1.44,.060,.060,0,0),(1.58,.06,.056,0,.006)],skin,'head')
 loft('Face',[(1.545,.049,.052,0,.023),(1.57,.067,.067,0,.021),(1.625,.088,.079,0,.014),(1.70,.097,.084,0,.006),(1.765,.084,.070,0,-.004),(1.79,.049,.047,0,-.01)],skin,'head')
 ellipsoid('Nose bridge',(0,1.658,.092),(.019,.039,.027),skin,'head');ellipsoid('Nose tip',(0,1.638,.108),(.023,.014,.018),skin,'head')
 for s in [-1,1]:
  ellipsoid('Ear',(s*.095,1.655,.003),(.018,.032,.021),skin,'head')
  ellipsoid('Eye shadow',(s*.040,1.695,.086),(.020,.006,.004),hair,'head')
 # Hair is shaped around the skull rather than a separate oversized cap.
 loft('Cropped hair',[(1.705,.098,.085,0,.002),(1.762,.09,.077,0,-.003),(1.802,.05,.052,0,-.013),(1.812,.012,.018,0,-.015)],hair,'head')
 if kind in ['courier','coat']:
  vs=[];n=32
  for y,rx,rz,z in [(1.45,.11,.11,-.025),(1.54,.133,.126,-.019),(1.69,.139,.136,-.018),(1.82,.103,.110,-.025),(1.85,.025,.040,-.022)]:
   for i in range(n):a=.70+i*(math.tau-1.40)/(n-1);vs.append((math.sin(a)*rx,y,z+math.cos(a)*rz))
  fs=[]
  for j in range(4):
   for i in range(n-1):k=j*n+i;fs.append((k,k+1,k+1+n,k+n))
  hood=mesh('Soft open hood',vs,fs,coat,'head');mod=hood.modifiers.new('Fabric thickness','SOLIDIFY');mod.thickness=.008
 if kind=='apron':
  vs=[(-.14,1.36,.142),(.14,1.36,.142),(-.18,1.02,.15),(.18,1.02,.15),(-.21,.61,.17),(.21,.61,.17)];ap=mesh('Work apron',vs,[(0,1,3,2),(2,3,5,4)],material('Canvas apron',(.48,.40,.30)),'body');sol=ap.modifiers.new('Apron edge','SOLIDIFY');sol.thickness=.007
 # Stable pivots: all rest bone axes face up, giving each bend a consistent local X axis.
 bpy.ops.object.select_all(action='DESELECT');armData=bpy.data.armatures.new('Street human skeleton');arm=bpy.data.objects.new('human',armData);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 bones={'body':((0,0,0),None),'head':((0,1.50,0),'body')}
 for s in [-1,1]:
  suffix='L' if s<0 else 'R';bones['leg_'+suffix]=((s*.106,.90,0),'body');bones['knee_'+suffix]=((s*.11,.49,0),'leg_'+suffix);bones['arm_'+suffix]=((s*.23,1.405,0),'body');bones['elbow_'+suffix]=((s*.285,1.105,0),'arm_'+suffix);bones['tail_'+suffix]=((s*.11,.91,0),'body')
 for name,(pos,parent) in bones.items():
  b=armData.edit_bones.new(name);b.head=xyz(pos);b.tail=xyz((pos[0],pos[1]+.10,pos[2]));
  if parent:b.parent=armData.edit_bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT')
 def blend(v,a,b):return max(0,min(1,(v-a)/(b-a)))
 for o in list(bpy.context.scene.objects):
  if o.type!='MESH':continue
  region=o.get('region','body');bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  # Geometry stays in one coherent space; only vertex weights articulate joints.
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  if region in ['cloth','legs']:
   # Broad tension folds; avoid repeated ribbing or armor-like rings.
   for v in o.data.vertices:
    x,zneg,y=v.co;z=-zneg
    zones=math.exp(-((y-1.11)/.14)**2)+.6*math.exp(-((y-.98)/.12)**2) if region=='cloth' else math.exp(-((y-.49)/.15)**2)+.45*math.exp(-((y-.19)/.10)**2)
    wave=math.sin(y*43+x*19+z*11)+.35*math.sin(y*71-x*13)
    radial=Vector((x if region=='cloth' and abs(x)<.19 else x-(.28 if x>0 else -.28) if region=='cloth' else x-(.107 if x>0 else -.107),zneg,0))
    if radial.length:radial.normalize();v.co+=radial*(wave*zones*.0045)
  for name in bones:o.vertex_groups.new(name=name)
  for v in o.data.vertices:
   x,zneg,y=v.co;s='L' if x<0 else 'R';weights={'body':1}
   if region=='head':weights={'head':1}
   elif region.startswith('hand'):weights={'elbow_'+s:1}
   elif region.startswith('foot'):weights={'knee_'+s:1}
   elif region=='legs':
    hip=blend(y,.80,.94);knee=1-blend(y,.40,.58);weights={'body':hip,'leg_'+s:(1-hip)*(1-knee),'knee_'+s:(1-hip)*knee}
   elif region=='cloth' and abs(x)>.18 and y>.78:
    sleeve=blend(abs(x),.185,.26);shoulder=1-blend(y,1.32,1.46);sleeve*=shoulder;knee=1-blend(y,1.02,1.19);weights={'body':1-sleeve,'arm_'+s:sleeve*(1-knee),'elbow_'+s:sleeve*knee}
   for name,w in weights.items():
    if w>.0001:o.vertex_groups[name].add([v.index],w,'REPLACE')
  o.parent=arm;mod=o.modifiers.new('Soft joint deformation','ARMATURE');mod.object=arm
  # UVs for the project's original fabric texture.
  bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
 # Join by material: a few skinned draws, retaining smooth joint weights.
 groups={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for obs in groups.values():
  if len(obs)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join()
 bpy.ops.export_scene.gltf(filepath=os.path.abspath(path),export_format='GLB',export_apply=False)
 print('HUMAN_EXPORTED',kind,path)

for kind,path in [('courier','public/assets/courier.glb'),('jacket','public/assets/resident.glb'),('coat','public/assets/resident-coat.glb'),('apron','public/assets/resident-apron.glb')]:build(kind,path)
