"""Normalize the original stems, remove Foley pre-roll, and close loop seams.
Requires ffmpeg; operates only on generated local audio, never uses credentials.
"""
from pathlib import Path
import array,json,math,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1];RATE=44100
plan=json.loads((ROOT/'docs/soundscape-plan.json').read_text());report=[]
for stem in plan:
 src=ROOT/'.dream-loop/audio-raw'/f"{stem['id']}.mp3"
 channels=2 if stem['kind']=='bed' else 1
 result=subprocess.run(['ffmpeg','-v','error','-i',str(src),'-ac',str(channels),'-ar',str(RATE),'-af','highpass=f=35,loudnorm=I=-24:TP=-5:LRA=7','-f','f32le','-'],capture_output=True,check=True)
 samples=array.array('f');samples.frombytes(result.stdout);trim=0
 if stem['loop']:
  # Wrap overlap: end of this loop blends into its original beginning, then
  # begins at the end of that overlap. No silent gaps, zero-length fades or clicks.
  n=min(int(RATE*.18),len(samples)//channels//10);tailStart=len(samples)-n*channels
  tail=array.array('f')
  for frame in range(n):
   u=frame/(n-1);a=math.cos(u*math.pi/2);b=math.sin(u*math.pi/2)
   for c in range(channels):tail.append(samples[tailStart+frame*channels+c]*a+samples[frame*channels+c]*b)
  samples=samples[n*channels:tailStart]+tail
 else:
  # Steps start at the moment of contact, avoiding generated leading silence.
  if stem['kind']=='foley':
   peak=max(abs(v) for v in samples);threshold=peak*.065
   first=next((i//channels for i,v in enumerate(samples) if abs(v)>threshold),0)
   trim=max(0,first-int(.006*RATE));samples=samples[trim*channels:]
  frames=len(samples)//channels;fade=min(int(.015*RATE),frames//4)
  for i in range(fade):
   gain=(i/(fade-1))**.5
   for c in range(channels):samples[i*channels+c]*=gain;samples[(frames-1-i)*channels+c]*=gain
 peak=max(abs(v) for v in samples)
 if peak>.56:
  gain=.56/peak;samples=array.array('f',(v*gain for v in samples))
 target=ROOT/'public/audio'/f"{stem['id']}.mp3"
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac',str(channels),'-i','-','-codec:a','libmp3lame','-b:a','128k','-write_xing','1',str(target)],input=samples.tobytes(),check=True)
 # Verify decoded shipping files, including true peak and the loop discontinuity.
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','f32le','-ar',str(RATE),'-ac',str(channels),'-'],capture_output=True,check=True)
 final=array.array('f');final.frombytes(decoded.stdout);peak=max(abs(v) for v in final);rms=math.sqrt(sum(v*v for v in final)/len(final));seam=max(abs(final[c]-final[-channels+c]) for c in range(channels))
 entry={'id':stem['id'],'channels':channels,'seconds':round(len(final)/channels/RATE,3),'leadingTrimSeconds':round(trim/RATE,4),'peakDbFS':round(20*math.log10(max(peak,1e-12)),2),'rmsDbFS':round(20*math.log10(max(rms,1e-12)),2),'loopBoundaryDelta':round(seam,6) if stem['loop'] else None,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
 assert peak<.75 and rms>.0001,entry
 report.append(entry);print(json.dumps(entry),flush=True)
(ROOT/'docs/audio-assets.json').write_text(json.dumps(report,indent=2)+'\n')
print('Shipping audio bytes:',sum(x['bytes'] for x in report))
