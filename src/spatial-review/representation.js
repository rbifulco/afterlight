import * as THREE from 'three';

// Only use on capture-owned objects. The SDK exports raw geometry, not skinning.
export function bakePosedMeshes(root) {
  root.updateMatrixWorld(true);
  const skins = [];
  root.traverse(object => { if (object.isSkinnedMesh) skins.push(object); });
  for (const skin of skins) {
    skin.skeleton.update();
    const geometry = skin.geometry.clone();
    const positions = geometry.getAttribute('position');
    const point = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      skin.getVertexPosition(i, point);
      positions.setXYZ(i, point.x, point.y, point.z);
    }
    geometry.deleteAttribute('skinIndex');
    geometry.deleteAttribute('skinWeight');
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, skin.material);
    mesh.name = skin.name;
    mesh.position.copy(skin.position);
    mesh.quaternion.copy(skin.quaternion);
    mesh.scale.copy(skin.scale);
    mesh.visible = skin.visible;
    mesh.matrixAutoUpdate = skin.matrixAutoUpdate;
    mesh.matrix.copy(skin.matrix);
    const parent = skin.parent;
    const index = parent.children.indexOf(skin);
    if (skin.children.length) mesh.add(...skin.children);
    parent.remove(skin);
    parent.add(mesh);
    parent.children.splice(parent.children.indexOf(mesh), 1);
    parent.children.splice(index, 0, mesh);
  }
  root.updateMatrixWorld(true);
}

export function prepareMaterials(root) {
  const replacements = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const convert = material => {
      if (!material.isShaderMaterial) return material;
      if (!replacements.has(material)) {
        replacements.set(material, new THREE.MeshBasicMaterial({
          name: 'Hologram artwork (static approximation)',
          map: material.uniforms.map?.value ?? null,
          color: material.uniforms.tint?.value ?? 0xffffff,
          transparent: true, opacity: 0.75, side: THREE.DoubleSide,
        }));
      }
      return replacements.get(material);
    };
    object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
  });
}

// The source animates cups/chopsticks by writing matrices directly. The SDK's
// child-node format uses position/quaternion/scale, so expose the same local pose.
export function exposeMatrixTransforms(root) {
  root.traverse(object => {
    if (!object.matrixAutoUpdate) {
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      object.matrixAutoUpdate = true;
    }
  });
  root.updateMatrixWorld(true);
}

export const vehicleSubjects = [
  ['taxi', 'Parked taxi'], ['service-van', 'Service van'],
  ['parked-sedan', 'Parked burgundy sedan'], ['west-scooter', 'West delivery scooter'],
  ['noodle-bar-scooter', 'Noodle bar scooter'], ['east-scooter', 'East delivery scooter'],
  ['passing-sedan', 'Passing sedan'],
];
