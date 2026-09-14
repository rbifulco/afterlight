// Small A* grid keeps the courier clear of vehicles and street hardware.
export function createNavigation(obstacles) {
  const step=.4,minX=-6.4,minZ=-18.6,width=33,height=84;
  const at=(x,z)=>({x:minX+x*step,z:minZ+z*step});
  const clear=(x,z)=>Math.abs(x)<6.65&&z>-19&&z<15&&!obstacles.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);
  function lineClear(a,b){
    return !obstacles.some(box=>{
      let enter=0,exit=1;
      for(const [axis,lo,hi]of [['x',box.minX-.012,box.maxX+.012],['z',box.minZ-.012,box.maxZ+.012]]){
        const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-10){if(a[axis]<=lo||a[axis]>=hi)return false;continue;}
        let t1=(lo-a[axis])/delta,t2=(hi-a[axis])/delta;if(t1>t2)[t1,t2]=[t2,t1];enter=Math.max(enter,t1);exit=Math.min(exit,t2);if(enter>=exit)return false;
      }
      return enter<exit;
    });
  }
  function path(from,to){
    if(!clear(to.x,to.z))return null;
    const snap=p=>({x:Math.max(0,Math.min(width-1,Math.round((p.x-minX)/step))),z:Math.max(0,Math.min(height-1,Math.round((p.z-minZ)/step)))});
    const start=snap(from),end=snap(to),key=p=>p.z*width+p.x,startKey=key(start),endKey=key(end);
    const open=[{...start,g:0,f:0}],seen=new Map([[startKey,{g:0,parent:null}]]),closed=new Set();
    while(open.length){open.sort((a,b)=>b.f-a.f);const current=open.pop(),ck=key(current);if(closed.has(ck))continue;
      if(ck===endKey){const route=[{x:to.x,z:to.z}];let k=ck;while(k!==startKey){route.push(at(k%width,Math.floor(k/width)));k=seen.get(k).parent}route.reverse();const result=[];let anchor=from,i=0;while(i<route.length){let far=i;for(let j=i+1;j<route.length;j++){if(!lineClear(anchor,route[j]))break;far=j}result.push(route[far]);anchor=route[far];i=far+1}return result}
      closed.add(ck);
      for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const n={x:current.x+dx,z:current.z+dz};if(n.x<0||n.x>=width||n.z<0||n.z>=height)continue;const nk=key(n),p=at(n.x,n.z);if(closed.has(nk)||!clear(p.x,p.z))continue;
        if(dx&&dz){const a=at(current.x+dx,current.z),b=at(current.x,current.z+dz);if(!clear(a.x,a.z)||!clear(b.x,b.z))continue}
        const g=current.g+Math.hypot(dx,dz);if(g>=(seen.get(nk)?.g??Infinity))continue;seen.set(nk,{g,parent:ck});open.push({...n,g,f:g+Math.hypot(end.x-n.x,end.z-n.z)});
      }
    }
    return null;
  }
  return {clear,path};
}
