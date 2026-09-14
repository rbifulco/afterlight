import * as THREE from 'three';

const FILES=['rain-street','city-air','awning-rain','gutter-water','noodle-kitchen','shop-murmur','workshop-servo','projector-hum','metro-roll','wet-tires','cab-idle','boot-wet-a','boot-wet-b','wiper-sweep','cup-set-down','station-pa','alley-door','radio-jazz'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u)};

/** Locally hosted ElevenLabs stems, mixed against the actual world's clock.
 * No API calls or credentials exist in the browser. The first gesture unlocks
 * Web Audio; sounds stay attached to places and moving objects, not UI actions.
 */
export function createSoundscape(){
  const button=document.querySelector('#sound');
  let ctx,master,compressor,reverb,reverbReturn,analyser,booting,ready=false,muted=false;
  let lastT=null,lastHeroStep=null,lastWiper=null,lastAnnouncement=-1,lastDoor=-1,lastCup=null;
  let wetSteps=0,events=0,loadErrors=[],loading=false,started=false;
  let peak=0,rms=0,measureAt=0,timer=null;
  const buffers=new Map(),loops=[],sources=new Set(),walkerSteps=new Map();
  const ear=new THREE.Vector3(),forward=new THREE.Vector3(),up=new THREE.Vector3(),scratch=new THREE.Vector3();
  try{muted=localStorage.getItem('afterlight-sound')==='muted'}catch{}
  function label(){button.textContent=loading?'Sound: loading':loadErrors.length&&!ready?'Retry sound':!started?'Enable sound':muted?'Sound: off':'Sound: on';button.setAttribute('aria-pressed',String(started&&!muted));button.title='Toggle spatial sound (M)';}
  label();
  function param(p,v,timeConstant=.07){if(p)p.setTargetAtTime(v,ctx.currentTime,timeConstant)}
  function position(node,p){if(node.positionX){param(node.positionX,p[0]);param(node.positionY,p[1]);param(node.positionZ,p[2]);}else node.setPosition(...p)}
  function impulse(){
    // A short diffuse early-reflection return from the concrete street canyon.
    const b=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.65),ctx.sampleRate);
    let seed=91213;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++){const t=i/ctx.sampleRate;d[i]=(random()*2-1)*Math.exp(-t*5.5)*.075;}for(const [delay,gain]of[[.041,.22],[.079,.13],[.121,.07]])d[Math.round((delay+c*.004)*ctx.sampleRate)]+=gain;}
    return b;
  }
  function channel({gain=.5,pos=null,ref=9,rolloff=.95,cutoff=14000,send=.12}={}){
    const input=ctx.createGain(),filter=ctx.createBiquadFilter(),level=ctx.createGain(),wet=ctx.createGain();
    filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=.5;level.gain.value=gain;wet.gain.value=send;
    input.connect(filter);filter.connect(level);let panner;
    if(pos){panner=ctx.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=ref;panner.maxDistance=140;panner.rolloffFactor=rolloff;position(panner,pos);level.connect(panner);panner.connect(master);panner.connect(wet)}
    else{level.connect(master);level.connect(wet)}
    wet.connect(reverb);
    return {input,filter,level,panner,wet,gain,pos,cutoff,dispose(){input.disconnect();filter.disconnect();level.disconnect();panner?.disconnect();wet.disconnect()}};
  }
  function loop(id,options={}){
    const buffer=buffers.get(id);if(!buffer)return null;
    const chain=channel(options),crossfade=Math.min(.65,buffer.duration*.10);
    const item={id,buffer,...chain,baseGain:options.gain??.5,rate:options.rate??1,crossfade,nextStart:0};
    item.schedule=(when,offset=0,first=false)=>{
      const source=ctx.createBufferSource(),envelope=ctx.createGain();
      source.buffer=buffer;source.playbackRate.value=item.rate;
      const duration=(buffer.duration-offset)/item.rate,fade=Math.min(crossfade,duration*.4);
      envelope.gain.setValueAtTime(first?1:0,when);
      if(!first)envelope.gain.linearRampToValueAtTime(1,when+fade);
      envelope.gain.setValueAtTime(1,when+duration-fade);envelope.gain.linearRampToValueAtTime(0,when+duration);
      source.connect(envelope);envelope.connect(chain.input);sources.add(source);
      source.onended=()=>{sources.delete(source);source.disconnect();envelope.disconnect()};
      source.start(when,offset);source.stop(when+duration+.02);item.nextStart=when+duration-fade;
    };
    const offset=(options.offset??loops.length*1.731)%Math.max(.1,buffer.duration-crossfade*2);
    item.schedule(ctx.currentTime+.03,offset,true);loops.push(item);return item;
  }
  function shot(id,p,gain=.6,rate=1,send=.15){
    if(!ready||muted||document.hidden||ctx.state!=='running'||!buffers.has(id))return;
    const chain=channel({pos:p,gain,ref:id.startsWith('boot')?5:9,cutoff:11000,send});
    const source=ctx.createBufferSource();source.buffer=buffers.get(id);source.playbackRate.value=rate;source.connect(chain.input);sources.add(source);
    source.onended=()=>{source.disconnect();sources.delete(source);chain.dispose()};source.start();events++;return source;
  }
  let rain,air,awningLeft,awningRight,runoffLeft,runoffRight,kitchen,murmur,servo,projectorLeft,projectorRight,metroFront,metroRear,tires,idle,radio;
  function assemble(){
    rain=loop('rain-street',{gain:.66,send:.025});
    air=loop('city-air',{gain:.28,cutoff:2900,send:.08});
    awningLeft=loop('awning-rain',{gain:.52,pos:[-13,2.85,2.7],ref:11,cutoff:10500,send:.10});
    awningRight=loop('awning-rain',{gain:.38,pos:[13,2.8,-.7],ref:10,offset:4.3,rate:.973,send:.10});
    runoffLeft=loop('gutter-water',{gain:.47,pos:[-7.2,.4,2.8],ref:5,send:.08});
    runoffRight=loop('gutter-water',{gain:.36,pos:[7.2,.4,-13.8],ref:5,offset:5.7,rate:1.027,send:.08});
    kitchen=loop('noodle-kitchen',{gain:.95,pos:[-13.2,1.4,.5],ref:10,cutoff:6600,send:.09});
    murmur=loop('shop-murmur',{gain:.48,pos:[-13.9,1.5,1.6],ref:9,cutoff:1900,send:.08});
    servo=loop('workshop-servo',{gain:.66,pos:[9.15,1.5,-.4],ref:9,cutoff:7900,send:.12});
    projectorLeft=loop('projector-hum',{gain:.20,pos:[-14,5.2,2.85],ref:8,cutoff:3800,send:.10});
    projectorRight=loop('projector-hum',{gain:.19,pos:[13.9,5,-.42],ref:8,offset:3.2,rate:.947,cutoff:3500,send:.10});
    metroFront=loop('metro-roll',{gain:0,pos:[0,17,-23],ref:18,cutoff:6000,send:.20});
    metroRear=loop('metro-roll',{gain:0,pos:[16,17,-23],ref:18,offset:6.3,rate:.98,cutoff:4500,send:.20});
    tires=loop('wet-tires',{gain:0,pos:[-2.6,.5,-40],ref:12,cutoff:12000,send:.13});
    idle=loop('cab-idle',{gain:.33,pos:[-3.3,.7,3.3],ref:5,cutoff:3600,send:.06});
    radio=loop('radio-jazz',{gain:.38,pos:[-16,1.8,-.7],ref:8,cutoff:2700,send:.075});
  }
  async function activate(){
    if(booting)return booting;
    if(ready){started=true;await ctx.resume();fade();label();return;}
    loading=true;loadErrors=[];label();
    try{ctx??=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});}catch{loading=false;loadErrors=['audio-unavailable'];label();return;}
    // Called synchronously from a trusted gesture, before waiting for fetch/decode.
    ctx.addEventListener('statechange',()=>{button.dataset.context=ctx.state});button.dataset.context=ctx.state;
    const resume=ctx.resume();
    booting=(async()=>{
      await resume;
      master=ctx.createGain();master.gain.value=0;
      const highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=32;highpass.Q.value=.6;
      compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-15;compressor.knee.value=12;compressor.ratio.value=3;compressor.attack.value=.012;compressor.release.value=.35;
      analyser=ctx.createAnalyser();analyser.fftSize=1024;
      master.connect(highpass);highpass.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
      reverb=ctx.createConvolver();reverb.buffer=impulse();reverbReturn=ctx.createGain();reverbReturn.gain.value=.32;
      const reverbLP=ctx.createBiquadFilter();reverbLP.type='lowpass';reverbLP.frequency.value=3100;reverb.connect(reverbLP);reverbLP.connect(reverbReturn);reverbReturn.connect(master);
      await Promise.all(FILES.map(async id=>{try{const response=await fetch(`/audio/${id}.mp3`);if(!response.ok)throw new Error('Unavailable audio');const b=await ctx.decodeAudioData(await response.arrayBuffer());buffers.set(id,b)}catch{loadErrors.push(id)}}));
      if(!buffers.has('rain-street'))throw new Error('Rain layer unavailable');
      assemble();ready=true;started=true;loading=false;lastT=null;label();fade(1.8);
      if(document.hidden)await ctx.suspend();
    })().catch(()=>{loading=false;loadErrors=loadErrors.length?loadErrors:['audio-start'];label();}).finally(()=>booting=null);
    return booting;
  }
  function fade(seconds=.25){if(!master)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(muted||document.hidden?0:.72,ctx.currentTime,seconds);}
  async function toggle(){
    if(!ready){muted=false;try{localStorage.setItem('afterlight-sound','enabled')}catch{}await activate();return;}
    muted=!muted;try{localStorage.setItem('afterlight-sound',muted?'muted':'enabled')}catch{}
    clearTimeout(timer);if(!muted)await ctx.resume();fade(.07);label();
    if(muted)timer=setTimeout(()=>{if(muted)ctx.suspend()},500);
  }
  button.addEventListener('click',toggle);
  document.querySelector('#world').addEventListener('pointerdown',()=>{if(!muted&&!ready)activate();else if(!muted&&ctx?.state==='suspended')ctx.resume()},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='m'&&!e.repeat&&!e.metaKey&&!e.ctrlKey){e.preventDefault();toggle()}});
  document.addEventListener('visibilitychange',()=>{if(!ctx||!ready)return;if(document.hidden){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);ctx.suspend()}else if(!muted){ctx.resume().then(()=>fade(.3)).catch(()=>{})}});
  addEventListener('pagehide',()=>{ctx?.suspend()});
  const wave=new Float32Array(1024);
  function update(t,dt,camera,character,speed,walkPhase,people,vehicles,city){
    if(!ready)return;
    if(ctx.state==='running')for(const item of loops)while(item.nextStart<ctx.currentTime+.8)item.schedule(Math.max(item.nextStart,ctx.currentTime));
    const changedClock=lastT===null||t<lastT;lastT=t;
    // A listening point between the camera and street retains useful intimacy
    // when pulled out, while camera orientation determines left/right placement.
    ear.copy(camera.position).lerp(character.position,.58);ear.y=Math.max(1.6,ear.y);
    camera.getWorldDirection(forward);up.set(0,1,0).applyQuaternion(camera.quaternion);
    const listener=ctx.listener;
    if(listener.positionX){for(const [axis,v]of[['X',ear.x],['Y',ear.y],['Z',ear.z]])param(listener['position'+axis],v);for(const [axis,v]of[['X',forward.x],['Y',forward.y],['Z',forward.z]])param(listener['forward'+axis],v);for(const [axis,v]of[['X',up.x],['Y',up.y],['Z',up.z]])param(listener['up'+axis],v)}else{listener.setPosition(ear.x,ear.y,ear.z);listener.setOrientation(forward.x,forward.y,forward.z,up.x,up.y,up.z)}
    const distance=camera.position.distanceTo(character.position),intimacy=1-smooth(17,48,distance);
    if(rain){param(rain.level.gain,.57+Math.sin(t*.063)*.035+intimacy*.04);param(rain.filter.frequency,8500+intimacy*2800)}
    // Wind and neighboring rooms move on incommensurate cycles, avoiding a
    // conspicuous repeating master soundtrack.
    if(air)param(air.level.gain,.25+Math.sin(t*.047+.8)*.045);
    if(murmur)param(murmur.level.gain,.38+Math.sin(t*.097)*.07);
    if(radio)param(radio.level.gain,.34+Math.sin(t*.043)*.025);
    if(servo){const phase=Math.floor(t/18)%3;param(servo.level.gain,phase===1?.65:.39);servo.rate=phase===1?1.02:.78;}
    const phase=t%50,trainGain=(1-smooth(30,40,phase));
    if(metroFront){position(metroFront.panner,[city.train.position.x+4,17.5,-23]);param(metroFront.level.gain,phase<40?trainGain*.82:0,.22)}
    if(metroRear){position(metroRear.panner,[city.train.position.x+18,17.5,-23]);param(metroRear.level.gain,phase<40?trainGain*.47:0,.22)}
    const traffic=vehicles.state;
    if(tires){position(tires.panner,[traffic.trafficX,.6,traffic.trafficZ]);const sheltered=1-smooth(10,23,-traffic.trafficX);param(tires.level.gain,traffic.trafficVisible?.78*sheltered:0,.18);param(tires.filter.frequency,4200+sheltered*6500)}
    // Fixed sources gently lose high frequencies over distance, in addition to
    // the panner's attenuation. The shop radio stays inside its doorway.
    for(const item of [kitchen,awningLeft,awningRight,projectorLeft,projectorRight,radio])if(item){scratch.set(...item.pos);const d=ear.distanceTo(scratch);param(item.filter.frequency,clamp(item.cutoff/(1+Math.max(0,d-9)*.022),1100,item.cutoff),.14)}
    const heroStep=Math.floor((walkPhase+Math.PI/2)/Math.PI);
    if(!changedClock&&lastHeroStep!==null&&heroStep!==lastHeroStep&&speed>.35){shot(heroStep%2?'boot-wet-a':'boot-wet-b',[character.position.x,.08,character.position.z],.66+speed*.075,.96+(heroStep%5)*.018,.10);wetSteps++}lastHeroStep=heroStep;
    for(const walker of people.state.walkers){const step=Math.floor(walker.distance/.49),previous=walkerSteps.get(walker.id);if(!changedClock&&previous!==undefined&&step!==previous&&!walker.paused){if(Math.hypot(walker.x-ear.x,walker.z-ear.z)<22)shot(step%2?'boot-wet-a':'boot-wet-b',[walker.x,.28,walker.z],.28,.94+(step%5)*.03,.12)}walkerSteps.set(walker.id,step)}
    const wiper=Math.floor(t/7);
    if(!changedClock&&lastWiper!==null&&wiper!==lastWiper)shot('wiper-sweep',[-3.35,1.3,3.35],.46,1,.04);lastWiper=wiper;
    // Sparse, contextual details leave generous quiet between events.
    const cupPhase=Math.floor((t+2)*.22/(Math.PI*2));
    const cupMoment=((t+2)*.22)%(Math.PI*2);
    if(!changedClock&&cupMoment>2.4&&cupMoment<2.6&&cupPhase!==lastCup){shot('cup-set-down',[-15.55,1.3,.9],.30,.97,.08);lastCup=cupPhase;}
    const announcementCycle=Math.floor(t/100);
    if(t%100>42&&t%100<43&&lastAnnouncement!==announcementCycle&&!changedClock){shot('station-pa',[0,15.8,-23],.36,1,.3);lastAnnouncement=announcementCycle;}
    const doorCycle=Math.floor(t/79);
    if(t%79>54&&t%79<55&&lastDoor!==doorCycle&&!changedClock){shot('alley-door',[-9.5,1.2,-14],.26,.97,.27);lastDoor=doorCycle;}
    if(ctx.currentTime-measureAt>.25){measureAt=ctx.currentTime;analyser.getFloatTimeDomainData(wave);let sum=0,p=0;for(const v of wave){sum+=v*v;p=Math.max(p,Math.abs(v))}rms=Math.sqrt(sum/wave.length);peak=Math.max(p,peak*.995);}
  }
  return {update,toggle,get state(){return {ready,started,muted,loading,context:ctx?.state??'locked',decoded:buffers.size,expected:FILES.length,failed:[...loadErrors],loopVoices:loops.length,activeSources:sources.size,events,heroSteps:wetSteps,rms:Number(rms.toFixed(5)),peak:Number(peak.toFixed(5)),compressorReduction:compressor?.reduction??0,listener:[ear.x,ear.y,ear.z],trainGain:metroFront?.level.gain.value??0,trafficGain:tires?.level.gain.value??0}}};
}
