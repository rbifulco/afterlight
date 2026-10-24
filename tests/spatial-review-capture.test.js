import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Canvas/image mocks validate scene construction and transport, not visual fidelity or image decoding.
test('Capture registers the complete fixed inventory and serves bounded progressive assets', async () => {
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const listeners=new Map(), messages=[];
const peer={postMessage:m=>messages.push(m)};
globalThis.window={location:{origin:'http://localhost:4173',href:'http://localhost:4173/spatial-review.html'},parent:peer,opener:null,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),setTimeout,clearTimeout};
globalThis.addEventListener=window.addEventListener;
globalThis.__AFTERLIGHT_REVIEW_BUILD__='smoke-test';
globalThis.ProgressEvent=class {constructor(type,values){Object.assign(this,values);this.type=type}};
const NativeRequest=Request;
globalThis.Request=class extends NativeRequest {constructor(url,options){super(new URL(url,'http://localhost:4173'),options)}};
globalThis.fetch=async request=>{const url=typeof request==='string'?request:request.url;const bytes=await readFile(root+'/public'+new URL(url,'http://localhost:4173').pathname);return new Response(bytes)};
class MockImage {
  handlers=new Map();width=1024;height=1024;naturalWidth=1024;naturalHeight=1024;complete=true;
  addEventListener(name,fn){this.handlers.set(name,fn)} removeEventListener(name){this.handlers.delete(name)}
  set src(value){this.url=value;queueMicrotask(()=>this.handlers.get('load')?.call(this))} get src(){return this.url}
  decode(){return Promise.resolve()}
}
globalThis.Image=MockImage;
const status={textContent:''};
const ctx=new Proxy({measureText:text=>({width:text.length*40})},{get:(target,key)=>target[key]??(()=>{})});
globalThis.document={querySelector:()=>status,createElement:()=>({width:1024,height:1024,getContext:()=>ctx}),createElementNS:()=>new MockImage()};
await import(root+'/src/spatial-review/capture.js');
assert.match(status.textContent, /ready for review \(21 actors\)/);

const send = data => listeners.get('message')({source:peer, origin:'https://spatial-review.alterno.dev', data});
send({type:'alterno:spatial-review:request',requestId:'catalog',profile:'scene',progressive:true,geometryTransfer:{capability:'geometry-transfer-v1',maxBytes:64*1024*1024}});
await new Promise(resolve=>setTimeout(resolve,20));
const catalog=messages.find(message=>message.requestId==='catalog');
assert.ok(catalog, 'capture bridge must answer the editor');
assert.equal(catalog.payload.scene.actors.length,21);
assert.ok(JSON.stringify(catalog.payload).length < 100000, 'progressive discovery must remain small');
for (const assetId of ['district-context','street-life-context','taxi','resident-tea-regular']) {
  send({type:'alterno:spatial-review:asset-request',requestId:assetId,buildId:'smoke-test',assetId,profile:'review'});
  await new Promise(resolve=>setTimeout(resolve,20));
  const result=messages.find(message=>message.requestId===assetId);
  assert.equal(result?.ok,true, `${assetId} must fit the negotiated transfer budget`);
  assert.ok(result.asset.geometries.length>0);
}
// 0.9.0 must carry the city's visible window RGB and UV texture evidence in
// both profiles, without globally enabling colors on unrelated materials.
for (const profile of ['scene', 'review']) {
  const requestId = `appearance-${profile}`;
  send({type:'alterno:spatial-review:asset-request',requestId,buildId:'smoke-test',assetId:'district-context',profile});
  await new Promise(resolve=>setTimeout(resolve,20));
  const asset=messages.find(message=>message.requestId===requestId)?.asset;
  assert.ok(asset.geometries.some(entry=>entry.geometry.colors?.length), `${profile} retains visible window RGB`);
  assert.ok(asset.geometries.some(entry=>entry.geometry.uvs?.length), `${profile} retains UVs`);
  assert.ok(asset.materials.some(material=>material.vertexColors), `${profile} retains the source color opt-in`);
  assert.ok(asset.materials.some(material=>material.maps?.length), `${profile} retains supported maps`);
}
listeners.get('message')({source:peer,origin:'https://untrusted.example',data:{type:'alterno:spatial-review:request',requestId:'denied'}});
assert.equal(messages.find(message=>message.requestId==='denied')?.type,'spatial-review:connection-rejected');
listeners.get('pagehide')({persisted:false});
assert.equal(listeners.has('message'),false);
});
