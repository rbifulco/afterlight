import { assetUrl } from '../asset-url.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SceneAssetRegistry, attachSceneAssetRegistryBridge, createSpatialReviewEditorAuthorization } from '@alterno-dev/spatial-review';
import { buildCity } from '../city.js';
import { buildVehicles } from '../vehicles.js';
import { buildPeople } from '../people.js';
import { buildStreetLife } from '../street-life.js';
import { batchStaticModel } from '../static-model.js';
import { bakePosedMeshes, exposeMatrixTransforms, prepareMaterials, vehicleSubjects } from './representation.js';

const status = document.querySelector('#status');
const scene = new THREE.Scene();
const registry = new SceneAssetRegistry(__AFTERLIGHT_REVIEW_BUILD__);
let detach;
function dispose() {
  detach?.();
  detach = undefined;
  const resources = new Set();
  scene.traverse(object => {
    if (object.geometry) resources.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      resources.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    }
  });
  for (const resource of resources) resource.dispose();
  scene.clear();
}
addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);

function register(id, name, root, sourceRef, category) {
  root.name ||= name;
  registry.register({ actorId: id, assetId: id, name, root, sourceRef, category });
}

try {
  // Wait for TextureLoader work started synchronously by the original builders.
  const manager = THREE.DefaultLoadingManager;
  const loaded = new Promise((resolve, reject) => {
    manager.onLoad = resolve;
    manager.onError = url => reject(new Error(`Asset failed to load: ${url}`));
  });
  // Attach the rejection handler immediately while other models are loading.
  loaded.catch(() => {});
  const cityRoot = new THREE.Group(); scene.add(cityRoot);
  const city = buildCity(cityRoot);
  const vehicles = await buildVehicles(scene);
  const streetRoot = new THREE.Group(); scene.add(streetRoot);
  const streetLife = buildStreetLife(streetRoot, city, vehicles);
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  const [courier, jacket, coat, apron, android, cloth, asphalt] = await Promise.all([
    ...['courier', 'resident', 'resident-coat', 'resident-apron', 'service-android'].map(name => loader.loadAsync(assetUrl(`${name}.glb`))),
    textureLoader.loadAsync(assetUrl('coat-fabric.png')), textureLoader.loadAsync(assetUrl('asphalt.png')),
  ]);
  await Promise.all([loaded, streetLife.ready]);
  cloth.colorSpace = asphalt.colorSpace = THREE.SRGBColorSpace;
  cloth.anisotropy = 4;
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
  scene.traverse(object => {
    if (object.material?.isMeshStandardMaterial && object.material.roughness > .6 && !object.material.map) {
      object.material.bumpMap = asphalt; object.material.bumpScale = .035;
    }
  });
  for (const model of [courier, jacket, coat, apron]) model.scene.traverse(object => {
    if (object.isMesh && object.material.name.startsWith('Waxed petrol cotton')) {
      object.material.map = cloth; object.material.bumpMap = cloth;
      object.material.bumpScale = model === courier ? .007 : .004;
      object.material.color.setHex(model === courier ? 0xb6c8c2 : 0xaeb9b7);
    }
  });
  const character = new THREE.Group(); character.add(courier.scene);
  character.scale.setScalar(1.15); character.position.set(0, .03, 5); character.rotation.y = Math.PI;
  scene.add(character);
  const peopleRoot = new THREE.Group(); scene.add(peopleRoot);
  const people = buildPeople(peopleRoot, { jacket: jacket.scene, coat: coat.scene, apron: apron.scene });
  const serviceAndroid = android.scene;
  serviceAndroid.position.set(13.8, .35, -1.25); serviceAndroid.scale.setScalar(1.25); serviceAndroid.rotation.y = .1;
  serviceAndroid.traverse(object => {
    if (object.isMesh && object.material.name === 'Porcelain alloy') {
      object.material.color.multiplyScalar(.45); object.material.roughness = .42;
    }
  });
  batchStaticModel(serviceAndroid); scene.add(serviceAndroid);
  // Fixed time: no render loop, audio, input handlers, random weather, or WebGL context.
  city.update(0); vehicles.update(0, 0); people.update(0, 0, character.position); streetLife.update(0, 0);
  bakePosedMeshes(scene); exposeMatrixTransforms(scene); prepareMaterials(scene);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({
    name: 'Wet asphalt (reflection approximation)', map: asphalt, color: 0x23313b, roughness: .35,
  }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, .006, -55); scene.add(road);
  register('district-context', 'District architecture and signs (batched context)', cityRoot, 'src/city.js#buildCity', 'City context');
  register('street-life-context', 'Shop interiors and street equipment (batched context)', streetRoot, 'src/street-life.js#buildStreetLife', 'City context');
  register('road', 'Wet street', road, 'src/main.js#street', 'City context');
  vehicles.reviewVehicles.forEach((root, index) => {
    const [id, name] = vehicleSubjects[index];
    register(id, name, root, `src/vehicles.js#${id === 'taxi' ? 'taxi' : id === 'service-van' ? 'serviceVan' : id === 'passing-sedan' ? 'movingCar' : 'buildVehicles'}`, 'Vehicles');
  });
  register('courier', 'Courier (initial pose)', character, 'src/main.js#character', 'Residents');
  for (const actor of people.reviewActors) {
    register(`resident-${actor.id.replaceAll(' ', '-')}`, actor.id, actor.rig, `src/people.js#${actor.id}`, 'Residents');
  }
  const props = new THREE.Group(); props.name = 'Resident umbrellas and tableware';
  for (const child of [...peopleRoot.children]) {
    if (!people.reviewActors.some(actor => actor.rig === child)) props.add(child);
  }
  scene.add(props);
  register('resident-props', 'Resident umbrellas and tableware', props, 'src/people.js#buildPeople', 'Residents');
  register('service-android', 'Service android', serviceAndroid, 'src/main.js#android', 'Residents');
  const authorization = createSpatialReviewEditorAuthorization({
    allowOfficialEditor: true, allowedOrigins: [], allowLoopbackPeers: false,
  });
  detach = attachSceneAssetRegistryBridge(registry, { authorization, maxGeometryBytes: 64 * 1024 * 1024 });
  status.textContent = `District 09 is ready for review (${registry.size} actors). Keep this page open during capture.`;
} catch (error) {
  dispose();
  status.textContent = `Capture could not be prepared: ${error.message}`;
  console.error(error);
}
