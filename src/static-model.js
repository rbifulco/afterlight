import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Batch a rigid model in root space without changing its visible surfaces. */
export function batchStaticModel(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map();
  root.traverse(object => {
    if (!object.isMesh || object.isSkinnedMesh || Array.isArray(object.material) || object.material.transparent) return;
    const key = object.material;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(object);
  });
  for (const [material, objects] of groups) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => object.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld)));
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(item => item.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = objects.some(object => object.castShadow);
    mesh.receiveShadow = objects.some(object => object.receiveShadow);
    objects.forEach(object => object.removeFromParent());
    root.add(mesh);
  }
}
