"""Original stripped service android display for the Sekai repair shop."""
import bpy,math,os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c,metal,rough,emit=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
ivory=mat('Porcelain alloy',(.65,.64,.51),.65,.29);metal=mat('Exposed titanium',(.25,.32,.33),.9,.27);dark=mat('Carbon tendons',(.017,.023,.027),.35,.45);eye=mat('Diagnostic lens',(.01,.61,.71),.2,.3,2)
def xyz(p):return(p[0],-p[2],p[1])
def sphere(n,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=xyz(p));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def link(n,a,b,r1,r2,m):
 a=Vector(xyz(a));b=Vector(xyz(b));bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r1,radius2=r2,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.name=n;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(m);mod=o.modifiers.new('Soft panel perimeter','BEVEL');mod.width=.016;mod.segments=3;o.modifiers.new('Panel normals','WEIGHTED_NORMAL');return o
link('Spinal column',(0,.82,0),(0,1.42,0),.085,.085,metal)
for y in [.94,1.03,1.12,1.21,1.30]:sphere('Vertebra',(0,y,-.06),(.105,.035,.055),ivory)
sphere('Pelvic casing',(0,.83,0),(.18,.14,.11),ivory)
for s in [-1,1]:
 sphere('Pectoral plate',(s*.105,1.26,.052),(.13,.17,.12),ivory)
 link('Abdominal actuator',(s*.095,.91,.055),(s*.14,1.13,.065),.045,.05,dark)
 for y in [1.03,1.08,1.13]:link('Rib armor',(s*.04,y,.09),(s*.17,y+.035,.06),.013,.016,ivory)
 sphere('Shoulder joint',(s*.255,1.39,0),(.085,.085,.085),metal)
 link('Upper arm casing',(s*.27,1.36,0),(s*.32,1.08,.025),.08,.06,ivory)
 sphere('Elbow bearing',(s*.32,1.06,.025),(.064,.064,.064),dark)
 link('Forearm casing',(s*.32,1.01,.03),(s*.34,.8,.095),.069,.045,ivory)
 link('Forearm piston',(s*.37,1.03,.015),(s*.39,.83,.082),.013,.013,metal)
 sphere('Palm',(s*.34,.75,.1),(.052,.07,.033),metal)
 for k in range(4):
  x=s*.34+(k-1.5)*.021;link('Finger',(x,.73,.105),(x,.64,.115),.009,.008,ivory);sphere('Knuckle',(x,.7,.106),(.012,.014,.012),metal)
 sphere('Hip bearing',(s*.13,.77,0),(.08,.08,.08),dark)
 link('Thigh casing',(s*.13,.74,0),(s*.15,.47,.015),.09,.068,ivory)
 sphere('Knee bearing',(s*.15,.44,.015),(.066,.066,.066),metal)
 sphere('Kneecap',(s*.15,.45,.072),(.066,.072,.032),ivory)
 link('Shin casing',(s*.15,.40,0),(s*.16,.13,-.01),.061,.038,ivory)
 link('Achilles actuator',(s*.15,.38,-.04),(s*.16,.12,-.05),.023,.018,dark)
 sphere('Foot',(s*.16,.08,.045),(.067,.06,.13),ivory)
link('Neck',(0,1.42,0),(0,1.54,0),.044,.044,metal)
sphere('Cranial shell',(0,1.65,0),(.111,.15,.10),ivory)
sphere('Jaw casing',(0,1.56,.046),(.08,.054,.065),metal)
for s in [-1,1]:sphere('Optical socket',(s*.045,1.66,.089),(.039,.029,.017),dark);sphere('Lens',(s*.045,1.66,.106),(.021,.012,.01),eye)
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
groups={}
for o in list(bpy.context.scene.objects):groups.setdefault(o.data.materials[0],[]).append(o)
for m,obs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/assets/service-android.glb'),export_format='GLB',export_apply=True)
print('ANDROID_EXPORTED')
