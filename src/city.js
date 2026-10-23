import { assetUrl } from './asset-url.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function buildCity(scene) {
 let seed=91213; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const mats={},batches=new Map(),moving=[],flickers=[],colliders=[];
 const material=(n,c,rough=.7,metal=.1,emit=0)=>mats[n]??(mats[n]=new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal,emissive:c,emissiveIntensity:emit}));
 const concrete=material('concrete',0x35434b),concrete2=material('concrete2',0x273a45),edge=material('edge',0x4d575b),dark=material('dark',0x0b161e,.5,.6),metal=material('metal',0x38474a,.35,.75),red=material('red',0x58232e),gold=material('gold',0xa08a47,.5,.5),roadpaint=material('paint',0x52615a,.87,0),cyan=material('cyan',0x35d8ef,.3,.2,3),pink=material('pink',0xfa288e,.3,.1,3),warm=material('warm',0xffba6a,.5,.1,2),windowDark=material('windowDark',0x102530,.22,.6);
 const shopGlow=material('shopGlow',0xc5823b,.5,.1,.65);
 const texLoader=new THREE.TextureLoader();const wallTex=texLoader.load(assetUrl('concrete.png'));wallTex.colorSpace=THREE.SRGBColorSpace;wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;wallTex.anisotropy=4;for(const m of [concrete,concrete2,edge]){m.map=wallTex;m.bumpMap=wallTex;m.bumpScale=.06;m.color.setHex(m===concrete?0x909391:m===concrete2?0x697981:0x9b9e96)}
 const roomTex=texLoader.load(assetUrl('windows.png'));roomTex.colorSpace=THREE.SRGBColorSpace;roomTex.anisotropy=4;const windowMat=new THREE.MeshBasicMaterial({map:roomTex,vertexColors:true});
 const wearTex=texLoader.load(assetUrl('asphalt.png'));wearTex.wrapS=wearTex.wrapT=THREE.RepeatWrapping;roadpaint.transparent=true;roadpaint.onBeforeCompile=shader=>{shader.uniforms.wearMap={value:wearTex};shader.vertexShader='varying vec3 vPaintPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPosition=position;');shader.fragmentShader='uniform sampler2D wearMap;varying vec3 vPaintPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\nfloat wear=texture2D(wearMap,vPaintPosition.xz*.65).r;diffuseColor.a*=smoothstep(.075,.24,wear)*.85;');};const distantWindowMat=new THREE.MeshBasicMaterial({vertexColors:true});
 function mergeParts(group){const maps=new Map();for(const o of [...group.children]){if(!o.isMesh)continue;o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);if(!maps.has(o.material))maps.set(o.material,[]);maps.get(o.material).push(g);group.remove(o)}for(const [m,gs]of maps){const g=mergeGeometries(gs,false);group.add(new THREE.Mesh(g,m));gs.forEach(x=>x.dispose())}}
 const temp=new THREE.Object3D();
 function batch(geo,mat,pos,scale,rot=[0,0,0]){temp.position.set(...pos);temp.scale.set(...scale);temp.rotation.set(...rot);temp.updateMatrix();const g=geo.clone().applyMatrix4(temp.matrix);if(mat===concrete||mat===concrete2||mat===edge){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.5?p.getZ(i):p.getX(i))*.2,(ny>.5?p.getZ(i):p.getY(i))*.2)}}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);return g}
 const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,8),plane=new THREE.PlaneGeometry(1,1);
 const box=(x,y,z,w,h,d,m=concrete,rot)=>batch(cube,m,[x,y,z],[w,h,d],rot);
 const cyl=(x,y,z,r,h,m=metal,rot)=>batch(cylinder,m,[x,y,z],[r,h,r],rot);
 function window(x,y,z,w,h,rot=0,lit=true){const near=z>-62;const g=batch(plane,lit?(near?windowMat:distantWindowMat):windowDark,[x,y,z],[w,h,1],[0,rot,0]);if(lit){const c=near?new THREE.Color(1,1,1).multiplyScalar(.75+rnd()*1.65):new THREE.Color().setHSL(rnd()<.7?.10:.54,.35,.14+rnd()*.26);if(near){const tile=Math.floor(rnd()*16),tx=tile%4,ty=Math.floor(tile/4),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)*.96+.02+tx)/4,(uv.getY(i)*.96+.02+ty)/4)}const a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3))}}
 function pipe(points,r=.055,m=metal){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));batch(new THREE.TubeGeometry(path,points.length*4,r,6,false),m,[0,0,0],[1,1,1])}
 function label(text,x,y,z,w,h,color='#5ef1ff',rot=0,bg='#091822',vertical=false){
 const c=document.createElement('canvas');const density=Math.min(Math.max(256,64/Math.min(w,h)),2048/Math.max(w,h));c.width=Math.round(w*density);c.height=Math.round(h*density);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
 const font="'Hiragino Sans','Noto Sans JP',sans-serif";
 if(vertical){const chars=[...text],cell=c.height/(chars.length+.55),size=Math.min(c.width*.70,cell*.73);ctx.font=`600 ${size}px ${font}`;chars.forEach((ch,i)=>ctx.fillText(ch,c.width/2,cell*(i+.78)));}
 else{let size=c.height*.57;ctx.font=`500 ${size}px ${font}`;size*=Math.min(1,c.width*.86/ctx.measureText(text).width);ctx.font=`500 ${size}px ${font}`;ctx.fillText(text,c.width/2,c.height*.51);}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,color:new THREE.Color(1.12,1.12,1.12)});const mesh=new THREE.Mesh(plane,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,1);mesh.rotation.y=rot;scene.add(mesh);return mesh}
 function neonSign(text,x,y,z,w,h,color,vertical=false,rot=0){box(x,y,z-.11,w+.14,h+.14,.22,dark,[0,rot,0]);const s=label(text,x,y,z+.02,w,h,color,rot,'#07131c',vertical);s.material.color.setRGB(2.4,2.4,2.4);flickers.push(s);return s}
 function light(color,intensity,x,y,z,dist=15){const l=new THREE.PointLight(color,intensity,dist,2);l.position.set(x,y,z);scene.add(l);return l}
 // Sidewalk foundation blocks and continuous streets; open crossing centered at origin.
 for(const side of [-1,1]){box(side*16,.12,-28,18,.25,64,concrete2);box(side*7.05,.23,-28,.26,.28,64,edge);box(side*16,.23,4,17,.28,.26,edge)}
 for(let z=-58;z<4;z+=1.2){for(const side of [-1,1]){box(side*8.5,.26,z,1.3,.025,1.13,edge);if(z<2||z>7)box(side*7.82,.29,z,.18,.08,.48,z%2<1?gold:dark)}}
 // Subtle cracks between sidewalk slabs, drainage grilles and road markings.
 for(let i=0;i<13;i++){box(-6+i, .025,5.5,.54,.018,3.0,roadpaint);box(-6+i,.025,-7,.54,.018,2.3,roadpaint)}
 for(let z=-70;z<26;z+=5){box(.05,.024,z,.1,.014,2.0,gold);box(-.19,.024,z,.1,.014,2.0,gold)}
 for(const x of [-6.7,6.7])box(x,.022,-15,.07,.018,75,gold);
 for(let z=-25;z<16;z+=7)for(const side of [-1,1]){box(side*7.2,.035,z,.55,.035,1.0,dark);for(let k=0;k<7;k++)box(side*7.2,.057,z-.42+k*.14,.5,.025,.04,metal)}
 // Buildings: authored near blocks, then progressively simplified city fabric.
 function building(x,z,w,d,h,idx,detail=true){
 const front=z+d/2,side=x>0?-1:1,faceX=x+side*w/2;
 if(idx<=2&&detail){box(x,(h+3.15)/2,z,w,h-3.15,d,idx%2?concrete:concrete2);box(x,.19,z,w,.12,d,concrete2);box(x,1.55,z-d/2+.15,w,3.0,.3,concrete2);box(x-side*(w/2-.15),1.55,z,.3,3,d,concrete2);for(const xx of [x-w/2+.12,x+w/2-.12])box(xx,1.6,front-.08,.24,3.2,.24,metal);}else box(x,h/2,z,w,h,d,idx%2?concrete:concrete2);colliders.push({x,z,w:w+.65,d:d+.65,h});
 if(idx>2||!detail)box(x,.55,z,w+.3,1.1,d+.3,dark);box(x,h+.18,z,w+.45,.36,d+.45,edge);
 for(let y=3.1;y<h;y+=3.1){box(x,y,front+.10,w+.22,.20,.30,edge);box(faceX+side*.06,y,z,.24,.20,d,edge)}
 for(let y=4.4;y<h-.6;y+=3.1){for(let xx=x-w/2+.85;xx<x+w/2-.4;xx+=1.55){box(xx,y,front+.03,1.04,1.72,.10,dark);window(xx,y,front+.091,.83,1.43,0,rnd()>.25);box(xx,y,front+.13,.05,1.5,.07,metal);box(xx,y-.3,front+.13,.9,.04,.07,metal)}
 for(let zz=z-d/2+.9;zz<front-.2;zz+=1.7){box(faceX+side*.03,y,zz,.1,1.7,1.1,dark);window(faceX+side*.091,y,zz,.85,1.4,side*Math.PI/2,rnd()>.28)}}
 if(detail){
 // Street-facing shop interiors: recessed warm glass, mullions, counter silhouettes.
 for(let xx=x-w/2+1;idx>2&&xx<x+w/2-.4;xx+=1.8){box(xx,1.65,front+.1,1.48,2.15,.12,dark);box(xx,1.68,front+.18,1.29,1.88,.06,shopGlow);window(xx,1.68,front+.222,1.22,1.76,0,true);box(xx,1.55,front+.23,.065,2,.08,metal);box(xx,1.04,front+.25,1.3,.12,.13,metal);for(let k=0;k<3;k++){cyl(xx-.45+k*.43,1.0,front+.34,.075,.22,blackMat());box(xx-.42+k*.4,2.36,front+.26,.16,.29,.05,red)}}
 for(let zz=z-d/2+1;idx>2&&zz<front-.4;zz+=1.8){box(faceX+side*.1,1.6,zz,.12,2.05,1.45,dark);box(faceX+side*.18,1.68,zz,.06,1.83,1.24,shopGlow);window(faceX+side*.22,1.68,zz,1.2,1.76,side*Math.PI/2,true);box(faceX+side*.25,1.65,zz,.07,2,.05,metal)}
 const awn=idx%2?red:dark;box(x,3.0,front+.62,w+.55,.16,1.3,awn,[-.13,0,0]);box(x,2.85,front+1.24,w+.6,.24,.09,awn);
 for(let xx=x-w/2;xx<x+w/2;xx+=.6)box(xx,3.04,front+.62,.04,.05,1.3,metal,[-.13,0,0]);
 for(let y=4;y<h-1;y+=6.2){box(x,y-.8,front+.5,w-.3,.16,.9,concrete);box(x,y+.13,front+.93,w-.2,.06,.06,metal);for(let xx=x-w/2+.2;xx<x+w/2;xx+=.38)box(xx,y-.32,front+.93,.035,.87,.035,metal)}
 for(let yy=4.2;yy<h;yy+=3.1){for(let k=0;k<3;k++){const xx=x-w/2+1+k*(w-2)/3;box(xx,yy-.48,front+.5,.45,.22,.25,red);batch(new THREE.IcosahedronGeometry(.22,0),material('foliage',0x284b3b,.9),[xx,yy-.22,front+.5],[1,.8,1]);}if(yy>7){box(x+.9,yy-.1,front+.72,.42,.7,.03,red);}}
 for(let n=0;n<3;n++){const px=x-w/2+.25+n*.17;pipe([[px,0,front+.3],[px,h-.5,front+.3],[px+.3,h,front+.3],[px+.3,h+.6,front-.3]],.055);for(let y=1;y<h;y+=2.2)box(px,y,front+.3,.14,.08,.15,metal)}
 for(let n=0;n<5;n++){const zz=z-d/2+1+n*(d-2)/5,yy=4+(n%3)*3.1;box(faceX+side*.30,yy,zz,.6,.75,1.05,edge);const fan=new THREE.Group();fan.position.set(faceX+side*.62,yy,zz);fan.rotation.y=side*Math.PI/2;const ring=new THREE.Mesh(new THREE.TorusGeometry(.28,.022,5,16),dark);fan.add(ring);const blades=new THREE.Group();for(let b=0;b<4;b++){const bl=new THREE.Mesh(cube,metal);bl.scale.set(.07,.44,.03);bl.rotation.z=b*Math.PI/2;bl.position.set(Math.sin(b*Math.PI/2)*.10,Math.cos(b*Math.PI/2)*.10,0);blades.add(bl)}mergeParts(blades);fan.add(blades);scene.add(fan);moving.push(t=>blades.rotation.z=t*(3+n*.3));}
 // Roofs: parapets, water tanks, ducts and warning beacons.
 for(const s of [-1,1]){box(x+s*w/2,h+.65,z,.15,.8,d,metal);box(x,h+.65,z+s*d/2,w,.8,.15,metal)}
 cyl(x-1,h+1.65,z,.85,2.7,metal);cyl(x-1,h+3.02,z,.97,.12,dark);for(let a=0;a<4;a++)cyl(x-1,h+.65+a*.65,z,.88,.045,edge);
 box(x+1.4,h+.65,z+1.4,1.7,1.1,1.2,metal);box(x+1.4,h+1.24,z+1.4,1.9,.12,1.4,edge);pipe([[x+1.5,h+.5,z],[x+1.5,h+1.8,z],[x+1.5,h+1.8,z-2]],.19);
 cyl(x+w/2-.6,h+2,z,.04,4,metal);const beacon=new THREE.Mesh(new THREE.SphereGeometry(.10,6,4),pink);beacon.position.set(x+w/2-.6,h+4,z);scene.add(beacon);moving.push(t=>beacon.visible=Math.sin(t*2.1+idx)>0);
 }
 }
 function blackMat(){return dark}
 building(-13,-5,10,13,22.1,1,true);building(13,-9,10,14,24.7,2,true);
 building(-14,-24,12,15,21.5,3,true);building(15,-30,14,18,24,4,true);
 building(-17,-46,16,18,31,5,false);building(16,-53,15,19,35,6,false);

 // Asymmetrical rooftop service architecture and exposed utility systems.
 box(-15,14.5,-8,3.3,3.0,3.8,concrete);box(-15,16.1,-8,3.6,.22,4.1,edge);box(-15,14.1,-5.98,1.05,1.9,.06,metal);
 for(let j=0;j<7;j++){box(-16.3,13.6+j*.35,-5.65,.65,.06,.06,metal)}box(-16.65,14.6,-5.65,.06,2.5,.06,metal);box(-15.95,14.6,-5.65,.06,2.5,.06,metal);
 for(let j=0;j<3;j++){box(12.2+j*1.0,13.6,-6, .85,.75,2.1,metal);for(let k=0;k<8;k++)box(12.2+j*1.,14,-6.8+k*.22,.72,.03,.045,dark)}
 for(let j=0;j<5;j++)pipe([[8.12,0,-9+j*.21],[8.12,11,-9+j*.21],[8.12,11.7,-8.5+j*.21],[8.12,11.7,-3.2],[8.12,13.7,-2.8]],.065,j%2?metal:edge);
 pipe([[-7.82,.5,-3],[-7.82,6,-3],[-7.82,6.6,-3.6],[-7.82,6.6,-7.1],[-7.82,12.8,-7.1]],.17,metal);
 for(let j=0;j<5;j++){box(-7.75,2+j*2.1,-3,.37,.09,.35,metal);box(8.0,2+j*2.1,-8.5,.35,.1,1.4,metal)}

 // Front-facing industrial additions, with visible collars and grilles.
 pipe([[17.25,.4,-1.58],[17.25,8.7,-1.58],[16.6,9.3,-1.58],[15.7,9.3,-1.58],[15.7,13.9,-1.58]],.15,metal);
 pipe([[16.7,.4,-1.49],[16.7,6.0,-1.49],[15.5,6.5,-1.49],[13.8,6.5,-1.49]],.12,edge);
 for(let yy=1.2;yy<9;yy+=1.5)box(17.25,yy,-1.55,.37,.11,.32,edge);
 for(let j=0;j<3;j++){const xx=12.3+j*1.55;box(xx,8.0,-1.6,1.15,.65,.5,edge);for(let k=0;k<7;k++)box(xx,7.76+k*.073,-1.32,.98,.024,.035,dark)}
 neonSign('眠らない',-14,18.5,-16.37,7.6,1.6,'#f47cb9');
 // Dish antennas have distinct concave silhouettes.
 for(const [x,y,z]of[[-16,16.5,-7],[15,14,-12]]){cyl(x,y+.6,z,.045,1.2,metal);const dish=new THREE.SphereGeometry(.55,12,6,0,Math.PI*2,0,Math.PI*.42);batch(dish,edge,[x,y+1.2,z],[1,.4,1],[.45,0,.3]);pipe([[x,y+1.2,z],[x+.2,y+1.65,z+.3]],.025)}
 neonSign('終電',-17.4,12.0,1.65,1.2,2.8,'#eba85f',true);label('終電 02:18',-13.3,12.0,1.64,4.6,.40,'#aabbbc');
 // Side streets expose larger flanking buildings rather than empty diorama edges.
 building(-30,-6,14,17,23,2,false);building(31,-5,14,18,27,3,false);
 for(let i=0;i<55;i++){const x=(rnd()-.5)*165,z=-65-rnd()*130,w=5+rnd()*12,d=6+rnd()*12,h=22+rnd()*65;box(x,h/2,z,w,h,d,concrete2);box(x,h+.3,z,w+.15,.6,d+.15,dark);if(i%3===0)box(x+w*.3,h+3,z,1.4,6,1.4,dark);
 for(let y=3;y<h-1;y+=2.1)for(let xx=x-w/2+.6;xx<x+w/2-.3;xx+=1.25){if(rnd()>.35)window(xx,y,z+d/2+.03,.37,.72,0,true)}
 for(let y=4;y<h;y+=2.1)for(let zz=z-d/2+.5;zz<z+d/2;zz+=1.4)if(rnd()>.5)window(x+w/2+.03,y,zz,.35,.65,Math.PI/2,true);
 if(i%4===0){box(x-w/2-.02,h*.6,z+d/2+.06,.12,h*.55,.1,i%8?cyan:pink);const el=new THREE.Mesh(cube,cyan);el.scale.set(.5,1.7,.2);el.position.set(x+w/2-.4,0,z+d/2+.1);scene.add(el);moving.push(t=>el.position.y=(t*2+i*13)%h)}
 }

 // The city also continues behind the camera when the visitor orbits around the crossing.
 for(let i=0;i<24;i++){const x=(rnd()-.5)*180,z=65+rnd()*110,w=7+rnd()*11,d=7+rnd()*12,h=24+rnd()*46;box(x,h/2,z,w,h,d,concrete2);box(x,h+.2,z,w+.3,.4,d+.3,edge);for(let yy=3;yy<h;yy+=2.4)for(let xx=x-w/2+.7;xx<x+w/2-.5;xx+=1.4)if(rnd()>.35)window(xx,yy,z-d/2-.04,.4,.72,Math.PI,true)}
 const outerAd=neonSign('記憶',-25.7,17,2.61,2.5,6.2,'#9fcccf',true);outerAd.material.color.setRGB(1.2,1.2,1.2);
 box(-14,22.5,-16.65,8.2,2.5,.22,dark);label('眠らない街',-14,22.5,-16.49,7.8,2.1,'#c681ab');
 // Hero signage and street identity.
 neonSign('深夜食堂',-8.5,8.4,1.62,1.35,6.1,'#ff3cac',true);
 neonSign('新世界',9.0,10.7,-1.85,1.6,7.5,'#50eaff',true);
 label('深夜食堂',-13,3.65,1.73,3.0,.75,'#ffc888');label('営業中',-11.5,1.95,1.80,1.35,.32,'#ffdfa0');
 neonSign('宿 09',-8.8,15,-17,2.1,1.05,'#ff587e');neonSign('通信',8,19,-21,1.4,4,'#38c9ed',true);
 label('新世界修理店',13,3.5,-1.8,3.4,.75,'#55e9e9');
 light(0xffb467,85,-11,3.1,3.3,18);light(0xfc318f,180,-7.1,6.5,2,19);light(0x2ae0ff,210,7.5,7,-1.5,22);light(0xffbc71,60,10.0,2.8,-2.0,16);
 // Small lanterns, bins, traffic furniture and vending machines.
 for(let x=-16.5;x<-8;x+=3.4){cyl(x,2.5,2.85,.20,.48,shopGlow);cyl(x,2.76,2.85,.10,.12,dark);cyl(x,2.24,2.85,.13,.08,dark)}
 for(let n=0;n<30;n++){const side=n%2?1:-1,z=-35+Math.floor(n/2)*3.8;cyl(side*8.0,.64,z,.095,.98,metal);cyl(side*8.0,.94,z,.102,.13,gold);cyl(side*8.0,.21,z,.18,.1,dark)}
 for(const [x,z]of[[-9,3],[-17,3],[9,0],[10,-15],[-9,-18]]){cyl(x,.65,z,.36,1.2,dark);cyl(x,1.25,z,.39,.08,metal);for(let a=0;a<8;a++){const ang=a*Math.PI/4;box(x+Math.sin(ang)*.35,.7,z+Math.cos(ang)*.35,.035,.95,.035,metal)}}


 // Forecourt: small handmade street props break up broad surfaces.
 const leaf=material('leaf',0x183b30,.92),wood=material('wood',0x533e32,.85),paper=material('paper',0x8c968b,.9),bag=material('bag',0x152023,.6);
 for(const [px,pz]of[[-16.8,3],[-10.2,3.3],[11.0,.3],[17.1,-.1],[-8.5,-12]]){
  box(px,.49,pz,.65,.63,.62,concrete);for(let j=0;j<9;j++){const a=rnd()*6.28,r=.05+rnd()*.26,hh=.3+rnd()*.7;batch(new THREE.ConeGeometry(.16,hh,4),leaf,[px+Math.cos(a)*r,.8+hh/2,pz+Math.sin(a)*r],[1,1,1],[rnd()*.5,0,rnd()*.5]);}
 }
 // Restaurant pavement seating.
 for(const px of [-15.5,-12.6]){cyl(px,.82,3.05,.48,.08,wood);cyl(px,.45,3.05,.055,.75,metal);cyl(px,.1,3.05,.28,.07,metal);for(const dz of [-.68,.68]){cyl(px,.47,3.05+dz,.22,.09,red);for(const dx of [-.13,.13])box(px+dx,.25,3.05+dz,.04,.45,.04,metal)}cyl(px,.91,3.05,.075,.10,paper)}
 for(let n=0;n<35;n++){const x=(rnd()-.5)*44,z=5+rnd()*10;batch(plane,paper,[x,.025,z],[.15+rnd()*.16,.18+rnd()*.2,1],[-Math.PI/2,0,rnd()*6]);}
 for(let x=-35;x<36;x+=3){box(x,.029,9,.9,.014,.09,roadpaint);box(x,.029,14,.9,.014,.09,roadpaint)}
 // Pavement slab scoring and maintenance hatches.
 for(let x=-23;x<=23;x+=1.2){if(Math.abs(x)>8){for(let z=-.5;z<4;z+=1.2){box(x,.251,z,.018,.015,1.2,dark);box(x,.251,z,1.2,.015,.018,dark)}}}
 for(const [x,z]of[[-3.7,10],[4,-2]]){cyl(x,.033,z,.56,.022,metal);cyl(x,.045,z,.49,.02,dark);for(let i=-3;i<=3;i++)box(x+i*.12,.062,z,.035,.015,.72,metal)}
 // Wall posters and layered small signs, authored on canvas.
 label('09',-17.0,1.8,1.77,.6,.78,'#e0bfa5');label('修理',13,2.8,-1.78,3,.35,'#ffd17f');
 neonSign('ラーメン',-18.1,2.0,2.15,.58,1.9,'#ffb669',true);neonSign('24',17.7,4.4,-1.77,.7,1.1,'#e563c7');
 // Metro viaduct, guardrails, sleepers, overhead wires.
 const trackZ=-23,trackY=16.2;box(0,trackY,trackZ,84,.85,4.4,concrete);box(0,trackY+.50,trackZ+2.16,84,.6,.22,edge);box(0,trackY+.50,trackZ-2.16,84,.6,.22,edge);
 for(const x of [-36,-24,-8,8,24,36]){box(x,7.8,trackZ,1.0,15.2,1.1,concrete);box(x,15.1,trackZ,3.2,.8,3.3,edge)}
 for(const z of [trackZ-.9,trackZ+.9])box(0,trackY+.65,z,84,.15,.10,metal);
 for(let x=-42;x<42;x+=.8)box(x,trackY+.52,trackZ,.18,.12,2.2,dark);
 for(let x=-40;x<43;x+=2){box(x,trackY+1.07,trackZ+2.16,.035,.85,.035,metal);box(x,trackY+1.07,trackZ-2.16,.035,.85,.035,metal)}
 for(const z of [trackZ-2.16,trackZ+2.16])box(0,trackY+1.5,z,84,.05,.05,metal);
 label('K7 下町線',-2,16.17,trackZ+2.24,7,.52,'#a3b8b7');
 const train=new THREE.Group();scene.add(train);const trainHull=new RoundedBoxGeometry(1,1,1,2,.055);const trainBody=material('trainBody',0x69858d,.32,.65);const trainRoomTex=texLoader.load(assetUrl('windows.png'));trainRoomTex.colorSpace=THREE.SRGBColorSpace;trainRoomTex.repeat.set(.25,.25);trainRoomTex.offset.set(0,.75);const trainGlass=new THREE.MeshBasicMaterial({map:trainRoomTex,color:new THREE.Color(3,3,3)});
 function trainBox(x,y,z,w,h,d,m){const o=new THREE.Mesh(trainHull,m);o.position.set(x,y+6.2,z);o.scale.set(w,h,d);train.add(o);return o}
 for(let c=0;c<4;c++){const x=c*6.7;trainBox(x,11.65,trackZ,6.2,1.9,2.6,trainBody);trainBox(x,12.68,trackZ,6.1,.18,2.5,dark);trainBox(x,10.91,trackZ+1.32,6.1,.07,.06,cyan);for(let w=0;w<5;w++){trainBox(x-2.35+w*1.15,11.99,trackZ+1.31,.88,.77,.035,trainGlass);trainBox(x-2.35+w*1.15,11.99,trackZ-1.31,.88,.77,.035,trainGlass);trainBox(x-2.35+w*1.15,11.76,trackZ+1.35,.05,.55,.025,dark);trainBox(x-2.22+w*1.15,11.78,trackZ+1.35,.23,.33,.025,dark)}for(const side of [-1,1]){for(const dx of [-1.75,1.75]){trainBox(x+dx,11.54,trackZ+side*1.34,.55,1.68,.045,dark);trainBox(x+dx,11.94,trackZ+side*1.38,.39,.62,.03,trainGlass);trainBox(x+dx,11.08,trackZ+side*1.38,.4,.72,.03,trainBody);}trainBox(x,12.44,trackZ+side*1.34,5.9,.07,.035,edge);}trainBox(x+3.3,11.4,trackZ,.38,1.4,2.1,dark)}
 trainBox(-3.13,11.3,trackZ+.8,.035,.21,.3,warm);trainBox(-3.13,11.3,trackZ-.8,.035,.21,.3,warm);
 mergeParts(train);const trainLight=new THREE.PointLight(0x83d6ff,130,20,2);trainLight.position.set(0,15.0,trackZ+2.3);scene.add(trainLight);moving.push(t=>{let p=(t%50);train.position.x=p<40?5-p*1.5:-85;trainLight.position.x=train.position.x-3;trainLight.intensity=p<40?95:0});
 // Street lamps.
 for(const [x,z]of[[-7,6],[7,-6],[-7,-16],[7,-34],[-7,-44]]){cyl(x,2.7,z,.085,5.4,metal);pipe([[x,5.1,z],[x,5.7,z],[x+(x<0?.5:-.5),5.9,z],[x+(x<0?1.1:-1.1),5.9,z]],.07);box(x+(x<0?1:-1),5.83,z,.55,.10,.32,warm)}
 light(0xffc888,45,-6,5.65,6,17);light(0xffc888,40,6,5.65,-6,17);

 // A few changing apartment lights: independent quiet signs of people awake upstairs.
 for(let i=0;i<10;i++){const m=new THREE.MeshBasicMaterial({color:i%3?0xffae55:0x56b7de,transparent:true,opacity:.06,depthWrite:false});const pane=new THREE.Mesh(plane,m);pane.position.set(i<5?-16.15+(i%5)*1.55:9.15+(i%5)*1.55,i%2?7.5:10.6,i<5?1.60:-1.89);pane.scale.set(.80,1.36,1);scene.add(pane);moving.push(t=>{m.opacity=.015+Math.pow(Math.max(0,Math.sin(t*.15+i*4.5)),12)*.20})}
 // Cable bundles with subtle wind deformation at group level.
 for(let n=0;n<6;n++){const z=-3-n*5,pts=[];for(let i=0;i<=20;i++){const u=i/20;pts.push(new THREE.Vector3(-8+16*u,8+n*.28-Math.sin(u*Math.PI)*(1.2+n*.09),z+Math.sin(u*Math.PI)*.3))}const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.025,4,false),o=new THREE.Mesh(g,dark);scene.add(o);moving.push(t=>o.position.z=Math.sin(t*.7+n)*.055)}
 // Traffic lights.
 for(const [x,z]of[[7.3,3.5],[-7.3,-8]]){cyl(x,2,z,.065,4,metal);box(x,3.6,z,.38,1.0,.32,dark);for(let i=0;i<3;i++){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),i===0?pink:i===1?gold:cyan);lamp.scale.z=.3;lamp.position.set(x,3.9-i*.3,z+.18);scene.add(lamp);moving.push(t=>lamp.visible=Math.floor(t/13)%3===i)}}

 light(0xf14947,28,4.1,.7,-21,8);light(0x34c8e9,55,-5,4,-39,16);
 neonSign('電脳',-6.9,6,-28,1.1,3.2,'#49dfee',true);neonSign('夜行',6.8,4.3,-36,1.2,2.8,'#ff547d',true);neonSign('営業中',-6.8,3,-46,1.7,.6,'#ffb765');
 // Distinctive skyline forms and big typographic media towers.
 box(-6,42,-95,13,84,10,concrete2);box(-6,86,-95,9,4,7,dark);box(-6,92,-95,.2,13,.2,metal);box(-12.3,51,-89.9,.12,57,.12,cyan);
 label('夢',-6,51,-89.88,7,9,'#56d9fc');label('2091',-6,69,-89.8,6,2,'#aec7d6');
 box(22,43,-105,17,86,16,concrete);box(22,88,-105,11,4,11,dark);box(22,92,-105,6,4,6,concrete2);
 for(let yy=5;yy<81;yy+=2.2)for(let xx=15;xx<30;xx+=1.3)if(rnd()>.35)window(xx,yy,-96.85,.38,.73,0,true);
 // Restaurant interior patrons are anonymous chunky silhouettes, not gameplay NPCs.
 for(const xx of [-15.4,-12.2,-10.4]){cyl(xx,1.12,1.79,.13,.55,dark);batch(new THREE.SphereGeometry(.115,8,6),dark,[xx,1.48,1.80],[1,1,1]);box(xx,.90,1.95,.40,.05,.14,wood)}
 // Distant flying couriers and traffic lights.
 for(let n=0;n<10;n++){const drone=new THREE.Group();const chassis=new THREE.Mesh(cube,dark);chassis.scale.set(.6,.17,.6);drone.add(chassis);for(const side of [-1,1]){const a=new THREE.Mesh(new THREE.SphereGeometry(.06,5,4),side<0?pink:cyan);a.position.set(side*.45,0,0);drone.add(a)}scene.add(drone);moving.push(t=>{drone.position.set(Math.sin(t*.10+n*2)*30,13+n*2+Math.sin(t+n)*.2,-35-n*8);drone.rotation.y=t*.1+n})}
 for(let n=0;n<7;n++){const car=new THREE.Group();for(const side of [-1,1]){const m=new THREE.Mesh(cube,n%2?pink:warm);m.scale.set(.16,.15,.08);m.position.set(side*.55,.65,0);car.add(m)}scene.add(car);moving.push(t=>car.position.set(n%2?2:-2,0,-32-((t*5+n*14)%110)))}
 // Merge static material groups into a small number of draw calls.
 for(const [m,gs]of batches){const merged=mergeGeometries(gs,false);if(!merged)throw new Error('Failed city geometry merge');const mesh=new THREE.Mesh(merged,m);mesh.castShadow=m===concrete||m===concrete2;mesh.receiveShadow=true;scene.add(mesh);gs.forEach(g=>g.dispose())}
 return {colliders,train,update(t){moving.forEach(fn=>fn(t));flickers.forEach((s,i)=>{s.material.opacity=1;s.visible=!(Math.sin(t*18+i*29)>.996&&Math.sin(t*1.3+i)>.4)})},label,light};
}
