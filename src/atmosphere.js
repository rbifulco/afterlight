import { assetUrl } from './asset-url.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildAtmosphere(scene,city){
  const cloths=[],residents=[],lightRooms=[];
  const textile=new THREE.TextureLoader().load(assetUrl('coat-fabric.png'));textile.colorSpace=THREE.SRGBColorSpace;
  const fabric=(color)=>new THREE.MeshStandardMaterial({color,map:textile,bumpMap:textile,bumpScale:.014,roughness:.92,side:THREE.DoubleSide});
  const indigo=fabric(0x33424e),linen=fabric(0xada493),plum=fabric(0x64505c),olive=fabric(0x646b59);
  const steel=new THREE.MeshStandardMaterial({color:0x3c4c51,metalness:.72,roughness:.36});
  function cloth(width,height,x,y,z,material,phase,shirt=false){
    let geo;
    if(shirt){const s=new THREE.Shape();const p=[[-.19,0],[-.37,-.1],[-.49,-.32],[-.31,-.39],[-.23,-.26],[-.23,-.78],[.23,-.78],[.23,-.26],[.31,-.39],[.49,-.32],[.37,-.1],[.19,0],[.11,-.1],[-.11,-.1]];p.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();geo=new THREE.ShapeGeometry(s);geo.scale(width,height,1);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)+.5,uv.getY(i)+1);}
    else{geo=new THREE.PlaneGeometry(width,height,10,12);geo.translate(0,-height/2,0)}
    const pos=geo.attributes.position,rest=pos.array.slice();
    // Pleats stay in the mesh for depth, silhouettes, shadows and reflections.
    for(let i=0;i<pos.count;i++){rest[i*3+2]+=(Math.sin(rest[i*3]*29)+Math.sin(rest[i*3]*43)*.2)*.025;}
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);cloths.push({mesh,rest,phase,height});return mesh;
  }
  function rail(points,r=.018){const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),12,r,5,false);const m=new THREE.Mesh(geometry,steel);scene.add(m);return m;}
  rail([[-17.85,2.86,2.65],[-13,2.85,2.65],[-8.8,2.86,2.65]],.025);
  // A broken run of split noren leaves the cook and occupied seats in view.
  for(const [i,x]of[-17.3,-16.48,-10.25,-9.43].entries()){
    cloth(.77,.66,x,2.82,2.67,indigo,i);
    const mark=city.label('麺',x,2.50,2.72,.26,.28,'#bfb69c',0,'#263540');
    mark.material.color.setScalar(.7);
  }
  for(const [x,y,z,m,i]of[[-11.5,10.42,2.6,linen,1],[-10.75,10.42,2.6,plum,2],[-9.95,10.42,2.6,indigo,3],[15.35,13.5,-.93,olive,5],[16.2,13.5,-.93,linen,6],[16.9,13.5,-.93,plum,7]])cloth(.63,.95,x,y,z,m,i,i%3===2);
  rail([[-12,10.5,2.6],[-10.6,10.43,2.6],[-9.5,10.5,2.6]],.009);
  rail([[14.8,13.6,-.93],[16.1,13.51,-.93],[17.3,13.6,-.93]],.009);
  // Curtains catch light at the edge of a few rooms instead of repeating on every floor.
  for(const [x,y,z]of[[-15.6,13.7,1.63],[-10.95,16.8,1.63],[12,13.7,-1.87],[15.1,16.8,-1.87]]){
    cloth(.22,1.25,x-.3,y+.68,z,linen,x);cloth(.22,1.25,x+.3,y+.68,z,linen,x+1);
  }
  const silhouette=new THREE.MeshBasicMaterial({color:0x151d20,transparent:true,opacity:.8,depthWrite:false});
  for(const [x,y,z,offset]of[[-15.6,13.7,1.68,0],[-10.95,16.8,1.68,11],[12,13.7,-1.82,19],[15.1,16.8,-1.82,31]]){
    const group=new THREE.Group();group.position.set(x,y-.38,z);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),silhouette);head.position.y=.50;head.scale.z=.35;group.add(head);
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.28,3,8),silhouette);torso.position.y=.24;torso.scale.set(1.15,1,.3);group.add(torso);
    for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.26,3,6),silhouette);arm.position.set(s*.13,.21,0);arm.rotation.z=s*.15;arm.scale.z=.3;group.add(arm)}
    scene.add(group);residents.push({group,x,offset});
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(.81,1.40),new THREE.MeshBasicMaterial({color:0xffc082,transparent:true,opacity:.10,depthWrite:false}));glow.position.set(x,y,z-.04);scene.add(glow);lightRooms.push({mesh:glow,offset});
  }
  // Water leaves actual awning edges and downspout mouths, then splashes on the curb.
  const outlets=[[-17.9,2.87,2.85],[-8.5,2.87,2.85],[8.0,2.80,-.7],[18.0,2.80,-.7],[-7.22,2.8,-6.8],[7.25,3.4,-13.8]];
  const positions=[],seeds=[],heights=[];
  for(const [x,y,z]of outlets)for(let i=0;i<36;i++){const phase=i/36;for(const end of [0,1]){positions.push(x+(i%3-1)*.013,y,z+(i%5-2)*.012);seeds.push(phase);heights.push(end)}}
  const waterGeo=new THREE.BufferGeometry();waterGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));waterGeo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));waterGeo.setAttribute('end',new THREE.Float32BufferAttribute(heights,1));
  const waterMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`attribute float seed;attribute float end;uniform float time;varying float alpha;void main(){vec3 p=position;float age=fract(seed+time*.78);p.y=mix(position.y,.30,age*age)-end*.065;p.z+=age*.14;alpha=.10+age*.10;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying float alpha;void main(){gl_FragColor=vec4(.52,.67,.71,alpha);}`});
  const runoff=new THREE.LineSegments(waterGeo,waterMaterial);runoff.frustumCulled=false;scene.add(runoff);
  const impactGeo=new THREE.RingGeometry(.88,1,20);impactGeo.rotateX(-Math.PI/2);
  const impacts=new THREE.InstancedMesh(impactGeo,new THREE.MeshBasicMaterial({color:0x8aadb6,transparent:true,opacity:.18,depthWrite:false}),outlets.length*3);impacts.frustumCulled=false;scene.add(impacts);
  // A little heat over bowls and pans, confined to the kitchen rather than the whole street.
  const vaporCanvas=document.createElement('canvas');vaporCanvas.width=vaporCanvas.height=64;const cx=vaporCanvas.getContext('2d'),gradient=cx.createRadialGradient(32,32,0,32,32,30);gradient.addColorStop(0,'rgba(220,221,208,.5)');gradient.addColorStop(.5,'rgba(220,221,208,.16)');gradient.addColorStop(1,'rgba(220,221,208,0)');cx.fillStyle=gradient;cx.fillRect(0,0,64,64);const vaporTex=new THREE.CanvasTexture(vaporCanvas);
  const vaporGeo=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1,1));const origins=[],phases=[];
  for(const [x,y,z]of[[-15.55,1.38,.9],[-11.8,1.38,.9],[-14.3,1.38,.9],[-13.7,1.45,-.55],[-7.36,1.8,1.56]])for(let i=0;i<7;i++){origins.push(x,y,z);phases.push(i/7)}
  vaporGeo.instanceCount=phases.length;vaporGeo.setAttribute('origin',new THREE.InstancedBufferAttribute(new Float32Array(origins),3));vaporGeo.setAttribute('phase',new THREE.InstancedBufferAttribute(new Float32Array(phases),1));
  const vapor=new THREE.Mesh(vaporGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},map:{value:vaporTex}},vertexShader:`attribute vec3 origin;attribute float phase;uniform float time;varying vec2 vUv;varying float alpha;void main(){float age=fract(time*.20+phase);vec3 p=origin+vec3(sin(age*6.+phase)*age*.14,age*.92,age*.12);vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=position.xy*(.16+age*.45);gl_Position=projectionMatrix*mv;vUv=uv;alpha=sin(age*3.14159)*.23;}`,fragmentShader:`uniform sampler2D map;varying vec2 vUv;varying float alpha;void main(){gl_FragColor=vec4(.80,.77,.65,texture2D(map,vUv).a*alpha);}`}));vapor.frustumCulled=false;scene.add(vapor);
  const dummy=new THREE.Object3D();
  // Wind-tumbled scraps stay small, grounded and off the main walking path.
  const scraps=new THREE.InstancedMesh(new THREE.PlaneGeometry(.12,.17),new THREE.MeshStandardMaterial({color:0x8c897b,roughness:1,side:THREE.DoubleSide}),14);scene.add(scraps);
  function update(t){
    for(const {mesh,rest,phase,height}of cloths){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=rest[i*3],y=rest[i*3+1],weight=Math.min(1,-y/height);p.setXYZ(i,x+Math.sin(t*.7+phase)*weight*.013,y,rest[i*3+2]+(Math.sin(t*1.1+x*3+phase)*.07+Math.sin(t*.37+phase)*.04)*weight*weight)}p.needsUpdate=true;mesh.geometry.computeVertexNormals();}
    for(const r of residents){const p=(t+r.offset)%56,walk=THREE.MathUtils.smoothstep(p,7,18)-THREE.MathUtils.smoothstep(p,32,44);r.group.position.x=r.x-.21+walk*.40;r.group.rotation.z=Math.sin(t*.4+r.offset)*.018;}
    for(const r of lightRooms)r.mesh.material.opacity=.055+(Math.sin(t*.37+r.offset)*.5+.5)*.07;
    waterMaterial.uniforms.time.value=t;vapor.material.uniforms.time.value=t;
    outlets.forEach(([x,y,z],i)=>{for(let j=0;j<3;j++){const phase=(t*1.7+j/3)%1;dummy.position.set(x,.30,z+.14);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.025+phase*.18);dummy.scale.y=1;dummy.updateMatrix();impacts.setMatrixAt(i*3+j,dummy.matrix)}});impacts.instanceMatrix.needsUpdate=true;
    for(let i=0;i<14;i++){const gust=Math.pow(Math.max(0,Math.sin(t*.14+i)),8),x=(i%2?1:-1)*(6.6+(i%3)*.15);dummy.position.set(x+Math.sin(t*.28+i)*gust*.16,.05+gust*.025,-17+i*1.6+Math.sin(t*.16+i)*gust*.3);dummy.rotation.set(-Math.PI/2+gust*.5,Math.sin(t*.2+i)*gust, i*2.39);dummy.scale.setScalar(1);dummy.updateMatrix();scraps.setMatrixAt(i,dummy.matrix)}scraps.instanceMatrix.needsUpdate=true;
  }
  update(0);
  return {update,setDepthPass(hidden){vapor.visible=!hidden},get state(){return {clothPanels:cloths.length,windowResidents:residents.length,runoffOutlets:outlets.length}}};
}
