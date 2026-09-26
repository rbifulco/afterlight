import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SceneAssetRegistry, normalizeSpatialReviewDiscovery, createSpatialReviewEditorAuthorization, spatialReviewEditorOriginAllowed } from '@alterno-dev/spatial-review';
import { buildPeople } from '../src/people.js';
import { bakePosedMeshes, exposeMatrixTransforms, prepareMaterials, vehicleSubjects } from '../src/spatial-review/representation.js';
import worker from '../worker/index.js';

test('Resident capture bakes the actual posed GLB vertices and retains stable actor identities', async () => {
  const models = await Promise.all(['resident', 'resident-coat', 'resident-apron'].map(async name => {
    const data = await readFile(new URL(`../public/assets/${name}.glb`, import.meta.url));
    return new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  }));
  const root = new THREE.Group();
  const people = buildPeople(root, { jacket: models[0].scene, coat: models[1].scene, apron: models[2].scene });
  root.updateMatrixWorld(true);
  const expected = new Map();
  root.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    expected.set(mesh.name, mesh.getVertexPosition(17, new THREE.Vector3()).clone());
  });
  // Check each resident separately: model node names intentionally repeat.
  for (const actor of people.reviewActors) {
    const vertices = [];
    actor.rig.traverse(mesh => {
      if (mesh.isSkinnedMesh) vertices.push([mesh.name, mesh.getVertexPosition(17, new THREE.Vector3()).clone()]);
    });
    bakePosedMeshes(actor.rig);
    for (const [name, point] of vertices) {
      const mesh = actor.rig.getObjectByName(name);
      assert.equal(mesh.isSkinnedMesh, undefined);
      assert.ok(new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, 17).distanceTo(point) < 1e-5);
    }
  }
  assert.ok(expected.size > 0);
  const props = root.children.filter(object => !object.matrixAutoUpdate);
  assert.ok(props.length > 0, 'resident tableware is driven by matrices');
  const matrices = props.map(object => object.matrix.clone());
  exposeMatrixTransforms(root);
  props.forEach((object, index) => {
    assert.ok(object.position.length() > 1, 'tableware must not collapse to world origin');
    object.matrix.elements.forEach((value, element) => assert.ok(Math.abs(value - matrices[index].elements[element]) < 1e-5));
  });
  assert.equal(people.reviewActors.length, 8);
  const registry = new SceneAssetRegistry('test-build');
  for (const actor of people.reviewActors) registry.register({ actorId: actor.id, assetId: actor.id, root: actor.rig, name: actor.id, sourceRef: `src/people.js#${actor.id}`, category: 'Residents' });
  const first = registry.toScene();
  assert.equal(first.actors.length, 8);
  assert.deepEqual(registry.toScene(), first);
  const detail = registry.toAsset('tea regular', 'review');
  assert.ok(detail.geometries.length > 0);
  assert.equal(detail.sourceRef, 'src/people.js#tea regular');
});

test('Hologram approximation preserves the artwork texture and ordinary material', () => {
  const texture = new THREE.Texture();
  const original = new THREE.ShaderMaterial({ uniforms: { map: { value: texture }, tint: { value: new THREE.Color(0x65e9f4) } } });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), original);
  prepareMaterials(mesh);
  assert.equal(mesh.material.map, texture);
  assert.equal(original.isShaderMaterial, true);
  assert.equal(mesh.material.isMeshBasicMaterial, true);
  assert.equal(new Set(vehicleSubjects.map(([id]) => id)).size, 7);
});

test('Static discovery resolves locally and authorizes only the official editor and same origin', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/.well-known/spatial-review.json', import.meta.url)));
  const discovery = normalizeSpatialReviewDiscovery(manifest, 'http://localhost:4173/.well-known/spatial-review.json');
  assert.equal(discovery.websiteUrl, 'http://localhost:4173/');
  assert.equal(discovery.liveCapture, 'http://localhost:4173/spatial-review.html');
  const authorization = createSpatialReviewEditorAuthorization({ allowOfficialEditor: true, allowLoopbackPeers: false });
  for (const origin of discovery.capabilities.liveCapture.editorOriginPolicy.origins) assert.ok(spatialReviewEditorOriginAllowed(authorization, new URL(discovery.websiteUrl).origin, origin));
  assert.equal(spatialReviewEditorOriginAllowed(authorization, 'http://localhost:4173', 'https://untrusted.example'), false);
  assert.equal(spatialReviewEditorOriginAllowed(authorization, 'http://localhost:4173', 'http://localhost:9999'), false);
  const env = { ASSETS: { fetch: () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }) } };
  const response = await worker.fetch(new Request('https://afterlight.example/.well-known/spatial-review.json'), env);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://spatial-review.alterno.dev');
  const ordinary = await worker.fetch(new Request('https://afterlight.example/'), env);
  assert.equal(ordinary.headers.get('Access-Control-Allow-Origin'), null);
});
