import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function loadSpaceship({ position=[0,0,0], scale=1 } = {}) {
    return new Promise((resolve) =>{
        loader.load('/models/low_poly_space_ship.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(...position);
            model.rotation.y = Math.PI;
            model.scale.setScalar(scale);
            model.traverse(child => {
              if (child.isMesh && child.material) {
                child.material.roughness = 0.01;
                child.material.metalness = 0.05;
                child.material.color.multiplyScalar(0.85);
                child.material.flatShading = false;
                child.material.needsUpdate = true;
            
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            resolve(model);
        });
    });
}