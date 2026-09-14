"""Original Afterlight vehicles. Blender 5: --background --python scripts/build-vehicles.py.
Coordinates below are game coordinates: +Y up, +Z forward. No downloaded meshes.
"""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.abspath('public/assets')
def xyz(p):return (p[0],-p[2],p[1])
def material(name,c,metal=0,rough=.45,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
paint=material('Body enamel',(.115,.26,.30),.72,.26)
trim=material('Graphite polymer',(.022,.033,.038),.25,.39)
rubber=material('Tire rubber',(.012,.016,.019),.0,.84)
alloy=material('Machined alloy',(.36,.43,.45),.9,.25)
glass=material('Smoked blue glass',(.045,.13,.18),.8,.12)
seat=material('Worn upholstery',(.095,.085,.069),0,.92)
white=material('Headlight ceramic',(.76,.91,1),.2,.18,2.7)
red=material('Tail light red',(1,.014,.01),.2,.2,3)
amber=material('Signal amber',(1,.36,.035),.15,.2,2)
# Generated surface wear is applied as a height map in Three.js, not exported as a tangent normal.
parts=[]
def mesh(name,vertices,faces,m):
 data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in vertices],[],faces);data.materials.append(m);o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);parts.append(o);return o
def bevel(o,width=.025,segments=3):
 m=o.modifiers.new('Manufactured edge radii','BEVEL');m.width=width;m.segments=segments;o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');return o
def box(name,p,s,m,be=.018):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);parts.append(o)
 if be:bevel(o,be)
 return o
def cyl(name,p,r,depth,m,axis='x',vertices=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=xyz(p));o=bpy.context.object;o.name=name
 if axis=='x':o.rotation_euler[1]=math.pi/2
 elif axis=='z':o.rotation_euler[0]=math.pi/2
 o.data.materials.append(m);parts.append(o);bevel(o,.008,2)
 for f in o.data.polygons:f.use_smooth=True
 return o
def tube(name,points,r,m):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2;s=curve.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*xyz(p),1)
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(m);parts.append(o);return o
def section_hull(name,sections,m):
 # Smooth longitudinal surfacing with a rounded shoulder rather than six large
 # planar wedges. Monotone interpolation avoids ripples in the body panels.
 dense=[]
 for i in range(len(sections)-1):
  a,b=sections[i],sections[i+1];previous=sections[max(0,i-1)];following=sections[min(len(sections)-1,i+2)];length=b[0]-a[0]
  for j in range(6):
   t=j/6;values=[a[0]+length*t]
   for k in range(1,5):
    left=(b[k]-previous[k])/(b[0]-previous[0]);right=(following[k]-a[k])/(following[0]-a[0])
    v=(2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*length*left+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*length*right
    values.append(max(min(a[k],b[k]),min(max(a[k],b[k]),v)))
   dense.append(values)
 dense.append(sections[-1]);vs=[]
 for z,w,bottom,shoulder,top in dense:
  vs.extend([(x,y,z) for x,y in [(-w*.88,bottom),(w*.88,bottom),(w*.97,bottom+.055),(w,shoulder-.035),(w*.98,shoulder+.025),(w*.90,top-.015),(w*.68,top),(0,top+.008),(-w*.68,top),(-w*.90,top-.015),(-w*.98,shoulder+.025),(-w,shoulder-.035),(-w*.97,bottom+.055)]])
 n=13;fs=[tuple(reversed(range(n))),tuple(range(len(vs)-n,len(vs)))]
 for j in range(len(dense)-1):
  for k in range(n):a=j*n+k;b=j*n+(k+1)%n;fs.append((a,b,b+n,a+n))
 ob=mesh(name,vs,fs,m)
 for f in ob.data.polygons:f.use_smooth=True
 return bevel(ob,.018,3)
def cut_arches(body,zs):
 # Actual negative wheel wells; arches are not black circles pasted over a solid side.
 for z in zs:
  bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=.49,depth=3,location=xyz((0,.44,z)));cut=bpy.context.object;cut.rotation_euler[1]=math.pi/2
  bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Recessed wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
def wheel(x,z):
 prefix='wheel_%s_%s'%('L' if x<0 else 'R','F' if z>0 else 'R');before=len(parts)
 tire=cyl(prefix+' tire',(x,.44,z),.433,.235,rubber,vertices=48)
 tire.modifiers[0].width=.028;tire.modifiers[0].segments=3
 side=1 if x<0 else -1
 outward=-side;outer=x+outward*.124
 cyl(prefix+' rim well',(outer,.44,z),.306,.015,trim,vertices=48)
 cyl(prefix+' satin aero face',(outer+outward*.013,.44,z),.280,.025,alloy,vertices=48)
 for radius,minor in [(.297,.012),(.116,.006)]:
  bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=6,location=xyz((outer+outward*.034,.44,z)),major_radius=radius,minor_radius=minor);o=bpy.context.object;o.rotation_euler[1]=math.pi/2;o.data.materials.append(alloy);parts.append(o)
 # Five recessed slots read as a designed aero wheel, with a solid central hub.
 for i in range(5):
  a=i*math.tau/5+.2;vs=[]
  for radius,angle in [(.153,a),(.252,a+.05),(.250,a+.55),(.170,a+.35)]:vs.append((outer+outward*.029,.44+math.cos(angle)*radius,z+math.sin(angle)*radius))
  mesh(prefix+' cooling slot',vs,[(0,1,2,3)],trim)
 cyl(prefix+' center cap',(outer+outward*.040,.44,z),.079,.012,paint,vertices=24)
 for ob in parts[before:]:ob['assembly']=prefix
 return prefix

def sedan():
 body=section_hull('Continuous sedan body',[(-2.43,.89,.32,.75,.86),(-2.12,1.00,.32,.87,.98),(-1.48,1.025,.32,.91,1.025),(0,1.025,.32,.90,1.01),(1.48,1.025,.33,.86,.965),(2.08,.995,.34,.765,.88),(2.32,.885,.35,.72,.825),(2.48,.64,.36,.69,.79)],paint)
 cut_arches(body,[-1.48,1.48]);box('Underbody',(0,.29,0),(1.73,.13,4.05),trim,.04)
 # Continuous curved glass greenhouse: sides, rear sweep and windshield meet
 # at one roof line rather than separate disconnected quadrilateral plates.
 sections=[(-1.51,.84,1.015),(-1.02,.745,1.425),(-.72,.72,1.515),(.14,.71,1.545),(.45,.735,1.49),(1.18,.88,.985)]
 smoothSections=[]
 for i in range(len(sections)-1):
  a,b=sections[i],sections[i+1];previous=sections[max(0,i-1)];following=sections[min(len(sections)-1,i+2)];length=b[0]-a[0]
  for j in range(6):
   t=j/6;values=[a[0]+length*t]
   for k in [1,2]:
    left=(b[k]-previous[k])/(b[0]-previous[0]);right=(following[k]-a[k])/(following[0]-a[0])
    values.append((2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*length*left+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*length*right)
   smoothSections.append(values)
 smoothSections.append(sections[-1]);sections=smoothSections
 vertices=[]
 for z,w,y in sections:
  for i in range(13):
   u=-1+i/6;vertices.append((u*w,y+.034*(1-u*u),z))
 faces=[]
 for j in range(len(sections)-1):
  for i in range(12):k=j*13+i;faces.append((k,k+1,k+14,k+13))
 canopy=mesh('Swept panoramic glass',vertices,faces,glass)
 for f in canopy.data.polygons:f.use_smooth=True
 roof=section_hull('Continuous roof panel',[(-.90,.706,1.470,1.502,1.528),(-.65,.71,1.505,1.537,1.56),(.10,.70,1.523,1.554,1.573),(.30,.705,1.493,1.525,1.547)],paint)
 for side in [-1,1]:
  for i in range(len(sections)-1):
   z,w,y=sections[i];zz,ww,yy=sections[i+1]
   ob=mesh('Side glazing',[(side*.925,1.01,z),(side*w,y,z),(side*ww,yy,zz),(side*.925,1.01,zz)],[(0,1,2,3)],glass)
  tube('Glass perimeter',[(side*w,y,z) for z,w,y in sections],.021,trim)
  tube('Satin belt trim',[(side*.92,1.014,-1.50),(side*.96,1.014,-.7),(side*.96,1.006,.6),(side*.90,.995,1.2)],.015,alloy)
  tube('Roof pillar',[(side*.91,1.012,-.30),(side*.713,1.544,-.30)],.028,trim)
  tube('Front pillar',[(side*.895,1.01,1.19),(side*.736,1.493,.45),(side*.71,1.55,.14)],.025,paint)
  tube('Rear sail pillar',[(side*.845,1.025,-1.5),(side*.752,1.43,-1.02),(side*.72,1.52,-.72)],.034,paint)
  for z in [-.26,-1.00]:tube('Fine door shut line',[(side*1.018,.945,z),(side*1.025,.64,z),(side*.955,.38,z+.08)],.005,trim)
  for z in [-.73,.42]:box('Flush handle',(side*1.027,.892,z),(.018,.027,.205),alloy,.009)
  box('Lower rocker',(side*.965,.35,0),(.10,.09,1.96),trim,.025)
  for z in [-1.48,1.48]:
   tube('Fender return',[(side*1.022,.44+math.sin(a)*.49,z+math.cos(a)*.49) for a in [i*math.pi/32 for i in range(33)]],.019,paint)
   # Deep black inner wheel liner behind the actual negative arch.
   cyl('Wheel liner',(side*.88,.44,z),.468,.035,trim,vertices=48)
   wheel(side*.99,z)
  box('Mirror pedestal',(side*1.015,1.07,.76),(.20,.033,.045),trim,.015)
  box('Aerodynamic mirror',(side*1.13,1.095,.73),(.23,.115,.24),paint,.052)
  box('Mirror face',(side*1.13,1.096,.603),(.17,.072,.010),glass,.018)
  box('Seat cushion',(side*.43,.86,-.04),(.53,.12,.56),seat,.065)
  box('Seat back',(side*.43,1.12,-.40),(.51,.52,.14),seat,.065)
  box('Seat headrest',(side*.43,1.40,-.43),(.27,.17,.12),seat,.05)
  box('Amber corner lamp',(side*.902,.69,2.28),(.024,.035,.17),amber,.008)
  tube('Rear blade lamp',[(side*.10,.82,-2.448),(side*.64,.82,-2.446),(side*.86,.80,-2.39)],.017,red)
 box('Dashboard',(0,1.04,.83),(1.46,.12,.33),trim,.035)
 lightPath=[(-.90,.744,2.295),(-.76,.758,2.428),(-.45,.765,2.488),(0,.766,2.494),(.45,.765,2.488),(.76,.758,2.428),(.90,.744,2.295)]
 mask=[]
 for x,y,z in lightPath:mask.extend([(x,y-.065,z-.015),(x,y+.034,z-.015)])
 mesh('Curved front light surround',mask,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(lightPath)-1)],trim)
 tube('Continuous front light blade',lightPath,.016,white)
 box('Lower front intake',(0,.485,2.419),(1.29,.095,.058),trim,.028)
 tube('Satin bumper blade',[(-.80,.385,2.32),(0,.385,2.48),(.80,.385,2.32)],.014,alloy)
 box('Rear bumper',(0,.40,-2.405),(1.84,.11,.15),trim,.035)
 box('Rear plate',(0,.62,-2.447),(.39,.135,.015),alloy,.009)
 for side in [-1,1]:tube('Hood shut line',[(side*.66,1.004,1.0),(side*.68,.95,1.51),(side*.66,.835,2.10),(side*.61,.80,2.28)],.004,trim)
 box('Shark fin antenna',(.45,1.63,-.67),(.04,.115,.13),trim,.018)
 lid=box('trunk_lid',(0,1.025,-1.64),(1.60,.018,.72),paint,.007);lid['assembly']='trunk_lid'

def van():
 body=section_hull('Van body',[(-2.5,.97,.34,.84,1.00),(-2.2,1.06,.32,.92,1.04),(1.55,1.06,.32,.85,.94),(2.35,.94,.34,.66,.76)],paint);cut_arches(body,[-1.55,1.45]);box('Chassis',(0,.30,0),(1.85,.13,4.4),trim)
 section_hull('Cargo upper shell',[(-2.3,1.02,.96,1.82,2.15),(-1.98,1.02,.96,2.0,2.19),(.55,1.02,.96,1.99,2.17),(1.05,.94,.96,1.90,2.03)],paint)
 mesh('Van windshield',[(-.9,1.02,2.08),(-.90,1.95,.97),(.90,1.95,.97),(.9,1.02,2.08)],[(0,1,2,3)],glass)
 box('Van cab roof',(0,2.04,.66),(1.91,.10,.80),paint)
 for s in [-1,1]:
  mesh('Cab side glass',[(s*1.04,1.08,.28),(s*.96,1.98,.28),(s*.90,1.95,.95),(s*.94,1.07,1.99)],[(0,1,2,3)],glass)
  tube('Cab frame',[(s*1.06,1.04,.22),(s*1.02,2.03,.22),(s*.93,2.04,1.0),(s*.97,1.00,2.14)],.045,paint)
  box('Sliding door inset',(s*1.025,1.48,-.88),(.035,.90,1.79),trim)
  box('Sliding door panel',(s*1.052,1.49,-.90),(.025,.84,1.72),paint)
  for y in [1.13,1.26,1.39]:box('Pressed cargo rib',(s*1.071,y,-.89),(.025,.018,1.48),alloy,.004)
  box('Cargo rail',(s*1.095,1.82,-.82),(.06,.035,2.23),trim)
  box('Cargo handle',(s*1.10,1.64,-.10),(.05,.14,.055),alloy)
  box('Mirror arm',(s*1.1,1.31,1.73),(.35,.04,.07),alloy);box('Van mirror',(s*1.25,1.43,1.72),(.15,.32,.20),trim)
  for z in [-1.55,1.45]:wheel(s*1.06,z)
  box('Van headlamp',(s*.64,.76,2.32),(.4,.12,.045),white)
  box('Van tail lamps',(s*.91,1.0,-2.39),(.13,.41,.06),red)
  tube('Roof cargo rail',[(s*.77,2.24,-2.05),(s*.77,2.31,-1.90),(s*.77,2.31,.2),(s*.77,2.24,.3)],.035,alloy)
 for z in [-1.80,-.6,.15]:box('Roof cross member',(0,2.30,z),(1.58,.04,.055),alloy)
 box('Rooftop refrigeration',(0,2.36,-1.00),(1.20,.22,1.18),trim,.05)
 for k in range(9):box('Refrigeration grille',(-.48+k*.12,2.48,-1.0),(.047,.015,.98),alloy,.002)
 box('Front bumper',(0,.41,2.33),(1.96,.19,.18),trim)
 box('Rear bumper',(0,.40,-2.48),(2.01,.18,.22),trim)
 for s in [-1,1]:box('Rear cargo door',(s*.47,1.46,-2.325),(.88,1.19,.055),paint);box('Rear door latch',(s*.12,1.25,-2.37),(.045,.43,.04),alloy)
 for k in range(7):box('Van grille',(0,.62+k*.034,2.36),(.66,.016,.025),alloy,.003)

def export(name,build):
 global parts;parts=[];bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);build()
 # Apply modifiers and group by material/animated assembly for compact draw calls.
 for o in list(parts):
  if o.type not in ['MESH','CURVE']:continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 groups={}
 for o in parts:
  key=(o.get('assembly','body'),o.data.materials[0].name);groups.setdefault(key,[]).append(o)
 for (assembly,m),obs in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=assembly+'__'+m
  bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,name+'.glb'),export_format='GLB',export_apply=True)
 print('VEHICLE_EXPORTED',name)
if __name__=='__main__':
 export('sedan',sedan);export('service-van',van)
