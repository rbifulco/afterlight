"""Generate Afterlight's original sound stems with ElevenLabs.
The key is read only into process memory; never copied to the project or logged.
Usage: python3 scripts/generate-soundscape.py --key-file /path/to/.env [--check] [--only ID]
Existing assets are reused, so rerunning does not regenerate paid requests.
"""
from pathlib import Path
import argparse,os,re,json,urllib.request,urllib.error,time,hashlib
ROOT=Path(__file__).resolve().parents[1]
def load_key(path=None):
 for k in ['ELEVENLABS_API_KEY','ELEVEN_LABS_API_KEY']:
  if os.environ.get(k):return os.environ[k]
 if path:
  for line in Path(path).read_text().splitlines():
   m=re.match(r'\s*(?:export\s+)?(ELEVENLABS_API_KEY|ELEVEN_LABS_API_KEY)\s*=\s*(.*?)\s*$',line)
   if m:return m[2].strip().strip(chr(34)+chr(39))
 raise SystemExit('No ElevenLabs key configured.')
def request(key,path,payload=None):
 headers={'xi-api-key':key,'Content-Type':'application/json'}
 data=None if payload is None else json.dumps(payload).encode()
 try:
  with urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io/v1/'+path,data=data,headers=headers),timeout=180) as r:return r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:
  try:body=json.loads(e.read());detail=body.get('detail',{});code=detail.get('status','unknown') if isinstance(detail,dict) else 'request_error'
  except Exception:code='request_error'
  raise RuntimeError(f'ElevenLabs HTTP {e.code}: {code}') from None

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--key-file');parser.add_argument('--check',action='store_true');parser.add_argument('--only');args=parser.parse_args();key=load_key(args.key_file)
 data,_=request(key,'user/subscription');sub=json.loads(data);summary={k:sub.get(k) for k in ['tier','status','character_count','character_limit']};print(json.dumps(summary),flush=True)
 if args.check:return
 plan=json.loads((ROOT/'docs/soundscape-plan.json').read_text());receiptPath=ROOT/'docs/audio-generation.json';receipts=json.loads(receiptPath.read_text()) if receiptPath.exists() else []
 needed=[s for s in plan if (not args.only or s['id']==args.only) and not (ROOT/'.dream-loop/audio-raw'/f"{s['id']}.mp3").exists()]
 estimate=sum(s['seconds']*40 for s in needed)
 if sub.get('character_limit',0)-sub.get('character_count',0)<estimate:raise SystemExit('Not enough included credits for remaining stems; no generation started.')
 print(json.dumps({'pending':len(needed),'estimatedCredits':estimate}),flush=True)
 for stem in needed:
  payload={'text':stem['prompt'],'duration_seconds':stem['seconds'],'loop':stem['loop'],'model_id':'eleven_text_to_sound_v2','prompt_influence':.55}
  start=time.time();data,headers=request(key,'sound-generation?output_format=mp3_44100_128',payload)
  if len(data)<1000:raise RuntimeError('Generation returned an unexpectedly short audio file.')
  file=ROOT/'.dream-loop/audio-raw'/f"{stem['id']}.mp3";file.write_bytes(data)
  receipt={'id':stem['id'],'model':payload['model_id'],'durationRequested':stem['seconds'],'loop':stem['loop'],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'credits':headers.get('character-cost',headers.get('Character-Cost')),'generationSeconds':round(time.time()-start,2)}
  receipts.append(receipt);receiptPath.write_text(json.dumps(receipts,indent=2)+'\n');print(json.dumps(receipt),flush=True)
 data,_=request(key,'user/subscription');end=json.loads(data);print(json.dumps({'endingCharacterCount':end.get('character_count'),'startingCharacterCount':sub.get('character_count'),'creditsUsedThisRun':end.get('character_count',0)-sub.get('character_count',0)}),flush=True)
if __name__=='__main__':main()
