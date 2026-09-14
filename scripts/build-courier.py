"""Original human-proportioned articulated courier with tailored raincoat."""
import bpy,math,os
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def xyz(p):return (p[0],-p[2],p[1])
def mat(name,c,metal=0,rough=.5,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
coat=mat('Waxed petrol cotton',(.085,.14,.145),.05,.7);dark=mat('Charcoal technical knit',(.023,.034,.041),0,.86);rubber=mat('Rubber sole',(.012,.018,.02),.05,.8);armor=mat('Brushed equipment alloy',(.12,.19,.19),.65,.36);skin=mat('Face in hood shadow',(.24,.145,.10),0,.7);cyan=mat('Low power cyan indicators',(.03,.55,.68),.2,.4,1.8);amber=mat('Amber courier seal',(.9,.38,.08),.2,.5,1)
def empty(name,p,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=xyz(p);o.parent=parent;return o
root=empty('courier',(0,0,0));body=empty('body',(0,0,0),root)
def mesh(name,v,f,m,parent=body):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in v],[],f);d.materials.append(m);o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.parent=parent;return o
def shell(name,rings,m,parent=body,n=16,fold=0):
 v=[]
 for j,(y,rx,rz,z) in enumerate(rings):
  for i in range(n):a=i*math.tau/n;r=1+fold*math.sin(i*5.7+j*.6);v.append((math.cos(a)*rx*r,y,z+math.sin(a)*rz*r))
 f=[tuple(reversed(range(n))),tuple(range(len(v)-n,len(v)))]
 for j in range(len(rings)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 o=mesh(name,v,f,m,parent)
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(name,p,s,m,parent=body,be=.018):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=xyz(p);o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if be:mod=o.modifiers.new('Soft tailored edges','BEVEL');mod.width=be;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def tube(name,pts,r,m,parent=body):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=2;s=d.splines.new('POLY');s.points.add(len(pts)-1)
 for p,q in zip(s.points,pts):p.co=(*xyz(q),1)
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(m);return o
shell('Tailored torso',[(.85,.23,.135,0),(1.03,.215,.145,0),(1.25,.224,.14,0),(1.40,.250,.133,0),(1.47,.218,.118,0),(1.50,.17,.105,0)],coat,fold=.012)
shell('Underlayer collar',[(1.44,.13,.12,0),(1.59,.105,.09,0)],dark)
# Lapels, front storm flap and stitched garment panels replace armor blocks.
for s in [-1,1]:
 mesh('Folded lapel',[(s*.035,1.42,.153),(s*.15,1.52,.1),(s*.215,1.36,.12),(s*.08,1.12,.15)],[(0,1,2,3)],coat)
 tube('Panel seam',[(s*.16,.86,.105),(s*.13,1.1,.135),(s*.21,1.34,.125)],.006,armor)
 box('Angled welt pocket',(s*.16,1.06,.133),(.12,.025,.022),dark,be=.005)
box('Storm flap',(.025,1.20,.152),(.047,.46,.018),coat,be=.005)
for y in [1.04,1.17,1.31]:box('Snap fastener',(.025,y,.166),(.012,.012,.009),armor,be=.003)
# Independent leg, knee, upper-arm and elbow pivots.
for s in [-1,1]:
 suffix='L' if s<0 else 'R';leg=empty('leg_'+suffix,(s*.125,.86,0),root)
 shell('Tapered trouser',[(0,.093,.094,0),(-.16,.09,.09,0),(-.30,.080,.084,.002),(-.40,.074,.079,.005)],dark,leg,fold=.018)
 knee=empty('knee_'+suffix,(0,-.4,0),leg)
 shell('Trouser cuff',[(.005,.075,.080,0),(-.12,.071,.076,-.005),(-.24,.059,.068,0),(-.32,.057,.065,0)],dark,knee,fold=.02)
 box('Boot sole',(0,-.385,.053),(.155,.055,.27),rubber,knee,.025)
 box('Leather boot',(0,-.327,.052),(.15,.108,.25),dark,knee,.05)
 shell('Boot ankle',[(-.31,.07,.077,-.015),(-.22,.066,.069,-.015)],dark,knee)
 for y in [-.29,-.265,-.24]:tube('Boot lacing',[(-.038,y,.063),(.038,y+.008,.063)],.005,armor,knee)
 arm=empty('arm_'+suffix,(s*.237,1.415,0),body)
 shell('Upper sleeve',[(.035,.083,.092,0),(-.06,.086,.092,0),(-.16,.078,.084,.005),(-.30,.066,.071,.015)],coat,arm,fold=.02)
 elbow=empty('elbow_'+suffix,(0,-.30,.015),arm)
 shell('Forearm sleeve',[(.015,.066,.071,0),(-.08,.064,.069,.018),(-.17,.057,.062,.039),(-.26,.050,.055,.047)],coat,elbow,fold=.018)
 shell('Ribbed cuff',[(-.257,.052,.057,.05),(-.285,.051,.056,.05)],dark,elbow)
 box('Gloved hand',(0,-.33,.054),(.080,.112,.082),dark,elbow,.036)
 if s>0:box('Wrist glass',(0,-.18,.118),(.075,.085,.018),cyan,elbow,.009)
 tail=empty('tail_'+suffix,(s*.115,.9,-.015),body)
 # Two articulated halves meet to form one continuous tailored coat hem.
 # Unlike the old pair of capped cylinders, the hem has no inflated inner lobes.
 v=[];n=17
 for y,rx,rz in [(0,.235,.145),(-.18,.255,.158),(-.44,.278,.172)]:
  for i in range(n):
   angle=(-math.pi/2 if s>0 else math.pi/2)+i*math.pi/(n-1)
   v.append((math.cos(angle)*rx-s*.115,y,math.sin(angle)*rz-.010))
 f=[]
 for row in range(2):
  for i in range(n-1):
   k=row*n+i;f.append((k,k+1,k+n+1,k+n))
 hem=mesh('Continuous raincoat hem',v,f,coat,tail)
 for face in hem.data.polygons:face.use_smooth=True
 thickness=hem.modifiers.new('Bound fabric edge','SOLIDIFY');thickness.thickness=.007
# Rounded hood with an actual face opening toward +Z.
v=[];n=20
for y,rx,rz,z in [(1.48,.15,.14,-.025),(1.61,.169,.166,-.026),(1.79,.165,.155,-.031),(1.885,.067,.084,-.025)]:
 for i in range(n):a=math.pi*.15+i*math.pi*1.70/(n-1);v.append((math.sin(a)*rx,y,z+math.cos(a)*rz))
f=[]
for j in range(3):
 for i in range(n-1):a=j*n+i;f.append((a,a+1,a+n+1,a+n))
f.append(tuple(range(3*n,4*n)));hood=mesh('Sewn cloth hood',v,f,coat);sol=hood.modifiers.new('Hood fabric thickness','SOLIDIFY');sol.thickness=.014
for p in hood.data.polygons:p.use_smooth=True
for s in [-1,1]:tube('Hood opening seam',[(s*.07,1.49,.106),(s*.094,1.61,.154),(s*.09,1.80,.13),(s*.03,1.91,.045)],.012,coat)
shell('Head in shadow',[(1.53,.065,.06,.025),(1.60,.095,.08,.035),(1.75,.10,.085,.03),(1.80,.07,.065,.01)],skin,n=16)
box('Tinted eye shield',(0,1.715,.113),(.164,.045,.035),dark,be=.013)
box('Left ocular glint',(-.055,1.718,.134),(.022,.009,.005),cyan,be=.002)
box('Filter mask',(0,1.635,.107),(.10,.075,.049),armor,be=.022)
for x in [-.029,0,.029]:box('Mask vent',(x,1.635,.136),(.009,.037,.006),dark,be=.002)
# Curved technical backpack with straps and a slim light strip, not a giant neon block.
box('Weatherproof courier pack',(0,1.22,-.19),(.30,.35,.115),coat,be=.065)
box('Pack back plate',(0,1.23,-.251),(.22,.23,.016),coat,be=.028)
for s in [-1,1]:tube('Harness strap',[(s*.14,.98,.11),(s*.17,1.4,.13),(s*.16,1.50,-.02),(s*.15,1.42,-.22)],.018,dark)
box('Parcel status strip',(0,1.26,-.262),(.10,.009,.006),cyan,be=.002)
box('Routing label',(0,1.17,-.262),(.105,.043,.005),cream if 'cream' in globals() else armor,be=.003)
box('Belt pouch',(.235,.98,-.035),(.085,.14,.085),dark,be=.026)
box('Courier seal',(.280,1.00,-.035),(.005,.028,.023),amber,be=.002)
# Apply all transforms/modifiers; UVs retained for generated cloth texture applied by the app.
for o in list(bpy.context.scene.objects):
 if o.type in ['MESH','CURVE']:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
# Join within pivot/material to preserve articulation and avoid one draw per button.
groups={}
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':groups.setdefault((o.parent,o.data.materials[0]),[]).append(o)
for (parent,m),obs in groups.items():
 if len(obs)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/assets/courier.glb'),export_format='GLB',export_apply=True)
print('COURIER_EXPORTED')
