import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigation } from '../src/navigation.js';
const blocks=[{minX:-6.100,maxX:-.622,minZ:-.168,maxZ:6.913},{minX:2.064,maxX:6.154,minZ:-14.749,maxZ:-8.433},{minX:5.35,maxX:6.8,minZ:2.7,maxZ:4.2},{minX:5.35,maxX:6.8,minZ:6.4,maxZ:7.6}];
const nav=createNavigation(blocks);
function verify(from,to){const route=nav.path(from,to);assert.ok(route?.length,'Destination must be reachable');assert.deepEqual(route.at(-1),to);let p=from;for(const q of route){const n=Math.ceil(Math.hypot(q.x-p.x,q.z-p.z)/.025);for(let i=1;i<=n;i++)assert.ok(nav.clear(p.x+(q.x-p.x)*i/n,p.z+(q.z-p.z)*i/n),JSON.stringify({from,to,p,q,i,n}));p=q;}return route;}
test('Walk around a parked taxi rather than through its body',()=>{const route=verify({x:-4,z:8},{x:-4,z:-5});assert.ok(route.length>1);});
test('Clear destinations remain connected around street equipment',()=>{const points=[{x:0,z:5},{x:.45,z:3.3},{x:4.85,z:5},{x:4.85,z:7.3},{x:-6.1,z:-.65},{x:6.2,z:.3}];for(const a of points)for(const b of points)verify(a,b);});
test('Reject car interiors and destinations outside the street',()=>{for(const p of [{x:-4,z:0},{x:4,z:-10},{x:9,z:2},{x:0,z:-30}])assert.equal(nav.path({x:0,z:5},p),null);});
