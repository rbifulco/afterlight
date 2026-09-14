import * as THREE from 'three';
import { createHolographicScreen } from './hologram.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildStreetLife(scene,city,vehicles) {
  const staticParts=new Map(),animated=[],holograms=[];
  const mat=(color,metalness=.25,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const steel=mat(0x26383d,.8,.3),black=mat(0x081318,.3,.55),cream=mat(0xc6bca1,.2,.6),orange=mat(0xc17332,.55,.35),wood=mat(0x604631,.1,.6),chrome=mat(0x899793,.9,.24),ceramic=mat(0xe7d8bb,.05,.28);
  const glow=color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.5,roughness:.3});
  const cyan=glow(0x59e4ec),warm=glow(0xffb759),pink=glow(0xe163ad);
  const rounded=new RoundedBoxGeometry(1,1,1,2,.04),cube=new THREE.BoxGeometry(1,1,1);
  function mesh(g,m,p,scale=[1,1,1],rot=[0,0,0],merge=true){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...scale);o.rotation.set(...rot);if(merge){o.updateMatrix();if(!staticParts.has(m))staticParts.set(m,[]);staticParts.get(m).push((g.index?g.toNonIndexed():g.clone()).applyMatrix4(o.matrix))}else{scene.add(o);o.castShadow=true;o.receiveShadow=true}return o}
  const box=(p,s,m=steel,round=false)=>mesh(round?rounded:cube,m,p,s);
  const cyl=(p,r,h,m=chrome)=>mesh(new THREE.CylinderGeometry(r,r,h,20),m,p);
  function pipe(points,r=.025,m=steel){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),points.length*5,r,6,false),m,[0,0,0])}
  function screen(w,h,p,draw,holographic=false){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.round(768*h/w);const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;animated.push({ctx,canvas,texture,draw});
    if(holographic){const hologram=createHolographicScreen(w,h,texture,p[0]<0?0x65e9f4:0xe99eff);hologram.group.position.set(...p);scene.add(hologram.group);holograms.push(hologram);return hologram.group;}
    const panel=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),p,[1,1,1],[0,0,0],false);box([p[0],p[1],p[2]-.08],[w+.14,h+.14,.15],black,true);return panel;
  }
  function text(ctx,s,x,y,size=28,color='#9bd9de'){ctx.fillStyle=color;ctx.font=`${size>40?'600':'400'} ${size}px monospace`;ctx.fillText(s,x,y)}
  function base(ctx,c,color='#06181d'){ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height)}
  function scanlines(ctx,c,t){ctx.fillStyle='#050a1240';for(let y=0;y<c.height;y+=5)ctx.fillRect(0,y,c.width,1);ctx.fillStyle='#91dfff0a';ctx.fillRect(0,(t*65)%c.height,c.width,12)}
  let time=0;
  const novaImage=new Image();novaImage.src='/assets/nova-ad.png';
  const adImage=new Image();adImage.src='/assets/kaen-ad.png';
  // Floating light fields have projector bars instead of opaque billboard housings.
  for(const [x,y,z,w,h] of [[-14,8.25,2.85,4.4,6.4],[13.9,8.30,-.42,4.9,6.7]]){
    const emitterMaterial=x<0?cyan:pink;
    box([x,y-h/2-.22,z],[w*.86,.20,.52],steel,true);
    box([x,y-h/2-.105,z+.02],[w*.79,.025,.23],black);
    for(let i=0;i<7;i++){const px=x+(i-3)*w*.105;cyl([px,y-h/2-.085,z+.02],.065,.035,emitterMaterial);box([px,y-h/2-.19,z+.28],[.12,.055,.025],chrome);}
    for(const side of [-1,1])pipe([[x+side*w*.32,y-h/2-.24,z],[x+side*w*.32,y-h/2-.42,z-.55],[x+side*w*.32,y-h/2-.65,z-.65]],.055);
    city.light(x<0?0x60dce9:0xce83e4,13,x,y-h/2+.8,z+.25,7);
    screen(w,h,[x,y,z+.02],(ctx,c,t)=>{base(ctx,c);const art=x<0?novaImage:adImage;if(art.complete&&art.naturalWidth)ctx.drawImage(art,0,0,c.width,c.height);scanlines(ctx,c,t)},true);
  }
  screen(12.6,.95,[0,16.12,-20.65],(ctx,c,t)=>{base(ctx,c);const p=t%50;const eta=Math.ceil(50-p);text(ctx,'K7  LOWER LINE',22,42,29);text(ctx,p<25?'← TRAIN PASSING':`NEXT SERVICE  ${eta}s`,380,42,25,'#edc58d');});
  screen(5.6,.52,[-12.8,4.42,2.12],(ctx,c,t)=>{base(ctx,c,'#27180f');text(ctx,'深夜食堂  /  MIDNIGHT NOODLES',20,49,35,'#ffc780');});
  // Baked rear-wall detail sits behind real counters, patrons and work surfaces.
  const textureLoader=new THREE.TextureLoader();
  for(const [url,p,w,h]of[['/assets/noodle-shop.png',[-13,1.75,-1.12],9.35,2.4],['/assets/workshop-wall.png',[13,1.65,-4.58],9.4,2.4]]){const texture=textureLoader.load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,color:new THREE.Color(1.4,1.25,1.1)}),p,[1,1,1],[0,0,0],false);}
  // A physical noodle bar: open volume, counter, kitchen, crockery and stools.
  box([-13,.29,.1],[9.8,.09,3.9],black);box([-13,1.6,-1.25],[9.65,2.8,.1],cream);
  for(let x=-17.5;x<-8.6;x+=.55){box([x,1.6,-1.18],[.018,2.7,.02],steel)}
  box([-13,.74,.72],[8.9,1.00,.75],wood);box([-13,1.27,.78],[9.25,.13,1.05],chrome,true);
  box([-13,.85,-.66],[8.9,1.1,.70],steel);box([-13,1.45,-.8],[8.9,.07,.46],chrome);
  box([-13,2.65,-.65],[6.4,.55,.9],steel,true);for(let x=-15.8;x<-10;x+=.23)box([x,2.36,-.25],[.04,.03,.55],black);
  pipe([[-13,2.75,-.6],[-13,3.2,-.6],[-13,3.4,-1.6]],.23);
  for(let x=-16.8;x<-9;x+=1.25){
    cyl([x,.69,1.9],.21,.09,orange);cyl([x,.43,1.9],.035,.52,chrome);cyl([x,.20,1.9],.20,.045,chrome);
    mesh(new THREE.SphereGeometry(.17,16,8,0,Math.PI*2,0,Math.PI/2),ceramic,[x,1.355,.90],[1,-.6,1]);cyl([x,1.37,.9],.15,.018,wood);
    box([x+.27,1.38,.97],[.012,.013,.30],wood);box([x+.31,1.38,.97],[.012,.013,.30],wood);cyl([x-.3,1.44,.64],.06,.16,ceramic);
    pipe([[x,3.0,.95],[x,2.65,.95]],.016);mesh(new THREE.ConeGeometry(.19,.19,16,1,true),orange,[x,2.59,.95]);cyl([x,2.5,.95],.12,.035,warm);
  }
  for(let x=-17;x<-9;x+=.36){cyl([x,1.68,-.72],.065,.35,x%1>.5?orange:cream)}
  for(let x=-17;x<-9;x+=1.0){box([x,2.7,1.77],[.67,.5,.028],orange);city.label('麺',x,2.7,1.80,.30,.33,'#f6d3a2');}
  // Corner order hatch, visible from the walkable street.
  box([-7.60,1.0,1.42],[.75,1.35,1.08],wood);box([-7.5,1.72,1.44],[1,.09,1.25],chrome);
  const orderBowl=mesh(new THREE.SphereGeometry(.24,20,10,0,Math.PI*2,0,Math.PI/2),ceramic,[-7.36,1.80,1.56],[1,-.6,1],[0,0,0],false);orderBowl.visible=true;
  const brothTop=mesh(new THREE.CylinderGeometry(.21,.21,.012,24),orange,[-7.36,1.80,1.56],[1,1,1],[0,0,0],false);brothTop.visible=true;
  cyl([-7.27,1.80,2.0],.11,.04,chrome);
  // Repair shop interior and articulated display arm.
  box([13,.30,-3.3],[9.6,.10,3.0],black);box([13,1.6,-4.7],[9.6,2.65,.08],steel);
  box([13,1.05,-2.75],[7.9,.13,1.5],chrome);for(const x of [9.3,16.7])box([x,.64,-2.75],[.12,.83,1.35],steel);
  for(let x=9.1;x<17;x+=.48){box([x,2.0,-4.62],[.18,.36,.15],cream);pipe([[x,2.4,-4.55],[x,1.9,-4.35]],.022,black)}
  for(const x of [10.2,15.8]){box([x,1.6,-3.4],[1.2,.8,.12],black,true);screen(1.06,.64,[x,1.6,-3.32],(ctx,c,t)=>{base(ctx,c);text(ctx,'SEKAI / DIAGNOSTICS',25,45,30);for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#72bca7':'#a9ded5';ctx.beginPath();for(let xx=25;xx<c.width-25;xx+=4){const yy=100+i*70+Math.sin(xx*.04+t*3+i)*20;xx===25?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke()}})}
  for(const x of [8.15,11.9,15.6,17.85])box([x,1.6,-1.62],[.09,2.6,.14],chrome);
  box([13,2.65,-1.60],[9.7,.09,.13],steel);box([13,.35,-1.61],[9.7,.12,.18],steel);
  for(const x of [13.8,16.1]){cyl([x,.34,-1.25],.44,.12,steel);cyl([x,.41,-1.25],.40,.018,chrome);box([x,2.57,-1.13],[.65,.045,.27],warm);}
  for(let i=0;i<5;i++){const x=12.7+i*.42;pipe([[x,2.55,-2.75],[x,2.1,-2.72]],.018);mesh(new THREE.CapsuleGeometry(.06,.27,4,8),cream,[x,1.94,-2.72]);mesh(new THREE.SphereGeometry(.065,8,6),chrome,[x,1.73,-2.72]);}
  city.light(0xf3d3a0,14,14,2.25,-.55,8);city.light(0x58dedb,12,16.5,2.2,-1.25,7);
  // A street-facing calibration bench has a working three-joint service manipulator.
  box([9.15,.91,-.42],[1.8,.14,1.25],chrome);for(const x of [8.4,9.9])box([x,.54,-.42],[.09,.73,1.1],steel);
  let workPhase=0;const armRoot=new THREE.Group();armRoot.position.set(9.15,1.02,-.40);scene.add(armRoot);
  const elbow=new THREE.Group();elbow.position.y=.65;const wrist=new THREE.Group();wrist.position.y=.53;
  const armPart=(parent,g,m,p,rot=[0,0,0])=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...rot);o.castShadow=true;parent.add(o);return o};
  armPart(armRoot,new THREE.CylinderGeometry(.20,.24,.12,24),steel,[0,0,0]);
  armPart(armRoot,new THREE.CylinderGeometry(.11,.11,.32,20),chrome,[0,.12,0],[0,0,Math.PI/2]);
  armPart(armRoot,new THREE.BoxGeometry(.18,.52,.18),cream,[0,.38,0]);armRoot.add(elbow);
  armPart(elbow,new THREE.CylinderGeometry(.13,.13,.29,20),steel,[0,0,0],[0,0,Math.PI/2]);
  armPart(elbow,new THREE.BoxGeometry(.14,.49,.14),cream,[0,.28,0]);elbow.add(wrist);
  armPart(wrist,new THREE.SphereGeometry(.10,12,8),chrome,[0,0,0]);
  for(const side of [-1,1]){armPart(wrist,new THREE.BoxGeometry(.045,.19,.07),steel,[side*.08,.14,0]);armPart(wrist,new THREE.BoxGeometry(.08,.035,.08),chrome,[side*.06,.25,0]);}
  const calibrationLamp=armPart(wrist,new THREE.SphereGeometry(.035,8,6),cyan,[0,.12,.08]);
  screen(1.08,.58,[8.23,1.35,-.02],(ctx,c,t)=>{base(ctx,c);text(ctx,'SEKAI / ARM 03',30,75,47);text(ctx,['OPTICAL ALIGNMENT','SERVO TEST','JOINT INSPECTION'][workPhase],30,180,36,'#63e6de');ctx.fillStyle='#63b6b4';ctx.fillRect(30,240,80+(t%18)/18*580,15)});
  city.label('SEKAI / CYBERNETIC REPAIR',13,2.84,-.53,7.8,.38,'#bbdfd9');
  city.light(0x6fe6dc,45,11.5,2.55,-.6,9);city.light(0xffc17e,28,-13,2.3,.7,10);
  // Tangible street devices, sized for a person to actually use.
  box([6.15,1.28,3.5],[1.25,2.5,.86],orange,true);box([6.15,1.56,3.947],[1.04,1.57,.035],black);
  for(let r=0;r<3;r++)for(let k=0;k<4;k++){cyl([5.78+k*.245,1.10+r*.38,3.99],.077,.27,[pink,cyan,warm][r]);cyl([5.78+k*.245,1.255+r*.38,3.99],.071,.023,chrome);}
  box([6.15,.45,3.967],[.84,.26,.06],black);box([6.15,.295,4.05],[.9,.025,.23],chrome);
  screen(1.02,.27,[6.15,2.37,3.95],(ctx,c,t)=>{base(ctx,c,'#211205');text(ctx,Math.floor(t/12)%2?'KOMA / COLD DRINKS':'LYCHEE  /  YUZU',22,130,55,'#ffda90')});
  box([6.1,1.40,7.0],[1.12,2.35,.65],steel,true);box([6.1,.3,7],[1.45,.20,.90],black);
  const terminalScreen=screen(.93,1.19,[6.1,1.75,7.34],(ctx,c,t)=>{base(ctx,c);text(ctx,'市民 GRID',42,100,65);text(ctx,'DISTRICT 09',45,155,35);ctx.strokeStyle='#286169';ctx.lineWidth=5;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(70+i*112,235);ctx.lineTo(70+i*112,700);ctx.stroke();ctx.beginPath();ctx.moveTo(70,235+i*90);ctx.lineTo(630,235+i*90);ctx.stroke()}ctx.strokeStyle='#66ede5';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(400,675);ctx.lineTo(400,450);ctx.lineTo(180,450);ctx.lineTo(180,290);ctx.stroke();ctx.fillStyle='#e8e3a5';ctx.beginPath();ctx.arc(400,675,14+Math.sin(t*3)*3,0,7);ctx.fill();text(ctx,'K7 / NIGHT SERVICE',45,820,34);scanlines(ctx,c,t)});
  box([6.1,.81,7.35],[.66,.30,.04],black);box([6.1,.81,7.38],[.12,.13,.03],cyan);
  const antenna=mesh(new THREE.TorusGeometry(.40,.025,6,48),cyan,[6.1,2.92,7],[1,1,1],[Math.PI/2,0,0],false);
  const powerLight=new THREE.PointLight(0x57c6e0,35,12,2);powerLight.position.set(5.8,3.1,6);scene.add(powerLight);
  // Deep utility assemblies make the street facades read as inhabited machinery.
  const enamel=mat(0x68736a,.55,.54),copper=mat(0x5f4640,.72,.41);
  for(const [x,y,z]of[[-17.0,5.3,2.5],[-10.2,5.1,2.5],[-10.4,8.3,2.5],[-17.0,11.5,2.5],[10.7,5.3,-.8],[17.2,5.2,-.8],[10.8,8.4,-.8],[17.2,11.4,-.8]]){
    box([x,y,z],[.92,.72,.54],enamel,true);box([x,y,z+.28],[.85,.65,.04],steel);mesh(new THREE.TorusGeometry(.255,.025,8,24),chrome,[x-.1,y,z+.315]);mesh(new THREE.CircleGeometry(.235,24),black,[x-.1,y,z+.319]);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(cube,chrome,[x-.1+Math.sin(a)*.10,y+Math.cos(a)*.10,z+.325],[.07,.31,.018],[0,0,-a]);}
    for(let j=0;j<7;j++)box([x+.32,y-.25+j*.08,z+.335],[.15,.018,.023],chrome);
    for(const s of [-1,1]){box([x+s*.39,y-.4,z-.05],[.08,.12,.85],steel);pipe([[x+s*.38,y-.32,z-.1],[x+s*.38,y-.7,z-.3]],.025);}
    pipe([[x+.48,y-.1,z],[x+.65,y-.1,z],[x+.70,y-.3,z-.10],[x+.70,y-1.2,z-.35]],.045,copper);
  }
  for(const [x,z,side]of[[-18.1,2.35,1],[-9.45,2.35,-1],[17.8,-.75,-1]]){
    pipe([[x,.35,z],[x,8.6,z],[x+side*.5,9.1,z],[x+side*1.4,9.1,z],[x+side*1.9,9.6,z],[x+side*1.9,18.6,z-.2]],.105,copper);
    for(let y=1;y<9;y+=1.3){mesh(new THREE.TorusGeometry(.12,.025,6,12),steel,[x,y,z],[1,1,1],[Math.PI/2,0,0]);box([x,y,z-.13],[.36,.08,.32],steel);}
  }
  // Layered wayfinding and smaller screens carry the cyberpunk language down to human scale.
  city.label('NIGHT CLINIC / 03F',-7.65,5.0,-4.8,3.4,.55,'#8bc7bb',Math.PI/2);
  city.label('NEURAL / REPAIR',7.66,4.8,-5.8,3.4,.55,'#9cbccb',-Math.PI/2);
  city.label('NO VACANCY',-7.6,9.5,-8.1,2.0,.6,'#cf778a',Math.PI/2);
  for(let i=0;i<6;i++){const x=-16.65+i*.85;box([x,2.3,.95],[.65,.54,.025],cream);city.label(['01 / SHOYU','02 / MISO','03 / SHIO','04 / BROTH','05 / RICE','06 / TEA'][i],x,2.3,.973,.60,.43,'#3c251b',0,'#c9b48b');}
  for(const [x,y,z]of[[-10.6,1.83,1.84],[11.2,1.94,-1.40],[15.7,1.63,-1.32]])screen(.78,.52,[x,y,z],(ctx,c,t)=>{base(ctx,c,'#122424');text(ctx,'LIVE / 09',24,70,52);text(ctx,Math.sin(t*.5)>0?'SYSTEM READY':'AFTER HOURS',24,190,45,'#edb878');ctx.strokeStyle='#57d2c0';ctx.lineWidth=6;ctx.beginPath();for(let xx=25;xx<730;xx+=8){const yy=290+Math.sin(xx*.06+t*2)*25;xx===25?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy)}ctx.stroke();});
  // Freight and kitchen supplies have seams, straps, latches and legible shipping labels.
  const carton=mat(0x776047,.1,.84),strap=mat(0x262a28,.3,.48);
  for(const [x,z]of[[-17.5,3.1],[16.7,1.1]])for(let i=0;i<3;i++){const y=.58+i*.48,xx=x+(i%2)*.15;box([xx,y,z],[.74,.45,.62],i===1?steel:carton,true);box([xx,y+.23,z],[.75,.025,.08],strap);box([xx,y,z+.317],[.08,.44,.014],strap);for(const s of [-1,1])box([xx+s*.28,y,z+.326],[.04,.11,.016],chrome);city.label(i===1?'COLD / 09':'KAWASE',xx,y+.035,z+.335,.42,.13,'#baaa81');}
  // Bridge underside: longitudinal steel beams, cross braces and cable trays.
  for(const x of [-7.1,7.1])box([x,15.5,-23],[.30,.65,4.2],steel);
  for(let x=-7;x<8;x+=2){box([x,15.50,-21.3],[.13,.6,3.5],steel);pipe([[x,15.45,-21.2],[x+1.8,15.05,-24.7]],.045);}
  box([0,15.27,-21.02],[15,.20,.24],steel);for(const x of [-5,0,5])box([x,15.13,-21.0],[1.3,.035,.11],cyan);
  // Physical steelwork breaks the repeated rectangular facade silhouettes.
  for(const side of [-1,1]){const x=side<0?-18.4:18.3,z=side<0?2.15:-1.30;for(let y=3.7;y<12;y+=2.5){box([x,y,z],[.7,.13,1.35],steel);for(const d of [-.45,.45])pipe([[x+d,y,z+.54],[x+d,y+2.3,z+.54]],.025);for(let j=0;j<8;j++)box([x,y+j*.28,z+.55],[.7,.035,.08],chrome)}pipe([[x,0,z],[x,13.5,z],[x+.4,13.9,z-.4]],.12)}
  for(const [m,gs]of staticParts){const geometry=mergeGeometries(gs,false),o=new THREE.Mesh(geometry,m);o.castShadow=true;o.receiveShadow=true;scene.add(o);gs.forEach(g=>g.dispose())}
  let lastDraw=-1;
  return {
    setDepthPass(hidden){for(const h of holograms)h.group.visible=!hidden},
    ready:Promise.all([adImage.decode(),novaImage.decode()]),
    obstacles:[{minX:5.35,maxX:6.8,minZ:2.7,maxZ:4.2},{minX:5.35,maxX:6.8,minZ:6.4,maxZ:7.6}],
    get state(){return {workPhase,armAngles:[armRoot.rotation.y,elbow.rotation.z,wrist.rotation.z],hologramCount:holograms.length,hologramTime:holograms[0]?.phase}},
    update(t,dt){
      time=t;workPhase=Math.floor(t/18)%3;
      for(const h of holograms)h.update(t);
      // The technician's bench continuously inspects, aligns, and tests a joint.
      const pace=workPhase===1?.8:.24;
      armRoot.rotation.y=THREE.MathUtils.damp(armRoot.rotation.y,Math.sin(t*pace)*.32,3,dt);
      elbow.rotation.z=THREE.MathUtils.damp(elbow.rotation.z,-.68+Math.sin(t*pace+.8)*.22,3,dt);
      wrist.rotation.z=THREE.MathUtils.damp(wrist.rotation.z,.18+Math.sin(t*pace*1.3)*.26,3,dt);
      calibrationLamp.material.emissiveIntensity=1.8+Math.sin(t*2)*.3;
      antenna.rotation.z=t*.12;
      if(t-lastDraw>.14){for(const s of animated){s.draw(s.ctx,s.canvas,t);s.texture.needsUpdate=true}lastDraw=t}
    }
  };
}
