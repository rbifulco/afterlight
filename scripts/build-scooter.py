"""Original delivery scooter, using the same manufacturing helpers as the cars."""
import runpy,math
m=runpy.run_path('scripts/build-vehicles.py',run_name='model_helpers')
box,cyl,tube,mesh,bevel=[m[k] for k in ['box','cyl','tube','mesh','bevel']]
paint,trim,rubber,alloy,white,red,amber=[m[k] for k in ['paint','trim','rubber','alloy','white','red','amber']]
def scooter():
 for z in [-.66,.72]:
  cyl('Road tire',(0,.29,z),.29,.16,rubber)
  for s in [-1,1]:
   cyl('Recessed rim',(s*.085,.29,z),.18,.014,trim)
   for i in range(5):
    a=i*math.tau/5;tube('Alloy spoke',[(s*.098,.29+math.cos(a)*.04,z+math.sin(a)*.04),(s*.098,.29+math.cos(a)*.17,z+math.sin(a)*.17)],.016,alloy)
   cyl('Axle cap',(s*.11,.29,z),.048,.02,alloy)
   tube('Fender rim',[(s*.10,.29+math.sin(a)*.33,z+math.cos(a)*.33)for a in [i*math.pi/16 for i in range(17)]],.031,paint)
 # Rounded battery side panels and a sculpted leg shield give the body its scooter silhouette.
 box('Battery enclosure',(0,.49,-.42),(.45,.38,.56),paint,.10)
 box('Seat cushion',(0,.78,-.36),(.43,.13,.64),rubber,.06)
 box('Seat underside',(0,.69,-.35),(.43,.045,.64),trim)
 box('Footboard',(0,.26,.08),(.39,.055,.70),trim,.035)
 for x in [-.12,-.06,0,.06,.12]:box('Footboard grip',(x,.292,.05),(.02,.008,.43),rubber,.002)
 verts=[(-.20,.31,.33),(.20,.31,.33),(.26,.78,.46),(.22,1.05,.59),(-.22,1.05,.59),(-.26,.78,.46),(-.13,.34,.48),(.13,.34,.48),(.18,.78,.62),(.16,1.04,.70),(-.16,1.04,.70),(-.18,.78,.62)]
 bevel(mesh('Formed front shield',verts,[(0,1,2,3,4,5),(6,11,10,9,8,7),(0,6,7,1),(1,7,8,2),(2,8,9,3),(3,9,10,4),(4,10,11,5),(5,11,6,0)],paint),.035)
 for s in [-1,1]:
  tube('Front fork',[(s*.07,.3,.72),(s*.07,.81,.58)],.026,alloy)
  tube('Handlebar',[(0,1.07,.63),(s*.26,1.12,.62),(s*.36,1.12,.55)],.023,alloy)
  tube('Rubber grip',[(s*.26,1.12,.62),(s*.38,1.12,.54)],.033,rubber)
  tube('Mirror stalk',[(s*.21,1.1,.63),(s*.24,1.33,.60)],.012,alloy)
  box('Mirror',(s*.24,1.35,.60),(.13,.08,.045),trim,.025)
  box('Indicator',(s*.22,.84,.63),(.07,.055,.065),amber)
  tube('Rear suspension',[(s*.13,.3,-.66),(s*.16,.62,-.37)],.023,alloy)
  for k in range(7):cyl('Cooling slots',(s*.231,.43+k*.03,-.44),.012,.014,trim)
 box('Headlamp bezel',(0,.96,.714),(.29,.13,.06),alloy,.035)
 box('Headlamp lens',(0,.96,.75),(.235,.085,.02),white,.025)
 box('Rear lamp',(0,.65,-.735),(.20,.06,.035),red)
 tube('Frame rail',[(-.17,.33,-.63),(-.17,.32,.23),(-.14,.78,.56)],.025,alloy)
 tube('Center stand',[(-.1,.25,-.12),(-.15,.015,-.12),(.15,.015,-.12),(.1,.25,-.12)],.018,trim)
 box('Delivery case',(0,1.02,-.83),(.59,.54,.50),trim,.045)
 box('Case lid',(0,1.31,-.83),(.61,.055,.53),paint,.025)
 for s in [-1,1]:box('Cargo latch',(s*.19,1.13,-.567),(.04,.095,.02),alloy)
 box('Cargo reflective stripe',(0,1.06,-1.088),(.44,.035,.009),amber,.003)
m['export']('delivery-scooter',scooter)
