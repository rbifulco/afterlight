"""Original civilian variation of the articulated courier, using its tailoring rig.
Removes courier equipment and face hardware; adds an uncovered face and knit cap.
"""
from pathlib import Path
source=Path(__file__).with_name('build-courier.py').read_text()
start=source.index('# Rounded hood')
end=source.index('# Apply all transforms',start)
source=source[:start]+'''
# Civilian face, ears and a soft knit cap, without the courier's mask or equipment.
head=empty('head',(0,0,0),body)
shell('Civilian neck',[(1.44,.067,.065,0),(1.60,.065,.063,.018)],skin,head)
shell('Civilian face',[(1.54,.062,.066,.035),(1.61,.102,.09,.035),(1.72,.112,.09,.025),(1.80,.085,.075,.01)],skin,head,n=20)
box('Nose',(0,1.68,.121),(.039,.062,.049),skin,head,.014)
for side in [-1,1]:
 box('Eye',(side*.046,1.72,.111),(.027,.012,.009),dark,head,.005)
 shell('Ear',[(1.64,.017,.022,0),(1.70,.019,.026,0),(1.73,.010,.017,0)],skin,head,n=10).location.x=side*.108
shell('Knit cap',[(1.745,.115,.097,.012),(1.81,.110,.092,.006),(1.86,.060,.055,.002),(1.868,.012,.014,0)],dark,head,n=20,fold=.012)
shell('Ribbed cap brim',[(1.743,.118,.10,.013),(1.785,.116,.099,.012)],dark,head,n=20,fold=.018)
''' +source[end:]
source=source.replace("'Gloved hand',(0,-.33,.054),(.080,.112,.082),dark", "'Gloved hand',(0,-.33,.054),(.080,.112,.082),skin")
source=source.replace(" if s>0:box('Wrist glass',(0,-.18,.118),(.075,.085,.018),cyan,elbow,.009)", '')
source=source.replace("(.24,.145,.10)","(.43,.28,.20)")
source=source.replace("public/assets/courier.glb","public/assets/resident.glb").replace('COURIER_EXPORTED','RESIDENT_EXPORTED')
exec(compile(source,str(Path(__file__).with_name('build-courier.py')),'exec'))
