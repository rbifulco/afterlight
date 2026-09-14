import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// One articulated source, instanced across the neighborhood. Each resident keeps
// independent joint transforms without multiplying the number of mesh draws.
export function buildPeople(scene,source){
  const actors=[],templates=[];
  source.traverse(o=>{if(o.isMesh)templates.push(o)});
  const names=['body','leg_L','leg_R','knee_L','knee_R','arm_L','arm_R','elbow_L','elbow_R','tail_L','tail_R','head'];
  function resident(id,x,z,angle,color,role,route=null,umbrella=false,offset=0){
    const rig=source.clone(true),meshes=[],joints={};rig.traverse(o=>{if(o.isMesh)meshes.push(o)});
    for(const name of names)joints[name]=rig.getObjectByName(name);
    const scale=role==='cook'?1.04:.95+(actors.length%4)*.035;
    rig.scale.setScalar(scale);rig.position.set(x,role==='patron'?-.08:.28,z);rig.rotation.y=angle;
    const actor={id,rig,meshes,joints,color:new THREE.Color(color),role,route,umbrella,offset,angle,scale,x,z,phase:offset,travel:0,paused:false,speed:0};
    if(route){actor.segment=0;actor.segmentT=0;actor.pause=offset;rig.position.set(route[0][0],.28,route[0][1]);}
    actors.push(actor);return actor;
  }
  resident('tea regular',-15.55,1.96,Math.PI,0x8b7862,'patron',null,false,2);
  resident('late supper',-11.8,1.96,Math.PI,0x656b7a,'patron',null,false,7);
  resident('night nurse',-14.30,1.96,Math.PI+.12,0x637a73,'patron',null,false,11);
  resident('cook',-13.90,-.35,0,0xbdb5a0,'cook');
  resident('technician',9.8,-1.22,-.65,0x8a7663,'repair');
  resident('waiting neighbor',11.15,.70,-.5,0x5b6d69,'talk',null,true,3);
  resident('neighbor',12.02,.55,-1.9,0x867079,'talk',null,false,8);
  resident('west pavement',-7.05,-8,0,0x746d62,'walk',[[-7.05,-13],[-7.05,-6.3],[-8.1,3.65],[-10.4,3.70],[-8.1,3.65],[-7.05,-6.3]],true,0);
  resident('east pavement',7.95,-8,0,0x697a89,'walk',[[7.05,-17],[7.05,-5.8],[8.1,1.9],[14.7,2.6],[8.1,1.9],[7.05,-5.8]],true,9);
  resident('corner umbrella',-20.4,3.25,0,0x74636c,'walk',[[-20.4,3.25],[-19.8,3.28],[-19.8,1.8],[-20.6,1.8]],true,3);
  resident('east neighbor',19.3,2.4,0,0x657578,'walk',[[19.3,2.4],[19.6,-2.8],[19.6,1.8],[18.3,2.6]],true,0);
  resident('late commuter',-7.05,-22,0,0x8b7964,'walk',[[-7.05,-30],[-7.05,-18],[-7.05,-12],[-7.05,-18]],false,5);
  resident('delivery worker',7.05,-25,0,0x71746a,'walk',[[7.05,-32],[7.05,-23],[7.05,-20],[7.05,-23]],false,2);

  const instances=templates.map((template,index)=>{
    const material=template.material.clone();
    // The civilian's wrist display and pack stay dark; coats carry muted variation.
    if(material.name.includes('indicators')){material.emissiveIntensity=.15;material.color.setHex(0x50656b)}
    const instance=new THREE.InstancedMesh(template.geometry,material,actors.length);
    instance.castShadow=true;instance.receiveShadow=true;instance.frustumCulled=false;instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    actors.forEach((a,i)=>instance.setColorAt(i,material.name==='Waxed petrol cotton'?a.color:material.name==='Face in hood shadow'?new THREE.Color().setHSL(.06,.18,.58+(i%4)*.10):new THREE.Color(1,1,1)));
    scene.add(instance);return {instance,index};
  });
  // Curved, ribbed fabric umbrellas: dark wet canvas with one lighter gore.
  const umbrellaGeo=new THREE.SphereGeometry(.93,24,8,0,Math.PI*2,0,Math.PI*.42);umbrellaGeo.scale(1,.38,1);
  const umbrellaMat=new THREE.MeshStandardMaterial({color:0x788387,metalness:.12,roughness:.38,side:THREE.DoubleSide});
  const umbrellas=new THREE.InstancedMesh(umbrellaGeo,umbrellaMat,actors.length);umbrellas.castShadow=true;umbrellas.frustumCulled=false;scene.add(umbrellas);
  const ribParts=[];
  for(let n=0;n<12;n++){const a=n/12*Math.PI*2,points=[];for(let k=0;k<=8;k++){const b=k/8*Math.PI*.42;points.push(new THREE.Vector3(Math.cos(a)*Math.sin(b)*.93,Math.cos(b)*.93*.38,Math.sin(a)*Math.sin(b)*.93))}ribParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,.006,4,false))}
  const shaft=new THREE.CylinderGeometry(.011,.011,1.14,6);shaft.translate(0,-.24,0);ribParts.push(shaft);
  const ribs=new THREE.InstancedMesh(mergeGeometries(ribParts,false),new THREE.MeshStandardMaterial({color:0x75858a,metalness:.85,roughness:.32}),actors.length);ribs.frustumCulled=false;scene.add(ribs);ribParts.forEach(g=>g.dispose());
  const dummy=new THREE.Object3D(),zero=new THREE.Matrix4().makeScale(0,0,0);
  const cups=[];
  for(const a of actors.filter(a=>a.role==='patron')){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.045,.038,.12,12),new THREE.MeshStandardMaterial({color:0xc8b697,roughness:.28}));scene.add(cup);cups.push({a,cup});
  }
  const chopstick=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.42,6),new THREE.MeshStandardMaterial({color:0xa87c47,roughness:.68}));scene.add(chopstick);
  function update(t,dt=.016,hero){
    for(const a of actors){
      const {rig,joints:j,role}=a,phase=t+a.offset;
      let speed=0;
      if(a.route){
        const next=a.route[(a.segment+1)%a.route.length],dx=next[0]-rig.position.x,dz=next[1]-rig.position.z,d=Math.hypot(dx,dz);
        const nearbyHero=hero&&Math.hypot(hero.x-rig.position.x,hero.z-rig.position.z)<.95;
        if(a.pause>0)a.pause=Math.max(0,a.pause-dt);
        else if(!nearbyHero){
          if(d<.08){a.segment=(a.segment+1)%a.route.length;a.pause=(a.segment%3===0?3.4:1.1)+(a.offset%3);}
          else{speed=.64+(a.offset%4)*.055;const step=Math.min(d,speed*dt);rig.position.x+=dx/d*step;rig.position.z+=dz/d*step;a.travel+=step;const heading=Math.atan2(dx,dz);rig.rotation.y+=Math.atan2(Math.sin(heading-rig.rotation.y),Math.cos(heading-rig.rotation.y))*(1-Math.exp(-dt*4));}
        }
        a.speed=THREE.MathUtils.damp(a.speed,speed,7,dt);a.phase+=a.speed*dt*7;const gait=a.speed/.85;
        j.leg_L.rotation.x=Math.sin(a.phase)*.42*gait;j.leg_R.rotation.x=-Math.sin(a.phase)*.42*gait;
        j.knee_L.rotation.x=Math.max(0,-Math.sin(a.phase))*.52*gait;j.knee_R.rotation.x=Math.max(0,Math.sin(a.phase))*.52*gait;
        j.arm_L.rotation.x=-Math.sin(a.phase)*.24*gait;j.arm_R.rotation.x=a.umbrella?-.85:Math.sin(a.phase)*.24*gait;
        j.elbow_R.rotation.x=a.umbrella?-1.05:-.22;j.elbow_L.rotation.x=-.24;
        rig.position.y=.28+Math.abs(Math.sin(a.phase))*.020*gait;
        a.paused=speed===0;
      }else{
        rig.position.y=(role==='patron'?-.08:.28)+Math.sin(phase*1.25)*.004;
        rig.rotation.y=a.angle+Math.sin(phase*.26)*.04;
        if(role==='patron'){
          const sip=Math.pow(Math.max(0,Math.sin(phase*.22)),8);
          j.leg_L.rotation.x=j.leg_R.rotation.x=-1.35;j.knee_L.rotation.x=j.knee_R.rotation.x=1.3;
          j.arm_R.rotation.x=-.8-sip*.42;j.elbow_R.rotation.x=-.55-sip*.75;
          j.arm_L.rotation.x=-.75;j.elbow_L.rotation.x=-.55+Math.sin(phase*.65)*.10;
          j.body.rotation.x=.04+Math.sin(phase*.27)*.025;
        }else if(role==='cook'){
          rig.position.x=a.x+Math.sin(t*.17)*.34;
          j.arm_R.rotation.x=-.65+Math.sin(t*1.5)*.08;j.arm_R.rotation.z=Math.cos(t*1.5)*.10;
          j.elbow_R.rotation.x=-.95+Math.cos(t*1.5)*.10;j.arm_L.rotation.x=-.65;j.elbow_L.rotation.x=-.70;
          j.body.rotation.x=.08+Math.sin(t*.5)*.018;
        }else if(role==='repair'){
          j.arm_L.rotation.x=-.8+Math.sin(t*.48)*.12;j.elbow_L.rotation.x=-.7;
          j.arm_R.rotation.x=-.55;j.elbow_R.rotation.x=-.65+Math.sin(t*.7)*.15;j.body.rotation.x=.10;
        }else{
          j.arm_R.rotation.x=a.umbrella?-.85:-.32+Math.sin(phase*.44)*.14;
          j.elbow_R.rotation.x=a.umbrella?-1.05:-.68;j.arm_L.rotation.x=a.umbrella?-.20:-.55+Math.sin(phase*.55)*.15;j.elbow_L.rotation.x=a.umbrella?-.32:-.65;j.body.rotation.z=a.umbrella?.01:-.035+Math.sin(phase*.3)*.014;
        }
      }
      j.body.position.y=Math.sin(phase*1.1)*.007;j.body.rotation.y=Math.sin(phase*.34)*.025;if(j.head){j.head.rotation.y=Math.sin(phase*.26)*.12;j.head.rotation.x=role==='patron'?.04+Math.sin(phase*.22)*.035:role==='cook'?.07:0;}
      j.tail_L.rotation.x=.045+Math.sin(phase*.8)*.035+a.speed*.09;j.tail_R.rotation.x=.045+Math.sin(phase*.8+.8)*.035+a.speed*.09;
      rig.updateMatrixWorld(true);
    }
    for(const {instance,index} of instances){actors.forEach((a,i)=>instance.setMatrixAt(i,a.meshes[index].matrixWorld));instance.instanceMatrix.needsUpdate=true;}
    actors.forEach((a,i)=>{
      if(!a.umbrella){umbrellas.setMatrixAt(i,zero);ribs.setMatrixAt(i,zero);return;}
      dummy.position.copy(a.rig.position);dummy.position.y+=2.08*a.scale;dummy.position.x+=.16;
      dummy.rotation.set(Math.sin(t*.6+a.offset)*.025,0,-.06+Math.sin(t*.4+a.offset)*.025);dummy.scale.setScalar(a.scale);dummy.updateMatrix();
      umbrellas.setMatrixAt(i,dummy.matrix);ribs.setMatrixAt(i,dummy.matrix);umbrellas.setColorAt(i,a.color);
    });umbrellas.instanceMatrix.needsUpdate=true;ribs.instanceMatrix.needsUpdate=true;umbrellas.instanceColor.needsUpdate=true;
    for(const {a,cup} of cups){dummy.position.set(0,-.36,.14);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();cup.matrixAutoUpdate=false;cup.matrix.multiplyMatrices(a.joints.elbow_R.matrixWorld,dummy.matrix);}
    const cook=actors.find(a=>a.role==='cook');dummy.position.set(0,-.38,.11);dummy.rotation.set(0,0,.4);dummy.updateMatrix();chopstick.matrixAutoUpdate=false;chopstick.matrix.multiplyMatrices(cook.joints.elbow_R.matrixWorld,dummy.matrix);
  }
  update(0,0);
  return {update,get state(){return {count:actors.length,walkers:actors.filter(a=>a.route).map(a=>({id:a.id,x:a.rig.position.x,z:a.rig.position.z,distance:a.travel,paused:a.paused})),cookStir:actors[3].joints.elbow_R.rotation.x,patronSip:actors[0].joints.elbow_R.rotation.x}}};
}
