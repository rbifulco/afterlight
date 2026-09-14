import * as THREE from 'three';

// Transparent light fields: black artwork pixels emit no light, so the building
// remains visible through the image. The emitter hardware is built separately.
export function createHolographicScreen(width,height,texture,color) {
  const group=new THREE.Group();
  const tint=new THREE.Color(color);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{map:{value:texture},time:{value:0},tint:{value:tint},gain:{value:.88},height:{value:height}},
    vertexShader:`
      uniform float time;uniform float height;varying vec2 vUv;
      void main(){vUv=uv;vec3 p=position;
        // A shallow curved field, with a restrained traveling registration error.
        p.z+=.17*(1.-pow(uv.x*2.-1.,2.));
        float band=exp(-pow((uv.y-fract(time*.075))/.018,2.));
        p.x+=sin(time*7.+uv.y*24.)*.018+band*sin(time*13.)*.035;
        p.y+=sin(time*.8)*.035;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`
      uniform sampler2D map;uniform float time;uniform vec3 tint;uniform float gain;uniform float height;varying vec2 vUv;
      void main(){
        vec2 uv=vUv;float sweep=fract(time*.115);
        float band=exp(-pow((uv.y-sweep)/.012,2.));
        uv.x+=band*sin(time*4.)*.004;
        vec3 art=texture2D(map,uv).rgb;
        float luma=dot(art,vec3(.2126,.7152,.0722));
        float lines=.57+.43*smoothstep(-.5,.7,sin(uv.y*height*145.-time*3.));
        float grid=.92+.08*sin(uv.x*1100.);
        float edges=smoothstep(0.,.018,uv.x)*smoothstep(0.,.018,1.-uv.x)*smoothstep(0.,.014,uv.y)*smoothstep(0.,.025,1.-uv.y);
        float pulse=.96+.04*sin(time*2.1);
        float edgeLine=(1.-smoothstep(.001,.004,min(uv.x,1.-uv.x)))*.19;
        vec3 light=mix(art,vec3(luma)*tint, .80)*2.15;
        light+=tint*(band*.30+edgeLine);
        float alpha=clamp(pow(luma,.65)*1.2+band*.045+edgeLine,0.,.86)*lines*grid*edges*gain*pulse;
        if(alpha<.004)discard;
        gl_FragColor=vec4(light,alpha);
      }`
  });
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(width,height,32,48),material);
  surface.castShadow=false;surface.receiveShadow=false;group.add(surface);
  // Low-energy displaced echo gives the projected surface depth when orbiting.
  const echoMaterial=material.clone();echoMaterial.uniforms.map.value=texture;echoMaterial.uniforms.tint.value=tint;echoMaterial.uniforms.gain.value=.13;
  const echo=new THREE.Mesh(surface.geometry,echoMaterial);echo.position.set(.027,0,-.16);group.add(echo);
  const beamMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{tint:{value:tint},time:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 tint;uniform float time;varying vec2 vUv;void main(){float rays=.5+.5*pow(abs(sin(vUv.x*70.+time*.1)),12.);float alpha=pow(1.-vUv.y,1.6)*.055*rays;gl_FragColor=vec4(tint*1.4,alpha);}`});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(width*.53,.14,height*.96,32,1,true),beamMaterial);beam.scale.z=.12;beam.position.set(0,-height*.02,-.03);group.add(beam);
  const lineMaterial=new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity:.60,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const sweepLine=new THREE.Mesh(new THREE.PlaneGeometry(width*.98,.012),lineMaterial);sweepLine.position.z=.20;group.add(sweepLine);
  const floorLine=new THREE.Mesh(new THREE.PlaneGeometry(width*.95,.025),lineMaterial);floorLine.position.set(0,-height/2+.02,.12);group.add(floorLine);
  return {group,update(time){material.uniforms.time.value=time;echoMaterial.uniforms.time.value=time;beamMaterial.uniforms.time.value=time;lineMaterial.color.copy(tint);sweepLine.position.y=((time*.115)%1-.5)*height;sweepLine.material.opacity=.32+.18*Math.sin(time*.7);},get phase(){return material.uniforms.time.value;}};
}
