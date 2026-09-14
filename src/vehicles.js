import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function buildVehicles(scene) {
  const loader = new GLTFLoader();
  const wear=new THREE.TextureLoader().load('/assets/concrete.png');wear.wrapS=wear.wrapT=THREE.RepeatWrapping;
  const [sedan, van, scooter] = await Promise.all([loader.loadAsync('/assets/sedan.glb'), loader.loadAsync('/assets/service-van.glb'), loader.loadAsync('/assets/delivery-scooter.glb')]);
  const vehicles = [], obstacles = [];
  const lamp = new THREE.MeshBasicMaterial({color:0xd4f4ff,toneMapped:false});
  function add(source, x, z, angle, color, scale=1.05) {
    const root = source.scene.clone(true);
    root.traverse(o => {if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material.name==='Smoked blue glass'){o.material=new THREE.MeshPhysicalMaterial({color:0x1a303a,roughness:.20,metalness:0,transparent:true,opacity:.91,depthWrite:false,side:THREE.DoubleSide,specularIntensity:.16,envMapIntensity:1.1});}if(o.material.name==='Body enamel'){o.material=new THREE.MeshPhysicalMaterial({color,metalness:.62,roughness:.27,clearcoat:.38,clearcoatRoughness:.30,bumpMap:wear,bumpScale:.0016});}}});
    root.position.set(x,.025,z);root.rotation.y=angle;root.scale.setScalar(scale);scene.add(root);
    const wheels=[];root.traverse(o=>{if(o.name.startsWith('wheel_'))wheels.push(o)});
    // Parked wheel detail shares materials; merge static surfaces while retaining the opening lid.
    root.updateMatrixWorld(true);const batches=new Map();for(const o of [...root.children]){if(!o.isMesh||o.name.startsWith('trunk_lid'))continue;o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);root.remove(o)}for(const [m,gs] of batches){const o=new THREE.Mesh(mergeGeometries(gs,false),m);o.castShadow=true;o.receiveShadow=true;root.add(o);gs.forEach(g=>g.dispose())}
    vehicles.push({root,wheels});return root;
  }
  const taxi=add(sedan,-3.35,3.35,-.38,0x486265,1.18);
  const steering=new THREE.Mesh(new THREE.TorusGeometry(.19,.017,6,24),new THREE.MeshStandardMaterial({color:0x172126,roughness:.7}));steering.position.set(-.43,1.12,.57);steering.rotation.x=.65;taxi.add(steering);
  const cabSign=document.createElement('canvas');cabSign.width=256;cabSign.height=80;
  const ctx=cabSign.getContext('2d');ctx.fillStyle='#f6bd65';ctx.fillRect(0,0,256,80);ctx.fillStyle='#121b20';ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.fillText('TAXI',128,58);
  const tex=new THREE.CanvasTexture(cabSign);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.BoxGeometry(.72,.21,.25),new THREE.MeshStandardMaterial({color:0xc1a268,roughness:.35,metalness:.5}));sign.position.set(0,1.69,-.1);taxi.add(sign);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.65,.18),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));face.position.set(0,1.69,.031);taxi.add(face);
  const lid=taxi.children.find(o=>o.name.startsWith('trunk_lid'));
  const lidPivot=new THREE.Group();lidPivot.position.set(0,.96,-1.18);taxi.add(lidPivot);
  if(lid){taxi.remove(lid);lidPivot.add(lid);lid.position.sub(lidPivot.position);}
  const serviceVan=add(van,4.12,-11.5,.12,0x77776a,1.08);
  const c=document.createElement('canvas');c.width=768;c.height=256;const v=c.getContext('2d');v.fillStyle='#3c4442';v.fillRect(0,0,768,256);v.fillStyle='#d9d9c4';v.font='bold 70px sans-serif';v.fillText('KAWASE',45,105);v.font='30px monospace';v.fillText('COLD CHAIN / 夜間配送',45,165);v.fillStyle='#cd7743';v.fillRect(45,195,670,8);
  const vt=new THREE.CanvasTexture(c);vt.colorSpace=THREE.SRGBColorSpace;
  for(const side of [-1,1]){const label=new THREE.Mesh(new THREE.PlaneGeometry(1.53,.55),new THREE.MeshBasicMaterial({map:vt}));label.position.set(side*1.079,1.55,-.88);label.rotation.y=side*Math.PI/2;serviceVan.add(label);}
  add(sedan,3.9,-28,Math.PI,0x512c37,1.05);
  for(const [x,z,a,c]of[[-18.1,3.4,.9,0x496063],[-9.3,3.4,-.4,0x5e343c],[16.4,.2,-1.3,0x5f6250]])add(scooter,x,z,a,c,1.1);
  const movingCar=add(sedan,-2.8,-38,0,0x394b50,1.05);
  // The approaching car takes the service alley between blocks; it never
  // teleports in the visible crossing or collides with the parked vehicles.
  const route=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.6,.025,-100),new THREE.Vector3(-2.6,.025,-40),new THREE.Vector3(-2.6,.025,-20),new THREE.Vector3(-3.5,.025,-14.2),new THREE.Vector3(-9,.025,-14),new THREE.Vector3(-31,.025,-14)],false,'centripetal');
  const routeLength=route.getLength(),trafficPeriod=routeLength/2.2+8;
  const trafficLight=new THREE.PointLight(0xaac8dc,24,9,2);trafficLight.position.set(0,.75,2.8);movingCar.add(trafficLight);
  const tailLight=new THREE.PointLight(0xcc4238,4,4,2);tailLight.position.set(0,.6,-2.5);movingCar.add(tailLight);
  const trafficPosition=new THREE.Vector3(),trafficDirection=new THREE.Vector3();
  const wiperMaterial=new THREE.MeshStandardMaterial({color:0x202b2e,metalness:.65,roughness:.4});
  const wipers=[];
  for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.34,1.02,1.132);pivot.rotation.x=-.95;taxi.add(pivot);const blade=new THREE.Mesh(new THREE.BoxGeometry(.018,.35,.022),wiperMaterial);blade.position.y=.17;pivot.add(blade);wipers.push(pivot);}

  for(const car of [taxi,serviceVan]) {
    car.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(car);obstacles.push({minX:bounds.min.x-.3,maxX:bounds.max.x+.3,minZ:bounds.min.z-.3,maxZ:bounds.max.z+.3});
    for(const side of [-1,1]) {
      const head=new THREE.SpotLight(0xc8e5ff,34,12,.48,.7,1.4);head.position.set(side*.6,.7,2.43);head.target.position.set(side*.7,.06,10);car.add(head,head.target);
    }
  }
  return {taxi,serviceVan,obstacles,get state(){return {trafficX:movingCar.position.x,trafficZ:movingCar.position.z,trafficVisible:movingCar.visible,wiperAngle:wipers[0].rotation.z,obstacles}},update(t,dt){
    lidPivot.rotation.x=0;
    const progress=((t+22)%trafficPeriod)*2.2/routeLength;
    movingCar.visible=progress<=1;
    route.getPointAt(Math.min(progress,1),trafficPosition);route.getTangentAt(Math.min(progress,1),trafficDirection);
    movingCar.position.copy(trafficPosition);movingCar.rotation.y=Math.atan2(trafficDirection.x,trafficDirection.z);
    const sweep=t%7;const angle=sweep<1.7?Math.sin(sweep/1.7*Math.PI)*1.16:0;
    wipers.forEach(w=>w.rotation.z=-.55+angle);
  }};
}
