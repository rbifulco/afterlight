import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildCity } from './city.js';
import { buildVehicles } from './vehicles.js';
import { buildStreetLife } from './street-life.js';
import { buildPeople } from './people.js';
import { buildAtmosphere } from './atmosphere.js';
import { createSoundscape } from './soundscape.js';
import { createNavigation } from './navigation.js';
addEventListener('unhandledrejection',()=>{document.querySelector('#loading').classList.remove('done');document.querySelector('#loading p').textContent='CITY CONNECTION INTERRUPTED';document.querySelector('#loading small').textContent='Refresh to reconnect to District 09.';});
const canvas=document.querySelector('#world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x102536);scene.fog=new THREE.FogExp2(0x29465d,.011);
const camera=new THREE.PerspectiveCamera(innerWidth/innerHeight<.8?76:43,innerWidth/innerHeight,.2,320);
scene.add(new THREE.HemisphereLight(0x9bbddd,0x18202c,1.45));
const moon=new THREE.DirectionalLight(0x8ab5e0,1.85);moon.position.set(-20,42,15);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-32;moon.shadow.camera.right=32;moon.shadow.camera.top=32;moon.shadow.camera.bottom=-32;moon.shadow.camera.far=110;moon.shadow.normalBias=.06;moon.shadow.bias=-.00015;scene.add(moon);
const city=buildCity(scene);
const vehicles=await buildVehicles(scene);
const streetLife=buildStreetLife(scene,city,vehicles);
const atmosphere=buildAtmosphere(scene,city);
const navigation=createNavigation([...vehicles.obstacles,...streetLife.obstacles]);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const ssao=new SSAOPass(scene,camera,innerWidth/2,innerHeight/2,12);ssao.kernelRadius=1.5;ssao.minDistance=.0001;ssao.maxDistance=.018;const resizeAO=ssao.setSize.bind(ssao);ssao.setSize=(w,h)=>resizeAO(Math.round(w*.5),Math.round(h*.5));const renderAO=ssao.render.bind(ssao);ssao.render=(...args)=>{const previous=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;steam.visible=false;streetLife.setDepthPass(true);atmosphere.setDepthPass(true);try{return renderAO(...args)}finally{renderer.shadowMap.autoUpdate=previous;steam.visible=true;streetLife.setDepthPass(false);atmosphere.setDepthPass(false)}};composer.addPass(ssao);const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.30,.5,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
THREE.DefaultLoadingManager.onError=url=>{document.querySelector('#loading').classList.remove('done');document.querySelector('#loading p').textContent='COULD NOT LOAD THE CITY';document.querySelector('#loading small').textContent='A local asset failed to load. Refresh to try again.';console.error('Asset load failed:',url)};const loader=new THREE.TextureLoader();const asphalt=await loader.loadAsync('/assets/asphalt.png');asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.colorSpace=THREE.SRGBColorSpace;asphalt.anisotropy=4;
// One low-resolution planar pass, distorted by original asphalt texture and moving ripples.
const street=new Reflector(new THREE.PlaneGeometry(260,260),{textureWidth:1024,textureHeight:1024,multisample:0,clipBias:.003,color:0x23313b,shader:{
 uniforms:{tDiffuse:{value:null},color:{value:null},textureMatrix:{value:null},asphalt:{value:null},time:{value:0}},
 vertexShader:`uniform mat4 textureMatrix;varying vec4 vMirror;varying vec3 vWorld;void main(){vMirror=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D asphalt;uniform float time;varying vec4 vMirror;varying vec3 vWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 uv=vWorld.xz*.38;vec3 grit=pow(texture2D(asphalt,uv).rgb,vec3(.4545));float n=pow(texture2D(asphalt,uv*.33).r,.4545);vec2 ripple=vec2(sin(vWorld.z*16.+time*1.4),cos(vWorld.x*22.+time))*.00065;vec2 projected=vMirror.xy/vMirror.w;projected+=(grit.rg-.24)*.0008+ripple*.65;
 vec3 refl=texture2D(tDiffuse,projected).rgb;refl+=texture2D(tDiffuse,projected+vec2(.0015,.0025)).rgb;refl*=.5;
 float wet=1.-smoothstep(.18,.36,n);float reflectivity=mix(.23,.76,wet);vec3 col=grit*.042*vec3(.56,.73,.91)+refl*reflectivity;
 float speck=pow(grit.r,2.)*2.5;col+=refl*speck*.055;
 float magenta=exp(-pow((vWorld.x+6.4)/2.7,2.))*exp(-pow((vWorld.z-5.)/10.,2.));float blue=exp(-pow((vWorld.x-6.)/2.5,2.))*exp(-pow((vWorld.z-3.)/10.,2.));float stretched=pow(texture2D(asphalt,vec2(vWorld.x*.6,vWorld.z*.07+sin(time*.35)*.003)).r,.4545);float broken=smoothstep(.16,.49,stretched)*(.62+.38*sin(vWorld.z*21.+grit.r*9.));col+=(vec3(.48,.009,.18)*magenta+vec3(.004,.27,.40)*blue)*(.25+wet*.75)*broken*.35;
 float shopPool=exp(-pow((vWorld.x+12.)/6.,2.)-pow((vWorld.z-4.)/4.4,2.));col+=vec3(.38,.16,.035)*shopPool*(.2+wet*.5)*(grit.r*.5+.2);
 float lamp=exp(-length(vWorld.xz-vec2(-6.,6.))*.47);col+=vec3(.19,.12,.05)*lamp*grit;
 float fog=1.-exp(-.00013*pow(length(cameraPosition-vWorld),2.));col=mix(col,vec3(.012,.030,.047),fog);gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}});
const updateReflection=street.onBeforeRender;street.onBeforeRender=function(r,s,c){if(!s.overrideMaterial)updateReflection.call(this,r,s,c)};street.rotation.x=-Math.PI/2;street.position.set(0,.006,-55);street.material.uniforms.asphalt.value=asphalt;scene.add(street);
// Damp original asphalt also textures concrete; low amplitude retains chunky silhouettes.
scene.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial&&o.material.roughness>.6&&!o.material.map){o.material.bumpMap=asphalt;o.material.bumpScale=.035;}});
// Raindrops rendered in one call, animation performed on the GPU.
const rainCount=5200,rainPos=new Float32Array(rainCount*6),rainSeed=new Float32Array(rainCount*2);
for(let i=0;i<rainCount;i++){const x=(Math.random()-.5)*95,y=Math.random()*37,z=(Math.random()-.5)*110-25;rainPos.set([x,y,z,x+.035,y+.48,z+.015],i*6);rainSeed[i*2]=rainSeed[i*2+1]=Math.random()}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));rainGeo.setAttribute('seed',new THREE.BufferAttribute(rainSeed,1));
const rainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`attribute float seed;uniform float time;varying float vAlpha;void main(){vec3 p=position;p.y=mod(p.y-time*(12.+seed*7.),37.);p.x+=sin(time*.18)*.4;vec4 mv=modelViewMatrix*vec4(p,1.);vAlpha=(.05+seed*.12)*clamp(1.-length(mv.xyz)/140.,0.,1.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vAlpha;void main(){gl_FragColor=vec4(.50,.72,.86,vAlpha);}`});
const rain=new THREE.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;scene.add(rain);
const steamTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(185,211,218,.6)');g.addColorStop(.3,'rgba(185,211,218,.35)');g.addColorStop(1,'rgba(185,211,218,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
// All vent plumes share one instanced billboard draw, including the mirrored camera.
const steamGeometry=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1,1));const steamOrigins=[],steamPhases=[];for(const [x,z]of[[-7.1,2.8],[7.2,1.5],[7.1,-13],[-7,-17]])for(let i=0;i<12;i++){steamOrigins.push(x,z);steamPhases.push(i/12)}steamGeometry.instanceCount=steamPhases.length;steamGeometry.setAttribute('origin',new THREE.InstancedBufferAttribute(new Float32Array(steamOrigins),2));steamGeometry.setAttribute('phase',new THREE.InstancedBufferAttribute(new Float32Array(steamPhases),1));
const steam=new THREE.Mesh(steamGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},map:{value:steamTex}},vertexShader:`attribute vec2 origin;attribute float phase;uniform float time;varying vec2 vUv;varying float opacity;void main(){float age=fract(time*.19+phase);vec3 center=vec3(origin.x+sin(age*4.+phase)*age*.6,.25+age*3.3,origin.y+age*.45);vec4 mv=modelViewMatrix*vec4(center,1.);float a=age*.5;vec2 pos=mat2(cos(a),-sin(a),sin(a),cos(a))*position.xy;mv.xy+=pos*vec2(1.+age*2.8,1.+age*3.5);gl_Position=projectionMatrix*mv;vUv=uv;opacity=sin(age*3.14159)*.14;}`,fragmentShader:`uniform sampler2D map;varying vec2 vUv;varying float opacity;void main(){gl_FragColor=vec4(.57,.68,.73,texture2D(map,vUv).a*opacity);}` }));steam.frustumCulled=false;scene.add(steam);
const rippleGeo=new THREE.RingGeometry(.92,1,24);rippleGeo.rotateX(-Math.PI/2);const ripples=new THREE.InstancedMesh(rippleGeo,new THREE.MeshBasicMaterial({color:0x6697a8,transparent:true,opacity:.085,depthWrite:false}),130);const rd=[];const dummy=new THREE.Object3D();for(let i=0;i<130;i++)rd.push({x:(Math.random()-.5)*14,z:Math.random()*48-28,p:Math.random()});scene.add(ripples);
// Small splashes punctuate the ground, separate from falling streaks.
const splashGeo=new THREE.BufferGeometry(),splashP=new Float32Array(200*3);for(let i=0;i<200;i++)splashP.set([(Math.random()-.5)*14,.05,Math.random()*48-28],i*3);splashGeo.setAttribute('position',new THREE.BufferAttribute(splashP,3));const splashes=new THREE.Points(splashGeo,new THREE.PointsMaterial({color:0x82b2bf,size:.055,transparent:true,opacity:.35,depthWrite:false}));scene.add(splashes);
const cloth=await loader.loadAsync('/assets/coat-fabric.png');cloth.colorSpace=THREE.SRGBColorSpace;cloth.anisotropy=4;
const gltf=await new GLTFLoader().loadAsync('/assets/courier.glb');const character=new THREE.Group();character.add(gltf.scene);character.scale.setScalar(1.15);character.position.set(0,.03,5);character.rotation.y=Math.PI;scene.add(character);gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
gltf.scene.traverse(o=>{if(o.isMesh&&o.material.name==='Waxed petrol cotton'){o.material.map=cloth;o.material.bumpMap=cloth;o.material.bumpScale=.007;o.material.color.setHex(0x80999b);}});
const resident=await new GLTFLoader().loadAsync('/assets/resident.glb');
resident.scene.traverse(o=>{if(o.isMesh&&o.material.name==='Waxed petrol cotton'){o.material.map=cloth;o.material.bumpMap=cloth;o.material.bumpScale=.006;o.material.color.setHex(0x9fa5a2)}});
const people=buildPeople(scene,resident.scene);
const soundscape=createSoundscape();
const android=await new GLTFLoader().loadAsync('/assets/service-android.glb');android.scene.traverse(o=>{if(o.isMesh&&o.material.name==='Porcelain alloy'){o.material.color.multiplyScalar(.45);o.material.roughness=.42;}});for(const [x,z,angle]of[[13.8,-1.25,.1]]){const model=android.scene.clone(true);model.position.set(x,.35,z);model.scale.setScalar(1.25);model.rotation.y=angle;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(model);}
const joints={};for(const n of ['body','leg_L','leg_R','arm_L','arm_R','tail_L','tail_R','knee_L','knee_R','elbow_L','elbow_R'])joints[n]=gltf.scene.getObjectByName(n);
const characterLight=new THREE.PointLight(0x75d4e7,3,3,2);characterLight.position.set(0,2.5,1.3);character.add(characterLight);
const target=character.position.clone(),velocity=new THREE.Vector3(),follow=new THREE.Vector3(0,5.3,-7);let yaw=.20,desiredYaw=.20,distance=30,desiredDistance=30,pitch=.16,desiredPitch=.16,dragging=false,pointerStart=null,lastX=0,lastY=0,walkPhase=0,moveCount=0,orbitCount=0,zoomCount=0;const walkEvidence={peakSpeed:0,maxLegSwing:0,lastHeading:Math.PI};
let waypoints=[];
function reset(){waypoints=[];desiredYaw=.20;desiredPitch=innerWidth<700?.25:.16;desiredDistance=innerWidth<700?48:30;target.set(0,.03,5);character.position.copy(target);velocity.set(0,0,0);follow.set(0,5.3,-7);}
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const canWalk=navigation.clear;
const activePointers=new Map();let pinching=false,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(activePointers.size===2){const [a,b]=[...activePointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);pinching=true;pointerStart=null;return}pointerStart={x:e.clientX,y:e.clientY};lastX=e.clientX;lastY=e.clientY;dragging=false});
canvas.addEventListener('pointermove',e=>{if(activePointers.has(e.pointerId))activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinching){if(activePointers.size===2){const [a,b]=[...activePointers.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(next>1&&pinchDistance>1){desiredDistance=THREE.MathUtils.clamp(desiredDistance*pinchDistance/next,12,65);zoomCount++}pinchDistance=next}return}if(!pointerStart)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)dragging=true;if(dragging){desiredYaw-=dx*.005;desiredPitch=THREE.MathUtils.clamp(desiredPitch+dy*.002,.16,.91)}lastX=e.clientX;lastY=e.clientY});
canvas.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(pinching){if(activePointers.size===0)pinching=false;pointerStart=null;return}if(!pointerStart)return;if(!dragging){mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const p=new THREE.Vector3();if(ray.ray.intersectPlane(ground,p)){const obscured=city.colliders.some(b=>{const bounds=new THREE.Box3(new THREE.Vector3(b.x-b.w/2,0,b.z-b.d/2),new THREE.Vector3(b.x+b.w/2,b.h,b.z+b.d/2));const hit=ray.ray.intersectBox(bounds,new THREE.Vector3());return hit&&hit.distanceTo(camera.position)<p.distanceTo(camera.position)-.15});if(canWalk(p.x,p.z)&&!obscured){const route=navigation.path(character.position,p);if(!route){pointerStart=null;return;}waypoints=route;target.set(route[0].x,.03,route[0].z);moveCount++}}}else orbitCount++;pointerStart=null;dragging=false});
canvas.addEventListener('pointercancel',()=>{activePointers.clear();pinching=false;pointerStart=null;dragging=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();desiredDistance=THREE.MathUtils.clamp(desiredDistance*Math.exp(e.deltaY*.001),12,65);zoomCount++},{passive:false});
document.querySelector('#reset').onclick=reset;
let chromeTimer;
function revealControls(){document.body.classList.remove('quiet');clearTimeout(chromeTimer);chromeTimer=setTimeout(()=>{if(!document.querySelector('nav').contains(document.activeElement))document.body.classList.add('quiet')},4500)}
document.addEventListener('pointermove',revealControls,{passive:true});document.addEventListener('pointerdown',revealControls,{passive:true});document.addEventListener('focusin',revealControls);revealControls();
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean');if(e.key.toLowerCase()==='r')reset();if(e.key==='Escape')document.body.classList.remove('clean')});
let quality='HIGH';function setQuality(q){quality=q;ssao.enabled=q==='HIGH';const ratio=q==='HIGH'?Math.min(devicePixelRatio,1.25):1;renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);street.getRenderTarget().setSize(q==='HIGH'?1024:640,q==='HIGH'?1024:640);document.querySelector('#quality').textContent=q==='HIGH'?'Quality: high':'Quality: light';}
if(matchMedia('(pointer:coarse)').matches){setQuality('PERFORMANCE');desiredDistance=distance=48;desiredPitch=pitch=.25;document.querySelector('#move-help').textContent='Tap to walk';document.querySelector('#zoom-help').textContent='Pinch to zoom'}
if(innerWidth<700){desiredDistance=distance=48;desiredPitch=pitch=.25;}
document.querySelector('#quality').onclick=()=>setQuality(quality==='HIGH'?'PERFORMANCE':'HIGH');
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<.8?76:43;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
let last=performance.now(),elapsed=0,frames=0,fpsTime=last,averageFPS=0,frameTimes=[];
const diagnostics=document.createElement('output');diagnostics.id='diagnostics';diagnostics.hidden=true;document.body.append(diagnostics);
function frame(now){requestAnimationFrame(frame);const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;if(document.hidden)return;elapsed+=dt;const t=elapsed;
 const dx=target.x-character.position.x,dz=target.z-character.position.z,dist=Math.hypot(dx,dz);const speed=waypoints.length>1?2.9:Math.min(2.9,dist*3.0),factor=1-Math.exp(-dt*12);velocity.x=THREE.MathUtils.lerp(velocity.x,dist>.03?dx/dist*speed:0,factor);velocity.z=THREE.MathUtils.lerp(velocity.z,dist>.03?dz/dist*speed:0,factor);
 if(canWalk(character.position.x+velocity.x*dt,character.position.z+velocity.z*dt)){character.position.x+=velocity.x*dt;character.position.z+=velocity.z*dt}if(dist<.12&&waypoints.length>1){waypoints.shift();target.set(waypoints[0].x,.03,waypoints[0].z)}else if(dist<.025){character.position.copy(target);velocity.set(0,0,0);waypoints=[]}const moving=velocity.length();if(moving>.05){let angle=Math.atan2(velocity.x,velocity.z),delta=Math.atan2(Math.sin(angle-character.rotation.y),Math.cos(angle-character.rotation.y));character.rotation.y+=delta*(1-Math.exp(-dt*9))}
 walkPhase+=dt*moving*3.7;const gait=Math.min(moving/2.3,1);if(joints.body){joints.body.position.y=Math.sin(t*2)*.015+Math.abs(Math.sin(walkPhase))*.035*gait;joints.body.rotation.z=Math.sin(t*.85)*.014*(1-gait);}
 for(const [name,sign]of[['leg_L',1],['leg_R',-1]])if(joints[name])joints[name].rotation.x=Math.sin(walkPhase)*.53*gait*sign;
 for(const [name,sign]of[['knee_L',1],['knee_R',-1]])if(joints[name])joints[name].rotation.x=Math.max(0,-Math.sin(walkPhase)*sign)*.65*gait;
 for(const name of ['elbow_L','elbow_R'])if(joints[name])joints[name].rotation.x=-.16-gait*.12;
 for(const [name,sign]of[['arm_L',-1],['arm_R',1]])if(joints[name]){joints[name].rotation.x=Math.sin(walkPhase)*.38*gait*sign;joints[name].rotation.z=Math.sin(t*1.2)*.015}
 for(const [name,sign]of[['tail_L',-1],['tail_R',1]])if(joints[name])joints[name].rotation.x=.05+gait*.18+Math.sin(walkPhase+sign)*.09*gait+Math.sin(t*2+sign)*.025;
 yaw=THREE.MathUtils.lerp(yaw,desiredYaw,1-Math.exp(-dt*7));pitch=THREE.MathUtils.lerp(pitch,desiredPitch,1-Math.exp(-dt*7));distance=THREE.MathUtils.lerp(distance,desiredDistance,1-Math.exp(-dt*7));const closeFactor=THREE.MathUtils.clamp((distance-12)/26,0,1);const followTarget=new THREE.Vector3(character.position.x*.65,2.3+closeFactor*4.0,character.position.z*.55-2-closeFactor*7.25);follow.lerp(followTarget,1-Math.exp(-dt*1.8));camera.position.set(follow.x+Math.sin(yaw)*Math.cos(pitch)*distance,follow.y+Math.sin(pitch)*distance,follow.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(follow);
 walkEvidence.peakSpeed=Math.max(walkEvidence.peakSpeed,moving);walkEvidence.maxLegSwing=Math.max(walkEvidence.maxLegSwing,Math.abs(joints.leg_L?.rotation.x||0));if(moving>1)walkEvidence.lastHeading=character.rotation.y;city.update(t);atmosphere.update(t);vehicles.update(t,dt);people.update(t,dt,character.position);streetLife.update(t,dt);soundscape.update(t,dt,camera,character,moving,walkPhase,people,vehicles,city);street.material.uniforms.time.value=t;rainMat.uniforms.time.value=t;
 steam.material.uniforms.time.value=t;
 rd.forEach((r,i)=>{const age=(t*.65+r.p)%1;dummy.position.set(r.x,.038,r.z);dummy.scale.setScalar(.025+age*.28);dummy.scale.y=1;dummy.updateMatrix();ripples.setMatrixAt(i,dummy.matrix)});ripples.instanceMatrix.needsUpdate=true;splashes.material.opacity=.18+Math.sin(t*23)*.1;
 ssao.enabled=quality==='HIGH'&&distance<26;renderer.info.reset();composer.render();frames++;frameTimes.push(raw*1000);if(frameTimes.length>240)frameTimes.shift();if(now-fpsTime>1000){averageFPS=Math.round(frames*1000/(now-fpsTime));frames=0;fpsTime=now;diagnostics.textContent=JSON.stringify({fps:averageFPS,frameMs:frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length,position:{x:character.position.x,z:character.position.z},target:{x:target.x,z:target.z},speed:moving,heading:character.rotation.y,yaw,pitch,distance,moveCount,orbitCount,zoomCount,elapsed:t,quality,contactShading:ssao.enabled,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,assetsLoaded:true,streetLife:streetLife.state,population:people.state,atmosphere:atmosphere.state,traffic:vehicles.state,audio:soundscape.state,routeRemaining:waypoints.length,walkEvidence,frameP95:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)],trainX:city.train.position.x,joints:{leftLeg:joints.leg_L?.rotation.x,rightLeg:joints.leg_R?.rotation.x,coat:joints.tail_L?.rotation.x}});}
}
// Capture the actual district once for metal and glazing reflections. No stock HDRI.
await streetLife.ready;camera.position.set(6,10,28);camera.lookAt(0,4,-5);streetLife.update(0,0,character,camera);
const environmentTarget=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});const environmentCamera=new THREE.CubeCamera(.2,150,environmentTarget);environmentCamera.position.set(0,3.6,3);street.visible=false;rain.visible=false;environmentCamera.update(renderer,scene);street.visible=true;rain.visible=true;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromCubemap(environmentTarget.texture).texture;scene.environmentIntensity=.42;environmentTarget.dispose();pmrem.dispose();
renderer.info.autoReset=false;document.querySelector('#loading').classList.add('done');requestAnimationFrame(frame);
