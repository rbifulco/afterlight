import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { batchStaticModel } from '../src/static-model.js';

function vertices(root) {
  root.updateMatrixWorld(true);
  const points=[];
  root.traverse(object=>{
    if(!object.isMesh)return;
    const attribute=object.geometry.attributes.position;
    for(let i=0;i<attribute.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(attribute,i).applyMatrix4(object.matrixWorld).toArray().map(n=>n.toFixed(4)).join(','));
  });
  return points.sort();
}

test('Rigid batching preserves nested world-space geometry and transparent surfaces',()=>{
  const root=new THREE.Group();root.position.set(4,2,-8);root.rotation.y=.7;root.scale.setScalar(1.2);
  const material=new THREE.MeshStandardMaterial();
  for(let i=0;i<3;i++){
    const group=new THREE.Group();group.position.set(i*2,.3,-i);group.rotation.z=i*.3;
    const part=new THREE.Mesh(new THREE.BoxGeometry(1,2,3),material);part.position.y=.9;part.castShadow=true;group.add(part);root.add(group);
  }
  const glass=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshPhysicalMaterial({transparent:true,opacity:.3}));root.add(glass);
  const before=vertices(root);batchStaticModel(root);
  assert.deepEqual(vertices(root),before);
  const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o)});
  assert.equal(meshes.length,2);assert.equal(glass.parent,root);
  assert.equal(meshes.find(o=>o!==glass).castShadow,true);
});

test('Skinned meshes retain their skeleton and hierarchy',()=>{
  const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  const bodies=[new THREE.SkinnedMesh(new THREE.BoxGeometry(),material),new THREE.SkinnedMesh(new THREE.BoxGeometry(),material)];
  root.add(...bodies);batchStaticModel(root);
  assert.deepEqual(root.children,bodies);
});
